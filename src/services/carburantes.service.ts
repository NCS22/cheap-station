import {
  API_CARBURANTES_URL,
  CACHE_ESTACIONES_KEY,
  CACHE_TTL_MS,
  MAX_RESULTADOS,
  TIEMPO_ESPERA_RED_MS,
} from '../config/app.config';
import type {
  Estacion,
  PuntoBusqueda,
  RawEstacion,
  RespuestaCarburantes,
} from '../types';
import { distanciaKm, parseCoordenada, parsePrecio } from '../utils/geo.utils';

interface CacheEstaciones {
  fecha: number;
  estaciones: RawEstacion[];
  /** Fecha oficial del feed del Ministerio (RespuestaCarburantes.Fecha). */
  fechaOficial: string;
}

/** Estaciones junto a la fecha oficial del feed del Ministerio. */
export interface ResultadoEstaciones {
  estaciones: RawEstacion[];
  /** Fecha oficial tal cual la devuelve la API, sin reformatear. */
  fecha: string;
}

/**
 * Servicio de carburantes (Ministerio para la Transición Ecológica).
 * Descarga el listado oficial completo (~11.500 estaciones) y lo cachea
 * en localStorage 30 min: sin base de datos propia, precios siempre frescos.
 */

function leerCache(): ResultadoEstaciones | null {
  try {
    const crudo = localStorage.getItem(CACHE_ESTACIONES_KEY);
    if (!crudo) return null;
    const cache = JSON.parse(crudo) as Partial<CacheEstaciones>;
    if (Date.now() - (cache.fecha ?? 0) > CACHE_TTL_MS) return null;
    if (!Array.isArray(cache.estaciones) || cache.estaciones.length === 0)
      return null;
    // Las cachés antiguas no guardaban la fecha oficial: se descartan
    // para recargarla del feed en la próxima petición.
    if (
      typeof cache.fechaOficial !== 'string' ||
      cache.fechaOficial.length === 0
    )
      return null;
    return { estaciones: cache.estaciones, fecha: cache.fechaOficial };
  } catch {
    return null;
  }
}

function guardarCache(estaciones: RawEstacion[], fechaOficial: string): void {
  try {
    const cache: CacheEstaciones = {
      fecha: Date.now(),
      estaciones,
      fechaOficial,
    };
    localStorage.setItem(CACHE_ESTACIONES_KEY, JSON.stringify(cache));
  } catch {
    // localStorage lleno o no disponible: se sigue sin caché.
  }
}

export async function obtenerTodasLasEstaciones(): Promise<ResultadoEstaciones> {
  const cacheadas = leerCache();
  if (cacheadas) return cacheadas;

  // Descarga compartida: si ya hay una en vuelo, las llamadas concurrentes
  // (p. ej. pulsar Buscar dos veces seguidas) reutilizan la misma promesa
  // en vez de lanzar otra descarga de ~12 MB en paralelo.
  if (descargaEnVuelo) return descargaEnVuelo;
  descargaEnVuelo = descargarFeed();
  try {
    return await descargaEnVuelo;
  } finally {
    descargaEnVuelo = null;
  }
}

/** Descarga en vuelo del feed, o null si no hay ninguna en curso. */
let descargaEnVuelo: Promise<ResultadoEstaciones> | null = null;

/** Indica si el error es un timeout (`AbortSignal.timeout` aborta con `TimeoutError` en navegadores modernos y `AbortError` en otros). */
function esErrorTimeout(e: unknown): boolean {
  return e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError');
}

async function descargarFeed(): Promise<ResultadoEstaciones> {
  let respuesta: Response;
  try {
    respuesta = await fetch(API_CARBURANTES_URL, {
      signal: AbortSignal.timeout(TIEMPO_ESPERA_RED_MS),
    });
  } catch (e) {
    if (esErrorTimeout(e)) {
      throw new Error(
        'La descarga de precios tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
      );
    }
    throw new Error(
      'No se pudieron obtener los precios oficiales. Revisa tu conexión.',
    );
  }
  if (!respuesta.ok) {
    throw new Error(
      'El servicio oficial de precios no responde. Inténtalo en unos minutos.',
    );
  }
  let datos: RespuestaCarburantes;
  try {
    datos = (await respuesta.json()) as RespuestaCarburantes;
  } catch (e) {
    if (esErrorTimeout(e)) {
      throw new Error(
        'La descarga de precios tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
      );
    }
    throw new Error(
      'No se pudieron obtener los precios oficiales. Revisa tu conexión.',
    );
  }
  const lista = datos.ListaEESSPrecio ?? [];
  if (lista.length === 0) throw new Error('El servicio oficial no devolvió datos.');
  const fechaOficial = datos.Fecha ?? '';
  guardarCache(lista, fechaOficial);
  return { estaciones: lista, fecha: fechaOficial };
}

export interface BuscarParams {
  punto: PuntoBusqueda;
  campoPrecio: string;
  radioKm: number;
}

/**
 * Filtra por radio, calcula distancia y ordena de más barata a más cara.
 * Las estaciones sin precio para ese combustible quedan al final.
 */
export function buscarMasBaratas(
  todas: RawEstacion[],
  { punto, campoPrecio, radioKm }: BuscarParams,
): Estacion[] {
  const candidatas: Estacion[] = [];

  for (const raw of todas) {
    const latitud = parseCoordenada(raw.Latitud);
    const longitud = parseCoordenada(raw['Longitud (WGS84)']);
    if (latitud === null || longitud === null) continue;

    const distancia = distanciaKm(punto.latitud, punto.longitud, latitud, longitud);
    if (distancia > radioKm) continue;

    candidatas.push({
      id: raw.IDEESS,
      rotulo: raw.Rótulo || 'Gasolinera',
      direccion: raw.Dirección || '',
      codigoPostal: raw['C.P.'] || '',
      localidad: raw.Localidad || raw.Municipio || '',
      municipio: raw.Municipio || '',
      provincia: raw.Provincia || '',
      horario: raw.Horario || '',
      latitud,
      longitud,
      precio: parsePrecio(raw[campoPrecio]),
      distanciaKm: distancia,
    });
  }

  candidatas.sort((a, b) => {
    if (a.precio === null && b.precio === null)
      return (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0);
    if (a.precio === null) return 1;
    if (b.precio === null) return -1;
    if (a.precio !== b.precio) return a.precio - b.precio;
    return (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0);
  });

  return candidatas.slice(0, MAX_RESULTADOS);
}

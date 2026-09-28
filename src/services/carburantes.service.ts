import {
  API_CARBURANTES_URL,
  CACHE_ESTACIONES_KEY,
  CACHE_TTL_MS,
  MAX_RESULTADOS,
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
}

/**
 * Servicio de carburantes (Ministerio para la Transición Ecológica).
 * Descarga el listado oficial completo (~11.500 estaciones) y lo cachea
 * en localStorage 30 min: sin base de datos propia, precios siempre frescos.
 */

function leerCache(): RawEstacion[] | null {
  try {
    const crudo = localStorage.getItem(CACHE_ESTACIONES_KEY);
    if (!crudo) return null;
    const cache = JSON.parse(crudo) as CacheEstaciones;
    if (Date.now() - cache.fecha > CACHE_TTL_MS) return null;
    if (!Array.isArray(cache.estaciones) || cache.estaciones.length === 0)
      return null;
    return cache.estaciones;
  } catch {
    return null;
  }
}

function guardarCache(estaciones: RawEstacion[]): void {
  try {
    const cache: CacheEstaciones = { fecha: Date.now(), estaciones };
    localStorage.setItem(CACHE_ESTACIONES_KEY, JSON.stringify(cache));
  } catch {
    // localStorage lleno o no disponible: se sigue sin caché.
  }
}

export async function obtenerTodasLasEstaciones(): Promise<RawEstacion[]> {
  const cacheadas = leerCache();
  if (cacheadas) return cacheadas;

  let respuesta: Response;
  try {
    respuesta = await fetch(API_CARBURANTES_URL);
  } catch {
    throw new Error(
      'No se pudieron obtener los precios oficiales. Revisa tu conexión.',
    );
  }
  if (!respuesta.ok) {
    throw new Error(
      'El servicio oficial de precios no responde. Inténtalo en unos minutos.',
    );
  }
  const datos = (await respuesta.json()) as RespuestaCarburantes;
  const lista = datos.ListaEESSPrecio ?? [];
  if (lista.length === 0) throw new Error('El servicio oficial no devolvió datos.');
  guardarCache(lista);
  return lista;
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

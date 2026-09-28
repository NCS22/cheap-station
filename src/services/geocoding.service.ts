import {
  geocodificarUrl,
  nominatimCodigoPostalUrl,
} from '../config/app.config';
import type { PuntoBusqueda } from '../types';
import { centroideRobusto, distanciaKm } from '../utils/geo.utils';

interface LugarZippopotam {
  nombre: string;
  latitud: number;
  longitud: number;
  provincia: string;
}

interface RespuestaZippopotam {
  'post code': string;
  places: Array<{
    'place name': string;
    latitude: string;
    longitude: string;
    state: string;
  }>;
}

interface ResultadoNominatim {
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  display_name?: string;
}

/**
 * Convierte un código postal español en un punto central concreto.
 *
 * Estrategia (de más concreta a menos):
 * 1. Centroide oficial del polígono del CP (Nominatim/OpenStreetMap): es el
 *    centro geométrico del área completa del código postal, no el de un
 *    pueblo arbitrario. Para el 38628 cae en San Miguel de Abona (a ~2,8 km
 *    de Aldea Blanca) en vez de en zona Güímar (a ~34 km).
 * 2. Si Nominatim falla o no conoce el CP, centroide robusto de TODOS los
 *    lugares de Zippopotam (promedio con rechazo de atípicos), nunca
 *    `places[0]` a ciegas.
 *
 * La etiqueta mostrada (localidad) es siempre el lugar más cercano al punto
 * central elegido, para que nombre y coordenadas sean coherentes.
 */
export async function geocodificarCodigoPostal(
  codigoPostal: string,
): Promise<PuntoBusqueda> {
  const cp = codigoPostal.trim();

  const [lugares, centroideNominatim] = await Promise.all([
    obtenerLugaresZippopotam(cp),
    obtenerCentroideNominatim(cp),
  ]);

  if (lugares.length === 0 && !centroideNominatim) {
    throw new Error(`No hemos encontrado el código postal ${cp}.`);
  }

  const centro =
    centroideNominatim ??
    centroideRobusto(
      lugares.map((l) => ({ latitud: l.latitud, longitud: l.longitud })),
    );

  if (!centro) throw new Error(`No hemos encontrado el código postal ${cp}.`);

  const lugarCercano = lugarMasCercano(lugares, centro.latitud, centro.longitud);

  return {
    codigoPostal: cp,
    latitud: centro.latitud,
    longitud: centro.longitud,
    localidad: lugarCercano?.nombre ?? '',
    provincia: lugarCercano?.provincia ?? '',
  };
}

/** Descarga todos los lugares del CP. 404 → CP inexistente (error). */
async function obtenerLugaresZippopotam(cp: string): Promise<LugarZippopotam[]> {
  let respuesta: Response;
  try {
    respuesta = await fetch(geocodificarUrl(cp));
  } catch {
    throw new Error(
      'No se pudo contactar con el servicio de localización. Revisa tu conexión.',
    );
  }
  if (respuesta.status === 404) {
    throw new Error(
      `No hemos encontrado el código postal ${cp}. Comprueba que sea correcto.`,
    );
  }
  if (!respuesta.ok) {
    throw new Error('Error al localizar el código postal. Inténtalo de nuevo.');
  }
  const datos = (await respuesta.json()) as RespuestaZippopotam;
  const lugares: LugarZippopotam[] = [];
  for (const p of datos.places ?? []) {
    const latitud = Number(p.latitude);
    const longitud = Number(p.longitude);
    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) continue;
    lugares.push({
      nombre: p['place name'] ?? '',
      latitud,
      longitud,
      provincia: p.state ?? '',
    });
  }
  return lugares;
}

/**
 * Centroide del CP según Nominatim. Devuelve null si no lo conoce o falla
 * la red: es una mejora opcional, nunca un motivo de error (Zippopotam ya
 * valida la existencia del CP). Se prefiere el resultado de tipo postcode.
 */
async function obtenerCentroideNominatim(
  cp: string,
): Promise<{ latitud: number; longitud: number } | null> {
  try {
    const respuesta = await fetch(nominatimCodigoPostalUrl(cp));
    if (!respuesta.ok) return null;
    const datos = (await respuesta.json()) as ResultadoNominatim[];
    if (!Array.isArray(datos) || datos.length === 0) return null;
    const postcode =
      datos.find((d) => d.type === 'postcode') ?? datos[0];
    const latitud = Number(postcode.lat);
    const longitud = Number(postcode.lon);
    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return null;
    return { latitud, longitud };
  } catch {
    return null;
  }
}

function lugarMasCercano(
  lugares: LugarZippopotam[],
  latitud: number,
  longitud: number,
): LugarZippopotam | null {
  let mejor: LugarZippopotam | null = null;
  let mejorDist = Infinity;
  for (const lugar of lugares) {
    const d = distanciaKm(latitud, longitud, lugar.latitud, lugar.longitud);
    if (d < mejorDist) {
      mejorDist = d;
      mejor = lugar;
    }
  }
  return mejor;
}

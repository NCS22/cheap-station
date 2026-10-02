import {
  geocodificarUrl,
  nominatimCodigoPostalUrl,
  TIEMPO_ESPERA_RED_MS,
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
 * Las dos fuentes se resuelven por separado: el fallo de una nunca arrastra
 * a la otra. Solo es "código no encontrado" cuando Nominatim no lo conoce Y
 * Zippopotam devuelve 404; si alguna falla por red pero la otra responde,
 * la búsqueda sigue adelante con lo que haya.
 *
 * La etiqueta mostrada (localidad) es siempre el lugar más cercano al punto
 * central elegido, para que nombre y coordenadas sean coherentes.
 */
export async function geocodificarCodigoPostal(
  codigoPostal: string,
): Promise<PuntoBusqueda> {
  const cp = codigoPostal.trim();

  const [resultadoZip, centroideNominatim] = await Promise.all([
    obtenerLugaresZippopotam(cp),
    obtenerCentroideNominatim(cp),
  ]);

  const lugares =
    resultadoZip.estado === 'ok' ? resultadoZip.lugares : [];

  if (!centroideNominatim && lugares.length === 0) {
    if (resultadoZip.estado === 'fallo-red') {
      throw new Error(
        'No se pudo contactar con el servicio de localización. Revisa tu conexión.',
      );
    }
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
    origen: 'postal',
  };
}

type ResultadoZip =
  | { estado: 'ok'; lugares: LugarZippopotam[] }
  | { estado: 'no-encontrado' }
  | { estado: 'fallo-red' };

/**
 * Descarga todos los lugares del CP sin lanzar errores: 404 significa que
 * el CP no existe, y cualquier otro fallo (red o respuesta inesperada) se
 * devuelve como fallo-red para que quien llama decida. Así un fallo de red
 * de Zippopotam nunca invalida un centroide válido de Nominatim.
 */
async function obtenerLugaresZippopotam(
  cp: string,
): Promise<ResultadoZip> {
  let respuesta: Response;
  try {
    respuesta = await fetch(geocodificarUrl(cp), {
      signal: AbortSignal.timeout(TIEMPO_ESPERA_RED_MS),
    });
  } catch {
    return { estado: 'fallo-red' };
  }
  if (respuesta.status === 404) {
    return { estado: 'no-encontrado' };
  }
  if (!respuesta.ok) {
    return { estado: 'fallo-red' };
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
  return { estado: 'ok', lugares };
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
    const respuesta = await fetch(nominatimCodigoPostalUrl(cp), {
      signal: AbortSignal.timeout(TIEMPO_ESPERA_RED_MS),
    });
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

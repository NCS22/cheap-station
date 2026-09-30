import { GPS_OPTIONS, nominatimReverseUrl } from '../config/app.config';
import type { PuntoBusqueda } from '../types';

interface DireccionNominatim {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  quarter?: string;
  suburb?: string;
  state?: string;
}

interface RespuestaReverse {
  address?: DireccionNominatim;
}

/**
 * Ubicación GPS del dispositivo (una sola lectura por búsqueda).
 * Envuelve `navigator.geolocation.getCurrentPosition` en una Promise y
 * resuelve un PuntoBusqueda con la etiqueta del municipio más cercano
 * (reverse-geocoding), para que nombre y coordenadas sean coherentes,
 * igual que en el modo de código postal.
 */
export function hayGeolocalizacion(): boolean {
  return (
    typeof navigator !== 'undefined' && 'geolocation' in navigator
  );
}

export async function obtenerUbicacionActual(): Promise<PuntoBusqueda> {
  if (!hayGeolocalizacion()) {
    throw new Error(
      'Tu navegador no soporta geolocalización o la página no usa HTTPS. Usa el código postal.',
    );
  }

  let posicion: GeolocationPosition;
  try {
    posicion = await new Promise<GeolocationPosition>((resolver, rechazar) => {
      navigator.geolocation.getCurrentPosition(resolver, rechazar, GPS_OPTIONS);
    });
  } catch (e) {
    throw new Error(mensajeErrorGeolocalizacion(e));
  }

  const latitud = posicion.coords.latitude;
  const longitud = posicion.coords.longitude;
  const { localidad, provincia } = await EtiquetaCercana(latitud, longitud);

  return {
    codigoPostal: '',
    latitud,
    longitud,
    localidad,
    provincia,
    origen: 'gps',
  };
}

function mensajeErrorGeolocalizacion(e: unknown): string {
  const codigo =
    typeof e === 'object' && e !== null && 'code' in e
      ? (e as { code: unknown }).code
      : null;
  switch (codigo) {
    case 1: // PERMISSION_DENIED
      return 'Has denegado el acceso a tu ubicación. Actívalo en los ajustes del navegador o busca por código postal.';
    case 2: // POSITION_UNAVAILABLE
      return 'No pudimos obtener tu posición (sin señal GPS). Prueba de nuevo o busca por código postal.';
    case 3: // TIMEOUT
      return 'La localización tardó demasiado. Prueba de nuevo o busca por código postal.';
    default:
      return 'No pudimos obtener tu ubicación. Prueba de nuevo o busca por código postal.';
  }
}

/**
 * Municipio más cercano a unas coordenadas. Si Nominatim falla, devuelve
 * etiquetas vacías en vez de romper la búsqueda: la etiqueta es un extra,
 * el ranking solo necesita lat/lon.
 */
async function EtiquetaCercana(
  latitud: number,
  longitud: number,
): Promise<{ localidad: string; provincia: string }> {
  try {
    const respuesta = await fetch(nominatimReverseUrl(latitud, longitud));
    if (!respuesta.ok) return { localidad: '', provincia: '' };
    const datos = (await respuesta.json()) as RespuestaReverse;
    const dir = datos.address;
    if (!dir) return { localidad: '', provincia: '' };
    return {
      localidad:
        dir.city ??
        dir.town ??
        dir.village ??
        dir.municipality ??
        dir.quarter ??
        dir.suburb ??
        '',
      provincia: dir.state ?? '',
    };
  } catch {
    return { localidad: '', provincia: '' };
  }
}

import type { FuelId, TipoCombustible } from '../types';

/**
 * Configuración central de la app.
 * Todo valor "mágico" vive aquí para facilitar futuras ampliaciones
 * (nuevos combustibles, radios, límites, URLs de API).
 */

export const API_CARBURANTES_URL =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

export const geocodificarUrl = (codigoPostal: string): string =>
  `https://api.zippopotam.us/es/${codigoPostal}`;

/**
 * Centroide oficial del polígono del código postal (OpenStreetMap/Nominatim).
 * A diferencia de Zippopotam (un punto por pueblo), esto devuelve el centro
 * geométrico del área completa del CP: es el "punto medio" concreto que
 * buscamos y la fuente prioritaria.
 */
export const nominatimCodigoPostalUrl = (codigoPostal: string): string =>
  `https://nominatim.openstreetmap.org/search?format=json&postalcode=${codigoPostal}&country=Spain&limit=5`;

/** Reverse-geocoding: municipio más cercano a unas coordenadas (etiqueta del modo GPS). */
export const nominatimReverseUrl = (latitud: number, longitud: number): string =>
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitud}&lon=${longitud}&zoom=14&accept-language=es`;

/**
 * Opciones de `navigator.geolocation.getCurrentPosition`.
 * Una sola lectura por búsqueda (nunca `watchPosition`): el GPS solo se
 * despierta cuando el usuario pulsa "Usar mi ubicación".
 */
export const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

/** Caché de precios en localStorage: evita descargar ~12 MB en cada búsqueda. */
export const CACHE_ESTACIONES_KEY = 'cheapstation:estaciones:v1';
export const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

export const COMBUSTIBLES: TipoCombustible[] = [
  {
    id: 'gasolina95',
    etiqueta: 'Gasolina 95',
    campoPrecio: 'Precio Gasolina 95 E5',
    descripcion: 'La más usada en turismos de gasolina',
  },
  {
    id: 'diesel',
    etiqueta: 'Diésel',
    campoPrecio: 'Precio Gasoleo A',
    descripcion: 'Gasóleo A habitual',
  },
  {
    id: 'gasolina98',
    etiqueta: 'Gasolina 98',
    campoPrecio: 'Precio Gasolina 98 E5',
    descripcion: 'Alto octanaje',
  },
  {
    id: 'diesel-premium',
    etiqueta: 'Diésel Premium',
    campoPrecio: 'Precio Gasoleo Premium',
    descripcion: 'Gasóleo A premium / aditivado',
  },
  {
    id: 'glp',
    etiqueta: 'GLP',
    campoPrecio: 'Precio Gases licuados del petróleo',
    descripcion: 'Gases licuados del petróleo',
  },
  {
    id: 'gnc',
    etiqueta: 'GNC',
    campoPrecio: 'Precio Gas Natural Comprimido',
    descripcion: 'Gas natural comprimido',
  },
];

export const COMBUSTIBLE_POR_DEFECTO: FuelId = 'gasolina95';

export const RADIOS_KM = [5, 10, 25, 50] as const;
export const RADIO_POR_DEFECTO = 10;

export const MAX_RESULTADOS = 20;

/** Valida formato de CP español: 5 dígitos, provincia 01–52. */
export function esCodigoPostalValido(cp: string): boolean {
  if (!/^\d{5}$/.test(cp)) return false;
  const provincia = Number(cp.slice(0, 2));
  return provincia >= 1 && provincia <= 52;
}

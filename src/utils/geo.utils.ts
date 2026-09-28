/**
 * Utilidades geográficas: conversión de coordenadas y distancia haversiana.
 */

/** La API devuelve "39,211417" (coma decimal). Convierte a number o null. */
export function parseCoordenada(valor: unknown): number | null {
  if (typeof valor !== 'string') return null;
  const normalizado = valor.trim().replace(',', '.');
  if (normalizado === '') return null;
  const num = Number(normalizado);
  return Number.isFinite(num) ? num : null;
}

/** "1,849" (€/l con coma) → 1.849. "" → null. */
export function parsePrecio(valor: unknown): number | null {
  if (typeof valor !== 'string') return null;
  const normalizado = valor.trim().replace(',', '.');
  if (normalizado === '') return null;
  const num = Number(normalizado);
  return Number.isFinite(num) && num > 0 ? num : null;
}

const RADIO_TIERRA_KM = 6371;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

/** Distancia en km entre dos puntos (fórmula de Haversine). */
export function distanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(a));
}

/** Punto genérico con coordenadas (evita dependencias circulares con types/). */
export interface PuntoSimple {
  latitud: number;
  longitud: number;
}

/**
 * Centroide robusto de un conjunto de puntos: el "punto medio" concreto.
 * 1. Elimina duplicados exactos (un mismo punto repetido N veces no debe
 *    pesar N veces, como pasaba con places[0]).
 * 2. Calcula la mediana y descarta atípicos a más de `toleranciaKm` de ella
 *    (p. ej. un pueblo homónimo o mal geocodificado a decenas de km).
 * 3. Promedia los supervivientes. Si todos son atípicos, promedia todos
 *    antes que devolver null.
 */
export function centroideRobusto(
  puntos: PuntoSimple[],
  toleranciaKm = 15,
): PuntoSimple | null {
  const unicos = new Map<string, PuntoSimple>();
  for (const p of puntos) {
    if (!Number.isFinite(p.latitud) || !Number.isFinite(p.longitud)) continue;
    unicos.set(`${p.latitud.toFixed(4)},${p.longitud.toFixed(4)}`, p);
  }
  const lista = [...unicos.values()];
  if (lista.length === 0) return null;
  if (lista.length === 1) return lista[0];

  const mediana = (ns: number[]): number => {
    const ord = [...ns].sort((a, b) => a - b);
    const mid = Math.floor(ord.length / 2);
    return ord.length % 2 === 0 ? (ord[mid - 1] + ord[mid]) / 2 : ord[mid];
  };
  const medLat = mediana(lista.map((p) => p.latitud));
  const medLon = mediana(lista.map((p) => p.longitud));

  const cercanos = lista.filter(
    (p) => distanciaKm(medLat, medLon, p.latitud, p.longitud) <= toleranciaKm,
  );
  const base = cercanos.length > 0 ? cercanos : lista;
  return {
    latitud: base.reduce((s, p) => s + p.latitud, 0) / base.length,
    longitud: base.reduce((s, p) => s + p.longitud, 0) / base.length,
  };
}

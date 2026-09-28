/** Formatea un precio en €/l con 3 decimales (estándar en gasolineras). */
export function formatoPrecio(precio: number | null): string {
  if (precio === null) return '—';
  return `${precio.toFixed(3)} €/l`;
}

/** Formatea una distancia en km: "0,8 km" o "12,4 km". */
export function formatoDistancia(km: number | null): string {
  if (km === null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/** "AVENIDA CASTILLA..." → "Avenida Castilla..." para una lectura agradable. */
export function capitalizar(texto: string): string {
  if (!texto) return texto;
  return texto
    .toLowerCase()
    .replace(/(^|\s|[-/().])\S/g, (c) => c.toUpperCase());
}

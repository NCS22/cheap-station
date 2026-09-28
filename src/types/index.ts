/**
 * Tipos centrales del dominio.
 * Si en el futuro se añaden mapas, favoritos o usuarios,
 * amplía estos tipos sin romper los existentes.
 */

/** Respuesta cruda de una estación tal como la devuelve el Ministerio. */
export interface RawEstacion {
  IDEESS: string;
  'C.P.': string;
  Dirección: string;
  Horario: string;
  Latitud: string;
  'Longitud (WGS84)': string;
  Localidad: string;
  Municipio: string;
  Provincia: string;
  Rótulo: string;
  'Tipo Venta': string;
  Remisión: string;
  /** El resto de claves son precios dinámicos: "Precio Gasolina 95 E5", etc. */
  [clave: string]: string;
}

/** Respuesta completa del endpoint EstacionesTerrestres. */
export interface RespuestaCarburantes {
  Fecha: string;
  ListaEESSPrecio: RawEstacion[];
  Nota: string;
  ResultadoConsulta: string;
}

/** Combustible seleccionable en la UI. `campoPrecio` es la clave exacta de la API. */
export interface TipoCombustible {
  id: FuelId;
  etiqueta: string;
  campoPrecio: string;
  descripcion: string;
}

export type FuelId =
  | 'gasolina95'
  | 'gasolina98'
  | 'diesel'
  | 'diesel-premium'
  | 'glp'
  | 'gnc';

/** Estación normalizada y lista para mostrar. */
export interface Estacion {
  id: string;
  rotulo: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  municipio: string;
  provincia: string;
  horario: string;
  latitud: number | null;
  longitud: number | null;
  /** Precio del combustible seleccionado (€/l). null si no disponible. */
  precio: number | null;
  /** Distancia en km desde el punto buscado. null si sin coordenadas. */
  distanciaKm: number | null;
}

/** Resultado de geocodificar un código postal. */
export interface PuntoBusqueda {
  codigoPostal: string;
  latitud: number;
  longitud: number;
  localidad: string;
  provincia: string;
}

export type EstadoBusqueda = 'inicial' | 'cargando' | 'exito' | 'error';

import {
  capitalizar,
  formatoDistancia,
  formatoPrecio,
} from '../utils/format.utils';
import type { Estacion } from '../types';

interface Props {
  estacion: Estacion;
  posicion: number;
}

/** Tarjeta de una gasolinera: precio destacado, distancia y dirección. */
export function StationCard({ estacion, posicion }: Props) {
  const mapsUrl =
    estacion.latitud !== null && estacion.longitud !== null
      ? `https://www.google.com/maps/search/?api=1&query=${estacion.latitud},${estacion.longitud}`
      : null;

  return (
    <article className="station-card">
      <div className="station-card__rank" aria-hidden="true">
        {posicion}
      </div>
      <div className="station-card__body">
        <div className="station-card__top">
          <h3 className="station-card__name">
            {capitalizar(estacion.rotulo)}
          </h3>
          <p className="station-card__price">{formatoPrecio(estacion.precio)}</p>
        </div>
        <p className="station-card__address">
          {capitalizar(estacion.direccion)}
          {estacion.localidad ? `, ${capitalizar(estacion.localidad)}` : ''}
        </p>
        <div className="station-card__meta">
          <span className="badge">{formatoDistancia(estacion.distanciaKm)}</span>
          {estacion.horario && (
            <span className="station-card__hours" title={estacion.horario}>
              {estacion.horario}
            </span>
          )}
          {mapsUrl && (
            <a
              className="station-card__link"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Cómo llegar
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

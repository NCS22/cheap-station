import type { Estacion, PuntoBusqueda } from '../types';
import { StationCard } from './StationCard';

interface Props {
  punto: PuntoBusqueda | null;
  estaciones: Estacion[];
  combustibleEtiqueta: string;
  fechaPrecios: string | null;
}

/** Lista de resultados ordenada por precio ascendente. */
export function StationList({
  punto,
  estaciones,
  combustibleEtiqueta,
  fechaPrecios,
}: Props) {
  if (estaciones.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">Sin resultados en este radio</p>
        <p className="empty-state__text">
          No hay gasolineras con precio de {combustibleEtiqueta} en ese radio.
          Prueba a ampliar la distancia.
        </p>
      </div>
    );
  }

  const masBarata = estaciones.find((e) => e.precio !== null)?.precio ?? null;
  const titulo =
    punto?.origen === 'gps'
      ? `${estaciones.length} gasolineras cerca de tu ubicación${punto.localidad ? ` (${punto.localidad})` : ''}`
      : `${estaciones.length} gasolineras cerca de ${punto ? `${punto.codigoPostal} (${punto.localidad})` : ''}`;

  return (
    <section className="results" aria-live="polite">
      <div className="results__header">
        <h2 className="results__title">{titulo}</h2>
        <p className="results__subtitle">
          Ordenadas de más barata a más cara · {combustibleEtiqueta}
          {fechaPrecios ? ` · Consultado: ${fechaPrecios}` : ''}
        </p>
      </div>
      <ol className="results__list">
        {estaciones.map((estacion, i) => (
          <li key={estacion.id}>
            <StationCard
              estacion={{
                ...estacion,
                precio: estacion.precio,
              }}
              posicion={i + 1}
            />
            {i === 0 && masBarata !== null && estacion.precio === masBarata && (
              <span className="sr-only">La más barata</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

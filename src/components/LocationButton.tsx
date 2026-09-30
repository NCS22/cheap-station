import { hayGeolocalizacion } from '../services/geolocation.service';

interface Props {
  cargando: boolean;
  onLocalizar: () => void;
}

/**
 * Botón "Usar mi ubicación": dispara una sola lectura GPS.
 * Si el navegador no soporta geolocalización, no se renderiza:
 * el formulario de código postal queda como única vía.
 */
export function LocationButton({ cargando, onLocalizar }: Props) {
  if (!hayGeolocalizacion()) return null;

  return (
    <button
      type="button"
      className="btn-location"
      onClick={onLocalizar}
      disabled={cargando}
    >
      <span aria-hidden="true">📍</span>{' '}
      {cargando ? 'Localizando…' : 'Usar mi ubicación'}
    </button>
  );
}

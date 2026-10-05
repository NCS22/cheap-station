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
      <svg
        className="btn-location__icon"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 17.5c-4.2-4.05-6.5-7.22-6.5-10.25a6.5 6.5 0 0 1 13 0c0 3.03-2.3 6.2-6.5 10.25Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="10" cy="7.25" r="2.25" fill="currentColor" />
      </svg>{' '}
      {cargando ? 'Localizando…' : 'Usar mi ubicación'}
    </button>
  );
}

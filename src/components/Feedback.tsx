export function LoadingSpinner() {
  return (
    <div className="feedback" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="feedback__text">
        Localizando tu zona y descargando precios oficiales…
      </p>
    </div>
  );
}

export function ErrorAlert({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div className="alert-error" role="alert">
      <p className="alert-error__title">Vaya, algo ha fallado</p>
      <p className="alert-error__text">{mensaje}</p>
      <button type="button" className="btn-secondary" onClick={onReintentar}>
        Reintentar
      </button>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="app-footer">
      <p>
        Datos de precios:{' '}
        <a
          href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/"
          target="_blank"
          rel="noreferrer"
        >
          Ministerio para la Transición Ecológica
        </a>{' '}
        · Localización: Zippopotam / OpenStreetMap
      </p>
    </footer>
  );
}

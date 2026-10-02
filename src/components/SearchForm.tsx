import { COMBUSTIBLES, RADIOS_KM } from '../config/app.config';
import { hayGeolocalizacion } from '../services/geolocation.service';
import type { FuelId, OrigenBusqueda } from '../types';
import { LocationButton } from './LocationButton';

interface Props {
  modo: OrigenBusqueda;
  onModo: (v: OrigenBusqueda) => void;
  codigoPostal: string;
  onCodigoPostal: (v: string) => void;
  combustibleId: FuelId;
  onCombustible: (v: FuelId) => void;
  radioKm: number;
  onRadio: (v: number) => void;
  cargando: boolean;
  onBuscar: () => void;
  onLocalizar: () => void;
}

/** Formulario centrado: modo CP o GPS + combustible + radio compartido. */
export function SearchForm({
  modo,
  onModo,
  codigoPostal,
  onCodigoPostal,
  combustibleId,
  onCombustible,
  radioKm,
  onRadio,
  cargando,
  onBuscar,
  onLocalizar,
}: Props) {
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'gps') onLocalizar();
    else onBuscar();
  };

  // Sin GPS disponible (navegador sin soporte o página sin HTTPS) no se
  // muestra la pestaña de ubicación: el código postal queda como única vía.
  const gpsDisponible = hayGeolocalizacion();

  return (
    <section className="hero-card" aria-labelledby="titulo-buscador">
      <h1 id="titulo-buscador" className="hero-card__title">
        ¿Dónde repostas hoy?
      </h1>
      <p className="hero-card__subtitle">
        {modo === 'gps'
          ? 'Usamos tu ubicación para mostrarte las gasolineras más cercanas, ordenadas de más barata a más cara.'
          : 'Introduce tu código postal y te mostramos las gasolineras más cercanas, ordenadas de más barata a más cara.'}
      </p>

      {gpsDisponible && (
        <div className="mode-tabs" role="tablist" aria-label="Modo de búsqueda">
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'postal'}
            className={`mode-tab ${modo === 'postal' ? 'mode-tab--active' : ''}`}
            onClick={() => onModo('postal')}
          >
            Código postal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'gps'}
            className={`mode-tab ${modo === 'gps' ? 'mode-tab--active' : ''}`}
            onClick={() => onModo('gps')}
          >
            Mi ubicación
          </button>
        </div>
      )}

      <form className="search-form" onSubmit={enviar}>
        {modo === 'postal' ? (
          <div className="search-form__row">
            <label className="field field--grow" htmlFor="codigo-postal">
              <span className="field__label">Código postal</span>
              <input
                id="codigo-postal"
                className="field__input field__input--cp"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="Ej. 28001"
                maxLength={5}
                value={codigoPostal}
                onChange={(e) =>
                  onCodigoPostal(e.target.value.replace(/\D/g, '').slice(0, 5))
                }
              />
            </label>

            <label className="field field--grow" htmlFor="combustible">
              <span className="field__label">Combustible</span>
              <select
                id="combustible"
                className="field__input"
                value={combustibleId}
                onChange={(e) => onCombustible(e.target.value as FuelId)}
              >
                {COMBUSTIBLES.map((c) => (
                  <option key={c.id} value={c.id} title={c.descripcion}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="search-form__row search-form__row--single">
            <label className="field field--grow" htmlFor="combustible-gps">
              <span className="field__label">Combustible</span>
              <select
                id="combustible-gps"
                className="field__input"
                value={combustibleId}
                onChange={(e) => onCombustible(e.target.value as FuelId)}
              >
                {COMBUSTIBLES.map((c) => (
                  <option key={c.id} value={c.id} title={c.descripcion}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <fieldset className="radio-group">
          <legend className="field__label">Radio de búsqueda</legend>
          <div className="radio-group__options" role="radiogroup">
            {RADIOS_KM.map((r) => (
              <label
                key={r}
                className={`chip ${radioKm === r ? 'chip--active' : ''}`}
              >
                <input
                  type="radio"
                  name="radio"
                  value={r}
                  checked={radioKm === r}
                  onChange={() => onRadio(r)}
                  className="chip__input"
                />
                {r} km
              </label>
            ))}
          </div>
        </fieldset>

        {modo === 'postal' ? (
          <button
            type="submit"
            className="btn-primary"
            disabled={cargando || codigoPostal.trim().length !== 5}
          >
            {cargando ? 'Buscando…' : 'Buscar las más baratas'}
          </button>
        ) : (
          <LocationButton cargando={cargando} onLocalizar={onLocalizar} />
        )}
      </form>

      <p className="hero-card__note">
        Los cálculos de distancia son aproximados y pueden no corresponder con
        la realidad
      </p>
    </section>
  );
}

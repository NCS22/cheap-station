import { COMBUSTIBLES, RADIOS_KM } from '../config/app.config';
import type { FuelId } from '../types';

interface Props {
  codigoPostal: string;
  onCodigoPostal: (v: string) => void;
  combustibleId: FuelId;
  onCombustible: (v: FuelId) => void;
  radioKm: number;
  onRadio: (v: number) => void;
  cargando: boolean;
  onBuscar: () => void;
}

/** Formulario centrado: código postal + combustible + radio. */
export function SearchForm({
  codigoPostal,
  onCodigoPostal,
  combustibleId,
  onCombustible,
  radioKm,
  onRadio,
  cargando,
  onBuscar,
}: Props) {
  const enviar = (e: React.FormEvent) => { /*TODO: Aquí probablemente haya que cambiar a React.SubmitEvent ya que esta deprecado.*/
    e.preventDefault();
    onBuscar();
  };

  return (
    <section className="hero-card" aria-labelledby="titulo-buscador">
      <h1 id="titulo-buscador" className="hero-card__title">
        ¿Dónde repostas hoy?
      </h1>
      <p className="hero-card__subtitle">
        Introduce tu código postal y te mostramos las gasolineras más cercanas,
        ordenadas de más barata a más cara.
      </p>

      <form className="search-form" onSubmit={enviar}>
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

        <button
          type="submit"
          className="btn-primary"
          disabled={cargando || codigoPostal.trim().length !== 5}
        >
          {cargando ? 'Buscando…' : 'Buscar las más baratas'}
        </button>
      </form>

      <p className="hero-card__note">
        Los cálculos de distancia son aproximados y pueden no corresponder con la realidad
      </p>
    </section>
  );
}

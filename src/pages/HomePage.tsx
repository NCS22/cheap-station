import { COMBUSTIBLES } from '../config/app.config';
import { useStationSearch } from '../hooks/useStationSearch';
import { ErrorAlert, Footer, LoadingSpinner } from '../components/Feedback';
import { Header } from '../components/Header';
import { SearchForm } from '../components/SearchForm';
import { StationList } from '../components/StationList';

/**
 * Página principal: formulario centrado + resultados.
 * En el futuro aquí convivirán más páginas (mapa, favoritos…).
 */
export function HomePage() {
  const busqueda = useStationSearch();
  const combustibleEtiqueta =
    COMBUSTIBLES.find((c) => c.id === busqueda.combustibleId)?.etiqueta ?? '';

  return (
    <div className="page">
      <Header />
      <main className="page__main">
        <SearchForm
          codigoPostal={busqueda.codigoPostal}
          onCodigoPostal={busqueda.setCodigoPostal}
          combustibleId={busqueda.combustibleId}
          onCombustible={busqueda.setCombustibleId}
          radioKm={busqueda.radioKm}
          onRadio={busqueda.setRadioKm}
          cargando={busqueda.cargando}
          onBuscar={() => void busqueda.buscar()}
        />

        {busqueda.cargando && <LoadingSpinner />}

        {busqueda.estado === 'error' && busqueda.error && (
          <ErrorAlert
            mensaje={busqueda.error}
            onReintentar={busqueda.reintentar}
          />
        )}

        {busqueda.estado === 'exito' && (
          <StationList
            punto={busqueda.punto}
            estaciones={busqueda.estaciones}
            combustibleEtiqueta={combustibleEtiqueta}
            fechaPrecios={busqueda.fechaPrecios}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

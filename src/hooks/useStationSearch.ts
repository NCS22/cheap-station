import { useCallback, useState } from 'react';
import {
  COMBUSTIBLE_POR_DEFECTO,
  COMBUSTIBLES,
  RADIO_POR_DEFECTO,
  esCodigoPostalValido,
} from '../config/app.config';
import {
  buscarMasBaratas,
  obtenerTodasLasEstaciones,
} from '../services/carburantes.service';
import { geocodificarCodigoPostal } from '../services/geocoding.service';
import { obtenerUbicacionActual } from '../services/geolocation.service';
import type {
  Estacion,
  EstadoBusqueda,
  FuelId,
  OrigenBusqueda,
  PuntoBusqueda,
} from '../types';

/**
 * Orquesta los dos modos de búsqueda (código postal y GPS):
 * resolver punto → descargar precios → filtrar + ordenar.
 * El ranking es común a ambos modos; solo cambia cómo se obtiene el punto.
 * La página solo consume este hook; la lógica vive aquí y en services/.
 */
export function useStationSearch() {
  const [modo, setModo] = useState<OrigenBusqueda>('postal');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [combustibleId, setCombustibleId] = useState<FuelId>(
    COMBUSTIBLE_POR_DEFECTO,
  );
  const [radioKm, setRadioKm] = useState<number>(RADIO_POR_DEFECTO);
  const [estado, setEstado] = useState<EstadoBusqueda>('inicial');
  const [error, setError] = useState<string | null>(null);
  const [punto, setPunto] = useState<PuntoBusqueda | null>(null);
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [fechaPrecios, setFechaPrecios] = useState<string | null>(null);

  /** Núcleo compartido: descarga precios y aplica filtro + orden. */
  const ejecutarRanking = useCallback(
    async (puntoBusqueda: PuntoBusqueda) => {
      const todas = await obtenerTodasLasEstaciones();
      const campoPrecio =
        COMBUSTIBLES.find((c) => c.id === combustibleId)?.campoPrecio ??
        COMBUSTIBLES[0].campoPrecio;
      const resultado = buscarMasBaratas(todas, {
        punto: puntoBusqueda,
        campoPrecio,
        radioKm,
      });
      setPunto(puntoBusqueda);
      setEstaciones(resultado);
      setFechaPrecios(new Date().toLocaleString('es-ES'));
      setEstado('exito');
    },
    [combustibleId, radioKm],
  );

  const buscar = useCallback(async () => {
    const cp = codigoPostal.trim();
    if (!esCodigoPostalValido(cp)) {
      setError('Introduce un código postal español válido de 5 dígitos.');
      setEstado('error');
      return;
    }
    setModo('postal');
    setEstado('cargando');
    setError(null);
    try {
      const puntoBusqueda = await geocodificarCodigoPostal(cp);
      await ejecutarRanking(puntoBusqueda);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Ocurrió un error inesperado.',
      );
      setEstado('error');
    }
  }, [codigoPostal, ejecutarRanking]);

  const buscarPorUbicacion = useCallback(async () => {
    setModo('gps');
    setEstado('cargando');
    setError(null);
    try {
      const [puntoBusqueda] = await Promise.all([
        obtenerUbicacionActual(),
        // Calienta la caché de precios en paralelo con el fix GPS.
        obtenerTodasLasEstaciones(),
      ]);
      await ejecutarRanking(puntoBusqueda);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Ocurrió un error inesperado.',
      );
      setEstado('error');
    }
  }, [ejecutarRanking]);

  const reintentar = useCallback(() => {
    if (modo === 'gps') void buscarPorUbicacion();
    else void buscar();
  }, [modo, buscar, buscarPorUbicacion]);

  return {
    modo,
    setModo,
    codigoPostal,
    setCodigoPostal,
    combustibleId,
    setCombustibleId,
    radioKm,
    setRadioKm,
    estado,
    error,
    punto,
    estaciones,
    fechaPrecios,
    buscar,
    buscarPorUbicacion,
    reintentar,
    cargando: estado === 'cargando',
  };
}

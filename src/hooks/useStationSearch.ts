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
import type {
  Estacion,
  EstadoBusqueda,
  FuelId,
  PuntoBusqueda,
} from '../types';

/**
 * Orquesta el flujo completo de búsqueda:
 * validar CP → geocodificar → descargar precios → filtrar + ordenar.
 * La página solo consume este hook; la lógica vive aquí y en services/.
 */
export function useStationSearch() {
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

  const buscar = useCallback(async () => {
    const cp = codigoPostal.trim();
    if (!esCodigoPostalValido(cp)) {
      setError('Introduce un código postal español válido de 5 dígitos.');
      setEstado('error');
      return;
    }
    setEstado('cargando');
    setError(null);
    try {
      const [puntoBusqueda, todas] = await Promise.all([
        geocodificarCodigoPostal(cp),
        obtenerTodasLasEstaciones(),
      ]);
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
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Ocurrió un error inesperado.',
      );
      setEstado('error');
    }
  }, [codigoPostal, combustibleId, radioKm]);

  const reintentar = useCallback(() => {
    void buscar();
  }, [buscar]);

  return {
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
    reintentar,
    cargando: estado === 'cargando',
  };
}

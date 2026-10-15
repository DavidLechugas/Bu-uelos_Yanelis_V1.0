import { useCallback, useEffect, useState } from 'react';
import { fetchDashboard } from '../api/client.js';

export const DASHBOARD_POLL_MS = 15000;

/**
 * Datos de demostración con la misma forma que la API.
 * Solo se usan tras pulsar explícitamente «Cargar datos de demostración»
 * en el estado de error: nunca como sustitución silenciosa.
 */
export const DEMO_DASHBOARD = {
  saludo: 'Buenos días, Ana',
  ventasTotales: 428000,
  pedidos: 36,
  entregasActivas: 4,
  pendientesSinAsignar: 0,
  ventasUltimos7Dias: [
    { dia: 'Lun', ventas: 52000 },
    { dia: 'Mar', ventas: 61000 },
    { dia: 'Mié', ventas: 47000 },
    { dia: 'Jue', ventas: 58000 },
    { dia: 'Vie', ventas: 72000 },
    { dia: 'Sáb', ventas: 68000 },
    { dia: 'Dom', ventas: 70000 },
  ],
};

/**
 * Tablero en vivo: carga inicial con estados loading | error | success
 * y, después, refresco silencioso cada 15 s mientras la vista está activa
 * y la pestaña visible (también al volver a la pestaña). Si un refresco
 * falla se conservan los últimos datos y se marca `stale`.
 */
export function useDashboard({ active = true } = {}) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null, updatedAt: null, stale: false });
  const [attempt, setAttempt] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchDashboard();
      setState({ status: 'success', data, error: null, updatedAt: new Date(), stale: false });
    } catch (error) {
      setState((current) => (current.data
        ? { ...current, stale: true }
        : { status: 'error', data: null, error: error.message, updatedAt: null, stale: false }));
    }
  }, []);

  useEffect(() => {
    if (demoMode) {
      setState({ status: 'success', data: DEMO_DASHBOARD, error: null, updatedAt: null, stale: false });
      return undefined;
    }
    if (!active) return undefined;
    refresh();
    const tick = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = setInterval(tick, DASHBOARD_POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [attempt, demoMode, active, refresh]);

  return {
    ...state,
    demoMode,
    retry: () => {
      setDemoMode(false);
      setState({ status: 'loading', data: null, error: null, updatedAt: null, stale: false });
      setAttempt((n) => n + 1);
    },
    useDemoData: () => setDemoMode(true),
  };
}

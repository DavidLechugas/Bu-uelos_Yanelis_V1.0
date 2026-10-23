import { useCallback, useEffect, useState } from 'react';
import { fetchDashboard } from '../api/client.js';

export const DASHBOARD_POLL_MS = 15000;

/** Datos de demostración: solo tras pulsar «Cargar datos de demostración», nunca como sustituto silencioso. */
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

/** Tablero en vivo: refresca cada 15 s con la vista activa y visible; si un refresco falla conserva los datos y marca `stale`. */
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

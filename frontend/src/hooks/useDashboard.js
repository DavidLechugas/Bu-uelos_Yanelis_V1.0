import { useEffect, useState } from 'react';
import { fetchDashboard } from '../api/client.js';

/**
 * Datos de demostración con la misma forma que la API.
 * Solo se usan tras pulsar explícitamente «Cargar datos de demostración»
 * en el estado de error: nunca como sustitución silenciosa.
 */
export const DEMO_DASHBOARD = {
  saludo: 'Buenos días, Ana',
  ventasTotales: 428000,
  pedidos: 36,
  alertas: 3,
  entregasActivas: 4,
  inventarioBajo: [{ producto: 'Queso costeño', unidades: 2, mensaje: 'revisar' }],
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
 * Hook de lectura del tablero con estados explícitos:
 * loading | error | success. Error no silencioso: ofrece
 * Reintentar y un fallback de demostración a elección del usuario.
 */
export function useDashboard() {
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (demoMode) {
      setState({ status: 'success', data: DEMO_DASHBOARD, error: null });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    fetchDashboard()
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'success', data, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ status: 'error', data: null, error: error.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, demoMode]);

  return {
    ...state,
    demoMode,
    retry: () => {
      setDemoMode(false);
      setAttempt((n) => n + 1);
    },
    useDemoData: () => setDemoMode(true),
  };
}

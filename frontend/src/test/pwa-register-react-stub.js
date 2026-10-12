// Stub de 'virtual:pwa-register/react' para el entorno de tests
// (jsdom no tiene service workers). Solo se usa cuando VITEST está
// activo (ver resolve.alias en vite.config.js); en la build real
// vite-plugin-pwa resuelve el módulo virtual genuino.
import { useState } from 'react';

/** Estado controlable desde los tests (sueño de prueba del stub). */
export const stubState = {
  needRefresh: false,
  offlineReady: false,
  updates: 0,
  reloadRequested: false,
};

export function useRegisterSW() {
  const [needRefresh, setNeedRefresh] = useState(stubState.needRefresh);
  const [offlineReady, setOfflineReady] = useState(stubState.offlineReady);
  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker: async (reloadPage) => {
      stubState.updates += 1;
      stubState.reloadRequested = reloadPage === true;
    },
  };
}

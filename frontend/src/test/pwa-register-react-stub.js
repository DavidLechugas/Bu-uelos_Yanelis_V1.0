// Stub de 'virtual:pwa-register/react' para jsdom, que no tiene service workers (ver resolve.alias en vite.config.js).
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

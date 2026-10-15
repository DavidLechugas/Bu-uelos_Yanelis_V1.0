import { useEffect } from 'react';
import { CloseIcon } from './icons.jsx';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Estado del service worker (vite-plugin-pwa, registerType 'prompt').
 *
 * - Nueva versión: aviso con botón «Actualizar». NUNCA recarga
 *   automáticamente: la actualización ocurre solo cuando el usuario
 *   pulsa «Actualizar» (sin interrumpir formularios ni provocar
 *   bucles de recarga).
 * - Sin conexión: avisa cuando el shell ya está cacheado.
 *
 * La API (/api) nunca se cachea (NetworkOnly en el service
 * worker generado); las credenciales del login no se almacenan.
 */
export function PwaStatus() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  // «Disponible sin conexión» es informativo: se retira solo a los 6 s.
  useEffect(() => {
    if (!offlineReady) return undefined;
    const timer = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  if (needRefresh) {
    return (
      <div className="pwa-toast" role="status">
        <p>Hay una nueva versión de la app.</p>
        <button
          type="button"
          className="btn-secondary pwa-toast-btn"
          onClick={() => updateServiceWorker(true)}
        >
          Actualizar
        </button>
        <button
          type="button"
          className="icon-btn pwa-toast-close"
          aria-label="Cerrar aviso"
          onClick={() => setNeedRefresh(false)}
        >
          <CloseIcon />
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="pwa-toast" role="status">
        <p>Interfaz disponible sin conexión. Los datos necesitan conexión al servidor.</p>
        <button
          type="button"
          className="icon-btn pwa-toast-close"
          aria-label="Cerrar aviso"
          onClick={() => setOfflineReady(false)}
        >
          <CloseIcon />
        </button>
      </div>
    );
  }

  return null;
}

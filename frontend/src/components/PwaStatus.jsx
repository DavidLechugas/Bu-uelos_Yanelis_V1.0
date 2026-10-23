import { useEffect } from 'react';
import { CloseIcon } from './icons.jsx';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Avisa de una versión nueva (nunca recarga sola) y de la disponibilidad sin conexión. La API no se cachea. */
export function PwaStatus() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

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

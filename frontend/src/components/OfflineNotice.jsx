import { useEffect, useState } from 'react';
import { WifiOffIcon } from './icons.jsx';

const BACK_ONLINE_MS = 4000;

function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/** Aviso fijo mientras no hay internet; al volver la conexión confirma unos segundos y se va. */
export function OfflineNotice() {
  const [online, setOnline] = useState(isOnline);
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    function onOffline() {
      setOnline(false);
      setJustBack(false);
    }
    function onOnline() {
      setOnline(true);
      setJustBack(true);
    }
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    if (!justBack) return undefined;
    const timer = setTimeout(() => setJustBack(false), BACK_ONLINE_MS);
    return () => clearTimeout(timer);
  }, [justBack]);

  if (online && !justBack) return null;
  if (online) {
    return <div className="offline-notice offline-notice--back" role="status"><p>Conexión recuperada.</p></div>;
  }
  return (
    <div className="offline-notice" role="alert">
      <WifiOffIcon />
      <p>
        <strong>No tienes acceso a internet.</strong> Puedes seguir viendo la app, pero los pedidos y los
        cambios no se guardarán ni se actualizarán hasta que vuelvas a conectarte.
      </p>
    </div>
  );
}

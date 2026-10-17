import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertIcon, CheckCircleIcon, CloseIcon } from '../../components/icons.jsx';

const AUTO_CLOSE_MS = 5000;

/**
 * Aviso de una vista: `[notice, setNotice]`. `setNotice('texto')` es un éxito,
 * `setNotice('texto', 'error')` un error y `setNotice('')` lo quita.
 */
export function useNotice() {
  const [notice, setNotice] = useState(null);
  const show = useCallback((text, tone = 'success') => setNotice(text ? { text, tone } : null), []);
  return [notice, show];
}

/**
 * Toast flotante sobre la barra inferior. Los éxitos se cierran solos a los
 * 5 s; los errores se quedan hasta cerrarlos. `role="status"` / `"alert"`.
 */
export function Toast({ notice, onClose }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!notice || notice.tone === 'error') return undefined;
    const timer = setTimeout(() => close.current(), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;
  const error = notice.tone === 'error';
  return (
    <div className={`toast toast--${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
      <span className="toast-icon">{error ? <AlertIcon size={22} /> : <CheckCircleIcon size={22} />}</span>
      <p>{notice.text}</p>
      <button type="button" className="icon-btn toast-close" aria-label="Cerrar aviso" onClick={onClose}>
        <CloseIcon size={20} />
      </button>
    </div>
  );
}

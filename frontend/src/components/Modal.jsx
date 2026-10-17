import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons.jsx';
import { trapTabKey } from './Drawer.jsx';

/**
 * Ventana flotante centrada (diálogo modal): Escape y el fondo la cierran,
 * atrapa el foco, bloquea el scroll de atrás y devuelve el foco al cerrar.
 */
export function Modal({ open, title, onClose, children }) {
  const panelRef = useRef(null);
  const previousFocus = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const panel = panelRef.current;
    (panel?.querySelector('input, select, textarea') ?? panel?.querySelector('button'))?.focus();
    function onKey(event) {
      if (event.key === 'Escape') closeRef.current();
      else if (event.key === 'Tab' && panelRef.current) trapTabKey(event, panelRef.current);
    }
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  // En el body: así queda por encima del encabezado y la barra inferior.
  return createPortal(
    <div className="panel-overlay" onClick={() => closeRef.current()} data-testid="modal-overlay">
      <div
        ref={panelRef}
        className="profile-panel modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-panel-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Cerrar ventana" onClick={() => closeRef.current()}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

import { useEffect, useRef } from 'react';
import { CloseIcon } from './icons.jsx';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';


export function trapTabKey(event, container) {
  // El selector ya excluye botones deshabilitados y tabindex="-1".
  const focusable = Array.from(
    container.querySelectorAll(FOCUSABLE_SELECTOR),
  );
  if (focusable.length === 0) {
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Drawer lateral izquierdo (máx. 320 px, 80 % en móvil) con overlay
 * oscuro. Se cierra con Escape, clic en overlay o su botón; atrapa el
 * foco, bloquea el scroll del fondo y restaura el foco al cerrar.
 *
 * App decide qué secciones están implementadas. Las pendientes
 * avisan honestamente. «Cerrar sesión» cierra la sesión en el servidor.
 */
export function Drawer({ open, role, items = [], onClose, onNavigate, onLogout }) {
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const drawer = drawerRef.current;
    const firstFocusable = drawer.querySelector(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'Tab') {
        trapTabKey(event, drawer);
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previousFocusRef.current?.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="drawer-overlay"
      onClick={onClose}
      aria-hidden="false"
      data-testid="drawer-overlay"
    >
      <aside
        ref={drawerRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <span className="brand-circle brand-circle--small" aria-hidden="true">
            BY
          </span>
          <div className="drawer-brand-text">
            <p className="drawer-brand-name">Buñuelos Yanelys</p>
            <p className="drawer-role">{role}</p>
          </div>
          <button
            type="button"
            className="icon-btn drawer-close"
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Secciones">
          <ul className="drawer-menu">
            {items.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="drawer-item"
                  onClick={() => onNavigate(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button type="button" className="drawer-logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      </aside>
    </div>
  );
}

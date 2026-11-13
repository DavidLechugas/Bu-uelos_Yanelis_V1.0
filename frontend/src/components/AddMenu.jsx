import { useEffect, useId, useState } from 'react';
import { PlusIcon } from './icons.jsx';

/** Botón flotante «+» que gira y despliega varias opciones de alta. */
export function AddMenu({ label, options }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  function choose(option) {
    setOpen(false);
    option.onSelect();
  }

  return (
    <div className="add-menu" data-open={open}>
      <button type="button" className="add-menu-scrim" aria-label="Cerrar" tabIndex={-1} onClick={() => setOpen(false)} />
      <ul id={menuId} className="add-menu-options" role="menu" aria-label={label}>
        {options.map((option, index) => (
          <li key={option.label} role="presentation" style={{ '--i': options.length - 1 - index }}>
            <button type="button" role="menuitem" className="add-menu-option" onClick={() => choose(option)}>
              <span>{option.label}</span>
              <span className="add-menu-option-icon">{option.icon}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="fab fab--inline add-menu-main"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
      >
        <PlusIcon size={34} />
      </button>
    </div>
  );
}

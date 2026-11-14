import { useEffect, useRef } from 'react';

// Pila de superposiciones abiertas (modales, panel de perfil). Cada una ocupa una entrada de
// historial para que «atrás» (botón del teléfono o del navegador) la cierre en vez de salir de la app.
const stack = [];
let ignorePops = 0;
let pendingClose = null;
let nextId = 0;
let listening = false;

function onPopState() {
  if (ignorePops > 0) {
    ignorePops -= 1;
    return;
  }
  const entry = stack[stack.length - 1];
  if (!entry) return;
  entry.onClose();
  // Si no se pudo cerrar (p. ej. guardando), se repone la entrada para que el siguiente «atrás» no salga.
  setTimeout(() => {
    if (stack.includes(entry)) window.history.pushState({ overlay: entry.id }, '');
  }, 0);
}

function acquire(entry) {
  if (!listening) {
    window.addEventListener('popstate', onPopState);
    listening = true;
  }
  if (pendingClose) {
    // Remontaje inmediato (StrictMode): se reutiliza la entrada en vez de apilar otra.
    entry.id = pendingClose.id;
    pendingClose = null;
  } else {
    entry.id = ++nextId;
    window.history.pushState({ overlay: entry.id }, '');
  }
  stack.push(entry);
}

function release(entry) {
  stack.splice(stack.indexOf(entry), 1);
  pendingClose = entry;
  queueMicrotask(() => {
    if (pendingClose !== entry) return;
    pendingClose = null;
    if (window.history.state?.overlay === entry.id) {
      ignorePops += 1;
      window.history.back();
    }
  });
}

/** Mientras `open`, el botón «atrás» llama a `onClose` (y no sale de la aplicación). */
export function useBackToClose(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const entry = { id: 0, onClose: () => closeRef.current() };
    acquire(entry);
    return () => release(entry);
  }, [open]);
}

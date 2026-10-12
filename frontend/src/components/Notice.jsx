/**
 * Aviso en línea (no modal) para feedback honesto:
 * datos de demostración, roles sin permisos definidos,
 * secciones no implementadas.
 */
export function Notice({ tone = 'info', text }) {
  return (
    <p className={`notice notice--${tone}`} role="status">
      {text}
    </p>
  );
}

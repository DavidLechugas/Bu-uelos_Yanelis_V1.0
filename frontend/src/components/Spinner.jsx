/**
 * Indicador de espera: anillo que gira; con `done`, círculo con un chulito
 * que se dibuja (confirmación). Con `label` es un aviso `role="status"`;
 * sin él es solo decorativo.
 */
export function Spinner({ size = 'md', done = false, label }) {
  return (
    <div
      className={`spinner-box spinner-box--${size}${done ? ' spinner-box--done' : ''}`}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : 'true'}
    >
      {done ? (
        <svg className="spinner-check" viewBox="0 0 52 52" focusable="false" aria-hidden="true">
          <circle className="spinner-check-circle" cx="26" cy="26" r="23" pathLength="1" />
          <path className="spinner-check-mark" d="M15 27L23 35L38 18" pathLength="1" />
        </svg>
      ) : (
        <span className="spinner" />
      )}
      {label && <p className="spinner-label">{label}</p>}
    </div>
  );
}

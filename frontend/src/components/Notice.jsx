export function Notice({ tone = 'info', text }) {
  return (
    <p className={`notice notice--${tone}`} role="status">
      {text}
    </p>
  );
}

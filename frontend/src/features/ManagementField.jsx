import { useId } from 'react';

export function ManagementField({ label, error, ...props }) {
  const id = useId();
  return (
    <div className="management-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}

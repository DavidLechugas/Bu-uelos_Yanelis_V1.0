import { useId } from 'react';

/** Campo etiquetado con error accesible. `multiline` usa textarea. */
export function ManagementField({ label, error, hint, multiline = false, wide = false, ...props }) {
  const id = useId();
  const Control = multiline ? 'textarea' : 'input';
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`management-field${wide ? ' management-field--wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Control id={id} {...props} aria-invalid={Boolean(error)} aria-describedby={describedBy} />
      {hint && <p id={`${id}-hint`} className="management-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}

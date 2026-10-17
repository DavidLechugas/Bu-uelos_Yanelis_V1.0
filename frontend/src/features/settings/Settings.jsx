import { useState } from 'react';
import { loadPreferences, savePreferences } from './preferences.js';

export const THEMES = [
  { value: 'system', label: 'Según el teléfono' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];
export const MOTION = [
  { value: 'normal', label: 'Normales' },
  { value: 'reduce', label: 'Reducidas' },
];

export function Choice({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="card settings-group">
      <legend>{legend}</legend>
      <div className="settings-options">
        {options.map((option) => (
          <label key={option.value} className={`settings-option${value === option.value ? ' settings-option--active' : ''}`}>
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Configuración de este dispositivo y acceso al perfil. */
export function Settings({ onOpenProfile }) {
  const [preferences, setPreferences] = useState(loadPreferences);

  function update(key, value) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    savePreferences(next);
  }

  return (
    <section className="management-section" aria-labelledby="settings-title">
      <div className="management-heading">
        <div>
          <h2 id="settings-title">Configuración</h2>
          <p>Se guarda solo en este dispositivo.</p>
        </div>
      </div>
      <Choice legend="Apariencia" name="theme" options={THEMES} value={preferences.theme} onChange={(value) => update('theme', value)} />
      <Choice legend="Animaciones" name="motion" options={MOTION} value={preferences.motion} onChange={(value) => update('motion', value)} />
      <div className="card settings-group">
        <h3>Cuenta</h3>
        <p className="management-hint">Cambia tu nombre, tu foto o tu contraseña.</p>
        <button type="button" className="btn-secondary" onClick={onOpenProfile}>Abrir mi perfil</button>
      </div>
    </section>
  );
}

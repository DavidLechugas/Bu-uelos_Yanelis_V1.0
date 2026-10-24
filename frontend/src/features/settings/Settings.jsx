import { useEffect, useState } from 'react';
import { disablePush, enablePush, pushStatus } from '../push/push.js';
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

export const SOUND = [
  { value: true, label: 'Con sonido y vibración' },
  { value: false, label: 'Sin sonido' },
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

const PUSH_TEXT = {
  unsupported: 'Este navegador no permite notificaciones. Instala la app en el teléfono para recibirlas.',
  blocked: 'Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador o de la app.',
  off: 'Recibe un aviso en el teléfono cuando haya pedidos nuevos, aunque la app esté cerrada.',
  on: 'Este dispositivo recibe avisos de pedidos aunque la app esté cerrada.',
};

function PushSetting() {
  const [status, setStatus] = useState('off');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    pushStatus().then(setStatus);
  }, []);

  async function toggle() {
    setBusy(true);
    setError('');
    try {
      if (status === 'on') {
        await disablePush();
        setStatus('off');
      } else {
        setStatus(await enablePush());
      }
    } catch {
      setError('No se pudo cambiar el aviso. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  const unavailable = status === 'unsupported' || status === 'blocked';
  return (
    <div className="card settings-group">
      <h3>Notificaciones</h3>
      <p className="management-hint">{PUSH_TEXT[status]}</p>
      {!unavailable && (
        <button type="button" className={status === 'on' ? 'btn-secondary' : 'btn-primary'} disabled={busy} aria-busy={busy} onClick={toggle}>
          {status === 'on' ? 'Desactivar en este dispositivo' : 'Activar en este dispositivo'}
        </button>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

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
      <Choice legend="Avisos de pedidos" name="alertSound" options={SOUND} value={preferences.alertSound} onChange={(value) => update('alertSound', value)} />
      <PushSetting />
      <div className="card settings-group">
        <h3>Cuenta</h3>
        <p className="management-hint">Cambia tu nombre, tu foto o tu contraseña.</p>
        <button type="button" className="btn-secondary" onClick={onOpenProfile}>Abrir mi perfil</button>
      </div>
    </section>
  );
}

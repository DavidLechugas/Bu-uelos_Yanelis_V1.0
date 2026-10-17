import { useCallback, useEffect, useId, useState } from 'react';
import { Spinner } from '../../components/Spinner.jsx';
import { couriersApi } from '../../api/client.js';
import { ManagementField } from '../ManagementField.jsx';
import { Toast, useNotice } from '../feedback/Toast.jsx';
import { SAVE_DONE_MS, pause } from '../feedback/timing.js';

const EMPTY_DRAFT = { nombre: '', usuario: '', password: '' };
const USERNAME = /^[a-z0-9._-]{3,30}$/;

function validate(draft, { withProfile }) {
  const errors = {};
  if (withProfile && !draft.nombre.trim()) errors.nombre = 'Escribe el nombre.';
  if (withProfile && !USERNAME.test(draft.usuario)) {
    errors.usuario = 'De 3 a 30 letras minúsculas, números, punto o guion.';
  }
  if (draft.password.length < 8 || draft.password.length > 72) {
    errors.password = 'La contraseña debe tener entre 8 y 72 caracteres.';
  }
  return errors;
}

/**
 * Domiciliarios (solo administrador): crear cuentas, activar o
 * desactivar y asignar una contraseña nueva. Desactivar o cambiar la
 * contraseña cierra las sesiones abiertas de esa persona.
 */
export function Couriers({ active = true }) {
  const [couriers, setCouriers] = useState(null);
  const [confirmed, setConfirmed] = useState('');
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [passwordFor, setPasswordFor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useNotice();
  const formTitleId = useId();

  const load = useCallback(async () => {
    try {
      setCouriers(await couriersApi.list());
      setLoadError('');
    } catch (error) {
      if (error.status !== 401) setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  function replace(updated) {
    setCouriers((previous) => previous.map((courier) => (courier.id === updated.id ? updated : courier)));
  }

  async function create(event) {
    event.preventDefault();
    const nextErrors = validate(draft, { withProfile: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const created = await couriersApi.create({ ...draft, nombre: draft.nombre.trim() });
      setCouriers((previous) => [...(previous ?? []), created].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      setNotice('Domiciliario creado.');
      setConfirmed('¡Cuenta creada!');
      await pause(SAVE_DONE_MS);
      setConfirmed('');
      setDraft(null);
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(courier) {
    setBusyId(courier.id);
    setNotice('');
    try {
      const updated = await couriersApi.setActive(courier.id, !courier.activo);
      replace(updated);
      setNotice(updated.activo
        ? 'Domiciliario activado.'
        : 'Domiciliario desactivado.');
    } catch (error) {
      setNotice(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function savePassword(event, courier) {
    event.preventDefault();
    const nextErrors = validate({ password: newPassword }, { withProfile: false });
    setErrors(nextErrors);
    if (nextErrors.password) return;
    setBusyId(courier.id);
    try {
      replace(await couriersApi.resetPassword(courier.id, newPassword));
      setPasswordFor(null);
      setNewPassword('');
      setNotice('Contraseña actualizada.');
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="management-section" aria-labelledby="couriers-title">
      <div className="management-heading">
        <div>
          <h2 id="couriers-title">Domiciliarios</h2>
          <p>Crea las cuentas de tu equipo. No hay registro público.</p>
        </div>
        {!draft && (
          <button className="btn-primary" type="button" onClick={() => { setDraft(EMPTY_DRAFT); setErrors({}); setNotice(''); }}>
            Nuevo domiciliario
          </button>
        )}
      </div>

      <Toast notice={notice} onClose={() => setNotice('')} />

      {draft && confirmed && (
        <div className="card management-form management-form--done">
          <Spinner size="md" done label={confirmed} />
        </div>
      )}

      {draft && !confirmed && (
        <form className="card management-form" onSubmit={create} noValidate aria-labelledby={formTitleId}>
          <h3 id={formTitleId}>Nuevo domiciliario</h3>
          <ManagementField label="Nombre" autoFocus maxLength={60} autoComplete="off" value={draft.nombre} onChange={(event) => setDraft({ ...draft, nombre: event.target.value })} error={errors.nombre} />
          <ManagementField
            label="Usuario"
            maxLength={30}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={draft.usuario}
            onChange={(event) => setDraft({ ...draft, usuario: event.target.value.toLowerCase().replace(/\s/g, '') })}
            error={errors.usuario}
            hint="Con este usuario entrará a la app."
          />
          <ManagementField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            value={draft.password}
            onChange={(event) => setDraft({ ...draft, password: event.target.value })}
            error={errors.password}
            hint="Mínimo 8 caracteres. Compártela en persona, no por chat."
          />
          <div className="management-actions">
            <button className="btn-primary" type="submit" disabled={saving} aria-busy={saving}>
              {saving ? 'Creando…' : 'Crear cuenta'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setDraft(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {loadError && (
        <div className="card error-card" role="alert">
          <p>{loadError}</p>
          <div className="error-actions"><button className="btn-primary" type="button" onClick={load}>Reintentar</button></div>
        </div>
      )}

      {!couriers && !loadError && <div className="skeleton" aria-busy="true" aria-label="Cargando domiciliarios"><Spinner size="lg" label="Cargando domiciliarios…" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}

      {couriers && !couriers.length && (
        <p className="card management-empty"><img className="empty-logo" src="/icons/logo.svg" alt="" />Todavía no hay domiciliarios. Crea el primero con «Nuevo domiciliario».</p>
      )}

      <ul className="management-list">
        {(couriers ?? []).map((courier) => {
          const busy = busyId === courier.id;
          return (
            <li key={courier.id} className={`card management-item${courier.activo ? '' : ' management-item--muted'}`} aria-busy={busy}>
              <div className="management-item-copy">
                <h3>{courier.nombre}</h3>
                <p>@{courier.usuario} · {courier.pedidosActivos === 1 ? '1 pedido activo' : `${courier.pedidosActivos} pedidos activos`}</p>
                <span className={`status-badge status-badge--${courier.activo ? 'done' : 'cancelled'}`}>
                  {courier.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="management-item-actions">
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => toggle(courier)}>
                  {courier.activo ? 'Desactivar' : 'Activar'}
                </button>
                {passwordFor !== courier.id && (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => { setPasswordFor(courier.id); setNewPassword(''); setErrors({}); }}
                  >
                    Cambiar contraseña
                  </button>
                )}
              </div>
              {passwordFor === courier.id && (
                <form className="courier-password" onSubmit={(event) => savePassword(event, courier)} noValidate>
                  <ManagementField
                    label={`Nueva contraseña para ${courier.nombre}`}
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    maxLength={72}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    error={errors.password}
                  />
                  <div className="management-actions">
                    <button className="btn-primary" type="submit" disabled={busy}>Guardar contraseña</button>
                    <button className="btn-secondary" type="button" onClick={() => setPasswordFor(null)}>Cancelar</button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

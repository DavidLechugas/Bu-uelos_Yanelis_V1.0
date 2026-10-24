import { useCallback, useEffect, useId, useState } from 'react';
import { Spinner } from '../../components/Spinner.jsx';
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

function pluralize(count, singular, plural) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

function deactivationNotice(updated) {
  const released = updated.pedidosLiberados || 0;
  const onTheWay = updated.pedidosActivos || 0;
  const parts = ['Domiciliario desactivado.'];
  if (released > 0) {
    parts.push(released === 1
      ? '1 pedido asignado volvió a Pendientes.'
      : `${released} pedidos asignados volvieron a Pendientes.`);
  }
  if (onTheWay > 0) {
    parts.push(onTheWay === 1
      ? 'Aún tiene 1 pedido en camino: ciérralo desde Pedidos.'
      : `Aún tiene ${onTheWay} pedidos en camino: ciérralos desde Pedidos.`);
  }
  return parts.join(' ');
}

export const COURIER_TEAM = {
  titleId: 'couriers-title',
  title: 'Domiciliarios',
  description: 'Crea las cuentas de tu equipo. No hay registro público.',
  newLabel: 'Nuevo domiciliario',
  created: 'Domiciliario creado.',
  activated: 'Domiciliario activado.',
  deactivated: deactivationNotice,
  loading: 'Cargando domiciliarios',
  empty: 'Todavía no hay domiciliarios. Crea el primero con «Nuevo domiciliario».',
  meta: (account) => `@${account.usuario} · ${pluralize(account.pedidosActivos, 'pedido activo', 'pedidos activos')}`,
};

export const ADMIN_TEAM = {
  titleId: 'admins-title',
  title: 'Administradores',
  description: 'Encargados que pueden crear y asignar pedidos. Solo tu cuenta principal gestiona esta lista.',
  newLabel: 'Nuevo administrador',
  created: 'Administrador creado.',
  activated: 'Administrador activado.',
  deactivated: () => 'Administrador desactivado.',
  loading: 'Cargando administradores',
  empty: 'Todavía no hay otros administradores. Crea uno con «Nuevo administrador».',
  meta: (account) => `@${account.usuario}${account.principal ? ' · Cuenta principal' : ''}`,
};

export function TeamSection({ config, api, active = true }) {
  const [accounts, setAccounts] = useState(null);
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
      setAccounts(await api.list());
      setLoadError('');
    } catch (error) {
      if (error.status !== 401) setLoadError(error.message);
    }
  }, [api]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  function replace(updated) {
    setAccounts((previous) => previous.map((account) => (account.id === updated.id ? updated : account)));
  }

  async function create(event) {
    event.preventDefault();
    const nextErrors = validate(draft, { withProfile: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const created = await api.create({ ...draft, nombre: draft.nombre.trim() });
      setAccounts((previous) => [...(previous ?? []), created].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      setNotice(config.created);
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

  async function toggle(account) {
    setBusyId(account.id);
    setNotice('');
    try {
      const updated = await api.setActive(account.id, !account.activo);
      replace(updated);
      setNotice(updated.activo ? config.activated : config.deactivated(updated));
    } catch (error) {
      setNotice(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function savePassword(event, account) {
    event.preventDefault();
    const nextErrors = validate({ password: newPassword }, { withProfile: false });
    setErrors(nextErrors);
    if (nextErrors.password) return;
    setBusyId(account.id);
    try {
      replace(await api.resetPassword(account.id, newPassword));
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
    <section className="management-section" aria-labelledby={config.titleId}>
      <div className="management-heading">
        <div>
          <h2 id={config.titleId}>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        {!draft && (
          <button className="btn-primary" type="button" onClick={() => { setDraft(EMPTY_DRAFT); setErrors({}); setNotice(''); }}>
            {config.newLabel}
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
          <h3 id={formTitleId}>{config.newLabel}</h3>
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

      {!accounts && !loadError && <div className="skeleton" aria-busy="true" aria-label={config.loading}><Spinner size="lg" label={`${config.loading}…`} /><div className="skeleton-card" /><div className="skeleton-card" /></div>}

      {accounts && !accounts.length && (
        <p className="card management-empty"><img className="empty-logo" src="/icons/logo.svg" alt="" />{config.empty}</p>
      )}

      <ul className="management-list">
        {(accounts ?? []).map((account) => {
          const busy = busyId === account.id;
          return (
            <li key={account.id} className={`card management-item${account.activo ? '' : ' management-item--muted'}`} aria-busy={busy}>
              <div className="management-item-copy">
                <h3>{account.nombre}</h3>
                <p>{config.meta(account)}</p>
                <span className={`status-badge status-badge--${account.activo ? 'done' : 'cancelled'}`}>
                  {account.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {!account.principal && (
                <div className="management-item-actions">
                  <button type="button" className="btn-secondary" disabled={busy} onClick={() => toggle(account)}>
                    {account.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  {passwordFor !== account.id && (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => { setPasswordFor(account.id); setNewPassword(''); setErrors({}); }}
                    >
                      Cambiar contraseña
                    </button>
                  )}
                </div>
              )}
              {passwordFor === account.id && (
                <form className="courier-password" onSubmit={(event) => savePassword(event, account)} noValidate>
                  <ManagementField
                    label={`Nueva contraseña para ${account.nombre}`}
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

import { useCallback, useEffect, useId, useState } from 'react';
import { couriersApi, ordersApi } from '../../api/client.js';
import { ManagementField } from '../ManagementField.jsx';

export const STATUS = {
  PENDIENTE: { label: 'Pendiente', tone: 'pending' },
  ASIGNADO: { label: 'Asignado', tone: 'assigned' },
  EN_CAMINO: { label: 'En camino', tone: 'transit' },
  ENTREGADO: { label: 'Entregado', tone: 'done' },
  CANCELADO: { label: 'Cancelado', tone: 'cancelled' },
};

const OPEN = new Set(['PENDIENTE', 'ASIGNADO', 'EN_CAMINO']);
const ASSIGNABLE = new Set(['PENDIENTE', 'ASIGNADO']);

const FILTERS = [
  { id: 'activos', label: 'Activos', match: (order) => OPEN.has(order.estado) },
  { id: 'entregados', label: 'Entregados', match: (order) => order.estado === 'ENTREGADO' },
  { id: 'cancelados', label: 'Cancelados', match: (order) => order.estado === 'CANCELADO' },
  { id: 'todos', label: 'Todos', match: () => true },
];

/** Siguiente paso permitido; el servidor vuelve a validar cada transición. */
const NEXT = {
  ASIGNADO: { estado: 'EN_CAMINO', admin: 'Marcar en camino', courier: 'Voy en camino' },
  EN_CAMINO: { estado: 'ENTREGADO', admin: 'Marcar entregado', courier: 'Marcar entregado' },
};

const EMPTY_DRAFT = { cliente: '', telefono: '', direccion: '', detalle: '', totalCop: '', domiciliarioId: '' };
const POLL_MS = 30000;
const currency = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' });

function mapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function validate(draft) {
  const errors = {};
  if (!draft.cliente.trim()) errors.cliente = 'Escribe el nombre del cliente.';
  if (!/^[0-9 +()-]{7,20}$/.test(draft.telefono.trim())) errors.telefono = 'Usa de 7 a 20 dígitos.';
  if (!draft.direccion.trim()) errors.direccion = 'Escribe la dirección.';
  if (!draft.detalle.trim()) errors.detalle = 'Describe el pedido.';
  const total = Number(draft.totalCop.replace(/\D/g, ''));
  if (!total) errors.totalCop = 'Escribe el total en pesos (mayor que 0).';
  return { errors, total };
}

/**
 * Pedidos. Administrador: crea, asigna, avanza y cancela. Domiciliario:
 * ve solo los suyos y los marca «en camino» y «entregado». Se actualiza
 * cada 30 s mientras la vista está abierta y la pestaña visible.
 */
export function Orders({ user, active = true }) {
  const isAdmin = user.role === 'ADMIN';
  const [orders, setOrders] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('activos');
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [notice, setNotice] = useState('');
  const formTitleId = useId();

  const load = useCallback(async () => {
    try {
      const [list, team] = await Promise.all([
        ordersApi.list(),
        isAdmin ? couriersApi.list() : Promise.resolve([]),
      ]);
      setOrders(list);
      setCouriers(team);
      setLoadError('');
    } catch (error) {
      if (error.status !== 401) setLoadError(error.message);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!active) return undefined;
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [active, load]);

  async function run(id, request, success) {
    setBusyId(id);
    setNotice('');
    try {
      const updated = await request();
      setOrders((previous) => previous.map((order) => (order.id === updated.id ? updated : order)));
      setNotice(success(updated));
    } catch (error) {
      setNotice(error.message);
      if (error.status === 409 || error.status === 404) load();
    } finally {
      setBusyId(null);
      setConfirmCancel(null);
    }
  }

  async function save(event) {
    event.preventDefault();
    const { errors: nextErrors, total } = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const body = {
        cliente: draft.cliente.trim(),
        telefono: draft.telefono.trim(),
        direccion: draft.direccion.trim(),
        detalle: draft.detalle.trim(),
        totalCop: total,
        domiciliarioId: draft.domiciliarioId || null,
      };
      if (draft.id) {
        const updated = await ordersApi.update(draft.id, body);
        setOrders((previous) => previous.map((order) => (order.id === updated.id ? updated : order)));
        setNotice(`Pedido de ${updated.cliente} actualizado.`);
      } else {
        const created = await ordersApi.create(body);
        setOrders((previous) => [created, ...(previous ?? [])]);
        setFilter('activos');
        setNotice(`Pedido de ${created.cliente} creado (${STATUS[created.estado].label.toLowerCase()}).`);
      }
      setDraft(null);
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  const change = (key) => (event) => setDraft({ ...draft, [key]: event.target.value });
  const activeCouriers = couriers.filter((courier) => courier.activo);
  const current = FILTERS.find((item) => item.id === filter);
  const visible = (orders ?? []).filter(current.match);
  const totalPreview = Number((draft?.totalCop ?? '').replace(/\D/g, ''));

  return (
    <section className="management-section" aria-labelledby="orders-title">
      <div className="management-heading">
        <div>
          <h2 id="orders-title">{isAdmin ? 'Pedidos' : 'Mis pedidos'}</h2>
          <p>{isAdmin ? 'Crea pedidos, asígnalos y sigue cada entrega.' : 'Pedidos que tienes asignados.'}</p>
        </div>
        <div className="management-actions management-actions--compact">
          {isAdmin && !draft && (
            <button className="btn-primary" type="button" onClick={() => { setDraft(EMPTY_DRAFT); setErrors({}); setNotice(''); }}>
              Nuevo pedido
            </button>
          )}
          <button className="btn-secondary" type="button" onClick={load}>Actualizar</button>
        </div>
      </div>

      <p role="status" className="management-notice">{notice}</p>

      {draft && (
        <form className="card management-form" onSubmit={save} noValidate aria-labelledby={formTitleId}>
          <h3 id={formTitleId}>{draft.id ? 'Editar pedido' : 'Nuevo pedido'}</h3>
          <ManagementField label="Cliente" autoFocus maxLength={80} autoComplete="off" value={draft.cliente} onChange={change('cliente')} error={errors.cliente} />
          <ManagementField label="Teléfono" type="tel" inputMode="tel" maxLength={20} autoComplete="off" value={draft.telefono} onChange={change('telefono')} error={errors.telefono} />
          <ManagementField label="Dirección" maxLength={160} autoComplete="off" value={draft.direccion} onChange={change('direccion')} error={errors.direccion} />
          <ManagementField label="Detalle del pedido" multiline rows={3} maxLength={500} value={draft.detalle} onChange={change('detalle')} error={errors.detalle} />
          <ManagementField
            label="Total (COP)"
            inputMode="numeric"
            autoComplete="off"
            value={draft.totalCop}
            onChange={change('totalCop')}
            error={errors.totalCop}
            hint={totalPreview ? `$${currency.format(totalPreview)}` : 'Solo números, sin puntos.'}
          />
          {!draft.id && <div className="management-field">
            <label htmlFor="order-courier">Domiciliario (opcional)</label>
            <select id="order-courier" value={draft.domiciliarioId} onChange={change('domiciliarioId')}>
              <option value="">Sin asignar por ahora</option>
              {activeCouriers.map((courier) => (
                <option key={courier.id} value={courier.id}>{courier.nombre}</option>
              ))}
            </select>
            {isAdmin && !activeCouriers.length && (
              <p className="management-hint">Aún no hay domiciliarios activos. Créalos en «Domicilios».</p>
            )}
          </div>}
          <div className="management-actions">
            <button className="btn-primary" type="submit" disabled={saving} aria-busy={saving}>
              {saving ? 'Guardando…' : 'Guardar pedido'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setDraft(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="filter-chips" role="group" aria-label="Filtrar pedidos">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="filter-chip"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            {orders && <span className="filter-chip-count">{orders.filter(item.match).length}</span>}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="card error-card" role="alert">
          <p>{loadError}</p>
          <div className="error-actions"><button className="btn-primary" type="button" onClick={load}>Reintentar</button></div>
        </div>
      )}

      {!orders && !loadError && <div className="skeleton" aria-busy="true" aria-label="Cargando pedidos"><div className="skeleton-card" /><div className="skeleton-card" /></div>}

      {orders && !visible.length && (
        <p className="card management-empty">
          {isAdmin
            ? `No hay pedidos en «${current.label}».`
            : 'No tienes pedidos en esta lista. Se actualiza sola cada 30 segundos.'}
        </p>
      )}

      <ul className="management-list">
        {visible.map((order) => {
          const status = STATUS[order.estado];
          const next = NEXT[order.estado];
          const busy = busyId === order.id;
          return (
            <li key={order.id} className={`card order-card order-card--${status.tone}`} aria-busy={busy}>
              <div className="order-head">
                <h3>{order.cliente}</h3>
                <span className={`status-badge status-badge--${status.tone}`}>{status.label}</span>
              </div>
              <p className="order-detail">{order.detalle}</p>
              <dl className="order-meta">
                <div>
                  <dt>Dirección</dt>
                  <dd>
                    {order.direccion}{' '}
                    <a href={mapsUrl(order.direccion)} target="_blank" rel="noopener noreferrer">Ver en mapa</a>
                  </dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd><a href={`tel:${order.telefono.replace(/[^0-9+]/g, '')}`}>{order.telefono}</a></dd>
                </div>
                <div><dt>Total</dt><dd className="order-total">${currency.format(order.totalCop)}</dd></div>
                {isAdmin && <div><dt>Domiciliario</dt><dd>{order.domiciliarioNombre ?? 'Sin asignar'}</dd></div>}
                <div><dt>Creado</dt><dd>{dateTime.format(new Date(order.creadoEn))}</dd></div>
              </dl>

              <div className="order-actions">
                {isAdmin && ASSIGNABLE.has(order.estado) && (
                  <div className="management-field order-assign">
                    <label htmlFor={`assign-${order.id}`}>Asignar a</label>
                    <select
                      id={`assign-${order.id}`}
                      value={order.domiciliarioId ?? ''}
                      disabled={busy}
                      onChange={(event) => run(
                        order.id,
                        () => ordersApi.assign(order.id, event.target.value || null),
                        (updated) => updated.domiciliarioNombre
                          ? `Pedido de ${updated.cliente} asignado a ${updated.domiciliarioNombre}.`
                          : `Pedido de ${updated.cliente} sin asignar.`,
                      )}
                    >
                      <option value="">Sin asignar</option>
                      {activeCouriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>{courier.nombre}</option>
                      ))}
                      {order.domiciliarioId && !activeCouriers.some((courier) => courier.id === order.domiciliarioId) && (
                        <option value={order.domiciliarioId} disabled>{order.domiciliarioNombre} (inactivo)</option>
                      )}
                    </select>
                  </div>
                )}
                {next && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => run(
                      order.id,
                      () => ordersApi.setStatus(order.id, next.estado),
                      (updated) => `Pedido de ${updated.cliente}: ${STATUS[updated.estado].label.toLowerCase()}.`,
                    )}
                  >
                    {isAdmin ? next.admin : next.courier}
                  </button>
                )}
                {isAdmin && OPEN.has(order.estado) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    aria-label={`Editar pedido de ${order.cliente}`}
                    onClick={() => {
                      setDraft({
                        id: order.id,
                        cliente: order.cliente,
                        telefono: order.telefono,
                        direccion: order.direccion,
                        detalle: order.detalle,
                        totalCop: String(order.totalCop),
                        domiciliarioId: order.domiciliarioId ?? '',
                      });
                      setErrors({});
                      setNotice('');
                    }}
                  >
                    Editar
                  </button>
                )}
                {isAdmin && OPEN.has(order.estado) && (confirmCancel === order.id ? (
                  <div className="order-confirm" role="group" aria-label={`Confirmar cancelación del pedido de ${order.cliente}`}>
                    <span>¿Cancelar este pedido?</span>
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={busy}
                      onClick={() => run(
                        order.id,
                        () => ordersApi.setStatus(order.id, 'CANCELADO'),
                        (updated) => `Pedido de ${updated.cliente} cancelado.`,
                      )}
                    >
                      Sí, cancelar
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setConfirmCancel(null)}>No</button>
                  </div>
                ) : (
                  <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirmCancel(order.id)}>
                    Cancelar pedido
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

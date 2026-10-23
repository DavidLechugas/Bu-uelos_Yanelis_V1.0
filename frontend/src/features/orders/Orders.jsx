import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { couriersApi, ordersApi } from '../../api/client.js';
import { CardsViewIcon, ChatIcon, GridViewIcon, ListViewIcon, MapPinIcon, PhoneIcon } from '../../components/icons.jsx';
import { ManagementField } from '../ManagementField.jsx';
import { Toast, useNotice } from '../feedback/Toast.jsx';
import { SAVE_DONE_MS, pause } from '../feedback/timing.js';
import { composeDetail, itemsTotal } from './orderItems.js';
import { DATE_RANGES, matchesDate, matchesSearch, timeAgo } from './orderTime.js';
import { ProductPicker } from './ProductPicker.jsx';

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

const NEXT = {
  ASIGNADO: { estado: 'EN_CAMINO', admin: 'Marcar en camino', courier: 'Voy en camino' },
  EN_CAMINO: { estado: 'ENTREGADO', admin: 'Marcar entregado', courier: 'Marcar entregado' },
};

const VIEWS = [
  { id: 'tarjetas', label: 'Tarjetas', Icon: CardsViewIcon },
  { id: 'lista', label: 'Lista compacta', Icon: ListViewIcon },
  { id: 'mosaico', label: 'Mosaico', Icon: GridViewIcon },
];
const VIEW_KEY = 'bunuelos.orders.view';

function readView() {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    return VIEWS.some((view) => view.id === saved) ? saved : 'tarjetas';
  } catch {
    return 'tarjetas';
  }
}

const EMPTY_DRAFT = { tipo: 'DOMICILIO', cliente: '', telefono: '', direccion: '', detalle: '', totalCop: '', domiciliarioId: '', items: [], baseTotal: 0 };
const MAX_DETAIL = 500;
const POLL_MS = 10000;
const CLOCK_MS = 30000;
const COURIERS_EVERY = 6;
const shortId = (id) => `#${String(id).slice(-6).toUpperCase()}`;
const courierCell = (order) => (isLocal(order) ? 'No' : order.domiciliarioNombre ?? 'Sin asignar');

const currency = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bogota' });

function mapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Número solo con dígitos; los de 10 cifras llevan el prefijo de Colombia (57). */
export function whatsappUrl(phone) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? `57${digits}` : digits}`;
}

const CONTACTABLE = new Set(['PENDIENTE', 'ASIGNADO', 'EN_CAMINO']);

const isLocal = (order) => order.tipo === 'LOCAL';
const isAvailable = (order) => order.estado === 'PENDIENTE' && !order.domiciliarioId && !isLocal(order);

function validate(draft) {
  const errors = {};
  if (draft.tipo !== 'LOCAL') {
    if (!draft.cliente.trim()) errors.cliente = 'Escribe el nombre del cliente.';
    if (!/^[0-9 +()-]{7,20}$/.test(draft.telefono.trim())) errors.telefono = 'Usa de 7 a 20 dígitos.';
    if (!draft.direccion.trim()) errors.direccion = 'Escribe la dirección.';
  }
  const detalle = composeDetail(draft.items, draft.detalle);
  if (!detalle) errors.detalle = 'Añade productos o describe el pedido.';
  else if (detalle.length > MAX_DETAIL) errors.detalle = `El detalle es demasiado largo (máximo ${MAX_DETAIL} caracteres).`;
  const total = Number(draft.totalCop.replace(/\D/g, ''));
  if (!total) errors.totalCop = 'Escribe el total en pesos (mayor que 0).';
  return { errors, total, detalle };
}

export function Orders({ user, active = true }) {
  const isAdmin = user.role === 'ADMIN';
  const [orders, setOrders] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('activos');
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState('');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('todas');
  const [view, setView] = useState(readView);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [notice, setNotice] = useNotice();

  const inFlight = useRef(false);
  const ticks = useRef(0);

  /**
   * `quiet` = refresco automático: no repite una petición en curso, no pide el
   * equipo en cada vuelta y no vuelve a pintar la lista si no cambió nada.
   */
  const load = useCallback(async ({ quiet = false } = {}) => {
    if (quiet && inFlight.current) return;
    inFlight.current = true;
    try {
      const withTeam = isAdmin && (!quiet || ticks.current % COURIERS_EVERY === 0);
      const [list, team] = await Promise.all([
        ordersApi.list(),
        withTeam ? couriersApi.list() : Promise.resolve(null),
      ]);
      setOrders((previous) => (previous && JSON.stringify(previous) === JSON.stringify(list) ? previous : list));
      if (team) setCouriers(team);
      setLoadError('');
    } catch (error) {
      if (error.status !== 401 && !quiet) setLoadError(error.message);
    } finally {
      inFlight.current = false;
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!active) return undefined;
    ticks.current = 0;
    load();
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      ticks.current += 1;
      load({ quiet: true });
    };
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [active, load]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => clearInterval(timer);
  }, [active]);

  async function run(id, request, success) {
    setBusyId(id);
    setNotice('');
    try {
      const updated = await request();
      setOrders((previous) => previous.map((order) => (order.id === updated.id ? updated : order)));
      setNotice(success(updated));
    } catch (error) {
      setNotice(error.message, 'error');
      if (error.status === 409 || error.status === 404) load();
    } finally {
      setBusyId(null);
      setConfirmCancel(null);
    }
  }

  async function save(event) {
    event.preventDefault();
    const { errors: nextErrors, total, detalle } = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const local = draft.tipo === 'LOCAL';
      const body = {
        tipo: draft.tipo,
        cliente: local ? null : draft.cliente.trim(),
        telefono: local ? null : draft.telefono.trim(),
        direccion: local ? null : draft.direccion.trim(),
        detalle,
        totalCop: total,
        domiciliarioId: local ? null : draft.domiciliarioId || null,
      };
      if (draft.id) {
        const updated = await ordersApi.update(draft.id, body);
        setOrders((previous) => previous.map((order) => (order.id === updated.id ? updated : order)));
        setNotice('Pedido actualizado.');
      } else {
        const created = await ordersApi.create(body);
        setOrders((previous) => [created, ...(previous ?? [])]);
        setFilter(local ? 'todos' : 'activos');
        setNotice(local ? 'Venta registrada.' : 'Pedido hecho correctamente.');
      }
      setSaved(draft.id ? '¡Pedido actualizado!' : local ? '¡Venta registrada!' : '¡Pedido enviado!');
      await pause(SAVE_DONE_MS);
      setSaved('');
      setDraft(null);
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const change = (key) => (event) => setDraft({ ...draft, [key]: event.target.value });
  const changeItems = (items) => {
    const total = draft.baseTotal + itemsTotal(items);
    setDraft({ ...draft, items, totalCop: total ? String(total) : '' });
  };
  const activeCouriers = couriers.filter((courier) => courier.activo);
  const changeView = (next) => {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* sin almacenamiento: solo no se recuerda */ }
  };
  const current = FILTERS.find((item) => item.id === filter);
  const available = isAdmin ? [] : (orders ?? []).filter(isAvailable);
  const mine = isAdmin ? (orders ?? []) : (orders ?? []).filter((order) => !isAvailable(order));
  const visible = mine
    .filter(current.match)
    .filter((order) => matchesDate(order, range, now) && matchesSearch(order, search));
  const showActions = visible.some((order) => NEXT[order.estado] || (isAdmin && OPEN.has(order.estado)));
  const narrowed = search.trim() !== '' || range !== 'todas';
  const totalPreview = Number((draft?.totalCop ?? '').replace(/\D/g, ''));

  const renderActions = (order, busy, next) => (
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
                ? 'Pedido asignado.'
                : 'Pedido sin asignar.',
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
            (updated) => `Pedido ${STATUS[updated.estado].label.toLowerCase()}.`,
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
              items: [],
              baseTotal: order.totalCop,
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
              () => 'Pedido cancelado.',
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
  );

  return (
    <section className="management-section" aria-labelledby="orders-title">
      <div className="management-heading">
        <div>
          <h2 id="orders-title">{isAdmin ? 'Pedidos' : 'Mis pedidos'}</h2>
          <p>{isAdmin ? 'Crea pedidos, asígnalos y sigue cada entrega.' : 'Pedidos que tienes asignados y los que puedes tomar.'}</p>
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

      <Toast notice={notice} onClose={() => setNotice('')} />

      <Modal
        open={Boolean(draft)}
        title={draft?.id ? 'Editar pedido' : draft?.tipo === 'LOCAL' ? 'Venta en local' : 'Nuevo pedido'}
        onClose={() => { if (!saving) setDraft(null); }}
      >
        {draft && saved && (
          <div className="management-form--done">
            <Spinner size="md" done label={saved} />
          </div>
        )}

        {draft && !saved && (
          <form className="management-form" onSubmit={save} noValidate aria-label={draft.id ? 'Editar pedido' : 'Pedido nuevo'}>
            {!draft.id && (
              <label className="order-local-toggle">
                <input
                  type="checkbox"
                  checked={draft.tipo === 'LOCAL'}
                  onChange={(event) => setDraft({ ...draft, tipo: event.target.checked ? 'LOCAL' : 'DOMICILIO', domiciliarioId: '' })}
                />
                <span>Venta en local<small>Se registra como entregada, sin cliente ni domiciliario.</small></span>
              </label>
            )}
            {draft.tipo !== 'LOCAL' && (
              <>
                <ManagementField label="Cliente" autoFocus maxLength={80} autoComplete="off" value={draft.cliente} onChange={change('cliente')} error={errors.cliente} />
                <ManagementField label="Teléfono" type="tel" inputMode="tel" maxLength={20} autoComplete="off" value={draft.telefono} onChange={change('telefono')} error={errors.telefono} />
                <ManagementField label="Dirección" wide maxLength={160} autoComplete="off" value={draft.direccion} onChange={change('direccion')} error={errors.direccion} />
              </>
            )}
            <ProductPicker items={draft.items} onChange={changeItems} active={active} />
            <ManagementField
              label="Notas o detalle del pedido"
              multiline
              rows={3}
              maxLength={MAX_DETAIL}
              value={draft.detalle}
              onChange={change('detalle')}
              error={errors.detalle}
              hint="Opcional si añadiste productos (ej. «sin azúcar»)."
            />
            <ManagementField
              label="Total (COP)"
              inputMode="numeric"
              autoComplete="off"
              value={draft.totalCop}
              onChange={change('totalCop')}
              error={errors.totalCop}
              hint={totalPreview ? `$${currency.format(totalPreview)}` : 'Se calcula con los productos; también puedes escribirlo.'}
            />
            {!draft.id && draft.tipo !== 'LOCAL' && <div className="management-field">
              <label htmlFor="order-courier">Domiciliario (opcional)</label>
              <select id="order-courier" value={draft.domiciliarioId} onChange={change('domiciliarioId')}>
                <option value="">Sin asignar: lo toma el primero que llegue</option>
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
                {saving ? 'Guardando…' : draft.tipo === 'LOCAL' ? 'Registrar venta' : 'Guardar pedido'}
              </button>
              <button className="btn-secondary" type="button" onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </form>
        )}
      </Modal>

      {available.length > 0 && (
        <section className="order-available" aria-labelledby="available-title">
          <h3 id="available-title">Disponibles<span className="filter-chip-count">{available.length}</span></h3>
          <p className="management-hint">El primero que toque «Tomar pedido» se lo queda.</p>
          <ul className="management-list">
            {available.map((order) => (
              <li key={order.id} className="card order-card order-card--pending" aria-busy={busyId === order.id}>
                <div className="order-head">
                  <h3>{order.cliente}</h3>
                  <span className="status-badge status-badge--pending">Disponible</span>
                </div>
                <p className="order-detail">{order.detalle}</p>
                <dl className="order-meta">
                  <div><dt>Dirección</dt><dd>{order.direccion}</dd></div>
                  <div><dt>Total</dt><dd className="order-total">${currency.format(order.totalCop)}</dd></div>
                  <div><dt>Creado</dt><dd><time dateTime={order.creadoEn} title={dateTime.format(new Date(order.creadoEn))}>{timeAgo(order.creadoEn, now)}</time></dd></div>
                </dl>
                <div className="order-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busyId === order.id}
                    onClick={() => run(order.id, () => ordersApi.claim(order.id), () => 'Pedido tomado.')}
                  >
                    Tomar pedido
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="orders-controls">
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
            {orders && <span className="filter-chip-count">{mine.filter(item.match).length}</span>}
          </button>
        ))}
      </div>
        <div className="order-find">
          <ManagementField
            label="Buscar pedidos"
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="Buscar por cliente, teléfono o dirección"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="management-field order-find-date">
            <label htmlFor="order-range">Fecha</label>
            <select id="order-range" value={range} onChange={(event) => setRange(event.target.value)}>
              {DATE_RANGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          <div className="view-switch" role="group" aria-label="Vista de los pedidos">
            {VIEWS.map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-pressed={view === id} aria-label={label} title={label} onClick={() => changeView(id)}>
                <Icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="card error-card" role="alert">
          <p>{loadError}</p>
          <div className="error-actions"><button className="btn-primary" type="button" onClick={load}>Reintentar</button></div>
        </div>
      )}

      {!orders && !loadError && <div className="skeleton" aria-busy="true" aria-label="Cargando pedidos"><Spinner size="lg" label="Cargando pedidos…" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}

      {orders && !visible.length && (
        <p className="card management-empty">
          <img className="empty-logo" src="/icons/logo.svg" alt="" />
          {narrowed
            ? 'Ningún pedido coincide con la búsqueda o la fecha.'
            : isAdmin
              ? `No hay pedidos en «${current.label}».`
              : 'No tienes pedidos en esta lista. Los nuevos aparecen solos en «Disponibles».'}
        </p>
      )}

      {view === 'lista' && visible.length > 0 && (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <caption className="visually-hidden">Pedidos</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Cliente</th>
                <th scope="col">Productos</th>
                <th scope="col" className="num">Total</th>
                <th scope="col">Fecha</th>
                <th scope="col">Domicilio</th>
                <th scope="col">Estado</th>
                {showActions && <th scope="col">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => {
                const status = STATUS[order.estado];
                return (
                  <tr key={order.id} className={`order-row--${status.tone}`}>
                    <td className="mono">{shortId(order.id)}</td>
                    <th scope="row">{order.cliente}</th>
                    <td className="wide">{order.detalle}</td>
                    <td className="num">${currency.format(order.totalCop)}</td>
                    <td><time dateTime={order.creadoEn}>{dateTime.format(new Date(order.creadoEn))}</time></td>
                    <td>{courierCell(order)}</td>
                    <td><span className={`status-badge status-badge--${status.tone}`}>{isLocal(order) ? 'Local' : status.label}</span></td>
                    {showActions && <td className="actions">{renderActions(order, busyId === order.id, NEXT[order.estado])}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view !== 'lista' && (
      <ul className={`management-list orders-view--${view}`}>
        {visible.map((order) => {
          const status = STATUS[order.estado];
          const next = NEXT[order.estado];
          const busy = busyId === order.id;
          return (
            <li key={order.id} className={`card order-card order-card--${status.tone}`} aria-busy={busy}>
              <div className="order-head">
                <h3>{order.cliente}</h3>
                <span className={`status-badge status-badge--${status.tone}`}>{isLocal(order) ? 'Local' : status.label}</span>
              </div>
              <p className="order-detail">{order.detalle}</p>
              <dl className="order-meta">
                {!isLocal(order) && (
                  <>
                    <div className="meta-extra">
                      <dt>Dirección</dt>
                      <dd>{order.direccion}</dd>
                    </div>
                    <div className="meta-extra">
                      <dt>Teléfono</dt>
                      <dd>{order.telefono}</dd>
                    </div>
                  </>
                )}
                <div><dt>Total</dt><dd className="order-total">${currency.format(order.totalCop)}</dd></div>
                {isAdmin && !isLocal(order) && <div className="meta-extra"><dt>Domiciliario</dt><dd>{order.domiciliarioNombre ?? 'Sin asignar'}</dd></div>}
                <div><dt>Creado</dt><dd><time dateTime={order.creadoEn} title={dateTime.format(new Date(order.creadoEn))}>{timeAgo(order.creadoEn, now)}</time></dd></div>
              </dl>

              {CONTACTABLE.has(order.estado) && !isLocal(order) && (
                <div className="order-contact">
                  <a className="btn-secondary" href={`tel:${order.telefono.replace(/[^0-9+]/g, '')}`} aria-label={`Llamar a ${order.cliente}`}>
                    <PhoneIcon size={18} /> Llamar
                  </a>
                  <a className="btn-secondary" href={whatsappUrl(order.telefono)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp a ${order.cliente}`}>
                    <ChatIcon size={18} /> WhatsApp
                  </a>
                  <a className="btn-secondary" href={mapsUrl(order.direccion)} target="_blank" rel="noopener noreferrer" aria-label={`Abrir la dirección de ${order.cliente} en Maps`}>
                    <MapPinIcon size={18} /> Maps
                  </a>
                </div>
              )}

              {renderActions(order, busy, next)}
            </li>
          );
        })}
      </ul>
      )}
    </section>
  );
}

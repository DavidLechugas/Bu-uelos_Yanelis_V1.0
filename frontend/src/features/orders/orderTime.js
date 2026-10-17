/** Tiempo relativo, búsqueda y filtro por fecha de la lista de pedidos (hora de Bogotá). */

const bogotaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' });
const DAY_MS = 24 * 60 * 60 * 1000;

/** «hace 12 min», «hace 3 h», «hace 2 d». */
export function timeAgo(iso, now = Date.now()) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'hace menos de 1 min';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

export const DATE_RANGES = [
  { id: 'todas', label: 'Todas las fechas' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'ayer', label: 'Ayer' },
  { id: 'semana', label: 'Últimos 7 días' },
];

/** `range`: todas | hoy | ayer | semana, según el día de creación en Bogotá. */
export function matchesDate(order, range, now = Date.now()) {
  if (range === 'todas') return true;
  const created = bogotaDay.format(new Date(order.creadoEn));
  if (range === 'hoy') return created === bogotaDay.format(new Date(now));
  if (range === 'ayer') return created === bogotaDay.format(new Date(now - DAY_MS));
  return created >= bogotaDay.format(new Date(now - 6 * DAY_MS));
}

const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Coincide con cliente, dirección o teléfono (los dígitos, sin espacios ni signos). */
export function matchesSearch(order, query) {
  const text = normalize(query.trim());
  if (!text) return true;
  const digits = text.replace(/\D/g, '');
  return normalize(order.cliente).includes(text)
    || normalize(order.direccion).includes(text)
    || (digits.length > 0 && order.telefono.replace(/\D/g, '').includes(digits));
}

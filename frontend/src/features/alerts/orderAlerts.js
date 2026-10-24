const isLocal = (order) => order.tipo === 'LOCAL';
const isAvailable = (order) => order.estado === 'PENDIENTE' && !order.domiciliarioId && !isLocal(order);

function courierAlerts(before, order, user) {
  const old = before.get(order.id);
  if (isAvailable(order) && !(old && isAvailable(old))) return 'Hay un pedido nuevo disponible.';
  const mine = order.domiciliarioId === user.id;
  const wasMine = old?.domiciliarioId === user.id;
  if (mine && order.estado === 'ASIGNADO' && !wasMine && !(old && isAvailable(old))) return 'Te asignaron un pedido.';
  if (mine && old && order.estado === 'CANCELADO' && old.estado !== 'CANCELADO') return 'Cancelaron uno de tus pedidos.';
  return null;
}

function adminAlerts(before, order) {
  const old = before.get(order.id);
  if (!old) return isLocal(order) ? null : 'Entró un pedido nuevo.';
  if (old.estado === order.estado && old.domiciliarioId === order.domiciliarioId) return null;
  const courier = order.domiciliarioNombre ?? 'Un domiciliario';
  if (order.estado === 'CANCELADO') return 'Se canceló un pedido.';
  if (isLocal(order)) return null;
  if (order.estado === 'ENTREGADO') return `${courier} entregó un pedido.`;
  if (order.estado === 'EN_CAMINO') return `${courier} salió con un pedido.`;
  if (order.estado === 'ASIGNADO' && order.domiciliarioId) return `${courier} tiene un pedido nuevo asignado.`;
  if (order.estado === 'PENDIENTE' && old.domiciliarioId) return 'Un pedido volvió a Pendientes.';
  return null;
}

/** Compara la lista anterior con la nueva y devuelve los avisos para este usuario; sin lista anterior no avisa. */
export function detectAlerts(previous, next, user) {
  if (!previous) return [];
  const before = new Map(previous.map((order) => [order.id, order]));
  const describe = user.role === 'COURIER' ? (order) => courierAlerts(before, order, user) : (order) => adminAlerts(before, order);
  return next.map(describe).filter(Boolean);
}

export function summarize(alerts) {
  return alerts.length === 1 ? alerts[0] : `${alerts.length} novedades en los pedidos.`;
}

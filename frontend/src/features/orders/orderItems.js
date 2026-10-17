/** Líneas del pedido en armado: `{ id, nombre, precio, cantidad }`. */

export function addItem(items, product) {
  if (items.some((item) => item.id === product.id)) return changeQuantity(items, product.id, 1);
  return [...items, { id: product.id, nombre: product.nombre, precio: product.precio, cantidad: 1 }];
}

/** Suma `delta` a la cantidad; la línea desaparece al llegar a 0. */
export function changeQuantity(items, id, delta) {
  return items
    .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
    .filter((item) => item.cantidad > 0);
}

export function removeItem(items, id) {
  return items.filter((item) => item.id !== id);
}

export function itemsTotal(items) {
  return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

/** Texto que se guarda en `detalle`: «2 × Buñuelo, 1 × Natilla — notas». */
export function composeDetail(items, notes) {
  const lines = items.map((item) => `${item.cantidad} × ${item.nombre}`).join(', ');
  return [lines, notes.trim()].filter(Boolean).join(' — ');
}

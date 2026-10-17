import { useEffect, useId, useState } from 'react';
import { productsApi } from '../../api/client.js';
import { addItem, changeQuantity, itemsTotal, removeItem } from './orderItems.js';

const currency = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

/**
 * Catálogo de productos disponibles (un toque suma 1) y resumen del pedido
 * con cantidades. Si el catálogo no carga, el formulario sigue funcionando
 * con detalle y total escritos a mano.
 */
export function ProductPicker({ items, onChange, active = true }) {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const titleId = useId();

  // Se vuelve a pedir cada vez que la vista de Pedidos pasa a ser visible: así
  // los productos creados mientras el formulario seguía abierto aparecen.
  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    productsApi.list().then(
      (list) => { if (!cancelled) { setError(''); setProducts(list.filter((product) => product.disponible)); } },
      (failure) => { if (!cancelled) setError(failure.message); },
    );
    return () => { cancelled = true; };
  }, [active]);

  return (
    <div className="order-picker" role="group" aria-labelledby={titleId}>
      <h4 id={titleId}>Productos</h4>

      {error && <p className="management-hint">No se pudo cargar el catálogo ({error}). Escribe el detalle y el total a mano.</p>}
      {!error && !products && <p className="management-hint">Cargando productos…</p>}
      {products && !products.length && (
        <p className="management-hint">No hay productos disponibles. Escribe el detalle y el total a mano.</p>
      )}

      {Boolean(products?.length) && (
        <div className="picker-catalog">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className="picker-product"
              aria-label={`Añadir ${product.nombre}`}
              onClick={() => onChange(addItem(items, product))}
            >
              <span>{product.nombre}</span>
              <span className="picker-price">${currency.format(product.precio)}</span>
            </button>
          ))}
        </div>
      )}

      {Boolean(products?.length) && (
        <div className="picker-summary">
          <h5>Tu pedido</h5>
          {!items.length && <p className="management-hint">Toca un producto para añadirlo.</p>}
          {Boolean(items.length) && (
            <>
              <ul className="picker-lines">
                {items.map((item) => (
                  <li key={item.id} className="picker-line">
                    <span className="picker-name">{item.nombre}</span>
                    <span className="picker-qty">
                      <button type="button" aria-label={`Quitar una unidad de ${item.nombre}`} onClick={() => onChange(changeQuantity(items, item.id, -1))}>−</button>
                      <output aria-label={`Cantidad de ${item.nombre}`}>{item.cantidad}</output>
                      <button type="button" aria-label={`Sumar una unidad de ${item.nombre}`} onClick={() => onChange(changeQuantity(items, item.id, 1))}>+</button>
                    </span>
                    <span className="picker-subtotal">${currency.format(item.precio * item.cantidad)}</span>
                    <button type="button" className="picker-remove" aria-label={`Quitar ${item.nombre} del pedido`} onClick={() => onChange(removeItem(items, item.id))}>×</button>
                  </li>
                ))}
              </ul>
              <p className="picker-total" role="status">Productos: <strong>${currency.format(itemsTotal(items))}</strong></p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

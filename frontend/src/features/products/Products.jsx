import { useRef, useState } from 'react';
import { ManagementField } from '../ManagementField.jsx';

const INITIAL_PRODUCTS = [
  { id: 'familiar', nombre: 'Combo familiar', descripcion: '24 buñuelos + bebida', precio: 48000, disponible: true },
  { id: 'docena', nombre: 'Docena tradicional', descripcion: '12 buñuelos', precio: 18000, disponible: true },
  { id: 'desayuno', nombre: 'Combo desayuno', descripcion: '6 buñuelos + 2 bebidas', precio: 22000, disponible: true },
];
const currency = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function Products() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const trigger = useRef(null);
  const nameInput = useRef(null);

  function openForm(product, event) {
    trigger.current = event.currentTarget;
    setDraft(product ? { ...product, precio: String(product.precio) } : { nombre: '', descripcion: '', precio: '', disponible: true });
    setErrors({});
    setNotice('');
  }
  function closeForm() {
    setDraft(null);
    trigger.current?.focus();
  }
  function change(key, value) {
    setDraft({ ...draft, [key]: value });
  }
  function save(event) {
    event.preventDefault();
    const next = {};
    if (!draft.nombre.trim()) next.nombre = 'Escribe un nombre.';
    if (!/^\d+$/.test(draft.precio) || !Number.isSafeInteger(Number(draft.precio)) || Number(draft.precio) <= 0) {
      next.precio = 'El precio debe ser un entero positivo en pesos.';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      nameInput.current?.focus();
      return;
    }
    const product = { ...draft, id: draft.id ?? crypto.randomUUID(), nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim(), precio: Number(draft.precio) };
    setProducts(previous => draft.id ? previous.map(item => item.id === draft.id ? product : item) : [...previous, product]);
    setSearch('');
    setNotice('Producto actualizado en la demostración. No se guardó en el servidor.');
    closeForm();
  }

  const filtered = products.filter(item => `${item.nombre} ${item.descripcion}`.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')));
  return (
    <section className="management-section" aria-labelledby="products-title">
      <div className="management-heading">
        <div><h2 id="products-title">Productos</h2><p>Catálogo simple, precios y disponibilidad.</p></div>
        <button className="btn-primary" type="button" onClick={event => openForm(null, event)}>Agregar producto</button>
      </div>
      <p className="demo-notice">Demostración: los cambios duran hasta recargar o cerrar sesión. No se guardan en Atlas ni modifican el tablero.</p>
      <ManagementField label="Buscar productos" type="search" value={search} onChange={event => setSearch(event.target.value)} />
      <p role="status">{notice}</p>
      {draft && (
        <form className="card management-form" onSubmit={save} noValidate aria-labelledby="product-form-title">
          <h3 id="product-form-title">{draft.id ? 'Editar producto' : 'Nuevo producto'}</h3>
          <ManagementField label="Nombre" ref={nameInput} autoFocus maxLength={100} value={draft.nombre} onChange={event => change('nombre', event.target.value)} error={errors.nombre} />
          <ManagementField label="Descripción" maxLength={240} value={draft.descripcion} onChange={event => change('descripcion', event.target.value)} />
          <ManagementField label="Precio (COP)" type="text" inputMode="numeric" value={draft.precio} onChange={event => change('precio', event.target.value)} error={errors.precio} />
          <label className="management-checkbox"><input type="checkbox" checked={draft.disponible} onChange={event => change('disponible', event.target.checked)} />Disponible para venta</label>
          <div className="management-actions"><button className="btn-primary" type="submit">Guardar producto demo</button><button className="btn-secondary" type="button" onClick={closeForm}>Cancelar</button></div>
        </form>
      )}
      {!filtered.length && <p className="card management-empty" role="status">No hay productos que coincidan.</p>}
      <ul className="management-list">
        {filtered.map(item => (
          <li key={item.id} className="card management-item">
            <div className="management-item-copy"><h3>{item.nombre}</h3><p>{item.descripcion}</p><span className="management-availability">{item.disponible ? 'Disponible' : 'No disponible'}</span></div>
            <div className="management-item-actions"><span className="management-price">${currency.format(item.precio)}</span><button className="btn-secondary" type="button" aria-label={`Editar ${item.nombre}`} onClick={event => openForm(item, event)}>Editar</button></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

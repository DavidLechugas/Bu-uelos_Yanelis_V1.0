import { useCallback, useEffect, useRef, useState } from 'react';
import { Spinner } from '../../components/Spinner.jsx';
import { productsApi } from '../../api/client.js';
import { ManagementField } from '../ManagementField.jsx';
import { SAVE_DONE_MS, pause } from '../feedback/timing.js';

const currency = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const EMPTY_DRAFT = { nombre: '', descripcion: '', precio: '', disponible: true };

/** Catálogo guardado en el servidor (solo administrador). */
export function Products({ active = true }) {
  const [products, setProducts] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState('');
  const [notice, setNotice] = useState('');
  const trigger = useRef(null);
  const nameInput = useRef(null);

  const load = useCallback(async () => {
    try {
      setProducts(await productsApi.list());
      setLoadError('');
    } catch (error) {
      if (error.status !== 401) setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  function openForm(product, event) {
    trigger.current = event.currentTarget;
    setDraft(product ? { ...product, precio: String(product.precio) } : EMPTY_DRAFT);
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
  async function save(event) {
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
    const body = {
      nombre: draft.nombre.trim(),
      descripcion: draft.descripcion.trim(),
      precio: Number(draft.precio),
      disponible: draft.disponible,
    };
    setSaving(true);
    try {
      const saved = draft.id ? await productsApi.update(draft.id, body) : await productsApi.create(body);
      setProducts((previous) => (draft.id
        ? previous.map((item) => (item.id === saved.id ? saved : item))
        : [...previous, saved]));
      setSearch('');
      setNotice(`Producto «${saved.nombre}» guardado.`);
      setConfirmed('¡Producto guardado!');
      await pause(SAVE_DONE_MS);
      setConfirmed('');
      closeForm();
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = (products ?? []).filter((item) => `${item.nombre} ${item.descripcion}`.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')));
  return (
    <section className="management-section" aria-labelledby="products-title">
      <div className="management-heading">
        <div><h2 id="products-title">Productos</h2><p>Catálogo simple, precios y disponibilidad.</p></div>
        <button className="btn-primary" type="button" onClick={(event) => openForm(null, event)}>Agregar producto</button>
      </div>
      <ManagementField label="Buscar productos" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
      <p role="status" className="management-notice">{notice}</p>
      {draft && confirmed && (
        <div className="card management-form management-form--done">
          <Spinner size="md" done label={confirmed} />
        </div>
      )}

      {draft && !confirmed && (
        <form className="card management-form" onSubmit={save} noValidate aria-labelledby="product-form-title">
          <h3 id="product-form-title">{draft.id ? 'Editar producto' : 'Nuevo producto'}</h3>
          <ManagementField label="Nombre" ref={nameInput} autoFocus maxLength={100} value={draft.nombre} onChange={(event) => change('nombre', event.target.value)} error={errors.nombre} />
          <ManagementField label="Descripción" maxLength={240} value={draft.descripcion} onChange={(event) => change('descripcion', event.target.value)} error={errors.descripcion} />
          <ManagementField label="Precio (COP)" type="text" inputMode="numeric" value={draft.precio} onChange={(event) => change('precio', event.target.value)} error={errors.precio} />
          <label className="management-checkbox"><input type="checkbox" checked={draft.disponible} onChange={(event) => change('disponible', event.target.checked)} />Disponible para venta</label>
          <div className="management-actions">
            <button className="btn-primary" type="submit" disabled={saving} aria-busy={saving}>{saving ? 'Guardando…' : 'Guardar producto'}</button>
            <button className="btn-secondary" type="button" onClick={closeForm}>Cancelar</button>
          </div>
        </form>
      )}
      {loadError && (
        <div className="card error-card" role="alert">
          <p>{loadError}</p>
          <div className="error-actions"><button className="btn-primary" type="button" onClick={load}>Reintentar</button></div>
        </div>
      )}
      {!products && !loadError && <div className="skeleton" aria-busy="true" aria-label="Cargando productos"><Spinner size="md" /><div className="skeleton-card" /></div>}
      {products && !filtered.length && (
        <p className="card management-empty" role="status">
          {products.length ? 'No hay productos que coincidan.' : 'Aún no hay productos. Pulsa «Agregar producto».'}
        </p>
      )}
      <ul className="management-list">
        {filtered.map((item) => (
          <li key={item.id} className="card management-item">
            <div className="management-item-copy"><h3>{item.nombre}</h3><p>{item.descripcion}</p><span className="management-availability">{item.disponible ? 'Disponible' : 'No disponible'}</span></div>
            <div className="management-item-actions"><span className="management-price">${currency.format(item.precio)}</span><button className="btn-secondary" type="button" aria-label={`Editar ${item.nombre}`} onClick={(event) => openForm(item, event)}>Editar</button></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

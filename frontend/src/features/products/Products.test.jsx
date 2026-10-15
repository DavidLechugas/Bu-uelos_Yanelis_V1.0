import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Products } from './Products.jsx';
import { mockApi } from '../../test/mockApi.js';

const CATALOG = [
  { id: 'p1', nombre: 'Combo familiar', descripcion: '24 buñuelos + bebida', precio: 48000, disponible: true },
  { id: 'p2', nombre: 'Docena tradicional', descripcion: '12 buñuelos', precio: 18000, disponible: false },
];

afterEach(() => vi.unstubAllGlobals());

describe('Productos', () => {
  it('carga el catálogo del servidor y filtra con estado vacío', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/products': { body: CATALOG } });
    render(<Products />);
    expect(await screen.findByText('Combo familiar')).toBeInTheDocument();
    expect(screen.getByText('$48.000')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Buscar productos'), 'docena');
    expect(screen.queryByText('Combo familiar')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Buscar productos'));
    await user.type(screen.getByLabelText('Buscar productos'), 'inexistente');
    expect(screen.getByText('No hay productos que coincidan.')).toBeInTheDocument();
  });

  it('valida, crea y edita guardando en el servidor', async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      'GET /api/products': { body: CATALOG },
      'POST /api/products': (call) => ({ status: 201, body: { id: 'p3', ...call.body } }),
      'PUT /api/products/p1': (call) => ({ body: { id: 'p1', ...call.body } }),
    });
    render(<Products />);
    await screen.findByText('Combo familiar');
    await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }));
    expect(screen.getByText('Escribe un nombre.')).toBeInTheDocument();
    expect(screen.getByText('El precio debe ser un entero positivo en pesos.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nombre'), '  Buñuelo especial  ');
    await user.type(screen.getByLabelText('Descripción'), 'Con queso');
    await user.type(screen.getByLabelText('Precio (COP)'), '3500');
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }));
    expect(await screen.findByText('Buñuelo especial')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST').body).toEqual({ nombre: 'Buñuelo especial', descripcion: 'Con queso', precio: 3500, disponible: true });

    await user.click(screen.getByRole('button', { name: 'Editar Combo familiar' }));
    await user.clear(screen.getByLabelText('Precio (COP)'));
    await user.type(screen.getByLabelText('Precio (COP)'), '50000');
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }));
    expect(await screen.findByText('$50.000')).toBeInTheDocument();
  });

  it('muestra el error del servidor', async () => {
    mockApi({ 'GET /api/products': { status: 500, body: { error: 'Falla del servidor.' } } });
    render(<Products />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Falla del servidor.');
  });
});

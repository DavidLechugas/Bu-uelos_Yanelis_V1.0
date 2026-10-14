import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Orders } from './Orders.jsx';
import { ADMIN, COURIER, mockApi, order } from '../../test/mockApi.js';

const LUIS = { id: 'u-luis', nombre: 'Luis', usuario: 'luis', activo: true, pedidosActivos: 0 };

afterEach(() => vi.unstubAllGlobals());

describe('Orders — administrador', () => {
  it('crea un pedido asignado y lo muestra arriba en Activos', async () => {
    const { calls } = mockApi({
      'GET /api/orders': { body: [] },
      'GET /api/couriers': { body: [LUIS] },
      'POST /api/orders': ({ body }) => ({
        status: 201,
        body: order({ ...body, id: 'o-9', estado: 'ASIGNADO', domiciliarioNombre: 'Luis' }),
      }),
    });
    const user = userEvent.setup();
    render(<Orders user={ADMIN} />);
    await screen.findByText(/No hay pedidos en «Activos»/);

    await user.click(screen.getByRole('button', { name: 'Nuevo pedido' }));
    await user.type(screen.getByLabelText('Cliente'), 'Marta');
    await user.type(screen.getByLabelText('Teléfono'), '3001234567');
    await user.type(screen.getByLabelText('Dirección'), 'Calle 8 #3-10');
    await user.type(screen.getByLabelText('Detalle del pedido'), '6 buñuelos');
    await user.type(screen.getByLabelText('Total (COP)'), '15000');
    expect(screen.getByText('$15.000')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Domiciliario (opcional)'), 'u-luis');
    await user.click(screen.getByRole('button', { name: 'Guardar pedido' }));

    expect(await screen.findByRole('heading', { name: 'Marta' })).toBeInTheDocument();
    expect(screen.getByText('Pedido de Marta creado (asignado).')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST').body).toEqual({
      cliente: 'Marta',
      telefono: '3001234567',
      direccion: 'Calle 8 #3-10',
      detalle: '6 buñuelos',
      totalCop: 15000,
      domiciliarioId: 'u-luis',
    });
  });

  it('valida el formulario antes de enviarlo', async () => {
    const { calls } = mockApi({ 'GET /api/orders': { body: [] }, 'GET /api/couriers': { body: [] } });
    const user = userEvent.setup();
    render(<Orders user={ADMIN} />);
    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }));
    await user.click(screen.getByRole('button', { name: 'Guardar pedido' }));
    expect(screen.getByText('Escribe el nombre del cliente.')).toBeInTheDocument();
    expect(screen.getByText('Escribe el total en pesos (mayor que 0).')).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay domiciliarios activos/)).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('asigna un pedido pendiente desde la lista', async () => {
    const { calls } = mockApi({
      'GET /api/orders': { body: [order()] },
      'GET /api/couriers': { body: [LUIS] },
      'PUT /api/orders/o-1/domiciliario': {
        body: order({ estado: 'ASIGNADO', domiciliarioId: 'u-luis', domiciliarioNombre: 'Luis' }),
      },
    });
    const user = userEvent.setup();
    render(<Orders user={ADMIN} />);
    await user.selectOptions(await screen.findByLabelText('Asignar a'), 'u-luis');
    expect(await screen.findByText('Pedido de Carmen asignado a Luis.')).toBeInTheDocument();
    expect(screen.getByText('Asignado', { selector: '.status-badge' })).toBeInTheDocument();
    expect(calls.at(-1).body).toEqual({ domiciliarioId: 'u-luis' });
  });

  it('pide confirmación antes de cancelar y filtra por estado', async () => {
    mockApi({
      'GET /api/orders': { body: [order(), order({ id: 'o-2', cliente: 'Rosa', estado: 'ENTREGADO' })] },
      'GET /api/couriers': { body: [] },
      'PATCH /api/orders/o-1/estado': { body: order({ estado: 'CANCELADO' }) },
    });
    const user = userEvent.setup();
    render(<Orders user={ADMIN} />);
    expect(await screen.findByRole('heading', { name: 'Carmen' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rosa' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    const confirm = screen.getByRole('group', { name: /Confirmar cancelación/ });
    await user.click(within(confirm).getByRole('button', { name: 'Sí, cancelar' }));
    expect(await screen.findByText('Pedido de Carmen cancelado.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Carmen' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Entregados/ }));
    expect(screen.getByRole('heading', { name: 'Rosa' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cancelados/ }));
    expect(screen.getByRole('heading', { name: 'Carmen' })).toBeInTheDocument();
  });
});

describe('Orders — domiciliario', () => {
  it('avanza su pedido sin opciones de administrador', async () => {
    const assigned = order({ estado: 'ASIGNADO', domiciliarioId: COURIER.id, domiciliarioNombre: 'Luis' });
    const { calls } = mockApi({
      'GET /api/orders': { body: [assigned] },
      'PATCH /api/orders/o-1/estado': ({ body }) => ({ body: { ...assigned, estado: body.estado } }),
    });
    const user = userEvent.setup();
    render(<Orders user={COURIER} />);

    expect(await screen.findByRole('heading', { name: 'Mis pedidos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '300 123 4567' })).toHaveAttribute('href', 'tel:3001234567');
    expect(screen.getByRole('link', { name: 'Ver en mapa' })).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
    expect(screen.queryByRole('button', { name: 'Nuevo pedido' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Asignar a')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voy en camino' }));
    expect(await screen.findByRole('button', { name: 'Marcar entregado' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Marcar entregado' }));
    expect(await screen.findByText('Pedido de Carmen: entregado.')).toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'PATCH').map((call) => call.body.estado)).toEqual(['EN_CAMINO', 'ENTREGADO']);
    expect(calls.some((call) => call.path === '/api/couriers')).toBe(false);
  });

  it('muestra el error del servidor y recarga si el cambio ya no es válido', async () => {
    const assigned = order({ estado: 'ASIGNADO', domiciliarioId: COURIER.id });
    const { calls } = mockApi({
      'GET /api/orders': { body: [assigned] },
      'PATCH /api/orders/o-1/estado': { status: 409, body: { error: 'Ese cambio de estado no está permitido.' } },
    });
    const user = userEvent.setup();
    render(<Orders user={COURIER} />);
    await user.click(await screen.findByRole('button', { name: 'Voy en camino' }));
    expect(await screen.findByText('Ese cambio de estado no está permitido.')).toBeInTheDocument();
    expect(calls.filter((call) => call.path === '/api/orders' && call.method === 'GET')).toHaveLength(2);
  });
});

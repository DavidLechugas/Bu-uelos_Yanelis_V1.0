import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Couriers } from './Couriers.jsx';
import { mockApi } from '../../test/mockApi.js';

const LUIS = { id: 'u-luis', nombre: 'Luis', usuario: 'luis', activo: true, pedidosActivos: 2 };

afterEach(() => vi.unstubAllGlobals());

describe('Couriers', () => {
  it('lista el equipo con su estado y pedidos activos', async () => {
    mockApi({ 'GET /api/couriers': { body: [LUIS] } });
    render(<Couriers />);
    expect(await screen.findByRole('heading', { name: 'Luis' })).toBeInTheDocument();
    expect(screen.getByText('@luis · 2 pedidos activos')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('crea una cuenta con usuario en minúsculas y valida la contraseña', async () => {
    const { calls } = mockApi({
      'GET /api/couriers': { body: [] },
      'POST /api/couriers': ({ body }) => ({
        status: 201,
        body: { id: 'u-ana', nombre: body.nombre, usuario: body.usuario, activo: true, pedidosActivos: 0 },
      }),
    });
    const user = userEvent.setup();
    render(<Couriers />);
    await user.click(await screen.findByRole('button', { name: 'Nuevo domiciliario' }));
    await user.type(screen.getByLabelText('Nombre'), 'Ana María');
    await user.type(screen.getByLabelText('Usuario'), 'Ana Maria');
    expect(screen.getByLabelText('Usuario')).toHaveValue('anamaria');
    await user.type(screen.getByLabelText('Contraseña'), 'corta');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByText('La contraseña debe tener entre 8 y 72 caracteres.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Contraseña'), '-segura');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('heading', { name: 'Ana María' })).toBeInTheDocument();
    expect(screen.getByText(/Entrégale su usuario «anamaria»/)).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST').body).toEqual({
      nombre: 'Ana María',
      usuario: 'anamaria',
      password: 'corta-segura',
    });
  });

  it('muestra el conflicto de usuario duplicado del servidor', async () => {
    mockApi({
      'GET /api/couriers': { body: [LUIS] },
      'POST /api/couriers': { status: 409, body: { error: 'Ese usuario ya existe. Elige otro.' } },
    });
    const user = userEvent.setup();
    render(<Couriers />);
    await user.click(await screen.findByRole('button', { name: 'Nuevo domiciliario' }));
    await user.type(screen.getByLabelText('Nombre'), 'Otro Luis');
    await user.type(screen.getByLabelText('Usuario'), 'luis');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Ese usuario ya existe. Elige otro.')).toBeInTheDocument();
  });

  it('desactiva y cambia la contraseña', async () => {
    const { calls } = mockApi({
      'GET /api/couriers': { body: [LUIS] },
      'PATCH /api/couriers/u-luis/activo': { body: { ...LUIS, activo: false } },
      'PUT /api/couriers/u-luis/password': { body: { ...LUIS, activo: false } },
    });
    const user = userEvent.setup();
    render(<Couriers />);
    await user.click(await screen.findByRole('button', { name: 'Desactivar' }));
    expect(await screen.findByText('Luis ya no puede entrar y se cerraron sus sesiones.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await user.type(screen.getByLabelText('Nueva contraseña para Luis'), 'nueva-clave-1');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByText(/Contraseña de Luis actualizada/)).toBeInTheDocument();
    expect(calls.at(-1).body).toEqual({ password: 'nueva-clave-1' });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Admins } from './Admins.jsx';
import { mockApi } from '../../test/mockApi.js';

const PRINCIPAL = { id: 'a-1', nombre: 'Yanelys', usuario: 'yanelys', activo: true, principal: true };
const HELPER = { id: 'a-2', nombre: 'Encargado', usuario: 'encargado', activo: true, principal: false };

afterEach(() => vi.unstubAllGlobals());

describe('Admins', () => {
  it('marca la cuenta principal y no ofrece acciones sobre ella', async () => {
    mockApi({ 'GET /api/admins': { body: [PRINCIPAL, HELPER] } });
    render(<Admins />);
    expect(await screen.findByText('@yanelys · Cuenta principal')).toBeInTheDocument();
    const principalCard = screen.getByRole('heading', { name: 'Yanelys' }).closest('li');
    expect(within(principalCard).queryByRole('button')).not.toBeInTheDocument();
    const helperCard = screen.getByRole('heading', { name: 'Encargado' }).closest('li');
    expect(within(helperCard).getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  });

  it('crea un administrador y desactiva a otro', async () => {
    const { calls } = mockApi({
      'GET /api/admins': { body: [PRINCIPAL, HELPER] },
      'POST /api/admins': ({ body }) => ({
        status: 201,
        body: { id: 'a-3', nombre: body.nombre, usuario: body.usuario, activo: true, principal: false },
      }),
      'PATCH /api/admins/a-2/activo': { body: { ...HELPER, activo: false } },
    });
    const user = userEvent.setup();
    render(<Admins />);
    await user.click(await screen.findByRole('button', { name: 'Nuevo administrador' }));
    await user.type(screen.getByLabelText('Nombre'), 'Ayudante');
    await user.type(screen.getByLabelText('Usuario'), 'Ayudante');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-larga-1');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('heading', { name: 'Ayudante' })).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST').body).toEqual({
      nombre: 'Ayudante', usuario: 'ayudante', password: 'clave-larga-1',
    });

    const helperCard = screen.getByRole('heading', { name: 'Encargado' }).closest('li');
    await user.click(within(helperCard).getByRole('button', { name: 'Desactivar' }));
    expect(await screen.findByText('Administrador desactivado.')).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login.jsx';
import { ADMIN, mockApi } from '../test/mockApi.js';

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'XSRF-TOKEN=; max-age=0';
});

describe('Login', () => {
  it('muestra marca, campos y botón, sin selector de rol ni aviso de acceso simulado', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByText('Buñuelos Yanelys')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByText(/simulado/i)).not.toBeInTheDocument();
  });

  it('valida campos vacíos sin llamar al servidor', async () => {
    const { fetch } = mockApi({});
    const user = userEvent.setup();
    render(<Login onLogin={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Escribe tu usuario')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu contraseña')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('envía las credenciales con el token CSRF y entrega el usuario del servidor', async () => {
    document.cookie = 'XSRF-TOKEN=token-123';
    const { calls } = mockApi({ 'POST /api/auth/login': { body: { usuario: ADMIN } } });
    const onLogin = vi.fn();
    const user = userEvent.setup();
    render(<Login onLogin={onLogin} />);
    await user.type(screen.getByLabelText('Usuario'), ' yanelys ');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onLogin).toHaveBeenCalledWith(ADMIN);
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/auth/login',
      body: { usuario: 'yanelys', password: 'clave-segura' },
      headers: { 'X-XSRF-TOKEN': 'token-123' },
    });
  });

  it('pide la cookie CSRF antes de entrar si aún no existe', async () => {
    const { calls } = mockApi({
      'GET /api/auth/session': { body: { usuario: null } },
      'POST /api/auth/login': { body: { usuario: ADMIN } },
    });
    const user = userEvent.setup();
    render(<Login onLogin={() => {}} />);
    await user.type(screen.getByLabelText('Usuario'), 'yanelys');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /api/auth/session',
      'POST /api/auth/login',
    ]);
  });

  it('muestra el mensaje del servidor si las credenciales no son válidas', async () => {
    document.cookie = 'XSRF-TOKEN=token-123';
    mockApi({ 'POST /api/auth/login': { status: 401, body: { error: 'Usuario o contraseña incorrectos.' } } });
    const onLogin = vi.fn();
    const user = userEvent.setup();
    render(<Login onLogin={onLogin} />);
    await user.type(screen.getByLabelText('Usuario'), 'yanelys');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.');
    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('muestra la ayuda al pulsar «Necesitas ayuda»', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={() => {}} />);
    const help = screen.getByRole('button', { name: '¿Necesitas ayuda?' });
    await user.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Pide tu usuario y contraseña al administrador/)).toBeInTheDocument();
  });

  it('el ojito muestra y oculta la contraseña', async () => {
    render(<Login onLogin={() => {}} />);
    const user = userEvent.setup();
    const field = screen.getByLabelText('Contraseña');
    await user.type(field, 'mi-clave');
    expect(field).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(field).toHaveAttribute('type', 'text');
    expect(field).toHaveValue('mi-clave');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(field).toHaveAttribute('type', 'password');
  });
});

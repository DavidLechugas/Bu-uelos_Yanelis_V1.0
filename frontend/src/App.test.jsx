import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { ADMIN, COURIER, mockApi, order } from './test/mockApi.js';

const DASHBOARD_DATA = {
  saludo: 'Buenos días, Ana',
  ventasTotales: 428000,
  pedidos: 36,
  alertas: 3,
  entregasActivas: 4,
  inventarioBajo: [],
  ventasUltimos7Dias: [
    { dia: 'Lun', ventas: 52000 },
    { dia: 'Mar', ventas: 61000 },
    { dia: 'Mié', ventas: 47000 },
    { dia: 'Jue', ventas: 58000 },
    { dia: 'Vie', ventas: 72000 },
    { dia: 'Sáb', ventas: 68000 },
    { dia: 'Dom', ventas: 70000 },
  ],
};

function adminRoutes(extra = {}) {
  return {
    'GET /api/auth/session': { body: { usuario: ADMIN } },
    'GET /api/dashboard': { body: DASHBOARD_DATA },
    'GET /api/orders': { body: [order()] },
    'GET /api/couriers': { body: [{ id: 'u-luis', nombre: 'Luis', usuario: 'luis', activo: true, pedidosActivos: 0 }] },
    'POST /api/auth/logout': { status: 204 },
    ...extra,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('App — sesión real y navegación por rol', () => {
  it('sin sesión muestra el login tras consultar al servidor', async () => {
    mockApi({ 'GET /api/auth/session': { body: { usuario: null } } });
    render(<App />);
    expect(screen.getByText('Conectando con el servidor…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('si el servidor no responde, el login explica el problema', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
  });

  it('el administrador entra al tablero y cierra sesión en el servidor', async () => {
    const { calls } = mockApi(adminRoutes());
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Buenos días, Ana')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Perfil de Yanelys' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(within(screen.getByRole('dialog')).getByText('Administrador')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST' && call.path === '/api/auth/logout')).toBe(true);
  });

  it('la barra inferior lleva a Pedidos y Domicilios funcionales', async () => {
    mockApi(adminRoutes());
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buenos días, Ana');

    await user.click(screen.getByRole('button', { name: 'Pedidos' }));
    expect(await screen.findByRole('heading', { name: 'Carmen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo pedido' })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    await user.click(within(nav).getByRole('button', { name: 'Domicilios' }));
    expect(await screen.findByRole('heading', { name: 'Luis' })).toBeInTheDocument();
    expect(screen.queryByText(/no está implementada/)).not.toBeInTheDocument();
  });

  it('el domiciliario solo ve sus pedidos, sin tablero ni barra inferior', async () => {
    const { calls } = mockApi({
      'GET /api/auth/session': { body: { usuario: COURIER } },
      'GET /api/orders': { body: [order({ estado: 'ASIGNADO', domiciliarioId: COURIER.id, domiciliarioNombre: 'Luis' })] },
    });
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Carmen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mis pedidos', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nuevo pedido' })).not.toBeInTheDocument();
    expect(calls.some((call) => call.path === '/api/dashboard' || call.path === '/api/couriers')).toBe(false);
  });

  it('Configuración aplica el modo oscuro y el perfil permite cambiar el nombre', async () => {
    const { calls } = mockApi(adminRoutes({
      'PUT /api/auth/profile': ({ body }) => ({ body: { usuario: { ...ADMIN, nombre: body.nombre } } }),
    }));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buenos días, Ana');

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Configuración' }));
    await user.click(screen.getByLabelText('Oscuro'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.click(screen.getByLabelText('Claro'));
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Perfil de Yanelys' }));
    const dialog = screen.getByRole('dialog', { name: 'Mi perfil' });
    const name = within(dialog).getByLabelText('Nombre');
    await user.clear(name);
    await user.type(name, 'Yanelys Gómez');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar perfil' }));
    expect(await within(dialog).findByText('Perfil guardado.')).toBeInTheDocument();
    expect(calls.find((call) => call.path === '/api/auth/profile').body).toEqual({ nombre: 'Yanelys Gómez', foto: null });

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Mi perfil' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Perfil de Yanelys Gómez' })).toHaveFocus();
  });

  it('el tablero muestra los pedidos sin asignar y lleva a Pedidos', async () => {
    mockApi(adminRoutes({ 'GET /api/dashboard': { body: { ...DASHBOARD_DATA, pendientesSinAsignar: 2 } } }));
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText(/En vivo · actualizado/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /2 pedidos sin asignar/ }));
    expect(await screen.findByRole('heading', { name: 'Carmen' })).toBeInTheDocument();
  });

  it('una sesión caducada devuelve al login con un aviso', async () => {
    mockApi(adminRoutes({ 'GET /api/orders': { status: 401, body: { error: 'Tu sesión no está activa.' } } }));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buenos días, Ana');
    await user.click(screen.getByRole('button', { name: 'Pedidos' }));
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Tu sesión terminó');
  });
});

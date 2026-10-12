import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

const DASHBOARD_DATA = {
  saludo: 'Buenos días, Ana',
  ventasTotales: 428000,
  pedidos: 36,
  alertas: 3,
  entregasActivas: 4,
  inventarioBajo: [{ producto: 'Queso costeño', unidades: 2, mensaje: 'revisar' }],
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

async function loginSimulado(user) {
  await user.type(screen.getByLabelText('Usuario'), 'Ana');
  await user.type(screen.getByLabelText('Contraseña'), 'demo');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  await screen.findByText('Buenos días, Ana');
}

describe('App — flujo completo del prototipo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra el login al inicio', () => {
    render(<App />);
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('acceso simulado: entra al tablero y vuelve al login con Cerrar sesión', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DASHBOARD_DATA),
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await loginSimulado(user);

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
    expect(screen.getByText('$428.000')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(
      await screen.findByRole('dialog', { name: 'Menú principal' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('las secciones del drawer avisan honestamente que no están implementadas', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DASHBOARD_DATA),
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await loginSimulado(user);

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(
      await screen.findByRole('button', { name: 'Productos' }),
    );
    expect(
      await screen.findByText(
        /La sección «Productos» no está implementada en este prototipo/,
      ),
    ).toBeInTheDocument();
  });

  it('la navegación inferior avisa honestamente en secciones no implementadas', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DASHBOARD_DATA),
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await loginSimulado(user);

    await user.click(screen.getByRole('button', { name: /Ventas/ }));
    expect(
      await screen.findByText(
        /La sección «Ventas» no está implementada en este prototipo/,
      ),
    ).toBeInTheDocument();
  });

  it('el aviso se puede cerrar', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DASHBOARD_DATA),
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await loginSimulado(user);

    await user.click(screen.getByRole('button', { name: /Inventario/ }));
    const toast = await screen.findByText(
      /La sección «Inventario» no está implementada/,
    );
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(toast).not.toBeInTheDocument();
  });
});

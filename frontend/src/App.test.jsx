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

  it('las secciones pendientes del drawer avisan honestamente', async () => {
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
      await screen.findByRole('button', { name: 'Configuración' }),
    );
    expect(
      await screen.findByText(
        /La sección «Configuración» no está implementada en este prototipo/,
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

    await user.click(screen.getByRole('button', { name: /Pedidos/ }));
    expect(
      await screen.findByText(
        /La sección «Pedidos» no está implementada en este prototipo/,
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

    await user.click(screen.getByRole('button', { name: /Domicilios/ }));
    const toast = await screen.findByText(
      /La sección «Domicilios» no está implementada/,
    );
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(toast).not.toBeInTheDocument();
  });

  it('navega a Productos e Inicio, preserva demo entre vistas y la reinicia al salir', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, json: () => Promise.resolve(DASHBOARD_DATA) }));
    const user = userEvent.setup();
    render(<App />);
    await loginSimulado(user);
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Productos', exact: true }));
    expect(screen.getByRole('heading', { name: 'Productos', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Productos', level: 1 })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Producto sesión');
    await user.type(screen.getByLabelText('Precio (COP)'), '1000');
    await user.click(screen.getByRole('button', { name: 'Guardar producto demo' }));
    expect(screen.queryByRole('button', { name: 'Inventario' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Inicio', exact: true }));
    expect(screen.getByRole('heading', { name: 'Inicio', level: 1 })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Productos', exact: true }));
    expect(screen.getByText('Producto sesión')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await loginSimulado(user);
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Productos', exact: true }));
    expect(screen.queryByText('Producto sesión')).not.toBeInTheDocument();
  });
});

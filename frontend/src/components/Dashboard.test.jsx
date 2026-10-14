import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './Dashboard.jsx';

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

const SESSION = { role: 'Administrador', usuario: 'Ana' };

function renderDashboard(session = SESSION) {
  return render(
    <Dashboard session={session} onOpenDrawer={() => {}} onNavigate={() => {}} />,
  );
}

function stubFetch(result) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(result),
    }),
  );
}

describe('Dashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra el encabezado caramelo con menú, título y perfil', () => {
    stubFetch(DASHBOARD_DATA);
    renderDashboard();
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Perfil de Ana' })).toBeInTheDocument();
  });

  it('muestra estado de carga mientras consulta la API', () => {
    vi.stubGlobal('fetch', () => new Promise(() => {}));
    renderDashboard();
    expect(
      screen.getByLabelText('Cargando datos del tablero'),
    ).toBeInTheDocument();
  });

  it('renderiza el saludo, las métricas y la gráfica desde la API', async () => {
    stubFetch(DASHBOARD_DATA);
    renderDashboard();
    expect(await screen.findByText('Buenos días, Ana')).toBeInTheDocument();
    expect(screen.getByText('$428.000')).toBeInTheDocument();
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('en curso')).toBeInTheDocument();
    const chart = await screen.findByRole('img', {
      name: /Gráfica de ventas de los últimos 7 días/,
    });
    expect(chart).toBeInTheDocument();
  });

  it('ya no muestra inventario ni alertas de insumos', async () => {
    stubFetch(DASHBOARD_DATA);
    renderDashboard();
    await screen.findByText('Buenos días, Ana');
    expect(screen.queryByText('Inventario bajo')).not.toBeInTheDocument();
    expect(screen.queryByText('Queso costeño')).not.toBeInTheDocument();
    expect(screen.queryByText('Alertas')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inventario' })).not.toBeInTheDocument();
  });

  it('muestra el error sin silenciarlo y ofrece Reintentar', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    renderDashboard();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar el tablero');
    expect(screen.getByText(/HTTP 500/)).toBeInTheDocument();
    expect(alert).not.toHaveTextContent('127.0.0.1');
    expect(alert).toHaveTextContent(/servidor puede tardar/);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ofrece un fallback de demostración explícito si la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    renderDashboard();
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Cargar datos de demostración',
      }),
    );
    expect(await screen.findByText('Buenos días, Ana')).toBeInTheDocument();
    expect(screen.getByText(/Datos de demostración/)).toBeInTheDocument();
  });

  it('muestra aviso informativo para el rol Domiciliario sin inventar permisos', async () => {
    stubFetch(DASHBOARD_DATA);
    renderDashboard({ role: 'Domiciliario', usuario: 'Pedro' });
    expect(
      await screen.findByText(/Rol Domiciliario: esta es una vista de demostración/),
    ).toBeInTheDocument();
  });
});

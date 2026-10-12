import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from './Drawer.jsx';

const MENU = [
  'Productos',
  'Domiciliarios',
  'Estadísticas',
  'Alertas',
  'Perfil',
  'Configuración',
];

function renderDrawer(overrides = {}) {
  const props = {
    open: true,
    role: 'Administrador',
    usuario: 'Ana',
    onClose: vi.fn(),
    onNavigate: vi.fn(),
    onLogout: vi.fn(),
    ...overrides,
  };
  const result = render(<Drawer {...props} />);
  return { ...result, props };
}

describe('Drawer', () => {
  it('se abre como diálogo modal con marca, rol y menú completo', () => {
    renderDrawer();
    expect(
      screen.getByRole('dialog', { name: 'Menú principal' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Buñuelos Yanelys')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    for (const item of [...MENU, 'Cerrar sesión']) {
      expect(screen.getByRole('button', { name: item })).toBeInTheDocument();
    }
  });

  it('cierra con la tecla Escape', async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();
    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra al hacer clic en el overlay oscuro', async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();
    await user.click(screen.getByTestId('drawer-overlay'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('no cierra al hacer clic dentro del drawer', async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();
    await user.click(screen.getByRole('button', { name: 'Productos' }));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('las secciones no implementadas avisan en lugar de ser controles muertos', async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();
    await user.click(screen.getByRole('button', { name: 'Estadísticas' }));
    expect(props.onNavigate).toHaveBeenCalledWith('Estadísticas');
  });

  it('cierra sesión al pulsar «Cerrar sesión»', async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(props.onLogout).toHaveBeenCalledTimes(1);
  });

  it('bloquea el scroll del fondo mientras está abierto y lo restaura al cerrar', () => {
    const { unmount } = renderDrawer();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('restaura el foco en el elemento que abrió el drawer', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'abrir menú';
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = renderDrawer();
    expect(document.activeElement).not.toBe(trigger);
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('atrapa el foco: Tab desde el último elemento vuelve al primero', async () => {
    const user = userEvent.setup();
    renderDrawer();
    const drawer = screen.getByRole('dialog');
    const focusable = drawer.querySelectorAll('button');
    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(focusable[0]);
  });

  it('atrapa el foco: Shift+Tab desde el primero va al último', async () => {
    const user = userEvent.setup();
    renderDrawer();
    const drawer = screen.getByRole('dialog');
    const focusable = drawer.querySelectorAll('button');
    const first = focusable[0];
    first.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);
  });
});

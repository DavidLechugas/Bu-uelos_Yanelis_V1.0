import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoreMenu } from './MoreMenu.jsx';

const ADMIN = { role: 'ADMIN', nombre: 'Yanelys' };

function renderMenu(user = ADMIN) {
  const props = { user, roleLabel: 'Administrador', onOpenProfile: vi.fn(), onNavigate: vi.fn(), onLogout: vi.fn() };
  render(<MoreMenu {...props} />);
  return props;
}

describe('MoreMenu', () => {
  it('lleva al perfil, a Productos, a Configuración y cierra sesión', async () => {
    const user = userEvent.setup();
    const props = renderMenu();
    await user.click(screen.getByRole('button', { name: /Yanelys/ }));
    expect(props.onOpenProfile).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Productos' }));
    expect(props.onNavigate).toHaveBeenLastCalledWith('productos');
    await user.click(screen.getByRole('button', { name: 'Configuración' }));
    expect(props.onNavigate).toHaveBeenLastCalledWith('configuracion');
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(props.onLogout).toHaveBeenCalledTimes(1);
  });

  it('al domiciliario no le ofrece Productos', () => {
    renderMenu({ role: 'COURIER', nombre: 'Luis' });
    expect(screen.queryByRole('button', { name: 'Productos' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configuración' })).toBeInTheDocument();
  });
});

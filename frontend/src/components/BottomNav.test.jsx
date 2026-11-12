import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav.jsx';

describe('BottomNav', () => {
  it('muestra Inicio, Pedidos, Domicilios y Más, sin Inventario', () => {
    render(<BottomNav active="inicio" onSelect={() => {}} />);
    expect(
      screen.getByRole('button', { name: /Inicio/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Pedidos/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Domicilios/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Inventario/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Más/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('al domiciliario solo le muestra Pedidos y Más', () => {
    render(<BottomNav admin={false} active="pedidos" onSelect={() => {}} />);
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Pedidos', 'Más']);
  });

  it('marca la pestaña activa como página actual', () => {
    render(<BottomNav active="inicio" onSelect={() => {}} />);
    expect(
      screen.getByRole('button', { name: /Inicio/ }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('notifica la selección de otra sección para que la app avise', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<BottomNav active="inicio" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Pedidos/ }));
    expect(onSelect).toHaveBeenCalledWith({
      id: 'pedidos',
      label: 'Pedidos',
    });
  });

  it('no notifica nada especial por Inicio (ya es la vista actual)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<BottomNav active="inicio" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Inicio/ }));
    expect(onSelect).toHaveBeenCalledWith({
      id: 'inicio',
      label: 'Inicio',
    });
  });
});

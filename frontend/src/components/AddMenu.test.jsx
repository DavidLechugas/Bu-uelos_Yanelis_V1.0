import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddMenu } from './AddMenu.jsx';

function setup() {
  const onAdmin = vi.fn();
  const onCourier = vi.fn();
  render(
    <AddMenu
      label="Añadir"
      options={[
        { label: 'Administrador', icon: null, onSelect: onAdmin },
        { label: 'Domiciliario', icon: null, onSelect: onCourier },
      ]}
    />,
  );
  return { onAdmin, onCourier };
}

describe('AddMenu', () => {
  it('abre las opciones y ejecuta la elegida', async () => {
    const { onAdmin, onCourier } = setup();
    const user = userEvent.setup();
    const main = screen.getByRole('button', { name: 'Añadir' });
    expect(main).toHaveAttribute('aria-expanded', 'false');

    await user.click(main);
    expect(main).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('menuitem', { name: 'Domiciliario' }));

    expect(onCourier).toHaveBeenCalledTimes(1);
    expect(onAdmin).not.toHaveBeenCalled();
    expect(main).toHaveAttribute('aria-expanded', 'false');
  });

  it('se cierra con Escape', async () => {
    setup();
    const user = userEvent.setup();
    const main = screen.getByRole('button', { name: 'Añadir' });
    await user.click(main);
    await user.keyboard('{Escape}');
    expect(main).toHaveAttribute('aria-expanded', 'false');
  });
});

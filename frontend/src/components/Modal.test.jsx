import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal.jsx';

function renderModal(overrides = {}) {
  const props = { open: true, title: 'Filtros', onClose: vi.fn(), ...overrides };
  const result = render(
    <Modal {...props}>
      <input aria-label="Buscar" />
      <button type="button">Aplicar</button>
    </Modal>,
  );
  return { ...result, props };
}

describe('Modal', () => {
  it('se abre como diálogo modal con su título', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toHaveAttribute('aria-modal', 'true');
  });

  it('no pinta nada cerrado', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra con la tecla Escape', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra al tocar el fondo oscuro, no al tocar dentro', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(props.onClose).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('modal-overlay'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('enfoca el primer campo, o «Cerrar» si se pide no abrir el teclado', () => {
    const { unmount } = renderModal();
    expect(screen.getByLabelText('Buscar')).toHaveFocus();
    unmount();
    renderModal({ focusField: false });
    expect(screen.getByRole('button', { name: 'Cerrar ventana' })).toHaveFocus();
  });

  it('bloquea el scroll del fondo mientras está abierto y lo restaura al cerrar', () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('restaura el foco en el elemento que lo abrió', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = renderModal();
    expect(document.activeElement).not.toBe(trigger);
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('atrapa el foco en los dos sentidos', async () => {
    const user = userEvent.setup();
    renderModal();
    const first = screen.getByRole('button', { name: 'Cerrar ventana' });
    const last = screen.getByRole('button', { name: 'Aplicar' });
    last.focus();
    await user.keyboard('{Tab}');
    expect(first).toHaveFocus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(last).toHaveFocus();
  });
});

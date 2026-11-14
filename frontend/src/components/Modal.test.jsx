import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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

// history.back() de jsdom es asíncrono: se vacía su cola para que una prueba no herede el cierre pendiente de la anterior.
beforeEach(() => act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); }));

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

  describe('botón «atrás»', () => {
    const back = () => act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    it('cierra el modal con «atrás» y no sale de la página', async () => {
      const { props } = renderModal();
      expect(window.history.state?.overlay).toBeTruthy();
      await back();
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('al cerrarse por otro medio retira la entrada de historial que añadió', async () => {
      const { rerender, props } = renderModal();
      expect(window.history.state?.overlay).toBeTruthy();
      rerender(<Modal {...props} open={false}><button type="button">Aplicar</button></Modal>);
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
      expect(window.history.state?.overlay).toBeUndefined();
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it('con dos modales abiertos, «atrás» cierra solo el de encima', async () => {
      const lower = vi.fn();
      const upper = vi.fn();
      render(<><Modal open title="A" onClose={lower}><p>a</p></Modal><Modal open title="B" onClose={upper}><p>b</p></Modal></>);
      await back();
      expect(upper).toHaveBeenCalledTimes(1);
      expect(lower).not.toHaveBeenCalled();
    });
  });
});

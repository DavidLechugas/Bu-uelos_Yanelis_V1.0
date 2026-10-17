import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast.jsx';

afterEach(() => { vi.useRealTimers(); });

describe('Toast', () => {
  it('el éxito es un aviso de estado que se cierra solo a los 5 s', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast notice={{ text: 'Pedido creado', tone: 'success' }} onClose={onClose} />);
    expect(screen.getByRole('status')).toHaveTextContent('Pedido creado');
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('el error es una alerta que no se cierra sola y se cierra con la X', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onClose = vi.fn();
    render(<Toast notice={{ text: 'No se pudo guardar', tone: 'error' }} onClose={onClose} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
    act(() => { vi.advanceTimersByTime(20000); });
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sin aviso no muestra nada', () => {
    const { container } = render(<Toast notice={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

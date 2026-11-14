import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { OfflineNotice } from './OfflineNotice.jsx';

function setOnline(value) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
}

describe('OfflineNotice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('no muestra nada con conexión', () => {
    setOnline(true);
    const { container } = render(<OfflineNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('avisa si la app abre sin internet', () => {
    setOnline(false);
    render(<OfflineNotice />);
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes acceso a internet.');
  });

  it('avisa al perder la conexión y confirma al recuperarla, luego se va', () => {
    vi.useFakeTimers();
    setOnline(true);
    render(<OfflineNotice />);

    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes acceso a internet.');

    act(() => { window.dispatchEvent(new Event('online')); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Conexión recuperada.');

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubState } from '../test/pwa-register-react-stub.js';
import { PwaStatus } from './PwaStatus.jsx';

describe('PwaStatus', () => {
  beforeEach(() => {
    stubState.needRefresh = false;
    stubState.offlineReady = false;
    stubState.updates = 0;
    stubState.reloadRequested = false;
  });

  it('no muestra nada cuando no hay novedad PWA', () => {
    const { container } = render(<PwaStatus />);
    expect(container).toBeEmptyDOMElement();
  });

  it('avisa de nueva versión y actualiza solo al pulsar «Actualizar»', async () => {
    stubState.needRefresh = true;
    render(<PwaStatus />);
    expect(
      screen.getByText('Hay una nueva versión de la app.'),
    ).toBeInTheDocument();
    const actualizar = screen.getByRole('button', { name: 'Actualizar' });
    await userEvent.click(actualizar);
    expect(stubState.updates).toBe(1);
    expect(stubState.reloadRequested).toBe(true);
  });

  it('permite cerrar el aviso de nueva versión sin actualizar', async () => {
    stubState.needRefresh = true;
    render(<PwaStatus />);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('Hay una nueva versión de la app.')).not.toBeInTheDocument();
    expect(stubState.updates).toBe(0);
  });

  it('avisa que ya funciona sin conexión y se cierra', async () => {
    stubState.offlineReady = true;
    render(<PwaStatus />);
    expect(
      screen.getByText('Interfaz disponible sin conexión. Los datos necesitan conexión al servidor.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(
      screen.queryByText('Interfaz disponible sin conexión. Los datos necesitan conexión al servidor.'),
    ).not.toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings.jsx';
import { loadPreferences } from './preferences.js';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('Settings', () => {
  it('explica que el navegador no permite notificaciones cuando no hay soporte', async () => {
    render(<Settings onOpenProfile={() => {}} />);
    expect(await screen.findByText(/no permite notificaciones/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Activar en este dispositivo/ })).not.toBeInTheDocument();
  });

  it('guarda la preferencia de sonido de los avisos', async () => {
    const user = userEvent.setup();
    render(<Settings onOpenProfile={() => {}} />);
    expect(loadPreferences().alertSound).toBe(true);
    await user.click(screen.getByRole('radio', { name: 'Sin sonido' }));
    expect(loadPreferences().alertSound).toBe(false);
  });
});

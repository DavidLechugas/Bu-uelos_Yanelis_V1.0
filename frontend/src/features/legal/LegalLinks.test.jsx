import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalLinks } from './LegalLinks.jsx';

describe('LegalLinks', () => {
  it('abre y cierra la política de privacidad y los términos', async () => {
    const user = userEvent.setup();
    render(<LegalLinks prefix="Consulta la " />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Política de privacidad' }));
    expect(screen.getByRole('dialog', { name: 'Política de privacidad' })).toBeInTheDocument();
    expect(screen.getByText('Qué datos guardamos')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar ventana' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Términos y condiciones' }));
    expect(screen.getByRole('dialog', { name: 'Términos y condiciones' })).toBeInTheDocument();
    expect(screen.getByText('Uso permitido')).toBeInTheDocument();
  });
});

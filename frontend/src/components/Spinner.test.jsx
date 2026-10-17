import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner.jsx';

describe('Spinner', () => {
  it('con etiqueta es un aviso de estado y sin ella es decorativo', () => {
    const { container, rerender } = render(<Spinner label="Cargando pedidos…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando pedidos…');
    rerender(<Spinner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('.spinner-box')).toHaveAttribute('aria-hidden', 'true');
  });

  it('el chulito solo aparece al terminar', () => {
    const { container, rerender } = render(<Spinner label="Listo" />);
    expect(container.querySelector('.spinner-check')).toBeNull();
    expect(container.querySelector('.spinner')).not.toBeNull();
    rerender(<Spinner label="Listo" done />);
    expect(container.querySelector('.spinner-check')).not.toBeNull();
    expect(container.querySelector('.spinner')).toBeNull();
  });
});

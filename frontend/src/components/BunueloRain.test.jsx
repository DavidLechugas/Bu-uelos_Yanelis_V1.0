import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BunueloRain, sketchPaths } from './BunueloRain.jsx';

describe('BunueloRain', () => {
  it('es decorativo y dibuja varios buñuelos', () => {
    const { container } = render(<BunueloRain />);
    expect(container.querySelector('.bunuelo-rain')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.bunuelo-item').length).toBeGreaterThanOrEqual(8);
  });

  it('el dibujo es determinista y no lleva colores fijos', () => {
    expect(sketchPaths(5)).toEqual(sketchPaths(5));
    expect(sketchPaths(5).outline).not.toEqual(sketchPaths(6).outline);
    const { container } = render(<BunueloRain />);
    expect(container.querySelector('[fill], [stroke]')).toBeNull();
  });
});

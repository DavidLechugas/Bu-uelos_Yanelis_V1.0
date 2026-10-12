import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login.jsx';

describe('Login', () => {
  it('muestra la marca, el selector de rol, los campos y el botón', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByText('Buñuelos Yanelys')).toBeInTheDocument();
    expect(
      screen.getByText('Gestión cercana · entregas confiables'),
    ).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Rol' })).toBeInTheDocument();
    expect(screen.getByLabelText('Administrador')).toBeInTheDocument();
    expect(screen.getByLabelText('Domiciliario')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('declara explícitamente que el acceso es simulado', () => {
    render(<Login onLogin={() => {}} />);
    expect(
      screen.getByText(/Acceso simulado de demostración/),
    ).toBeInTheDocument();
  });

  it('muestra errores de validación al enviar el formulario vacío', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Escribe tu usuario')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu contraseña')).toBeInTheDocument();
  });

  it('inicia sesión simulado como Administrador por defecto', async () => {
    const onLogin = vi.fn();
    const user = userEvent.setup();
    render(<Login onLogin={onLogin} />);
    await user.type(screen.getByLabelText('Usuario'), 'ana');
    await user.type(screen.getByLabelText('Contraseña'), 'cualquiera');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onLogin).toHaveBeenCalledWith({
      role: 'Administrador',
      usuario: 'ana',
    });
  });

  it('permite elegir el rol Domiciliario', async () => {
    const onLogin = vi.fn();
    const user = userEvent.setup();
    render(<Login onLogin={onLogin} />);
    await user.click(screen.getByLabelText('Domiciliario'));
    await user.type(screen.getByLabelText('Usuario'), 'pedro');
    await user.type(screen.getByLabelText('Contraseña'), 'x');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onLogin).toHaveBeenCalledWith({
      role: 'Domiciliario',
      usuario: 'pedro',
    });
  });

  it('muestra la ayuda al pulsar «Necesitas ayuda»', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={() => {}} />);
    const help = screen.getByRole('button', {
      name: '¿Necesitas ayuda?',
    });
    expect(help).toHaveAttribute('aria-expanded', 'false');
    await user.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Nada de lo que escribas se guarda/)).toBeInTheDocument();
  });
});

import { useState } from 'react';
import { auth } from '../api/client.js';
import { EyeIcon, EyeOffIcon } from './icons.jsx';

/**
 * Inicio de sesión real. El rol lo decide el servidor según la cuenta;
 * no hay registro público: el administrador crea las cuentas.
 */
export function Login({ onLogin, connectionError }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!usuario.trim()) {
      nextErrors.usuario = 'Escribe tu usuario';
    }
    if (!password) {
      nextErrors.password = 'Escribe tu contraseña';
    }
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await auth.login(usuario.trim(), password);
      setPassword('');
      onLogin(result.usuario);
    } catch (error) {
      setServerError(error.message);
      setSubmitting(false);
    }
  }

  const banner = serverError || connectionError;

  return (
    <main className="login-page">
      <div className="brand">
        <span className="brand-circle" aria-hidden="true">
          <img src="/icons/logo.svg" alt="" />
        </span>
        <div className="brand-text">
          <p className="brand-name">Buñuelos Yanelys</p>
          <p className="brand-tagline">Gestión cercana · entregas confiables</p>
        </div>
      </div>

      <form className="card login-card" onSubmit={handleSubmit} noValidate>
        <h1 className="login-title">Iniciar sesión</h1>

        {banner && (
          <p className="login-error" role="alert">
            {banner}
          </p>
        )}

        <div className="field">
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={usuario}
            onChange={(event) => setUsuario(event.target.value)}
            aria-invalid={Boolean(errors.usuario)}
            aria-describedby={errors.usuario ? 'usuario-error' : undefined}
          />
          {errors.usuario && (
            <p id="usuario-error" className="field-error" role="alert">
              {errors.usuario}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className="icon-btn password-toggle"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOffIcon size={22} /> : <EyeIcon size={22} />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="field-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        <button
          type="button"
          className="btn-help"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((open) => !open)}
        >
          ¿Necesitas ayuda?
        </button>
        {helpOpen && (
          <p className="help-text">
            Pide tu usuario y contraseña al administrador. Si la olvidaste, el
            administrador puede asignarte una nueva desde «Domicilios». La
            primera vez el servidor puede tardar hasta un minuto en despertar.
          </p>
        )}
      </form>
    </main>
  );
}

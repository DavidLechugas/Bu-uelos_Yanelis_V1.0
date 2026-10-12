import { useState } from 'react';

const ROLES = ['Administrador', 'Domiciliario'];

/**
 * Pantalla de acceso SIMULADO de demostración.
 * No hay autenticación real: no se almacenan, envían ni validan
 * credenciales; cualquier usuario/contraseña no vacíos "entran".
 */
export function Login({ onLogin }) {
  const [role, setRole] = useState(ROLES[0]);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [helpOpen, setHelpOpen] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!usuario.trim()) {
      nextErrors.usuario = 'Escribe tu usuario';
    }
    if (!password) {
      nextErrors.password = 'Escribe tu contraseña';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      // Acceso simulado: la credencial no se guarda en ningún lado.
      onLogin({ role, usuario: usuario.trim() });
    }
  }

  return (
    <div className="login-page">
      <div className="brand">
        <span className="brand-circle" aria-hidden="true">
          BY
        </span>
        <div className="brand-text">
          <p className="brand-name">Buñuelos Yanelys</p>
          <p className="brand-tagline">Gestión cercana · entregas confiables</p>
        </div>
      </div>

      <form className="card login-card" onSubmit={handleSubmit} noValidate>
        <h1 className="login-title">Iniciar sesión</h1>

        <p className="demo-notice">
          Acceso simulado de demostración: cualquier usuario y contraseña
          funcionan. No se almacenan ni transmiten credenciales reales.
        </p>

        <fieldset className="role-fieldset">
          <legend>Rol</legend>
          <div className="role-options" role="radiogroup" aria-label="Rol">
            {ROLES.map((option) => (
              <label
                key={option}
                className={`role-option${role === option ? ' role-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option}
                  checked={role === option}
                  onChange={() => setRole(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            type="text"
            autoComplete="off"
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
          <input
            id="password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" className="field-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary">
          Entrar
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
            Esta es una demostración local. Escribe cualquier usuario y
            contraseña y pulsa «Entrar». Nada de lo que escribas se guarda.
          </p>
        )}
      </form>
    </div>
  );
}

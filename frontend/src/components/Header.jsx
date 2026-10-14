/**
 * Encabezado caramelo del tablero: menú (hamburguesa), título y
 * círculo de perfil con la inicial del usuario.
 */
export function Header({ title, usuario, onOpenDrawer }) {
  const initial = (usuario?.trim()?.[0] ?? 'A').toUpperCase();
  return (
    <header className="app-header">
      <button
        type="button"
        className="icon-btn header-menu-btn"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        onClick={onOpenDrawer}
      >
        <span aria-hidden="true" className="hamburger-icon">
          ☰
        </span>
      </button>
      <h1 className="header-title" tabIndex={-1}>{title}</h1>
      <span
        className="profile-circle"
        role="img"
        aria-label={`Perfil de ${usuario}`}
      >
        {initial}
      </span>
    </header>
  );
}

import { MenuIcon } from './icons.jsx';
import { Avatar } from './Avatar.jsx';

export function Header({ title, user, onOpenDrawer, onOpenProfile }) {
  return (
    <header className="app-header">
      <button
        type="button"
        className="icon-btn header-menu-btn"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        onClick={onOpenDrawer}
      >
        <MenuIcon />
      </button>
      <h1 className="header-title" tabIndex={-1}>{title}</h1>
      <button
        type="button"
        className="profile-button"
        aria-label={`Perfil de ${user.nombre}`}
        aria-haspopup="dialog"
        onClick={onOpenProfile}
      >
        <Avatar user={user} />
      </button>
    </header>
  );
}

import { BackIcon } from './icons.jsx';
import { Avatar } from './Avatar.jsx';

export function Header({ title, user, onBack, onOpenProfile }) {
  return (
    <header className="app-header">
      {onBack && (
        <button type="button" className="icon-btn header-back-btn" aria-label="Volver" onClick={onBack}>
          <BackIcon />
        </button>
      )}
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

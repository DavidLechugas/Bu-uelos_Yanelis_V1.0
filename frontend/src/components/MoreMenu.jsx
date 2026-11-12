import { Avatar } from './Avatar.jsx';
import { ChevronRightIcon, LogoutIcon, ProductIcon, SettingsIcon } from './icons.jsx';

/** Pantalla «Más»: lo que no cabe en la barra inferior (perfil, productos, configuración y salir). */
export function MoreMenu({ user, roleLabel, onOpenProfile, onNavigate, onLogout }) {
  const rows = [
    user.role === 'ADMIN' && { id: 'productos', label: 'Productos', Icon: ProductIcon },
    { id: 'configuracion', label: 'Configuración', Icon: SettingsIcon },
  ].filter(Boolean);

  return (
    <div className="more-menu">
      <button type="button" className="card more-profile" aria-haspopup="dialog" onClick={onOpenProfile}>
        <Avatar user={user} size="medium" />
        <span className="more-profile-text">
          <strong>{user.nombre}</strong>
          <span>{roleLabel}</span>
        </span>
        <ChevronRightIcon className="more-chevron" />
      </button>

      <ul className="card more-list">
        {rows.map(({ id, label, Icon }) => (
          <li key={id}>
            <button type="button" className="more-row" onClick={() => onNavigate(id)}>
              <Icon className="more-row-icon" />
              <span>{label}</span>
              <ChevronRightIcon className="more-chevron" />
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="card more-row more-logout" onClick={onLogout}>
        <LogoutIcon className="more-row-icon" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}

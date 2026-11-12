import { DeliveryIcon, HomeIcon, MoreIcon, OrdersIcon } from './icons.jsx';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', Icon: HomeIcon, adminOnly: true },
  { id: 'pedidos', label: 'Pedidos', Icon: OrdersIcon },
  { id: 'domicilios', label: 'Domicilios', Icon: DeliveryIcon, adminOnly: true },
  { id: 'mas', label: 'Más', Icon: MoreIcon },
];

/** Única navegación principal: el administrador ve las cuatro secciones y el domiciliario solo Pedidos y Más. */
export function BottomNav({ active, onSelect, badges = {}, admin = true }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.filter((item) => admin || !item.adminOnly).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav-item${active === id ? ' bottom-nav-item--active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onSelect({ id, label })}
        >
          <span className="bottom-nav-icon-wrap">
            <Icon className="bottom-nav-icon" />
            {badges[id] > 0 && <span className="bottom-nav-badge" aria-label={`${badges[id]} novedades`}>{badges[id]}</span>}
          </span>
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

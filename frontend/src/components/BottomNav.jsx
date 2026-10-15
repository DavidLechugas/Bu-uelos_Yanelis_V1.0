import { DeliveryIcon, HomeIcon, OrdersIcon } from './icons.jsx';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', Icon: HomeIcon },
  { id: 'pedidos', label: 'Pedidos', Icon: OrdersIcon },
  { id: 'domicilios', label: 'Domicilios', Icon: DeliveryIcon },
];

/** Navegación inferior del administrador, con iconos SVG propios. */
export function BottomNav({ active, onSelect }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav-item${active === id ? ' bottom-nav-item--active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onSelect({ id, label })}
        >
          <Icon className="bottom-nav-icon" />
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

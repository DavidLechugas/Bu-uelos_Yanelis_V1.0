const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: '🏠' },
  { id: 'ventas', label: 'Ventas', icon: '📈' },
  { id: 'domicilios', label: 'Domicilios', icon: '🛵' },
  { id: 'inventario', label: 'Inventario', icon: '📦' },
];

/**
 * Navegación inferior. «Inicio» es la vista activa; las
 * secciones no implementadas avisan honestamente en lugar de
 * quedarse como controles muertos.
 */
export function BottomNav({ active, onSelect }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav-item${active === item.id ? ' bottom-nav-item--active' : ''}`}
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => onSelect(item)}
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

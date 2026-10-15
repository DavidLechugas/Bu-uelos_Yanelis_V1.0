/**
 * Tarjeta de resumen del tablero. `tone` cambia el color del
 * valor (green/red) y `badge` muestra una etiqueta auxiliar.
 */
export function StatCard({ label, value, tone, badge }) {
  return (
    <div className={`card stat-card${tone ? ` stat-card--${tone}` : ''}`}>
      <p className="stat-label">{label}</p>
      {/* key: al cambiar el valor se vuelve a montar y se anima. */}
      <p className="stat-value" key={value}>{value}</p>
      {badge && <span className="stat-badge">{badge}</span>}
    </div>
  );
}

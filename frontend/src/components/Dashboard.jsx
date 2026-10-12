import { StatCard } from './StatCard.jsx';
import { WeeklyChart } from './WeeklyChart.jsx';
import { Header } from './Header.jsx';
import { BottomNav } from './BottomNav.jsx';
import { Notice } from './Notice.jsx';
import { useDashboard } from '../hooks/useDashboard.js';

function formatCurrency(value) {
  // "$428.000" como en la referencia: símbolo + separador de miles es-CO.
  return `$${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function DashboardSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Cargando datos del tablero">
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
    </div>
  );
}

function DashboardError({ error, onRetry, onUseDemo }) {
  return (
    <section className="card error-card" role="alert">
      <h2>No pudimos cargar el tablero</h2>
      <p className="error-detail">{error}</p>
      <p>Comprueba que el backend de demostración esté en ejecución en 127.0.0.1:8080.</p>
      <div className="error-actions">
        <button type="button" className="btn-primary" onClick={onRetry}>
          Reintentar
        </button>
        <button type="button" className="btn-secondary" onClick={onUseDemo}>
          Cargar datos de demostración
        </button>
      </div>
    </section>
  );
}

/**
 * Tablero principal. Todos los datos provienen de la API
 * (MongoDB). Si la API falla, el usuario decide explícitamente
 * si reintentar o usar datos de demostración.
 */
export function Dashboard({ session, onOpenDrawer, onSelectNav }) {
  const { status, data, error, demoMode, retry, useDemoData } = useDashboard();

  return (
    <div className="dashboard">
      <Header title="Inicio" usuario={session.usuario} onOpenDrawer={onOpenDrawer} />

      <main className="dashboard-main">
        {status === 'loading' && <DashboardSkeleton />}

        {status === 'error' && (
          <DashboardError error={error} onRetry={retry} onUseDemo={useDemoData} />
        )}

        {status === 'success' && (
          <>
            {demoMode && (
              <Notice
                tone="demo"
                text="Datos de demostración: la API no está disponible. Pulsa «Reintentar» en el error anterior si vuelve a aparecer."
              />
            )}
            <p className="greeting">{data.saludo}</p>
            {session.role === 'Domiciliario' && (
              <Notice
                tone="info"
                text="Rol Domiciliario: esta es una vista de demostración. Los permisos de este rol no están definidos en el prototipo."
              />
            )}

            <div className="stats-grid">
              <StatCard
                label="Ventas (7 días)"
                value={formatCurrency(data.ventasTotales)}
                tone="green"
              />
              <StatCard label="Pedidos" value={String(data.pedidos)} />
              <StatCard label="Alertas" value={String(data.alertas)} tone="red" />
              <StatCard
                label="Entregas activas"
                value={String(data.entregasActivas)}
                badge="en curso"
              />
            </div>

            <section className="card" aria-labelledby="inventario-bajo">
              <h2 id="inventario-bajo">Inventario bajo</h2>
              <ul className="inventory-list">
                {data.inventarioBajo.map((item) => (
                  <li key={item.producto} className="inventory-item">
                    <span className="inventory-product">{item.producto}</span>
                    <span className="inventory-units">
                      {item.unidades} unidades
                    </span>
                    <span className="inventory-note">{item.mensaje}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card" aria-labelledby="ventas-7dias">
              <h2 id="ventas-7dias">Ventas · últimos 7 días</h2>
              <WeeklyChart data={data.ventasUltimos7Dias} />
            </section>
          </>
        )}
      </main>

      <BottomNav active="inicio" onSelect={onSelectNav} />
    </div>
  );
}

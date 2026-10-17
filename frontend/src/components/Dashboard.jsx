import { StatCard } from './StatCard.jsx';
import { Spinner } from './Spinner.jsx';
import { WeeklyChart } from './WeeklyChart.jsx';
import { Header } from './Header.jsx';
import { BottomNav } from './BottomNav.jsx';
import { Notice } from './Notice.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { AlertIcon } from './icons.jsx';

const clock = new Intl.DateTimeFormat('es-CO', { timeStyle: 'medium' });

function LiveIndicator({ updatedAt, stale }) {
  if (!updatedAt) return null;
  return (
    <p className={`live-indicator${stale ? ' live-indicator--stale' : ''}`}>
      <span className="live-dot" aria-hidden="true" />
      {stale
        ? `Sin conexión · datos de las ${clock.format(updatedAt)}`
        : `En vivo · actualizado ${clock.format(updatedAt)}`}
    </p>
  );
}

function formatCurrency(value) {
  // "$428.000" como en la referencia: símbolo + separador de miles es-CO.
  return `$${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function DashboardSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Cargando datos del tablero">
      <Spinner size="md" />
      <p role="status">Conectando con el servidor… El primer arranque puede tardar hasta un minuto y medio.</p>
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
      <p>Comprueba tu conexión a internet y vuelve a intentarlo. El servidor puede tardar en arrancar tras un periodo de inactividad. No necesitas ejecutar un servidor en tu teléfono.</p>
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
export function Dashboard({ session, active = true, onOpenDrawer, onOpenProfile, onSelectNav }) {
  const { status, data, error, demoMode, retry, useDemoData, updatedAt, stale } = useDashboard({ active });

  return (
    <div className="dashboard">
      <Header title="Inicio" user={session} onOpenDrawer={onOpenDrawer} onOpenProfile={onOpenProfile} />

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
            <div className="dashboard-greeting">
              <p className="greeting">{data.saludo}</p>
              <LiveIndicator updatedAt={updatedAt} stale={stale} />
            </div>
            {data.pendientesSinAsignar > 0 && (
              <button type="button" className="alert-banner" onClick={() => onSelectNav({ id: 'pedidos', label: 'Pedidos' })}>
                <AlertIcon />
                <span>
                  {data.pendientesSinAsignar === 1
                    ? '1 pedido sin asignar'
                    : `${data.pendientesSinAsignar} pedidos sin asignar`}
                </span>
                <span className="alert-banner-action">Asignar</span>
              </button>
            )}

            <div className="stats-grid stats-grid--orders">
              <StatCard
                label="Ventas (7 días)"
                value={formatCurrency(data.ventasTotales)}
                tone="green"
              />
              <StatCard label="Pedidos hoy" value={String(data.pedidos)} />
              <StatCard
                label="Entregas activas"
                value={String(data.entregasActivas)}
                badge="en curso"
              />
            </div>

            <section className="card dashboard-chart-card" aria-labelledby="ventas-7dias">
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

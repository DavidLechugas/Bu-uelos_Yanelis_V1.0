import { StatCard } from './StatCard.jsx';
import { Spinner } from './Spinner.jsx';
import { WeeklyChart } from './WeeklyChart.jsx';
import { Notice } from './Notice.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { AlertIcon } from './icons.jsx';

const clock = new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' });

function LiveIndicator({ updatedAt, stale }) {
  if (!updatedAt) return null;
  return (
    <p className={`live-indicator${stale ? ' live-indicator--stale' : ''}`}>
      <span className="live-dot" aria-hidden="true" />
      {stale ? `Sin conexión · ${clock.format(updatedAt)}` : 'En vivo'}
    </p>
  );
}

function formatCurrency(value) {
  return `$${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function DashboardSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Cargando datos del tablero">
      <Spinner size="lg" label="Conectando con el servidor…" />
      <p>El primer arranque puede tardar hasta un minuto y medio.</p>
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
      <img className="empty-logo" src="/icons/logo.svg" alt="" />
      <h2>No pudimos cargar el tablero</h2>
      <p className="error-detail">{error}</p>
      <p>Revisa tu conexión. El servidor puede tardar en arrancar.</p>
      <div className="error-actions">
        <button type="button" className="btn-primary" onClick={onRetry}>
          Reintentar
        </button>
        <button type="button" className="btn-help" onClick={onUseDemo}>
          Cargar datos de demostración
        </button>
      </div>
    </section>
  );
}

/** Tablero con datos de la API; si falla, el usuario elige reintentar o ver datos de demostración. */
export function Dashboard({ active = true, onSelectNav }) {
  const { status, data, error, demoMode, retry, useDemoData, updatedAt, stale } = useDashboard({ active });

  return (
    <div className="dashboard-main">
      {status === 'loading' && <DashboardSkeleton />}

      {status === 'error' && (
        <DashboardError error={error} onRetry={retry} onUseDemo={useDemoData} />
      )}

      {status === 'success' && (
        <>
          {demoMode && (
            <Notice
              tone="demo"
              text="Datos de demostración: el servidor no responde."
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
            />
          </div>

          <section className="card dashboard-chart-card" aria-labelledby="ventas-7dias">
            <h2 id="ventas-7dias">Últimos 7 días</h2>
            <WeeklyChart data={data.ventasUltimos7Dias} />
          </section>
        </>
      )}
    </div>
  );
}

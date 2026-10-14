import { useEffect, useRef, useState } from 'react';
import { Login } from './components/Login.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Drawer } from './components/Drawer.jsx';
import { PwaStatus } from './components/PwaStatus.jsx';
import { Header } from './components/Header.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { Products } from './features/products/Products.jsx';
import './features/management.css';

/**
 * Prototipo Buñuelos Yanelys: login simulado → tablero con
 * drawer y catálogo de Productos con estado demo de sesión.
 * Las demás secciones avisan que no están implementadas.
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [view, setView] = useState('inicio');
  const shell = useRef(null);

  useEffect(() => {
    shell.current?.scrollIntoView?.({ block: 'start' });
    shell.current?.querySelector('.view-panel:not([hidden]) h1')?.focus({ preventScroll: true });
  }, [view]);

  function handleLogin(credentials) {
    setSession(credentials);
  }

  function handleLogout() {
    setDrawerOpen(false);
    setSession(null);
    setView('inicio');
    setNotice(null);
  }

  function handleUnimplemented(section) {
    // Las secciones no implementadas cierran el drawer (como una
    // navegación real) y avisan honestamente en el aviso.
    setDrawerOpen(false);
    setNotice(
      `La sección «${section}» no está implementada en este prototipo.`,
    );
  }

  function handleBottomNav(item) {
    if (item.id === 'inicio') {
      navigate(item.id);
    } else {
      handleUnimplemented(item.label);
    }
  }

  function navigate(nextView) {
    setDrawerOpen(false);
    setNotice(null);
    setView(nextView);
  }

  function handleDrawerNav(section) {
    if (section === 'Productos') navigate('productos');
    else handleUnimplemented(section);
  }

  if (!session) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <PwaStatus />
      </>
    );
  }

  return (
    <div className="app-shell" ref={shell}>
      <div className="view-panel" hidden={view !== 'inicio'}>
        <Dashboard
          session={session}
          onOpenDrawer={() => setDrawerOpen(true)}
          onSelectNav={handleBottomNav}
        />
      </div>
      <div className="view-panel" hidden={view === 'inicio'}>
        <Header title="Productos" usuario={session.usuario} onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="management-main">
          <div className="view-panel" hidden={view !== 'productos'}><Products /></div>
        </main>
        <BottomNav active={view} onSelect={handleBottomNav} />
      </div>
      <Drawer
        open={drawerOpen}
        role={session.role}
        usuario={session.usuario}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleDrawerNav}
        onLogout={handleLogout}
      />
      {notice && (
        <div className="notice-toast" role="status">
          <p>{notice}</p>
          <button
            type="button"
            className="icon-btn notice-close"
            aria-label="Cerrar aviso"
            onClick={() => setNotice(null)}
          >
            ✕
          </button>
        </div>
      )}
      <PwaStatus />
    </div>
  );
}

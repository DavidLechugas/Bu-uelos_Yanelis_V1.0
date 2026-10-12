import { useState } from 'react';
import { Login } from './components/Login.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Drawer } from './components/Drawer.jsx';
import { PwaStatus } from './components/PwaStatus.jsx';

/**
 * Prototipo Buñuelos Yanelys: login simulado → tablero con
 * drawer de navegación. Solo estas tres pantallas existen;
 * todo lo demás avisa que no está implementado.
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  function handleLogin(credentials) {
    setSession(credentials);
  }

  function handleLogout() {
    setDrawerOpen(false);
    setSession(null);
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
      return;
    }
    handleUnimplemented(item.label);
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
    <div className="app-shell">
      <Dashboard
        session={session}
        onOpenDrawer={() => setDrawerOpen(true)}
        onNavigate={handleUnimplemented}
        onSelectNav={handleBottomNav}
      />
      <Drawer
        open={drawerOpen}
        role={session.role}
        usuario={session.usuario}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleUnimplemented}
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

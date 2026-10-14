import { useEffect, useRef, useState } from 'react';
import { auth, SESSION_EXPIRED_EVENT } from './api/client.js';
import { Login } from './components/Login.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Drawer } from './components/Drawer.jsx';
import { PwaStatus } from './components/PwaStatus.jsx';
import { Header } from './components/Header.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { Products } from './features/products/Products.jsx';
import { Orders } from './features/orders/Orders.jsx';
import { Couriers } from './features/couriers/Couriers.jsx';
import './features/management.css';

const ROLE_LABEL = { ADMIN: 'Administrador', COURIER: 'Domiciliario' };
const TITLES = { inicio: 'Inicio', pedidos: 'Pedidos', domicilios: 'Domicilios', productos: 'Productos' };

/** Entradas del drawer por rol: las que tienen vista navegan, el resto avisa. */
const DRAWER_ITEMS = {
  ADMIN: ['Pedidos', 'Domiciliarios', 'Productos', 'Estadísticas', 'Alertas', 'Perfil', 'Configuración'],
  COURIER: ['Mis pedidos', 'Perfil'],
};
const DRAWER_VIEWS = { Pedidos: 'pedidos', 'Mis pedidos': 'pedidos', Domiciliarios: 'domicilios', Productos: 'productos' };

/**
 * Buñuelos Yanelys: sesión real (cookie HttpOnly del servidor). El
 * administrador ve tablero, pedidos y domiciliarios; el domiciliario
 * solo sus pedidos. Los permisos se aplican en el servidor.
 */
export default function App() {
  // undefined = comprobando sesión; null = sin sesión.
  const [user, setUser] = useState(undefined);
  const [loginMessage, setLoginMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [view, setView] = useState('inicio');
  const shell = useRef(null);

  useEffect(() => {
    auth.session()
      .then((result) => startSession(result.usuario ?? null))
      .catch((error) => {
        setUser(null);
        setLoginMessage(error.message);
      });
    function onExpired() {
      resetSession();
      setLoginMessage('Tu sesión terminó. Inicia sesión de nuevo.');
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    shell.current?.scrollIntoView?.({ block: 'start' });
    shell.current?.querySelector('.view-panel:not([hidden]) h1')?.focus({ preventScroll: true });
  }, [view]);

  function startSession(nextUser) {
    setUser(nextUser);
    setView(nextUser?.role === 'COURIER' ? 'pedidos' : 'inicio');
  }

  function resetSession() {
    setDrawerOpen(false);
    setUser(null);
    setNotice(null);
  }

  function handleLogin(nextUser) {
    setLoginMessage('');
    startSession(nextUser);
  }

  async function handleLogout() {
    try {
      await auth.logout();
    } catch {
      // Aunque falle la red, la interfaz sale; la sesión caduca sola.
    }
    resetSession();
  }

  function navigate(nextView) {
    setDrawerOpen(false);
    setNotice(null);
    setView(nextView);
  }

  function handleBottomNav(item) {
    navigate(item.id);
  }

  function handleDrawerNav(section) {
    if (DRAWER_VIEWS[section]) {
      navigate(DRAWER_VIEWS[section]);
      return;
    }
    setDrawerOpen(false);
    setNotice(`La sección «${section}» todavía no está disponible.`);
  }

  if (user === undefined) {
    return (
      <div className="app-loading" role="status">
        <span className="brand-circle" aria-hidden="true">BY</span>
        <p>Conectando con el servidor…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} connectionError={loginMessage} />
        <PwaStatus />
      </>
    );
  }

  const isAdmin = user.role === 'ADMIN';
  const openDrawer = () => setDrawerOpen(true);
  const title = !isAdmin && view === 'pedidos' ? 'Mis pedidos' : TITLES[view];

  return (
    <div className="app-shell" ref={shell}>
      {isAdmin && (
        <div className="view-panel" hidden={view !== 'inicio'}>
          <Dashboard session={user} onOpenDrawer={openDrawer} onSelectNav={handleBottomNav} />
        </div>
      )}
      <div className="view-panel" hidden={view === 'inicio'}>
        <Header title={title} usuario={user.nombre} onOpenDrawer={openDrawer} />
        <main className="management-main">
          <div className="view-panel" hidden={view !== 'pedidos'}>
            <Orders user={user} active={view === 'pedidos'} />
          </div>
          {isAdmin && (
            <>
              <div className="view-panel" hidden={view !== 'domicilios'}><Couriers active={view === 'domicilios'} /></div>
              <div className="view-panel" hidden={view !== 'productos'}><Products /></div>
            </>
          )}
        </main>
        {isAdmin && <BottomNav active={view} onSelect={handleBottomNav} />}
      </div>
      <Drawer
        open={drawerOpen}
        role={ROLE_LABEL[user.role]}
        usuario={user.nombre}
        items={DRAWER_ITEMS[user.role]}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleDrawerNav}
        onLogout={handleLogout}
      />
      {notice && (
        <div className={`notice-toast${isAdmin ? '' : ' notice-toast--low'}`} role="status">
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

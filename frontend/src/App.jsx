import { useEffect, useRef, useState } from 'react';
import { auth, SESSION_EXPIRED_EVENT } from './api/client.js';
import { Spinner } from './components/Spinner.jsx';
import { BOOT_DONE_MS, pause } from './features/feedback/timing.js';
import { Login } from './components/Login.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { PwaStatus } from './components/PwaStatus.jsx';
import { Header } from './components/Header.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { MoreMenu } from './components/MoreMenu.jsx';
import { Products } from './features/products/Products.jsx';
import { Orders } from './features/orders/Orders.jsx';
import { Admins } from './features/admins/Admins.jsx';
import { useOrderAlerts } from './features/alerts/useOrderAlerts.js';
import { Couriers } from './features/couriers/Couriers.jsx';
import { Toast } from './features/feedback/Toast.jsx';
import { releasePush, syncPush } from './features/push/push.js';
import { ProfilePanel } from './features/profile/ProfilePanel.jsx';
import { Settings } from './features/settings/Settings.jsx';
import { applyPreferences, loadPreferences } from './features/settings/preferences.js';
import './features/management.css';

const ROLE_LABEL = { ADMIN: 'Administrador', COURIER: 'Domiciliario' };
const TITLES = { inicio: 'Inicio', pedidos: 'Pedidos', domicilios: 'Domicilios', mas: 'Más', productos: 'Productos', configuracion: 'Configuración' };
// Pantallas de segundo nivel: se entra desde «Más» y el encabezado ofrece volver.
const UNDER_MORE = new Set(['productos', 'configuracion']);

export default function App() {
  // undefined = comprobando sesión; null = sin sesión.
  const [user, setUser] = useState(undefined);
  const [loginMessage, setLoginMessage] = useState('');
  const [view, setView] = useState('inicio');
  const [profileOpen, setProfileOpen] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const shell = useRef(null);
  const alerts = useOrderAlerts({ user, pedidosActive: view === 'pedidos' });

  useEffect(() => {
    const startedAt = Date.now();
    auth.session()
      .then(async (result) => {
        if (result.usuario && Date.now() - startedAt > 300) {
          setBootDone(true);
          await pause(BOOT_DONE_MS);
        }
        startSession(result.usuario ?? null);
      })
      .catch((error) => {
        setUser(null);
        setLoginMessage(error.message);
      });
    function onExpired() {
      resetSession();
      setLoginMessage('Tu sesión terminó. Inicia sesión de nuevo.');
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    const scheme = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onScheme = () => applyPreferences(loadPreferences());
    scheme?.addEventListener?.('change', onScheme);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      scheme?.removeEventListener?.('change', onScheme);
    };
  }, []);

  useEffect(() => {
    shell.current?.scrollIntoView?.({ block: 'start' });
    shell.current?.querySelector('h1')?.focus({ preventScroll: true });
  }, [view]);

  function startSession(nextUser) {
    setUser(nextUser);
    setView(nextUser?.role === 'COURIER' ? 'pedidos' : 'inicio');
    if (nextUser) syncPush();
  }

  function resetSession() {
    setProfileOpen(false);
    setUser(null);
  }

  function handleLogin(nextUser) {
    setLoginMessage('');
    startSession(nextUser);
  }

  async function handleLogout() {
    try {
      await releasePush();
      await auth.logout();
    } catch {
      // Aunque falle la red, la interfaz sale; la sesión caduca sola.
    }
    resetSession();
  }

  function handleBottomNav(item) {
    setView(item.id);
  }

  function openProfile() {
    setProfileOpen(true);
  }

  if (user === undefined) {
    return (
      <div className="app-loading" role="status">
        <Spinner size="lg" done={bootDone} label={bootDone ? '¡Listo!' : 'Conectando con el servidor…'} />
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
  const title = !isAdmin && view === 'pedidos' ? 'Mis pedidos' : TITLES[view];
  const underMore = UNDER_MORE.has(view);

  return (
    <div className="app-shell" ref={shell}>
      <Header title={title} user={user} onBack={underMore ? () => setView('mas') : undefined} onOpenProfile={openProfile} />
      <main className="app-main">
        {isAdmin && (
          <div className="view-panel" hidden={view !== 'inicio'}>
            <Dashboard active={view === 'inicio'} onSelectNav={handleBottomNav} />
          </div>
        )}
        <div className="view-panel management-main" hidden={view !== 'pedidos'}>
          <Orders user={user} active={view === 'pedidos'} onFetched={alerts.report} onChanged={alerts.baseline} />
        </div>
        {isAdmin && (
          <>
            <div className="view-panel management-main management-stack" hidden={view !== 'domicilios'}>
              <Couriers active={view === 'domicilios'} />
              {user.principal && <Admins active={view === 'domicilios'} />}
            </div>
            <div className="view-panel management-main" hidden={view !== 'productos'}><Products active={view === 'productos'} /></div>
          </>
        )}
        <div className="view-panel management-main" hidden={view !== 'mas'}>
          <MoreMenu user={user} roleLabel={ROLE_LABEL[user.role]} onOpenProfile={openProfile} onNavigate={setView} onLogout={handleLogout} />
        </div>
        <div className="view-panel management-main" hidden={view !== 'configuracion'}><Settings onOpenProfile={openProfile} /></div>
      </main>
      <BottomNav admin={isAdmin} active={underMore ? 'mas' : view} onSelect={handleBottomNav} badges={{ pedidos: alerts.unseen }} />
      <Toast notice={alerts.notice} onClose={alerts.closeNotice} />
      <ProfilePanel open={profileOpen} user={user} onClose={() => setProfileOpen(false)} onUpdated={setUser} onLogout={handleLogout} />
      <PwaStatus />
    </div>
  );
}

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Grid2X2, House, Layers3, X } from 'lucide-react';
import { activateApp, closeApp, openApp, restoreApp } from '../../core/appManager';
import { getAppDefinition, getRegisteredApps } from '../../core/appRegistry';
import { useSystem } from '../../core/useSystem';
import { getWallpaperDefinition, useWallpaper, useWallpaperRevision } from '../../core/wallpaperManager';
import { getAdminSessionVersion, isAdminAuthenticated, subscribeAdminSession } from '../../services/authService';
import AppHost from '../../features/windows/AppHost';
import NotificationCenter from '../../features/notifications/NotificationCenter';
import QuickControls from '../../features/quick-controls/QuickControls';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import MobileHome from './home/MobileHome';
import MobileAppDrawer from './apps/MobileAppDrawer';
import MobileAppSwitcher from './apps/MobileAppSwitcher';
import MobileStatusBar from './system/MobileStatusBar';
import './Mobile.css';

/* === SISTEMA MOBILE === */
export default function Mobile({ theme, onThemeChange }) {
  useLocale();
  const { appState, run, notificationState, handleNotificationAction } = useSystem();
  const wallpaper = useWallpaper('mobile');
  useWallpaperRevision();
  useSyncExternalStore(subscribeAdminSession, getAdminSessionVersion, getAdminSessionVersion);
  const authorized = isAdminAuthenticated();
  const shared = appState.instances.find((item) => item.origin === 'shared-link');
  const [screen, setScreen] = useState(shared ? 'app' : 'home');
  const [selectedInstanceId, setSelectedInstanceId] = useState(shared?.id ?? null);
  const [activePanel, setActivePanel] = useState(null);
  const gesture = useRef(null);

  /* === INSTÂNCIAS E PERMISSÕES === */
  const apps = getRegisteredApps().filter((app) => (app.public && app.showInMenu !== false) || (authorized && app.id === 'administration'));
  const instances = appState.instances.filter((instance) => {
    const app = getAppDefinition(instance.appId);
    return !instance.closing && (app?.public || (authorized && instance.appId === 'administration'));
  });
  const selected = instances.find((instance) => instance.id === selectedInstanceId);
  const visibleScreen = screen === 'app' && !selected ? 'home' : screen;
  const notifications = notificationState?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  /* === AÇÕES DO SISTEMA === */
  function openMobileApp(appId, params = {}) {
    run(openApp, appId, { origin: 'mobile', params, onOpened: ({ instanceId }) => {
      setSelectedInstanceId(instanceId);
      setScreen('app');
      setActivePanel(null);
    } });
  }
  function resume(instance) {
    if (!instance || instance.closing) return;
    run(instance.minimized ? restoreApp : activateApp, instance.id);
    setSelectedInstanceId(instance.id);
    setScreen('app');
    setActivePanel(null);
  }
  function close(instanceId) {
    if (!instances.some((instance) => instance.id === instanceId)) return;
    run(closeApp, instanceId, { animate: false, onClosed: () => {
      setSelectedInstanceId((id) => id === instanceId ? null : id);
      setScreen((current) => current === 'app' && selectedInstanceId === instanceId ? 'home' : current);
    } });
  }
  function goHome() { setActivePanel(null); setScreen('home'); }
  function closeCurrentApp() {
    if (selected) close(selected.id);
  }
  function togglePanel(name) { setActivePanel((current) => current === name ? null : name); }
  function openNotification(notification) {
    const appId = notification?.action?.appId;
    if (!appId) return;
    const app = getAppDefinition(appId);
    if (!app?.public) return;
    const instance = [...appState.instances].reverse().find((item) => item.appId === appId);
    handleNotificationAction('read', notification.id);
    if (instance) resume(instance);
    else openMobileApp(appId);
    setActivePanel(null);
  }

  /* === GESTOS DO SISTEMA === */
  function gestureStart(event) {
    if (event.touches.length !== 1 || activePanel) return;
    const touch = event.touches[0];
    gesture.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), height: window.innerHeight, width: window.innerWidth };
  }
  function gestureEnd(event) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) < 75 || Math.abs(dy) < Math.abs(dx) * 1.5) return;
    if (dy > 0 && start.y < 55) { setActivePanel(start.x > start.width * 0.65 ? 'controls' : 'notifications'); return; }
    if (visibleScreen !== 'app' && dy < 0 && start.y > start.height - 75) {
      if (visibleScreen === 'home') setScreen('drawer');
      else if (Date.now() - start.time > 380) setScreen('switcher');
      else goHome();
    }
  }
  useEffect(() => {
    function keyDown(event) {
      if (event.key !== 'Escape') return;
      if (activePanel) { setActivePanel(null); return; }
      if (screen !== 'home') { setScreen('home'); setActivePanel(null); }
    }
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [activePanel, screen]);

  /* === INTERFACE === */
  return <main id="ws-mobile" className="ws-mobile" data-screen={visibleScreen} tabIndex={-1} onTouchStartCapture={gestureStart} onTouchEndCapture={gestureEnd}>
    <div className="ws-mobile__wallpaper" aria-hidden="true" style={{ background: getWallpaperDefinition(wallpaper, 'mobile').background }} />
    <MobileStatusBar unreadCount={unreadCount} activePanel={activePanel} onTogglePanel={togglePanel} />
    {visibleScreen === 'home' && <MobileHome apps={apps} onOpenApp={openMobileApp} onOpenDrawer={() => setScreen('drawer')} />}
    {visibleScreen === 'drawer' && <MobileAppDrawer apps={apps} onOpenApp={openMobileApp} onBack={goHome} />}
    {visibleScreen === 'switcher' && <MobileAppSwitcher instances={instances} activeInstanceId={selectedInstanceId} onSelect={resume} onClose={close} onHome={goHome} />}
    {visibleScreen === 'app' && selected && (
      <header className="ws-mobile__app-toolbar">
        <div className="ws-mobile__app-toolbar-start">
          <button type="button" className="ws-mobile__app-action" aria-label={t('Início')} title={t('Início')} onClick={goHome}>
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className="ws-mobile__app-identity">
            <span className="ws-mobile__app-eyebrow">WS OS</span>
            <strong>{t(getAppDefinition(selected.appId)?.name ?? '')}</strong>
          </div>
        </div>
        <div className="ws-mobile__app-toolbar-actions">
          <button type="button" className="ws-mobile__app-action" aria-label={t('Início')} title={t('Início')} onClick={goHome}>
            <House size={19} aria-hidden="true" />
          </button>
          <button type="button" className="ws-mobile__app-action" aria-label={t('Aplicativos')} title={t('Aplicativos')} onClick={() => setScreen('switcher')}>
            <Layers3 size={19} aria-hidden="true" />
          </button>
          <button type="button" className="ws-mobile__app-action ws-mobile__app-action--close" aria-label={t('Fechar')} title={t('Fechar')} onClick={closeCurrentApp}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </header>
    )}
    <section className="ws-mobile__app-content" hidden={visibleScreen !== 'app'}>
      {instances.map((instance) => {
        const app = getAppDefinition(instance.appId);
        const visible = visibleScreen === 'app' && selected?.id === instance.id;
        return <div key={instance.id} className="ws-mobile__instance" hidden={!visible} inert={!visible}>
          <AppHost appName={app.name} instance={app.pauseWhenMinimized && !visible ? { ...instance, executionState: 'paused' } : instance} />
        </div>;
      })}
    </section>
    {activePanel && <div className="ws-mobile__overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePanel(null); }}>
      <div className="ws-mobile__panel" role="dialog" aria-modal="true" aria-label={activePanel === 'notifications' ? t('Notificações') : t('Controle Rápido')}>
        {activePanel === 'notifications' ? <NotificationCenter unreadCount={unreadCount} notifications={notifications} setNotificationOpen={(open) => setActivePanel(open ? 'notifications' : null)} onNotificationAction={handleNotificationAction} onNotificationOpen={openNotification} /> : <QuickControls theme={theme} onThemeChange={onThemeChange} setQuickControlsOpen={(open) => setActivePanel(open ? 'controls' : null)} showAutoHideTaskbar={false} />}
      </div>
    </div>}
    {visibleScreen !== 'app' && (
      <nav className="ws-mobile__bottom-navigation" aria-label={t('Aplicativos')}>
        <button type="button" className="ws-mobile__navigation-button" aria-label={t('Início')} title={t('Início')} onClick={goHome}>
          <House size={19} aria-hidden="true" />
          <span>{t('Início')}</span>
        </button>
        <button type="button" className="ws-mobile__navigation-button" aria-label={t('Aplicativos')} title={t('Aplicativos')} onClick={() => { setActivePanel(null); setScreen('drawer'); }}>
          <Grid2X2 size={19} aria-hidden="true" />
          <span>{t('Aplicativos')}</span>
        </button>
        <button type="button" className="ws-mobile__navigation-button" aria-label={t('Recentes')} title={t('Recentes')} onClick={() => { setActivePanel(null); setScreen('switcher'); }}>
          <Layers3 size={19} aria-hidden="true" />
          <span>{t('Recentes')}</span>
        </button>
      </nav>
    )}
  </main>;
}

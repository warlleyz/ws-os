import { handleAppBack } from '../../core/navigationManager';

import { useEffect, useRef, useState } from 'react';
import { Bell, Settings2 } from 'lucide-react';
import {
  useWallpaper,
  useWallpaperRevision,
  getWallpaperDefinition,
} from '../../core/wallpaperManager';
import { useMobilePreferences } from '../../core/mobilePreferences';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useSystem } from '../../core/useSystem';
import { getRegisteredApps, getAppDefinition } from '../../core/appRegistry';
import { openApp, closeApp, activateApp, restoreApp } from '../../core/appManager';

import AppHost from '../../features/windows/AppHost';
import NotificationCenter from '../../features/notifications/NotificationCenter';
import QuickControls from '../../features/quick-controls/QuickControls';

import MobileHome from './MobileHome';
import MobileCatalog from './MobileCatalog';
import MobileNavigation from './MobileNavigation';

import './Mobile.css';

export default function Mobile({ theme, onThemeChange }) {
  useLocale();

  const mobilePreferences = useMobilePreferences();
  const wallpaper = useWallpaper('mobile');
  useWallpaperRevision();

  const { appState, run, notificationState, handleNotificationAction, handleNotificationOpen } =
    useSystem();

  const [screen, setScreen] = useState('home');
  const [appOrigin, setAppOrigin] = useState('home');
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);

  const panelRef = useRef(null);
  const panelTriggerRef = useRef(null);

  const notifications = notificationState?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  const apps = getRegisteredApps().filter(
    (app) => app.public && (app.showInMenu !== false || app.id === 'wally-extended'),
  );

  const activeInstance = appState.instances.find(
    (instance) => instance.id === appState.activeInstanceId,
  );

  const selectedInstance =
    screen === 'app'
      ? (activeInstance ??
        [...appState.instances].reverse().find((instance) => instance.appId === selectedAppId))
      : null;

  const currentApp = selectedInstance ? getAppDefinition(selectedInstance.appId) : null;

  useEffect(() => {
    if (!activePanel) return;

    const panel = panelRef.current;
    const previousFocus = panelTriggerRef.current;

    const firstControl = panel?.querySelector(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
    );

    firstControl?.focus();

    return () => {
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [activePanel]);

  function closePanel() {
    setActivePanel(null);
  }

  function togglePanel(name, event) {
    panelTriggerRef.current = event.currentTarget;

    setActivePanel((current) => (current === name ? null : name));
  }

  function handlePanelKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePanel();
      return;
    }

    if (event.key !== 'Tab') return;

    const controls = Array.from(
      panelRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => element.getClientRects().length > 0);

    if (controls.length === 0) {
      event.preventDefault();
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openMobileApp(appId) {
    setAppOrigin(screen === 'catalog' || screen === 'search' ? screen : 'home');

    setSelectedAppId(appId);
    setScreen('app');
    closePanel();

    run(openApp, appId, { origin: 'mobile' });
  }

  function navigateTo(nextScreen) {
    closePanel();
    setSelectedAppId(null);
    setScreen(nextScreen);
  }

  function goBack() {
    closePanel();
    if (handleAppBack(selectedInstance?.id)) return;

    const originAppId = selectedInstance?.origin;

    if (selectedInstance?.appId !== originAppId && originAppId && originAppId !== 'mobile') {
      const originInstance = [...appState.instances]
        .reverse()
        .find((instance) => instance.appId === originAppId);

      if (originInstance) {
        run(originInstance.minimized ? restoreApp : activateApp, originInstance.id);

        setSelectedAppId(originAppId);
        setScreen('app');
        return;
      }
    }

    setSelectedAppId(null);
    setScreen(appOrigin);
  }

  function closeMobileApp() {
    const instanceToClose = selectedInstance;

    if (!instanceToClose) {
      goBack();
      return;
    }

    const originInstance = [...appState.instances]
      .reverse()
      .find(
        (instance) =>
          instance.appId === instanceToClose.origin && instance.id !== instanceToClose.id,
      );

    if (run(closeApp, instanceToClose.id) === false) return;

    if (originInstance) {
      run(originInstance.minimized ? restoreApp : activateApp, originInstance.id);

      setSelectedAppId(originInstance.appId);
      setScreen('app');
      closePanel();
      return;
    }

    setSelectedAppId(null);
    setScreen(appOrigin);
    closePanel();
  }

  function openNotificationApp(notification) {
    const appId = notification?.action?.appId;
    const app = getAppDefinition(appId);

    if (!app?.public) return;

    setAppOrigin('home');
    setSelectedAppId(appId);
    setScreen('app');

    handleNotificationOpen(notification);
    closePanel();
  }

  const visibleScreen = screen === 'app' && !selectedInstance ? 'home' : screen;

  return (
    <main
      id="ws-mobile"
      className="ws-mobile"
      data-grid-density={mobilePreferences.gridDensity}
      tabIndex={-1}
    >
      <div
        className="ws-mobile__wallpaper"
        aria-hidden="true"
        style={{ background: getWallpaperDefinition(wallpaper, 'mobile').background }}
      />
      <div className="ws-mobile__content-shell" inert={Boolean(activePanel)}>
        <div className="ws-mobile__system-bar">
          <strong>WS OS</strong>

          <div className="ws-mobile__system-actions">
            <button
              type="button"
              aria-label={t('Notificações')}
              aria-expanded={activePanel === 'notifications'}
              onClick={(event) => togglePanel('notifications', event)}
            >
              <Bell size={19} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="ws-mobile__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            <button
              type="button"
              aria-label={t('Controle Rápido')}
              aria-expanded={activePanel === 'controls'}
              onClick={(event) => togglePanel('controls', event)}
            >
              <Settings2 size={19} aria-hidden="true" />
            </button>
          </div>
        </div>

        {visibleScreen === 'app' ? (
          <header className="ws-mobile__header">
            <button type="button" onClick={goBack}>
              ← {t('Voltar')}
            </button>

            <strong>{t(currentApp?.name ?? '')}</strong>

            <button
              type="button"
              aria-label={t('Fechar')}
              disabled={!selectedInstance}
              onClick={closeMobileApp}
            >
              ×
            </button>
          </header>
        ) : null}

        {visibleScreen === 'home' && (
          <MobileHome
            apps={apps}
            onOpenApp={openMobileApp}
            onOpenCatalog={() => navigateTo('catalog')}
          />
        )}

        {(visibleScreen === 'catalog' || visibleScreen === 'search') && (
          <MobileCatalog
            key={screen}
            apps={apps}
            onOpenApp={openMobileApp}
            searchMode={visibleScreen === 'search'}
          />
        )}

        {visibleScreen === 'app' && !selectedInstance && (
          <p className="ws-mobile__loading" role="status">
            {t('Carregando')}
          </p>
        )}

        <section
          className="ws-mobile__app-content"
          hidden={visibleScreen !== 'app'}
          aria-label={t(currentApp?.name ?? 'Aplicativos')}
        >
          {appState.instances
            .filter((instance) => getAppDefinition(instance.appId)?.public)
            .map((instance) => {
              const app = getAppDefinition(instance.appId);
              const isVisible = visibleScreen === 'app' && selectedInstance?.id === instance.id;

              return (
                <div
                  key={instance.id}
                  className="ws-mobile__instance"
                  hidden={!isVisible}
                  inert={!isVisible}
                >
                  <AppHost
                    appName={app.name}
                    instance={
                      app.pauseWhenMinimized && !isVisible
                        ? { ...instance, executionState: 'paused' }
                        : instance
                    }
                  />
                </div>
              );
            })}
        </section>

        <MobileNavigation activeScreen={visibleScreen} onNavigate={navigateTo} />
      </div>

      {activePanel && (
        <div
          className="ws-mobile__overlay"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              closePanel();
            }
          }}
        >
          <div
            ref={panelRef}
            className="ws-mobile__panel"
            role="dialog"
            aria-modal="true"
            aria-label={t(activePanel === 'notifications' ? 'Notificações' : 'Controle Rápido')}
            onKeyDown={handlePanelKeyDown}
          >
            {activePanel === 'notifications' && (
              <NotificationCenter
                unreadCount={unreadCount}
                setNotificationOpen={closePanel}
                notifications={notifications}
                onNotificationAction={handleNotificationAction}
                onNotificationOpen={openNotificationApp}
              />
            )}

            {activePanel === 'controls' && (
              <QuickControls
                setQuickControlsOpen={closePanel}
                theme={theme}
                onThemeChange={onThemeChange}
                showAutoHideTaskbar={false}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

import { Bell, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import {
  activateApp,
  closeApp,
  openApp,
  restoreApp,
} from '../../core/appManager';
import {
  getAppDefinition,
  getRegisteredApps,
} from '../../core/appRegistry';
import { useMobilePreferences } from '../../core/mobilePreferences';
import {
  handleAppBack,
  resolveContextualBack,
} from '../../core/navigationManager';
import { useSystem } from '../../core/useSystem';
import {
  getWallpaperDefinition,
  useWallpaper,
  useWallpaperRevision,
} from '../../core/wallpaperManager';

import NotificationCenter from '../../features/notifications/NotificationCenter';
import QuickControls from '../../features/quick-controls/QuickControls';
import AppHost from '../../features/windows/AppHost';

import {
  getAdminSessionVersion,
  isAdminAuthenticated,
  subscribeAdminSession,
} from '../../services/authService';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import MobileCatalog from './MobileCatalog';
import MobileHome from './MobileHome';
import MobileNavigation from './MobileNavigation';

import './Mobile.css';

export default function Mobile({ theme, onThemeChange }) {
  /* === Idioma e autenticação === */
  useLocale();

  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionVersion,
    getAdminSessionVersion,
  );

  const authorized = isAdminAuthenticated();

  /* === Preferências e aparência === */
  const mobilePreferences = useMobilePreferences();
  const wallpaper = useWallpaper('mobile');

  useWallpaperRevision();

  /* === Integração com o sistema === */
  const {
    appState,
    run,
    notificationState,
    handleNotificationAction,
    handleNotificationOpen,
  } = useSystem();

  /* === Estado de navegação === */
  /* ----- Tela inicial e compartilhamento ----- */
  const [screen, setScreen] = useState(() =>
    appState.instances.some((item) => item.origin === 'shared-link')
      ? 'app'
      : 'home',
  );

  const [appOrigin, setAppOrigin] = useState('home');

  const [selectedAppId, setSelectedAppId] = useState(
    () =>
      appState.instances.find((item) => item.origin === 'shared-link')?.appId ??
      null,
  );

  /* ----- Painéis sobrepostos ----- */
  const [activePanel, setActivePanel] = useState(null);

  const panelRef = useRef(null);
  const panelTriggerRef = useRef(null);
  const appStateRef = useRef(appState);

  /* === Dados do sistema === */
  /* ----- Notificações ----- */
  const notifications = notificationState?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  /* ----- Catálogo de aplicativos ----- */
  const apps = getRegisteredApps().filter(
    (app) =>
      (app.public &&
        (app.showInMenu !== false || app.id === 'wally-extended')) ||
      (authorized && app.id === 'administration'),
  );

  /* ----- Instância ativa ----- */
  const activeInstance = appState.instances.find(
    (instance) => instance.id === appState.activeInstanceId,
  );

  const selectedInstance =
    screen === 'app'
      ? (
        activeInstance ??
        [...appState.instances]
          .reverse()
          .find((instance) => instance.appId === selectedAppId)
      )
      : null;

  const currentApp = selectedInstance
    ? getAppDefinition(selectedInstance.appId)
    : null;

  const visibleScreen =
    screen === 'app' && !selectedInstance ? 'home' : screen;

  /* === Sincronização da navegação === */
  /* ----- Atualização da referência da sessão ----- */
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  /* === Acessibilidade dos painéis === */
  /* ----- Gerenciamento de foco ----- */
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

  /* === Controle dos painéis === */
  /* ----- Fechamento ----- */
  function closePanel() {
    setActivePanel(null);
  }

  /* ----- Alternância ----- */
  function togglePanel(name, event) {
    panelTriggerRef.current = event.currentTarget;

    setActivePanel((current) =>
      current === name ? null : name,
    );
  }

  /* ----- Navegação por teclado ----- */
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

  /* === Navegação entre telas === */
  /* ----- Abertura de aplicativos ----- */
  function openMobileApp(appId, params = {}) {
    const origin =
      screen === 'catalog' || screen === 'search'
        ? screen
        : 'home';

    run(openApp, appId, {
      origin: 'mobile',
      params,
      onOpened: () => {
        setAppOrigin(origin);
        setSelectedAppId(appId);
        setScreen('app');
        closePanel();
      },
    });
  }

  /* ----- Navegação principal ----- */
  function navigateTo(nextScreen) {
    const finish = () => {
      closePanel();
      setSelectedAppId(null);
      setScreen(nextScreen);
    };

    if (selectedInstance) {
      run(closeApp, selectedInstance.id, {
        onClosed: finish,
      });
    } else {
      finish();
    }
  }

  /* === Retorno de aplicativos === */
  /* ----- Retorno interno ----- */
  function goBack() {
    closePanel();

    if (handleAppBack(selectedInstance?.id)) return;

    closeMobileApp();
  }

  /* ----- Resolução de retorno contextual ----- */
  function getReturnDestination(current, state) {
    if (!current?.navigationOrigin) return null;

    const remainingState = {
      ...state,
      instances: state.instances.filter(
        (instance) => instance.id !== current.id,
      ),
      focusHistory: state.focusHistory.filter(
        (id) => id !== current.id,
      ),
    };

    return resolveContextualBack(
      remainingState,
      current.navigationOrigin,
      getAppDefinition,
    );
  }

  /* ----- Fechamento e retorno à origem ----- */
  function closeMobileApp() {
    const current = selectedInstance;

    const finish = () => {
      const latestState = appStateRef.current;

      const destination = getReturnDestination(
        current,
        latestState,
      );

      /* ----- Retorno à instância de origem ----- */
      if (destination?.type === 'instance') {
        const origin = latestState.instances.find(
          (instance) =>
            instance.id === destination.instanceId &&
            instance.id !== current?.id,
        );

        if (origin) {
          const activated = run(
            origin.minimized ? restoreApp : activateApp,
            origin.id,
          );

          if (activated) {
            setSelectedAppId(origin.appId);
            setScreen('app');
            closePanel();
            return;
          }
        }
      }

      /* ----- Retorno à navegação principal ----- */
      setSelectedAppId(null);
      setScreen(
        destination?.type === 'home'
          ? 'home'
          : appOrigin,
      );
      closePanel();
    };

    /* ----- Solicitação de fechamento protegido ----- */
    if (current) {
      run(closeApp, current.id, {
        onClosed: finish,
      });

      return;
    }

    finish();
  }

  /* === Navegação por notificações === */
  /* ----- Abertura do aplicativo associado ----- */
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

  /* === Renderização === */
  return (
    <main
      id="ws-mobile"
      className="ws-mobile"
      data-grid-density={mobilePreferences.gridDensity}
      tabIndex={-1}
    >
      {/* === Papel de parede === */}
      <div
        className="ws-mobile__wallpaper"
        aria-hidden="true"
        style={{
          background: getWallpaperDefinition(wallpaper, 'mobile').background,
        }}
      />

      {/* === Estrutura principal === */}
      <div
        className="ws-mobile__content-shell"
        inert={Boolean(activePanel)}
      >
        {/* ----- Barra superior do sistema ----- */}
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
                <span className="ws-mobile__badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
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

        {/* ----- Cabeçalho do aplicativo ----- */}
        {visibleScreen === 'app' && (
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
        )}

        {/* === Telas de navegação === */}
        {/* ----- Tela inicial ----- */}
        {visibleScreen === 'home' && (
          <MobileHome
            apps={apps}
            onOpenApp={openMobileApp}
            onOpenCatalog={() => navigateTo('catalog')}
          />
        )}

        {/* ----- Catálogo e pesquisa ----- */}
        {(visibleScreen === 'catalog' || visibleScreen === 'search') && (
          <MobileCatalog
            key={screen}
            apps={apps}
            onOpenApp={openMobileApp}
            searchMode={visibleScreen === 'search'}
          />
        )}

        {/* ----- Estado de carregamento ----- */}
        {screen === 'app' && !selectedInstance && (
          <p className="ws-mobile__loading" role="status">
            {t('Carregando')}
          </p>
        )}

        {/* === Aplicativos em execução === */}
        <section
          className="ws-mobile__app-content"
          hidden={visibleScreen !== 'app'}
          aria-label={t(currentApp?.name ?? 'Aplicativos')}
        >
          {appState.instances
            .filter(
              (instance) =>
                getAppDefinition(instance.appId)?.public ||
                (authorized && instance.appId === 'administration'),
            )
            .map((instance) => {
              const app = getAppDefinition(instance.appId);
              const isVisible =
                visibleScreen === 'app' &&
                selectedInstance?.id === instance.id;

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

        {/* ----- Navegação inferior ----- */}
        <MobileNavigation
          activeScreen={visibleScreen}
          onNavigate={navigateTo}
        />
      </div>

      {/* === Painéis sobrepostos === */}
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
            aria-label={t(
              activePanel === 'notifications'
                ? 'Notificações'
                : 'Controle Rápido',
            )}
            onKeyDown={handlePanelKeyDown}
          >
            {/* ----- Central de notificações ----- */}
            {activePanel === 'notifications' && (
              <NotificationCenter
                unreadCount={unreadCount}
                setNotificationOpen={closePanel}
                notifications={notifications}
                onNotificationAction={handleNotificationAction}
                onNotificationOpen={openNotificationApp}
              />
            )}

            {/* ----- Controles rápidos ----- */}
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
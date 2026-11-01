import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { activateApp, closeApp, openApp, restoreApp } from '../../core/appManager';
import { getAppDefinition, getRegisteredApps } from '../../core/appRegistry';
import { useMobilePreferences } from '../../core/mobilePreferences';
import { handleAppBack, resolveContextualBack } from '../../core/navigationManager';
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
import MobileHomeIndicator from './components/MobileHomeIndicator';
import MobileStatusBar from './components/MobileStatusBar';

import './Mobile.css';

/* === SHELL MOBILE === */
export default function Mobile({ theme, onThemeChange }) {

  /* === IDIOMA E AUTENTICAÇÃO === */
  useLocale();

  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionVersion,
    getAdminSessionVersion,
  );

  const authorized = isAdminAuthenticated();

  /* === PREFERÊNCIAS E APARÊNCIA === */
  const mobilePreferences = useMobilePreferences();
  const wallpaper = useWallpaper('mobile');

  useWallpaperRevision();

  /* === INTEGRAÇÃO COM O SISTEMA === */
  const {
    appState,
    run,
    notificationState,
    handleNotificationAction,
    handleNotificationOpen,
  } = useSystem();

  /* === ESTADO DE NAVEGAÇÃO === */
  /* ----- Tela inicial e compartilhamento ----- */
  const [screen, setScreen] = useState(() =>
    appState.instances.some((item) => item.origin === 'shared-link')
      ? 'app'
      : 'home',
  );

  const [appOrigin, setAppOrigin] = useState('home');

  const [selectedAppId, setSelectedAppId] = useState(
    () =>
      appState.instances.find((item) => item.origin === 'shared-link')
        ?.appId ?? null,
  );

  /* ----- Painéis sobrepostos ----- */
  const [activePanel, setActivePanel] = useState(null);

  /* === REFERÊNCIAS === */
  const panelRef = useRef(null);
  const appHeaderRef = useRef(null);
  const panelTriggerRef = useRef(null);
  const appStateRef = useRef(appState);

  /* === DADOS DO SISTEMA === */
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

  /* ----- Instâncias acessíveis ----- */
  const accessibleInstances = appState.instances.filter((instance) => {
    const app = getAppDefinition(instance.appId);

    return app?.public || (authorized && instance.appId === 'administration');
  });

  /* ----- Instância ativa ----- */
  const activeInstance = accessibleInstances.find(
    (instance) => instance.id === appState.activeInstanceId,
  );

  /* ----- Instância selecionada ----- */
  const selectedInstance =
    screen === 'app'
      ? activeInstance ??
      [...accessibleInstances]
        .reverse()
        .find((instance) => instance.appId === selectedAppId)
      : null;

  const currentApp = selectedInstance
    ? getAppDefinition(selectedInstance.appId)
    : null;

  const visibleScreen = screen === 'app' && !selectedInstance
    ? 'home'
    : screen;

  /* === EFEITOS DE NAVEGAÇÃO === */
  /* ----- Focar navegação do aplicativo ----- */
  useEffect(() => {
    if (visibleScreen === 'app') {
      appHeaderRef.current
        ?.querySelector('button')
        ?.focus({ preventScroll: true });
    }
  }, [visibleScreen, selectedInstance?.id]);

  /* ----- Atualizar referência da sessão ----- */
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  /* === ACESSIBILIDADE DOS PAINÉIS === */
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

  /* === CONTROLE DOS PAINÉIS === */
  /* ----- Fechamento ----- */
  function closePanel() {
    setActivePanel(null);
  }

  /* ----- Alternância ----- */
  function togglePanel(name, event) {
    panelTriggerRef.current = event.currentTarget;

    setActivePanel((current) => (current === name ? null : name));
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

  /* === NAVEGAÇÃO ENTRE TELAS === */
  /* ----- Abertura de aplicativos ----- */
  function openMobileApp(appId, params = {}) {
    const origin =
      screen === 'catalog' || screen === 'search'
        ? screen
        : 'home';

    run(openApp, appId, {
      origin: 'mobile',
      params,
      onOpened: (opened) => {
        setAppOrigin(origin);
        setSelectedAppId(opened.appId);
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
        animate: false,
      });
    } else {
      finish();
    }
  }

  /* === RETORNO DE APLICATIVOS === */
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

      const destination = getReturnDestination(current, latestState);

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
      setScreen(destination?.type === 'home' ? 'home' : appOrigin);
      closePanel();
    };

    /* ----- Solicitação de fechamento protegido ----- */
    if (current) {
      run(closeApp, current.id, {
        onClosed: finish,
        animate: false,
      });

      return;
    }

    finish();
  }

  /* === NAVEGAÇÃO POR NOTIFICAÇÕES === */
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

  /* === RENDERIZAÇÃO DO SHELL === */
  return (
    <main
      id="ws-mobile"
      className="ws-mobile"
      data-grid-density={mobilePreferences.gridDensity}
      data-screen={visibleScreen}
      tabIndex={-1}
    >
      {/* === PAPEL DE PAREDE === */}
      <div
        className="ws-mobile__wallpaper"
        aria-hidden="true"
        style={{
          background: getWallpaperDefinition(wallpaper, 'mobile').background,
        }}
      />

      {/* === ESTRUTURA PRINCIPAL === */}
      <div
        className="ws-mobile__content-shell"
        inert={Boolean(activePanel)}
      >
        {/* ----- Barra de status ----- */}
        <MobileStatusBar
          unreadCount={unreadCount}
          activePanel={activePanel}
          onTogglePanel={togglePanel}
        />

        {/* ----- Cabeçalho do aplicativo ----- */}
        {visibleScreen === 'app' && (
          <header
            ref={appHeaderRef}
            className="ws-mobile__header"
          >
            <button type="button" onClick={goBack}>
              ← {t('Voltar')}
            </button>

            <strong>{t(currentApp?.name ?? '')}</strong>

            <button
              type="button"
              aria-label={t('Fechar')}
              title={t('Fechar')}
              disabled={!selectedInstance}
              onClick={closeMobileApp}
            >
              ×
            </button>
          </header>
        )}

        {/* === TELAS DE NAVEGAÇÃO === */}
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

        {/* === APLICATIVOS EM EXECUÇÃO === */}
        <section
          className="ws-mobile__app-content"
          hidden={visibleScreen !== 'app'}
          aria-label={t(currentApp?.name ?? 'Aplicativos')}
        >
          {accessibleInstances.map((instance) => {
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
                      ? {
                        ...instance,
                        executionState: 'paused',
                      }
                      : instance
                  }
                />
              </div>
            );
          })}
        </section>

        {/* ----- Navegação temporária ----- */}
        <MobileNavigation
          activeScreen={visibleScreen}
          onNavigate={navigateTo}
        />

        {/* ----- Indicador inferior ----- */}
        <MobileHomeIndicator
          onHome={() => navigateTo('home')}
        />
      </div>

      {/* === PAINÉIS SOBREPOSTOS === */}
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
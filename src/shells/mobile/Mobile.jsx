import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Bell, Search, Settings2, X } from 'lucide-react';

import { activateApp, closeApp, openApp, restoreApp } from '../../core/appManager';
import { getAppDefinition, getRegisteredApps } from '../../core/appRegistry';
import { useMobilePreferences } from '../../core/mobilePreferences';
import { resolveNavigationOrigin } from '../../core/navigationManager';
import { useSystem } from '../../core/useSystem';
import {
  getWallpaperDefinition,
  useWallpaper,
  useWallpaperRevision,
} from '../../core/wallpaperManager';

import NotificationCenter from '../../features/notifications/NotificationCenter';
import NotificationToasts from '../../features/notifications/NotificationToasts';
import QuickControls from '../../features/quick-controls/QuickControls';
import AppHost from '../../features/windows/AppHost';

import {
  getAdminSessionVersion,
  isAdminAuthenticated,
  subscribeAdminSession,
} from '../../services/authService';

import { AppIcon } from '../../shared/components/AppIcon';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import MobileWeatherStatus from './system/MobileWeatherStatus';
import MobileWidgets from './home/MobileWidgets';
import GlobalSearchResults from '../../features/search/GlobalSearchResults';
import { normalizeSearch } from '../../features/search/searchService';
import '../../features/search/GlobalSearchResults.css';

import './Mobile.css';

/* === CONFIGURAÇÕES MOBILE === */
const SWIPE_THRESHOLD = 60;
const SWIPE_RATIO = 1.4;

/* === SISTEMA MOBILE === */
export default function Mobile({ theme, onThemeChange }) {
  const locale = useLocale();
  const mobilePreferences = useMobilePreferences();

  /* === SERVIÇOS DO SISTEMA === */
  const {
    appState,
    run,
    notificationState,
    handleNotificationAction,
    visibleToasts,
    dismissToast,
  } = useSystem();

  const wallpaper = useWallpaper('mobile');

  useWallpaperRevision();

  useSyncExternalStore(subscribeAdminSession, getAdminSessionVersion, getAdminSessionVersion);

  const authorized = isAdminAuthenticated();

  /* === ESTADOS === */
  const sharedInstance = appState.instances.find((instance) => instance.origin === 'shared-link');

  const [screen, setScreen] = useState(sharedInstance ? 'app' : 'apps');

  const [selectedInstanceId, setSelectedInstanceId] = useState(sharedInstance?.id ?? null);

  const [activePanel, setActivePanel] = useState(null);
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  /* === REFERÊNCIAS === */
  const touchStartRef = useRef(null);
  const touchDirectionRef = useRef(null);
  const appStateRef = useRef(appState);
  const panelRef = useRef(null);

  /* === SINCRONIZAÇÃO === */
  /* ----- Estado atualizado ----- */
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  /* ----- Relógio ----- */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  /* === DADOS DOS APLICATIVOS === */
  /* ----- Aplicativos principais ----- */
  const apps = getRegisteredApps().filter(
    (app) =>
      (app.public && (app.desktopShortcut || app.showInMenu)) ||
      (app.public && app.id === 'wally-extended') ||
      (authorized && app.id === 'administration'),
  );

  /* ----- Instâncias acessíveis ----- */
  const instances = appState.instances.filter((instance) => {
    const app = getAppDefinition(instance.appId);

    return (
      !instance.closing && (app?.public || (authorized && instance.appId === 'administration'))
    );
  });

  /* ----- Aplicativo selecionado ----- */
  const selectedInstance =
    instances.find((instance) => instance.id === appState.activeInstanceId) ??
    instances.find((instance) => instance.id === selectedInstanceId);

  const selectedApp = selectedInstance ? getAppDefinition(selectedInstance.appId) : null;

  const visibleScreen = screen === 'app' && !selectedInstance ? 'apps' : screen;

  /* ----- Notificações ----- */
  const notifications = notificationState?.items ?? [];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  /* ----- Data e horário ----- */
  const time = currentTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const date = currentTime.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
  });

  /* === CICLO DE VIDA MOBILE === */
  /* ----- Identificação de descendentes contextuais ----- */
  function findBranchIds(rootId, state) {
    const ids = new Set([rootId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const instance of state.instances) {
        if (ids.has(instance.id)) continue;
        if (ids.has(instance.navigationOrigin?.instanceId)) {
          ids.add(instance.id);
          changed = true;
        }
      }
    }

    return [...ids];
  }

  /* ----- Fechamento protegido dos aplicativos relacionados ----- */
  function closeBranch(rootId, completed) {
    const state = appStateRef.current;
    const branch = findBranchIds(rootId, state);
    const active = state.instances.filter((instance) => branch.includes(instance.id));

    if (!active.length) {
      completed?.();
      return;
    }

    const leaf = active.find(
      (candidate) =>
        !active.some((instance) => instance.navigationOrigin?.instanceId === candidate.id),
    );

    if (!leaf) return;

    run(closeApp, leaf.id, {
      animate: false,
      onClosed: () => closeBranch(rootId, completed),
    });
  }

  /* ----- Retorno para a origem confirmada ----- */
  function returnToOrigin(instance) {
    const origin = resolveNavigationOrigin(appStateRef.current, instance.navigationOrigin);
    const definition = origin && getAppDefinition(origin.appId);

    if (
      origin &&
      !origin.closing &&
      (definition?.public || (authorized && origin.appId === 'administration'))
    ) {
      run(origin.minimized ? restoreApp : activateApp, origin.id);
      setSelectedInstanceId(origin.id);
      setScreen('app');
      setActivePanel(null);
      return;
    }

    setSelectedInstanceId(null);
    setScreen('apps');
    setActivePanel(null);
  }

  /* === ABERTURA DE APLICATIVOS === */
  function openMobileApp(appId, params = {}) {
    function openRequestedApp() {
      run(openApp, appId, {
        origin: 'mobile',
        params,
        onOpened: ({ instanceId }) => {
          setSelectedInstanceId(instanceId);
          setScreen('app');
          setActivePanel(null);
        },
      });
    }

    const current = selectedInstance;
    if (visibleScreen === 'app' && current) {
      const rootId = (() => {
        const visited = new Set();
        let root = current;
        while (root.navigationOrigin?.instanceId && !visited.has(root.id)) {
          visited.add(root.id);
          const parent = appState.instances.find(
            (instance) => instance.id === root.navigationOrigin.instanceId,
          );
          if (!parent) break;
          root = parent;
        }
        return root.id;
      })();

      closeBranch(rootId, openRequestedApp);
      return;
    }

    openRequestedApp();
  }

  /* === FECHAMENTO DE APLICATIVOS === */
  function closeCurrentApp() {
    const current = selectedInstance;
    if (!current) return;

    closeBranch(current.id, () => returnToOrigin(current));
  }

  /* === NAVEGAÇÃO DA HOME === */
  function selectPage(nextPage) {
    setScreen(nextPage);
    setActivePanel(null);
  }

  /* ----- Início do gesto ----- */
  function handleTouchStart(event) {
    touchStartRef.current = null;
    touchDirectionRef.current = null;

    if (
      activePanel ||
      event.target?.closest?.('input, button, .ws-global-search') ||
      visibleScreen === 'app' ||
      event.touches.length !== 1
    ) {
      return;
    }

    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  /* ----- Identificação da direção ----- */
  function handleTouchMove(event) {
    const start = touchStartRef.current;

    if (!start || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (touchDirectionRef.current) return;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 12) {
      return;
    }

    touchDirectionRef.current =
      Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_RATIO ? 'horizontal' : 'vertical';
  }

  /* ----- Conclusão do gesto ----- */
  function handleTouchEnd(event) {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || event.changedTouches.length !== 1) {
      touchDirectionRef.current = null;
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const direction = touchDirectionRef.current;
    touchDirectionRef.current = null;

    if (
      direction !== 'horizontal' ||
      Math.abs(deltaX) < SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY) * SWIPE_RATIO
    ) {
      return;
    }

    if (deltaX < 0 && visibleScreen === 'apps') {
      selectPage('widgets');
    }

    if (deltaX > 0 && visibleScreen === 'widgets') {
      selectPage('apps');
    }
  }

  /* === PAINÉIS === */
  /* ----- Alternância ----- */
  function togglePanel(name) {
    setActivePanel((current) => (current === name ? null : name));
  }

  /* ----- Abrir aplicativo de uma notificação ----- */
  function openNotification(notification) {
    const appId = notification?.action?.appId;
    const app = getAppDefinition(appId);

    if (!app?.public) return;

    handleNotificationAction('read', notification.id);
    openMobileApp(appId);
  }

  /* ----- Teclado ----- */
  useEffect(() => {
    if (!activePanel) return;

    const panel = panelRef.current;
    const previousFocus = document.activeElement;

    panel?.querySelector('button:not(:disabled)')?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActivePanel(null);
        return;
      }

      if (event.key !== 'Tab') return;

      const controls = Array.from(
        panel?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]',
        ) ?? [],
      );

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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [activePanel]);

  /* === INTERFACE === */
  return (
    <main
      id="ws-mobile"
      className="ws-mobile"
      data-screen={visibleScreen}
      data-grid-density={mobilePreferences.gridDensity}
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

      {/* === BARRA SUPERIOR === */}
      <header className="ws-mobile__status-bar">
        {/* ----- Horário e data ----- */}
        <div className="ws-mobile__status-info">
          <time dateTime={currentTime.toISOString()}>{time}</time>
          <span>{date}</span>
        </div>

        {/* ----- Ações do sistema ----- */}
        <div className="ws-mobile__status-actions">
          <MobileWeatherStatus />

          <button
            type="button"
            aria-label={t('Controle Rápido')}
            title={t('Controle Rápido')}
            aria-expanded={activePanel === 'controls'}
            onClick={() => togglePanel('controls')}
          >
            <Settings2 size={19} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={t('Notificações')}
            title={t('Notificações')}
            aria-expanded={activePanel === 'notifications'}
            onClick={() => togglePanel('notifications')}
          >
            <Bell size={19} aria-hidden="true" />

            {unreadCount > 0 && (
              <span className="ws-mobile__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* === PÁGINAS INICIAIS === */}
      {visibleScreen !== 'app' && (
        <section
          className="ws-mobile__desktop"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            touchStartRef.current = null;
            touchDirectionRef.current = null;
          }}
        >
          {/* ----- Página de aplicativos ----- */}
          {visibleScreen === 'apps' && (
            <div className="ws-mobile__home">
              <label className="ws-mobile__search">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('Pesquisar aplicativos e conteúdo')}
                  aria-label={t('Pesquisar aplicativos e conteúdo')}
                />
              </label>
              <div className="ws-mobile__home-grid">
                {apps
                  .filter((app) =>
                    normalizeSearch(t(app.name)).includes(normalizeSearch(search.trim())),
                  )
                  .map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className="ws-mobile__home-app"
                      onClick={() => openMobileApp(app.id)}
                    >
                      <span className="ws-mobile__home-app-icon">
                        <AppIcon app={app} size={28} />
                      </span>
                      <span>{t(app.name)}</span>
                    </button>
                  ))}
              </div>
              {search.trim().length >= 2 && (
                <GlobalSearchResults query={search} onOpen={openMobileApp} />
              )}
            </div>
          )}

          {/* ----- Página de widgets ----- */}
          {visibleScreen === 'widgets' && (
            <MobileWidgets onOpenSettings={() => openMobileApp('settings')} />
          )}

          {/* ----- Navegação entre páginas ----- */}
          <nav className="ws-mobile__pagination" aria-label={t('Navegação Mobile')}>
            <button
              type="button"
              aria-label={t('Aplicativos')}
              aria-current={visibleScreen === 'apps' ? 'page' : undefined}
              onClick={() => selectPage('apps')}
            >
              <span aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="Widgets"
              aria-current={visibleScreen === 'widgets' ? 'page' : undefined}
              onClick={() => selectPage('widgets')}
            >
              <span aria-hidden="true" />
            </button>
          </nav>
        </section>
      )}

      {/* === APLICATIVOS === */}
      <section
        className="ws-mobile__app-content"
        hidden={visibleScreen !== 'app'}
        aria-label={t(selectedApp?.name ?? 'Aplicativos')}
      >
        {instances.map((instance) => {
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

      {/* === BARRA INFERIOR === */}
      {visibleScreen === 'app' && (
        <nav className="ws-mobile__exit-bar">
          <button type="button" onClick={closeCurrentApp} aria-label={t('Fechar')}>
            <X size={18} aria-hidden="true" />
            <span>{t('Fechar')}</span>
          </button>
        </nav>
      )}

      {/* === PAINÉIS SOBREPOSTOS === */}
      {/* ----- Avisos temporários ----- */}
      {visibleToasts?.length > 0 && !activePanel && (
        <div className="ws-mobile__toast-region">
          <NotificationToasts
            visibleToasts={visibleToasts}
            dismissToast={dismissToast}
            handleNotificationOpen={openNotification}
          />
        </div>
      )}
      {activePanel && (
        <div
          className="ws-mobile__overlay"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setActivePanel(null);
            }
          }}
        >
          <div
            ref={panelRef}
            className="ws-mobile__panel"
            role="dialog"
            aria-modal="true"
            aria-label={t(activePanel === 'notifications' ? 'Notificações' : 'Controle Rápido')}
          >
            {activePanel === 'notifications' ? (
              <NotificationCenter
                unreadCount={unreadCount}
                notifications={notifications}
                setNotificationOpen={(open) => {
                  setActivePanel(open ? 'notifications' : null);
                }}
                onNotificationAction={handleNotificationAction}
                onNotificationOpen={openNotification}
              />
            ) : (
              <QuickControls
                theme={theme}
                onThemeChange={onThemeChange}
                setQuickControlsOpen={(open) => {
                  setActivePanel(open ? 'controls' : null);
                }}
                showAutoHideTaskbar={false}
                onOpenSettings={() => openMobileApp('settings')}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

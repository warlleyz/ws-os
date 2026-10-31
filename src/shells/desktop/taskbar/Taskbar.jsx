import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Bell, SlidersHorizontal } from 'lucide-react';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import Tooltip from '../../../shared/components/Tooltip';
import { useSystem } from '../../../core/useSystem';
import {
  activateApp,
  closeApp,
  minimizeApp,
  openApp,
  restoreApp,
  getPreferredInstance,
} from '../../../core/appManager';
import { getAppDefinition } from '../../../core/appRegistry';
import { resolvePanel } from '../../../core/panelManager';
import { getBrandingLogo } from '../../../core/branding';
import { useAppearance } from '../../../core/appearanceManager';
import {
  useTaskbarAutoHide,
  setTaskbarAutoHide,
} from '../../../core/taskbarPreferences';

import useGlobalShortcuts from '../../../features/shortcuts/useGlobalShortcuts';
import useWSMenu from '../../../features/launcher/useWSMenu';
import WSMenu from '../../../features/launcher/WSMenu';
import NotificationCenter from '../../../features/notifications/NotificationCenter';
import QuickControls from '../../../features/quick-controls/QuickControls';
import WallyPanel from '../../../features/wally/WallyPanel';
import CalendarPanel from '../../../features/calendar/CalendarPanel';
import WeatherPanel, {
  WeatherIcon,
} from '../../../features/weather/WeatherPanel';
import PanelLayer from '../../../features/panels/PanelLayer';

import useTaskbarScroll from './useTaskbarScroll';
import useTaskbarPreviews from './useTaskbarPreviews';
import TaskbarApps from './TaskbarApps';
import TaskbarPreview from './TaskbarPreview';
import TaskbarContextMenu from './TaskbarContextMenu';

/* === Barra de tarefas === */
function Taskbar({ onShowDesktop, theme, onThemeChange, weatherData }) {

  /* === Serviços do sistema === */
  /* ----- Idioma e aparência ----- */
  const locale = useLocale();
  const appearance = useAppearance();

  const wsMenuLogo = getBrandingLogo(
    theme,
    appearance.accent,
    import.meta.env.BASE_URL,
  );

  /* ----- Estado global ----- */
  const {
    appState,
    notify,
    run: onAppAction,
    notificationState,
    handleNotificationAction: onNotificationAction,
    handleNotificationOpen: onNotificationOpen,
  } = useSystem();

  /* ----- Dados meteorológicos ----- */
  const {
    weather,
    forecast,
    weatherLoading,
    weatherError,
    requestWeather,
    getWeatherDescription,
    selectedCity,
  } = weatherData;

  /* ----- Notificações ----- */
  const notifications = notificationState?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  /* === Estados da Taskbar === */
  /* ----- Menus contextuais ----- */
  const [contextGroup, setContextGroup] = useState(null);
  const [taskbarContextOpen, setTaskbarContextOpen] = useState(false);

  /* ----- Painéis flutuantes ----- */
  const [activePanel, setActivePanel] = useState(null);

  const menuOpen = activePanel === 'menu';
  const notificationOpen = activePanel === 'notifications';
  const quickControlsOpen = activePanel === 'controls';
  const wallyOpen = activePanel === 'wally';
  const weatherOpen = activePanel === 'weather';
  const calendarOpen = activePanel === 'calendar';

  /* ----- Ocultação automática ----- */
  const autoHide = useTaskbarAutoHide();

  /* ----- Data e hora ----- */
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  /* === Referências === */
  /* ----- Estrutura e painéis ----- */
  const taskbarRef = useRef(null);
  const floatingLayerRef = useRef(null);
  const menuButtonRef = useRef(null);

  /* ----- Menus contextuais ----- */
  const contextMenuRef = useRef(null);
  const contextTriggerRef = useRef(null);

  /* ----- Histórico de foco ----- */
  const previousFocusHistoryRef = useRef(appState.focusHistory);

  /* === Controle dos painéis === */
  /* ----- WS Menu ----- */
  function setMenuOpen(value) {
    setActivePanel((current) =>
      resolvePanel(value, current, 'menu'),
    );
  }

  /* ----- Notificações ----- */
  function setNotificationOpen(value) {
    setActivePanel((current) =>
      resolvePanel(value, current, 'notifications'),
    );
  }

  /* ----- Controles rápidos ----- */
  function setQuickControlsOpen(value) {
    setActivePanel((current) =>
      resolvePanel(value, current, 'controls'),
    );
  }

  /* ----- Wally ----- */
  function setWallyOpen(value) {
    setActivePanel((current) =>
      resolvePanel(value, current, 'wally'),
    );
  }

  /* ----- Clima ----- */
  function setWeatherOpen(value) {
    setActivePanel((current) =>
      resolvePanel(value, current, 'weather'),
    );
  }

  /* ----- Calendário ----- */
  function setCalendarOpen(value) {
    setActivePanel((current) =>
      resolvePanel(value, current, 'calendar'),
    );
  }

  /* ----- Persistir ocultação automática ----- */
  function changeAutoHide(enabled) {
    const saved = setTaskbarAutoHide(enabled);

    if (!saved) {
      notify({
        title: t('Preferência não salva'),
        message: t(
          'Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.',
        ),
        type: 'warning',
        source: t('Sistema'),
      });
    }
  }

  /* === Gerenciamento do WS Menu === */
  const {
    favoriteIds,
    MAX_FAVORITES,
    menuView,
    setMenuView,
    menuSearch,
    setMenuSearch,
    shortcutContext,
    setShortcutContext,
    menuSearchRef,
    shortcutContextRef,
    shortcutTriggerRef,
    openShortcutContext,
    runShortcutContextAction,
    searchTerm,
    visibleMenuApps,
  } = useWSMenu({
    appState,
    onAppAction,
    closePanels,
    menuOpen,
  });

  /* === Aplicativos abertos === */
  /* ----- Agrupar instâncias por aplicativo ----- */
  const groups = [];

  for (const instance of appState.instances) {
    let group = groups.find(
      (item) => item.appId === instance.appId,
    );

    if (!group) {
      group = {
        appId: instance.appId,
        instances: [],
      };

      groups.push(group);
    }

    group.instances.push(instance);
  }

  /* ----- Instância preferencial ----- */
  function getTargetInstance(group) {
    return getPreferredInstance(appState, group.appId);
  }

  /* ----- Contexto do aplicativo ----- */
  const context = groups.find(
    (group) => group.appId === contextGroup,
  );

  const contextApp = context
    ? getAppDefinition(context.appId)
    : null;

  const contextTarget = context
    ? getTargetInstance(context)
    : null;

  /* === Prévias dos aplicativos === */
  const {
    previewGroup,
    setPreviewGroup,
    previewCloseTimerRef,
    previewRef,
    preview,
    clearWindowHighlight,
    highlightWindow,
    clearPreviewTimers,
    closePreview,
    openPreview,
    schedulePreviewOpen,
    schedulePreviewClose,
  } = useTaskbarPreviews({
    groups,
    appState,
    onPreviewOpen: () => {
      setActivePanel(null);
      setContextGroup(null);
      setTaskbarContextOpen(false);
      setShortcutContext(null);
      contextTriggerRef.current = null;
      shortcutTriggerRef.current = null;
    },
  });

  /* === Rolagem dos aplicativos === */
  const {
    appsScrollRef,
    appsScroll,
    setAppsScroll,
    scrollApps,
  } = useTaskbarScroll({ groups });

  /* === Fechamento dos painéis === */
  /* ----- Restaurar estado inicial ----- */
  function closePanels() {
    clearWindowHighlight();
    closePreview();

    setContextGroup(null);
    setTaskbarContextOpen(false);
    setShortcutContext(null);
    setActivePanel(null);

    setMenuView('home');
    setMenuSearch('');

    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;
  }

  /* === Ações dos aplicativos === */
  /* ----- Ativar instância ----- */
  function activateInstance(instance) {
    onAppAction(
      instance.minimized ? restoreApp : activateApp,
      instance.id,
    );

    closePanels();
  }

  /* ----- Alternar aplicativo agrupado ----- */
  function handleGroupClick(group) {
    const target = getTargetInstance(group);

    closePanels();

    if (!target) return;

    if (
      appState.activeInstanceId === target.id &&
      !target.minimized
    ) {
      onAppAction(minimizeApp, target.id);
      return;
    }

    onAppAction(
      target.minimized ? restoreApp : activateApp,
      target.id,
    );
  }

  /* === Menu contextual dos aplicativos === */
  /* ----- Abrir pelo ponteiro ----- */
  function handleContextMenu(event, group) {
    event.preventDefault();

    clearWindowHighlight();
    closePreview();

    contextTriggerRef.current = event.currentTarget;

    setActivePanel(null);
    setShortcutContext(null);
    shortcutTriggerRef.current = null;
    setTaskbarContextOpen(false);

    setContextGroup((current) =>
      current === group.appId ? null : group.appId,
    );
  }

  /* ----- Abrir pelo teclado ----- */
  function handleContextKeyDown(event, group) {
    if (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      openPreview(group.appId, event.currentTarget);
      return;
    }

    if (event.key === 'F10' && event.shiftKey) {
      event.preventDefault();

      clearWindowHighlight();
      closePreview();

      contextTriggerRef.current = event.currentTarget;

      setActivePanel(null);
      setShortcutContext(null);
      shortcutTriggerRef.current = null;
      setTaskbarContextOpen(false);
      setContextGroup(group.appId);
    }
  }

  /* ----- Navegação pelas opções ----- */
  function handleMenuNavigation(event) {
    if (
      !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
    ) {
      return;
    }

    const buttons = Array.from(
      contextMenuRef.current?.querySelectorAll(
        'button:not(:disabled)',
      ) ?? [],
    );

    if (buttons.length === 0) return;

    event.preventDefault();

    const currentIndex = buttons.indexOf(document.activeElement);
    let nextIndex = 0;

    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex =
        (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'End') {
      nextIndex = buttons.length - 1;
    }

    buttons[nextIndex].focus();
  }

  /* ----- Executar ação contextual ----- */
  function runContextAction(action) {
    if (!context) return;

    const target = getTargetInstance(context);

    switch (action) {
      case 'new':
        onAppAction(openApp, context.appId);
        break;

      case 'activate':
        if (target) {
          onAppAction(
            target.minimized ? restoreApp : activateApp,
            target.id,
          );
        }
        break;

      case 'minimize':
        if (target && !target.minimized) {
          onAppAction(minimizeApp, target.id);
        }
        break;

      case 'close':
        if (target) {
          onAppAction(closeApp, target.id);
        }
        break;

      case 'close-all':
        for (const instance of context.instances) {
          onAppAction(closeApp, instance.id);
        }
        break;

      default:
        break;
    }

    closePanels();
  }

  /* === Menu contextual da Taskbar === */
  /* ----- Abrir menu da barra ----- */
  function handleTaskbarContextMenu(event) {
    if (event.defaultPrevented) return;

    if (
      event.target.closest('button, a, input, [role="button"]')
    ) {
      return;
    }

    event.preventDefault();

    clearWindowHighlight();
    closePreview();

    setContextGroup(null);
    setShortcutContext(null);
    setActivePanel(null);
    setTaskbarContextOpen(true);
  }

  /* ----- Executar ação da barra ----- */
  function runTaskbarContextAction(action) {
    closePanels();

    switch (action) {
      case 'desktop':
        onShowDesktop();
        break;

      case 'auto-hide':
        changeAutoHide(!autoHide);
        break;

      case 'controls':
        setActivePanel('controls');
        break;

      default:
        break;
    }
  }

  /* === Alternância dos painéis === */
  /* ----- WS Menu ----- */
  function toggleWSMenu() {
    clearWindowHighlight();
    closePreview();

    setTaskbarContextOpen(false);
    setContextGroup(null);
    setShortcutContext(null);

    setQuickControlsOpen(false);
    setWallyOpen(false);
    setWeatherOpen(false);

    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;

    if (!menuOpen) {
      setMenuView('home');
      setMenuSearch('');
    }

    setMenuOpen((current) => !current);
    setNotificationOpen(false);
  }

  /* ----- Notificações ----- */
  function toggleNotifications() {
    clearWindowHighlight();
    closePreview();

    setTaskbarContextOpen(false);
    setContextGroup(null);
    setShortcutContext(null);

    setMenuOpen(false);
    setQuickControlsOpen(false);
    setWallyOpen(false);
    setWeatherOpen(false);
    setNotificationOpen((current) => !current);

    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;
  }

  /* ----- Controles rápidos ----- */
  function toggleQuickControls() {
    clearWindowHighlight();
    closePreview();

    setTaskbarContextOpen(false);
    setContextGroup(null);
    setShortcutContext(null);

    setMenuOpen(false);
    setNotificationOpen(false);

    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;

    setQuickControlsOpen((current) => !current);
  }

  /* ----- Wally ----- */
  function toggleWally() {
    clearWindowHighlight();
    closePreview();

    setTaskbarContextOpen(false);
    setContextGroup(null);
    setShortcutContext(null);

    setMenuOpen(false);
    setNotificationOpen(false);
    setQuickControlsOpen(false);

    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;

    setWallyOpen((current) => !current);
  }

  /* ----- Clima ----- */
  function toggleWeather() {
    clearWindowHighlight();
    closePreview();

    setTaskbarContextOpen(false);
    setContextGroup(null);
    setShortcutContext(null);

    setMenuOpen(false);
    setNotificationOpen(false);
    setQuickControlsOpen(false);
    setWallyOpen(false);

    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;

    setWeatherOpen((current) => !current);
  }

  /* ----- Calendário ----- */
  function toggleCalendar() {
    clearWindowHighlight();
    closePreview();

    setTaskbarContextOpen(false);
    setContextGroup(null);
    setShortcutContext(null);

    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;

    setCalendarOpen((current) => !current);
  }

  /* === Data e hora === */
  /* ----- Formatação do relógio ----- */
  const timeText = currentTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateText = currentTime.toLocaleDateString(locale);

  const shortDateText = currentTime.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });

  /* ----- Formatação do calendário ----- */
  const monthLabel = calendarMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  /* === Efeitos do sistema === */
  /* ----- Atualização do relógio ----- */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  /* ----- Fechamento por clique externo ----- */
  useEffect(() => {
    function handlePointerDown(event) {
      const insideTaskbar =
        taskbarRef.current?.contains(event.target);

      const insideFloating =
        floatingLayerRef.current?.contains(event.target);

      if (!insideTaskbar && !insideFloating) {
        clearWindowHighlight();
        clearPreviewTimers();

        setPreviewGroup(null);
        setContextGroup(null);
        setTaskbarContextOpen(false);
        setShortcutContext(null);
        setActivePanel(null);

        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [
    menuOpen,
    shortcutContext,
    onShowDesktop,
    clearWindowHighlight,
    clearPreviewTimers,
    setPreviewGroup,
    setShortcutContext,
    shortcutTriggerRef,
  ]);

  /* ----- Foco do menu contextual ----- */
  useEffect(() => {
    if (contextGroup) {
      contextMenuRef.current
        ?.querySelector('button:not(:disabled)')
        ?.focus();
    }
  }, [contextGroup]);

  /* ----- Sincronização do foco das janelas ----- */
  useLayoutEffect(() => {
    if (
      previousFocusHistoryRef.current === appState.focusHistory
    ) {
      return;
    }

    previousFocusHistoryRef.current = appState.focusHistory;

    setActivePanel(null);
    setContextGroup(null);
    setShortcutContext(null);
  }, [appState.focusHistory, setShortcutContext]);

  /* === Atalhos globais === */
  useGlobalShortcuts({
    clearWindowHighlight,
    clearPreviewTimers,
    setPreviewGroup,
    setContextGroup,
    setShortcutContext,
    contextTriggerRef,
    shortcutTriggerRef,
    setMenuView,
    setMenuSearch,
    setActivePanel,
    onShowDesktop,
    shortcutContext,
    menuOpen,
    menuButtonRef,
  });

  /* === Renderização da Taskbar === */
  return (
    <div
      ref={taskbarRef}
      className={[
        'taskbar-container',
        autoHide &&
          activePanel === null &&
          !preview &&
          !contextGroup &&
          !shortcutContext &&
          !taskbarContextOpen
          ? 'taskbar-container--auto-hide'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >

      {/* === Camada dos painéis flutuantes === */}
      {createPortal(
        <PanelLayer
          layerRef={floatingLayerRef}
          onDismiss={closePanels}
        >

          {/* ----- Prévia dos aplicativos ----- */}
          {preview &&
            !contextGroup &&
            !menuOpen &&
            !notificationOpen &&
            !quickControlsOpen &&
            !wallyOpen &&
            !weatherOpen &&
            !calendarOpen && (
              <TaskbarPreview
                previewRef={previewRef}
                closePreview={closePreview}
                preview={preview}
                previewCloseTimerRef={previewCloseTimerRef}
                schedulePreviewClose={schedulePreviewClose}
                clearWindowHighlight={clearWindowHighlight}
                onAppAction={onAppAction}
                highlightWindow={highlightWindow}
                activateInstance={activateInstance}
                appState={appState}
              />
            )}

          {/* ----- WS Menu ----- */}
          {menuOpen && (
            <WSMenu
              shortcutContext={shortcutContext}
              setShortcutContext={setShortcutContext}
              menuSearchRef={menuSearchRef}
              menuSearch={menuSearch}
              setMenuSearch={setMenuSearch}
              visibleMenuApps={visibleMenuApps}
              onAppAction={onAppAction}
              closePanels={closePanels}
              searchTerm={searchTerm}
              menuView={menuView}
              setMenuView={setMenuView}
              openShortcutContext={openShortcutContext}
              favoriteIds={favoriteIds}
              MAX_FAVORITES={MAX_FAVORITES}
              shortcutContextRef={shortcutContextRef}
              runShortcutContextAction={runShortcutContextAction}
            />
          )}

          {/* ----- Clima ----- */}
          {weatherOpen && (
            <WeatherPanel
              setWeatherOpen={setWeatherOpen}
              weather={weather}
              forecast={forecast}
              getWeatherDescription={getWeatherDescription}
              weatherError={weatherError}
              weatherLoading={weatherLoading}
              requestWeather={requestWeather}
              selectedCity={selectedCity}
            />
          )}

          {/* ----- Calendário ----- */}
          {calendarOpen && (
            <CalendarPanel
              monthLabel={monthLabel}
              setCalendarMonth={setCalendarMonth}
              currentTime={currentTime}
              setCalendarOpen={setCalendarOpen}
              calendarMonth={calendarMonth}
            />
          )}

          {/* ----- Wally ----- */}
          {wallyOpen && (
            <WallyPanel setWallyOpen={setWallyOpen} />
          )}

          {/* ----- Controles rápidos ----- */}
          {quickControlsOpen && (
            <QuickControls
              setQuickControlsOpen={setQuickControlsOpen}
              theme={theme}
              onThemeChange={onThemeChange}
              autoHideTaskbar={autoHide}
              onAutoHideTaskbarChange={changeAutoHide}
            />
          )}

          {/* ----- Notificações ----- */}
          {notificationOpen && (
            <NotificationCenter
              unreadCount={unreadCount}
              setNotificationOpen={setNotificationOpen}
              notifications={notifications}
              onNotificationAction={onNotificationAction}
              onNotificationOpen={onNotificationOpen}
            />
          )}

          {/* === Menu contextual da barra === */}
          {taskbarContextOpen && (
            <section
              className="taskbar-context taskbar-context--system"
              aria-label={t('Opções da barra de tarefas')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  closePanels();

                  taskbarRef.current
                    ?.querySelector('.taskbar__menu-button')
                    ?.focus({ preventScroll: true });
                }
              }}
            >
              <strong className="taskbar-context__title">
                {t('Barra de tarefas')}
              </strong>

              <div className="taskbar-context__actions">
                <button
                  type="button"
                  onClick={() =>
                    runTaskbarContextAction('desktop')
                  }
                >
                  {t('Mostrar área de trabalho')}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runTaskbarContextAction('auto-hide')
                  }
                  aria-pressed={autoHide}
                >
                  {autoHide ? '✓ ' : ''}
                  {t('Ocultar automaticamente')}
                </button>

                <div className="taskbar-context__divider" />

                <button
                  type="button"
                  onClick={() =>
                    runTaskbarContextAction('controls')
                  }
                >
                  {t('Abrir Painel de Controle')}
                </button>
              </div>
            </section>
          )}

          {/* ----- Menu contextual do aplicativo ----- */}
          {context && (
            <TaskbarContextMenu
              contextMenuRef={contextMenuRef}
              contextApp={contextApp}
              context={context}
              contextTriggerRef={contextTriggerRef}
              closePanels={closePanels}
              handleMenuNavigation={handleMenuNavigation}
              runContextAction={runContextAction}
              contextTarget={contextTarget}
            />
          )}
        </PanelLayer>,
        document.body,
      )}

      {/* === Barra inferior === */}
      <nav
        className="taskbar"
        aria-label={t('Barra de tarefas')}
        onContextMenu={handleTaskbarContextMenu}
      >

        {/* ----- WS Menu ----- */}
        <div className="taskbar__section taskbar__section--start">
          <Tooltip content="WS Menu" delay={450}>
            <button
              ref={menuButtonRef}
              type="button"
              className="taskbar__system-button taskbar__menu-button"
              aria-label="WS Menu"
              aria-expanded={menuOpen}
              onClick={toggleWSMenu}
            >
              <img
                src={wsMenuLogo}
                alt=""
                aria-hidden="true"
                className="taskbar__menu-logo"
              />
            </button>
          </Tooltip>
        </div>

        <span
          className="taskbar__divider"
          aria-hidden="true"
        />

        {/* ----- Aplicativos abertos ----- */}
        {groups.length > 0 && (
          <TaskbarApps
            appsScroll={appsScroll}
            scrollApps={scrollApps}
            appsScrollRef={appsScrollRef}
            setAppsScroll={setAppsScroll}
            groups={groups}
            appState={appState}
            previewGroup={previewGroup}
            contextGroup={contextGroup}
            handleGroupClick={handleGroupClick}
            previewCloseTimerRef={previewCloseTimerRef}
            schedulePreviewOpen={schedulePreviewOpen}
            schedulePreviewClose={schedulePreviewClose}
            handleContextMenu={handleContextMenu}
            handleContextKeyDown={handleContextKeyDown}
          />
        )}

        {groups.length > 0 && (
          <span
            className="taskbar__divider"
            aria-hidden="true"
          />
        )}

        {/* === Painéis do sistema === */}
        <div className="taskbar__section taskbar__section--system">

          {/* ----- Notificações ----- */}
          <Tooltip content={t('Notificações')} delay={450}>
            <button
              type="button"
              className="taskbar__system-button taskbar__system-button--notifications"
              aria-label={
                unreadCount > 0
                  ? `${t('Notificações')} (${unreadCount})`
                  : t('Notificações')
              }
              aria-expanded={notificationOpen}
              onClick={toggleNotifications}
            >
              <span className="taskbar-notifications__trigger">
                <Bell size={21} strokeWidth={2} />

                {unreadCount > 0 && (
                  <span
                    className="taskbar-notifications__dot"
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
          </Tooltip>

          {/* ----- Controle rápido ----- */}
          <Tooltip content={t('Controle Rápido')} delay={450}>
            <button
              type="button"
              className="taskbar__system-button taskbar__system-button--controls"
              aria-label={t('Controle Rápido')}
              aria-expanded={quickControlsOpen}
              onClick={toggleQuickControls}
            >
              <SlidersHorizontal
                size={21}
                strokeWidth={2}
              />
            </button>
          </Tooltip>

          {/* ----- Wally ----- */}
          <Tooltip content="Wally" delay={450}>
            <button
              type="button"
              className="taskbar__system-button taskbar__system-button--wally"
              aria-label="Wally"
              aria-expanded={wallyOpen}
              onClick={toggleWally}
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/wally/wally-rosto.webp`}
                alt=""
                aria-hidden="true"
                className="taskbar__wally-avatar"
              />
            </button>
          </Tooltip>
        </div>

        <span
          className="taskbar__divider"
          aria-hidden="true"
        />

        {/* === Clima e relógio === */}
        <div className="taskbar__weather-group">

          {/* ----- Condições meteorológicas ----- */}
          <Tooltip content={t('Clima')} delay={450}>
            <button
              type="button"
              className="taskbar__weather"
              aria-label={
                weather
                  ? `${t('Clima')}: ${Math.round(weather.temperature_2m)}°`
                  : t('Clima')
              }
              aria-expanded={weatherOpen}
              onClick={toggleWeather}
            >
              <WeatherIcon
                code={weather?.weather_code}
                size={21}
              />

              {weather && (
                <span className="taskbar__temperature">
                  {Math.round(weather.temperature_2m)}°
                </span>
              )}
            </button>
          </Tooltip>

          {/* ----- Relógio e calendário ----- */}
          <Tooltip content={dateText} delay={450}>
            <button
              type="button"
              className="taskbar__clock"
              aria-label={t(`Calendário, ${dateText}`)}
              aria-expanded={calendarOpen}
              onClick={toggleCalendar}
            >
              <span className="taskbar__datetime">
                <time dateTime={currentTime.toISOString()}>
                  {timeText}
                </time>

                <span className="taskbar__date">
                  {shortDateText}
                </span>
              </span>
            </button>
          </Tooltip>
        </div>
      </nav>
    </div>
  );
}

/* === Otimização da Taskbar === */
/* ----- Componente memorizado ----- */
const MemoizedTaskbar = memo(Taskbar);

/* ----- Preservação da referência de callback ----- */
export default function TaskbarContainer(props) {
  const showDesktopRef = useRef(props.onShowDesktop);

  useLayoutEffect(() => {
    showDesktopRef.current = props.onShowDesktop;
  }, [props.onShowDesktop]);

  const onShowDesktop = useCallback(
    () => showDesktopRef.current?.(),
    [],
  );

  return (
    <MemoizedTaskbar
      {...props}
      onShowDesktop={onShowDesktop}
    />
  );
}
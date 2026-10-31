import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import useGlobalShortcuts from '../../../features/shortcuts/useGlobalShortcuts';
import useTaskbarScroll from './useTaskbarScroll';
import useTaskbarPreviews from './useTaskbarPreviews';
import useWSMenu from '../../../features/launcher/useWSMenu';
import { useSystem } from '../../../core/useSystem';
import TaskbarContextMenu from './TaskbarContextMenu';
import NotificationCenter from '../../../features/notifications/NotificationCenter';
import QuickControls from '../../../features/quick-controls/QuickControls';
import WallyPanel from '../../../features/wally/WallyPanel';
import CalendarPanel from '../../../features/calendar/CalendarPanel';
import WeatherPanel, { WeatherIcon } from '../../../features/weather/WeatherPanel';
import WSMenu from '../../../features/launcher/WSMenu';
import TaskbarPreview from './TaskbarPreview';
import PanelLayer from '../../../features/panels/PanelLayer';
import TaskbarApps from './TaskbarApps';
import { resolvePanel } from '../../../core/panelManager';
import { Bell, SlidersHorizontal } from 'lucide-react';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getBrandingLogo } from '../../../core/branding';
import { useAppearance } from '../../../core/appearanceManager';
import Tooltip from '../../../shared/components/Tooltip';
import {
  activateApp,
  closeApp,
  minimizeApp,
  openApp,
  restoreApp,
  getPreferredInstance,
} from '../../../core/appManager';
import { getAppDefinition } from '../../../core/appRegistry';
import { useTaskbarAutoHide, setTaskbarAutoHide } from '../../../core/taskbarPreferences';
// Utilitários e preferências persistentes do WS Menu.
function Taskbar({ onShowDesktop, theme, onThemeChange, weatherData }) {
  const appearance = useAppearance();
  const wsMenuLogo = getBrandingLogo(
    theme,
    appearance.accent,
    import.meta.env.BASE_URL,
  );
  const locale = useLocale();
  const {
    appState,
    notify,
    run: onAppAction,
    notificationState,
    handleNotificationAction: onNotificationAction,
    handleNotificationOpen: onNotificationOpen,
  } = useSystem();
  const {
    weather,
    forecast,
    weatherLoading,
    weatherError,
    requestWeather,
    getWeatherDescription,
    selectedCity,
  } = weatherData;
  const notifications = notificationState?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const [contextGroup, setContextGroup] = useState(null);
  const [taskbarContextOpen, setTaskbarContextOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const autoHide = useTaskbarAutoHide();
  function changeAutoHide(enabled) {
    const saved = setTaskbarAutoHide(enabled);
    if (!saved) {
      notify({
        title: t('Preferência não salva'),
        message: t('Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.'),
        type: 'warning',
        source: t('Sistema'),
      });
    }
  }
  const menuOpen = activePanel === 'menu';
  const notificationOpen = activePanel === 'notifications';
  const quickControlsOpen = activePanel === 'controls';
  const wallyOpen = activePanel === 'wally';
  const weatherOpen = activePanel === 'weather';
  const calendarOpen = activePanel === 'calendar';
  function setMenuOpen(value) {
    setActivePanel((current) => resolvePanel(value, current, 'menu'));
  }
  function setNotificationOpen(value) {
    setActivePanel((current) => resolvePanel(value, current, 'notifications'));
  }
  function setQuickControlsOpen(value) {
    setActivePanel((current) => resolvePanel(value, current, 'controls'));
  }
  function setWallyOpen(value) {
    setActivePanel((current) => resolvePanel(value, current, 'wally'));
  }
  function setWeatherOpen(value) {
    setActivePanel((current) => resolvePanel(value, current, 'weather'));
  }
  function setCalendarOpen(value) {
    setActivePanel((current) => resolvePanel(value, current, 'calendar'));
  }
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const taskbarRef = useRef(null);
  const floatingLayerRef = useRef(null);
  const contextMenuRef = useRef(null);
  const contextTriggerRef = useRef(null);
  const menuButtonRef = useRef(null);
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
  // Instâncias agrupadas por aplicativo na Taskbar.
  const groups = [];
  for (const instance of appState.instances) {
    let group = groups.find((item) => item.appId === instance.appId);
    if (!group) {
      group = {
        appId: instance.appId,
        instances: [],
      };
      groups.push(group);
    }
    group.instances.push(instance);
  }
  // Detecta excesso de aplicativos e mantém a navegação atualizada.
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
  // Fechamento e alternância de painéis flutuantes.
  const { appsScrollRef, appsScroll, setAppsScroll, scrollApps } = useTaskbarScroll({
    groups,
  });
  const context = groups.find((group) => group.appId === contextGroup);
  const contextApp = context ? getAppDefinition(context.appId) : null;
  function getTargetInstance(group) {
    return getPreferredInstance(appState, group.appId);
  }
  const contextTarget = context ? getTargetInstance(context) : null;
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    function handlePointerDown(event) {
      const insideTaskbar = taskbarRef.current?.contains(event.target);
      const insideFloating = floatingLayerRef.current?.contains(event.target);
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
  useEffect(() => {
    if (contextGroup) {
      contextMenuRef.current?.querySelector('button:not(:disabled)')?.focus();
    }
  }, [contextGroup]);
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
  function activateInstance(instance) {
    onAppAction(instance.minimized ? restoreApp : activateApp, instance.id);
    closePanels();
  }
  function handleGroupClick(group) {
    const target = getTargetInstance(group);
    closePanels();
    if (!target) return;
    if (appState.activeInstanceId === target.id && !target.minimized) {
      onAppAction(minimizeApp, target.id);
      return;
    }
    onAppAction(target.minimized ? restoreApp : activateApp, target.id);
  }
  function handleContextMenu(event, group) {
    event.preventDefault();
    clearWindowHighlight();
    closePreview();
    contextTriggerRef.current = event.currentTarget;
    setActivePanel(null);
    setShortcutContext(null);
    shortcutTriggerRef.current = null;
    setTaskbarContextOpen(false);
    setContextGroup((current) => (current === group.appId ? null : group.appId));
  }
  function handleContextKeyDown(event, group) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
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
  function handleMenuNavigation(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const buttons = Array.from(
      contextMenuRef.current?.querySelectorAll('button:not(:disabled)') ?? [],
    );
    if (buttons.length === 0) return;
    event.preventDefault();
    const currentIndex = buttons.indexOf(document.activeElement);
    let nextIndex = 0;
    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'End') {
      nextIndex = buttons.length - 1;
    }
    buttons[nextIndex].focus();
  }
  function runContextAction(action) {
    if (!context) return;
    const target = getTargetInstance(context);
    switch (action) {
      case 'new':
        onAppAction(openApp, context.appId);
        break;
      case 'activate':
        if (target) {
          onAppAction(target.minimized ? restoreApp : activateApp, target.id);
        }
        break;
      case 'minimize':
        if (target && !target.minimized) {
          onAppAction(minimizeApp, target.id);
        }
        break;
      case 'close':
        if (target) onAppAction(closeApp, target.id);
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
  /* === MENU DE CONTEXTO DA TASKBAR === */
  /* ----- Abrir apenas fora dos controles interativos ----- */
  function handleTaskbarContextMenu(event) {
    if (event.defaultPrevented) return;
    if (event.target.closest('button, a, input, [role="button"]')) {
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
  /* ----- Executar ações da barra ----- */
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
  const timeText = currentTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateText = currentTime.toLocaleDateString(locale);
  const shortDateText = currentTime.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const monthLabel = calendarMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  
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
  /* === SINCRONIZAÇÃO DO FOCO === */
  /* ----- Fechar painéis quando o foco das janelas mudar ----- */
  const previousFocusHistoryRef = useRef(appState.focusHistory);

  useLayoutEffect(() => {
    if (previousFocusHistoryRef.current === appState.focusHistory) {
      return;
    }

    previousFocusHistoryRef.current = appState.focusHistory;

    setActivePanel(null);
    setContextGroup(null);
    setShortcutContext(null);
  }, [appState.focusHistory, setShortcutContext]);
  // Camada flutuante + barra inferior (sem containers extras).
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
  return (
    <div
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
      ref={taskbarRef}
    >
      {createPortal(
        <PanelLayer layerRef={floatingLayerRef} onDismiss={closePanels}>
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
          {calendarOpen && (
            <CalendarPanel
              monthLabel={monthLabel}
              setCalendarMonth={setCalendarMonth}
              currentTime={currentTime}
              setCalendarOpen={setCalendarOpen}
              calendarMonth={calendarMonth}
            />
          )}
          {wallyOpen && <WallyPanel setWallyOpen={setWallyOpen} />}
          {quickControlsOpen && (
            <QuickControls
              setQuickControlsOpen={setQuickControlsOpen}
              theme={theme}
              onThemeChange={onThemeChange}
              autoHideTaskbar={autoHide}
              onAutoHideTaskbarChange={changeAutoHide}
            />
          )}
          {notificationOpen && (
            <NotificationCenter
              unreadCount={unreadCount}
              setNotificationOpen={setNotificationOpen}
              notifications={notifications}
              onNotificationAction={onNotificationAction}
              onNotificationOpen={onNotificationOpen}
            />
          )}
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
                  onClick={() => runTaskbarContextAction('desktop')}
                >
                  {t('Mostrar área de trabalho')}
                </button>
                <button
                  type="button"
                  onClick={() => runTaskbarContextAction('auto-hide')}
                  aria-pressed={autoHide}
                >
                  {autoHide ? '✓ ' : ''}
                  {t('Ocultar automaticamente')}
                </button>
                <div className="taskbar-context__divider" />
                <button
                  type="button"
                  onClick={() => runTaskbarContextAction('controls')}
                >
                  {t('Abrir Painel de Controle')}
                </button>
              </div>
            </section>
          )}
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
      <nav
        className="taskbar"
        aria-label={t('Barra de tarefas')}
        onContextMenu={handleTaskbarContextMenu}
      >
        {/* === MENU PRINCIPAL === */}
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

        <span className="taskbar__divider" aria-hidden="true" />

        {/* === APLICATIVOS ABERTOS === */}
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
          <span className="taskbar__divider" aria-hidden="true" />
        )}

        {/* === PAINÉIS DO SISTEMA === */}
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

          {/* ----- Controle Rápido ----- */}
          <Tooltip content={t('Controle Rápido')} delay={450}>
            <button
              type="button"
              className="taskbar__system-button taskbar__system-button--controls"
              aria-label={t('Controle Rápido')}
              aria-expanded={quickControlsOpen}
              onClick={toggleQuickControls}
            >
              <SlidersHorizontal size={21} strokeWidth={2} />
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

        <span className="taskbar__divider" aria-hidden="true" />

        {/* === CLIMA E RELÓGIO === */}
        <div className="taskbar__weather-group">
          {/* ----- Clima ----- */}
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
              {/* ----- Ícone correspondente à condição meteorológica atual ----- */}
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

          {/* ----- Relógio e Calendário ----- */}
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
const MemoizedTaskbar = memo(Taskbar);
// Mantém a Taskbar isolada do resize sem reter um callback antigo do Desktop.
export default function TaskbarContainer(props) {
  const showDesktopRef = useRef(props.onShowDesktop);
  useLayoutEffect(() => {
    showDesktopRef.current = props.onShowDesktop;
  }, [props.onShowDesktop]);
  const onShowDesktop = useCallback(() => showDesktopRef.current?.(), []);
  return <MemoizedTaskbar {...props} onShowDesktop={onShowDesktop} />;
}

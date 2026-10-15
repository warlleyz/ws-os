import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import useGlobalShortcuts from '../../../features/shortcuts/useGlobalShortcuts';
import useTaskbarScroll from './useTaskbarScroll';
import useTaskbarPreviews from './useTaskbarPreviews';
import useWSMenu from '../../../features/launcher/useWSMenu';
import { useSystem } from '../../../core/useSystem';
import useWeather from '../../../features/weather/useWeather';
import TaskbarContextMenu from './TaskbarContextMenu';
import NotificationCenter from '../../../features/notifications/NotificationCenter';
import QuickControls from '../../../features/quick-controls/QuickControls';
import WallyPanel from '../../../features/wally/WallyPanel';
import CalendarPanel from '../../../features/calendar/CalendarPanel';
import WeatherPanel from '../../../features/weather/WeatherPanel';
import WSMenu from '../../../features/launcher/WSMenu';
import TaskbarPreview from './TaskbarPreview';
import PanelLayer from '../../../features/panels/PanelLayer';
import TaskbarApps from './TaskbarApps';
import { resolvePanel } from '../../../core/panelManager';
import { SystemIcon } from '../../../shared/components/SystemIcon';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  activateApp,
  closeApp,
  minimizeApp,
  openApp,
  restoreApp,
  getPreferredInstance,
} from '../../../core/appManager';
import { getAppDefinition } from '../../../core/appRegistry';

// Utilitários e preferências persistentes do WS Menu.

export default function Taskbar({ onShowDesktop, theme, onThemeChange }) {
  const locale = useLocale();
  const {
    appState,
    run: onAppAction,
    notificationState,
    handleNotificationAction: onNotificationAction,
    handleNotificationOpen: onNotificationOpen,
  } = useSystem();
  const { weather, weatherLoading, weatherError, requestWeather, getWeatherDescription } =
    useWeather();
  const notifications = notificationState?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const [contextGroup, setContextGroup] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
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
  function toggleWSMenu() {
    clearWindowHighlight();
    closePreview();
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
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const monthLabel = calendarMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const firstWeekday = calendarMonth.getDay();
  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  ).getDate();
  function toggleCalendar() {
    clearWindowHighlight();
    closePreview();
    setContextGroup(null);
    setShortcutContext(null);
    contextTriggerRef.current = null;
    shortcutTriggerRef.current = null;
    setCalendarOpen((current) => !current);
  }
  // Ativar/restaurar um app também fecha painéis sem depender de um clique externo.
  const [panelFocusHistory, setPanelFocusHistory] = useState(appState.focusHistory);
  if (panelFocusHistory !== appState.focusHistory) {
    setPanelFocusHistory(appState.focusHistory);
    setActivePanel(null);
    setContextGroup(null);
    setShortcutContext(null);
  }
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
    <div className="taskbar-container" ref={taskbarRef}>
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
              getWeatherDescription={getWeatherDescription}
              weatherError={t(weatherError)}
              weatherLoading={weatherLoading}
              requestWeather={requestWeather}
            />
          )}
          {calendarOpen && (
            <CalendarPanel
              monthLabel={monthLabel}
              setCalendarMonth={setCalendarMonth}
              currentTime={currentTime}
              setCalendarOpen={setCalendarOpen}
              firstWeekday={firstWeekday}
              daysInMonth={daysInMonth}
              calendarMonth={calendarMonth}
            />
          )}
          {wallyOpen && <WallyPanel setWallyOpen={setWallyOpen} />}
          {quickControlsOpen && (
            <QuickControls
              setQuickControlsOpen={setQuickControlsOpen}
              theme={theme}
              onThemeChange={onThemeChange}
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
      <nav className="taskbar" aria-label={t('Barra de tarefas')}>
        <div className="taskbar__section taskbar__section--start">
          <button
            ref={menuButtonRef}
            type="button"
            className="taskbar__system-button taskbar__menu-button"
            aria-label="WS Menu"
            aria-expanded={menuOpen}
            title="WS Menu"
            onClick={toggleWSMenu}
          >
            <SystemIcon name="menu" size={19} />
          </button>
        </div>
        <span className="taskbar__divider" aria-hidden="true" />
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
        {groups.length > 0 && <span className="taskbar__divider" aria-hidden="true" />}
        <div className="taskbar__section taskbar__section--system">
          <button
            type="button"
            className="taskbar__system-button"
            title={t('Notificações')}
            aria-label={t('Notificações')}
            aria-expanded={notificationOpen}
            onClick={toggleNotifications}
          >
            <span className="taskbar-notifications__trigger">
              <SystemIcon name="bell" />
              {unreadCount > 0 && (
                <span
                  className="taskbar-notifications__badge"
                  aria-label={t(
                    unreadCount === 1
                      ? '1 notificação não lida'
                      : `${unreadCount} notificações não lidas`,
                  )}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            className="taskbar__system-button"
            title={t('Controle Rápido')}
            aria-label={t('Controle Rápido')}
            aria-expanded={quickControlsOpen}
            onClick={toggleQuickControls}
          >
            <SystemIcon name="controls" />
          </button>
          <button
            type="button"
            className="taskbar__system-button"
            title="Wally"
            aria-label="Wally"
            aria-expanded={wallyOpen}
            onClick={toggleWally}
          >
            <SystemIcon name="wally" />
          </button>
        </div>
        <span className="taskbar__divider" aria-hidden="true" />
        <div className="taskbar__section taskbar__section--status">
          <button
            type="button"
            className="taskbar__weather"
            title={t('Clima')}
            aria-label={t('Clima')}
            aria-expanded={weatherOpen}
            onClick={toggleWeather}
          >
            <SystemIcon name="weather" />
            {weather && <span>{Math.round(weather.temperature_2m)}°</span>}
          </button>
          <button
            type="button"
            className="taskbar__clock"
            title={dateText}
            aria-label={t(`Calendário, ${dateText}`)}
            aria-expanded={calendarOpen}
            onClick={toggleCalendar}
          >
            <time dateTime={currentTime.toISOString()}>{timeText}</time>
          </button>
        </div>
      </nav>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useSystem } from '../../core/useSystem';
import { getPreferredInstance, openApp, restoreApp } from '../../core/appManager';
import { getAppDefinition } from '../../core/appRegistry';
import {
  useWallpaper,
  useWallpaperRevision,
  getWallpaperDefinition,
} from '../../core/wallpaperManager';

import useDesktopWidgets from '../../features/widgets/useDesktopWidgets';
import WidgetContextMenu from '../../features/widgets/WidgetContextMenu';
import WindowLayer from '../../features/windows/WindowLayer';
import NotificationToasts from '../../features/notifications/NotificationToasts';
import useWeather from '../../features/weather/useWeather';

import useDesktopLayout from './useDesktopLayout';
import useDesktopOrganization from './useDesktopOrganization';
import DesktopShortcuts from './DesktopShortcuts';
import DesktopContextMenu from './DesktopContextMenu';
import ShortcutContextMenu from './ShortcutContextMenu';
import Taskbar from './taskbar/Taskbar';

/* === Desktop principal === */
export default function Desktop({ theme, onThemeChange }) {

  /* === Serviços do sistema === */
  /* ----- Idioma e clima ----- */
  useLocale();
  const weatherData = useWeather();

  /* ----- Aplicativos e notificações ----- */
  const {
    appState,
    minimizeAllApps,
    visibleToasts,
    run,
    dismissToast,
    handleNotificationOpen,
  } = useSystem();

  /* ----- Papel de parede ----- */
  const wallpaper = useWallpaper();
  useWallpaperRevision();

  /* === Organização do Desktop === */
  /* ----- Dimensões da grade ----- */
  const {
    gridSize,
    shortcutsRef,
    workspaceRef,
    refreshLayout,
  } = useDesktopLayout();

  /* ----- Atalhos e seleção ----- */
  const organization = useDesktopOrganization({
    shortcutsRef,
    gridSize,
  });

  const {
    shortcuts,
    shortcutPositions,
    shortcutOrder,
    setSelectedIds,
    commitWidgetLayout,
  } = organization;

  /* ----- Widgets e posicionamento ----- */
  const {
    widgetState,
    toggleWidget,
    resetWidget,
    clockWidget,
    desktopLayout,
    changeWidgetSize,
    startWidgetDrag,
    moveWidgetDrag,
    finishWidgetDrag,
    handleWidgetKeyDown,
    cancelWidgetDrag,
  } = useDesktopWidgets({
    shortcuts,
    gridSize,
    shortcutPositions,
    commitWidgetLayout,
  });

  /* === Menus contextuais === */
  /* ----- Estados dos menus ----- */
  const [desktopContext, setDesktopContext] = useState(null);
  const [shortcutContext, setShortcutContext] = useState(null);
  const [widgetContext, setWidgetContext] = useState(null);

  /* ----- Referências dos menus ----- */
  const desktopContextRef = useRef(null);
  const shortcutContextRef = useRef(null);
  const widgetContextRef = useRef(null);

  /* === Ações gerais === */
  /* ----- Seleção dos atalhos ----- */
  function setSelectedShortcut(id) {
    if (id) {
      organization.select(id);
    } else {
      setSelectedIds([]);
    }
  }

  /* ----- Mostrar área de trabalho ----- */
  function showDesktop() {
    minimizeAllApps();
    setSelectedShortcut(null);
  }

  /* === Menu contextual dos atalhos === */
  /* ----- Abrir menu do atalho ----- */
  function openShortcutContext(event, app) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();

    const workspace = event.currentTarget.closest('.desktop__workspace');

    if (!workspace) return;

    const rect = workspace.getBoundingClientRect();

    setDesktopContext(null);
    setSelectedShortcut(app.id);

    setShortcutContext({
      appId: app.id,
      x: event.clientX - rect.left + workspace.scrollLeft,
      y: event.clientY - rect.top + workspace.scrollTop,
    });
  }

  /* ----- Executar ação do atalho ----- */
  function runShortcutContextAction(action) {
    if (!shortcutContext) return;

    const appId = shortcutContext.appId;
    const app = getAppDefinition(appId);
    const existing = getPreferredInstance(appState, appId);

    switch (action) {
      case 'open':
        if (existing) {
          run(restoreApp, existing.id);
        } else {
          run(openApp, appId);
        }
        break;

      case 'new-window':
        if (!app?.allowMultipleInstances) return;

        run(openApp, appId, {
          origin: 'desktop-shortcut-context-menu',
        });
        break;

      case 'focus':
        if (!existing) return;

        run(restoreApp, existing.id);
        break;

      case 'sort-default':
        organization.sort('default');
        break;

      case 'sort-name':
        organization.sort('name');
        break;

      default:
        return;
    }

    setShortcutContext(null);
  }

  /* === Menu contextual dos widgets === */
  /* ----- Abrir menu do widget ----- */
  function openWidgetContextMenu(event, widget) {
    event.preventDefault();
    event.stopPropagation();

    const workspace = event.currentTarget.closest('.desktop__workspace');

    if (!workspace) return;

    const rect = workspace.getBoundingClientRect();

    setDesktopContext(null);
    setShortcutContext(null);

    setWidgetContext({
      instanceId: widget.instanceId,
      x: event.clientX - rect.left + workspace.scrollLeft,
      y: event.clientY - rect.top + workspace.scrollTop,
    });
  }

  /* ----- Executar ação do widget ----- */
  function runWidgetContextAction(action, instanceId, value) {
    switch (action) {
      case 'personalize':
        run(openApp, 'settings', {
          origin: 'widget-context-menu',
          params: {
            section: 'widgets',
            widgetId: instanceId,
          },
        });
        break;

      case 'size':
        changeWidgetSize(instanceId, value);
        break;

      case 'hide':
        toggleWidget(instanceId);
        break;

      case 'reset':
        resetWidget(instanceId);
        break;

      default:
        return;
    }

    setWidgetContext(null);
  }

  /* === Menu contextual da área de trabalho === */
  /* ----- Abrir menu do Desktop ----- */
  function openDesktopContext(event) {
    if (
      event.target.closest(
        '.desktop__shortcut, .desktop__widget, .desktop__widget-toggle, .desktop__context',
      )
    ) {
      return;
    }

    event.preventDefault();

    const workspace = event.currentTarget;
    workspace.focus();

    const rect = workspace.getBoundingClientRect();

    setShortcutContext(null);

    setDesktopContext({
      x: event.clientX - rect.left + workspace.scrollLeft,
      y: event.clientY - rect.top + workspace.scrollTop,
    });
  }

  /* ----- Executar ação do Desktop ----- */
  function runDesktopContextAction(action) {
    switch (action) {
      case 'refresh':
        organization.clearDrag();
        cancelWidgetDrag();
        refreshLayout();
        break;

      case 'sort-name':
        organization.sort('name');
        break;

      case 'sort-default':
        organization.sort('default');
        break;

      case 'personalize':
      case 'personalize-widgets': {
        const section = action === 'personalize' ? 'appearance' : 'widgets';

        run(openApp, 'settings', {
          origin: 'desktop-context-menu',
          params: { section },
        });
        break;
      }

      default:
        return;
    }

    setDesktopContext(null);
  }

  /* === Gerenciamento dos menus === */
  /* ----- Fechamento por clique externo e Escape ----- */
  useEffect(() => {
    function handlePointerDown(event) {
      if (!desktopContextRef.current?.contains(event.target)) {
        setDesktopContext(null);
      }

      if (!shortcutContextRef.current?.contains(event.target)) {
        setShortcutContext(null);
      }

      if (!widgetContextRef.current?.contains(event.target)) {
        setWidgetContext(null);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setDesktopContext(null);
        setShortcutContext(null);
        setWidgetContext(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  /* === Renderização do Desktop === */
  return (
    <main className="desktop" id="ws-desktop" tabIndex={-1}>

      {/* === Papel de parede === */}
      <div
        className="desktop__wallpaper"
        aria-hidden="true"
        style={{
          background: getWallpaperDefinition(wallpaper).background,
        }}
      />

      {/* === Área de trabalho === */}
      <section
        ref={workspaceRef}
        tabIndex={0}
        className="desktop__workspace"
        aria-label={t('Área de trabalho')}
        onScroll={() => {
          organization.clearDrag();
          cancelWidgetDrag();
        }}
        onContextMenu={openDesktopContext}
        onKeyDown={(event) => {
          if (
            ((event.shiftKey && event.key === 'F10') ||
              event.key === 'ContextMenu') &&
            event.target === event.currentTarget
          ) {
            event.preventDefault();

            const rect = event.currentTarget.getBoundingClientRect();

            openDesktopContext({
              preventDefault() { },
              target: event.currentTarget,
              currentTarget: event.currentTarget,
              clientX: rect.left + 8,
              clientY: rect.top + 8,
            });
          }

          if (event.key === 'Escape') {
            organization.clearDrag();
            cancelWidgetDrag();
            setSelectedShortcut(null);
          }
        }}
      >

        {/* ----- Menu contextual do Desktop ----- */}
        {desktopContext && (
          <DesktopContextMenu
            desktopContextRef={desktopContextRef}
            desktopContext={desktopContext}
            runDesktopContextAction={runDesktopContextAction}
            shortcutOrder={shortcutOrder}
            clockWidget={clockWidget}
          />
        )}

        {/* ----- Menu contextual dos atalhos ----- */}
        {shortcutContext &&
          (() => {
            const app = getAppDefinition(shortcutContext.appId);

            if (!app) return null;

            return (
              <ShortcutContextMenu
                shortcutContextRef={shortcutContextRef}
                app={app}
                shortcutContext={shortcutContext}
                runShortcutContextAction={runShortcutContextAction}
                hasOpenInstance={appState.instances.some(
                  (instance) => instance.appId === app.id,
                )}
                shortcutOrder={shortcutOrder}
              />
            );
          })()}

        {/* ----- Menu contextual dos widgets ----- */}
        {widgetContext &&
          (() => {
            const widget = widgetState.widgets.find(
              (item) => item.instanceId === widgetContext.instanceId,
            );

            if (!widget) return null;

            return (
              <WidgetContextMenu
                key={widget.instanceId}
                menuRef={widgetContextRef}
                context={widgetContext}
                widget={widget}
                onAction={runWidgetContextAction}
              />
            );
          })()}

        {/* ----- Atalhos e widgets ----- */}
        <DesktopShortcuts
          shortcutsRef={shortcutsRef}
          desktopLayout={desktopLayout}
          widgetState={widgetState}
          startWidgetDrag={startWidgetDrag}
          moveWidgetDrag={moveWidgetDrag}
          finishWidgetDrag={finishWidgetDrag}
          changeWidgetSize={changeWidgetSize}
          shortcuts={shortcuts}
          appState={appState}
          organization={organization}
          handleWidgetKeyDown={handleWidgetKeyDown}
          openShortcutContext={openShortcutContext}
          weatherData={weatherData}
          run={run}
          onWidgetContextMenu={openWidgetContextMenu}
        />
      </section>

      {/* === Camada de janelas === */}
      <WindowLayer appState={appState} run={run} />

      {/* === Barra de tarefas === */}
      <Taskbar
        onShowDesktop={showDesktop}
        theme={theme}
        onThemeChange={onThemeChange}
        weatherData={weatherData}
      />

      {/* === Notificações temporárias === */}
      {visibleToasts.length > 0 && (
        <NotificationToasts
          visibleToasts={visibleToasts}
          dismissToast={dismissToast}
          handleNotificationOpen={handleNotificationOpen}
        />
      )}
    </main>
  );
}
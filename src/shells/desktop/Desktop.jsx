import { translate as t, useLocale } from '../../shared/i18n/i18n';
import useDesktopWidgets from '../../features/widgets/useDesktopWidgets';
import { useSystem } from '../../core/useSystem';
import useDesktopLayout from './useDesktopLayout';
import useDesktopOrganization from './useDesktopOrganization';
import ShortcutContextMenu from './ShortcutContextMenu';
import DesktopContextMenu from './DesktopContextMenu';
import WindowLayer from '../../features/windows/WindowLayer';
import DesktopShortcuts from './DesktopShortcuts';
import NotificationToasts from '../../features/notifications/NotificationToasts';
import { useEffect, useRef, useState } from 'react';
import Taskbar from './taskbar/Taskbar';
import {
  getPreferredInstance,
  openApp,
  restoreApp,
} from '../../core/appManager';
import { getAppDefinition } from '../../core/appRegistry';
import {
  useWallpaper,
  useWallpaperRevision,
  getWallpaperDefinition,
} from '../../core/wallpaperManager';
// Avisos temporários: o histórico é mantido pelo notificationManager.

export default function Desktop({ theme, onThemeChange }) {
  useLocale();
  const { appState, minimizeAllApps, visibleToasts, run, dismissToast, handleNotificationOpen } =
    useSystem();
  const {
    gridSize,
    shortcutsRef,
    workspaceRef,
    refreshLayout,
  } = useDesktopLayout();
  const organization = useDesktopOrganization({ shortcutsRef, gridSize });
  const { shortcuts, shortcutPositions, shortcutOrder, setSelectedIds } = organization;
  function setSelectedShortcut(id) {
    if (id) organization.select(id);
    else setSelectedIds([]);
  }
  const [desktopContext, setDesktopContext] = useState(null);
  const [shortcutContext, setShortcutContext] = useState(null);
  const desktopContextRef = useRef(null);
  const wallpaper = useWallpaper();
  useWallpaperRevision();
  const shortcutContextRef = useRef(null);
  const {
    widgetState,
    toggleClockWidget,
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
  });
  function showDesktop() {
    minimizeAllApps();
    setSelectedShortcut(null);
  }

  // Único ponto de entrada para ações de aplicativos e avisos do sistema.


  function openShortcutContext(event, app) {
    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.focus();

    const workspace = event.currentTarget.closest(
      '.desktop__workspace',
    );

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
        const section =
          action === 'personalize' ? 'appearance' : 'widgets';

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

  useEffect(() => {
    function handlePointerDown(event) {
      if (!desktopContextRef.current?.contains(event.target)) {
        setDesktopContext(null);
      }
      if (!shortcutContextRef.current?.contains(event.target)) {
        setShortcutContext(null);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setDesktopContext(null);
        setShortcutContext(null);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  return (
    <main className="desktop" id="ws-desktop" tabIndex={-1}>
      <div
        className="desktop__wallpaper"
        aria-hidden="true"
        style={{
          background: getWallpaperDefinition(wallpaper).background,
        }}
      />
      <section
        ref={workspaceRef}
        tabIndex={0}
        className="desktop__workspace"
        onScroll={() => {
          organization.clearDrag();
          cancelWidgetDrag();
        }}
        aria-label={t('Área de trabalho')}
        onContextMenu={openDesktopContext}
        onKeyDown={(event) => {
          if (
            ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') &&
            event.target === event.currentTarget
          ) {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            openDesktopContext({
              preventDefault() {},
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
        {desktopContext && (
          <DesktopContextMenu
            desktopContextRef={desktopContextRef}
            desktopContext={desktopContext}
            runDesktopContextAction={runDesktopContextAction}
            shortcutOrder={shortcutOrder}
            clockWidget={clockWidget}
          />
        )}

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
          run={run}
        />
      </section>
      <WindowLayer appState={appState} run={run} />
      <Taskbar onShowDesktop={showDesktop} theme={theme} onThemeChange={onThemeChange} />
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

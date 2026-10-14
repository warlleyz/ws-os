import useDesktopWidgets from '../../features/widgets/useDesktopWidgets';
import { useSystem } from '../../core/useSystem';
import useDesktopLayout from './useDesktopLayout';
import ShortcutContextMenu from './ShortcutContextMenu';
import DesktopContextMenu from './DesktopContextMenu';
import WindowLayer from '../../features/windows/WindowLayer';
import DesktopShortcuts from './DesktopShortcuts';
import NotificationToasts from '../../features/notifications/NotificationToasts';
import { useEffect, useMemo, useRef, useState } from 'react';
import Taskbar from './taskbar/Taskbar';
import { openApp } from '../../core/appManager';
import { getAppDefinition, getRegisteredApps } from '../../core/appRegistry';
// Distribuição dos atalhos no Desktop.
const desktopShortcutOrder = [
  'about-me',
  'projects',
  'dev-insights',
  'resume',
  'certificates',
  'contact',
  'terminal',
  'games',
  'notes',
  'files',
  'settings',
  'about-system',
];
// Avisos temporários: o histórico é mantido pelo notificationManager.

export default function Desktop({ theme, onThemeChange }) {
  const { appState, minimizeAllApps, visibleToasts, run, dismissToast, handleNotificationOpen } =
    useSystem();
  const { gridSize, shortcutsRef } = useDesktopLayout();
  const [selectedShortcut, setSelectedShortcut] = useState(null);
  const [desktopContext, setDesktopContext] = useState(null);
  const [shortcutContext, setShortcutContext] = useState(null);
  const [shortcutOrder, setShortcutOrder] = useState('default');
  const desktopContextRef = useRef(null);
  const shortcutContextRef = useRef(null);
  const shortcuts = useMemo(() => {
    const apps = getRegisteredApps().filter(
      (app) => app.desktopShortcut && desktopShortcutOrder.includes(app.id),
    );
    if (shortcutOrder === 'name') {
      return apps.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }
    return apps.sort(
      (a, b) => desktopShortcutOrder.indexOf(a.id) - desktopShortcutOrder.indexOf(b.id),
    );
  }, [shortcutOrder]);
  const {
    widgetState,
    toggleClockWidget,
    clockWidget,
    desktopLayout,
    positions,
    changeWidgetSize,
    startWidgetDrag,
    moveWidgetDrag,
    finishWidgetDrag,
  } = useDesktopWidgets({
    shortcuts,
    gridSize,
  });
  function showDesktop() {
    minimizeAllApps();
    setSelectedShortcut(null);
  }

  // Único ponto de entrada para ações de aplicativos e avisos do sistema.

  function openShortcutContext(event, app) {
    event.preventDefault();
    event.stopPropagation();
    const workspace = event.currentTarget.closest('.desktop__workspace');
    if (!workspace) return;
    const rect = workspace.getBoundingClientRect();
    const menuWidth = 210;
    const menuHeight = 150;
    setDesktopContext(null);
    setSelectedShortcut(app.id);
    setShortcutContext({
      appId: app.id,
      x: Math.max(8, Math.min(event.clientX - rect.left, rect.width - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY - rect.top, rect.height - menuHeight - 8)),
      showInfo: false,
    });
  }
  function runShortcutContextAction(action) {
    if (!shortcutContext) return;
    if (action === 'open') {
      run(openApp, shortcutContext.appId);
      setShortcutContext(null);
      return;
    }
    if (action === 'info') {
      setShortcutContext((current) =>
        current
          ? {
              ...current,
              showInfo: !current.showInfo,
            }
          : null,
      );
    }
  }
  function openDesktopContext(event) {
    if (event.target.closest('.desktop__shortcut, .desktop__widget, .desktop__widget-toggle')) {
      return;
    }
    event.preventDefault();
    const workspace = event.currentTarget;
    const rect = workspace.getBoundingClientRect();
    const menuWidth = 210;
    const menuHeight = 170;
    setShortcutContext(null);
    setDesktopContext({
      x: Math.max(8, Math.min(event.clientX - rect.left, rect.width - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY - rect.top, rect.height - menuHeight - 8)),
    });
  }
  function runDesktopContextAction(action) {
    if (action === 'sort-name') {
      setShortcutOrder('name');
    }
    if (action === 'sort-default') {
      setShortcutOrder('default');
    }
    if (action === 'toggle-clock') {
      toggleClockWidget();
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
    <main className="desktop">
      <div className="desktop__wallpaper" aria-hidden="true" />
      <section
        className="desktop__workspace"
        aria-label="Área de trabalho"
        onContextMenu={openDesktopContext}
        onPointerDown={(event) => {
          if (event.target instanceof Element && !event.target.closest('.desktop__shortcut')) {
            setSelectedShortcut(null);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
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
          selectedShortcut={selectedShortcut}
          positions={positions}
          openShortcutContext={openShortcutContext}
          setSelectedShortcut={setSelectedShortcut}
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

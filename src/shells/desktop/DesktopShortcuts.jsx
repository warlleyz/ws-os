import { getWidgetDefinition } from '../../core/widgetManager';
import WidgetHost from '../../features/widgets/WidgetHost';
import { openApp } from '../../core/appManager';

export default function DesktopShortcuts({
  shortcutsRef,
  desktopLayout,
  widgetState,
  startWidgetDrag,
  moveWidgetDrag,
  finishWidgetDrag,
  changeWidgetSize,
  shortcuts,
  appState,
  selectedShortcut,
  positions,
  openShortcutContext,
  setSelectedShortcut,
  run,
}) {
  return (
    <div ref={shortcutsRef} className="desktop__shortcuts" aria-label="Atalhos da área de trabalho">
      {desktopLayout.widget &&
        widgetState.widgets
          .filter((widget) => widget.visible)
          .map((widget) => {
            const definition = getWidgetDefinition(widget.widgetId);
            if (!definition || widget.widgetId !== 'clock') {
              return null;
            }
            return (
              <WidgetHost
                key={widget.instanceId}
                widget={widget}
                desktopLayout={desktopLayout}
                startWidgetDrag={startWidgetDrag}
                moveWidgetDrag={moveWidgetDrag}
                finishWidgetDrag={finishWidgetDrag}
                changeWidgetSize={changeWidgetSize}
              />
            );
          })}
      {shortcuts.map((app, index) => {
        const AppIcon = app.icon;
        const isOpen = appState.instances.some((instance) => instance.appId === app.id);
        return (
          <button
            key={app.id}
            className={[
              'desktop__shortcut',
              selectedShortcut === app.id ? 'desktop__shortcut--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              position: 'absolute',
              left: positions[index]?.left ?? -1000,
              top: positions[index]?.top ?? -1000,
              display: positions[index] ? undefined : 'none',
            }}
            type="button"
            aria-label={`Abrir ${app.name}`}
            aria-pressed={selectedShortcut === app.id}
            title={app.name}
            onContextMenu={(event) => openShortcutContext(event, app)}
            onClick={() => {
              setSelectedShortcut(app.id);
            }}
            onDoubleClick={() => {
              setSelectedShortcut(app.id);
              run(openApp, app.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                setSelectedShortcut(app.id);
                run(openApp, app.id);
              }
              if (event.key === ' ') {
                event.preventDefault();
                setSelectedShortcut(app.id);
              }
            }}
          >
            <span className="desktop__shortcut-icon" aria-hidden="true">
              {AppIcon ? <AppIcon size={27} strokeWidth={1.8} /> : app.name.charAt(0)}
              {isOpen && <span className="desktop__shortcut-indicator" />}
            </span>
            <span className="desktop__shortcut-label">{app.name}</span>
          </button>
        );
      })}
    </div>
  );
}

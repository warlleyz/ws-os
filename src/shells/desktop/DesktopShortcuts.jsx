import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { AppIcon } from '../../shared/components/AppIcon';
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
  handleWidgetKeyDown,
  organization,
  appState,
  openShortcutContext,
  run,
}) {
  useLocale();
  const {
    shortcuts,
    selectedIds,
    startShortcutDrag,
    startAreaSelection,
    movePointer,
    finishPointer,
    handleClick,
    handleKeyDown,
    selectionBoxRef,
    suppressClickRef,
  } = organization;
  return (
    <>
      {desktopLayout.widgetBlocked && (
        <p className="desktop__layout-notice" role="status">
          {t(
            'O relógio está temporariamente fora da grade por falta de espaço. Sua preferência foi mantida; ele voltará quando couber.',
          )}
        </p>
      )}
      {desktopLayout.overflow && (
        <p className="desktop__layout-notice" role="status">
          {t('Role a área de trabalho para acessar todos os atalhos.')}
        </p>
      )}
      <p id="desktop-shortcut-help" className="desktop__visually-hidden">
        {t(
          'Ctrl ou Shift para selecionar vários atalhos. Ctrl+A seleciona todos. Alt e setas movem a seleção na grade. Escape cancela o arraste e limpa a seleção.',
        )}
      </p>
      <div
        ref={shortcutsRef}
        className="desktop__shortcuts"
        aria-label={t('Atalhos da área de trabalho')}
        style={{ height: desktopLayout.height || undefined }}
        onPointerDown={(event) => startAreaSelection(event, desktopLayout)}
        onPointerMove={movePointer}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onLostPointerCapture={finishPointer}
      >
        {desktopLayout.widget &&
          widgetState.widgets
            .filter((widget) => widget.visible)
            .map((widget) => {
              if (!getWidgetDefinition(widget.widgetId) || widget.widgetId !== 'clock') return null;
              return (
                <WidgetHost
                  key={widget.instanceId}
                  widget={widget}
                  desktopLayout={desktopLayout}
                  startWidgetDrag={startWidgetDrag}
                  moveWidgetDrag={moveWidgetDrag}
                  finishWidgetDrag={finishWidgetDrag}
                  changeWidgetSize={changeWidgetSize}
                  handleWidgetKeyDown={handleWidgetKeyDown}
                />
              );
            })}
        {shortcuts.map((app, index) => {
          const position = desktopLayout.shortcuts[index];
          if (!position) return null;
          const isOpen = appState.instances.some((instance) => instance.appId === app.id);
          const selected = selectedIds.includes(app.id);
          return (
            <button
              key={app.id}
              data-app-id={app.id}
              className={['desktop__shortcut', selected ? 'desktop__shortcut--selected' : '']
                .filter(Boolean)
                .join(' ')}
              style={{ position: 'absolute', left: position.left, top: position.top }}
              type="button"
              aria-label={t(`Abrir ${app.name}`)}
              aria-pressed={selected}
              aria-describedby="desktop-shortcut-help"
              title={t(app.name)}
              onContextMenu={(event) => openShortcutContext(event, app)}
              onClick={(event) => handleClick(event, app.id)}
              onDoubleClick={() => {
                if (!suppressClickRef.current) run(openApp, app.id);
              }}
              onKeyDown={(event) => {
                if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
                  event.preventDefault();
                  event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  openShortcutContext(
                    {
                      preventDefault() {},
                      stopPropagation() {},
                      currentTarget: event.currentTarget,
                      clientX: rect.left + rect.width / 2,
                      clientY: rect.top + rect.height / 2,
                    },
                    app,
                  );
                  return;
                }
                handleKeyDown(event, app, index, desktopLayout, (id) => run(openApp, id));
              }}
              onPointerDown={(event) => startShortcutDrag(event, app.id, index, desktopLayout)}
              onDragStart={(event) => event.preventDefault()}
            >
              <span className="desktop__shortcut-icon" aria-hidden="true">
                <AppIcon app={app} size={27} />
                {isOpen && <span className="desktop__shortcut-indicator" />}
              </span>
              <span className="desktop__shortcut-label">{t(app.name)}</span>
            </button>
          );
        })}
        <div ref={selectionBoxRef} className="desktop__selection-box" aria-hidden="true" hidden />
      </div>
    </>
  );
}

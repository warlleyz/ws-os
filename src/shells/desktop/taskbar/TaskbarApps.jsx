import { getAppDefinition } from '../../../core/appRegistry';
import { AppIcon } from '../../../shared/components/AppIcon';

export default function TaskbarApps({
  appsScroll,
  scrollApps,
  appsScrollRef,
  setAppsScroll,
  groups,
  appState,
  previewGroup,
  contextGroup,
  handleGroupClick,
  previewCloseTimerRef,
  schedulePreviewOpen,
  schedulePreviewClose,
  handleContextMenu,
  handleContextKeyDown,
}) {
  return (
    <div className="taskbar__apps-navigation">
      {appsScroll.overflow && (
        <button
          type="button"
          className="taskbar__scroll-button"
          aria-label="Ver aplicativos anteriores"
          title="Aplicativos anteriores"
          disabled={!appsScroll.left}
          onClick={() => scrollApps(-1)}
        >
          ‹
        </button>
      )}
      <div
        ref={appsScrollRef}
        className="taskbar__apps"
        aria-label="Aplicativos abertos"
        onScroll={() => {
          const element = appsScrollRef.current;
          if (!element) return;
          const maxScroll = element.scrollWidth - element.clientWidth;
          setAppsScroll((current) => ({
            ...current,
            left: element.scrollLeft > 1,
            right: element.scrollLeft < maxScroll - 1,
          }));
        }}
      >
        {groups.map((group) => {
          const app = getAppDefinition(group.appId);
          const active = group.instances.some(
            (instance) => instance.id === appState.activeInstanceId,
          );
          const allMinimized = group.instances.every((instance) => instance.minimized);
          return (
            <button
              key={group.appId}
              type="button"
              className={[
                'taskbar__app',
                active ? 'taskbar__app--active' : '',
                allMinimized ? 'taskbar__app--minimized' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={app?.name ?? group.appId}
              aria-pressed={active}
              aria-expanded={previewGroup === group.appId || contextGroup === group.appId}
              title={app?.name ?? group.appId}
              onClick={() => handleGroupClick(group)}
              onPointerEnter={() => {
                window.clearTimeout(previewCloseTimerRef.current);
                if (previewGroup !== group.appId) {
                  schedulePreviewOpen(group.appId);
                }
              }}
              onPointerLeave={schedulePreviewClose}
              onContextMenu={(event) => handleContextMenu(event, group)}
              onKeyDown={(event) => handleContextKeyDown(event, group)}
            >
              <span className="taskbar__app-icon">
                <AppIcon app={app} size={20} />
              </span>
              <span className="taskbar__app-indicator" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {appsScroll.overflow && (
        <button
          type="button"
          className="taskbar__scroll-button"
          aria-label="Ver próximos aplicativos"
          title="Próximos aplicativos"
          disabled={!appsScroll.right}
          onClick={() => scrollApps(1)}
        >
          ›
        </button>
      )}
    </div>
  );
}

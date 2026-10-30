import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { getAppDefinition } from '../../../core/appRegistry';
import { AppIcon } from '../../../shared/components/AppIcon';
import Tooltip from '../../../shared/components/Tooltip';

/* === APLICATIVOS DA BARRA DE TAREFAS === */
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
  useLocale();

  /* === RENDERIZAÇÃO === */
  return (
    <div className="taskbar__apps-navigation">
      {/* ----- Rolagem para a esquerda ----- */}
      {appsScroll.overflow && (
        <Tooltip content={t('Ver aplicativos anteriores')} delay={450}>
          <button
            type="button"
            className="taskbar__scroll-button"
            aria-label={t('Ver aplicativos anteriores')}
            disabled={!appsScroll.left}
            onClick={() => scrollApps(-1)}
          >
            ‹
          </button>
        </Tooltip>
      )}

      {/* === LISTA DE APLICATIVOS === */}
      <div
        ref={appsScrollRef}
        className="taskbar__apps"
        aria-label={t('Aplicativos abertos')}
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
          /* ----- Identificação e estado do aplicativo ----- */
          const app = getAppDefinition(group.appId);

          const active = group.instances.some(
            (instance) => instance.id === appState.activeInstanceId,
          );

          const allMinimized = group.instances.every(
            (instance) => instance.minimized,
          );

          const previewOpen =
            previewGroup === group.appId ||
            contextGroup === group.appId;

          /* ----- Botão do aplicativo ----- */
          return (
            <Tooltip
              key={group.appId}
              content={t(app?.name ?? group.appId)}
              delay={500}
              disabled={previewOpen}
            >
              <button
                type="button"
                className={[
                  'taskbar__app',
                  active ? 'taskbar__app--active' : '',
                  allMinimized ? 'taskbar__app--minimized' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={t(app?.name ?? group.appId)}
                aria-pressed={active}
                aria-expanded={previewOpen}
                aria-keyshortcuts="ArrowUp ArrowDown Shift+F10"
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

                <span
                  className="taskbar__app-indicator"
                  aria-hidden="true"
                />
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* ----- Rolagem para a direita ----- */}
      {appsScroll.overflow && (
        <Tooltip content={t('Ver próximos aplicativos')} delay={450}>
          <button
            type="button"
            className="taskbar__scroll-button"
            aria-label={t('Ver próximos aplicativos')}
            disabled={!appsScroll.right}
            onClick={() => scrollApps(1)}
          >
            ›
          </button>
        </Tooltip>
      )}
    </div>
  );
}
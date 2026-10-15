import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { getAppDefinition } from '../../../core/appRegistry';
import { closeApp } from '../../../core/appManager';
import { AppIcon } from '../../../shared/components/AppIcon';

export default function TaskbarPreview({
  previewRef,
  closePreview,
  preview,
  previewCloseTimerRef,
  schedulePreviewClose,
  clearWindowHighlight,
  onAppAction,
  highlightWindow,
  activateInstance,
  appState,
}) {
  useLocale();
  return (
    <section
      ref={previewRef}
      className="taskbar-preview"
      aria-label={t(
        `Pré-visualizações de ${getAppDefinition(preview.appId)?.name ?? preview.appId}`,
      )}
      onPointerEnter={() => {
        window.clearTimeout(previewCloseTimerRef.current);
      }}
      onPointerLeave={schedulePreviewClose}
      onBlur={schedulePreviewClose}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        closePreview(true);
      }}
    >
      <div className="taskbar-preview__list">
        {preview.instances.map((instance, index) => {
          const app = getAppDefinition(instance.appId);
          const title = `${app?.name ?? instance.appId}${preview.instances.length > 1 ? t(` — Janela ${index + 1}`) : ''}`;
          return (
            <div key={instance.id} className="taskbar-preview__item">
              <div className="taskbar-preview__header">
                <strong title={t(title)}>{t(title)}</strong>
                <button
                  type="button"
                  className="taskbar-preview__close"
                  aria-label={t(`Fechar ${title}`)}
                  title={t('Fechar janela')}
                  onClick={() => {
                    clearWindowHighlight();
                    onAppAction(closeApp, instance.id);
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                className="taskbar-preview__open"
                aria-label={`Ativar ${title}`}
                onPointerEnter={() => highlightWindow(instance)}
                onPointerLeave={clearWindowHighlight}
                onFocus={() => highlightWindow(instance)}
                onBlur={clearWindowHighlight}
                onClick={() => activateInstance(instance)}
              >
                <span className="taskbar-preview__placeholder" aria-hidden="true">
                  <span className="taskbar-preview__placeholder-icon">
                    <AppIcon app={app} size={27} />
                  </span>
                </span>
                <small>
                  {instance.minimized
                    ? t('Minimizada')
                    : appState.activeInstanceId === instance.id
                      ? t('Ativa')
                      : t('Aberta')}
                </small>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

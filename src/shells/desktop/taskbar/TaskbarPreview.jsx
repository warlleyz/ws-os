import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { getAppDefinition } from '../../../core/appRegistry';
import { closeApp } from '../../../core/appManager';
import { AppIcon } from '../../../shared/components/AppIcon';
import TaskbarThumbnail from './TaskbarThumbnail';

/* === Pré-visualização dos aplicativos === */
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

  /* ----- Idioma do sistema ----- */
  useLocale();

  /* === Renderização das prévias === */
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

      {/* === Lista de janelas abertas === */}
      <div className="taskbar-preview__list">
        {preview.instances.map((instance, index) => {

          /* ----- Identificação da janela ----- */
          const app = getAppDefinition(instance.appId);

          const title =
            `${app?.name ?? instance.appId}${preview.instances.length > 1
              ? t(` — Janela ${index + 1}`)
              : ''}`;

          /* === Prévia da instância === */
          return (
            <div
              key={instance.id}
              className="taskbar-preview__item"
            >

              {/* ----- Cabeçalho da prévia ----- */}
              <div className="taskbar-preview__header">
                <strong title={t(title)}>
                  {t(title)}
                </strong>

                {/* ----- Fechar janela ----- */}
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

              {/* ----- Ativar janela ----- */}
              <button
                type="button"
                className="taskbar-preview__open"
                aria-label={t(`Ativar ${title}`)}
                onPointerEnter={() => highlightWindow(instance)}
                onPointerLeave={clearWindowHighlight}
                onFocus={() => highlightWindow(instance)}
                onBlur={clearWindowHighlight}
                onClick={() => activateInstance(instance)}
              >

                {/* ----- Miniatura da janela ----- */}
                <TaskbarThumbnail instance={instance}>
                  <span className="taskbar-preview__placeholder-icon">
                    <AppIcon app={app} size={27} />
                  </span>
                </TaskbarThumbnail>

                {/* ----- Estado da janela ----- */}
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
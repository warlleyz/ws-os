import { translate as t, useLocale } from '../../shared/i18n/i18n';
import useWindowInteraction from './useWindowInteraction';
import AppHost from './AppHost';
const RESIZE_DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
export default function Window({
  instance,
  app,
  active,
  zIndex,
  offset,
  onActivate,
  onMinimize,
  onClose,
}) {
  useLocale();
  const {
    windowRef,
    mode,
    appName,
    startInteraction,
    moveInteraction,
    endInteraction,
    toggleMaximize,
    handleResizeKeyDown,
    handleMoveKeyDown,
  } = useWindowInteraction({
    instance,
    app,
  });
  return (
    <section
      ref={windowRef}
      data-app-id={instance.appId}
      data-window-min-width={app.window?.minWidth}
      data-window-min-height={app.window?.minHeight}
      data-instance-id={instance.id}
      className={[
        'desktop-window',
        active ? 'desktop-window--active' : '',
        mode !== 'normal' ? `desktop-window--${mode}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={t(`Janela de ${appName}`)}
      aria-hidden={instance.minimized || undefined}
      inert={instance.minimized}
      style={{
        zIndex,
        '--window-offset': offset,
        visibility: instance.minimized ? 'hidden' : 'visible',
        pointerEvents: instance.minimized ? 'none' : 'auto',
      }}
      onPointerDown={(event) => {
        if (event.target.closest('.desktop-window__controls')) {
          return;
        }
        onActivate();
      }}
    >
      <header className="desktop-window__header">
        <span
          className="desktop-window__focus"
          data-active={active}
          title={active ? t('Janela ativa') : t('Janela inativa')}
        />

        <strong className="desktop-window__title">{t(appName)}</strong>

        <div
          tabIndex={0}
          role="button"
          aria-label={t('Arrastar para mover ou encaixar')}
          onKeyDown={handleMoveKeyDown}
          className="desktop-window__drag-area"
          onPointerDown={(event) => startInteraction(event, 'drag')}
          onPointerMove={moveInteraction}
          onPointerUp={endInteraction}
          onPointerCancel={endInteraction}
          onLostPointerCapture={endInteraction}
          onDoubleClick={toggleMaximize}
          title={t('Arrastar para mover ou encaixar')}
        />

        <div className="desktop-window__controls">
          <button
            className="desktop-window__control desktop-window__control--minimize"
            type="button"
            aria-label={t('Minimizar')}
            title={t('Minimizar')}
            onClick={onMinimize}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 6h7" />
            </svg>
          </button>

          <button
            className="desktop-window__control desktop-window__control--maximize"
            type="button"
            aria-label={mode === 'normal' ? t('Maximizar') : t('Restaurar tamanho')}
            title={mode === 'normal' ? t('Maximizar') : t('Restaurar')}
            onClick={toggleMaximize}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              {mode === 'normal' ? (
                <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
              ) : (
                <>
                  <rect x="2" y="4" width="6" height="6" rx="1" />
                  <path d="M4 4V2h6v6H8" />
                </>
              )}
            </svg>
          </button>

          <button
            className="desktop-window__control desktop-window__control--close"
            type="button"
            aria-label={t('Fechar')}
            title={t('Fechar')}
            onClick={onClose}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 3l6 6M9 3L3 9" />
            </svg>
          </button>
        </div>
      </header>

      <AppHost key={instance.id} appName={t(appName)} instance={instance} />

      {mode === 'normal' &&
        RESIZE_DIRECTIONS.map((direction) => (
          <div
            key={direction}
            className={`desktop-window__resize desktop-window__resize--${direction}`}
            role="separator"
            tabIndex={0}
            aria-label={t(`Redimensionar janela: ${direction}`)}
            aria-orientation={direction === 'n' || direction === 's' ? 'horizontal' : 'vertical'}
            onKeyDown={(event) => handleResizeKeyDown(event, direction)}
            onPointerDown={(event) => startInteraction(event, 'resize', direction)}
            onPointerMove={moveInteraction}
            onPointerUp={endInteraction}
            onPointerCancel={endInteraction}
            onLostPointerCapture={endInteraction}
          />
        ))}
    </section>
  );
}

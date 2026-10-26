import { useLayoutEffect, useRef } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import useWindowInteraction from './useWindowInteraction';
import AppHost from './AppHost';
import useWindowMotion from './useWindowMotion';
import Tooltip from '../../shared/components/Tooltip';
/* === CONFIGURAÇÃO DAS JANELAS === */
const RESIZE_DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
/* === MOLDURA E CONTROLES DA INSTÂNCIA === */
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
  /* ----- FOCAR A MOLDURA SOMENTE AO ABRIR OU RESTAURAR, SEM ROUBAR FOCO DE CAMPOS ----- */
  const focusStateRef = useRef(null);
  useLayoutEffect(() => {
    const previous = focusStateRef.current;
    focusStateRef.current = { minimized: instance.minimized };
    if (active && !instance.minimized && !instance.closing && (!previous || previous.minimized)) {
      windowRef.current
        ?.querySelector('.desktop-window__drag-area')
        ?.focus({ preventScroll: true });
    }
  }, [active, instance.minimized, instance.closing, windowRef]);

  const motion = useWindowMotion(instance, mode);
  const unavailable = instance.minimized || instance.closing;
  return (
    <section
      ref={windowRef}
      data-app-id={instance.appId}
      data-window-min-width={app.window?.minWidth}
      data-window-min-height={app.window?.minHeight}
      data-instance-id={instance.id}
      data-window-motion={motion.phase}
      className={[
        'desktop-window',
        active ? 'desktop-window--active' : '',
        mode !== 'normal' ? `desktop-window--${mode}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={t(`Janela de ${appName}`)}
      aria-hidden={unavailable || undefined}
      inert={unavailable}
      style={{
        zIndex,
        '--window-offset': offset,
        visibility: motion.visible ? 'visible' : 'hidden',
        '--window-motion-duration': `${motion.duration}ms`,
        pointerEvents: unavailable ? 'none' : 'auto',
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
          {/* ----- MINIMIZAR JANELA ----- */}
          <Tooltip content={t('Minimizar')}>
            <button
              className="desktop-window__control desktop-window__control--minimize"
              type="button"
              aria-label={t('Minimizar')}
              onClick={onMinimize}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 6h7" />
              </svg>
            </button>
          </Tooltip>

          {/* ----- MAXIMIZAR OU RESTAURAR JANELA ----- */}
          <Tooltip content={mode === 'normal' ? t('Maximizar') : t('Restaurar tamanho')}>
            <button
              className="desktop-window__control desktop-window__control--maximize"
              type="button"
              aria-label={mode === 'normal' ? t('Maximizar') : t('Restaurar tamanho')}
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
          </Tooltip>

          {/* ----- FECHAR JANELA ----- */}
          <Tooltip content={t('Fechar')}>
            <button
              className="desktop-window__control desktop-window__control--close"
              type="button"
              aria-label={t('Fechar')}
              onClick={onClose}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 3l6 6M9 3L3 9" />
              </svg>
            </button>
          </Tooltip>
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

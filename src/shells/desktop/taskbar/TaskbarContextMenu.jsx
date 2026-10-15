import { translate as t, useLocale } from '../../../shared/i18n/i18n';
export default function TaskbarContextMenu({
  contextMenuRef,
  contextApp,
  context,
  contextTriggerRef,
  closePanels,
  handleMenuNavigation,
  runContextAction,
  contextTarget,
}) {
  useLocale();
  return (
    <section
      ref={contextMenuRef}
      className="taskbar-context"
      aria-label={t(`Opções de ${t(contextApp?.name ?? context.appId)}`)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          contextTriggerRef.current?.focus();
          closePanels();
          return;
        }
        handleMenuNavigation(event);
      }}
    >
      <strong className="taskbar-context__title">{contextApp?.name ?? context.appId}</strong>
      <div className="taskbar-context__actions">
        {contextApp?.allowMultipleInstances && (
          <button type="button" onClick={() => runContextAction('new')}>
            {t('Abrir nova janela')}
          </button>
        )}
        <button type="button" onClick={() => runContextAction('activate')}>
          {contextTarget?.minimized ? t('Restaurar janela') : t('Ativar janela')}
        </button>
        <button
          type="button"
          disabled={!contextTarget || contextTarget.minimized}
          onClick={() => runContextAction('minimize')}
        >
          {t('Minimizar janela')}
        </button>
        <div className="taskbar-context__divider" />
        <button type="button" onClick={() => runContextAction('close')}>
          {t('Fechar janela')}
        </button>
        {context.instances.length > 1 && (
          <button
            type="button"
            className="taskbar-context__danger"
            onClick={() => runContextAction('close-all')}
          >
            {t('Fechar todas as janelas')}
          </button>
        )}
      </div>
    </section>
  );
}

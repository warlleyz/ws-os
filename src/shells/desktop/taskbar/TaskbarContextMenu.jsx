import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === Menu contextual dos aplicativos da Taskbar === */
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

  /* ----- Idioma do sistema ----- */
  useLocale();

  /* === Renderização do menu contextual === */
  return (
    <section
      ref={contextMenuRef}
      className="taskbar-context"
      aria-label={t(
        `Opções de ${t(contextApp?.name ?? context.appId)}`,
      )}
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

      {/* ----- Identificação do aplicativo ----- */}
      <strong className="taskbar-context__title">
        {contextApp?.name ?? context.appId}
      </strong>

      {/* === Ações disponíveis === */}
      <div className="taskbar-context__actions">

        {/* ----- Abrir nova instância ----- */}
        {contextApp?.allowMultipleInstances && (
          <button
            type="button"
            onClick={() => runContextAction('new')}
          >
            {t('Abrir nova janela')}
          </button>
        )}

        {/* ----- Ativar ou restaurar janela ----- */}
        <button
          type="button"
          onClick={() => runContextAction('activate')}
        >
          {contextTarget?.minimized
            ? t('Restaurar janela')
            : t('Ativar janela')}
        </button>

        {/* ----- Minimizar janela ----- */}
        <button
          type="button"
          disabled={!contextTarget || contextTarget.minimized}
          onClick={() => runContextAction('minimize')}
        >
          {t('Minimizar janela')}
        </button>

        {/* ----- Separador ----- */}
        <div className="taskbar-context__divider" />

        {/* ----- Fechar janela ----- */}
        <button
          type="button"
          onClick={() => runContextAction('close')}
        >
          {t('Fechar janela')}
        </button>

        {/* ----- Fechar todas as instâncias ----- */}
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
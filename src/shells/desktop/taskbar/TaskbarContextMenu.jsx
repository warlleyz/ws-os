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
  return (
    <section
      ref={contextMenuRef}
      className="taskbar-context"
      aria-label={`Opções de ${contextApp?.name ?? context.appId}`}
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
            Abrir nova janela
          </button>
        )}
        <button type="button" onClick={() => runContextAction('activate')}>
          {contextTarget?.minimized ? 'Restaurar janela' : 'Ativar janela'}
        </button>
        <button
          type="button"
          disabled={!contextTarget || contextTarget.minimized}
          onClick={() => runContextAction('minimize')}
        >
          Minimizar janela
        </button>
        <div className="taskbar-context__divider" />
        <button type="button" onClick={() => runContextAction('close')}>
          Fechar janela
        </button>
        {context.instances.length > 1 && (
          <button
            type="button"
            className="taskbar-context__danger"
            onClick={() => runContextAction('close-all')}
          >
            Fechar todas as janelas
          </button>
        )}
      </div>
    </section>
  );
}

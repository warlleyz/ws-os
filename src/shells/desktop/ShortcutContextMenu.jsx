export default function ShortcutContextMenu({
  shortcutContextRef,
  app,
  shortcutContext,
  runShortcutContextAction,
}) {
  return (
    <div
      ref={shortcutContextRef}
      className="desktop__context"
      role="group"
      aria-label={`Opções de ${app.name}`}
      style={{
        left: shortcutContext.x,
        top: shortcutContext.y,
      }}
    >
      <strong>{app.name}</strong>

      <button type="button" onClick={() => runShortcutContextAction('open')}>
        Abrir
      </button>

      <button
        type="button"
        aria-expanded={shortcutContext.showInfo}
        onClick={() => runShortcutContextAction('info')}
      >
        Informações
      </button>

      {shortcutContext.showInfo && (
        <div className="desktop__context-info">
          <span>
            Tipo: {app.category === 'system' ? 'Aplicativo de Sistema' : 'Aplicativo Desktop'}
          </span>

          <span>Estado: {app.implemented ? 'Implementado' : 'Em desenvolvimento'}</span>
        </div>
      )}
    </div>
  );
}

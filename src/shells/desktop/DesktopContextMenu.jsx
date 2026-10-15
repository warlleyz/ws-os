export default function DesktopContextMenu({
  desktopContextRef,
  desktopContext,
  runDesktopContextAction,
  clockWidget,
  shortcutOrder,
}) {
  return (
    <div
      ref={desktopContextRef}
      className="desktop__context"
      role="group"
      aria-label="Opções da área de trabalho"
      style={{
        left: desktopContext.x,
        top: desktopContext.y,
      }}
    >
      <strong>Área de trabalho</strong>

      <button
        type="button"
        onClick={() => runDesktopContextAction('sort-default')}
        aria-pressed={shortcutOrder === 'default'}
      >
        Organização padrão
      </button>

      <button
        type="button"
        onClick={() => runDesktopContextAction('sort-name')}
        aria-pressed={shortcutOrder === 'name'}
      >
        Ordenar por nome
      </button>

      <div className="desktop__context-divider" />

      <button type="button" onClick={() => runDesktopContextAction('toggle-clock')}>
        {clockWidget?.visible ? 'Ocultar relógio' : 'Mostrar relógio'}
      </button>
    </div>
  );
}

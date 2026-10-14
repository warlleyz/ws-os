export default function DesktopContextMenu({
  desktopContextRef,
  desktopContext,
  runDesktopContextAction,
  shortcutOrder,
  clockWidget,
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
        disabled={shortcutOrder === 'default'}
      >
        Organização padrão
      </button>

      <button
        type="button"
        onClick={() => runDesktopContextAction('sort-name')}
        disabled={shortcutOrder === 'name'}
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

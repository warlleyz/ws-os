import useMenuNavigation from '../../shared/hooks/useMenuNavigation';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
export default function DesktopContextMenu({
  desktopContextRef,
  desktopContext,
  runDesktopContextAction,
  clockWidget,
  shortcutOrder,
}) {
  useLocale();
  useMenuNavigation(desktopContextRef);
  return (
    <div
      ref={desktopContextRef}
      className="desktop__context"
      role="group"
      aria-label={t('Opções da área de trabalho')}
      style={{
        left: desktopContext.x,
        top: desktopContext.y,
      }}
    >
      <strong>{t('Área de trabalho')}</strong>

      <button
        type="button"
        onClick={() => runDesktopContextAction('sort-default')}
        aria-pressed={shortcutOrder === 'default'}
      >
        {t('Organização padrão')}
      </button>

      <button
        type="button"
        onClick={() => runDesktopContextAction('sort-name')}
        aria-pressed={shortcutOrder === 'name'}
      >
        {t('Ordenar por nome')}
      </button>

      <div className="desktop__context-divider" />

      <button type="button" onClick={() => runDesktopContextAction('toggle-clock')}>
        {clockWidget?.visible ? t('Ocultar relógio') : t('Mostrar relógio')}
      </button>
    </div>
  );
}

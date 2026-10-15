import useMenuNavigation from '../../shared/hooks/useMenuNavigation';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
export default function ShortcutContextMenu({
  shortcutContextRef,
  app,
  shortcutContext,
  runShortcutContextAction,
}) {
  useLocale();
  useMenuNavigation(shortcutContextRef, app.id);
  return (
    <div
      ref={shortcutContextRef}
      className="desktop__context"
      role="group"
      aria-label={t(`Opções de ${app.name}`)}
      style={{
        left: shortcutContext.x,
        top: shortcutContext.y,
      }}
    >
      <strong>{t(app.name)}</strong>

      <button type="button" onClick={() => runShortcutContextAction('open')}>
        {t('Abrir')}
      </button>

      <button
        type="button"
        aria-expanded={shortcutContext.showInfo}
        onClick={() => runShortcutContextAction('info')}
      >
        {t('Informações')}
      </button>

      {shortcutContext.showInfo && (
        <div className="desktop__context-info">
          <span>
            {t('Tipo:')}
            {app.category === 'system' ? t('Aplicativo de Sistema') : t('Aplicativo Desktop')}
          </span>

          <span>
            {t('Estado:')} {app.implemented ? t('Implementado') : t('Em desenvolvimento')}
          </span>
        </div>
      )}
    </div>
  );
}

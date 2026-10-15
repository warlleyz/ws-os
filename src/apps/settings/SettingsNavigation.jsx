import { translate as t, useLocale } from '../../shared/i18n/i18n';

export default function SettingsNavigation({ sections, activeSection, onNavigate }) {
  useLocale();

  return (
    <nav className="ws-settings__sidebar" aria-label={t('Seções das configurações')}>
      <div className="ws-settings__sidebar-heading" aria-hidden="true">
        {t('Preferências')}
      </div>

      <div className="ws-settings__navigation">
        {sections.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              className={`ws-settings__navigation-button${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
              <span>{t(label)}</span>
            </button>
          );
        })}
      </div>

      <div className="ws-settings__sidebar-footer" aria-hidden="true">
        <span className="ws-settings__status-dot" />
        WS OS
      </div>
    </nav>
  );
}

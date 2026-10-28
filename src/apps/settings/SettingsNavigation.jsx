
import { translate as t, useLocale } from '../../shared/i18n/i18n';

/* === AGRUPAMENTO DA NAVEGAÇÃO === */
const GROUPS = [
  {
    id: 'personalization',
    label: 'Personalização',
  },
  {
    id: 'environment',
    label: 'Ambiente',
  },
  {
    id: 'system',
    label: 'Sistema',
  },
];

/* === MENU LATERAL DE PREFERÊNCIAS === */
export default function SettingsNavigation({
  sections,
  activeSection,
  onNavigate,
}) {
  useLocale();

  return (
    <nav
      className="ws-settings__sidebar"
      aria-label={t('Seções das configurações')}
    >
      <div className="ws-settings__navigation">
        {GROUPS.map((group) => {
          const items = sections.filter(
            (section) => section.group === group.id,
          );

          if (items.length === 0) return null;

          return (
            <div
              className="ws-settings__nav-group"
              key={group.id}
            >
              <span className="ws-settings__sidebar-heading">
                {t(group.label)}
              </span>

              <div className="ws-settings__nav-items">
                {items.map(({ id, label, icon: Icon }) => {
                  const active = activeSection === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      className={[
                        'ws-settings__navigation-button',
                        active ? 'is-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => onNavigate(id)}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />

                      <span>{t(label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ws-settings__sidebar-footer" aria-hidden="true">
        <span className="ws-settings__status-dot" />
        WS OS V2
      </div>
    </nav>
  );
}

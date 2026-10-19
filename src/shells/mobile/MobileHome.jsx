import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { AppIcon } from '../../shared/components/AppIcon';

const HOME_APP_IDS = ['about-me', 'projects', 'dev-insights', 'resume', 'certificates', 'contact'];

export default function MobileHome({ apps, onOpenApp, onOpenCatalog }) {
  const locale = useLocale();

  const featuredApps = HOME_APP_IDS.map((id) => apps.find((app) => app.id === id)).filter(Boolean);

  return (
    <>
      <section className="ws-mobile__welcome">
        <span>WS OS</span>
        <h1>{portfolio.profile.name || t('Bem-vindo à WS OS')}</h1>
        <p>{contentText(portfolio.profile.headline, locale)}</p>
        <p>{contentText(portfolio.profile.summary, locale)}</p>
      </section>

      <section className="ws-mobile__catalog">
        <div className="ws-mobile__section-header">
          <h2>{t('Aplicativos')}</h2>
          <button type="button" onClick={onOpenCatalog}>
            {t('Todos os aplicativos')} →
          </button>
        </div>

        <div className="ws-mobile__grid">
          {featuredApps.map((app) => (
            <button
              key={app.id}
              type="button"
              className="ws-mobile__app-button"
              onClick={() => onOpenApp(app.id)}
            >
              <span className="ws-mobile__app-icon">
                <AppIcon app={app} size={24} />
              </span>
              <span>{t(app.name)}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

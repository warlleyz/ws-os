import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { safeExternalUrl } from '../../shared/utils/urls';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import '../../styles/apps.css';
export default function AboutMe() {
  const locale = useLocale();
  const { run } = useSystem();
  const profile = portfolio.profile;
  return (
    <article className="desktop-window__content ws-app">
      <header>
        <p>{t('Apresentação profissional')}</p>
        <h2>{t('Sobre Mim')}</h2>
        {profile.name && <h3>{profile.name}</h3>}
        <h3>{contentText(profile.headline, locale)}</h3>
        <p>{contentText(profile.summary, locale)}</p>
      </header>
      <section>
        <h3>{t('Áreas de atuação')}</h3>
        <ul>
          {profile.areas.map((area, index) => (
            <li key={index}>{contentText(area, locale)}</li>
          ))}
        </ul>
      </section>
      {profile.timeline.length > 0 && (
        <section>
          <h3>{t('Trajetória')}</h3>
          <ol>
            {profile.timeline.map((item) => (
              <li key={item.id}>
                <time>{item.date}</time>
                <h4>{contentText(item.title, locale)}</h4>
                <p>{contentText(item.description, locale)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
      {profile.interests.length > 0 && (
        <section>
          <h3>{t('Interesses')}</h3>
          <ul>
            {profile.interests.map((item, index) => (
              <li key={index}>{contentText(item, locale)}</li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3>{t('Explore o portfólio')}</h3>
        <div className="ws-app__toolbar">
          {[
            ['projects', 'Projetos'],
            ['resume', 'Currículo'],
            ['certificates', 'Certificados'],
            ['contact', 'Contato'],
          ].map(([id, name]) => (
            <button key={id} type="button" onClick={() => run(openApp, id, { origin: 'about-me' })}>
              {t(name)}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>{t('Links profissionais')}</h3>
        <ul>
          {profile.links
            .filter((item) => safeExternalUrl(item.url))
            .map((item) => (
              <li key={item.url}>
                <a href={safeExternalUrl(item.url)} target="_blank" rel="noopener noreferrer">
                  {contentText(item.label, locale)}
                </a>
              </li>
            ))}
        </ul>
      </section>
    </article>
  );
}

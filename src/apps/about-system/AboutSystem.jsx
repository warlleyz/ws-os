import { translate as t, useLocale } from '../../shared/i18n/i18n';

const technologies = ['React', 'JavaScript', 'Vite', 'CSS'];

export default function AboutSystem() {
  useLocale();
  return (
    <div className="desktop-window__content">
      <h2>WS OS</h2>

      <p>
        {t('Portfólio profissional interativo inspirado na experiência de um sistema operacional.')}
      </p>

      <section aria-labelledby="system-technology">
        <h3 id="system-technology">{t('Tecnologias')}</h3>
        <ul>
          {technologies.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="system-architecture">
        <h3 id="system-architecture">{t('Arquitetura')}</h3>
        <p>
          {t(
            'Sistema modular organizado em Core, Shells, Features, Apps, Services, Shared e Styles.',
          )}
        </p>
      </section>

      <section aria-labelledby="system-status">
        <h3 id="system-status">{t('Estado do projeto')}</h3>
        <p>
          {t(
            'Protótipo Desktop em desenvolvimento. Aplicativos, experiência Mobile e integrações adicionais ainda estão em implementação.',
          )}
        </p>
      </section>

      <section aria-labelledby="system-source">
        <h3 id="system-source">{t('Código-fonte')}</h3>
        <a href="https://github.com/warlleyz/ws-os" target="_blank" rel="noopener noreferrer">
          {t('Repositório no GitHub')}
        </a>
      </section>
    </div>
  );
}

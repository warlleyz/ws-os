import packageInfo from '../../../package.json';

import { translate as t, useLocale } from '../../shared/i18n/i18n';

const technologies = [
  'React',
  'JavaScript',
  'Vite',
  'CSS',
  'Lucide React',
];

const architecture = [
  ['Core', 'Estado, instâncias e contratos do sistema'],
  ['Shells', 'Experiências Desktop e Mobile'],
  ['Features', 'Recursos compartilhados do sistema'],
  ['Apps', 'Aplicativos independentes'],
  ['Services', 'Integrações e serviços externos'],
  ['Shared', 'Componentes e utilitários reutilizáveis'],
  ['Styles', 'Estilos e identidade visual'],
];

export default function AboutSystem() {
  useLocale();

  return (
    <article className="desktop-window__content ws-app">
      <header>
        <h2>WS OS</h2>
        <p>
          {t(
            'Portfólio profissional interativo inspirado na experiência de um sistema operacional.',
          )}
        </p>
      </header>

      <section aria-labelledby="system-version">
        <h3 id="system-version">{t('Versão')}</h3>
        <p>WS OS V2 · {packageInfo.version}</p>
        <small>
          {t('Versão técnica atual do projeto, sujeita a alterações durante o desenvolvimento.')}
        </small>
      </section>

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

        <dl>
          {architecture.map(([name, description]) => (
            <div key={name}>
              <dt>
                <strong>{name}</strong>
              </dt>
              <dd>{t(description)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="system-status">
        <h3 id="system-status">{t('Estado do projeto')}</h3>
        <p>
          {t(
            'As bases Desktop e Mobile estão implementadas. Os aplicativos e as integrações continuam em desenvolvimento.',
          )}
        </p>
      </section>

      <section><h3>{t('Evolução e créditos')}</h3><p>{t('A V2 integra experiências Desktop e Mobile, conteúdo profissional e aplicativos locais com permissões explícitas.')}</p><p>{t('Construído com React, React DOM, Lucide e Vite. As licenças das dependências acompanham seus respectivos pacotes.')}</p></section>
      <section aria-labelledby="system-source">
        <h3 id="system-source">{t('Código-fonte')}</h3>

        <a
          href="https://github.com/warlleyz/ws-os"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Repositório no GitHub')}
        </a>
      </section>
    </article>
  );
}

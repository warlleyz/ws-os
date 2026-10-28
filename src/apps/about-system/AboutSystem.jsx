
import {
  AppWindow,
  Blocks,
  Check,
  ChevronRight,
  Code2,
  ExternalLink,
  FileCode2,
  FolderGit2,
  Globe2,
  Layers3,
  LayoutGrid,
  Monitor,
  MonitorCog,
  Palette,
  Scale,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
} from 'lucide-react';

import { FaGithub } from 'react-icons/fa';

import packageInfo from '../../../package.json';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import '../../styles/apps.css';
import './AboutSystem.css';

/* === CONFIGURAÇÃO DO SISTEMA === */
const REPOSITORY_URL = 'https://github.com/warlleyz/ws-os';

const TECHNOLOGIES = [
  {
    name: 'React',
    detail: 'Interface e componentes',
    icon: Blocks,
  },
  {
    name: 'JavaScript',
    detail: 'Lógica da aplicação',
    icon: Code2,
  },
  {
    name: 'Vite',
    detail: 'Desenvolvimento e build',
    icon: Workflow,
  },
  {
    name: 'CSS',
    detail: 'Estilos e responsividade',
    icon: Palette,
  },
  {
    name: 'Lucide React',
    detail: 'Ícones de interface',
    icon: LayoutGrid,
  },
  {
    name: 'PDF.js',
    detail: 'Visualização de documentos',
    icon: FileCode2,
  },
];

/* === ARQUITETURA MODULAR === */
const ARCHITECTURE = [
  {
    name: 'Core',
    description: {
      'pt-BR': 'Estado, instâncias e contratos do sistema.',
      en: 'System state, instances and contracts.',
    },
  },
  {
    name: 'Shells',
    description: {
      'pt-BR': 'Experiências Desktop e Mobile.',
      en: 'Desktop and Mobile experiences.',
    },
  },
  {
    name: 'Features',
    description: {
      'pt-BR': 'Recursos compartilhados do sistema.',
      en: 'Shared system features.',
    },
  },
  {
    name: 'Apps',
    description: {
      'pt-BR': 'Aplicativos independentes.',
      en: 'Independent applications.',
    },
  },
  {
    name: 'Services',
    description: {
      'pt-BR': 'Integrações e serviços externos.',
      en: 'Integrations and external services.',
    },
  },
  {
    name: 'Shared',
    description: {
      'pt-BR': 'Componentes e utilitários reutilizáveis.',
      en: 'Reusable components and utilities.',
    },
  },
  {
    name: 'Styles',
    description: {
      'pt-BR': 'Estilos e identidade visual.',
      en: 'Styles and visual identity.',
    },
  },
];

/* === RECURSOS DO SISTEMA === */
const FEATURES = [
  {
    icon: Monitor,
    pt: 'Ambiente Desktop',
    en: 'Desktop environment',
  },
  {
    icon: Smartphone,
    pt: 'Experiência Mobile',
    en: 'Mobile experience',
  },
  {
    icon: AppWindow,
    pt: 'Janelas interativas',
    en: 'Interactive windows',
  },
  {
    icon: Palette,
    pt: 'Personalização visual',
    en: 'Visual customization',
  },
  {
    icon: Globe2,
    pt: 'Idiomas PT-BR e EN',
    en: 'PT-BR and EN languages',
  },
  {
    icon: Sparkles,
    pt: 'Assistente Wally',
    en: 'Wally assistant',
  },
  {
    icon: Settings2,
    pt: 'Preferências do sistema',
    en: 'System preferences',
  },
  {
    icon: ShieldCheck,
    pt: 'Permissões e controles',
    en: 'Permissions and controls',
  },
];

/* === CRÉDITOS E LICENÇAS === */
const CREDITS = [
  {
    name: 'React / React DOM',
    license: 'MIT',
    url: 'https://github.com/facebook/react/blob/main/LICENSE',
  },
  {
    name: 'Vite',
    license: 'MIT',
    url: 'https://github.com/vitejs/vite/blob/main/LICENSE',
  },
  {
    name: 'Lucide',
    license: 'ISC',
    url: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE',
  },
  {
    name: 'PDF.js',
    license: 'Apache-2.0',
    url: 'https://github.com/mozilla/pdf.js/blob/master/LICENSE',
  },
];

/* === UTILITÁRIOS === */
function localized(locale, pt, en) {
  return locale?.toLowerCase().startsWith('en') ? en : pt;
}

function descriptionFor(locale, item) {
  return localized(
    locale,
    item.description['pt-BR'],
    item.description.en,
  );
}

/* === CABEÇALHO PADRÃO V2 === */
function SystemHeader({ locale }) {
  return (
    <header className="ws-system__hero">
      <div className="ws-system__hero-copy">
        <span className="ws-system__eyebrow">
          WS OS / SYSTEM
        </span>

        <h2>{t('Sobre o Sistema')}</h2>

        <p>
          {localized(
            locale,
            'Conheça a estrutura, as tecnologias e os recursos do WS OS.',
            'Explore the architecture, technologies and features of WS OS.',
          )}
        </p>
      </div>

      <MonitorCog
        className="ws-system__hero-icon"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </header>
  );
}

/* === IDENTIDADE DO SISTEMA === */
function SystemIdentity({ locale }) {
  return (
    <section
      className="ws-system__identity"
      aria-label="WS OS"
    >
      <div className="ws-system__identity-mark">
        <span aria-hidden="true">WS</span>
      </div>

      <div className="ws-system__identity-content">
        <div className="ws-system__identity-title">
          <h3>WS OS</h3>

          <span className="ws-system__version-badge">
            V2
          </span>
        </div>

        <p>
          {localized(
            locale,
            'Um portfólio interativo que reúne projetos, informações profissionais e aplicativos em uma experiência inspirada em sistemas operacionais.',
            'An interactive portfolio that brings projects, professional information and applications together in an operating system-inspired experience.',
          )}
        </p>

        <div className="ws-system__identity-meta">
          <span>
            <Check size={13} aria-hidden="true" />
            Desktop
          </span>

          <span>
            <Check size={13} aria-hidden="true" />
            Mobile
          </span>

          <span>
            <Check size={13} aria-hidden="true" />
            PT-BR / EN
          </span>
        </div>
      </div>
    </section>
  );
}

/* === TÍTULO COMPARTILHADO DE SEÇÃO === */
function SectionHeading({
  icon: Icon,
  title,
  description,
}) {
  return (
    <header className="ws-system__section-heading">
      <span className="ws-system__section-icon">
        <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
      </span>

      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}

/* === APLICATIVO SOBRE O SISTEMA === */
export default function AboutSystem() {
  const locale = useLocale();

  return (
    <article className="desktop-window__content ws-app ws-system">
      {/* === APRESENTAÇÃO === */}
      <SystemHeader locale={locale} />

      <SystemIdentity locale={locale} />

      {/* === INFORMAÇÕES DA VERSÃO === */}
      <section
        className="ws-system__section"
        aria-labelledby="ws-system-version"
      >
        <SectionHeading
          icon={MonitorCog}
          title={localized(locale, 'Informações do sistema', 'System information')}
          description={localized(
            locale,
            'Identificação e detalhes técnicos da versão.',
            'Identification and technical version details.',
          )}
        />

        <div className="ws-system__info-panel">
          <div className="ws-system__info-row">
            <span>
              {localized(locale, 'Sistema', 'System')}
            </span>
            <strong>WS OS</strong>
          </div>

          <div className="ws-system__info-row">
            <span>
              {localized(locale, 'Geração', 'Generation')}
            </span>
            <strong>V2</strong>
          </div>

          <div className="ws-system__info-row">
            <span>
              {localized(locale, 'Versão técnica do pacote', 'Package version')}
            </span>
            <code>{packageInfo.version}</code>
          </div>

          <div className="ws-system__info-row">
            <span>
              {localized(locale, 'Plataformas', 'Platforms')}
            </span>
            <strong>Desktop / Mobile</strong>
          </div>

          <div className="ws-system__info-row">
            <span>
              {localized(locale, 'Idiomas', 'Languages')}
            </span>
            <strong>Português / English</strong>
          </div>
        </div>
      </section>

      {/* === TECNOLOGIAS === */}
      <section
        className="ws-system__section"
        aria-label={t('Tecnologias')}
      >
        <SectionHeading
          icon={Code2}
          title={t('Tecnologias')}
          description={localized(
            locale,
            'Ferramentas utilizadas na construção da interface e dos aplicativos.',
            'Tools used to build the interface and applications.',
          )}
        />

        <div className="ws-system__technology-grid">
          {TECHNOLOGIES.map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="ws-system__technology"
                key={item.name}
              >
                <span className="ws-system__technology-icon">
                  <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                </span>

                <div>
                  <strong>{item.name}</strong>
                  <small>{t(item.detail)}</small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* === ARQUITETURA === */}
      <section
        className="ws-system__section"
        aria-label={t('Arquitetura')}
      >
        <SectionHeading
          icon={Layers3}
          title={t('Arquitetura')}
          description={localized(
            locale,
            'Organização modular das responsabilidades do projeto.',
            'Modular organization of project responsibilities.',
          )}
        />

        <div className="ws-system__architecture">
          {ARCHITECTURE.map((item) => (
            <div
              className="ws-system__architecture-item"
              key={item.name}
            >
              <span className="ws-system__architecture-mark">
                <ChevronRight size={15} aria-hidden="true" />
              </span>

              <div>
                <strong>{item.name}</strong>
                <p>{descriptionFor(locale, item)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === RECURSOS === */}
      <section
        className="ws-system__section"
        aria-label={localized(locale, 'Recursos do sistema', 'System features')}
      >
        <SectionHeading
          icon={LayoutGrid}
          title={localized(locale, 'Recursos do sistema', 'System features')}
          description={localized(
            locale,
            'Funcionalidades que compõem a experiência do WS OS.',
            'Features that make up the WS OS experience.',
          )}
        />

        <div className="ws-system__features">
          {FEATURES.map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="ws-system__feature"
                key={item.pt}
              >
                <Icon
                  size={17}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <span>
                  {localized(locale, item.pt, item.en)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* === CRÉDITOS === */}
      <section
        className="ws-system__section"
        aria-label={localized(locale, 'Créditos e licenças', 'Credits and licenses')}
      >
        <SectionHeading
          icon={Scale}
          title={localized(locale, 'Créditos e licenças', 'Credits and licenses')}
          description={localized(
            locale,
            'Bibliotecas de código aberto e suas respectivas licenças.',
            'Open-source libraries and their respective licenses.',
          )}
        />

        <div className="ws-system__credits">
          {CREDITS.map((item) => (
            <a
              className="ws-system__credit"
              href={item.url}
              key={item.name}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <strong>{item.name}</strong>
                <small>{item.license}</small>
              </div>

              <ExternalLink
                size={16}
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </section>

      {/* === REPOSITÓRIO === */}
      <section className="ws-system__repository">
        <div className="ws-system__repository-copy">
          <span className="ws-system__repository-icon">
            <FolderGit2 size={21} aria-hidden="true" />
          </span>

          <div>
            <h3>
              {localized(locale, 'Código-fonte', 'Source code')}
            </h3>

            <p>
              {localized(
                locale,
                'Explore a organização e a implementação do projeto no GitHub.',
                'Explore the project structure and implementation on GitHub.',
              )}
            </p>
          </div>
        </div>

        <a
          className="ws-system__repository-link"
          href={REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub size={17} aria-hidden="true" />
          GitHub
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </section>

      {/* === RODAPÉ === */}
      <footer className="ws-system__footer">
        <span>WS OS V2</span>

        <span>
          {localized(
            locale,
            'Portfólio interativo',
            'Interactive portfolio',
          )}
        </span>
      </footer>
    </article>
  );
}

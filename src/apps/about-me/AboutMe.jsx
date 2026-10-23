import { useState } from 'react';
import {
  BookOpen,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Rocket,
  Wrench,
} from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { publicAssetUrl, safeExternalUrl } from '../../shared/utils/urls';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import SkillsGlobe from './SkillsGlobe';
import './AboutMe.css';

/* === Conteúdo complementar da apresentação === */
/* ----- Textos profissionais nos dois idiomas ----- */
const copy = {
  'pt-BR': {
    eyebrow: 'Estudante de Engenharia de Software',
    institution: 'PUC Minas',
    region: 'Minas Gerais, Brasil',
    introductionLabel: 'Apresentação',
    introduction: 'Quem sou',
    introductionParagraphs: [
      'Estou construindo minha formação em Engenharia de Software na PUC Minas, com foco em programação, desenvolvimento web, orientação a objetos, APIs e aplicações backend.',
      'Tenho interesse em compreender não apenas como escrever código, mas também como estruturar sistemas, conectar serviços e transformar ideias em aplicações funcionais.',
      'Gosto de aprender na prática por meio de projetos acadêmicos e pessoais, explorando tecnologias que resolvem problemas reais.',
    ],
    learningLabel: 'Aprendizado',
    learning: 'O que estou estudando',
    learningDescription: 'Tecnologias e conceitos presentes nos meus estudos e projetos.',
    knowledgeLabel: 'Base atual',
    knowledge: 'Conhecimentos',
    goalsLabel: 'Próximos passos',
    goals: 'Objetivos',
    goalsItems: [
      'Desenvolver projetos acadêmicos e pessoais com atenção à qualidade, organização e experiência de uso.',
      'Conquistar uma oportunidade de estágio para colaborar com equipes e evoluir profissionalmente.',
      'Aprofundar conhecimentos em backend, automação, integração de aplicações e gerenciamento de dados.',
    ],
    linksLabel: 'Conexões',
    links: 'Links profissionais',
    contact: 'Contato',
    photoAlt: 'Foto de perfil de Warlley Silva',
  },
  en: {
    eyebrow: 'Software Engineering Student',
    institution: 'PUC Minas',
    region: 'Minas Gerais, Brazil',
    introductionLabel: 'Introduction',
    introduction: 'About me',
    introductionParagraphs: [
      'I am pursuing a Software Engineering degree at PUC Minas, focusing on programming, web development, object-oriented programming, APIs, and backend applications.',
      'I want to understand not only how to write code, but also how to structure systems, connect services, and turn ideas into functional applications.',
      'I enjoy learning by building academic and personal projects and exploring technologies that solve real problems.',
    ],
    learningLabel: 'Learning',
    learning: 'What I am studying',
    learningDescription: 'Technologies and concepts I currently use in my studies and projects.',
    knowledgeLabel: 'Current foundation',
    knowledge: 'Knowledge',
    goalsLabel: 'Next steps',
    goals: 'Goals',
    goalsItems: [
      'Build academic and personal projects with attention to quality, organization, and user experience.',
      'Find an internship opportunity to collaborate with teams and grow professionally.',
      'Deepen my knowledge of backend development, automation, application integration, and data management.',
    ],
    linksLabel: 'Connections',
    links: 'Professional links',
    contact: 'Contact',
    photoAlt: 'Profile photo of Warlley Silva',
  },
};

/* ----- Grupos de conhecimento ----- */
const knowledgeGroups = [
  {
    id: 'development',
    icon: Code2,
    title: { 'pt-BR': 'Desenvolvimento', en: 'Development' },
    items: [
      { 'pt-BR': 'Programação Orientada a Objetos', en: 'Object-oriented programming' },
      { 'pt-BR': 'Lógica de programação', en: 'Programming fundamentals' },
      { 'pt-BR': 'Desenvolvimento web', en: 'Web development' },
      { 'pt-BR': 'Aplicações backend', en: 'Backend applications' },
    ],
  },
  {
    id: 'integration',
    icon: Layers3,
    title: { 'pt-BR': 'Integração', en: 'Integration' },
    items: [
      { 'pt-BR': 'Criação e consumo de APIs REST', en: 'Building and consuming REST APIs' },
      { 'pt-BR': 'Spring Boot', en: 'Spring Boot' },
      { 'pt-BR': 'Maven', en: 'Maven' },
      { 'pt-BR': 'Integração entre aplicações', en: 'Application integration' },
    ],
  },
  {
    id: 'tools',
    icon: Wrench,
    title: { 'pt-BR': 'Ferramentas', en: 'Tools' },
    items: ['Git', 'GitHub', 'Docker', 'Figma'],
  },
  {
    id: 'data',
    icon: Database,
    title: { 'pt-BR': 'Dados', en: 'Data' },
    items: [
      { 'pt-BR': 'Modelagem de dados', en: 'Data modeling' },
      { 'pt-BR': 'Manipulação de dados', en: 'Data manipulation' },
      { 'pt-BR': 'Organização de informações', en: 'Information organization' },
      { 'pt-BR': 'Fundamentos de banco de dados', en: 'Database fundamentals' },
    ],
  },
];

/* === Componentes da apresentação === */
/* ----- Cabeçalho das seções ----- */
function SectionHeading({ icon: Icon, eyebrow, title, id }) {
  return (
    <div className="ws-about__section-heading">
      <span className="ws-about__section-icon"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
      <div>
        <span className="ws-about__section-eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
    </div>
  );
}

/* === Aplicativo Sobre Mim === */
export default function AboutMe({ instance }) {
  const locale = useLocale();
  const language = locale === 'en' ? 'en' : 'pt-BR';
  const words = copy[language];
  const { run } = useSystem();
  const profile = portfolio.profile;
  const [photoVisible, setPhotoVisible] = useState(true);
  const imageUrl = publicAssetUrl('assets/profile/profile.jpg');

  function navigate(appId) {
    run(openApp, appId, {
      origin: 'about-me',
      ...(instance?.id ? { originInstanceId: instance.id } : {}),
    });
  }

  return (
    <article className="desktop-window__content ws-app ws-about" lang={language}>
      {/* === Perfil profissional === */}
      <header className="ws-about__profile">
        <div className="ws-about__photo" aria-label={words.photoAlt}>
          {imageUrl && photoVisible ? (
            <img src={imageUrl} alt={words.photoAlt} onError={() => setPhotoVisible(false)} />
          ) : (
            <span aria-hidden="true">WS</span>
          )}
        </div>
        <div className="ws-about__profile-content">
          <span className="ws-about__eyebrow">{contentText(profile.headline, locale) || words.eyebrow}</span>
          <h1>{profile.name}</h1>
          <p>{contentText(profile.summary, locale)}</p>
          <div className="ws-about__meta">
            <span><GraduationCap size={15} aria-hidden="true" />{words.institution}</span>
            <span><MapPin size={15} aria-hidden="true" />{words.region}</span>
          </div>
        </div>
      </header>

      {/* === Apresentação contínua e globo em destaque === */}
      <div className="ws-about__main">
        <div className="ws-about__narrative">
          <section className="ws-about__section ws-about__introduction" aria-labelledby="ws-about-intro">
            <SectionHeading icon={BookOpen} eyebrow={words.introductionLabel} title={words.introduction} id="ws-about-intro" />
            <div className="ws-about__text">
              {words.introductionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>

          <section className="ws-about__section ws-about__goals" aria-labelledby="ws-about-goals">
            <SectionHeading icon={Rocket} eyebrow={words.goalsLabel} title={words.goals} id="ws-about-goals" />
            <div className="ws-about__goals-grid">
              {words.goalsItems.map((item) => <p key={item}>{item}</p>)}
            </div>
          </section>
        </div>

        <section className="ws-about__section ws-about__learning" aria-labelledby="ws-about-learning">
          <SectionHeading icon={Rocket} eyebrow={words.learningLabel} title={words.learning} id="ws-about-learning" />
          <p className="ws-about__description">{words.learningDescription}</p>
          <SkillsGlobe locale={language} minimized={Boolean(instance?.minimized)} />
        </section>
      </div>

      {/* === Conhecimentos === */}
      <section className="ws-about__section" aria-labelledby="ws-about-knowledge">
        <SectionHeading icon={GitBranch} eyebrow={words.knowledgeLabel} title={words.knowledge} id="ws-about-knowledge" />
        <div className="ws-about__knowledge-grid">
          {knowledgeGroups.map(({ id, icon: Icon, title, items }) => (
            <article className="ws-about__knowledge-card" key={id}>
              <div className="ws-about__knowledge-header">
                <span><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span>
                <h3>{contentText(title, locale)}</h3>
              </div>
              <ul>{items.map((item, index) => <li key={index}>{typeof item === 'string' ? item : contentText(item, locale)}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      {/* === Links profissionais e Contato === */}
      <section className="ws-about__section" aria-labelledby="ws-about-links">
        <SectionHeading icon={ExternalLink} eyebrow={words.linksLabel} title={words.links} id="ws-about-links" />
        <div className="ws-about__links">
          {profile.links?.filter((item) => safeExternalUrl(item.url)).map((item) => {
            const label = contentText(item.label, locale);
            const LinkIcon = /github/i.test(label)
              ? FaGithub
              : /linkedin/i.test(label)
                ? FaLinkedin
                : ExternalLink;
            return (
              <a className="ws-about__link" href={safeExternalUrl(item.url)} key={item.url} target="_blank" rel="noopener noreferrer">
                <span className="ws-about__link-icon"><LinkIcon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                <span className="ws-about__link-info"><strong>{label}</strong><small>{language === 'en' ? 'External profile' : 'Perfil externo'}</small></span>
                <ExternalLink className="ws-about__link-action" size={15} aria-hidden="true" />
              </a>
            );
          })}
          <button className="ws-about__link ws-about__link--contact" type="button" onClick={() => navigate('contact')}>
            <span className="ws-about__link-icon"><Mail size={19} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="ws-about__link-info"><strong>{words.contact}</strong><small>{language === 'en' ? 'Get in touch' : 'Entre em contato'}</small></span>
            <span className="ws-about__link-action" aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </article>
  );
}

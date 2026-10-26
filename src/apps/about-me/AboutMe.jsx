import { useState } from 'react';
import {
  Award,
  BookOpen,
  ExternalLink,
  FileText,
  FolderGit2,
  GraduationCap,
  Mail,
  MapPin,
  Orbit,
  Rocket,
} from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { publicAssetUrl, safeExternalUrl } from '../../shared/utils/urls';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import SkillsGlobe from './SkillsGlobe';
import './AboutMe.css';

/* === Conteúdo da apresentação === */
const copy = {
  'pt-BR': {
    eyebrow: 'Estudante de Engenharia de Software',
    institution: 'PUC Minas',
    region: 'Minas Gerais, Brasil',
    photoAlt: 'Foto de perfil de Warlley Silva',
    educationLabel: 'Formação',
    introductionLabel: 'Apresentação',
    introduction: 'Quem sou',
    introductionParagraphs: [
      'Meu interesse por tecnologia vai além de escrever código. Gosto de entender como os sistemas funcionam, como suas partes se conectam e como transformar uma ideia em uma aplicação funcional.',
      'Durante minha formação, venho explorando diferentes tecnologias e áreas do desenvolvimento, principalmente programação, backend e integração de sistemas.',
      'Aprendo colocando a teoria em prática, desenvolvendo projetos acadêmicos e pessoais que me permitem enfrentar desafios e evoluir minhas habilidades.',
    ],
    learningLabel: 'Tecnologias',
    learning: 'Globo de tecnologias',
    learningDescription: 'Tecnologias presentes nos meus estudos e projetos.',
    goalsLabel: 'Próximos passos',
    goals: 'Objetivos profissionais',
    goalsItems: [
      {
        title: 'Oportunidade profissional',
        description:
          'Conquistar uma oportunidade de estágio em desenvolvimento de software, contribuindo com projetos reais e adquirindo experiência em equipe.',
      },
      {
        title: 'Evolução técnica',
        description:
          'Aprofundar meus conhecimentos em backend, arquitetura de aplicações, APIs e bancos de dados.',
      },
      {
        title: 'Projetos e experiência prática',
        description:
          'Continuar desenvolvendo projetos próprios e acadêmicos, aprimorando qualidade de código, organização e experiência de uso.',
      },
    ],
    linksLabel: 'Conexões',
    links: 'Links profissionais',
    contact: 'Contato',
    linkDescriptions: {
      github: 'Repositórios e projetos de desenvolvimento.',
      linkedin: 'Perfil acadêmico e conexões profissionais.',
      contact: 'Acesse os canais de comunicação disponíveis.',
      external: 'Perfil externo',
    },
    navigationLabel: 'Continue explorando',
    navigation: 'Explore meu portfólio',
    navigationItems: [
      {
        id: 'projects',
        title: 'Projetos',
        description: 'Explore os projetos que desenvolvo.',
      },
      {
        id: 'resume',
        title: 'Currículo',
        description: 'Consulte minha formação e meus conhecimentos.',
      },
      {
        id: 'certificates',
        title: 'Certificados',
        description: 'Conheça meus cursos, eventos e atividades complementares.',
      },
    ],
  },
  en: {
    eyebrow: 'Software Engineering Student',
    institution: 'PUC Minas',
    region: 'Minas Gerais, Brazil',
    photoAlt: 'Profile photo of Warlley Silva',
    educationLabel: 'Academic background',
    introductionLabel: 'Introduction',
    introduction: 'About me',
    introductionParagraphs: [
      'My interest in technology goes beyond writing code. I enjoy understanding how systems work, how their parts connect, and how to turn an idea into a functional application.',
      'Throughout my studies, I have been exploring different technologies and areas of development, especially programming, backend development, and systems integration.',
      'I learn by putting theory into practice, building academic and personal projects that challenge me and help me develop my skills.',
    ],
    learningLabel: 'Technologies',
    learning: 'Technology globe',
    learningDescription: 'Technologies featured in my studies and projects.',
    goalsLabel: 'Next steps',
    goals: 'Professional goals',
    goalsItems: [
      {
        title: 'Professional opportunity',
        description:
          'Secure a software development internship, contributing to real projects and gaining experience working with a team.',
      },
      {
        title: 'Technical development',
        description:
          'Deepen my knowledge of backend development, application architecture, APIs, and databases.',
      },
      {
        title: 'Projects and practical experience',
        description:
          'Continue developing personal and academic projects, improving code quality, organization, and user experience.',
      },
    ],
    linksLabel: 'Connections',
    links: 'Professional links',
    contact: 'Contact',
    linkDescriptions: {
      github: 'Development repositories and projects.',
      linkedin: 'Academic profile and professional connections.',
      contact: 'Access the available communication channels.',
      external: 'External profile',
    },
    navigationLabel: 'Keep exploring',
    navigation: 'Explore my portfolio',
    navigationItems: [
      {
        id: 'projects',
        title: 'Projects',
        description: 'Explore the projects I develop.',
      },
      {
        id: 'resume',
        title: 'Resume',
        description: 'Learn about my education and technical knowledge.',
      },
      {
        id: 'certificates',
        title: 'Certificates',
        description: 'Explore my courses, events, and additional activities.',
      },
    ],
  },
};

/* === Configuração da navegação === */
const navigationIcons = {
  projects: FolderGit2,
  resume: FileText,
  certificates: Award,
};

/* === Componentes de apresentação === */
function SectionHeading({ icon: Icon, eyebrow, title, id }) {
  return (
    <div className="ws-about__section-heading">
      <span className="ws-about__section-icon">
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div>
        <span className="ws-about__section-eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
    </div>
  );
}

function getLinkPresentation(label, descriptions) {
  if (/github/i.test(label)) {
    return {
      icon: FaGithub,
      description: descriptions.github,
    };
  }

  if (/linkedin/i.test(label)) {
    return {
      icon: FaLinkedin,
      description: descriptions.linkedin,
    };
  }

  return {
    icon: ExternalLink,
    description: descriptions.external,
  };
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
        <div className="ws-about__photo">
          {imageUrl && photoVisible ? (
            <img
              src={imageUrl}
              alt={words.photoAlt}
              onError={() => setPhotoVisible(false)}
            />
          ) : (
            <span aria-hidden="true">WS</span>
          )}
        </div>

        <div className="ws-about__profile-content">
          <span className="ws-about__eyebrow">
            {contentText(profile.headline, locale) || words.eyebrow}
          </span>
          <h1>{profile.name}</h1>
          <p>{contentText(profile.summary, locale)}</p>

          <div className="ws-about__meta">
            <span>
              <GraduationCap size={15} aria-hidden="true" />
              {words.institution}
            </span>
            <span>
              <MapPin size={15} aria-hidden="true" />
              {words.region}
            </span>
          </div>
        </div>
      </header>

      {/* === Formação, apresentação e tecnologias === */}
      <div className="ws-about__main">
        {/* ----- Formação acadêmica ----- */}
        <section
          className="ws-about__section ws-about__education"
          aria-labelledby="ws-about-education"
        >
          <SectionHeading
            icon={GraduationCap}
            eyebrow={words.educationLabel}
            title={contentText(profile.education.degree, locale)}
            id="ws-about-education"
          />

          <div className="ws-about__education-content">
            <div className="ws-about__education-meta">
              <strong>{profile.education.institution}</strong>
              <span>{contentText(profile.education.status, locale)}</span>
            </div>
            <p>{contentText(profile.education.description, locale)}</p>
          </div>
        </section>

        {/* ----- Quem sou ----- */}
        <section
          className="ws-about__section ws-about__introduction"
          aria-labelledby="ws-about-intro"
        >
          <SectionHeading
            icon={BookOpen}
            eyebrow={words.introductionLabel}
            title={words.introduction}
            id="ws-about-intro"
          />

          <div className="ws-about__text">
            {words.introductionParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* ----- Globo de tecnologias ----- */}
        <section
          className="ws-about__section ws-about__learning"
          aria-labelledby="ws-about-learning"
        >
          <SectionHeading
            icon={Orbit}
            eyebrow={words.learningLabel}
            title={words.learning}
            id="ws-about-learning"
          />

          <p className="ws-about__description">
            {words.learningDescription}
          </p>

          <SkillsGlobe
            locale={language}
            minimized={Boolean(instance?.minimized)}
          />
        </section>
      </div>

      {/* === Objetivos profissionais === */}
      <section
        className="ws-about__section ws-about__goals"
        aria-labelledby="ws-about-goals"
      >
        <SectionHeading
          icon={Rocket}
          eyebrow={words.goalsLabel}
          title={words.goals}
          id="ws-about-goals"
        />

        <div className="ws-about__goals-grid">
          {words.goalsItems.map((item) => (
            <div className="ws-about__goal" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === Links profissionais === */}
      <section
        className="ws-about__section"
        aria-labelledby="ws-about-links"
      >
        <SectionHeading
          icon={ExternalLink}
          eyebrow={words.linksLabel}
          title={words.links}
          id="ws-about-links"
        />

        <div className="ws-about__links">
          {profile.links
            ?.filter((item) => safeExternalUrl(item.url))
            .map((item) => {
              const label = contentText(item.label, locale);
              const presentation = getLinkPresentation(
                label,
                words.linkDescriptions
              );
              const LinkIcon = presentation.icon;

              return (
                <a
                  className="ws-about__link"
                  href={safeExternalUrl(item.url)}
                  key={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ws-about__link-icon">
                    <LinkIcon
                      size={19}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="ws-about__link-info">
                    <strong>{label}</strong>
                    <small>{presentation.description}</small>
                  </span>
                  <ExternalLink
                    className="ws-about__link-action"
                    size={15}
                    aria-hidden="true"
                  />
                </a>
              );
            })}

          <button
            className="ws-about__link ws-about__link--contact"
            type="button"
            onClick={() => navigate('contact')}
          >
            <span className="ws-about__link-icon">
              <Mail size={19} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="ws-about__link-info">
              <strong>{words.contact}</strong>
              <small>{words.linkDescriptions.contact}</small>
            </span>
            <span className="ws-about__link-action" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </section>

      {/* === Navegação interna === */}
      <section
        className="ws-about__section"
        aria-labelledby="ws-about-navigation"
      >
        <SectionHeading
          icon={FolderGit2}
          eyebrow={words.navigationLabel}
          title={words.navigation}
          id="ws-about-navigation"
        />

        <div className="ws-about__navigation">
          {words.navigationItems.map((item) => {
            const Icon = navigationIcons[item.id];

            return (
              <button
                className="ws-about__navigation-card"
                type="button"
                key={item.id}
                onClick={() => navigate(item.id)}
              >
                <span className="ws-about__link-icon">
                  <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="ws-about__link-info">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <span className="ws-about__link-action" aria-hidden="true">
                  →
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </article>
  );
}
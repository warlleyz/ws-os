
// Conteúdo público do portfólio WS OS.
// Não adicionar chaves privadas ou informações de visitantes.

export const portfolio = {
  githubUser: 'warlleyz',

  notesEndpoint: '',
  posts: [],
  wakatimeProxy: '',

  // PERFIL PROFISSIONAL

  profile: {
    name: 'Warlley Silva',

    headline: {
      'pt-BR': 'Estudante de Engenharia de Software',
      en: 'Software Engineering Student',
    },

    summary: {
      'pt-BR':
        'Sou estudante de Engenharia de Software na PUC Minas, com interesse em desenvolvimento de sistemas, automação, gerenciamento de dados e inteligência artificial. Busco evoluir tecnicamente por meio de projetos acadêmicos e pessoais, aplicando meus conhecimentos na construção de soluções funcionais.',
      en:
        'I am a Software Engineering student at PUC Minas, interested in software development, automation, data management, and artificial intelligence. I aim to improve my technical skills through academic and personal projects, applying my knowledge to build functional solutions.',
    },

    areas: [
      {
        'pt-BR': 'Desenvolvimento de software e aplicações web',
        en: 'Software and web application development',
      },
      {
        'pt-BR': 'Programação Orientada a Objetos',
        en: 'Object-Oriented Programming',
      },
      {
        'pt-BR': 'APIs REST e desenvolvimento backend',
        en: 'REST APIs and backend development',
      },
      {
        'pt-BR': 'Banco de dados e integração de sistemas',
        en: 'Databases and system integration',
      },
    ],

    timeline: [
      {
        id: 'software-engineering',
        date: '2026',
        title: {
          'pt-BR': 'Engenharia de Software — PUC Minas',
          en: 'Software Engineering — PUC Minas',
        },
        description: {
          'pt-BR':
            'Formação em andamento, com estudos em lógica de programação, desenvolvimento web, orientação a objetos, APIs e arquitetura de aplicações.',
          en:
            'Ongoing undergraduate studies focused on programming fundamentals, web development, object-oriented programming, APIs, and application architecture.',
        },
      },
    ],

    interests: [
      {
        'pt-BR': 'Desenvolvimento de sistemas e aplicações',
        en: 'Software and application development',
      },
      {
        'pt-BR': 'Automação e integração de serviços',
        en: 'Automation and service integration',
      },
      {
        'pt-BR': 'Inteligência artificial',
        en: 'Artificial intelligence',
      },
      {
        'pt-BR': 'Gerenciamento e modelagem de dados',
        en: 'Data management and modeling',
      },
    ],

    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/warlleyz',
      },
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/warlleysilvab/',
      },
    ],
  },

  // CURRÍCULO

  resume: {
    url: 'documents/curriculo-warlley.pdf',

    sections: [
      {
        id: 'education',
        title: {
          'pt-BR': 'Formação acadêmica',
          en: 'Education',
        },

        items: [
          {
            title: {
              'pt-BR': 'Bacharelado em Engenharia de Software',
              en: "Bachelor's Degree in Software Engineering",
            },
            description: {
              'pt-BR':
                'Pontifícia Universidade Católica de Minas Gerais (PUC Minas). Graduação em andamento.',
              en:
                'Pontifical Catholic University of Minas Gerais (PUC Minas). Undergraduate degree in progress.',
            },
            period: 'Em andamento',
          },
        ],
      },

      {
        id: 'technical-skills',
        title: {
          'pt-BR': 'Conhecimentos técnicos',
          en: 'Technical Skills',
        },

        items: [
          {
            title: {
              'pt-BR': 'Linguagens e desenvolvimento',
              en: 'Programming and Development',
            },
            description: {
              'pt-BR':
                'Java, JavaScript, Python, PHP, HTML, CSS, Programação Orientada a Objetos e desenvolvimento web.',
              en:
                'Java, JavaScript, Python, PHP, HTML, CSS, Object-Oriented Programming, and web development.',
            },
            period: '',
          },
          {
            title: {
              'pt-BR': 'Frameworks e integração',
              en: 'Frameworks and Integration',
            },
            description: {
              'pt-BR':
                'Spring Boot, APIs REST, Maven e integração entre aplicações.',
              en:
                'Spring Boot, REST APIs, Maven, and application integration.',
            },
            period: '',
          },
          {
            title: {
              'pt-BR': 'Ferramentas e dados',
              en: 'Tools and Data',
            },
            description: {
              'pt-BR':
                'Git, GitHub, Docker, Figma, modelagem de dados e fundamentos de banco de dados.',
              en:
                'Git, GitHub, Docker, Figma, data modeling, and database fundamentals.',
            },
            period: '',
          },
        ],
      },
    ],
  },

  // CERTIFICADOS

  certificates: [
    {
      id: 'power-bi-gestao-enap',

      title: {
        'pt-BR': 'Aplicação do Power BI para Aprimoramento da Gestão',
        en: 'Applying Power BI to Improve Management',
      },

      issuer: 'Escola Nacional de Administração Pública — ENAP',
      category: 'course',
      date: '2026-09-21',

      description: {
        'pt-BR':
          'Curso de 25 horas sobre obtenção e transformação de dados, modelagem, cálculos, visualização e publicação de relatórios com Power BI.',
        en:
          'A 25-hour course covering data acquisition and transformation, modeling, calculations, visualization, and report publishing with Power BI.',
      },

      url: 'certificates/courses/power-bi-gestao.pdf',
    },

    {
      id: 'github-copilot-dev-days',

      title: 'GitHub Copilot Dev Days na PUC Minas',

      issuer: 'PUC Minas — ICEI',
      category: 'achievement',
      date: '2026-05-12',

      description: {
        'pt-BR':
          'Participação de 2 horas em evento sobre desenvolvimento de software e inteligência artificial aplicada à programação.',
        en:
          'Participation in a two-hour event about software development and artificial intelligence applied to programming.',
      },

      url: 'certificates/events/github-copilot-dev-days.pdf',
    },

    {
      id: 'we-make-software-coreu-2026-01',

      title: 'We Make Software — COREU 2026/1',

      issuer: 'PUC Minas — Engenharia de Software',
      category: 'achievement',
      date: '2026-03-16',

      description: {
        'pt-BR':
          'Participação de 4 horas no evento We Make Software, promovido pela área de Engenharia de Software da PUC Minas.',
        en:
          'Participation in a four-hour We Make Software event organized by the Software Engineering department at PUC Minas.',
      },

      url: 'certificates/events/we-make-software-coreu-2026-01.pdf',
    },
  ],

  // PROJETOS E DEMONSTRAÇÕES

  // Repositórios carregados automaticamente pela API do GitHub.
  // Este array permanece disponível para futuras personalizações.
  projects: [],

  demoOrigins: [],

  // ARQUIVOS OFICIAIS

  officialFiles: [],

  // CONTATO E EMAILJS

  contact: {
    links: [
      {
        label: 'E-mail',
        url: 'mailto:warlleysilvax@gmail.com',
      },
      {
        label: 'GitHub',
        url: 'https://github.com/warlleyz',
      },
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/warlleysilvab/',
      },
      {
        label: 'WhatsApp',
        url: 'https://wa.me/5531997185483',
      },
      {
        label: 'Discord',
        url: 'https://discord.com/users/814927706184613928',
      },
    ],

    emailService: 'service_ss81zgq',
    emailTemplate: 'template_heie6oa',
    emailPublicKey: 'dR_srJZx9lh9_GOta',
  },
};

// LEITURA DE CONTEÚDO MULTILÍNGUE

export function contentText(value, locale = 'pt-BR') {
  if (typeof value === 'string') return value;

  if (!value || typeof value !== 'object') return '';

  return typeof value[locale] === 'string'
    ? value[locale]
    : typeof value['pt-BR'] === 'string'
      ? value['pt-BR']
      : '';
}

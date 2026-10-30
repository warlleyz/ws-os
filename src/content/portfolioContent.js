// Conteúdo público do portfólio WS OS.
// Não adicionar chaves privadas ou informações de visitantes.

export const portfolio = {
  githubUser: 'warlleyz',

  notesEndpoint: '/api/posts',
  wakatimeProxy: '/api/wakatime',

  /* === PERFIL PROFISSIONAL === */

  profile: {
    name: 'Warlley Silva',

    headline: {
      'pt-BR': 'Estudante de Engenharia de Software',
      en: 'Software Engineering Student',
    },

    summary: {
      'pt-BR':
        'Estudante de Engenharia de Software na PUC Minas, com foco em desenvolvimento de software, backend e integração de sistemas. Busco aplicar meus conhecimentos em projetos práticos e evoluir profissionalmente na área de tecnologia.',
      en: 'Software Engineering student at PUC Minas, focused on software development, backend development, and systems integration. I aim to apply my knowledge through practical projects and grow professionally in the technology field.',
    },

    education: {
      degree: {
        'pt-BR': 'Bacharelado em Engenharia de Software',
        en: "Bachelor's Degree in Software Engineering",
      },
      institution: 'Pontifícia Universidade Católica de Minas Gerais — PUC Minas',
      status: {
        'pt-BR': 'Graduação em andamento',
        en: 'Undergraduate degree in progress',
      },
      description: {
        'pt-BR':
          'Formação voltada ao desenvolvimento de software, programação, arquitetura de aplicações, banco de dados e integração de sistemas, com aplicação prática dos conhecimentos em projetos acadêmicos.',
        en: 'Education focused on software development, programming, application architecture, databases, and systems integration, with practical application of knowledge through academic projects.',
      },
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
          en: 'Ongoing undergraduate studies focused on programming fundamentals, web development, object-oriented programming, APIs, and application architecture.',
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
              en: 'Pontifical Catholic University of Minas Gerais (PUC Minas). Undergraduate degree in progress.',
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
              en: 'Java, JavaScript, Python, PHP, HTML, CSS, Object-Oriented Programming, and web development.',
            },
            period: '',
          },
          {
            title: {
              'pt-BR': 'Frameworks e integração',
              en: 'Frameworks and Integration',
            },
            description: {
              'pt-BR': 'Spring Boot, APIs REST, Maven e integração entre aplicações.',
              en: 'Spring Boot, REST APIs, Maven, and application integration.',
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
              en: 'Git, GitHub, Docker, Figma, data modeling, and database fundamentals.',
            },
            period: '',
          },
        ],
      },
    ],
  },

  /* === CERTIFICADOS === */

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

      workload: {
        'pt-BR': '25 horas',
        en: '25 hours',
      },

      subjects: [
        {
          'pt-BR': 'Obtenção e transformação de dados',
          en: 'Data acquisition and transformation',
        },
        {
          'pt-BR': 'Modelagem de dados',
          en: 'Data modeling',
        },
        {
          'pt-BR': 'Cálculos e medidas no Power BI',
          en: 'Calculations and measures in Power BI',
        },
        {
          'pt-BR': 'Visualização de dados e relatórios',
          en: 'Data visualization and reports',
        },
        {
          'pt-BR': 'Publicação de relatórios',
          en: 'Report publishing',
        },
      ],

      description: {
        'pt-BR':
          'Curso de 25 horas sobre obtenção e transformação de dados, modelagem, cálculos, visualização e publicação de relatórios com Power BI.',
        en: 'A 25-hour course covering data acquisition and transformation, modeling, calculations, visualization, and report publishing with Power BI.',
      },

      url: 'certificates/courses/power-bi-gestao.pdf',
    },

    {
      id: 'github-copilot-dev-days',

      title: 'GitHub Copilot Dev Days na PUC Minas',

      issuer: 'PUC Minas — ICEI',
      category: 'achievement',
      date: '2026-05-12',
      workload: {
        'pt-BR': '2 horas',
        en: '2 hours',
      },

      description: {
        'pt-BR':
          'Participação de 2 horas em evento sobre desenvolvimento de software e inteligência artificial aplicada à programação.',
        en: 'Participation in a two-hour event about software development and artificial intelligence applied to programming.',
      },

      url: 'certificates/events/github-copilot-dev-days.pdf',
    },

    {
      id: 'we-make-software-coreu-2026-01',

      title: 'We Make Software — COREU 2026/1',

      issuer: 'PUC Minas — Engenharia de Software',
      category: 'achievement',
      date: '2026-03-16',
      workload: {
        'pt-BR': '4 horas',
        en: '4 hours',
      },

      description: {
        'pt-BR':
          'Participação de 4 horas no evento We Make Software, promovido pela área de Engenharia de Software da PUC Minas.',
        en: 'Participation in a four-hour We Make Software event organized by the Software Engineering department at PUC Minas.',
      },

      url: 'certificates/events/we-make-software-coreu-2026-01.pdf',
    },

    /* ----- Cursos adicionais — outubro de 2026 ----- */

    {
      id: 'aprendendo-python-enap',
      title: {
        'pt-BR': 'Aprendendo com Python',
        en: 'Learning with Python',
      },
      issuer: 'Escola Nacional de Administração Pública — ENAP',
      category: 'course',
      date: '2026-10-26',
      workload: {
        'pt-BR': '20 horas',
        en: '20 hours',
      },
      description: {
        'pt-BR':
          'Curso sobre variáveis, operações, estruturas condicionais, funções, estruturas de dados, orientação a objetos e bibliotecas Python.',
        en: 'Course covering variables, operators, conditionals, functions, data structures, object-oriented programming, and Python libraries.',
      },
      url: 'certificates/courses/aprendendo-python-enap.pdf',
    },

    {
      id: 'java-completo-udemy',
      title: {
        'pt-BR': 'Java COMPLETO — Programação Orientada a Objetos + Projetos',
        en: 'Complete Java — Object-Oriented Programming + Projects',
      },
      issuer: 'Udemy — Nelio Alves',
      category: 'course',
      date: '2026-10-26',
      workload: {
        'pt-BR': '54 horas',
        en: '54 hours',
      },
      description: {
        'pt-BR':
          'Conclusão do curso Java COMPLETO, com foco em programação orientada a objetos e projetos.',
        en: 'Completed the Complete Java course, focused on object-oriented programming and projects.',
      },
      url: 'certificates/courses/java-completo-udemy.pdf',
    },

    {
      id: 'fundamentos-engenharia-dados-dsa',
      title: {
        'pt-BR': 'Fundamentos de Engenharia de Dados',
        en: 'Data Engineering Fundamentals',
      },
      issuer: 'Data Science Academy',
      category: 'course',
      date: '2026-10-27',
      workload: {
        'pt-BR': '24 horas',
        en: '24 hours',
      },
      description: {
        'pt-BR':
          'Formação introdutória em fundamentos de Engenharia de Dados, concluída com 100% de aproveitamento.',
        en: 'Introductory training in Data Engineering fundamentals, completed with a 100% final score.',
      },
      url: 'certificates/courses/fundamentos-engenharia-dados-dsa.pdf',
    },

    {
      id: 'eixo-1-analise-consulta-dados-enap',
      title: {
        'pt-BR': 'Eixo 1 — Análise e Consulta de Dados',
        en: 'Track 1 — Data Analysis and Querying',
      },
      issuer: 'ENAP — Engenharia de Dados e IA Aplicada para Gestores de TIC',
      category: 'course',
      date: '2026-10-28',
      workload: {
        'pt-BR': '44 horas',
        en: '44 hours',
      },
      description: {
        'pt-BR':
          'Certificação do primeiro eixo do programa Engenharia de Dados e IA Aplicada para Gestores de TIC.',
        en: 'Certification for the first track of the Data Engineering and Applied AI for IT Managers program.',
      },
      url: 'certificates/courses/eixo-1-analise-consulta-dados-enap.pdf',
    },

    {
      id: 'eixo-2-ciencia-dados-enap',
      title: {
        'pt-BR': 'Eixo 2 — Fundamentos de Ciência de Dados',
        en: 'Track 2 — Data Science Fundamentals',
      },
      issuer: 'ENAP — Engenharia de Dados e IA Aplicada para Gestores de TIC',
      category: 'course',
      date: '2026-10-26',
      workload: {
        'pt-BR': '4 horas',
        en: '4 hours',
      },
      description: {
        'pt-BR':
          'Certificação do segundo eixo do programa, dedicado aos fundamentos de Ciência de Dados.',
        en: 'Certification for the second program track, focused on Data Science fundamentals.',
      },
      url: 'certificates/courses/eixo-2-ciencia-dados-enap.pdf',
    },

    {
      id: 'eixo-3-engenharia-dados-enap',
      title: {
        'pt-BR': 'Eixo 3 — Engenharia de Dados',
        en: 'Track 3 — Data Engineering',
      },
      issuer: 'ENAP — Engenharia de Dados e IA Aplicada para Gestores de TIC',
      category: 'course',
      date: '2026-10-27',
      workload: {
        'pt-BR': '24 horas',
        en: '24 hours',
      },
      description: {
        'pt-BR': 'Certificação do terceiro eixo do programa, dedicado à Engenharia de Dados.',
        en: 'Certification for the third program track, focused on Data Engineering.',
      },
      url: 'certificates/courses/eixo-3-engenharia-dados-enap.pdf',
    },

    {
      id: 'introducao-ciencia-dados-enap',
      title: {
        'pt-BR': 'Introdução à Ciência de Dados — Conceitos e Ferramentas',
        en: 'Introduction to Data Science — Concepts and Tools',
      },
      issuer: 'Escola Nacional de Administração Pública — ENAP',
      category: 'course',
      date: '2026-10-26',
      workload: {
        'pt-BR': '4 horas',
        en: '4 hours',
      },
      description: {
        'pt-BR':
          'Introdução à Ciência de Dados, mineração de dados, preparação de dados, ferramentas analíticas e KNIME.',
        en: 'Introduction to Data Science, data mining, data preparation, analytical tools, and KNIME.',
      },
      url: 'certificates/courses/introducao-ciencia-dados-enap.pdf',
    },

    {
      id: 'sql-fgv',
      title: 'SQL — Structured Query Language',
      issuer: 'Fundação Getulio Vargas — FGV Online',
      category: 'course',
      date: '2026-10-25',
      workload: {
        'pt-BR': '24 horas',
        en: '24 hours',
      },
      description: {
        'pt-BR':
          'Declaração de participação no curso autoinstrucional SQL — Structured Query Language, nível de atualização.',
        en: 'Statement of participation in the self-paced SQL — Structured Query Language continuing education course.',
      },
      url: 'certificates/courses/sql-fgv.pdf',
    },
  ],

  /* === PROJETOS === */

  // Repositórios carregados automaticamente pela API do GitHub.
  // Este array permanece disponível para futuras personalizações.
  projects: [],

  /* === ARQUIVOS OFICIAIS === */

  officialFiles: [],

  /* === CONTATO E EMAILJS === */

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

/* === LEITURA DE CONTEÚDO MULTILÍNGUE === */

export function contentText(value, locale = 'pt-BR') {
  if (typeof value === 'string') return value;

  if (!value || typeof value !== 'object') return '';

  return typeof value[locale] === 'string'
    ? value[locale]
    : typeof value['pt-BR'] === 'string'
      ? value['pt-BR']
      : '';
}

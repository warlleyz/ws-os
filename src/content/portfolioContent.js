// Conteúdo público editável. Use strings ou { 'pt-BR': '...', en: '...' } nos textos.
// Nunca coloque chaves privadas ou dados de visitantes neste arquivo.
export const portfolio = {
  githubUser: 'warlleyz',
  notesEndpoint: '', // /api/posts quando o backend estiver configurado.
  posts: [], // Apenas publicações públicas: { id, title, summary, body, tags: [], status: 'published', publishedAt: ISO }. Nunca rascunhos privados.
  wakatimeProxy: '', // Endpoint próprio protegido, ex.: /api/wakatime. Não é uma chave de API.


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
    ],
  },

  resume: { url: 'curriculo.pdf', sections: [] }, // { id, title, items: [{ title, description, period }] }
  certificates: [], // { id, title, issuer, category: course|certification|achievement, date, description, url }
  projects: [], // { id, name, description, technologies: [], status, repository, image, demos: [{ id, title, mode: external|embedded|hosted|simulated, url }] }
  demoOrigins: [], // Origens HTTPS autorizadas a embed. URLs externas continuam disponíveis sem embed.
  officialFiles: [], // { id, name, url, description }. Somente leitura; caminhos públicos do próprio site.
  contact: { links: [], emailService: '', emailTemplate: '', emailPublicKey: '' },
};

export function contentText(value, locale = 'pt-BR') {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return typeof value[locale] === 'string'
    ? value[locale]
    : typeof value['pt-BR'] === 'string'
      ? value['pt-BR']
      : '';
}

// Conteúdo público editável. Use strings ou { 'pt-BR': '...', en: '...' } nos textos.
// Nunca coloque chaves privadas ou dados de visitantes neste arquivo.
export const portfolio = {
  githubUser: 'warlleyz',
  notesEndpoint: '', // /api/posts quando o backend estiver configurado.
  posts: [], // Apenas publicações públicas: { id, title, summary, body, tags: [], status: 'published', publishedAt: ISO }. Nunca rascunhos privados.
  wakatimeProxy: '', // Endpoint próprio protegido, ex.: /api/wakatime. Não é uma chave de API.
  profile: {
    name: '',
    headline: 'Desenvolvedor de software',
    summary:
      'Conheça minha trajetória, meus projetos e as tecnologias que utilizo no desenvolvimento de soluções digitais.',
    areas: ['Desenvolvimento web', 'Interfaces interativas', 'Arquitetura de aplicações'],
    timeline: [], // { id, date, title, description }
    interests: [],
    links: [{ label: 'GitHub', url: 'https://github.com/warlleyz' }],
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

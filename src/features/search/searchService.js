/* === NORMALIZAÇÃO DA BUSCA === */
export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/* === RELEVÂNCIA DA BUSCA === */
/* ----- Classificação dos resultados ----- */
function searchRelevance(term, label, description) {
  const title = normalizeSearch(label).trim();
  const details = normalizeSearch(description);

  if (title === term) return 4;
  if (title.startsWith(term)) return 3;
  if (title.includes(term)) return 2;
  if (details.includes(term)) return 1;

  return 0;
}

/* ----- Identificação de projetos equivalentes ----- */
function projectIdentity(item) {
  if (typeof item.repository !== 'string') return null;

  try {
    const url = new URL(item.repository);

    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
      return null;
    }

    const parts = url.pathname
      .replace(/\/+$/, '')
      .replace(/\.git$/i, '')
      .split('/')
      .filter(Boolean);

    if (parts.length === 2) {
      return `${parts[0]}/${parts[1]}`.toLowerCase();
    }
  } catch {
    return null;
  }

  return null;
}

/* === BUSCA GLOBAL === */
export function searchContent(
  query,
  {
    portfolio,
    projects = [],
    posts = [],
    locale = 'pt-BR',
    text = (value) =>
      typeof value === 'string' ? value : (value?.[locale] ?? value?.['pt-BR'] ?? ''),
    translate = (value) => value,
  },
) {
  const term = normalizeSearch(query.trim());
  if (term.length < 2) return [];

  const results = [];

  /* ----- Inclusão dos resultados ----- */
  function add(kind, id, label, description, appId, params = {}) {
    const relevance = searchRelevance(term, label, description);

    if (relevance === 0) return;

    results.push({
      key: `${kind}:${id}`,
      kind,
      label,
      description,
      appId,
      params,
      relevance,
    });
  }

  /* ----- Consolidação dos projetos ----- */
  const uniqueProjects = new Map();
  const repositoryKeys = new Set();

  for (const item of [...(portfolio.projects ?? []), ...projects]) {
    const repository = projectIdentity(item);

    if (repository && repositoryKeys.has(repository)) continue;

    const key = repository
      ? `repository:${repository}`
      : `project:${item.id}`;

    if (uniqueProjects.has(key)) continue;

    uniqueProjects.set(key, item);

    if (repository) repositoryKeys.add(repository);
  }

  /* ----- Pesquisa de projetos ----- */
  for (const item of uniqueProjects.values()) {
    add(
      'project',
      item.id,
      text(item.name),
      `${text(item.description)} ${(item.technologies ?? []).join(' ')}`,
      'projects',
      { projectId: item.id },
    );
  }

  /* ----- Pesquisa de notas ----- */
  for (const item of posts) {
    add(
      'post',
      item.id,
      text(item.title),
      text(item.summary) + ' ' + (item.tags ?? []).join(' '),
      'notes',
      { postId: item.id },
    );
  }

  /* ----- Pesquisa de certificados ----- */
  for (const item of portfolio.certificates) {
    add(
      'certificate',
      item.id,
      text(item.title),
      text(item.issuer),
      'certificates',
      { certificateId: item.id },
    );
  }

  /* ----- Pesquisa do perfil profissional ----- */
  const profile = portfolio.profile;

  add(
    'profile',
    'profile',
    translate('Sobre Mim'),
    [
      text(profile.name),
      text(profile.summary),
      ...(profile.areas ?? []).map(text),
      'sobre mim about me perfil profile',
      'engenharia de software software engineering',
      'desenvolvimento development',
      'formacao formação education',
      'habilidades skills tecnologias technologies',
    ].join(' '),
    'about-me',
  );

  /* ----- Configurações e termos bilíngues ----- */
  for (const [section, label, terms] of [
    [
      'appearance',
      'Aparência',
      'aparencia appearance tema theme temas themes cor cores color colors ' +
      'wallpaper papel de parede background fundo blur desfoque ' +
      'transparencia transparency brilho brightness',
    ],
    [
      'language',
      'Idioma',
      'idioma idiomas language languages portugues português ' +
      'portuguese ingles inglês english traducao tradução translation',
    ],
    [
      'accessibility',
      'Acessibilidade',
      'acessibilidade accessibility contraste contrast ' +
      'animacao animação animations motion movimento ' +
      'reduced motion movimento reduzido',
    ],
    [
      'widgets',
      'Widgets',
      'widget widgets relogio relógio clock calendario calendário ' +
      'calendar clima weather previsao previsão tempo',
    ],
    [
      'desktop',
      'Área de Trabalho',
      'area área de trabalho desktop workspace ' +
      'taskbar barra de tarefas atalhos shortcuts icones ícones',
    ],
    [
      'mobile',
      'Mobile',
      'mobile celular smartphone telefone phone tablet ' +
      'tela screen toque touch',
    ],
  ]) {
    add('setting', section, translate(label), terms, 'settings', { section });
  }

  /* ----- Ordenação e limite dos resultados ----- */
  return [...new Map(results.map((result) => [result.key, result])).values()]
    .sort(
      (first, second) =>
        second.relevance - first.relevance ||
        first.label.localeCompare(second.label, locale),
    )
    .slice(0, 24)
    .map(({ key, kind, label, description, appId, params }) => ({
      key,
      kind,
      label,
      description,
      appId,
      params,
    }));
}

/* === LINKS COMPARTILHÁVEIS === */
/* ----- Resolução dos destinos públicos ----- */
export function resolveSharedEntry(search) {
  const params = new URLSearchParams(search);

  const destinations = [
    ['project', 'projects', 'projectId'],
    ['post', 'notes', 'postId'],
    ['certificate', 'certificates', 'certificateId'],
  ];

  /* ----- Validação do destino ----- */
  const present = destinations.filter(([key]) => params.has(key));

  if (present.length !== 1) return null;

  const [key, appId, param] = present[0];
  const values = params.getAll(key);

  if (values.length !== 1) return null;

  const id = values[0];

  if (!/^[a-z\d_-]{1,80}$/i.test(id)) return null;

  return {
    appId,
    params: {
      [param]: id,
    },
    origin: 'shared-link',
  };
}
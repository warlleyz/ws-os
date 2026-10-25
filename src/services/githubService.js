import { requestPublicJson } from './publicDataService';
import { safeExternalUrl } from '../shared/utils/urls';

/* === Normalização de repositórios públicos === */
/* ----- Preservar dados reais, sem inventar indicadores ----- */
export function normalizeRepository(item) {
  if (!Number.isSafeInteger(item?.id) || typeof item.name !== 'string' || item.private === true)
    return null;

  const repository = safeExternalUrl(item.html_url);
  if (!repository || new URL(repository).hostname !== 'github.com') return null;

  return {
    id: `github-${item.id}`,
    name: item.name,
    description: typeof item.description === 'string' ? item.description : '',
    language: typeof item.language === 'string' ? item.language : null,
    technologies: typeof item.language === 'string' ? [item.language] : [],
    repository,
    homepage: safeExternalUrl(item.homepage),
    stars: Number.isFinite(item.stargazers_count) ? Math.max(0, item.stargazers_count) : null,
    forks: Number.isFinite(item.forks_count) ? Math.max(0, item.forks_count) : null,
    createdAt: typeof item.created_at === 'string' ? item.created_at : null,
    updatedAt: typeof item.pushed_at === 'string' ? item.pushed_at : null,
    license: typeof item.license?.spdx_id === 'string' && item.license.spdx_id !== 'NOASSERTION'
      ? item.license.spdx_id
      : null,
    visibility: typeof item.visibility === 'string' ? item.visibility : 'public',
    archived: item.archived === true,
    fork: item.fork === true,
    status: item.archived ? 'Arquivado' : 'Público',
    source: 'GitHub',
  };
}

/* === Consulta de repositórios GitHub === */
/* ----- Paginação e proveniência dos dados ----- */
export async function fetchGithubPortfolio(username, options = {}) {
  if (typeof username !== 'string' || !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username))
    throw new Error('Usuário GitHub inválido.');

  const base = `https://api.github.com/users/${encodeURIComponent(username)}`;
  const [profile, first] = await Promise.all([
    requestPublicJson(base, { category: 'projects', ...options }),
    requestPublicJson(`${base}/repos?per_page=100&sort=pushed&page=1`, {
      category: 'projects',
      ...options,
    }),
  ]);

  if (typeof profile.data?.login !== 'string' || !Array.isArray(first.data))
    throw new Error('Resposta do serviço inválida.');

  let raw = first.data;
  const pages = [profile, first];

  for (let page = 2; pages.at(-1).data.length === 100 && page <= 10; page += 1) {
    const response = await requestPublicJson(
      `${base}/repos?per_page=100&sort=pushed&page=${page}`,
      { category: 'projects', ...options },
    );

    if (!Array.isArray(response.data)) throw new Error('Resposta do serviço inválida.');
    raw = raw.concat(response.data);
    pages.push(response);
  }

  return {
    data: {
      profile: {
        login: profile.data.login,
        followers: Math.max(0, Number(profile.data.followers) || 0),
        url: safeExternalUrl(profile.data.html_url),
      },
      repositories: raw.map(normalizeRepository).filter(Boolean),
      complete: pages.at(-1).data.length < 100,
    },
    source: pages.some((page) => page.source === 'cache') ? 'cache' : 'live',
    updatedAt: Math.min(...pages.map((page) => page.updatedAt)),
    warning: pages.find((page) => page.warning)?.warning,
  };
}

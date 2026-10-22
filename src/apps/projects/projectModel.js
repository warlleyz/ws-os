import { safeExternalUrl } from '../../shared/utils/urls';
import { resolveSharedEntry } from '../../features/search/searchService';
export function mergeProjects(curated, repositories) {
  const remaining = new Map(repositories.map((item) => [item.repository, item]));
  const items = curated
    .filter((item) => typeof item.id === 'string' && item.id && item.name)
    .map((item) => {
      const repository = safeExternalUrl(item.repository);
      const remote = remaining.get(repository);
      remaining.delete(repository);
      return {
        ...remote,
        ...item,
        repository,
        technologies: Array.isArray(item.technologies)
          ? item.technologies
          : (remote?.technologies ?? []),
        demos: Array.isArray(item.demos) ? item.demos : [],
        source: 'Portfólio',
      };
    });
  return [...items, ...remaining.values()];
}
export function filterProjects(projects, search, technology, order, locale, text) {
  const normalize = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return projects
    .filter(
      (item) =>
        (technology === 'all' || item.technologies.includes(technology)) &&
        normalize(
          [text(item.name, locale), text(item.description, locale), ...item.technologies].join(' '),
        ).includes(normalize(search.trim())),
    )
    .sort(
      order === 'name'
        ? (a, b) => text(a.name, locale).localeCompare(text(b.name, locale), locale)
        : (a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0),
    );
}

/* === Compartilhamento público de projetos === */
/* ----- Mesmo formato de entrada utilizado pelo Core, preservando BASE_URL ----- */
export function createProjectShareUrl(projectId, baseUrl) {
  if (typeof projectId !== 'string' || typeof baseUrl !== 'string') return null;
  try {
    const url = new URL(baseUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    url.search = '';
    url.hash = '';
    url.searchParams.set('project', projectId);
    const entry = resolveSharedEntry(url.search);
    return entry?.appId === 'projects' && entry.params.projectId === projectId ? url.href : null;
  } catch {
    return null;
  }
}

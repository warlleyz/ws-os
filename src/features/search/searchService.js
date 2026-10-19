export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
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
  function add(kind, id, label, description, appId, params = {}) {
    if (normalizeSearch(label + ' ' + description).includes(term))
      results.push({ key: kind + ':' + id, kind, label, description, appId, params });
  }
  for (const item of [...portfolio.projects, ...projects])
    add(
      'project',
      item.id,
      text(item.name),
      text(item.description) + ' ' + (item.technologies ?? []).join(' '),
      'projects',
      { projectId: item.id },
    );
  for (const item of posts)
    add(
      'post',
      item.id,
      text(item.title),
      text(item.summary) + ' ' + (item.tags ?? []).join(' '),
      'notes',
      { postId: item.id },
    );
  for (const item of portfolio.certificates)
    add('certificate', item.id, text(item.title), text(item.issuer), 'certificates');
  const profile = portfolio.profile;
  add(
    'profile',
    'profile',
    translate('Sobre Mim'),
    text(profile.name) + ' ' + text(profile.summary) + ' ' + profile.areas.map(text).join(' '),
    'about-me',
  );
  for (const [section, label, terms] of [
    ['appearance', 'Aparência', 'theme tema cores blur wallpaper'],
    ['language', 'Idioma', 'language english português'],
    ['accessibility', 'Acessibilidade', 'motion animações contraste'],
    ['widgets', 'Widgets', 'relógio clima calendário'],
    ['desktop', 'Área de Trabalho', 'taskbar atalhos'],
    ['mobile', 'Mobile', 'celular tablet'],
  ])
    add('setting', section, translate(label), terms, 'settings', { section });
  return [...new Map(results.map((result) => [result.key, result])).values()].slice(0, 24);
}
export function resolveSharedEntry(search) {
  const params = new URLSearchParams(search);
  for (const [key, appId, param] of [
    ['project', 'projects', 'projectId'],
    ['post', 'notes', 'postId'],
  ]) {
    const id = params.get(key);
    if (id && /^[a-z\d_-]{1,80}$/i.test(id))
      return { appId, params: { [param]: id }, origin: 'shared-link' };
  }
  return null;
}

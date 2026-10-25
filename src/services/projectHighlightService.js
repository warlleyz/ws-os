import { requestPublicJson } from './publicDataService';
import { validRepositoryIds } from '../shared/utils/contractValidation';

/* === Seleção pública de projetos destacados === */
export async function fetchProjectHighlights(options = {}) {
  const response = await requestPublicJson('/api/project-highlights', {
    ...options,
    category: 'projects',
  });
  if (!validRepositoryIds(response.data?.repositoryIds))
    throw new Error('Resposta inválida dos projetos destacados.');
  return { ...response, data: { repositoryIds: response.data.repositoryIds } };
}

/* ----- Preservar metadados do GitHub e alterar somente a indicação de destaque ----- */
export function applyProjectHighlights(projects, repositoryIds) {
  const selected = new Set(validRepositoryIds(repositoryIds) ? repositoryIds : []);
  return projects.map((item) => ({ ...item, featured: selected.has(item.id) }));
}

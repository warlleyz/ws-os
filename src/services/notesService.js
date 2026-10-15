import { portfolio, contentText } from '../content/portfolioContent';
import { requestPublicJson } from './publicDataService';

export function normalizeNotes(items, now = Date.now()) {
  if (!Array.isArray(items)) throw new Error('Resposta de publicações inválida.');
  const ids = new Set();
  return items
    .slice(0, 200)
    .filter((item) => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !/^[a-z\d_-]{1,80}$/i.test(item.id) ||
        ids.has(item.id)
      )
        return false;
      if (
        item.status !== 'published' ||
        !Number.isFinite(Date.parse(item.publishedAt)) ||
        Date.parse(item.publishedAt) > now
      )
        return false;
      if (!contentText(item.title) || !contentText(item.body)) return false;
      ids.add(item.id);
      return true;
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      body: item.body,
      publishedAt: item.publishedAt,
      tags: Array.isArray(item.tags)
        ? item.tags.filter((tag) => typeof tag === 'string').slice(0, 12)
        : [],
    }))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function fetchNotes(options = {}) {
  if (!portfolio.notesEndpoint)
    return { data: normalizeNotes(portfolio.posts ?? []), source: 'local', updatedAt: Date.now() };
  if (!/^\/api\/[a-z\d/_-]+$/i.test(portfolio.notesEndpoint))
    throw new Error('Endpoint de publicações inválido.');
  const result = await requestPublicJson(portfolio.notesEndpoint, options);
  return { ...result, data: normalizeNotes(result.data?.posts) };
}

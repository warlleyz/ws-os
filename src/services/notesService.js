import { portfolio, contentText } from '../content/portfolioContent';
import { requestPublicJson } from './publicDataService';

export function normalizeNotes(items, now = Date.now()) {
  if (!Array.isArray(items)) throw new Error('Resposta de publicações inválida.');
  const ids = new Set();
  return items
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
  const posts = [];
  let offset = 0;
  let result;
  let updatedAt = Infinity;
  let source = 'live';
  let warning;
  do {
    result = await requestPublicJson(
      portfolio.notesEndpoint + (offset ? '?offset=' + offset : ''),
      { category: 'content', ...options },
    );
    if (!Array.isArray(result.data?.posts)) throw new Error('Resposta de publicações inválida.');
    posts.push(...result.data.posts);
    updatedAt = Math.min(updatedAt, result.updatedAt ?? Infinity);
    if (result.source === 'cache') source = 'cache';
    warning ??= result.warning;
    const next = result.data.nextOffset;
    if (next == null) break;
    if (!Number.isSafeInteger(next) || next <= offset || next > 1000000)
      throw new Error('Paginação de publicações inválida.');
    offset = next;
  } while (result.data.nextOffset != null);
  return {
    ...result,
    source,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : result.updatedAt,
    warning,
    data: normalizeNotes(posts),
  };
}

import { requireAdministrator } from './auth.js';

const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
const validId = (value) => typeof value === 'string' && /^[a-z\d_-]{1,80}$/i.test(value);
export function validateManagedContent(kind, input) {
  if (!['events', 'files'].includes(kind) || !input || typeof input !== 'object')
    throw Error('INVALID_CONTENT');
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (!title || title.length > 160 || description.length > 2000) throw Error('INVALID_CONTENT');
  const data = { title, description };
  if (kind === 'events') {
    const date = input.date;
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      throw Error('INVALID_DATE');
    data.date = date;
  }
  const url = input.url || '';
  if (typeof url !== 'string' || url.length > 2048) throw Error('INVALID_URL');
  if (kind === 'files') {
    // O catálogo publica somente artefatos estáticos versionados, nunca APIs ou arquivos privados.
    if (
      !/^(?:documents|certificates)\/[a-z\d/_-]+\.(?:pdf|png|jpg|jpeg|webp|gif|txt|md|json|csv)$/i.test(
        url,
      )
    )
      throw Error('INVALID_URL');
  } else if (url) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
      throw Error('INVALID_URL');
  }
  data.url = url;
  return data;
}

export async function onRequest({ request, env }) {
  const path = new URL(request.url).pathname;
  const publicRead = path === '/api/content';
  if (!publicRead) {
    const access = await requireAdministrator(request, env);
    if (!access.authorized) return access.response;
  }
  if (
    !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
    !env.SUPABASE_ANON_KEY
  )
    return json({ error: 'CONTENT_NOT_CONFIGURED' }, 503);
  const query = new URL(request.url).searchParams;
  const kind = query.get('kind');
  if (!['events', 'files'].includes(kind)) return json({ error: 'INVALID_KIND' }, 400);
  if (
    (publicRead && request.method !== 'GET') ||
    !['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)
  )
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const url = new URL('/rest/v1/managed_content', env.SUPABASE_URL);
  url.searchParams.set('kind', `eq.${kind}`);
  const headers = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: publicRead
      ? `Bearer ${env.SUPABASE_ANON_KEY}`
      : request.headers.get('authorization'),
  };
  let body;
  if (request.method === 'GET') {
    url.searchParams.set('select', 'id,kind,data,status,updated_at');
    url.searchParams.set('limit', '200');
    url.searchParams.set('order', 'updated_at.desc');
    if (publicRead) url.searchParams.set('status', 'eq.published');
  } else {
    try {
      const reader = request.body?.getReader();
      if (!reader) throw Error('INVALID_BODY');
      let size = 0,
        chunks = [];
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 8192) throw Error('BODY_TOO_LARGE');
          chunks.push(value);
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!validId(input.id)) throw Error('INVALID_ID');
      if (request.method !== 'POST') {
        if (typeof input.updatedAt !== 'string' || !Number.isFinite(Date.parse(input.updatedAt)))
          throw Error('REVISION_REQUIRED');
        url.searchParams.set('id', `eq.${input.id}`);
        url.searchParams.set('updated_at', `eq.${input.updatedAt}`);
      }
      if (request.method !== 'DELETE') {
        if (!['draft', 'published'].includes(input.status)) throw Error('INVALID_STATUS');
        body = JSON.stringify({
          ...(request.method === 'POST' ? { id: input.id, kind } : {}),
          data: validateManagedContent(kind, input.data),
          status: input.status,
        });
      }
      headers.Prefer = 'return=representation';
      headers['Content-Type'] = 'application/json';
    } catch {
      return json({ error: 'INVALID_CONTENT' }, 400);
    }
  }
  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return json(
        { error: response.status === 409 ? 'CONTENT_CONFLICT' : 'CONTENT_UNAVAILABLE' },
        response.status === 409 ? 409 : 502,
      );
    const rows = await response.json();
    if (!Array.isArray(rows)) return json({ error: 'INVALID_RESPONSE' }, 502);
    if (request.method !== 'GET' && rows.length !== 1)
      return json({ error: 'CONTENT_CONFLICT' }, 409);
    // Nunca devolver colunas extras, mesmo se a consulta upstream mudar.
    return json({
      items: rows
        .filter((row) => !publicRead || row.status === 'published')
        .map((row) => ({
          id: row.id,
          data: row.data,
          status: row.status,
          updatedAt: row.updated_at,
        })),
    });
  } catch {
    return json({ error: 'CONTENT_UNAVAILABLE' }, 502);
  }
}

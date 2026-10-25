import { requireAdministrator } from './auth.js';
import { validRepositoryIds } from '../../src/shared/utils/contractValidation.js';

/* === Destaques persistidos no Supabase === */
const MAX_BODY_BYTES = 16000;
const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

export async function onRequest({ request, env }) {
  const pathname = new URL(request.url).pathname;
  const admin = pathname === '/api/admin/project-highlights';
  if (
    (!admin && pathname !== '/api/project-highlights') ||
    !['GET', 'PUT'].includes(request.method) ||
    (!admin && request.method !== 'GET')
  )
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  if (admin) {
    const access = await requireAdministrator(request, env);
    if (!access.authorized) return access.response;
  }
  if (
    !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
    !env.SUPABASE_ANON_KEY
  )
    return json({ error: 'PROJECT_HIGHLIGHTS_NOT_CONFIGURED' }, 503);
  const url = new URL('/rest/v1/project_highlights', env.SUPABASE_URL);
  const headers = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: admin ? request.headers.get('authorization') : `Bearer ${env.SUPABASE_ANON_KEY}`,
  };
  try {
    if (request.method === 'GET') {
      /* ----- Consultar somente os identificadores, sem depender de outras colunas ----- */
      url.searchParams.set('select', 'repository_ids');
      url.searchParams.set('id', 'eq.default');
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        const details = await response.text();
        console.error('[ProjectHighlights] Falha na consulta ao Supabase', {
          status: response.status,
          details,
          resource: 'project_highlights',
        });
        return json({ error: 'HIGHLIGHTS_UNAVAILABLE' }, 502);
      }
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length > 1) return json({ error: 'INVALID_RESPONSE' }, 502);
      const repositoryIds = rows.length ? rows[0]?.repository_ids : [];
      return validRepositoryIds(repositoryIds)
        ? json({ repositoryIds })
        : json({ error: 'INVALID_RESPONSE' }, 502);
    }

    /* ----- Limitar o corpo durante a leitura antes de interpretar JSON ----- */
    const reader = request.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY_BYTES) {
          await reader.cancel();
          return json({ error: 'BODY_TOO_LARGE' }, 413);
        }
        chunks.push(value);
      }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let input;
    try {
      input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
      return json({ error: 'INVALID_HIGHLIGHTS' }, 400);
    }
    if (
      !input ||
      typeof input !== 'object' ||
      Object.keys(input).length !== 1 ||
      !validRepositoryIds(input.repositoryIds)
    )
      return json({ error: 'INVALID_HIGHLIGHTS' }, 400);
    url.searchParams.set('on_conflict', 'id');
    url.searchParams.set('select', 'id,repository_ids');
    headers['Content-Type'] = 'application/json';
    headers.Prefer = 'resolution=merge-duplicates,return=representation';
    /* ----- Atualizar apenas a seleção; preservar quaisquer dados históricos no banco ----- */
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: 'default', repository_ids: input.repositoryIds }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return json(
        { error: response.status === 409 ? 'HIGHLIGHTS_CONFLICT' : 'HIGHLIGHTS_UNAVAILABLE' },
        response.status === 409 ? 409 : 502,
      );
    const rows = await response.json();
    if (
      !Array.isArray(rows) ||
      rows.length !== 1 ||
      rows[0]?.id !== 'default' ||
      !validRepositoryIds(rows[0].repository_ids)
    )
      return json({ error: 'INVALID_RESPONSE' }, 502);
    return json({ repositoryIds: rows[0].repository_ids });
  } catch {
    return json({ error: 'HIGHLIGHTS_UNAVAILABLE' }, 502);
  }
}

// Somente leitura com chave anon/legacy JWT e RLS; nunca service_role.
export async function onRequestGet({ env, request }) {
  const json = (body, status = 200) =>
    Response.json(body, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  if (
    !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
    !env.SUPABASE_ANON_KEY
  )
    return json({ error: 'Publicações ainda não configuradas.' }, 503);
  try {
    const offset = Number(
      new URL(request?.url ?? 'https://ws.local/api/posts').searchParams.get('offset') ?? 0,
    );
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000)
      return json({ error: 'Paginação inválida.' }, 400);
    const url = new URL('/rest/v1/posts', env.SUPABASE_URL);
    url.search = new URLSearchParams({
      select: 'id,title,summary,body,tags,published_at',
      status: 'eq.published',
      published_at: `lte.${new Date().toISOString()}`,
      order: 'published_at.desc,id.asc',
      limit: '201',
      offset: String(offset),
    });
    const response = await fetch(url, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return json({ error: 'Publicações temporariamente indisponíveis.' }, 502);
    const rows = await response.json();
    if (!Array.isArray(rows)) return json({ error: 'Resposta do serviço inválida.' }, 502);
    return json({
      nextOffset: rows.length > 200 ? offset + 200 : null,
      posts: rows.slice(0, 200).map((row) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        body: row.body,
        tags: row.tags,
        publishedAt: row.published_at,
        status: 'published',
      })),
    });
  } catch {
    return json({ error: 'Publicações temporariamente indisponíveis.' }, 502);
  }
}

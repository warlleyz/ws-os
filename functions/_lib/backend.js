/* === Infraestrutura protegida dos serviços de domínio === */
export const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
export function configured(env, service = false) {
  return (
    /^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') &&
    Boolean(service ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY)
  );
}
export async function database(env, path, { method = 'GET', body, token, service = false } = {}) {
  if (!configured(env, service)) throw Error('SERVICE_UNAVAILABLE');
  const key = service ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  const response = await fetch(new URL('/rest/v1/' + path, env.SUPABASE_URL), {
    method,
    headers: {
      apikey: key,
      Authorization: token ?? `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error(response.status === 409 ? 'CONFLICT' : 'SERVICE_UNAVAILABLE');
  const value = await response.json();
  return value;
}
export function domainFailure(error) {
  const code = typeof error?.message === 'string' ? error.message : 'SERVICE_UNAVAILABLE';
  const status =
    code === 'CONFLICT'
      ? 409
      : code === 'NOT_FOUND'
        ? 404
        : code === 'ACCESS_DENIED'
          ? 403
          : code === 'RATE_LIMITED'
            ? 429
            : code === 'BODY_TOO_LARGE'
              ? 413
              : code.startsWith('INVALID_')
                ? 400
                : code.startsWith('VERIFICATION_')
                  ? 403
                  : 503;
  return json({ error: status === 503 ? 'SERVICE_UNAVAILABLE' : code }, status);
}
export function single(rows, id) {
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.id !== id) throw Error('CONFLICT');
  return rows[0];
}

/* === Paginação administrativa limitada e validada === */
export function pageOffset(request) {
  const raw = new URL(request.url).searchParams.get('offset') ?? '0';
  if (!/^\d{1,7}$/.test(raw) || Number(raw) > 1000000) throw Error('INVALID_OFFSET');
  return Number(raw);
}

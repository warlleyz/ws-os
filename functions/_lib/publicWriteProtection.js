/* === LEITURA LIMITADA DE JSON === */
/* ----- VALIDAR MIME E LIBERAR O LEITOR EM SUCESSO OU FALHA ----- */
export async function readBoundedJson(request, limit = 8192) {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw Error('INVALID_CONTENT_TYPE');
  const reader = request.body?.getReader();
  if (!reader) throw Error('INVALID_BODY');
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw Error('BODY_TOO_LARGE');
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
  try {
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('INVALID_BODY');
    return value;
  } catch {
    throw Error('INVALID_BODY');
  }
}
/* === PROTEÇÃO DAS ESCRITAS PÚBLICAS === */
/* ----- IDENTIDADE PROTEGIDA, LIMITE ATÔMICO E DESAFIO VINCULADO À ORIGEM ----- */
export async function protectPublicWrite(request, env, token, scope) {
  if (!env.WALLY_LIMITS_DB || !env.PUBLIC_WRITE_HASH_SALT || !env.TURNSTILE_SECRET_KEY)
    throw Error('PROTECTION_UNAVAILABLE');
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip || typeof token !== 'string' || !token || token.length > 2048)
    throw Error('VERIFICATION_REQUIRED');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw Error('INVALID_ORIGIN');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(env.PUBLIC_WRITE_HASH_SALT + ':' + scope + ':' + ip),
  );
  const identifier = Array.from(new Uint8Array(digest), (v) =>
    v.toString(16).padStart(2, '0'),
  ).join('');
  const now = Math.floor(Date.now() / 1000),
    windowId = Math.floor(now / 900),
    expires = (windowId + 1) * 900;
  const row = await env.WALLY_LIMITS_DB.prepare(
    'INSERT INTO public_write_limits(rate_key,attempts,expires_at) VALUES (?1,1,?2) ON CONFLICT(rate_key) DO UPDATE SET attempts=attempts+1 WHERE attempts<5 RETURNING attempts',
  )
    .bind(scope + ':' + windowId + ':' + identifier, expires)
    .first();
  if (!row) throw Error('RATE_LIMITED');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error('PROTECTION_UNAVAILABLE');
  const verification = await response.json();
  if (
    !verification.success ||
    verification.hostname !== new URL(request.url).hostname ||
    verification.action !== 'public-write'
  )
    throw Error('VERIFICATION_FAILED');
  return identifier;
}

import { requireAdministrator } from './auth.js';
import { database, domainFailure } from '../_lib/backend.js';
import { readBoundedJson, protectPublicWrite } from '../_lib/publicWriteProtection.js';
const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
export function validateScore(input) {
  if (
    !input ||
    !['snake', 'flappy'].includes(input.game) ||
    !Number.isSafeInteger(input.score) ||
    input.score < 1 ||
    input.score > (input.game === 'snake' ? 222 : 100000)
  )
    throw Error('INVALID_SCORE');
  const alias = typeof input.alias === 'string' ? input.alias.trim() : '';
  if (!/^[\p{L}\p{N} _-]{2,24}$/u.test(alias)) throw Error('INVALID_ALIAS');
  return { game: input.game, score: input.score, alias };
}
export async function onRequest({ request, env }) {
  if (env.RANKINGS_ENABLED !== 'true') return json({ error: 'RANKINGS_DISABLED' }, 503);
  if (
    !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
    !env.SUPABASE_ANON_KEY
  )
    return json({ error: 'RANKINGS_UNAVAILABLE' }, 503);
  const administrative = new URL(request.url).pathname === '/api/admin/rankings';
  if (administrative) {
    const access = await requireAdministrator(request, env);
    if (!access.authorized) return access.response;
    if (!['GET', 'DELETE'].includes(request.method))
      return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
    try {
      if (request.method === 'GET') {
        const rows = await database(
          env,
          'game_scores?select=game,visitor_hash,alias,score,created_at&order=created_at.desc&limit=100',
          { service: true },
        );
        if (!Array.isArray(rows)) throw Error('SERVICE_UNAVAILABLE');
        return json({
          scores: rows.map((row) => ({
            game: row.game,
            visitorHash: row.visitor_hash,
            alias: row.alias,
            score: row.score,
            createdAt: row.created_at,
          })),
        });
      }
      const input = await readBoundedJson(request);
      if (
        !['snake', 'flappy'].includes(input.game) ||
        !/^[a-f0-9]{64}$/.test(input.visitorHash ?? '') ||
        input.confirm !== true
      )
        throw Error('INVALID_SCORE');
      const rows = await database(
        env,
        'game_scores?' +
          new URLSearchParams({
            game: 'eq.' + input.game,
            visitor_hash: 'eq.' + input.visitorHash,
          }),
        { method: 'DELETE', service: true },
      );
      if (
        !Array.isArray(rows) ||
        rows.length !== 1 ||
        rows[0].game !== input.game ||
        rows[0].visitor_hash !== input.visitorHash
      )
        throw Error('CONFLICT');
      return json({ deleted: true });
    } catch (error) {
      return domainFailure(error);
    }
  }
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  try {
    if (request.method === 'GET') {
      const game = new URL(request.url).searchParams.get('game');
      if (!['snake', 'flappy'].includes(game)) return json({ error: 'INVALID_GAME' }, 400);
      const url = new URL('/rest/v1/game_scores', env.SUPABASE_URL);
      url.search = new URLSearchParams({
        select: 'alias,score',
        game: 'eq.' + game,
        order: 'score.desc,created_at.asc',
        limit: '20',
      });
      const response = await fetch(url, {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY,
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw Error('RANKINGS_UNAVAILABLE');
      const rows = await response.json();
      if (!Array.isArray(rows)) throw Error('RANKINGS_UNAVAILABLE');
      return json({
        scores: rows
          .map((row) => validateScore({ game, ...row }))
          .map((row) => ({ alias: row.alias, score: row.score })),
      });
    }
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'RANKINGS_UNAVAILABLE' }, 503);
    const input = await readBoundedJson(request),
      score = validateScore(input);
    const visitor = await protectPublicWrite(request, env, input.turnstileToken, 'rankings');
    const response = await fetch(new URL('/rest/v1/rpc/submit_game_score', env.SUPABASE_URL), {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_game: score.game,
        target_alias: score.alias,
        target_score: score.score,
        target_visitor: visitor,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Error('RANKINGS_UNAVAILABLE');
    return json({ accepted: true }, 201);
  } catch (error) {
    const code = error.message;
    return json(
      {
        error: [
          'INVALID_SCORE',
          'INVALID_ALIAS',
          'INVALID_BODY',
          'INVALID_CONTENT_TYPE',
          'BODY_TOO_LARGE',
          'VERIFICATION_REQUIRED',
          'VERIFICATION_FAILED',
          'INVALID_ORIGIN',
          'RATE_LIMITED',
        ].includes(code)
          ? code
          : 'RANKINGS_UNAVAILABLE',
      },
      code === 'RATE_LIMITED'
        ? 429
        : code.startsWith('INVALID') || code === 'BODY_TOO_LARGE'
          ? 400
          : code.startsWith('VERIFICATION')
            ? 403
            : 503,
    );
  }
}

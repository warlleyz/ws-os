import { requireAdministrator } from './auth.js';
import { database, domainFailure } from '../_lib/backend.js';
import { readBoundedJson, protectPublicWrite } from '../_lib/publicWriteProtection.js';

/* === Constantes e configurações === */
const ALLOWED_GAMES = ['snake', 'flappy'];

const MAX_SCORES = {
  snake: 222,
  flappy: 100000,
};

const PUBLIC_ERRORS = [
  'INVALID_SCORE',
  'INVALID_ALIAS',
  'INVALID_BODY',
  'INVALID_CONTENT_TYPE',
  'BODY_TOO_LARGE',
  'VERIFICATION_REQUIRED',
  'VERIFICATION_FAILED',
  'INVALID_ORIGIN',
  'RATE_LIMITED',
];

/* === Utilitários === */
const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const isValidGame = (game) => ALLOWED_GAMES.includes(game);

const hasSupabaseConfiguration = (env) =>
  /^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') &&
  Boolean(env.SUPABASE_SERVICE_ROLE_KEY);

const getServiceHeaders = (env) => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
});

const publicFailure = (error) => {
  const code = error?.message ?? 'RANKINGS_UNAVAILABLE';

  const status =
    code === 'RATE_LIMITED'
      ? 429
      : code.startsWith('INVALID') || code === 'BODY_TOO_LARGE'
        ? 400
        : code.startsWith('VERIFICATION')
          ? 403
          : 503;

  return json(
    {
      error: PUBLIC_ERRORS.includes(code) ? code : 'RANKINGS_UNAVAILABLE',
    },
    status,
  );
};

/* === Validação das pontuações === */
export function validateScore(input) {
  if (
    !input ||
    !isValidGame(input.game) ||
    !Number.isSafeInteger(input.score) ||
    input.score < 1 ||
    input.score > MAX_SCORES[input.game]
  ) {
    throw Error('INVALID_SCORE');
  }

  const alias = typeof input.alias === 'string' ? input.alias.trim() : '';

  if (!/^[\p{L}\p{N} _-]{2,24}$/u.test(alias)) {
    throw Error('INVALID_ALIAS');
  }

  return {
    game: input.game,
    score: input.score,
    alias,
  };
}

/* === Operações administrativas === */

/* ----- Listagem administrativa ----- */
async function listAdministrativeScores(env) {
  const rows = await database(
    env,
    'game_scores?select=game,visitor_hash,alias,score,created_at&order=created_at.desc&limit=100',
    { service: true },
  );

  if (!Array.isArray(rows)) {
    throw Error('SERVICE_UNAVAILABLE');
  }

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

/* ----- Exclusão administrativa ----- */
async function deleteAdministrativeScore(request, env) {
  const input = await readBoundedJson(request);

  if (
    !isValidGame(input.game) ||
    !/^[a-f0-9]{64}$/.test(input.visitorHash ?? '') ||
    (input.score !== undefined &&
      (!Number.isSafeInteger(input.score) ||
        input.score < 1 ||
        input.score > MAX_SCORES[input.game])) ||
    input.confirm !== true
  ) {
    throw Error('INVALID_SCORE');
  }

  const params = new URLSearchParams({
    game: `eq.${input.game}`,
    visitor_hash: `eq.${input.visitorHash}`,
    ...(input.score !== undefined ? { score: `eq.${input.score}` } : {}),
  });

  const rows = await database(env, `game_scores?${params}`, {
    method: 'DELETE',
    service: true,
  });

  if (
    !Array.isArray(rows) ||
    rows.length !== 1 ||
    rows[0].game !== input.game ||
    rows[0].visitor_hash !== input.visitorHash ||
    (input.score !== undefined && rows[0].score !== input.score)
  ) {
    throw Error('CONFLICT');
  }

  return json({ deleted: true });
}

/* ----- Roteamento administrativo ----- */
async function handleAdministrativeRequest(request, env) {
  const access = await requireAdministrator(request, env);

  if (!access.authorized) {
    return access.response;
  }

  if (!['GET', 'DELETE'].includes(request.method)) {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  try {
    if (request.method === 'GET') {
      return await listAdministrativeScores(env);
    }

    return await deleteAdministrativeScore(request, env);
  } catch (error) {
    return domainFailure(error);
  }
}

/* === Operações públicas === */

/* ----- Consulta pública do ranking ----- */
async function listPublicScores(request, env) {
  const game = new URL(request.url).searchParams.get('game');

  if (!isValidGame(game)) {
    return json({ error: 'INVALID_GAME' }, 400);
  }

  const url = new URL('/rest/v1/game_scores', env.SUPABASE_URL);

  url.search = new URLSearchParams({
    select: 'alias,score',
    game: `eq.${game}`,
    order: 'score.desc,created_at.asc',
    limit: '20',
  });

  const response = await fetch(url, {
    headers: getServiceHeaders(env),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw Error('RANKINGS_UNAVAILABLE');
  }

  const rows = await response.json();

  if (!Array.isArray(rows)) {
    throw Error('RANKINGS_UNAVAILABLE');
  }

  return json({
    scores: rows
      .map((row) => validateScore({ game, ...row }))
      .map(({ alias, score }) => ({
        alias,
        score,
      })),
  });
}

/* ----- Envio público de pontuação ----- */
async function submitPublicScore(request, env) {
  const input = await readBoundedJson(request);
  const score = validateScore(input);

  const visitor = await protectPublicWrite(request, env, input.turnstileToken, 'rankings');

  const url = new URL('/rest/v1/rpc/submit_game_score', env.SUPABASE_URL);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getServiceHeaders(env),
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

  if (!response.ok) {
    throw Error('RANKINGS_UNAVAILABLE');
  }

  return json({ accepted: true }, 201);
}

/* ----- Roteamento público ----- */
async function handlePublicRequest(request, env) {
  if (!['GET', 'POST'].includes(request.method)) {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  try {
    if (request.method === 'GET') {
      return await listPublicScores(request, env);
    }

    return await submitPublicScore(request, env);
  } catch (error) {
    return publicFailure(error);
  }
}

/* === Entrada principal da API === */
export async function onRequest({ request, env }) {
  if (env.RANKINGS_ENABLED !== 'true') {
    return json({ error: 'RANKINGS_DISABLED' }, 503);
  }

  if (!hasSupabaseConfiguration(env)) {
    return json({ error: 'RANKINGS_UNAVAILABLE' }, 503);
  }

  const pathname = new URL(request.url).pathname;

  if (pathname === '/api/admin/rankings') {
    return handleAdministrativeRequest(request, env);
  }

  return handlePublicRequest(request, env);
}

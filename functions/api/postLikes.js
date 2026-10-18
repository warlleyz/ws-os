import { checkPostLikeRateLimit } from '../_lib/postLikeRateLimit.js';

const json = (body, status = 200, headers = {}) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });

function getConfig(env, writing = false) {
  if (
    !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
    !env.SUPABASE_ANON_KEY ||
    (writing &&
      (!env.SUPABASE_SERVICE_ROLE_KEY || !env.POST_LIKES_HASH_SALT || !env.WALLY_LIMITS_DB))
  ) {
    return null;
  }

  return {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function getPostId(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  return typeof id === 'string' && /^[a-z\d_-]{1,80}$/i.test(id) ? id : null;
}

async function supabaseRequest(config, path, options = {}, privileged = false) {
  const key = privileged ? config.serviceKey : config.anonKey;

  return fetch(new URL(path, config.url), {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...options.headers,
    },
    signal: AbortSignal.timeout(10000),
  });
}

async function isPublished(config, postId) {
  const url = new URL('/rest/v1/posts', config.url);

  url.search = new URLSearchParams({
    select: 'id',
    id: `eq.${postId}`,
    status: 'eq.published',
    published_at: `lte.${new Date().toISOString()}`,
    limit: '1',
  });

  const response = await supabaseRequest(config, url.pathname + url.search);

  if (!response.ok) {
    throw new Error('PUBLICATION_LOOKUP_FAILED');
  }

  const rows = await response.json();

  if (!Array.isArray(rows)) {
    throw new Error('INVALID_PUBLICATION_RESPONSE');
  }

  return rows.length === 1 && rows[0]?.id === postId;
}

async function getLikeCount(config, postId) {
  const response = await supabaseRequest(config, '/rest/v1/rpc/get_post_likes_count', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target_post_id: postId,
    }),
  });

  if (!response.ok) {
    throw new Error('LIKE_COUNT_FAILED');
  }

  const count = await response.json();

  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('INVALID_LIKE_COUNT');
  }

  return count;
}

async function hasVisitorLiked(config, postId, visitorHash) {
  const url = new URL('/rest/v1/post_likes', config.url);

  url.search = new URLSearchParams({
    select: 'id',
    post_id: `eq.${postId}`,
    visitor_hash: `eq.${visitorHash}`,
    limit: '1',
  });

  const response = await supabaseRequest(config, url.pathname + url.search, {}, true);

  if (!response.ok) {
    throw new Error('LIKE_STATUS_FAILED');
  }

  const rows = await response.json();

  if (!Array.isArray(rows)) {
    throw new Error('INVALID_LIKE_STATUS');
  }

  return rows.length > 0;
}

async function hashVisitor(salt, ip) {
  const input = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', input);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestGet({ request, env }) {
  const config = getConfig(env);
  const postId = getPostId(request);
  const visitorId = request.headers.get('X-WS-Visitor-ID');

  if (!postId) {
    return json({ error: 'Publicação inválida.' }, 400);
  }

  if (visitorId !== null && !/^[a-f0-9]{32}$/.test(visitorId)) {
    return json({ error: 'Identificador inválido.' }, 400);
  }

  if (!config) {
    return json({ error: 'Serviço de curtidas não configurado.' }, 503);
  }

  if (visitorId !== null && (!config.serviceKey || !env.POST_LIKES_HASH_SALT)) {
    return json({ error: 'Serviço de curtidas não configurado.' }, 503);
  }

  try {
    const published = await isPublished(config, postId);

    if (!published) {
      return json({ error: 'Publicação não encontrada.' }, 404);
    }

    const countPromise = getLikeCount(config, postId);

    const likedPromise =
      visitorId === null
        ? Promise.resolve(false)
        : hashVisitor(env.POST_LIKES_HASH_SALT, `visitor:${visitorId}`).then((visitorHash) =>
            hasVisitorLiked(config, postId, visitorHash),
          );

    const [count, liked] = await Promise.all([countPromise, likedPromise]);

    return json({
      postId,
      count,
      liked,
    });
  } catch {
    return json({ error: 'Curtidas indisponíveis.' }, 502);
  }
}

export async function onRequestPost({ request, env }) {
  const config = getConfig(env, true);
  const postId = getPostId(request);

  if (!postId) {
    return json({ error: 'Publicação inválida.' }, 400);
  }

  if (!config) {
    return json({ error: 'Serviço de curtidas não configurado.' }, 503);
  }

  const origin = request.headers.get('Origin');

  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: 'Origem não autorizada.' }, 403);
  }

  const ip = request.headers.get('CF-Connecting-IP');
  const visitorId = request.headers.get('X-WS-Visitor-ID');

  if (!ip) {
    return json({ error: 'Visitante não identificado.' }, 503);
  }

  if (!visitorId || !/^[a-f0-9]{32}$/.test(visitorId)) {
    return json({ error: 'Identificador do visitante inválido.' }, 400);
  }

  try {
    const visitorHash = await hashVisitor(env.POST_LIKES_HASH_SALT, `visitor:${visitorId}`);

    const ipHash = await hashVisitor(env.POST_LIKES_HASH_SALT, `ip:${ip}`);

    const limit = await checkPostLikeRateLimit(env, ipHash);

    if (!limit.allowed) {
      if (limit.reason === 'RATE_LIMIT_EXCEEDED') {
        return json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      return json({ error: 'Proteção de curtidas indisponível.' }, 503);
    }

    if (!(await isPublished(config, postId))) {
      return json({ error: 'Publicação não encontrada.' }, 404);
    }

    const response = await supabaseRequest(
      config,
      '/rest/v1/post_likes?on_conflict=post_id,visitor_hash',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify({
          post_id: postId,
          visitor_hash: visitorHash,
        }),
      },
      true,
    );

    if (!response.ok) {
      return json({ error: 'Não foi possível registrar a curtida.' }, 502);
    }

    let count = null;

    try {
      count = await getLikeCount(config, postId);
    } catch {
      // A gravação foi confirmada, mas o contador está indisponível.
    }

    return json({
      success: true,
      postId,
      count,
    });
  } catch {
    return json({ error: 'Serviço de curtidas indisponível.' }, 502);
  }
}

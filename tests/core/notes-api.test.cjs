const { test } = require('node:test');
const assert = require('node:assert/strict');

test('Worker: login, criar, editar, publicar, curtir, despublicar, excluir e logout', async (t) => {
  const worker = (await import('../../worker/index.js')).default;
  let post = null,
    liked = false,
    revision = 0;
  const env = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'anon-test',
    SUPABASE_SERVICE_ROLE_KEY: 'service-test',
    POST_LIKES_HASH_SALT: 'likes-test',
    ADMIN_LOGIN_RATE_LIMIT_SALT: 'login-test',
    WALLY_LIMITS_DB: {
      prepare: () => ({ bind: () => ({ first: async () => ({ attempts: 1 }) }) }),
    },
  };
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    const parsed = new URL(url);
    const body = options.body ? JSON.parse(options.body) : null;
    if (parsed.pathname === '/auth/v1/token')
      return Response.json({ access_token: 'admin-token', expires_in: 3600 });
    if (parsed.pathname === '/auth/v1/user') {
      return options.headers.Authorization === 'Bearer admin-token'
        ? Response.json({ id: 'admin-one' })
        : Response.json({ error: 'expired' }, { status: 401 });
    }
    if (parsed.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (parsed.pathname === '/rest/v1/admin_users')
      return Response.json([{ user_id: 'admin-one' }]);
    if (parsed.pathname === '/rest/v1/posts') {
      if (options.method === 'POST') {
        post = { ...body, updated_at: `2026-10-18T10:00:0${++revision}.000Z` };
        return Response.json([post], { status: 201 });
      }
      if (options.method === 'PATCH') {
        if (parsed.searchParams.get('updated_at') !== `eq.${post.updated_at}`)
          return Response.json([]);
        post = { ...post, ...body, updated_at: `2026-10-18T10:00:0${++revision}.000Z` };
        return Response.json([post]);
      }
      if (options.method === 'DELETE') {
        const deleted = post;
        post = null;
        return Response.json([deleted]);
      }
      const publicRead = parsed.searchParams.has('published_at');
      return Response.json(post && (!publicRead || post.status === 'published') ? [post] : []);
    }
    if (parsed.pathname === '/rest/v1/post_likes') {
      if (options.method === 'POST') {
        liked = true;
        return new Response(null, { status: 201 });
      }
      return Response.json(liked ? [{ id: 1 }] : []);
    }
    if (parsed.pathname === '/rest/v1/rpc/get_post_likes_count')
      return Response.json(liked ? 1 : 0);
    throw Error('Unexpected outbound request: ' + parsed.pathname);
  });
  async function call(route, method = 'GET', body, token = 'admin-token') {
    const response = await worker.fetch(
      new Request('https://ws.test' + route, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.0.2.1',
          'X-WS-Visitor-ID': '0123456789abcdef0123456789abcdef',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      env,
    );
    return { status: response.status, data: await response.json() };
  }

  /* === Política de cache das publicações === */
  /* ----- Respostas públicas não ficam no cache HTTP ----- */
  test('API de publicações impede cache HTTP de respostas públicas', async (t) => {
    const worker = (await import('../../worker/index.js')).default;

    t.mock.method(globalThis, 'fetch', async () => Response.json([]));

    const env = {
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_ANON_KEY: 'anon-test',
    };

    const response = await worker.fetch(new Request('https://ws.test/api/posts'), env);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });

  assert.equal(
    (
      await call('/api/auth/login', 'POST', {
        email: 'admin@example.test',
        password: 'test-password',
      })
    ).status,
    200,
  );
  assert.equal((await call('/api/auth/me')).data.admin, true);
  for (const body of [null, { title: {}, body: 'x', summary: '', tags: [] }]) {
    assert.equal((await call('/api/admin/posts/create', 'POST', body)).status, 400);
  }
  const content = { title: 'Primeira nota', summary: 'Resumo', body: 'Conteúdo', tags: ['React'] };
  const created = await call('/api/admin/posts/create', 'POST', content);
  assert.equal(created.status, 201);
  assert.equal(post.status, 'draft');
  const id = created.data.id;
  assert.equal((await call('/api/posts/likes/add?id=' + id, 'POST')).status, 404);
  assert.equal(
    (
      await call('/api/admin/posts/update', 'PATCH', {
        ...content,
        id,
        title: 'Editada',
        updatedAt: post.updated_at,
      })
    ).status,
    200,
  );
  assert.equal(post.title['pt-BR'], 'Editada');
  const published = await call('/api/admin/posts/status', 'PATCH', {
    id,
    action: 'publish',
    updatedAt: post.updated_at,
  });
  assert.equal(published.status, 200);
  assert.equal(published.data.updatedAt, post.updated_at);
  assert.equal((await call('/api/posts/likes/add?id=' + id, 'POST')).data.count, 1);
  assert.equal((await call('/api/posts/likes/add?id=' + id, 'POST')).data.count, 1);
  assert.equal((await call('/api/posts/likes?id=' + id)).data.liked, true);
  assert.equal(
    (
      await call('/api/admin/posts/status', 'PATCH', {
        id,
        action: 'unpublish',
        updatedAt: post.updated_at,
      })
    ).status,
    200,
  );
  assert.equal((await call('/api/posts/likes?id=' + id)).status, 404);
  assert.equal((await call('/api/admin/posts/delete?id=' + id, 'DELETE')).data.success, true);
  assert.equal(post, null);
  assert.equal((await call('/api/admin/posts', 'GET', undefined, 'expired-token')).status, 403);
  assert.equal((await call('/api/auth/logout', 'POST')).data.success, true);
});

test('criação com identidade estável reconcilia confirmação perdida e rejeita conteúdo diferente', async (t) => {
  const worker = (await import('../../worker/index.js')).default;
  const env = { SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_ANON_KEY: 'anon' };
  let stored = null,
    writes = 0;
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname === '/auth/v1/user') return Response.json({ id: 'admin' });
    if (parsed.pathname === '/rest/v1/admin_users') return Response.json([{ user_id: 'admin' }]);
    if (parsed.pathname === '/rest/v1/posts') {
      if (options.method === 'POST') {
        if (stored) return Response.json({ error: 'duplicate' }, { status: 409 });
        stored = JSON.parse(options.body);
        writes++;
        return Response.json([stored], { status: 201 });
      }
      return Response.json(stored ? [stored] : []);
    }
    throw Error('unexpected transport');
  });
  const body = {
    id: 'stable-note',
    title: 'Título',
    summary: 'Resumo',
    body: '漢'.repeat(10000),
    tags: [],
  };
  const call = (value) =>
    worker.fetch(
      new Request('https://ws.test/api/admin/posts/create', {
        method: 'POST',
        headers: { Authorization: 'Bearer admin', 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      }),
      env,
    );
  assert.equal((await call(body)).status, 201);
  const repeat = await call(body);
  assert.equal(repeat.status, 200);
  assert.equal((await repeat.json()).id, body.id);
  assert.equal((await call({ ...body, title: 'Alterado' })).status, 409);
  assert.equal(writes, 1);
});

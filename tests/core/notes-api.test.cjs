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

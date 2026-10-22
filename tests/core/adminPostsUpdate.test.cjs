const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../functions/api/adminPosts.js'),
  'utf8',
);

const env = {
  SUPABASE_URL: 'https://test-project.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
};

const validPost = {
  id: 'nota-teste',
  updatedAt: '2026-10-17T12:00:00.000Z',
  title: 'Título atualizado',
  summary: 'Resumo atualizado',
  body: 'Conteúdo atualizado',
  tags: ['React', 'JavaScript'],
};

function loadHandler({ authorized = true, fetchMock } = {}) {
  const code = source
    .replace(/^import\s+\{\s*requireAdministrator\s*\}\s+from\s+['"]\.\/auth\.js['"];?\s*/m, '')
    .replace(/\bexport\s+/g, '');

  const context = {
    Request,
    Response,
    URL,
    URLSearchParams,
    AbortSignal,
    TextEncoder,
    TextDecoder,
    fetch:
      fetchMock ??
      (async () => {
        throw new Error('Unexpected fetch');
      }),
    requireAdministrator: async () =>
      authorized
        ? { authorized: true, response: null }
        : {
            authorized: false,
            response: Response.json({ error: 'Não autenticado.' }, { status: 401 }),
          },
  };

  return vm.runInNewContext(`(() => { ${code}; return onRequestUpdate; })()`, context);
}

function createRequest(data = validPost) {
  return new Request('https://ws.test/api/admin/posts/update', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-de-teste',
    },
    body: JSON.stringify(data),
  });
}

test('visitante não pode atualizar publicações', async () => {
  let fetchCalled = false;

  const handler = loadHandler({
    authorized: false,
    fetchMock: async () => {
      fetchCalled = true;
      throw new Error('Unexpected fetch');
    },
  });

  const response = await handler({
    request: createRequest(),
    env,
  });

  assert.equal(response.status, 401);
  assert.equal(fetchCalled, false);
});

test('rejeita identificadores e conteúdos inválidos', async () => {
  const handler = loadHandler();

  const invalidCases = [
    { ...validPost, id: '../outra-nota' },
    { ...validPost, title: '' },
    { ...validPost, body: '' },
    { ...validPost, title: 'X'.repeat(161) },
    { ...validPost, tags: [''] },
    { ...validPost, tags: Array(13).fill('React') },
  ];

  for (const data of invalidCases) {
    const response = await handler({
      request: createRequest(data),
      env,
    });

    assert.equal(response.status, 400);
  }
});

test('edição preserva status, data de publicação e tradução existente', async () => {
  const calls = [];

  const handler = loadHandler({
    fetchMock: async (url, options) => {
      calls.push({ url: String(url), options });

      if (!options.method || options.method === 'GET') {
        return Response.json([
          {
            id: 'nota-teste',
            title: { 'pt-BR': 'Título antigo', en: 'Original title' },
            summary: { 'pt-BR': 'Resumo antigo', en: 'Original summary' },
            body: { 'pt-BR': 'Texto antigo', en: 'Original body' },
            status: 'draft',
            updated_at: '2026-10-17T12:00:00.000Z',
          },
        ]);
      }

      if (options.method === 'PATCH') {
        return Response.json([{ id: 'nota-teste', status: 'draft' }]);
      }

      throw new Error('Unexpected method');
    },
  });

  const response = await handler({
    request: createRequest(),
    env,
  });

  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.status, 'draft');
  assert.equal(calls.length, 2);

  const updateCall = calls[1];
  const payload = JSON.parse(updateCall.options.body);

  assert.equal(updateCall.options.method, 'PATCH');
  assert.equal(payload.title['pt-BR'], validPost.title);
  assert.equal(payload.title.en, 'Original title');
  assert.equal(payload.summary.en, 'Original summary');
  assert.equal(payload.body.en, 'Original body');

  assert.equal(Object.hasOwn(payload, 'status'), false, 'A edição não deve alterar o status');

  assert.equal(
    Object.hasOwn(payload, 'published_at'),
    false,
    'A edição não deve alterar a data de publicação',
  );
});

test('falha do Supabase não é apresentada como sucesso', async () => {
  const handler = loadHandler({
    fetchMock: async () => Response.json({ message: 'Falha simulada' }, { status: 500 }),
  });

  const response = await handler({
    request: createRequest(),
    env,
  });

  const result = await response.json();

  assert.equal(response.status, 502);
  assert.ok(!result.success);
});

test('publicação inexistente retorna 404', async () => {
  const handler = loadHandler({
    fetchMock: async () => Response.json([]),
  });

  const response = await handler({
    request: createRequest(),
    env,
  });

  assert.equal(response.status, 404);
});

test('rejeita corpo maior que 80 KB sem Content-Length', async () => {
  let fetchCalled = false;

  const handler = loadHandler({
    fetchMock: async () => {
      fetchCalled = true;
      throw new Error('A API externa não deveria ser chamada.');
    },
  });

  const request = new Request('https://ws.test/api/admin/posts/update', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-de-teste',
    },
    body: JSON.stringify({
      ...validPost,
      body: 'X'.repeat(90000),
    }),
  });

  const response = await handler({ request, env });

  assert.equal(response.status, 413);
  assert.equal(fetchCalled, false);
});

test('edição concorrente retorna 409 e preserva dados existentes', async () => {
  let updateCall;

  const handler = loadHandler({
    fetchMock: async (url, options) => {
      if (!options.method || options.method === 'GET') {
        return Response.json([
          {
            id: 'nota-teste',
            title: { 'pt-BR': 'Título atual' },
            summary: { 'pt-BR': 'Resumo atual' },
            body: { 'pt-BR': 'Conteúdo atual' },
          },
        ]);
      }

      updateCall = {
        url: new URL(url),
        options,
      };

      // Simula uma nota modificada por outra janela.
      // O filtro updated_at não encontra mais a versão anterior.
      return Response.json([]);
    },
  });

  const response = await handler({
    request: createRequest(),
    env,
  });

  assert.equal(response.status, 409);
  assert.equal(updateCall.options.method, 'PATCH');
  assert.equal(updateCall.url.searchParams.get('updated_at'), `eq.${validPost.updatedAt}`);
  assert.equal(updateCall.url.searchParams.get('id'), 'eq.nota-teste');
});

test('edição rejeita confirmação de outra publicação devolvida pelo serviço', async () => {
  const handler = loadHandler({
    fetchMock: async (_url, options) =>
      Response.json(
        options.method === 'PATCH'
          ? [{ id: 'another-note', status: 'draft' }]
          : [{ id: validPost.id, title: {}, summary: {}, body: {} }],
      ),
  });
  const response = await handler({ request: createRequest(), env });
  assert.equal(response.status, 502);
  assert.notEqual((await response.json()).success, true);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');

/* === CONFIGURAÇÃO DOS CENÁRIOS ISOLADOS === */
const root = path.resolve(__dirname, '../..');
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-test',
  SUPABASE_SERVICE_ROLE_KEY: 'service-test',
  MANAGED_FILES_ENABLED: 'true',
  RANKINGS_ENABLED: 'true',
};
const load = (name, bindings = {}) =>
  loadContract(path.join(root, name), {
    Response,
    Request,
    Headers,
    AbortSignal,
    Uint8Array,
    ...bindings,
  });

/* === CONTRATO ÚNICO DAS PONTUAÇÕES === */
test('API e contrato público aceitam a faixa completa do Snake e rejeitam o excedente', () => {
  const api = load('functions/api/rankings.js');
  const contract = load('src/services/publicContentContract.js');
  for (const [game, limit] of Object.entries(contract.RANKING_GAME_LIMITS)) {
    for (const score of [1, 222, 223, limit]) {
      const input = { game, score, alias: 'Jogador' };
      assert.equal(api.validateScore(input).score, score);
      assert.equal(contract.validateRankingSubmission(input).ok, true);
    }
    for (const score of [0, -1, 1.5, limit + 1, NaN, Infinity]) {
      const input = { game, score, alias: 'Jogador' };
      assert.throws(() => api.validateScore(input), /INVALID_SCORE/);
      assert.equal(contract.validateRankingSubmission(input).ok, false);
    }
  }
});

test('consulta e moderação aceitam pontuação Snake 397 sem expor identificador privado', async () => {
  const hash = 'a'.repeat(64);
  const calls = [];
  const api = load('functions/api/rankings.js', {
    fetch: async (address, options = {}) => {
      const url = new URL(address);
      calls.push({ url, options });
      if (url.pathname === '/auth/v1/user') return Response.json({ id: 'admin' });
      if (url.pathname === '/rest/v1/admin_users') return Response.json([{ user_id: 'admin' }]);
      if (options.method === 'DELETE') {
        assert.equal(url.searchParams.get('score'), 'eq.397');
        return Response.json([{ game: 'snake', visitor_hash: hash, score: 397 }]);
      }
      return Response.json([{ alias: 'Jogador', score: 397 }]);
    },
  });
  const response = await api.onRequest({
    env,
    request: new Request('https://ws.test/api/rankings?game=snake'),
  });
  assert.deepEqual(await response.json(), { scores: [{ alias: 'Jogador', score: 397 }] });
  const removed = await api.onRequest({
    env,
    request: new Request('https://ws.test/api/admin/rankings', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'snake', score: 397, visitorHash: hash, confirm: true }),
    }),
  });
  assert.equal(removed.status, 200);
  assert.equal(calls.at(-1).options.method, 'DELETE');
});

/* === CORPOS LIMITADOS E TIPO DE CONTEÚDO === */
test('JSON aceita parâmetros MIME válidos e rejeita tipos que só compartilham o prefixo', async () => {
  const { readBoundedJson } = load('functions/_lib/publicWriteProtection.js');
  const request = (type) =>
    new Request('https://ws.test', {
      method: 'POST',
      headers: { 'Content-Type': type },
      body: '{"value":1}',
    });
  assert.equal((await readBoundedJson(request('application/json; charset=utf-8'))).value, 1);
  for (const type of ['application/jsonp', 'application/json-invalid', 'text/plain']) {
    await assert.rejects(readBoundedJson(request(type)), /INVALID_CONTENT_TYPE/);
  }
});

test('limite JSON cancela o stream e libera o leitor mesmo sem Content-Length', async () => {
  const { readBoundedJson } = load('functions/_lib/publicWriteProtection.js');
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(33));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request('https://ws.test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    duplex: 'half',
  });
  await assert.rejects(readBoundedJson(request, 32), /BODY_TOO_LARGE/);
  assert.equal(cancelled, true);
  assert.equal(request.body.locked, false);
});

test('ranking devolve HTTP 413 para corpo excessivo antes de acessar banco ou verificador', async () => {
  const api = load('functions/api/rankings.js', {
    fetch: () => assert.fail('Serviço não deveria ser chamado'),
  });
  const response = await api.onRequest({
    env,
    request: new Request('https://ws.test/api/rankings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(9000) }),
    }),
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, 'BODY_TOO_LARGE');
});

/* === DESTAQUES: LOG SEGURO E CONFIRMAÇÃO EFETIVA === */
function highlights(upstream, logs = []) {
  return load('functions/api/projectHighlights.js', {
    console: { error: (...args) => logs.push(args) },
    fetch: async (address, options = {}) => {
      const url = new URL(address);
      if (url.pathname === '/auth/v1/user') return Response.json({ id: 'admin' });
      if (url.pathname === '/rest/v1/admin_users') return Response.json([{ user_id: 'admin' }]);
      return upstream(url, options);
    },
  });
}

test('falha de destaques não copia corpo privado do provedor para logs ou resposta', async () => {
  const logs = [];
  const api = highlights(
    () => new Response('INFORMACAO_PRIVADA_DO_PROVEDOR', { status: 503 }),
    logs,
  );
  const response = await api.onRequest({
    env,
    request: new Request('https://ws.test/api/project-highlights'),
  });
  assert.equal(response.status, 502);
  assert.doesNotMatch(JSON.stringify(logs), /INFORMACAO_PRIVADA/);
  assert.doesNotMatch(await response.text(), /INFORMACAO_PRIVADA/);
  assert.equal(logs[0][1].status, 503);
});

test('gravação de destaques não confirma seleção diferente da enviada', async () => {
  const api = highlights(() => Response.json([{ id: 'default', repository_ids: ['github-2'] }]));
  const response = await api.onRequest({
    env,
    request: new Request('https://ws.test/api/admin/project-highlights', {
      method: 'PUT',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositoryIds: ['github-1'] }),
    }),
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'HIGHLIGHTS_CONFLICT');
});

/* === PROJEÇÃO PÚBLICA DO CONTEÚDO === */
test('catálogo público projeta somente os campos permitidos do conteúdo', async () => {
  const api = load('functions/api/managedContent.js', {
    fetch: async () =>
      Response.json([
        {
          id: 'event-1',
          status: 'published',
          updated_at: '2026-10-26T00:00:00Z',
          data: { title: 'Evento', date: '2026-10-26', internal: 'INFORMACAO_PRIVADA' },
        },
      ]),
  });
  const response = await api.onRequest({
    env,
    request: new Request('https://ws.test/api/content?kind=events'),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.items[0].data.title, 'Evento');
  assert.doesNotMatch(JSON.stringify(payload), /INFORMACAO_PRIVADA|internal/);
});

test('registro público inválido não expõe dados de solicitação privada', async () => {
  const api = load('functions/api/managedContent.js', {
    fetch: async () =>
      Response.json([
        {
          id: 'event-1',
          status: 'published',
          data: { title: 'Evento', date: '2026-10-26', email: 'privado@example.invalid' },
        },
      ]),
  });
  const response = await api.onRequest({
    env,
    request: new Request('https://ws.test/api/content?kind=events'),
  });
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /privado@example/);
});

/* === LEITURA LIMITADA DO ARMAZENAMENTO PRIVADO === */
test(
  'download do provedor é interrompido ao ultrapassar o tamanho esperado',
  { timeout: 1000 },
  async () => {
    let cancelled = false;
    const api = load('functions/api/managedFiles.js', {
      fetch: async (address) => {
        const url = new URL(address);
        if (url.pathname.endsWith('/rpc/read_public_file'))
          return Response.json([
            {
              id: 'file-1',
              name: 'teste.pdf',
              mime_type: 'application/pdf',
              size: 8,
              sha256: 'a'.repeat(64),
              object_key: 'official/123e4567-e89b-42d3-a456-426614174000',
            },
          ]);
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(9));
            },
            cancel() {
              cancelled = true;
            },
          }),
        );
      },
    });
    const response = await api.onRequest({
      env,
      request: new Request('https://ws.test/api/files?id=file-1'),
    });
    assert.equal(response.status, 503);
    assert.equal(cancelled, true);
    assert.equal((await response.json()).error, 'SERVICE_UNAVAILABLE');
  },
);

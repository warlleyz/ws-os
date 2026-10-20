const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');
const root = path.resolve(__dirname, '../..');
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  REQUESTS_ENABLED: 'true',
  MANAGED_FILES_ENABLED: 'true',
};
function load(file, upstream, { admin = true } = {}) {
  const calls = [];
  const module = loadContract(path.join(root, 'functions/api', file), {
    Response,
    Headers,
    Request,
    AbortSignal,
    Uint8Array,
    fetch: async (url, options = {}) => {
      url = new URL(url);
      calls.push({ url, options });
      if (url.pathname === '/auth/v1/user') return Response.json({ id: 'administrator' });
      if (url.pathname === '/rest/v1/admin_users')
        return Response.json(admin ? [{ user_id: 'administrator' }] : []);
      return upstream(url, options);
    },
  });
  return { ...module, calls };
}
const req = (route, method = 'GET', body, headers = {}) =>
  new Request('https://test/' + route, {
    method,
    headers: { Authorization: 'Bearer valid', 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/* === Autorizações reais do handler e dependências desligadas === */
test('novos domínios recusam não administradores e configuração ausente sem acessar dados', async () => {
  for (const [file, route] of [
    ['requests.js', 'requests'],
    ['managedFiles.js', 'files'],
    ['attachments.js', 'attachments'],
  ]) {
    const api = load(
      file,
      () => {
        throw Error('domain must not be called');
      },
      { admin: false },
    );
    const response = await api.onRequest({ request: req('api/admin/' + route), env });
    assert.equal(response.status, 403, file);
    const off = await api.onRequest({ request: req('api/' + route), env: {} });
    assert.equal(off.status, 503, file);
  }
});

test('solicitação valida corpo e consentimento antes de Turnstile ou banco', async () => {
  const api = load('requests.js', () => {
    throw Error('unexpected transport');
  });
  for (const body of [
    {},
    {
      type: 'message',
      name: 'Pessoa',
      email: 'p@test.dev',
      message: 'Mensagem de teste válida',
      consent: false,
      idempotencyKey: 'request-1234567890123456',
    },
  ]) {
    assert.equal(
      (await api.onRequest({ request: req('api/requests', 'POST', body), env })).status,
      400,
    );
  }
  assert.equal(api.calls.length, 0);
});

test('leitura de solicitações usa JWT administrativo e não expõe hash ou fingerprint', async () => {
  const record = {
    id: 'one',
    type: 'message',
    name: 'Pessoa',
    email: 'p@test.dev',
    message: 'Mensagem de teste válida',
    status: 'new',
    revision: 1,
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    idempotencyKey: 'request-1234567890123456',
  };
  const api = load('requests.js', (url, options) => {
    assert.match(url.search, /select=id%2Crecord|select=id,record/);
    assert.equal(options.headers.Authorization, 'Bearer valid');
    return Response.json([{ id: 'one', record }]);
  });
  const response = await api.onRequest({ request: req('api/admin/requests'), env });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).items, [
    {
      ...record,
      requestedAt: null,
      timezone: null,
      completedAt: null,
      archivedAt: null,
      retentionUntil: null,
    },
  ]);
});

/* === R2 privado e identidade de metadados === */
test('assinaturas de arquivo recusam MIME falso, SVG e texto binário', () => {
  const { validateFileBytes } = load('managedFiles.js', () => {});
  assert.equal(validateFileBytes(new TextEncoder().encode('%PDF-1.7'), 'application/pdf'), true);
  assert.equal(validateFileBytes(new TextEncoder().encode('<svg/>'), 'image/png'), false);
  assert.equal(validateFileBytes(new Uint8Array([0xff, 0xfe]), 'text/plain'), false);
  assert.equal(validateFileBytes(new Uint8Array([0]), 'text/plain'), false);
});

test('publicação privada ou inexistente não chega ao bucket e falha de R2 não vira sucesso', async () => {
  let reads = 0;
  const bucket = {
    get: async () => {
      reads++;
      return null;
    },
  };
  const api = load('managedFiles.js', () => Response.json([]));
  assert.equal(
    (
      await api.onRequest({
        request: req('api/files?id=one'),
        env: { ...env, OFFICIAL_FILES: bucket },
      })
    ).status,
    404,
  );
  assert.equal(reads, 0);
  const missing = load('managedFiles.js', () =>
    Response.json([
      {
        id: 'one',
        name: 'test.pdf',
        mime_type: 'application/pdf',
        size: 5,
        object_key: 'official/one',
      },
    ]),
  );
  assert.equal(
    (
      await missing.onRequest({
        request: req('api/files?id=one'),
        env: { ...env, OFFICIAL_FILES: bucket },
      })
    ).status,
    503,
  );
  assert.equal(reads, 1);
});

test('metadados de criação são projetados sem chave do bucket e resposta de ID diferente conflita', async () => {
  for (const returnedId of ['one', 'other']) {
    const api = load('managedFiles.js', (url, options) =>
      Response.json([{ ...JSON.parse(options.body), id: returnedId }]),
    );
    const response = await api.onRequest({
      request: req('api/admin/files', 'POST', {
        id: 'one',
        name: 'document.pdf',
        mimeType: 'application/pdf',
        size: 20,
        visibility: 'private',
        purpose: 'attachment',
      }),
      env: { ...env, OFFICIAL_FILES: {} },
    });
    assert.equal(response.status, returnedId === 'one' ? 201 : 409);
    if (returnedId === 'one') assert.equal('object_key' in (await response.json()).item, false);
  }
});

test('vínculo de anexo exige revisão e confirmação atômica do banco', async () => {
  const api = load('attachments.js', () => Response.json(false));
  const response = await api.onRequest({
    request: req('api/admin/attachments', 'POST', {
      postId: 'post',
      resourceId: 'file',
      updatedAt: '2026-10-20T00:00:00Z',
    }),
    env,
  });
  assert.equal(response.status, 409);
});

test('manutenção limpa somente tabelas fixas e retenção é opt-in', async () => {
  const statements = [];
  const { runMaintenance } = loadContract(path.join(root, 'functions/_lib/maintenance.js'), {
    fetch: () => {
      throw Error('retention disabled');
    },
  });
  await runMaintenance({
    WALLY_LIMITS_DB: {
      prepare: (sql) => ({
        bind: (time) => {
          statements.push({ sql, time });
          return {};
        },
      }),
      batch: async (rows) => assert.equal(rows.length, 4),
    },
  });
  assert.equal(statements.length, 4);
  assert.ok(statements.every((x) => x.sql.startsWith('DELETE FROM ') && Number.isInteger(x.time)));
});

/* === Fluxos completos com rede e persistência controladas === */
test('envio protegido persiste uma vez e retry reutiliza resultado e notificação', async () => {
  const stored = new Map();
  let deliveries = 0;
  const api = load('requests.js', (url, options) => {
    if (url.hostname === 'challenges.cloudflare.com')
      return Response.json({ success: true, hostname: 'test', action: 'public-write' });
    const body = JSON.parse(options.body);
    if (url.pathname.endsWith('/submit_private_request')) {
      const previous = stored.get(body.request_key);
      if (previous) {
        if (previous.fingerprint !== body.request_fingerprint)
          return Response.json({ conflict: true });
        return Response.json({
          id: 'request-1',
          status: 'new',
          reused: true,
          email: previous.email,
        });
      }
      stored.set(body.request_key, { fingerprint: body.request_fingerprint, email: 'not_sent' });
      return Response.json({ id: 'request-1', status: 'new', reused: false });
    }
    if (url.pathname.endsWith('/claim_request_notification')) {
      const row = [...stored.values()][0];
      if (row.email !== 'not_sent') return Response.json(false);
      row.email = 'sending';
      return Response.json(true);
    }
    if (url.hostname === 'api.emailjs.com') {
      deliveries++;
      assert.ok(body.template_params.request_id);
      return new Response('OK');
    }
    if (url.pathname.endsWith('/finish_request_notification')) {
      [...stored.values()][0].email = body.delivery_state;
      return Response.json(true);
    }
    throw Error('Unexpected endpoint ' + url.pathname);
  });
  const configured = {
    ...env,
    TURNSTILE_SECRET_KEY: 'test-secret',
    PUBLIC_WRITE_HASH_SALT: 'test-salt',
    WALLY_LIMITS_DB: {
      prepare: () => ({ bind: () => ({ first: async () => ({ attempts: 1 }) }) }),
    },
    EMAILJS_NOTIFICATIONS_ENABLED: 'true',
    EMAILJS_SERVICE_ID: 'service',
    EMAILJS_TEMPLATE_ID: 'template',
    EMAILJS_PUBLIC_KEY: 'public',
    EMAILJS_PRIVATE_KEY: 'private',
  };
  const payload = {
    type: 'message',
    name: 'Pessoa',
    email: 'p@test.dev',
    message: 'Mensagem privada de teste',
    consent: true,
    idempotencyKey: 'request-1234567890123456',
    turnstileToken: 'test-token',
  };
  const send = (body) =>
    api.onRequest({
      request: req('api/requests', 'POST', body, { 'CF-Connecting-IP': '192.0.2.1' }),
      env: configured,
    });
  const first = await send(payload);
  assert.equal(first.status, 201);
  assert.equal((await first.json()).email, 'confirmed');
  const retry = await send(payload);
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).persisted, true);
  assert.equal(stored.size, 1);
  assert.equal(deliveries, 1);
  assert.equal((await send({ ...payload, message: 'Outro pedido com a mesma chave' })).status, 409);
});

test('upload verifica bytes e revisão, recupera resposta incerta e exclusão só confirma após R2', async () => {
  let row = {
    id: 'one',
    name: 'doc.pdf',
    mime_type: 'application/pdf',
    size: 8,
    object_key: 'official/one',
    revision: 1,
    state: 'pending',
    visibility: 'private',
    purpose: 'attachment',
  };
  let object = null,
    puts = 0,
    deletes = 0;
  const bucket = {
    put: async (key, bytes, options) => {
      puts++;
      if (object) return null;
      object = { size: bytes.length, customMetadata: options.customMetadata };
      return object;
    },
    head: async () => object,
    delete: async () => {
      deletes++;
      object = null;
    },
  };
  const api = load('managedFiles.js', (url, options) => {
    if (options.method === 'PATCH') {
      if (url.searchParams.get('revision') !== 'eq.' + row.revision) return Response.json([]);
      row = { ...row, ...JSON.parse(options.body) };
    }
    return Response.json([row]);
  });
  const configured = { ...env, OFFICIAL_FILES: bucket };
  const send = (revision) =>
    api.onRequest({
      request: new Request('https://test/api/admin/files?id=one', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer valid',
          'If-Match': String(revision),
          'Content-Type': 'application/pdf',
        },
        body: '%PDF-1.7',
      }),
      env: configured,
    });
  assert.equal((await send(0)).status, 409);
  assert.equal(puts, 0);
  const uploaded = await send(1);
  assert.equal(uploaded.status, 200);
  assert.equal(row.state, 'available');
  assert.equal(row.revision, 3);
  assert.equal(puts, 1);
  /* ----- Uma interrupção após gravar o objeto mantém uploading; repetir os mesmos bytes reconcilia sem sobrescrever. ----- */
  row = { ...row, state: 'uploading' };
  assert.equal((await send(3)).status, 200);
  assert.equal(row.state, 'available');
  const deleted = await api.onRequest({
    request: new Request('https://test/api/admin/files?id=one', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid',
        'If-Match': String(row.revision),
        'X-Confirm-Delete': 'true',
      },
    }),
    env: configured,
  });
  assert.equal(deleted.status, 200);
  assert.equal(row.state, 'deleted');
  assert.equal(deletes, 1);
});

test('migrações D1 executam em SQLite e manutenção remove somente registros vencidos', async () => {
  const { DatabaseSync } = require('node:sqlite'),
    fs = require('node:fs');
  const db = new DatabaseSync(':memory:');
  try {
    const dir = path.join(root, 'database/d1/migrations');
    for (const file of fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .sort())
      db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const table of [
      'admin_login_limits',
      'post_like_limits',
      'public_write_limits',
      'wally_rate_limits',
    ]) {
      const column = table === 'wally_rate_limits' ? 'requests' : 'attempts';
      db.prepare(
        'INSERT INTO ' + table + '(rate_key,' + column + ',expires_at) VALUES (?,?,?)',
      ).run('expired', 1, 1);
      db.prepare(
        'INSERT INTO ' + table + '(rate_key,' + column + ',expires_at) VALUES (?,?,?)',
      ).run('valid', 1, 4102444800);
    }
    const { runMaintenance } = loadContract(path.join(root, 'functions/_lib/maintenance.js'));
    await runMaintenance({
      WALLY_LIMITS_DB: {
        prepare: (sql) => ({ bind: (...args) => ({ sql, args }) }),
        batch: async (statements) => statements.map((x) => db.prepare(x.sql).run(...x.args)),
      },
    });
    for (const table of [
      'admin_login_limits',
      'post_like_limits',
      'public_write_limits',
      'wally_rate_limits',
    ])
      assert.deepEqual(
        db
          .prepare('SELECT rate_key FROM ' + table)
          .all()
          .map((x) => x.rate_key),
        ['valid'],
      );
  } finally {
    db.close();
  }
});

test('serviço público conserva a chave idempotente e serviço administrativo exige sessão', async () => {
  const calls = [];
  const api = loadContract(path.join(root, 'src/services/backendDomainService.js'), {
    fetch: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return Response.json({ requestId: 'one', persisted: true, email: 'not_sent' });
    },
  });
  const input = { idempotencyKey: 'request-1234567890123456', message: 'Mensagem' };
  await api.submitPrivateRequest(input);
  await api.submitPrivateRequest(input);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body.idempotencyKey, calls[1].body.idempotencyKey);
  await assert.rejects(api.getPrivateRequests(), (error) => error.code === 'UNAUTHENTICATED');
  assert.equal(calls.length, 2);
});

/* === Falhas de provedor, cancelamento e entradas inválidas === */
test('notificação incerta não confirma e não envia novamente em retry', async () => {
  let sends = 0;
  const api = loadContract(path.join(root, 'functions/_lib/requestNotification.js'), {
    Response,
    AbortSignal,
    fetch: async (url) => {
      if (String(url).includes('claim_request_notification')) return Response.json(true);
      if (String(url).includes('finish_request_notification')) return Response.json(true);
      sends++;
      throw Error('network interrupted');
    },
  });
  const configured = {
    ...env,
    EMAILJS_NOTIFICATIONS_ENABLED: 'true',
    EMAILJS_SERVICE_ID: 'service',
    EMAILJS_TEMPLATE_ID: 'template',
    EMAILJS_PUBLIC_KEY: 'public',
    EMAILJS_PRIVATE_KEY: 'secret',
  };
  assert.equal(
    await api.notifyPrivateRequest(configured, { id: 'one' }, { name: 'Pessoa' }, 'visitor'),
    'unknown',
  );
  assert.equal(
    await api.notifyPrivateRequest(
      configured,
      { id: 'one', email: 'unknown' },
      { name: 'Pessoa' },
      'visitor',
    ),
    'unknown',
  );
  assert.equal(sends, 1);
});

test('clima rejeita coordenadas inválidas e geocodificação cancelada não consulta rede', async () => {
  let calls = 0;
  const api = loadContract(path.join(root, 'src/services/weatherService.js'), {
    fetch: async () => {
      calls++;
      throw Error('unexpected network');
    },
  });
  for (const pair of [
    [NaN, 0],
    [91, 0],
    [0, -181],
  ])
    await assert.rejects(api.fetchWeatherData(...pair));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    api.searchWeatherCities('São Paulo', controller.signal),
    (error) => error.name === 'AbortError',
  );
  assert.equal(calls, 0);
});

test('JSON truncado ou UTF-8 inválido retorna erro de validação e não indisponibilidade', async () => {
  const { readBoundedJson } = loadContract(
    path.join(root, 'functions/_lib/publicWriteProtection.js'),
    { Uint8Array },
  );
  for (const body of ['{', new Uint8Array([255])])
    await assert.rejects(
      readBoundedJson(
        new Request('https://test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
      ),
      /INVALID_BODY/,
    );
});

test('consumidor de conteúdo preserva horário/fuso e mantém catálogo estático legado', async () => {
  const api = loadContract(
    path.join(root, 'src/services/contentService.js'),
    {
      Response,
      window: { location: { origin: 'https://test' } },
      fetch: async (url) =>
        Response.json({
          items: String(url).includes('kind=events')
            ? [
                {
                  id: 'event',
                  status: 'published',
                  data: {
                    title: 'Evento',
                    date: '2026-10-20',
                    allDay: false,
                    startsAt: '2026-10-20T13:00:00Z',
                    timezone: 'America/Sao_Paulo',
                  },
                },
              ]
            : [
                {
                  id: 'legacy',
                  status: 'published',
                  data: { title: 'Documento', url: 'documents/test.pdf' },
                },
              ],
        }),
    },
    { transformSource: (source) => source.replaceAll('import.meta.env.BASE_URL', "'/'") },
  );
  const events = await api.fetchManagedContent('events');
  assert.equal(events.data[0].allDay, false);
  assert.equal(events.data[0].timezone, 'America/Sao_Paulo');
  const files = await api.fetchManagedContent('files');
  assert.equal(files.data[0].id, 'legacy');
});

test('moderação de ranking exige administrador e confirma exatamente a linha removida', async () => {
  const hash = 'a'.repeat(64);
  const denied = load(
    'rankings.js',
    () => {
      throw Error('unexpected domain');
    },
    { admin: false },
  );
  assert.equal(
    (
      await denied.onRequest({
        request: req('api/admin/rankings'),
        env: { ...env, RANKINGS_ENABLED: 'true' },
      })
    ).status,
    403,
  );
  for (const actual of [hash, 'b'.repeat(64)]) {
    const api = load('rankings.js', (url, options) => {
      assert.equal(options.method, 'DELETE');
      assert.equal(url.searchParams.get('visitor_hash'), 'eq.' + hash);
      return Response.json([{ game: 'snake', visitor_hash: actual }]);
    });
    const response = await api.onRequest({
      request: req('api/admin/rankings', 'DELETE', {
        game: 'snake',
        visitorHash: hash,
        confirm: true,
      }),
      env: { ...env, RANKINGS_ENABLED: 'true' },
    });
    assert.equal(response.status, actual === hash ? 200 : 409);
  }
});

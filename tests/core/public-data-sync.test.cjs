const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');
const source = path.resolve(__dirname, '../../src/services/publicDataService.js');

/* === Cache, concorrência e compatibilidade === */
test('invalidação impede entrega e armazenamento de resposta anterior e inicia reconsulta independente', async () => {
  const pending = [];
  const api = loadContract(source, {
    fetch: () => new Promise((resolve) => pending.push(resolve)),
  });
  const first = api.requestPublicJson('/api/posts');
  const rejected = assert.rejects(first, (error) => error.code === 'PUBLIC_DATA_INVALIDATED');
  api.invalidatePublicData('/api/posts');
  const second = api.requestPublicJson('/api/posts');
  pending[1]({ ok: true, json: async () => ({ posts: ['new'] }) });
  assert.equal((await second).data.posts[0], 'new');
  pending[0]({ ok: true, json: async () => ({ posts: ['old'] }) });
  await rejected;
  assert.equal((await api.requestPublicJson('/api/posts')).data.posts[0], 'new');
});

test('TTL por categoria, revalidação e limite de dados antigos são explícitos', async () => {
  let now = 100000,
    calls = 0,
    unavailable = false;
  class Clock extends Date {
    static now() {
      return now;
    }
  }
  const api = loadContract(source, {
    Date: Clock,
    fetch: async () => {
      calls++;
      if (unavailable) throw Error('offline');
      return { ok: true, json: async () => ({ calls }) };
    },
  });
  await api.requestPublicJson('/weather', { category: 'weather' });
  now += 400000;
  assert.equal((await api.requestPublicJson('/weather', { category: 'weather' })).source, 'cache');
  assert.equal(calls, 1);
  now += 300000;
  unavailable = true;
  const old = await api.requestPublicJson('/weather', { category: 'weather' });
  assert.equal(old.cacheStatus, 'stale');
  assert.equal(old.requiresRevalidation, true);
  assert.match(old.warning, /salvos/);
  now += 86400000;
  await assert.rejects(
    api.requestPublicJson('/weather', { category: 'weather' }),
    (error) => error.code === 'HTTP_NETWORK_ERROR',
  );
});

test('envelopes novos e dados legados preservam a superfície data/source/updatedAt', async () => {
  const api = loadContract(source, {
    fetch: async (url) => ({
      ok: true,
      json: async () => (url === '/new' ? { ok: true, data: { posts: [] } } : { posts: [] }),
    }),
  });
  for (const key of ['/new', '/legacy']) {
    const result = await api.requestPublicJson(key);
    assert.equal(Array.isArray(result.data.posts), true);
    assert.equal(result.source, 'live');
    assert.equal(typeof result.updatedAt, 'number');
  }
});

/* === Transporte de sinais entre abas === */
test('BroadcastChannel invalida outra aba sem transportar dados ou tokens e limpa assinaturas', async () => {
  const channels = new Set(),
    messages = [];
  class Channel {
    constructor() {
      channels.add(this);
    }
    postMessage(value) {
      messages.push(value);
      for (const other of channels) if (other !== this) other.onmessage?.({ data: value });
    }
    close() {
      channels.delete(this);
    }
  }
  const bindings = {
    BroadcastChannel: Channel,
    window: { addEventListener() {}, removeEventListener() {}, localStorage: { setItem() {} } },
    fetch: async () => ({ ok: true, json: async () => ({ posts: ['public'] }) }),
  };
  const a = loadContract(source, bindings),
    b = loadContract(source, bindings);
  let updates = 0;
  const stopA = a.subscribePublicData(() => {}),
    stopB = b.subscribePublicData(() => updates++);
  await b.requestPublicJson('/api/posts');
  a.invalidatePublicData('/api/posts');
  assert.equal(updates, 1);
  assert.equal((await b.requestPublicJson('/api/posts')).source, 'live');
  assert.deepEqual(Object.keys(messages[0]).sort(), ['id', 'prefix']);
  a.invalidatePublicData('/api/private?token=secret');
  assert.equal(messages.length, 1);
  stopA();
  stopB();
  assert.equal(channels.size, 0);
});

test('fallback storage rejeita mensagens privadas e revalida somente sinais públicos conhecidos', () => {
  const listeners = new Map();
  const api = loadContract(source, {
    window: {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name) => listeners.delete(name),
    },
  });
  let updates = 0;
  const stop = api.subscribePublicData(() => updates++);
  const send = (data) =>
    listeners.get('storage')({
      key: 'ws-os:public-data-invalidated',
      newValue: JSON.stringify(data),
    });
  send({ id: 'one', prefix: '/api/admin/posts' });
  send({ id: 'two', prefix: '/api/posts', token: 'secret' });
  assert.equal(updates, 0);
  send({ id: 'three', prefix: '/api/posts' });
  send({ id: 'three', prefix: '/api/posts' });
  assert.equal(updates, 1);
  stop();
  assert.equal(listeners.size, 0);
});

/* === Escritas incertas e reconciliação === */
test('falha após envio de escrita exige reconciliação; cancelamento anterior não envia', async () => {
  const file = path.resolve(__dirname, '../../src/services/httpRequestContract.js');
  let sent = 0;
  const api = loadContract(file, {
    fetch: async () => {
      sent++;
      throw Error('offline');
    },
  });
  await assert.rejects(
    api.executeJsonRequest('/write', { method: 'POST' }, { operation: 'write' }),
    (error) => error.code === 'HTTP_RESULT_UNKNOWN' && error.requiresReconciliation,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    api.executeJsonRequest(
      '/write',
      { method: 'POST' },
      { operation: 'write', signal: controller.signal },
    ),
    (error) => error.code === 'HTTP_CANCELLED' && !error.requiresReconciliation,
  );
  assert.equal(sent, 1);
});
test('registro idempotente vincula operação e conteúdo sem registrar o corpo e reutiliza resultado', async () => {
  const api = loadContract(path.resolve(__dirname, '../../src/services/idempotencyContract.js'));
  const request = {
    key: '550e8400-e29b-41d4-a716-446655440000',
    operation: 'create-request',
    scope: 'contact',
  };
  const fingerprint = await api.createIdempotencyFingerprint({
    name: 'Example',
    message: 'Private',
  });
  assert.equal(
    fingerprint,
    await api.createIdempotencyFingerprint({ message: 'Private', name: 'Example' }),
  );
  const record = { request, fingerprint, state: 'completed', result: { id: 'one' } };
  assert.equal(api.resolveIdempotencyRecord(record, request, fingerprint).result.id, 'one');
  assert.equal(
    api.resolveIdempotencyRecord(record, request, 'a'.repeat(64)).code,
    'IDEMPOTENCY_KEY_CONFLICT',
  );
  assert.equal(
    api.resolveIdempotencyRecord({ ...record, state: 'unknown' }, request, fingerprint).action,
    'reconcile',
  );
  assert.doesNotMatch(JSON.stringify({ request, fingerprint }), /Private|Example/);
});

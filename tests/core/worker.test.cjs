const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const worker = () => import('../../worker/index.js').then((module) => module.default);
test('Worker roteia leituras preparadas e não retorna HTML da SPA para APIs', async () => {
  const app = await worker();
  for (const endpoint of ['posts', 'wakatime']) {
    const result = await app.fetch(new Request('https://ws.test/api/' + endpoint), {});
    assert.equal(result.status, 503);
    assert.match(result.headers.get('content-type'), /application\/json/);
  }
  const missing = await app.fetch(new Request('https://ws.test/api/missing'), {});
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
});
test('Worker recusa métodos incompatíveis e preserva entrega dos assets', async () => {
  const app = await worker();
  for (const [endpoint, method, allow] of [
    ['posts', 'POST', 'GET'],
    ['wakatime', 'DELETE', 'GET'],
    ['wally', 'GET', 'POST'],
  ]) {
    const response = await app.fetch(
      new Request('https://ws.test/api/' + endpoint, { method }),
      {},
    );
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), allow);
  }
  const response = await app.fetch(new Request('https://ws.test/'), {
    ASSETS: { fetch: () => new Response('shell') },
  });
  assert.equal(await response.text(), 'shell');
});
test('IA continua desativada antes de rede, Turnstile ou D1', async (t) => {
  const app = await worker();
  let calls = 0;
  t.mock.method(globalThis, 'fetch', () => {
    calls++;
    throw Error('external request forbidden');
  });
  const db = {
    prepare: () => {
      throw Error('D1 should not be consulted');
    },
  };
  const response = await app.fetch(
    new Request('https://ws.test/api/wally', { method: 'POST', body: '{}' }),
    { WALLY_AI_ENABLED: 'false', WALLY_LIMITS_DB: db },
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'AI_DISABLED');
  assert.equal(calls, 0);
  const config = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../wrangler.jsonc'), 'utf8'),
  );
  assert.equal(config.vars.WALLY_AI_ENABLED, 'false');
});

test('Worker real roteia novos domínios e métodos sem cair nos assets', async () => {
  const app = await worker();
  const routes = [
    ['requests', 'POST'],
    ['admin/requests', 'GET'],
    ['files', 'GET'],
    ['admin/files', 'GET'],
    ['posts/attachments', 'GET'],
    ['admin/attachments', 'POST'],
    ['admin/rankings', 'GET'],
  ];
  for (const [route, method] of routes) {
    const response = await app.fetch(new Request('https://test/api/' + route, { method }), {});
    assert.equal(response.status, 503, route);
    assert.match(response.headers.get('content-type'), /application\/json/);
    const wrong = await app.fetch(
      new Request('https://test/api/' + route, { method: 'OPTIONS' }),
      {},
    );
    assert.equal(wrong.status, 405, route);
    assert.ok(wrong.headers.get('allow'));
  }
});

/* === CABEÇALHOS DOS ASSETS E PRESERVAÇÃO DO CACHE === */
test('assets preservam corpo, status e cache e restringem incorporação do HTML', async () => {
  const app = await worker();
  for (const [type, status, body] of [
    ['text/html; charset=utf-8', 200, '<!doctype html>'],
    ['text/javascript', 200, 'export {};'],
    ['text/html', 304, null],
  ]) {
    const response = await app.fetch(new Request('https://ws.test/'), {
      ASSETS: {
        fetch: () =>
          new Response(body, {
            status,
            headers: {
              'Content-Type': type,
              'Cache-Control': 'public, max-age=60',
              ETag: 'test-version',
            },
          }),
      },
    });
    assert.equal(response.status, status);
    assert.equal(await response.text(), body ?? '');
    assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
    assert.equal(response.headers.get('etag'), 'test-version');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    if (type.startsWith('text/html')) {
      assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'self'/);
    } else {
      assert.equal(response.headers.get('content-security-policy'), null);
    }
  }
});

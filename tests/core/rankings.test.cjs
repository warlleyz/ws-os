const { test } = require('node:test');
const assert = require('node:assert/strict');
test('rankings permanecem desligados sem consumir serviços externos', async () => {
  const api = await import('../../functions/api/rankings.js');
  const response = await api.onRequest({
    request: new Request('https://test/api/rankings', { method: 'POST' }),
    env: {},
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'RANKINGS_DISABLED');
});
test('validação de rankings respeita jogos, limites e apelidos públicos', async () => {
  const { validateScore } = await import('../../functions/api/rankings.js');
  for (const input of [
    { game: 'snake', score: 398, alias: 'Teste' },
    { game: 'flappy', score: Infinity, alias: 'Teste' },
    { game: 'mines', score: 1, alias: 'Teste' },
    { game: 'snake', score: 2, alias: '<script>' },
    { game: 'snake', score: 2, alias: 'email@example.com' },
  ])
    assert.throws(() => validateScore(input));
  assert.equal(validateScore({ game: 'snake', score: 397, alias: 'Jogador' }).score, 397);
});
test('corpo público é limitado por stream e falha sem proteção configurada', async () => {
  const { readBoundedJson, protectPublicWrite } =
    await import('../../functions/_lib/publicWriteProtection.js');
  await assert.rejects(
    readBoundedJson(
      new Request('https://test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'x'.repeat(9000) }),
      }),
    ),
    /BODY_TOO_LARGE/,
  );
  await assert.rejects(
    protectPublicWrite(new Request('https://test'), {}, 'token', 'rankings'),
    /PROTECTION_UNAVAILABLE/,
  );
});
test('proteção pública limita antes do verificador e rejeita origem incompatível', async () => {
  const { protectPublicWrite } = await import('../../functions/_lib/publicWriteProtection.js');
  const env = {
    WALLY_LIMITS_DB: {
      prepare() {
        return {
          bind() {
            return { first: async () => null };
          },
        };
      },
    },
    PUBLIC_WRITE_HASH_SALT: 'test-salt',
    TURNSTILE_SECRET_KEY: 'test-secret',
  };
  const request = new Request('https://test/api/rankings', {
    headers: { 'CF-Connecting-IP': '192.0.2.1' },
  });
  await assert.rejects(protectPublicWrite(request, env, 'token', 'rankings'), /RATE_LIMITED/);
  await assert.rejects(
    protectPublicWrite(
      new Request('https://test', {
        headers: { Origin: 'https://other.test', 'CF-Connecting-IP': '192.0.2.1' },
      }),
      env,
      'token',
      'rankings',
    ),
    /INVALID_ORIGIN/,
  );
});

test('atualizar ranking após envio não cancela a própria operação nem mantém formulário bloqueado', async () => {
  const path = require('node:path');
  const { renderApp } = require('../helpers/app-ui.cjs');
  const { loadContract } = require('../helpers/contract-loader.cjs');
  const signals = [];
  const transport = loadContract(
    path.resolve(__dirname, '../../src/services/httpRequestContract.js'),
    {
      fetch: async (_url, options) => {
        signals.push(options.signal);
        return Response.json(
          options.method === 'POST'
            ? { accepted: true }
            : { scores: [{ alias: 'Player', score: 5 }] },
        );
      },
    },
  );
  const ui = await renderApp(
    'src/apps/games/GameRankings.jsx',
    { game: 'snake' },
    {
      ...transport,
      ...loadContract(path.resolve(__dirname, '../../src/services/publicContentContract.js')),
      __rankingsEnabled: 'true',
      useGameRecord: () => ({ record: 5 }),
      WallyTurnstile: 'Verification',
    },
  );
  ui.nodes()
    .find((n) => n.type === 'input')
    .props.onChange({ target: { value: 'Player' } });
  ui.nodes()
    .find((n) => n.type === 'Verification')
    .props.onTokenChange('token');
  ui.render();
  await ui
    .nodes()
    .find((n) => n.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  ui.render();
  assert.equal(signals.length, 2);
  assert.equal(signals[0].aborted, false);
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.disabled, false);
  assert.match(ui.text(), /Recorde enviado/);
  ui.unmount();
});

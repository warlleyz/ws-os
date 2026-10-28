
const { test } = require('node:test');
const assert = require('node:assert/strict');

/* === DISPONIBILIDADE DO RANKING === */
test('rankings permanecem desligados sem consumir serviços externos', async () => {
  const api = await import('../../functions/api/rankings.js');

  const response = await api.onRequest({
    request: new Request('https://test/api/rankings', { method: 'POST' }),
    env: {},
  });

  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'RANKINGS_DISABLED');
});

/* === VALIDAÇÃO DOS RESULTADOS === */
test('validação de rankings respeita jogos, limites e apelidos públicos', async () => {
  const { validateScore } = await import('../../functions/api/rankings.js');

  for (const input of [
    { game: 'snake', score: 398, alias: 'Teste' },
    { game: 'flappy', score: Infinity, alias: 'Teste' },
    { game: 'mines', score: 1, alias: 'Teste' },
    { game: 'snake', score: 2, alias: '<script>' },
    { game: 'snake', score: 2, alias: 'email@example.com' },
  ]) {
    assert.throws(() => validateScore(input));
  }

  assert.equal(
    validateScore({
      game: 'snake',
      score: 397,
      alias: 'Jogador',
    }).score,
    397,
  );
});

/* === PROTEÇÃO DO CORPO DA REQUISIÇÃO === */
test('corpo público é limitado por stream e falha sem proteção configurada', async () => {
  const {
    readBoundedJson,
    protectPublicWrite,
  } = await import('../../functions/_lib/publicWriteProtection.js');

  await assert.rejects(
    readBoundedJson(
      new Request('https://test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'x'.repeat(9000),
        }),
      }),
    ),
    /BODY_TOO_LARGE/,
  );

  await assert.rejects(
    protectPublicWrite(
      new Request('https://test'),
      {},
      'token',
      'rankings',
    ),
    /PROTECTION_UNAVAILABLE/,
  );
});

/* === PROTEÇÃO DE ORIGEM E LIMITE DE REQUISIÇÕES === */
test('proteção pública limita antes do verificador e rejeita origem incompatível', async () => {
  const { protectPublicWrite } =
    await import('../../functions/_lib/publicWriteProtection.js');

  const env = {
    WALLY_LIMITS_DB: {
      prepare() {
        return {
          bind() {
            return {
              first: async () => null,
            };
          },
        };
      },
    },
    PUBLIC_WRITE_HASH_SALT: 'test-salt',
    TURNSTILE_SECRET_KEY: 'test-secret',
  };

  const request = new Request('https://test/api/rankings', {
    headers: {
      'CF-Connecting-IP': '192.0.2.1',
    },
  });

  await assert.rejects(
    protectPublicWrite(request, env, 'token', 'rankings'),
    /RATE_LIMITED/,
  );

  await assert.rejects(
    protectPublicWrite(
      new Request('https://test', {
        headers: {
          Origin: 'https://other.test',
          'CF-Connecting-IP': '192.0.2.1',
        },
      }),
      env,
      'token',
      'rankings',
    ),
    /INVALID_ORIGIN/,
  );
});

/* === ENVIO E ATUALIZAÇÃO DA CLASSIFICAÇÃO === */
test('atualizar ranking após envio não cancela a própria operação nem mantém formulário bloqueado', async () => {
  const path = require('node:path');

  const { renderApp } = require('../helpers/app-ui.cjs');
  const { loadContract } = require('../helpers/contract-loader.cjs');

  const root = path.resolve(__dirname, '../..');
  const signals = [];

  /* ----- CONTRATO DE TRANSPORTE ----- */
  const transport = loadContract(
    path.join(root, 'src/services/httpRequestContract.js'),
    {
      fetch: async (_url, options) => {
        signals.push(options.signal);

        return Response.json(
          options.method === 'POST'
            ? { accepted: true }
            : {
              scores: [
                { alias: 'Player', score: 5 },
              ],
            },
        );
      },
    },
  );

  /* ----- CONTRATOS PÚBLICOS ----- */
  const publicContent = loadContract(
    path.join(root, 'src/services/publicContentContract.js'),
  );

  /* ----- CONFIGURAÇÃO REAL DO RANKING ----- */
  const rankingConfig = loadContract(
    path.join(root, 'src/apps/games/rankings/rankingConfig.js'),
    publicContent,
  );

  /* ----- MONTAGEM DO COMPONENTE ----- */
  const ui = await renderApp(
    'src/apps/games/rankings/GameRankings.jsx',
    { game: 'snake' },
    {
      ...transport,
      ...publicContent,
      ...rankingConfig,
      __rankingsEnabled: 'true',

      /* ----- SIMULAÇÃO DAS OPERAÇÕES DE REDE ----- */
      isPublicRankingEnabled: () => true,

      submitGameRanking: async ({ signal }) => {
        signals.push(signal);
        return { accepted: true };
      },

      fetchGameRanking: async (_gameId, signal) => {
        signals.push(signal);
        return [{ alias: 'Player', score: 5 }];
      },

      isValidRankingAlias: (alias) =>
        typeof alias === 'string' &&
        /^[\p{L}\p{N} _-]{2,24}$/u.test(alias.trim()),
      useGameRecord: () => ({
        record: 5,
        error: false,
      }),
      WallyTurnstile: 'Verification',
      Crown: 'Crown',
      Medal: 'Medal',
      ChevronDown: 'ChevronDown',
      ChevronUp: 'ChevronUp',
    },
  );

  try {
    /* ----- ABERTURA DO FORMULÁRIO ----- */
    const publishButton = ui.nodes().find(
      (node) =>
        node.type === 'button' &&
        ui.text(node).includes('Publicar meu recorde'),
    );

    assert.ok(
      publishButton,
      'Botão de publicação não encontrado',
    );

    publishButton.props.onClick();
    ui.render();

    /* ----- PREENCHIMENTO DO APELIDO ----- */
    const input = ui.nodes().find(
      (node) => node.type === 'input',
    );

    assert.ok(
      input,
      'Campo de apelido não encontrado',
    );

    input.props.onChange({
      target: { value: 'Player' },
    });

    /* ----- CONFIRMAÇÃO DO TURNSTILE ----- */
    const verification = ui.nodes().find(
      (node) => node.type === 'Verification',
    );

    assert.ok(
      verification,
      'Verificação não encontrada',
    );

    verification.props.onTokenChange('token');
    ui.render();

    /* ----- ENVIO DO RECORDE ----- */
    const form = ui.nodes().find(
      (node) => node.type === 'form',
    );

    assert.ok(
      form,
      'Formulário não encontrado',
    );

    form.props.onSubmit({
      preventDefault() { },
    });

    /* ----- AGUARDAR AS OPERAÇÕES ASSÍNCRONAS ----- */
    await ui.flush();
    await ui.flush();

    /* ----- VERIFICAÇÕES ----- */
    assert.equal(signals.length, 2);
    assert.equal(signals[0].aborted, false);

    const updatedInput = ui.nodes().find(
      (node) => node.type === 'input',
    );

    assert.equal(updatedInput.props.disabled, false);
    assert.match(ui.text(), /Recorde enviado/);
  } finally {
    ui.unmount();
  }
});

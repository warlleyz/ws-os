const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');
const root = path.resolve(__dirname, '../..');

/* === VISIBILIDADE E MINIMIZAÇÃO === */
test('jogos suspendem ao ocultar a aba ou minimizar e removem o observador ao desmontar', async () => {
  const { renderApp } = require('../helpers/app-ui.cjs');
  const events = new Map();
  const document = { hidden: false, addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: (name) => events.delete(name) };
  const instance = { executionState: 'running' };
  const ui = await renderApp('src/apps/games/shared/useGamePaused.js', instance, { document });
  assert.equal(ui.render(), false);
  document.hidden = true;
  events.get('visibilitychange')();
  assert.equal(ui.render(), true);
  document.hidden = false;
  events.get('visibilitychange')();
  assert.equal(ui.render(), false);
  instance.executionState = 'paused';
  assert.equal(ui.render(), true);
  ui.unmount();
  assert.equal(events.size, 0);
});

/* === ISOLAMENTO DO TECLADO === */
test('atalhos respeitam controles, modificadores, menus e janela ativa', async () => {
  const { canHandleGameKey } = await import('../../src/apps/games/shared/gameKeyboard.js');
  let active = true;
  const body = {};
  const inside = { closest: () => null };
  const board = {
    ownerDocument: { body },
    closest: (selector) => selector === '.desktop-window'
      ? { classList: { contains: () => active } }
      : { contains: (target) => target === inside },
  };
  assert.equal(canHandleGameKey({ target: body }, board, false), true);
  assert.equal(canHandleGameKey({ target: inside }, board, false), true);
  for (const flag of ['defaultPrevented', 'repeat', 'isComposing', 'ctrlKey', 'altKey', 'metaKey'])
    assert.equal(canHandleGameKey({ target: inside, [flag]: true }, board, false), false);
  assert.equal(canHandleGameKey({ target: inside }, board, true), false);
  assert.equal(canHandleGameKey({ target: { closest: () => ({}) } }, board, false), false);
  assert.equal(canHandleGameKey({ target: { closest: () => null } }, board, false), false);
  active = false;
  assert.equal(canHandleGameKey({ target: inside }, board, false), false);
});

/* === MEMÓRIA: PARTIDA COMPLETA === */
test('Memória vence em oito pares e não permite jogadas após a vitória ou durante pausa', async () => {
  const model = await import('../../src/apps/games/memory/memoryModel.js');
  let game = model.startMemoryGame(model.createMemoryGame(() => 0.5));
  const paused = model.pauseMemoryGame(game);
  assert.equal(model.revealMemoryCard(paused, game.cards[0].id), paused);
  for (const technology of model.MEMORY_TECHNOLOGIES) {
    const pair = game.cards.filter((card) => card.technology === technology);
    game = model.revealMemoryCard(game, pair[0].id);
    assert.equal(model.revealMemoryCard(game, pair[0].id), game);
    game = model.revealMemoryCard(game, pair[1].id);
  }
  assert.equal(game.status, 'won');
  assert.equal(game.moves, 8);
  assert.equal(model.getMemoryPairsFound(game), 8);
  assert.equal(model.revealMemoryCard(game, game.cards[0].id), game);
  assert.equal(model.createMemoryGame().moves, 0);
});

/* === CAMPO MINADO: VITÓRIA, DERROTA E TEMPO === */
test('Campo Minado encerra por vitória ou mina e congela o tempo fora da partida', async () => {
  const m = await import('../../src/apps/games/mines/minesModel.js');
  let game = m.revealMineCell(m.startMinesGame(m.createMinesGame()), '0:0', () => 0.5);
  const lost = m.revealMineCell(game, Object.values(game.cells).find((cell) => cell.mine).id);
  assert.equal(lost.status, 'gameover');
  assert.equal(m.advanceMinesTime(lost), lost);
  const paused = m.pauseMinesGame(game);
  assert.equal(m.advanceMinesTime(paused), paused);
  assert.equal(m.revealMineCell(paused, '1:1'), paused);
  for (const cell of Object.values(game.cells).filter((cell) => !cell.mine))
    game = m.revealMineCell(game, cell.id);
  assert.equal(game.status, 'won');
  assert.equal(m.getMinesProgress(game), 100);
  assert.equal(m.advanceMinesTime(game), game);
});

/* === SNAKE: LIMITE MÁXIMO DO TABULEIRO === */
test('Snake preenche a última célula, atinge 397 pontos e encerra sem gerar comida', async () => {
  const m = await import('../../src/apps/games/snake/snakeModel.js');
  const snake = [];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) if (x !== 19 || y !== 0) snake.push({ x, y });
  const head = snake.findIndex((cell) => cell.x === 18 && cell.y === 0);
  [snake[0], snake[head]] = [snake[head], snake[0]];
  const state = { ...m.startSnakeGame(m.createSnakeGame()), snake, score: 396,
    foods: [{ x: 19, y: 0, id: 'react' }], direction: 'right', nextDirection: 'right' };
  const won = m.advanceSnakeGame(state);
  assert.equal(won.status, 'won');
  assert.equal(won.score, 397);
  assert.equal(won.snake.length, 400);
  assert.equal(won.foods.length, 0);
  assert.equal(m.advanceSnakeGame(won), won);
});

/* === FLAPPY: PONTUAÇÃO E PAUSA === */
test('Flappy conta cada obstáculo uma vez e não avança quando pausado', async () => {
  const m = await import('../../src/apps/games/flappy/flappyModel.js');
  let game = { ...m.startFlappyGame(m.createFlappyGame()), birdY: 230, velocity: 0,
    pipes: [{ id: 0, x: -10, topHeight: 150, counted: false }] };
  game = m.advanceFlappyGame(game, 1 / 60, () => 0.5);
  assert.equal(game.score, 1);
  assert.equal(m.advanceFlappyGame(game, 1 / 60).score, 1);
  const paused = m.pauseFlappyGame(game);
  assert.equal(m.advanceFlappyGame(paused, 1 / 60), paused);
  assert.equal(m.flapBird(paused), paused);
});

/* === PACIÊNCIA: FINALIZAÇÃO E REINÍCIO === */
test('Paciência completa a última base e não movimenta após vencer', async () => {
  const m = await import('../../src/apps/games/solitaire/solitaireModel.js');
  const card = (suit, rank) => ({ id: `${suit}-${rank}`, suit, rank,
    color: ['hearts', 'diamonds'].includes(suit) ? 'red' : 'black', faceUp: true });
  const foundations = m.SOLITAIRE_SUITS.map((suit, index) =>
    Array.from({ length: index === 3 ? 12 : 13 }, (_, n) => card(suit, n + 1)));
  const king = card('spades', 13);
  const game = { ...m.startSolitaireGame(m.createSolitaireGame()), foundations,
    tableau: Array.from({ length: 7 }, () => []), stock: [], waste: [king] };
  const won = m.moveSolitaireCards(game, { type: 'waste', index: 0 }, { type: 'foundation', index: 3 }, king.id);
  assert.equal(won.status, 'won');
  assert.equal(m.getSolitaireFoundationCount(won), 52);
  assert.equal(m.drawSolitaireCard(won), won);
  assert.equal(m.createSolitaireGame().status, 'ready');
});

/* === RANKING: PROVEDORES CONTROLADOS === */
function rankingApi({ storedScore = null, storedAlias = 'Player', aliasTaken = false, failRead = false } = {}) {
  const calls = [], rows = new Map();
  const api = loadContract(path.join(root, 'functions/api/rankings.js'), {
    Response, Request, Headers, AbortSignal, Uint8Array,
    fetch: async (address, options = {}) => {
      const url = new URL(address);
      if (url.hostname === 'challenges.cloudflare.com')
        return Response.json({ success: true, hostname: 'ws.test', action: 'public-write' });
      if (url.pathname.endsWith('/rpc/submit_game_score')) {
        const input = JSON.parse(options.body);
        calls.push(input);
        if (aliasTaken) return Response.json({ code: '23505', message: 'game_scores_game_alias_unique' }, { status: 409 });
        rows.set(input.target_visitor, { alias: storedScore === null ? input.target_alias : storedAlias,
          score: storedScore ?? input.target_score });
        return Response.json(null);
      }
      if (failRead) return Response.json({}, { status: 503 });
      return Response.json([rows.get(url.searchParams.get('visitor_hash').slice(3))]);
    },
  });
  const env = { RANKINGS_ENABLED: 'true', SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service', TURNSTILE_SECRET_KEY: 'secret', PUBLIC_WRITE_HASH_SALT: 'salt',
    WALLY_LIMITS_DB: { prepare: () => ({ bind: () => ({ first: async () => ({ attempts: 1 }) }) }) } };
  const submit = (visitorId = 'a'.repeat(32), ip = '192.0.2.1') => api.onRequest({ env,
    request: new Request('https://ws.test/api/rankings', { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
      body: JSON.stringify({ visitorId, game: 'snake', alias: 'Player', score: 5, turnstileToken: 'token' }) }) });
  return { calls, submit };
}

test('ranking distingue navegadores no mesmo IP e mantém identidade ao trocar de rede', async () => {
  const api = rankingApi();
  assert.deepEqual(await (await api.submit()).json(), { accepted: true, score: 5 });
  await api.submit('b'.repeat(32));
  await api.submit('a'.repeat(32), '192.0.2.2');
  assert.notEqual(api.calls[0].target_visitor, api.calls[1].target_visitor);
  assert.equal(api.calls[0].target_visitor, api.calls[2].target_visitor);
  assert.equal((await api.submit('invalid')).status, 400);
  assert.equal(api.calls.length, 3);
});

test('ranking só confirma resultado persistido e trata conflito de apelido e pontuação', async () => {
  assert.equal((await rankingApi({ aliasTaken: true }).submit()).status, 409);
  const unchanged = await rankingApi({ storedScore: 9, storedAlias: 'Other' }).submit();
  assert.equal(unchanged.status, 409);
  assert.equal((await unchanged.json()).error, 'SCORE_NOT_IMPROVED');
  const existing = await rankingApi({ storedScore: 9 }).submit();
  assert.equal((await existing.json()).score, 9);
  assert.equal((await rankingApi({ storedScore: 3 }).submit()).status, 503);
  assert.equal((await rankingApi({ failRead: true }).submit()).status, 503);
});

/* === TRANSPORTE DO NAVEGADOR === */
test('cliente envia identidade estável e rejeita confirmação sem pontuação persistida', async () => {
  let payload = { accepted: true, score: 7 };
  let status = 201;
  const sent = [];
  const storage = new Map();
  const service = loadContract(path.join(root, 'src/apps/games/rankings/rankingService.js'), {
    Response, AbortSignal,
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    fetch: async (_url, options) => {
      sent.push(JSON.parse(options.body));
      return Response.json(payload, { status });
    },
  }, { transformSource: (source) => source.replaceAll('import.meta.env.VITE_RANKINGS_ENABLED', "'true'") });
  const input = { gameId: 'snake', alias: 'Player', score: 5, turnstileToken: 'token' };
  assert.equal((await service.submitGameRanking(input)).score, 7);
  await service.submitGameRanking(input);
  assert.match(sent[0].visitorId, /^[a-f0-9]{32}$/);
  assert.equal(sent[0].visitorId, sent[1].visitorId);
  for (const invalid of [{ accepted: true }, { accepted: true, score: 4 }, { accepted: true, score: 398 }]) {
    payload = invalid;
    await assert.rejects(service.submitGameRanking(input), /RANKING_UNCONFIRMED/);
  }
  status = 409;
  for (const code of ['ALIAS_TAKEN', 'SCORE_NOT_IMPROVED']) {
    payload = { error: code };
    await assert.rejects(service.submitGameRanking(input), new RegExp(code));
  }
  status = 429;
  payload = { error: 'RATE_LIMITED' };
  await assert.rejects(service.submitGameRanking(input), (error) => error.definitive === true);
});

/* === MODERAÇÃO PAGINADA === */
test('moderação pagina a partir do offset e exige autorização', async () => {
  const calls = [];
  const rows = Array.from({ length: 100 }, (_, index) => ({ game: 'snake', visitor_hash: 'a'.repeat(64),
    alias: `Player ${index}`, score: 5, created_at: '2026-11-08T00:00:00Z' }));
  const api = loadContract(path.join(root, 'functions/api/rankings.js'), {
    Response, Request, Headers, AbortSignal,
    fetch: async (address) => {
      const url = new URL(address);
      if (url.pathname === '/auth/v1/user') return Response.json({ id: 'admin' });
      if (url.pathname === '/rest/v1/admin_users') return Response.json([{ user_id: 'admin' }]);
      calls.push(url);
      return Response.json(rows);
    },
  });
  const env = { RANKINGS_ENABLED: 'true', SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' };
  const response = await api.onRequest({ env, request: new Request('https://ws.test/api/admin/rankings?offset=100',
    { headers: { Authorization: 'Bearer admin' } }) });
  const payload = await response.json();
  assert.equal(payload.scores.length, 100);
  assert.equal(payload.nextOffset, 200);
  assert.equal(calls[0].searchParams.get('offset'), '100');
  assert.equal((await api.onRequest({ env, request: new Request('https://ws.test/api/admin/rankings') })).status, 401);
  assert.equal(calls.length, 1);
});

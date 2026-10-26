const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderApp } = require('../helpers/app-ui.cjs');
const { loadContract } = require('../helpers/contract-loader.cjs');
const root = path.resolve(__dirname, '../..');
const models = loadContract(path.join(root, 'src/apps/games/gameModels.js'));
function timers() {
  let next = 0;
  const entries = new Map();
  return {
    entries,
    set: (callback) => {
      entries.set(++next, callback);
      return next;
    },
    clear: (id) => entries.delete(id),
    fire: (time = 0, once = false) => {
      const [id, callback] = entries.entries().next().value;
      if (once) entries.delete(id);
      callback(time);
    },
  };
}
const recordBinding = () => ({ record: null, error: false });

/* === CADA JOGO EXERCITADO PELOS SEUS HANDLERS === */
test('Snake consome curvas em passos distintos e cancela relógio ao pausar/desmontar', async () => {
  const clock = timers(),
    requested = [],
    props = { paused: false };
  const ui = await renderApp('src/apps/games/SnakeGame.jsx', props, {
    ...models,
    useGameRecord: recordBinding,
    setInterval: clock.set,
    clearInterval: clock.clear,
    stepSnake: (state, direction, random) => {
      requested.push(direction);
      return models.stepSnake(state, direction, random);
    },
  });
  ui.button('Iniciar').props.onClick();
  ui.render();
  const board = () => ui.nodes().find((n) => n.props.className === 'ws-snake');
  const key = (value) =>
    board().props.onKeyDown({ key: value, preventDefault() {}, stopPropagation() {} });
  key('W');
  key('a');
  clock.fire();
  ui.render();
  clock.fire();
  ui.render();
  assert.deepEqual(requested, ['up', 'left']);
  key('d');
  clock.fire();
  ui.render();
  assert.equal(requested.at(-1), 'left');
  props.paused = true;
  ui.render();
  assert.equal(clock.entries.size, 0);
  assert.equal(ui.button('Novo jogo').props.disabled, true);
  props.paused = false;
  ui.render();
  assert.equal(clock.entries.size, 1);
  ui.unmount();
  assert.equal(clock.entries.size, 0);
});

test('Snake termina na colisão e reinicia com relógio parado', async () => {
  const clock = timers();
  let finished = false;
  const ui = await renderApp(
    'src/apps/games/SnakeGame.jsx',
    { paused: false },
    {
      ...models,
      newSnake: () => ({
        ...models.newSnake(),
        body: [
          { x: 14, y: 7 },
          { x: 13, y: 7 },
          { x: 12, y: 7 },
        ],
      }),
      useGameRecord: (_id, _score, over) => {
        finished = over;
        return recordBinding();
      },
      setInterval: clock.set,
      clearInterval: clock.clear,
    },
  );
  ui.button('Iniciar').props.onClick();
  ui.render();
  clock.fire();
  ui.render();
  assert.equal(finished, true);
  assert.equal(clock.entries.size, 0);
  ui.button('Novo jogo').props.onClick();
  ui.render();
  assert.equal(finished, false);
  assert.equal(clock.entries.size, 0);
  ui.unmount();
});

test('Memória bloqueia terceiro clique, suspende resolução em pausa e conclui pares', async () => {
  const clock = timers(),
    props = { paused: false };
  let finished = false,
    score = 0;
  const ui = await renderApp('src/apps/games/MemoryGame.jsx', props, {
    shuffled: (values) => values,
    useGameRecord: (_id, value, won) => {
      finished = won;
      score = value;
      return recordBinding();
    },
    setTimeout: clock.set,
    clearTimeout: clock.clear,
  });
  const cards = () =>
    ui.nodes().filter((n) => n.type === 'button' && n.props['aria-label']?.startsWith('Carta'));
  const flip = (i) => {
    cards()[i].props.onClick();
    ui.render();
  };
  flip(0);
  flip(1);
  assert.equal(cards()[2].props.disabled, true);
  props.paused = true;
  ui.render();
  assert.equal(clock.entries.size, 0);
  props.paused = false;
  ui.render();
  clock.fire(0, true);
  ui.render();
  assert.equal(cards()[0].props.children[0], '?');
  ui.button('Novo jogo').props.onClick();
  ui.render();
  for (let i = 0; i < 8; i++) {
    flip(i);
    flip(i + 8);
  }
  assert.equal(finished, true);
  assert.equal(score, 8);
  assert.match(ui.text(), /Você venceu/);
  ui.unmount();
});

test('Campo Minado mantém abertura segura, bandeiras, fim e reinício', async () => {
  const props = { paused: false };
  const ui = await renderApp('src/apps/games/MinesGame.jsx', props, {
    ...models,
    useGameRecord: recordBinding,
  });
  const cells = () =>
    ui.nodes().filter((n) => n.type === 'button' && n.props['aria-label']?.startsWith('Casa'));
  cells()[0].props.onContextMenu({ preventDefault() {} });
  ui.render();
  assert.doesNotMatch(ui.text(), /⚑/);
  cells()[0].props.onClick();
  ui.render();
  assert.equal(cells()[0].props.disabled, true);
  assert.doesNotMatch(ui.text(), /Fim de jogo/);
  const closed = cells().find((n) => !n.props.disabled);
  closed.props.onContextMenu({ preventDefault() {} });
  ui.render();
  assert.match(ui.text(), /⚑/);
  props.paused = true;
  ui.render();
  assert.ok(cells().every((n) => n.props.disabled));
  props.paused = false;
  ui.render();
  ui.button('Novo jogo').props.onClick();
  ui.render();
  assert.ok(cells().every((n) => !n.props.disabled));
  ui.unmount();
});

test('Flappy não repete salto com Espaço mantido e retoma sem acumular tempo oculto', async () => {
  const clock = timers(),
    props = { paused: false },
    deltas = [];
  const ui = await renderApp('src/apps/games/FlappyGame.jsx', props, {
    ...models,
    useGameRecord: recordBinding,
    requestAnimationFrame: clock.set,
    cancelAnimationFrame: clock.clear,
    stepFlappy: (state, delta, random) => {
      deltas.push(delta);
      return models.stepFlappy(state, delta, random);
    },
  });
  const board = () => ui.nodes().find((n) => n.props.role === 'group');
  const space = (repeat) => {
    board().props.onKeyDown({ code: 'Space', repeat, preventDefault() {}, stopPropagation() {} });
    ui.render();
  };
  space(true);
  assert.equal(clock.entries.size, 0);
  space(false);
  assert.equal(clock.entries.size, 1);
  clock.fire(100, true);
  ui.render();
  props.paused = true;
  ui.render();
  assert.equal(clock.entries.size, 0);
  props.paused = false;
  ui.render();
  clock.fire(100000, true);
  ui.render();
  assert.deepEqual(deltas, [0, 0]);
  ui.button('Novo jogo').props.onClick();
  ui.render();
  assert.equal(clock.entries.size, 0);
  ui.unmount();
});

test('Paciência move para base, desfaz e bloqueia ações em pausa', async () => {
  const props = { paused: false };
  let moves = 0;
  const initial = {
    tableau: [[], [], [], [], [], [], []],
    stock: [],
    waste: [{ id: 1, rank: 1, suit: 0, faceUp: true }],
    foundations: [[], [], [], []],
    moves: 0,
  };
  const ui = await renderApp('src/apps/games/SolitaireGame.jsx', props, {
    ...models,
    newSolitaire: () => initial,
    useGameRecord: (_id, value) => {
      moves = value;
      return recordBinding();
    },
  });
  const button = (prefix) =>
    ui.nodes().find((n) => n.type === 'button' && ui.text(n).trim().startsWith(prefix));
  button('Descarte').props.onClick();
  ui.render();
  button('Base').props.onClick();
  ui.render();
  assert.equal(moves, 1);
  props.paused = true;
  ui.render();
  assert.equal(ui.button('Desfazer').props.disabled, true);
  props.paused = false;
  ui.render();
  ui.button('Desfazer').props.onClick();
  ui.render();
  assert.equal(moves, 0);
  ui.button('Novo jogo').props.onClick();
  ui.render();
  assert.equal(ui.button('Desfazer').props.disabled, true);
  ui.unmount();
});

/* === PERSISTÊNCIA E MESCLAGEM ENTRE INSTÂNCIAS/ABAS === */
function recordsTab(storage) {
  const events = new Map();
  let fail = false;
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      if (fail) throw Error('quota');
      storage.set(key, value);
    },
  };
  const source = fs
    .readFileSync(path.join(root, 'src/apps/games/gameRecords.js'), 'utf8')
    .replace(/^import[^;]+;\s*/m, '')
    .replace(/\bexport\s+/g, '');
  const api = vm.runInNewContext(
    '(()=>{' + source + ';return {subscribe,saveGameRecord,useGameRecord};})()',
    {
      localStorage,
      window: {
        addEventListener: (key, callback) => events.set(key, callback),
        removeEventListener: (key) => events.delete(key),
      },
      useEffect() {},
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
  );
  const remove = api.subscribe(() => {});
  return {
    ...api,
    events,
    remove,
    fail: (value) => {
      fail = value;
    },
    sync: (value) =>
      events.get('storage')({
        key: 'ws-os:game-records',
        newValue: value,
        storageArea: localStorage,
      }),
  };
}
test('recordes mesclam jogos e melhores marcas, recuperam quota e respeitam limpeza', () => {
  const storage = new Map(),
    a = recordsTab(storage),
    b = recordsTab(storage);
  a.saveGameRecord('snake', 5);
  b.saveGameRecord('flappy', 3);
  a.sync('changed');
  assert.equal(a.useGameRecord('flappy', 0, false).record, 3);
  a.fail(true);
  assert.equal(a.saveGameRecord('snake', 9), false);
  assert.equal(a.useGameRecord('snake', 0, false).error, true);
  a.fail(false);
  assert.equal(a.saveGameRecord('snake', 8), true);
  b.sync('changed');
  assert.equal(b.useGameRecord('snake', 0, false).record, 9);
  a.saveGameRecord('memory', 12);
  b.saveGameRecord('memory', 10);
  a.sync('changed');
  assert.equal(a.useGameRecord('memory', 0, false).record, 10);
  storage.clear();
  a.sync(null);
  assert.equal(a.useGameRecord('snake', 0, false).record, null);
  assert.equal(storage.size, 0);
  a.remove();
  b.remove();
  assert.equal(a.events.size, 0);
  assert.equal(b.events.size, 0);
});

/* === RANKING: CONFIRMAÇÃO, VALIDAÇÃO E RETRY EXPLÍCITO === */
async function ranking(fetchMock, enabled = 'true') {
  const transport = loadContract(path.join(root, 'src/services/httpRequestContract.js'), {
    fetch: fetchMock,
  });
  const ui = await renderApp(
    'src/apps/games/GameRankings.jsx',
    { game: 'snake' },
    {
      ...transport,
      ...loadContract(path.join(root, 'src/services/publicContentContract.js')),
      __rankingsEnabled: enabled,
      useGameRecord: () => ({ record: 5 }),
      WallyTurnstile: 'verification',
    },
  );
  const fill = () => {
    ui.nodes()
      .find((n) => n.type === 'input')
      .props.onChange({ target: { value: 'Pessoa teste' } });
    ui.nodes()
      .find((n) => n.type === 'verification')
      .props.onTokenChange('test-token');
    ui.render();
  };
  const submit = async () => {
    await ui
      .nodes()
      .find((n) => n.type === 'form')
      .props.onSubmit({ preventDefault() {} });
    ui.render();
  };
  return { ...ui, fill, submit };
}
test('ranking desligado não consulta rede e projeções inválidas não são exibidas', async () => {
  let calls = 0;
  const off = await ranking(async () => {
    calls++;
    throw Error('unexpected');
  }, 'false');
  assert.equal(off.nodes().length, 0);
  assert.equal(calls, 0);
  off.unmount();
  const ui = await ranking(async () =>
    Response.json({ scores: [{ alias: 'Teste', score: 9999, visitorHash: 'private' }] }),
  );
  await ui.button('Atualizar ranking').props.onClick();
  ui.render();
  assert.match(ui.text(), /Ranking indisponível/);
  assert.doesNotMatch(ui.text(), /9999/);
  ui.unmount();
});
test('ranking só confirma accepted e preserva payload após resultado incerto e rejeição posterior', async () => {
  const bodies = [];
  let sends = 0;
  const ui = await ranking(async (_url, options) => {
    if (options.method === 'POST') {
      bodies.push(JSON.parse(options.body));
      sends++;
      if (sends === 1) return Response.json({});
      if (sends === 2) return Response.json({ error: 'verification' }, { status: 403 });
      return Response.json({ accepted: true }, { status: 201 });
    }
    return Response.json({ scores: [] });
  });
  ui.fill();
  await ui.submit();
  assert.doesNotMatch(ui.text(), /Recorde enviado/);
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.readOnly, true);
  ui.fill();
  await ui.submit();
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.readOnly, true);
  ui.fill();
  await ui.submit();
  assert.match(ui.text(), /Recorde enviado/);
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.readOnly, false);
  assert.equal(bodies.length, 3);
  assert.ok(bodies.every((body) => body.alias === 'Pessoa teste' && body.score === 5));
  ui.unmount();
});

test('recordes inválidos de zero jogadas não bloqueiam futuras vitórias', () => {
  const storage = new Map([
      ['ws-os:game-records', JSON.stringify({ memory: 0, mines: 0, solitaire: 0, snake: 0 })],
    ]),
    tab = recordsTab(storage);
  assert.equal(tab.useGameRecord('memory', 0, false).record, null);
  assert.equal(tab.saveGameRecord('memory', 0), false);
  tab.saveGameRecord('memory', 8);
  assert.equal(tab.useGameRecord('memory', 0, false).record, 8);
  tab.remove();
});

test('cancelar leitura do ranking libera o transporte ao desmontar', async () => {
  let signal;
  const ui = await ranking(async (_url, options) => {
    signal = options.signal;
    return new Promise((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }),
    );
  });
  const loading = ui.button('Atualizar ranking').props.onClick();
  ui.unmount();
  await loading;
  assert.equal(signal.aborted, true);
});

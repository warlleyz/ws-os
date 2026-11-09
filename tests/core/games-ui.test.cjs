
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { renderApp } = require('../helpers/app-ui.cjs');
const { loadContract } = require('../helpers/contract-loader.cjs');

const root = path.resolve(__dirname, '../..');

/* === CATÁLOGO DOS CINCO JOGOS === */
const GAME_COMPONENTS = [
  {
    id: 'snake',
    name: 'Snake',
    component: 'snake/SnakeGame.jsx',
    model: 'snake/snakeModel.js',
    className: 'ws-snake',
  },
  {
    id: 'memory',
    name: 'Memória',
    component: 'memory/MemoryGame.jsx',
    model: 'memory/memoryModel.js',
    className: 'ws-memory-game',
  },
  {
    id: 'mines',
    name: 'Campo Minado',
    component: 'mines/MinesGame.jsx',
    model: 'mines/minesModel.js',
    className: 'ws-mines-game',
  },
  {
    id: 'flappy',
    name: 'Flappy Bird',
    component: 'flappy/FlappyGame.jsx',
    model: 'flappy/flappyModel.js',
    className: 'ws-flappy-game__layout',
  },
  {
    id: 'solitaire',
    name: 'Paciência',
    component: 'solitaire/SolitaireGame.jsx',
    model: 'solitaire/solitaireModel.js',
    className: 'ws-solitaire-game',
  },
];

/* === AMBIENTE CONTROLADO DO NAVEGADOR === */
function createBrowserMock() {
  let nextId = 0;

  const timers = new Map();
  const listeners = new Map();

  return {
    timers,
    listeners,

    setTimeout(callback) {
      const id = ++nextId;
      timers.set(id, callback);
      return id;
    },

    clearTimeout(id) {
      timers.delete(id);
    },

    setInterval(callback) {
      const id = ++nextId;
      timers.set(id, callback);
      return id;
    },

    clearInterval(id) {
      timers.delete(id);
    },

    requestAnimationFrame(callback) {
      const id = ++nextId;
      timers.set(id, callback);
      return id;
    },

    cancelAnimationFrame(id) {
      timers.delete(id);
    },

    addEventListener(event, callback) {
      listeners.set(event, callback);
    },

    removeEventListener(event, callback) {
      if (listeners.get(event) === callback) {
        listeners.delete(event);
      }
    },
  };
}

/* === MONTAGEM DOS COMPONENTES REAIS === */
async function mountGame(definition, paused = false) {
  const base = path.join(root, 'src/apps/games');
  const componentPath = path.join(base, definition.component);

  const source = fs.readFileSync(componentPath, 'utf8');
  const icons = {};

  for (const match of source.matchAll(
    /\b(?:Si|Fa|Arrow|Pause|Play|RotateCcw|Trophy|Zap|Bomb|Flag|Layers3)[A-Za-z0-9]*\b/g,
  )) {
    icons[match[0]] = match[0];
  }

  const browser = createBrowserMock();
  const headerUpdates = [];

  const model = loadContract(
    path.join(base, definition.model),
  );

  const props = {
    paused,
    onHeaderChange: (value) => headerUpdates.push(value),
  };

  const ui = await renderApp(
    `src/apps/games/${definition.component}`,
    props,
    {
      ...model,
      ...loadContract(path.join(base, 'shared/gameKeyboard.js')),
      ...icons,
      memo: (component) => component,
      window: browser,
      useGameRecord: () => ({
        record: null,
        error: false,
      }),
    },
  );

  return {
    ui,
    props,
    browser,
    headerUpdates,
  };
}

/* === TESTES DE MONTAGEM E SUSPENSÃO === */
for (const definition of GAME_COMPONENTS) {
  test(`${definition.name} inicia, pausa, suspende e reinicia sem manter recursos ativos`, async () => {
    const { ui, props, browser, headerUpdates } = await mountGame(definition);
    const actions = () => headerUpdates.at(-1).actions.props;
    try {
      actions().onStart();
      ui.render();
      assert.equal(headerUpdates.at(-1).status, 'JOGANDO');
      if (definition.id === 'mines') {
        const cell = ui.nodes().find((node) => node.props.cell?.id === '0:0');
        cell.props.onReveal('0:0');
        ui.render();
      }
      if (definition.id === 'memory') {
        const cards = ui.nodes().filter((node) => node.props.card?.technology);
        cards[0].props.onReveal(cards[0].props.card.id);
        ui.render();
        const other = cards.find((node) => node.props.card.technology !== cards[0].props.card.technology);
        other.props.onReveal(other.props.card.id);
        ui.render();
      }
      if (definition.id !== 'solitaire') assert.ok(browser.timers.size > 0);
      actions().onPause();
      ui.render();
      assert.equal(headerUpdates.at(-1).status, 'PAUSADO');
      assert.equal(browser.timers.size, 0);
      actions().onStart();
      ui.render();
      props.paused = true;
      ui.render();
      assert.equal(headerUpdates.at(-1).status, 'SUSPENSO');
      assert.equal(browser.timers.size, 0);
      props.paused = false;
      ui.render();
      actions().onRestart();
      ui.render();
      assert.equal(headerUpdates.at(-1).status, 'PRONTO');
      assert.equal(browser.timers.size, 0);
    } finally {
      ui.unmount();
    }
    assert.equal(browser.listeners.size, 0);
    assert.equal(browser.timers.size, 0);
  });

  test(`${definition.name} monta sua interface sem erros`, async () => {
    const { ui } = await mountGame(definition);

    try {
      assert.ok(
        ui.nodes().some(
          (node) =>
            typeof node.props.className === 'string' &&
            node.props.className.includes(definition.className),
        ),
        `Interface de ${definition.name} não encontrada`,
      );
    } finally {
      ui.unmount();
    }
  });

  test(`${definition.name} aceita suspensão pelo aplicativo`, async () => {
    const { ui, props } = await mountGame(definition);

    try {
      props.paused = true;
      assert.doesNotThrow(() => ui.render());

      props.paused = false;
      assert.doesNotThrow(() => ui.render());
    } finally {
      ui.unmount();
    }
  });
}

/* === CONTRATOS DE RANKING === */
const publicContent = loadContract(
  path.join(root, 'src/services/publicContentContract.js'),
);

const rankingConfig = loadContract(
  path.join(root, 'src/apps/games/rankings/rankingConfig.js'),
  publicContent,
);

/* === ARMAZENAMENTO SIMULADO POR ABA === */
function recordsTab(storage) {
  const events = new Map();
  let fail = false;

  const localStorage = {
    getItem(key) {
      return storage.get(key) ?? null;
    },

    setItem(key, value) {
      if (fail) {
        throw new Error('quota');
      }

      storage.set(key, value);
    },
  };

  const window = {
    localStorage,

    addEventListener(key, callback) {
      events.set(key, callback);
    },

    removeEventListener(key) {
      events.delete(key);
    },
  };

  /* === EXPORTAÇÃO EXCLUSIVA PARA TESTES === */
  const api = loadContract(
    path.join(root, 'src/apps/games/rankings/gameRecords.js'),
    {
      ...publicContent,
      ...rankingConfig,
      window,
      useEffect() { },
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    {
      transformSource(source, filename) {
        if (!filename.endsWith('gameRecords.js')) {
          return source;
        }

        return source
          .replace(
            /import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*/g,
            '',
          )
          .replace(
            'function subscribe(listener) {',
            'export function subscribe(listener) {',
          );
      },
    },
  );

  const remove = api.subscribe(() => { });

  return {
    ...api,
    events,
    remove,

    fail(value) {
      fail = value;
    },

    sync(newValue) {
      const callback = events.get('storage');

      assert.ok(
        callback,
        'Observador de armazenamento não registrado',
      );

      callback({
        key: 'ws-os:game-records',
        newValue,
        storageArea: localStorage,
      });
    },
  };
}

/* === PERSISTÊNCIA E SINCRONIZAÇÃO DOS RECORDES === */
test('recordes preservam melhores marcas entre abas', () => {
  const storage = new Map();

  const first = recordsTab(storage);
  const second = recordsTab(storage);

  try {
    assert.equal(first.saveGameRecord('snake', 5), true);

    second.sync(storage.get('ws-os:game-records'));

    assert.equal(
      second.getGameRecord('snake'),
      5,
    );

    assert.equal(second.saveGameRecord('snake', 8), true);

    first.sync(storage.get('ws-os:game-records'));

    assert.equal(
      first.getGameRecord('snake'),
      8,
    );

    /* ----- PONTUAÇÃO MENOR NÃO SUBSTITUI A MELHOR ----- */
    assert.equal(first.saveGameRecord('snake', 3), true);
    assert.equal(first.getGameRecord('snake'), 8);

    /* ----- JOGOS COM ORDEM CRESCENTE ----- */
    assert.equal(first.saveGameRecord('memory', 12), true);
    assert.equal(first.saveGameRecord('memory', 10), true);

    assert.equal(first.getGameRecord('memory'), 10);
  } finally {
    first.remove();
    second.remove();
  }

  assert.equal(first.events.size, 0);
  assert.equal(second.events.size, 0);
});

/* === FALHA DE PERSISTÊNCIA === */
test('recordes dos cinco jogos sobrevivem ao recarregamento e podem ser limpos entre abas', () => {
  const storage = new Map();
  const first = recordsTab(storage);
  const scores = { snake: 7, flappy: 3, memory: 8, mines: 12, solitaire: 80 };
  for (const [game, score] of Object.entries(scores)) assert.equal(first.saveGameRecord(game, score), true);
  first.remove();
  const reloaded = recordsTab(storage);
  try {
    for (const [game, score] of Object.entries(scores)) assert.equal(reloaded.getGameRecord(game), score);
    storage.delete('ws-os:game-records');
    reloaded.sync(null);
    for (const game of Object.keys(scores)) assert.equal(reloaded.getGameRecord(game), null);
  } finally {
    reloaded.remove();
  }
});

test('recordes sinalizam falha de armazenamento sem perder a sessão', () => {
  const storage = new Map();
  const tab = recordsTab(storage);

  try {
    tab.fail(true);

    assert.equal(tab.saveGameRecord('snake', 9), false);

    assert.equal(
      tab.useGameRecord('snake', 0, false).error,
      true,
    );

    /* ----- RECUPERAÇÃO DO ARMAZENAMENTO ----- */
    tab.fail(false);

    assert.equal(tab.saveGameRecord('snake', 9), true);

    assert.equal(
      tab.useGameRecord('snake', 0, false).error,
      false,
    );

    assert.equal(tab.getGameRecord('snake'), 9);
  } finally {
    tab.remove();
  }
});

/* === VALIDAÇÃO DE RECORDES === */
test('recordes inválidos não substituem pontuações válidas', () => {
  const storage = new Map([
    [
      'ws-os:game-records',
      JSON.stringify({
        memory: 0,
        mines: -1,
        solitaire: 0,
        snake: 0,
      }),
    ],
  ]);

  const tab = recordsTab(storage);

  try {
    assert.equal(tab.getGameRecord('memory'), null);
    assert.equal(tab.getGameRecord('mines'), null);
    assert.equal(tab.getGameRecord('solitaire'), null);

    assert.equal(tab.saveGameRecord('memory', 0), false);
    assert.equal(tab.saveGameRecord('memory', 8), true);

    assert.equal(tab.getGameRecord('memory'), 8);
  } finally {
    tab.remove();
  }
});

/* === CONFIGURAÇÃO DOS RANKINGS === */
test('ranking público é permitido apenas para jogos configurados', () => {
  assert.equal(
    rankingConfig.supportsPublicRanking('snake'),
    true,
  );

  assert.equal(
    rankingConfig.supportsPublicRanking('flappy'),
    true,
  );

  for (const game of ['memory', 'mines', 'solitaire']) {
    assert.equal(
      rankingConfig.supportsPublicRanking(game),
      false,
    );
  }

  assert.equal(
    rankingConfig.supportsPublicRanking('doom'),
    false,
  );

  assert.equal(
    rankingConfig.supportsPublicRanking('wolfenstein'),
    false,
  );
});

/* === LIMITES E ORDENAÇÃO DOS RECORDES === */
test('rankings respeitam pontuações e critérios de comparação', () => {
  assert.equal(
    rankingConfig.isValidRankingScore('snake', 1),
    true,
  );

  assert.equal(
    rankingConfig.isValidRankingScore('snake', -1),
    false,
  );

  assert.equal(
    rankingConfig.isValidRankingScore('memory', 0),
    false,
  );

  assert.equal(
    rankingConfig.isBetterRankingScore('snake', 10, 5),
    true,
  );

  assert.equal(
    rankingConfig.isBetterRankingScore('snake', 3, 5),
    false,
  );

  assert.equal(
    rankingConfig.isBetterRankingScore('memory', 8, 12),
    true,
  );

  assert.equal(
    rankingConfig.isBetterRankingScore('memory', 15, 12),
    false,
  );
});

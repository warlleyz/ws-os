
/* === TESTES DOS MOTORES DOS JOGOS === */
const { test } = require('node:test');
const assert = require('node:assert/strict');

/* === CARREGAMENTO DOS MOTORES ATUAIS === */
const snake = () => import('../../src/apps/games/snake/snakeModel.js');
const mines = () => import('../../src/apps/games/mines/minesModel.js');
const flappy = () => import('../../src/apps/games/flappy/flappyModel.js');
const solitaire = () => import('../../src/apps/games/solitaire/solitaireModel.js');

/* === SNAKE === */
test('Snake inicia com três segmentos e duas tecnologias', async () => {
  const { createSnakeGame } = await snake();
  const state = createSnakeGame(() => 0.5);

  assert.equal(state.snake.length, 3);
  assert.equal(state.foods.length, 2);
  assert.equal(state.status, 'ready');
  assert.equal(state.score, 0);
});

test('Snake bloqueia inversão e permite curvas válidas', async () => {
  const {
    createSnakeGame,
    changeSnakeDirection,
    startSnakeGame,
    advanceSnakeGame,
  } = await snake();

  let state = startSnakeGame(createSnakeGame(() => 0.5));

  assert.equal(
    changeSnakeDirection(state, 'left'),
    state,
  );

  state = changeSnakeDirection(state, 'up');

  assert.equal(state.nextDirection, 'up');

  state = advanceSnakeGame(state, () => 0.5);

  assert.equal(state.direction, 'up');
  assert.equal(state.status, 'playing');
});

test('Snake detecta colisão com a borda', async () => {
  const {
    createSnakeGame,
    startSnakeGame,
    advanceSnakeGame,
  } = await snake();

  const initial = startSnakeGame(createSnakeGame(() => 0.5));

  const state = {
    ...initial,
    snake: [
      { x: 19, y: 5 },
      { x: 18, y: 5 },
      { x: 17, y: 5 },
    ],
    direction: 'right',
    nextDirection: 'right',
  };

  const result = advanceSnakeGame(state);

  assert.equal(result.status, 'gameover');
});

/* === CAMPO MINADO === */
test('Campo Minado cria 81 células e protege o primeiro clique', async () => {
  const {
    createMinesGame,
    startMinesGame,
    revealMineCell,
  } = await mines();

  const initial = startMinesGame(createMinesGame());
  const result = revealMineCell(initial, '0:0', () => 0.5);

  assert.equal(Object.keys(result.cells).length, 81);
  assert.equal(result.cells['0:0'].mine, false);
  assert.equal(result.cells['0:0'].revealed, true);
  assert.equal(result.initialized, true);

  const mineCount = Object.values(result.cells)
    .filter((cell) => cell.mine).length;

  assert.equal(mineCount, 10);
});

test('Campo Minado alterna bandeiras e rejeita células inválidas', async () => {
  const {
    createMinesGame,
    startMinesGame,
    toggleMineFlag,
    revealMineCell,
  } = await mines();

  const initial = startMinesGame(createMinesGame());

  assert.equal(toggleMineFlag(initial, '9:9'), initial);
  assert.equal(revealMineCell(initial, '9:9'), initial);

  const marked = toggleMineFlag(initial, '0:0');

  assert.equal(marked.cells['0:0'].flagged, true);
  assert.equal(marked.flags, 1);
  assert.equal(revealMineCell(marked, '0:0'), marked);

  const unmarked = toggleMineFlag(marked, '0:0');

  assert.equal(unmarked.cells['0:0'].flagged, false);
  assert.equal(unmarked.flags, 0);
});

/* === FLAPPY BIRD === */
test('Flappy limita o delta e detecta colisão com o chão', async () => {
  const {
    FLAPPY_CONFIG,
    createFlappyGame,
    startFlappyGame,
    advanceFlappyGame,
  } = await flappy();

  const initial = startFlappyGame(createFlappyGame(() => 0.5));

  const advanced = advanceFlappyGame(initial, 10, () => 0.5);

  assert.ok(advanced.elapsed <= FLAPPY_CONFIG.maxDelta);
  assert.equal(advanced.status, 'playing');

  const nearGround = {
    ...initial,
    birdY: FLAPPY_CONFIG.height -
      FLAPPY_CONFIG.groundHeight -
      FLAPPY_CONFIG.birdRadius,
    velocity: 100,
  };

  assert.equal(
    advanceFlappyGame(nearGround, 1 / 60).status,
    'gameover',
  );
});

/* === PACIÊNCIA === */
test('Paciência distribui 52 cartas sem duplicações', async () => {
  const { createSolitaireGame } = await solitaire();

  const state = createSolitaireGame(() => 0.5);

  const cards = [
    ...state.stock,
    ...state.tableau.flat(),
  ];

  assert.equal(cards.length, 52);
  assert.equal(new Set(cards.map((card) => card.id)).size, 52);

  assert.deepEqual(
    state.tableau.map((column) => column.length),
    [1, 2, 3, 4, 5, 6, 7],
  );

  assert.ok(
    state.tableau.every((column) => column.at(-1).faceUp),
  );
});

test('Paciência compra cartas e só aceita Ás em base vazia', async () => {
  const {
    createSolitaireGame,
    startSolitaireGame,
    drawSolitaireCard,
    moveSolitaireCards,
  } = await solitaire();

  const initial = startSolitaireGame(
    createSolitaireGame(() => 0.5),
  );

  const drawn = drawSolitaireCard(initial);

  assert.equal(drawn.stock.length, 23);
  assert.equal(drawn.waste.length, 1);
  assert.equal(drawn.moves, 1);

  const ace = {
    id: 'spades-1',
    rank: 1,
    suit: 'spades',
    color: 'black',
    faceUp: true,
  };

  const king = {
    id: 'spades-13',
    rank: 13,
    suit: 'spades',
    color: 'black',
    faceUp: true,
  };

  const state = {
    ...initial,
    tableau: [[], [], [], [], [], [], []],
    stock: [],
    waste: [king],
    foundations: [[], [], [], []],
  };

  assert.equal(
    moveSolitaireCards(
      state,
      { type: 'waste', index: 0 },
      { type: 'foundation', index: 0 },
      king.id,
    ),
    state,
  );

  const valid = {
    ...state,
    waste: [ace],
  };

  const moved = moveSolitaireCards(
    valid,
    { type: 'waste', index: 0 },
    { type: 'foundation', index: 0 },
    ace.id,
  );

  assert.equal(moved.foundations[0].length, 1);
  assert.equal(moved.waste.length, 0);
  assert.equal(moved.moves, 1);
});

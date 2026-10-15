const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function models() {
  const source = fs
    .readFileSync(path.join(root, 'src/apps/games/gameModels.js'), 'utf8')
    .replace(/\bexport\s+/g, '');
  return vm.runInNewContext(
    `(()=>{${source};return {shuffled,newSnake,stepSnake,mineNeighbors,newMinefield,revealMinefield,flagMinefield,newFlappy,stepFlappy,newSolitaire,drawSolitaire,moveSolitaire}})()`,
  );
}
test('embaralhamento por semente preserva todos os itens e é reproduzível', () => {
  const m = models(),
    items = Array.from({ length: 16 }, (_, i) => i);
  assert.deepEqual(Array.from(m.shuffled(items, 42)), Array.from(m.shuffled(items, 42)));
  assert.deepEqual(
    Array.from(m.shuffled(items, 42)).sort((a, b) => a - b),
    items,
  );
});
test('Snake não inverte a direção, cresce ao comer e termina na borda', () => {
  const m = models();
  let state = m.newSnake(0.1);
  const head = state.body[0];
  state = { ...state, food: { x: head.x + 1, y: head.y } };
  const grown = m.stepSnake(state, 'left', 0.3);
  assert.equal(grown.direction, 'right');
  assert.equal(grown.score, 1);
  assert.equal(grown.body.length, 4);
  const wall = {
    ...state,
    body: [
      { x: 14, y: 1 },
      { x: 13, y: 1 },
      { x: 12, y: 1 },
    ],
  };
  assert.equal(m.stepSnake(wall, 'right').over, true);
});
test('Snake permite ocupar a célula liberada pela cauda', () => {
  const m = models();
  const state = {
    size: 4,
    direction: 'up',
    body: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
      { x: 0, y: 1 },
    ],
    food: { x: 3, y: 3 },
    score: 0,
    over: false,
  };
  assert.equal(m.stepSnake(state, 'left').over, false);
});
test('Campo Minado preserva primeira abertura segura e alterna bandeiras', () => {
  const m = models();
  let state = m.newMinefield(0, 123);
  assert.equal(state.mines.length, 10);
  assert.equal(state.mines.includes(0), false);
  assert.equal(m.mineNeighbors(0).length, 3);
  state = m.flagMinefield(state, 5);
  assert.ok(state.flags.includes(5));
  assert.equal(m.revealMinefield(state, 5), state);
  state = m.flagMinefield(state, 5);
  assert.equal(state.flags.length, 0);
  assert.equal(m.revealMinefield(state, state.mines[0]).over, true);
});
test('Campo Minado vence ao revelar todas as casas seguras', () => {
  const m = models();
  let state = m.newMinefield(0, 2);
  for (let i = 0; i < 64; i++) if (!state.mines.includes(i)) state = m.revealMinefield(state, i);
  assert.equal(state.won, true);
  assert.equal(state.opened.length, 54);
});
test('voo limita delta após pausa e detecta chão e obstáculos', () => {
  const m = models();
  const initial = m.newFlappy();
  assert.ok(m.stepFlappy(initial, 10).y < 0.51);
  assert.equal(m.stepFlappy({ ...initial, y: 0.98 }, 0.05).over, true);
  assert.equal(
    m.stepFlappy({ ...initial, y: 0.1, pipes: [{ id: 1, x: 0.2, gap: 0.7, passed: false }] }, 0.01)
      .over,
    true,
  );
  assert.equal(
    m.stepFlappy({ ...initial, pipes: [{ id: 1, x: 0, gap: 0.5, passed: false }] }, 0.01).score,
    1,
  );
});
test('Paciência distribui 52 cartas sem duplicações e compra uma por vez', () => {
  const m = models();
  const state = m.newSolitaire(123);
  const cards = [...state.stock, ...state.tableau.flat()];
  assert.equal(cards.length, 52);
  assert.equal(new Set(cards.map((card) => card.id)).size, 52);
  assert.deepEqual(Array.from(state.tableau.map((pile) => pile.length)), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(state.tableau.every((pile) => pile.at(-1).faceUp));
  const drawn = m.drawSolitaire(state);
  assert.equal(drawn.stock.length, 23);
  assert.equal(drawn.waste.length, 1);
  assert.equal(state.waste.length, 0);
});
test('Paciência aplica cores/ranks e só aceita ases em base vazia', () => {
  const m = models();
  const redSeven = { id: 1, rank: 7, suit: 1, faceUp: true },
    blackSix = { id: 2, rank: 6, suit: 0, faceUp: true },
    ace = { id: 3, rank: 1, suit: 0, faceUp: true };
  const state = {
    tableau: [[redSeven], [blackSix], [], [], [], [], []],
    stock: [],
    waste: [ace],
    foundations: [[], [], [], []],
    moves: 0,
  };
  const moved = m.moveSolitaire(
    state,
    { kind: 'tableau', column: 1, index: 0 },
    { kind: 'tableau', column: 0 },
  );
  assert.equal(moved.tableau[0].length, 2);
  assert.equal(state.tableau[0].length, 1);
  assert.equal(
    m.moveSolitaire(
      state,
      { kind: 'tableau', column: 1, index: 0 },
      { kind: 'foundation', column: 0 },
    ),
    null,
  );
  assert.equal(
    m.moveSolitaire(state, { kind: 'waste' }, { kind: 'foundation', column: 0 }).foundations[0]
      .length,
    1,
  );
});

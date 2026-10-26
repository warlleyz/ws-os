export function shuffled(values, seed) {
  const next = [...values];
  let state = seed >>> 0 || 1;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function foodFor(body, size, random) {
  const occupied = new Set(body.map((cell) => cell.y * size + cell.x));
  const free = Array.from({ length: size * size }, (_, i) => i).filter((i) => !occupied.has(i));
  if (!free.length) return null;
  const index = free[Math.min(free.length - 1, Math.floor(Math.max(0, random) * free.length))];
  return { x: index % size, y: Math.floor(index / size) };
}
export function mineNeighbors(index, size = 8) {
  const result = [];
  const x = index % size,
    y = Math.floor(index / size);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if ((dx || dy) && x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size)
        result.push((y + dy) * size + x + dx);
  return result;
}
export function newMinefield(first, seed) {
  const mines = shuffled(
    Array.from({ length: 64 }, (_, i) => i).filter((i) => i !== first),
    seed,
  ).slice(0, 10);
  return { mines, opened: [], flags: [], over: false, won: false, moves: 0 };
}
export function revealMinefield(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= 64) return state;
  if (state.over || state.flags.includes(index) || state.opened.includes(index)) return state;
  if (state.mines.includes(index)) return { ...state, over: true, moves: state.moves + 1 };
  const opened = new Set(state.opened),
    pending = [index];
  while (pending.length) {
    const cell = pending.pop();
    if (opened.has(cell) || state.flags.includes(cell) || state.mines.includes(cell)) continue;
    opened.add(cell);
    if (!mineNeighbors(cell).some((next) => state.mines.includes(next)))
      pending.push(...mineNeighbors(cell));
  }
  const won = opened.size === 54;
  return { ...state, opened: [...opened], won, over: won, moves: state.moves + 1 };
}
export function flagMinefield(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= 64) return state;
  if (state.over || state.opened.includes(index)) return state;
  return {
    ...state,
    flags: state.flags.includes(index)
      ? state.flags.filter((cell) => cell !== index)
      : state.flags.length < 10
        ? [...state.flags, index]
        : state.flags,
  };
}
export function newFlappy() {
  return { y: 0.5, velocity: 0, pipes: [], elapsed: 0, nextId: 0, score: 0, over: false };
}
export function stepFlappy(state, delta, random = 0.5) {
  if (state.over) return state;
  const dt = Math.min(0.05, Math.max(0, delta)),
    velocity = state.velocity + 1.2 * dt,
    y = state.y + velocity * dt;
  let score = state.score,
    elapsed = state.elapsed + dt,
    nextId = state.nextId;
  const pipes = state.pipes
    .map((pipe) => {
      const x = pipe.x - dt * 0.27;
      const passed = pipe.passed || x + 0.12 < 0.2;
      if (passed && !pipe.passed) score++;
      return { ...pipe, x, passed };
    })
    .filter((pipe) => pipe.x > -0.15);
  if (elapsed >= 1.7) {
    elapsed = 0;
    pipes.push({
      id: nextId++,
      x: 1.05,
      gap: 0.28 + Math.max(0, Math.min(1, random)) * 0.44,
      passed: false,
    });
  }
  const over =
    y < 0.03 ||
    y > 0.97 ||
    pipes.some(
      (pipe) =>
        pipe.x < 0.235 &&
        pipe.x + 0.12 > 0.165 &&
        (y - 0.03 < pipe.gap - 0.18 || y + 0.03 > pipe.gap + 0.18),
    );
  return { y, velocity, pipes, elapsed, nextId, score, over };
}
export function newSolitaire(seed) {
  const cards = shuffled(
    Array.from({ length: 52 }, (_, i) => ({
      id: i,
      rank: (i % 13) + 1,
      suit: Math.floor(i / 13),
      faceUp: false,
    })),
    seed,
  );
  const tableau = Array.from({ length: 7 }, (_, i) =>
    cards.splice(0, i + 1).map((card, index) => ({ ...card, faceUp: index === i })),
  );
  return { tableau, stock: cards, waste: [], foundations: [[], [], [], []], moves: 0 };
}
export function drawSolitaire(state) {
  if (!state.stock.length && !state.waste.length) return state;
  if (!state.stock.length)
    return {
      ...state,
      stock: [...state.waste].reverse().map((card) => ({ ...card, faceUp: false })),
      waste: [],
      moves: state.moves + 1,
    };
  return {
    ...state,
    stock: state.stock.slice(0, -1),
    waste: [...state.waste, { ...state.stock.at(-1), faceUp: true }],
    moves: state.moves + 1,
  };
}
export function moveSolitaire(state, from, to) {
  if (!from || !to || (from.kind === to.kind && from.column === to.column)) return null;
  const next = {
    ...state,
    tableau: state.tableau.map((pile) => [...pile]),
    stock: [...state.stock],
    waste: [...state.waste],
    foundations: state.foundations.map((pile) => [...pile]),
    moves: state.moves + 1,
  };
  const source =
    from.kind === 'tableau'
      ? next.tableau[from.column]
      : from.kind === 'waste'
        ? next.waste
        : from.kind === 'foundation'
          ? next.foundations[from.column]
          : null;
  const target =
    to.kind === 'tableau'
      ? next.tableau[to.column]
      : to.kind === 'foundation'
        ? next.foundations[to.column]
        : null;
  if (!source?.length || !target) return null;
  const index = from.kind === 'tableau' ? from.index : source.length - 1;
  if (!Number.isInteger(index) || index < 0 || index >= source.length) return null;
  const cards = source.slice(index);
  if (cards.some((card) => !card.faceUp)) return null;
  for (let i = 1; i < cards.length; i++)
    if (cards[i - 1].rank !== cards[i].rank + 1 || cards[i - 1].suit % 2 === cards[i].suit % 2)
      return null;
  const card = cards[0];
  if (to.kind === 'foundation') {
    if (cards.length !== 1 || card.suit !== to.column || card.rank !== target.length + 1)
      return null;
  } else {
    const last = target.at(-1);
    if (last ? last.rank !== card.rank + 1 || last.suit % 2 === card.suit % 2 : card.rank !== 13)
      return null;
  }
  source.splice(index);
  if (from.kind === 'tableau' && source.length)
    source[source.length - 1] = { ...source.at(-1), faceUp: true };
  target.push(...cards);
  return next;
}

/* === Snake tecnológico: variante da V1 === */

export const SNAKE_TECHNOLOGIES = [
  'java',
  'javascript',
  'python',
  'html',
  'css',
  'docker',
  'git',
  'spring',
];

const SNAKE_TECH_SIZE = 20;

function snakeTechRandom(value) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(0.999999999, Math.max(0, value));
}

function nextSnakeTechnology(random) {
  const index = Math.floor(snakeTechRandom(random) * SNAKE_TECHNOLOGIES.length);

  return SNAKE_TECHNOLOGIES[index];
}

function createSnakeTechFood(body, foods, size, positionRandom, technologyRandom) {
  const occupied = [...body, ...foods];
  const position = foodFor(occupied, size, snakeTechRandom(positionRandom));

  if (!position) return null;

  return {
    ...position,
    technology: nextSnakeTechnology(technologyRandom),
  };
}

export function newTechSnake(random = Math.random()) {
  const size = SNAKE_TECH_SIZE;

  const body = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];

  return {
    size,
    body,
    direction: 'right',
    foods: [
      { x: 14, y: 10, technology: nextSnakeTechnology(random) },
      {
        x: 5,
        y: 5,
        technology: nextSnakeTechnology((random + 0.37) % 1),
      },
    ],
    score: 0,
    over: false,
    won: false,
  };
}

export function stepTechSnake(
  state,
  requested,
  positionRandom = Math.random(),
  technologyRandom = Math.random(),
) {
  if (state.over) return state;

  const previous = directions[state.direction];
  const candidate = directions[requested] ?? previous;

  const reversed = candidate[0] === -previous[0] && candidate[1] === -previous[1];

  const vector = reversed ? previous : candidate;

  const direction = Object.keys(directions).find(
    (key) => directions[key][0] === vector[0] && directions[key][1] === vector[1],
  );

  const head = {
    x: state.body[0].x + vector[0],
    y: state.body[0].y + vector[1],
  };

  const eatenIndex = state.foods.findIndex((food) => food.x === head.x && food.y === head.y);

  const eating = eatenIndex !== -1;

  const collisionBody = eating ? state.body : state.body.slice(0, -1);

  const collided =
    head.x < 0 ||
    head.y < 0 ||
    head.x >= state.size ||
    head.y >= state.size ||
    collisionBody.some((segment) => segment.x === head.x && segment.y === head.y);

  if (collided) {
    return { ...state, over: true, won: false };
  }

  const body = [head, ...state.body];

  if (!eating) body.pop();

  let foods = state.foods;

  if (eating) {
    foods = foods.filter((_, index) => index !== eatenIndex);

    const replacement = createSnakeTechFood(
      body,
      foods,
      state.size,
      positionRandom,
      technologyRandom,
    );

    if (replacement) foods = [...foods, replacement];
  }

  const won = body.length === state.size * state.size;

  return {
    ...state,
    body,
    direction,
    foods,
    score: state.score + (eating ? 1 : 0),
    over: won,
    won,
  };
}

/* === Compatibilidade com os testes da versão anterior === */

export function newSnake(random = 0.5, size = 15) {
  const state = newTechSnake(random);

  return {
    ...state,
    size,
    food: state.foods[0],
  };
}

export function stepSnake(state, direction, random = 0.5) {
  // Compatibilidade temporária: manter separada da mecânica nova.
  return stepTechSnake(state, direction, random, random);
}
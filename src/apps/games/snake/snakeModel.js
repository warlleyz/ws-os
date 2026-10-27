/* === CONFIGURAÇÃO DO SNAKE === */
export const SNAKE_CONFIG = Object.freeze({
    columns: 20,
    rows: 20,
    initialLength: 3,
    foodCount: 2,
    initialSpeed: 165,
    minimumSpeed: 85,
    speedIncrement: 3,
    pointsPerItem: 1,
});

/* === DIREÇÕES DE MOVIMENTO === */
export const SNAKE_DIRECTIONS = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 }),
    right: Object.freeze({ x: 1, y: 0 }),
});

/* === TECNOLOGIAS COLETÁVEIS === */
export const SNAKE_TECHNOLOGIES = Object.freeze([
    'javascript',
    'typescript',
    'react',
    'nodejs',
    'html',
    'css',
    'python',
    'java',
    'spring',
    'mongodb',
    'mysql',
    'postgresql',
    'docker',
    'git',
    'github',
    'linux',
    'cplusplus',
    'go',
    'rust',
    'kotlin',
]);

/* === COMPARAÇÃO DE POSIÇÕES === */
function isSamePosition(first, second) {
    return first.x === second.x && first.y === second.y;
}

/* === LIMITES DO TABULEIRO === */
function isInsideBoard(position) {
    return (
        position.x >= 0 &&
        position.x < SNAKE_CONFIG.columns &&
        position.y >= 0 &&
        position.y < SNAKE_CONFIG.rows
    );
}

/* === COMPARAÇÃO DE DIREÇÕES === */
function isOppositeDirection(current, next) {
    return (
        current.x + next.x === 0 &&
        current.y + next.y === 0
    );
}

/* === SELEÇÃO DE ÍNDICES ALEATÓRIOS === */
function randomIndex(length, random) {
    if (length <= 0) {
        return -1;
    }

    const value = random();

    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.min(
        length - 1,
        Math.max(0, Math.floor(value * length)),
    );
}

/* === CONSULTA DAS POSIÇÕES LIVRES === */
function getFreePositions(snake, foods = []) {
    const occupied = new Set();

    for (const segment of snake) {
        occupied.add(`${segment.x}:${segment.y}`);
    }

    for (const food of foods) {
        occupied.add(`${food.x}:${food.y}`);
    }

    const available = [];

    for (let y = 0; y < SNAKE_CONFIG.rows; y += 1) {
        for (let x = 0; x < SNAKE_CONFIG.columns; x += 1) {
            if (!occupied.has(`${x}:${y}`)) {
                available.push({ x, y });
            }
        }
    }

    return available;
}

/* === GERAÇÃO DE TECNOLOGIAS === */
function createTechnology(snake, foods = [], random = Math.random) {
    const available = getFreePositions(snake, foods);

    if (!available.length) {
        return null;
    }

    const position = available[
        randomIndex(available.length, random)
    ];

    const id = SNAKE_TECHNOLOGIES[
        randomIndex(SNAKE_TECHNOLOGIES.length, random)
    ];

    return {
        x: position.x,
        y: position.y,
        id,
    };
}

/* === GERAÇÃO DOS ITENS INICIAIS === */
function createInitialFoods(snake, random = Math.random) {
    const foods = [];

    for (let index = 0; index < SNAKE_CONFIG.foodCount; index += 1) {
        const food = createTechnology(snake, foods, random);

        if (!food) {
            break;
        }

        foods.push(food);
    }

    return foods;
}

/* === ESTADO INICIAL DA PARTIDA === */
export function createSnakeGame(random = Math.random) {
    const centerX = Math.floor(SNAKE_CONFIG.columns / 2);
    const centerY = Math.floor(SNAKE_CONFIG.rows / 2);

    const snake = Array.from(
        { length: SNAKE_CONFIG.initialLength },
        (_, index) => ({
            x: centerX - index,
            y: centerY,
        }),
    );

    const foods = createInitialFoods(snake, random);

    return {
        snake,
        direction: 'right',
        nextDirection: 'right',
        foods,
        technology: foods[0] ?? null,
        score: 0,
        collected: [],
        status: 'ready',
        ticks: 0,
    };
}

/* === ALTERAÇÃO DA DIREÇÃO === */
export function changeSnakeDirection(state, direction) {
    if (!Object.hasOwn(SNAKE_DIRECTIONS, direction)) {
        return state;
    }

    if (
        state.status === 'gameover' ||
        state.status === 'won'
    ) {
        return state;
    }

    /* ----- LIMITE DE UMA VIRADA POR MOVIMENTO ----- */
    if (state.nextDirection !== state.direction) {
        return state;
    }

    if (direction === state.direction) {
        return state;
    }

    const current = SNAKE_DIRECTIONS[state.direction];
    const next = SNAKE_DIRECTIONS[direction];

    if (isOppositeDirection(current, next)) {
        return state;
    }

    return {
        ...state,
        nextDirection: direction,
    };
}

/* === INÍCIO E CONTINUAÇÃO DA PARTIDA === */
export function startSnakeGame(state) {
    if (
        state.status !== 'ready' &&
        state.status !== 'paused'
    ) {
        return state;
    }

    return {
        ...state,
        status: 'playing',
    };
}

/* === PAUSA DA PARTIDA === */
export function pauseSnakeGame(state) {
    if (state.status !== 'playing') {
        return state;
    }

    return {
        ...state,
        status: 'paused',
    };
}

/* === VELOCIDADE DA PARTIDA === */
export function getSnakeSpeed(score) {
    const safeScore = Number.isFinite(score)
        ? Math.max(0, score)
        : 0;

    return Math.max(
        SNAKE_CONFIG.minimumSpeed,
        SNAKE_CONFIG.initialSpeed -
        safeScore * SNAKE_CONFIG.speedIncrement,
    );
}

/* === IDENTIFICAÇÃO DA TECNOLOGIA COLETADA === */
function findCollectedFood(foods, position) {
    return foods.find((food) =>
        isSamePosition(food, position),
    ) ?? null;
}

/* === REPOSIÇÃO DAS TECNOLOGIAS === */
function replenishFoods(snake, foods, random) {
    const nextFoods = [...foods];

    while (nextFoods.length < SNAKE_CONFIG.foodCount) {
        const food = createTechnology(snake, nextFoods, random);

        if (!food) {
            break;
        }

        nextFoods.push(food);
    }

    return nextFoods;
}

/* === MOVIMENTAÇÃO DA COBRA === */
export function advanceSnakeGame(state, random = Math.random) {
    if (state.status !== 'playing') {
        return state;
    }

    /* ----- PRÓXIMA POSIÇÃO ----- */
    const direction = state.nextDirection;
    const movement = SNAKE_DIRECTIONS[direction];
    const head = state.snake[0];

    const nextHead = {
        x: head.x + movement.x,
        y: head.y + movement.y,
    };

    /* ----- TECNOLOGIA COLETADA ----- */
    const foods = state.foods ?? (
        state.technology ? [state.technology] : []
    );

    const collectedFood = findCollectedFood(foods, nextHead);
    const ateFood = Boolean(collectedFood);

    /* ----- COLISÃO COM O CORPO ----- */
    const bodyToCheck = ateFood
        ? state.snake
        : state.snake.slice(0, -1);

    const hitBody = bodyToCheck.some((segment) =>
        isSamePosition(segment, nextHead),
    );

    /* ----- COLISÃO COM AS BORDAS ----- */
    const hitWall = !isInsideBoard(nextHead);

    /* ----- FIM DE JOGO ----- */
    if (hitWall || hitBody) {
        return {
            ...state,
            direction,
            nextDirection: direction,
            status: 'gameover',
        };
    }

    /* ----- ATUALIZAÇÃO DO CORPO ----- */
    const snake = [nextHead, ...state.snake];

    if (!ateFood) {
        snake.pop();
    }

    /* ----- ATUALIZAÇÃO DA PONTUAÇÃO ----- */
    const score = ateFood
        ? state.score + SNAKE_CONFIG.pointsPerItem
        : state.score;

    const collected = ateFood
        ? [...state.collected, collectedFood.id]
        : state.collected;

    /* ----- REMOÇÃO DA TECNOLOGIA COLETADA ----- */
    const remainingFoods = ateFood
        ? foods.filter((food) => food !== collectedFood)
        : foods;

    /* ----- VERIFICAÇÃO DE VITÓRIA ----- */
    const boardSize = SNAKE_CONFIG.columns * SNAKE_CONFIG.rows;
    const won = snake.length === boardSize;

    /* ----- REPOSIÇÃO DOS ITENS ----- */
    const nextFoods = won
        ? []
        : ateFood
            ? replenishFoods(snake, remainingFoods, random)
            : remainingFoods;

    return {
        ...state,
        snake,
        direction,
        nextDirection: direction,
        foods: nextFoods,
        technology: nextFoods[0] ?? null,
        score,
        collected,
        status: won ? 'won' : 'playing',
        ticks: state.ticks + 1,
    };
}
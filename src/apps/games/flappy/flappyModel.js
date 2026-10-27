/* === CONFIGURAÇÃO DO FLAPPY BIRD === */
export const FLAPPY_CONFIG = Object.freeze({
    width: 360,
    height: 540,
    groundHeight: 55,
    birdX: 85,
    birdRadius: 13,
    gravity: 1100,
    jumpVelocity: -350,
    pipeSpeed: 145,
    pipeWidth: 62,
    pipeGap: 165,
    pipeSpacing: 220,
    minPipeHeight: 65,
    maxDelta: 1 / 30,
});

/* === LIMITES MATEMÁTICOS === */
function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

/* === GERAÇÃO DE OBSTÁCULOS === */
function createPipe(x, id, random = Math.random) {
    const config = FLAPPY_CONFIG;
    const playableHeight = config.height - config.groundHeight;

    const minTop = config.minPipeHeight;
    const maxTop =
        playableHeight -
        config.pipeGap -
        config.minPipeHeight;

    const value = random();

    const safeRandom = Number.isFinite(value)
        ? clamp(value, 0, 1)
        : 0.5;

    const topHeight =
        minTop + safeRandom * (maxTop - minTop);

    return {
        id,
        x,
        topHeight,
        counted: false,
    };
}

/* === ESTADO INICIAL === */
export function createFlappyGame(random = Math.random) {
    return {
        status: 'ready',
        birdY: FLAPPY_CONFIG.height * 0.42,
        velocity: 0,
        pipes: [
            createPipe(
                FLAPPY_CONFIG.width + 70,
                0,
                random,
            ),
        ],
        nextPipeId: 1,
        score: 0,
        elapsed: 0,
    };
}

/* === INICIAR OU CONTINUAR === */
export function startFlappyGame(state) {
    if (state.status !== 'ready' && state.status !== 'paused') {
        return state;
    }

    return {
        ...state,
        status: 'playing',
        velocity:
            state.status === 'ready'
                ? FLAPPY_CONFIG.jumpVelocity
                : state.velocity,
    };
}

/* === PAUSAR PARTIDA === */
export function pauseFlappyGame(state) {
    if (state.status !== 'playing') {
        return state;
    }

    return {
        ...state,
        status: 'paused',
    };
}

/* === IMPULSO DO PÁSSARO === */
export function flapBird(state) {
    if (state.status === 'ready') {
        return startFlappyGame(state);
    }

    if (state.status !== 'playing') {
        return state;
    }

    return {
        ...state,
        velocity: FLAPPY_CONFIG.jumpVelocity,
    };
}

/* === COLISÃO COM OBSTÁCULOS === */
function hasPipeCollision(birdY, pipe) {
    const config = FLAPPY_CONFIG;

    const birdLeft = config.birdX - config.birdRadius;
    const birdRight = config.birdX + config.birdRadius;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + config.pipeWidth;

    if (birdRight <= pipeLeft || birdLeft >= pipeRight) {
        return false;
    }

    const birdTop = birdY - config.birdRadius;
    const birdBottom = birdY + config.birdRadius;

    const gapTop = pipe.topHeight;
    const gapBottom = gapTop + config.pipeGap;

    return birdTop < gapTop || birdBottom > gapBottom;
}

/* === COLISÃO COM O CENÁRIO === */
function hasWorldCollision(birdY) {
    const config = FLAPPY_CONFIG;
    const floor = config.height - config.groundHeight;

    return (
        birdY - config.birdRadius <= 0 ||
        birdY + config.birdRadius >= floor
    );
}

/* === ATUALIZAÇÃO DA FÍSICA === */
export function advanceFlappyGame(
    state,
    deltaSeconds,
    random = Math.random,
) {
    if (
        state.status !== 'playing' ||
        !Number.isFinite(deltaSeconds) ||
        deltaSeconds <= 0
    ) {
        return state;
    }

    const config = FLAPPY_CONFIG;
    const delta = Math.min(deltaSeconds, config.maxDelta);

    /* ----- MOVIMENTO DO PÁSSARO ----- */
    const velocity =
        state.velocity + config.gravity * delta;

    const birdY =
        state.birdY +
        state.velocity * delta +
        0.5 * config.gravity * delta * delta;

    /* ----- MOVIMENTO DOS OBSTÁCULOS ----- */
    let score = state.score;

    const pipes = state.pipes
        .map((pipe) => {
            const x = pipe.x - config.pipeSpeed * delta;

            const passed =
                !pipe.counted &&
                x + config.pipeWidth < config.birdX;

            if (passed) {
                score += 1;
            }

            return {
                ...pipe,
                x,
                counted: pipe.counted || passed,
            };
        })
        .filter((pipe) => pipe.x + config.pipeWidth > 0);

    /* ----- CRIAÇÃO DE NOVOS OBSTÁCULOS ----- */
    let nextPipeId = state.nextPipeId;

    const lastPipe = pipes[pipes.length - 1];

    if (
        !lastPipe ||
        lastPipe.x <= config.width - config.pipeSpacing
    ) {
        pipes.push(
            createPipe(
                config.width + config.pipeWidth,
                nextPipeId,
                random,
            ),
        );

        nextPipeId += 1;
    }

    /* ----- DETECÇÃO DE COLISÕES ----- */
    const collided =
        hasWorldCollision(birdY) ||
        pipes.some((pipe) => hasPipeCollision(birdY, pipe));

    return {
        ...state,
        birdY,
        velocity,
        pipes,
        nextPipeId,
        score: collided ? state.score : score,
        elapsed: state.elapsed + delta,
        status: collided ? 'gameover' : 'playing',
    };
}

/* === INFORMAÇÕES DO JOGO === */
export function getFlappyRotation(velocity) {
    return clamp(velocity * 0.1, -25, 75);
}

export function getFlappyProgress(state) {
    return state.score;
}
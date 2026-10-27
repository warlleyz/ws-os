/* === CONFIGURAÇÃO DO JOGO MEMÓRIA === */
export const MEMORY_CONFIG = Object.freeze({
    pairs: 8,
    mismatchDelay: 850,
});

/* === TECNOLOGIAS DISPONÍVEIS === */
export const MEMORY_TECHNOLOGIES = Object.freeze([
    'javascript',
    'typescript',
    'python',
    'java',
    'react',
    'html',
    'css',
    'cplusplus',
]);

/* === EMBARALHAMENTO DAS CARTAS === */
export function shuffleMemoryCards(cards, random = Math.random) {
    const shuffled = [...cards];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const value = random();
        const safeValue = Number.isFinite(value)
            ? Math.min(Math.max(value, 0), 1 - Number.EPSILON)
            : 0;

        const target = Math.floor(safeValue * (index + 1));

        [shuffled[index], shuffled[target]] = [
            shuffled[target],
            shuffled[index],
        ];
    }

    return shuffled;
}

/* === CRIAÇÃO DAS CARTAS === */
export function createMemoryCards(random = Math.random) {
    const cards = MEMORY_TECHNOLOGIES.flatMap((technology) => [
        {
            id: `${technology}-1`,
            technology,
        },
        {
            id: `${technology}-2`,
            technology,
        },
    ]);

    return shuffleMemoryCards(cards, random);
}

/* === ESTADO INICIAL === */
export function createMemoryGame(random = Math.random) {
    return {
        cards: createMemoryCards(random),
        revealed: [],
        matched: [],
        moves: 0,
        status: 'ready',
    };
}

/* === INICIAR OU CONTINUAR === */
export function startMemoryGame(state) {
    if (state.status !== 'ready' && state.status !== 'paused') {
        return state;
    }

    return {
        ...state,
        status: 'playing',
    };
}

/* === PAUSAR A PARTIDA === */
export function pauseMemoryGame(state) {
    if (state.status !== 'playing') {
        return state;
    }

    return {
        ...state,
        status: 'paused',
    };
}

/* === REVELAR UMA CARTA === */
export function revealMemoryCard(state, cardId) {
    if (
        state.status !== 'playing' ||
        state.revealed.length >= 2 ||
        state.revealed.includes(cardId) ||
        state.matched.includes(cardId)
    ) {
        return state;
    }

    const card = state.cards.find((item) => item.id === cardId);

    if (!card) {
        return state;
    }

    const revealed = [...state.revealed, cardId];

    /* ----- PRIMEIRA CARTA ----- */
    if (revealed.length === 1) {
        return {
            ...state,
            revealed,
        };
    }

    /* ----- COMPARAÇÃO DO PAR ----- */
    const firstCard = state.cards.find(
        (item) => item.id === revealed[0],
    );

    const moves = state.moves + 1;

    if (firstCard.technology !== card.technology) {
        return {
            ...state,
            revealed,
            moves,
        };
    }

    /* ----- PAR ENCONTRADO ----- */
    const matched = [...state.matched, ...revealed];
    const finished = matched.length === state.cards.length;

    return {
        ...state,
        revealed: [],
        matched,
        moves,
        status: finished ? 'won' : 'playing',
    };
}

/* === OCULTAR CARTAS DIFERENTES === */
export function hideMemoryMismatch(state) {
    if (state.revealed.length !== 2) {
        return state;
    }

    const [firstId, secondId] = state.revealed;

    const first = state.cards.find((card) => card.id === firstId);
    const second = state.cards.find((card) => card.id === secondId);

    if (!first || !second || first.technology === second.technology) {
        return state;
    }

    return {
        ...state,
        revealed: [],
    };
}

/* === CONSULTAS DO JOGO === */
export function isMemoryCardVisible(state, cardId) {
    return (
        state.revealed.includes(cardId) ||
        state.matched.includes(cardId)
    );
}

export function getMemoryPairsFound(state) {
    return state.matched.length / 2;
}
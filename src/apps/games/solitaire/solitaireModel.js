/* === CONFIGURAÇÃO DA PACIÊNCIA === */
export const SOLITAIRE_SUITS = Object.freeze([
    'hearts',
    'diamonds',
    'clubs',
    'spades',
]);

export const SOLITAIRE_CONFIG = Object.freeze({
    tableauColumns: 7,
    foundationCount: 4,
    deckSize: 52,
});

/* === IDENTIFICAÇÃO DAS CARTAS === */
function getCardColor(suit) {
    return suit === 'hearts' || suit === 'diamonds'
        ? 'red'
        : 'black';
}

function createDeck() {
    return SOLITAIRE_SUITS.flatMap((suit) =>
        Array.from({ length: 13 }, (_, index) => ({
            id: `${suit}-${index + 1}`,
            suit,
            rank: index + 1,
            color: getCardColor(suit),
            faceUp: false,
        })),
    );
}

/* === EMBARALHAMENTO === */
export function shuffleSolitaireDeck(
    deck,
    random = Math.random,
) {
    const shuffled = [...deck];

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

/* === CRIAÇÃO DA PARTIDA === */
export function createSolitaireGame(random = Math.random) {
    const deck = shuffleSolitaireDeck(createDeck(), random);

    const tableau = [];
    let cursor = 0;

    /* ----- DISTRIBUIÇÃO DAS SETE COLUNAS ----- */
    for (
        let column = 0;
        column < SOLITAIRE_CONFIG.tableauColumns;
        column += 1
    ) {
        const cards = [];

        for (let index = 0; index <= column; index += 1) {
            const card = deck[cursor];

            cards.push({
                ...card,
                faceUp: index === column,
            });

            cursor += 1;
        }

        tableau.push(cards);
    }

    return {
        status: 'ready',
        tableau,
        foundations: Array.from(
            { length: SOLITAIRE_CONFIG.foundationCount },
            () => [],
        ),
        stock: deck.slice(cursor),
        waste: [],
        moves: 0,
    };
}

/* === CONTROLES DA PARTIDA === */
export function startSolitaireGame(state) {
    if (state.status !== 'ready' && state.status !== 'paused') {
        return state;
    }

    return {
        ...state,
        status: 'playing',
    };
}

export function pauseSolitaireGame(state) {
    if (state.status !== 'playing') {
        return state;
    }

    return {
        ...state,
        status: 'paused',
    };
}

/* === COMPRA DE CARTAS === */
export function drawSolitaireCard(state) {
    if (state.status !== 'playing') {
        return state;
    }

    /* ----- VIRAR UMA CARTA DO ESTOQUE ----- */
    if (state.stock.length > 0) {
        const stock = [...state.stock];
        const card = stock.pop();

        return {
            ...state,
            stock,
            waste: [
                ...state.waste,
                { ...card, faceUp: true },
            ],
            moves: state.moves + 1,
        };
    }

    /* ----- RECICLAR O DESCARTE ----- */
    if (state.waste.length > 0) {
        return {
            ...state,
            stock: [...state.waste]
                .reverse()
                .map((card) => ({
                    ...card,
                    faceUp: false,
                })),
            waste: [],
            moves: state.moves + 1,
        };
    }

    return state;
}

/* === VALIDAÇÃO DAS SEQUÊNCIAS === */
function isValidSequence(cards) {
    if (cards.length === 0) {
        return false;
    }

    for (let index = 0; index < cards.length; index += 1) {
        if (!cards[index].faceUp) {
            return false;
        }

        if (index === 0) {
            continue;
        }

        const previous = cards[index - 1];
        const current = cards[index];

        if (
            previous.rank !== current.rank + 1 ||
            previous.color === current.color
        ) {
            return false;
        }
    }

    return true;
}

/* === VALIDAÇÃO DOS DESTINOS === */
function canMoveToTableau(cards, movingCard) {
    if (cards.length === 0) {
        return movingCard.rank === 13;
    }

    const topCard = cards[cards.length - 1];

    return (
        topCard.faceUp &&
        topCard.rank === movingCard.rank + 1 &&
        topCard.color !== movingCard.color
    );
}

function canMoveToFoundation(cards, movingCard) {
    if (cards.length === 0) {
        return movingCard.rank === 1;
    }

    const topCard = cards[cards.length - 1];

    return (
        topCard.suit === movingCard.suit &&
        movingCard.rank === topCard.rank + 1
    );
}

/* === VALIDAÇÃO DE POSIÇÕES === */
function isValidIndex(index, length) {
    return Number.isInteger(index) &&
        index >= 0 &&
        index < length;
}

/* === MOVIMENTAÇÃO ENTRE PILHAS === */
export function moveSolitaireCards(
    state,
    source,
    target,
    cardId,
) {
    if (state.status !== 'playing') {
        return state;
    }

    if (!source || !target) {
        return state;
    }

    const validSource =
        source.type === 'tableau' ||
        source.type === 'waste' ||
        source.type === 'foundation';

    const validTarget =
        target.type === 'tableau' ||
        target.type === 'foundation';

    if (!validSource || !validTarget) {
        return state;
    }

    if (
        source.type === target.type &&
        source.index === target.index
    ) {
        return state;
    }

    /* ----- CÓPIAS DAS PILHAS ----- */
    const tableau = state.tableau.map((cards) => [...cards]);
    const foundations = state.foundations.map((cards) => [...cards]);
    const waste = [...state.waste];

    let sourceCards;

    if (source.type === 'tableau') {
        if (!isValidIndex(source.index, tableau.length)) {
            return state;
        }

        sourceCards = tableau[source.index];
    } else if (source.type === 'foundation') {
        if (!isValidIndex(source.index, foundations.length)) {
            return state;
        }

        sourceCards = foundations[source.index];
    } else {
        sourceCards = waste;
    }

    if (sourceCards.length === 0) {
        return state;
    }

    /* ----- SELEÇÃO DAS CARTAS ----- */
    let selectedIndex = sourceCards.length - 1;

    if (source.type === 'tableau') {
        selectedIndex = sourceCards.findIndex(
            (card) => card.id === cardId,
        );

        if (selectedIndex < 0) {
            return state;
        }
    } else if (
        sourceCards[selectedIndex].id !== cardId
    ) {
        return state;
    }

    const movingCards = sourceCards.slice(selectedIndex);

    if (!isValidSequence(movingCards)) {
        return state;
    }

    /* ----- IDENTIFICAÇÃO DO DESTINO ----- */
    let targetCards;

    if (target.type === 'tableau') {
        if (!isValidIndex(target.index, tableau.length)) {
            return state;
        }

        targetCards = tableau[target.index];

        if (!canMoveToTableau(targetCards, movingCards[0])) {
            return state;
        }
    } else {
        if (
            !isValidIndex(target.index, foundations.length) ||
            movingCards.length !== 1
        ) {
            return state;
        }

        targetCards = foundations[target.index];

        if (!canMoveToFoundation(targetCards, movingCards[0])) {
            return state;
        }
    }

    /* ----- REMOVER CARTAS DA ORIGEM ----- */
    sourceCards.splice(selectedIndex);

    /* ----- REVELAR A NOVA CARTA SUPERIOR ----- */
    if (
        source.type === 'tableau' &&
        sourceCards.length > 0
    ) {
        const lastIndex = sourceCards.length - 1;
        const lastCard = sourceCards[lastIndex];

        if (!lastCard.faceUp) {
            sourceCards[lastIndex] = {
                ...lastCard,
                faceUp: true,
            };
        }
    }

    /* ----- INSERIR CARTAS NO DESTINO ----- */
    targetCards.push(...movingCards);

    /* ----- VERIFICAR VITÓRIA ----- */
    const completed = foundations.every(
        (cards) => cards.length === 13,
    );

    return {
        ...state,
        tableau,
        foundations,
        waste,
        moves: state.moves + 1,
        status: completed ? 'won' : 'playing',
    };
}

/* === CONSULTAS DA PARTIDA === */
export function getSolitaireFoundationCount(state) {
    return state.foundations.reduce(
        (total, cards) => total + cards.length,
        0,
    );
}

export function getSolitaireProgress(state) {
    return Math.round(
        (getSolitaireFoundationCount(state) /
            SOLITAIRE_CONFIG.deckSize) * 100,
    );
}
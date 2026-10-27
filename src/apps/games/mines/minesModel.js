/* === CONFIGURAÇÃO DO CAMPO MINADO === */
export const MINES_CONFIG = Object.freeze({
    rows: 9,
    columns: 9,
    mines: 10,
});

/* === IDENTIFICAÇÃO DAS CÉLULAS === */
export function getMineCellId(row, column) {
    return `${row}:${column}`;
}

/* === LIMITES DO TABULEIRO === */
function isInsideBoard(row, column) {
    return (
        row >= 0 &&
        row < MINES_CONFIG.rows &&
        column >= 0 &&
        column < MINES_CONFIG.columns
    );
}

/* === CÉLULAS VIZINHAS === */
function getNeighbors(row, column) {
    const neighbors = [];

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
            if (rowOffset === 0 && columnOffset === 0) {
                continue;
            }

            const nextRow = row + rowOffset;
            const nextColumn = column + columnOffset;

            if (isInsideBoard(nextRow, nextColumn)) {
                neighbors.push(getMineCellId(nextRow, nextColumn));
            }
        }
    }

    return neighbors;
}

/* === CRIAÇÃO DAS CÉLULAS === */
function createCells() {
    const cells = {};

    for (let row = 0; row < MINES_CONFIG.rows; row += 1) {
        for (let column = 0; column < MINES_CONFIG.columns; column += 1) {
            const id = getMineCellId(row, column);

            cells[id] = {
                id,
                row,
                column,
                mine: false,
                adjacent: 0,
                revealed: false,
                flagged: false,
            };
        }
    }

    return cells;
}

/* === ESTADO INICIAL DA PARTIDA === */
export function createMinesGame() {
    return {
        cells: createCells(),
        status: 'ready',
        initialized: false,
        revealedCount: 0,
        flags: 0,
        elapsedSeconds: 0,
    };
}

/* === POSICIONAMENTO DAS MINAS === */
function placeMines(cells, safeId, random) {
    const nextCells = Object.fromEntries(
        Object.entries(cells).map(([id, cell]) => [id, { ...cell }]),
    );

    /* ----- PROTEGER O PRIMEIRO CLIQUE ----- */
    const candidates = Object.keys(nextCells).filter(
        (id) => id !== safeId,
    );

    /* ----- EMBARALHAMENTO PARCIAL ----- */
    for (
        let index = 0;
        index < MINES_CONFIG.mines;
        index += 1
    ) {
        const value = random();
        const safeValue = Number.isFinite(value)
            ? Math.min(Math.max(value, 0), 1 - Number.EPSILON)
            : 0;

        const target = index + Math.floor(
            safeValue * (candidates.length - index),
        );

        [candidates[index], candidates[target]] = [
            candidates[target],
            candidates[index],
        ];

        nextCells[candidates[index]].mine = true;
    }

    /* ----- CALCULAR MINAS ADJACENTES ----- */
    for (const cell of Object.values(nextCells)) {
        if (!cell.mine) {
            continue;
        }

        for (const neighborId of getNeighbors(cell.row, cell.column)) {
            if (!nextCells[neighborId].mine) {
                nextCells[neighborId].adjacent += 1;
            }
        }
    }

    return nextCells;
}

/* === INICIAR OU CONTINUAR === */
export function startMinesGame(state) {
    if (state.status !== 'ready' && state.status !== 'paused') {
        return state;
    }

    return {
        ...state,
        status: 'playing',
    };
}

/* === PAUSAR === */
export function pauseMinesGame(state) {
    if (state.status !== 'playing') {
        return state;
    }

    return {
        ...state,
        status: 'paused',
    };
}

/* === MARCAR OU DESMARCAR UMA BANDEIRA === */
export function toggleMineFlag(state, cellId) {
    if (state.status !== 'playing') {
        return state;
    }

    const cell = state.cells[cellId];

    if (
        !cell ||
        cell.revealed ||
        (!cell.flagged && state.flags >= MINES_CONFIG.mines)
    ) {
        return state;
    }

    const flagged = !cell.flagged;

    return {
        ...state,
        cells: {
            ...state.cells,
            [cellId]: {
                ...cell,
                flagged,
            },
        },
        flags: state.flags + (flagged ? 1 : -1),
    };
}

/* === REVELAÇÃO AUTOMÁTICA DE ÁREAS VAZIAS === */
function revealArea(cells, initialId) {
    const nextCells = { ...cells };
    const pending = [initialId];
    const visited = new Set();

    let revealedCount = 0;

    while (pending.length > 0) {
        const id = pending.pop();

        if (visited.has(id)) {
            continue;
        }

        visited.add(id);

        const cell = nextCells[id];

        if (!cell || cell.revealed || cell.flagged || cell.mine) {
            continue;
        }

        nextCells[id] = {
            ...cell,
            revealed: true,
        };

        revealedCount += 1;

        /* ----- PROPAGAR SOMENTE CÉLULAS VAZIAS ----- */
        if (cell.adjacent === 0) {
            pending.push(...getNeighbors(cell.row, cell.column));
        }
    }

    return {
        cells: nextCells,
        revealedCount,
    };
}

/* === REVELAR UMA CÉLULA === */
export function revealMineCell(state, cellId, random = Math.random) {
    if (state.status !== 'playing') {
        return state;
    }

    const currentCell = state.cells[cellId];

    if (!currentCell || currentCell.revealed || currentCell.flagged) {
        return state;
    }

    /* ----- GERAR MINAS NO PRIMEIRO CLIQUE ----- */
    const cells = state.initialized
        ? state.cells
        : placeMines(state.cells, cellId, random);

    const cell = cells[cellId];

    /* ----- DERROTA ----- */
    if (cell.mine) {
        return {
            ...state,
            cells: {
                ...cells,
                [cellId]: {
                    ...cell,
                    revealed: true,
                },
            },
            initialized: true,
            status: 'gameover',
        };
    }

    /* ----- REVELAR CÉLULAS SEGURAS ----- */
    const result = revealArea(cells, cellId);
    const revealedCount = state.revealedCount + result.revealedCount;

    const safeCells =
        MINES_CONFIG.rows * MINES_CONFIG.columns - MINES_CONFIG.mines;

    const won = revealedCount === safeCells;

    return {
        ...state,
        cells: result.cells,
        revealedCount,
        initialized: true,
        status: won ? 'won' : 'playing',
    };
}

/* === CONTAGEM DE TEMPO === */
export function advanceMinesTime(state) {
    if (state.status !== 'playing' || !state.initialized) {
        return state;
    }

    return {
        ...state,
        elapsedSeconds: state.elapsedSeconds + 1,
    };
}

/* === CONSULTAS DA PARTIDA === */
export function getMinesRemaining(state) {
    return MINES_CONFIG.mines - state.flags;
}

export function getMinesProgress(state) {
    const safeCells =
        MINES_CONFIG.rows * MINES_CONFIG.columns - MINES_CONFIG.mines;

    return Math.round((state.revealedCount / safeCells) * 100);
}
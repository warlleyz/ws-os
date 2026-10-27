import { RANKING_GAME_LIMITS } from '../../../services/publicContentContract';

/* === CONFIGURAÇÃO DOS RANKINGS === */
export const RANKING_CONFIG = Object.freeze({
    snake: {
        id: 'snake',
        name: 'Snake',
        enabled: true,
        public: true,
        order: 'desc',
        unit: 'points',
        minimum: 1,
        maximum: RANKING_GAME_LIMITS.snake,
    },

    memory: {
        id: 'memory',
        name: 'Memória',
        enabled: true,
        public: false,
        order: 'asc',
        unit: 'moves',
        minimum: 1,
        maximum: null,
    },

    mines: {
        id: 'mines',
        name: 'Campo Minado',
        enabled: true,
        public: false,
        order: 'asc',
        unit: 'seconds',
        minimum: 1,
        maximum: null,
    },

    flappy: {
        id: 'flappy',
        name: 'Flappy Bird',
        enabled: true,
        public: true,
        order: 'desc',
        unit: 'points',
        minimum: 1,
        maximum: RANKING_GAME_LIMITS.flappy,
    },

    solitaire: {
        id: 'solitaire',
        name: 'Paciência',
        enabled: true,
        public: false,
        order: 'asc',
        unit: 'moves',
        minimum: 1,
        maximum: null,
    },

    doom: {
        id: 'doom',
        name: 'DOOM',
        enabled: false,
        public: false,
        order: null,
        unit: null,
        minimum: null,
        maximum: null,
    },
});

/* === CONSULTA DAS CONFIGURAÇÕES === */
export function getRankingConfig(gameId) {
    return RANKING_CONFIG[gameId] ?? null;
}

/* === VALIDAÇÃO DE PONTUAÇÕES === */
export function isValidRankingScore(gameId, score) {
    const config = getRankingConfig(gameId);

    if (!config?.enabled || !Number.isSafeInteger(score)) {
        return false;
    }

    if (score < config.minimum) {
        return false;
    }

    if (config.maximum !== null && score > config.maximum) {
        return false;
    }

    return true;
}

/* === COMPARAÇÃO DE RECORDES === */
export function isBetterRankingScore(gameId, score, record) {
    const config = getRankingConfig(gameId);

    if (!config || !isValidRankingScore(gameId, score)) {
        return false;
    }

    if (record === null || record === undefined) {
        return true;
    }

    return config.order === 'asc'
        ? score < record
        : score > record;
}

/* === JOGOS COM RANKING PÚBLICO === */
export function supportsPublicRanking(gameId) {
    const config = getRankingConfig(gameId);

    return Boolean(config?.enabled && config.public);
}
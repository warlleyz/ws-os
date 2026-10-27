import { executeJsonRequest } from '../../../services/httpRequestContract';
import { RANKING_GAME_LIMITS } from '../../../services/publicContentContract';

import {
    isValidRankingScore,
    supportsPublicRanking,
} from './rankingConfig';

/* === CONFIGURAÇÃO DO RANKING PÚBLICO === */
const MAX_RESULTS = 20;
const MAX_ALIAS_LENGTH = 24;
const MIN_ALIAS_LENGTH = 2;

/* === VALIDAÇÃO DO APELIDO === */
export function isValidRankingAlias(value) {
    if (typeof value !== 'string') {
        return false;
    }

    const alias = value.trim();

    return (
        alias.length >= MIN_ALIAS_LENGTH &&
        alias.length <= MAX_ALIAS_LENGTH &&
        /^[\p{L}\p{N} _-]+$/u.test(alias)
    );
}

/* === VALIDAÇÃO DAS PONTUAÇÕES PÚBLICAS === */
function isValidPublicScore(gameId, score) {
    return (
        supportsPublicRanking(gameId) &&
        Object.hasOwn(RANKING_GAME_LIMITS, gameId) &&
        isValidRankingScore(gameId, score)
    );
}

/* === VALIDAÇÃO DOS RESULTADOS RECEBIDOS === */
export function validateRankingRows(value, gameId) {
    if (
        !Array.isArray(value) ||
        value.length > MAX_RESULTS
    ) {
        throw new Error('INVALID_RANKING');
    }

    const valid = value.every((row) => {
        if (
            !row ||
            typeof row !== 'object' ||
            Array.isArray(row)
        ) {
            return false;
        }

        const keys = Object.keys(row);

        return (
            keys.every((key) => ['alias', 'score'].includes(key)) &&
            isValidRankingAlias(row.alias) &&
            isValidPublicScore(gameId, row.score)
        );
    });

    if (!valid) {
        throw new Error('INVALID_RANKING');
    }

    return value.map(({ alias, score }) => ({
        alias: alias.trim(),
        score,
    }));
}

/* === CONSULTA DO RANKING PÚBLICO === */
export async function fetchGameRanking(gameId, signal) {
    if (!supportsPublicRanking(gameId)) {
        throw new Error('RANKING_NOT_SUPPORTED');
    }

    const endpoint = `/api/rankings?game=${encodeURIComponent(gameId)}`;

    const { response, payload } = await executeJsonRequest(
        endpoint,
        {
            cache: 'no-store',
        },
        {
            signal,
        },
    );

    if (!response.ok) {
        throw new Error('RANKING_UNAVAILABLE');
    }

    return validateRankingRows(payload?.scores, gameId);
}

/* === VALIDAÇÃO DO ENVIO DE PONTUAÇÕES === */
function validateRankingSubmission({
    gameId,
    alias,
    score,
    turnstileToken,
}) {
    if (
        !isValidPublicScore(gameId, score) ||
        !isValidRankingAlias(alias) ||
        typeof turnstileToken !== 'string' ||
        !turnstileToken.trim()
    ) {
        throw new Error('INVALID_RANKING_SUBMISSION');
    }

    return {
        game: gameId,
        alias: alias.trim(),
        score,
        turnstileToken,
    };
}

/* === ENVIO DE PONTUAÇÕES PÚBLICAS === */
export async function submitGameRanking({
    gameId,
    alias,
    score,
    turnstileToken,
    signal,
}) {
    if (!supportsPublicRanking(gameId)) {
        throw new Error('RANKING_NOT_SUPPORTED');
    }

    const submission = validateRankingSubmission({
        gameId,
        alias,
        score,
        turnstileToken,
    });

    const { response, payload } = await executeJsonRequest(
        '/api/rankings',
        {
            method: 'POST',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission),
        },
        {
            operation: 'write',
            signal,
        },
    );

    if (!response.ok) {
        throw new Error('RANKING_UNAVAILABLE');
    }

    if (payload?.accepted !== true) {
        throw new Error('RANKING_UNCONFIRMED');
    }

    return {
        accepted: true,
    };
}

/* === DISPONIBILIDADE DO RANKING PÚBLICO === */
export function isPublicRankingEnabled() {
    return import.meta.env.VITE_RANKINGS_ENABLED === 'true';
}
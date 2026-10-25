
const API_BASE = 'https://github-contributions-api.jogruber.de/v4';

/* === Consulta de contribuições públicas === */
export async function fetchGithubContributions(username, options = {}) {
    if (
        typeof username !== 'string' ||
        !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)
    ) {
        throw new Error('Usuário GitHub inválido.');
    }

    const url = `${API_BASE}/${encodeURIComponent(username)}?y=last`;

    const response = await fetch(url, {
        method: 'GET',
        signal: options.signal,
        headers: { Accept: 'application/json' },
        cache: options.force ? 'no-cache' : 'default',
    });

    if (!response.ok) {
        throw new Error(`Não foi possível consultar as contribuições (${response.status}).`);
    }

    const payload = await response.json();

    if (!Array.isArray(payload?.contributions)) {
        throw new Error('Resposta de contribuições inválida.');
    }

    const days = payload.contributions.map((item) => {
        if (
            typeof item?.date !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
            !Number.isSafeInteger(item.count) ||
            item.count < 0
        ) {
            throw new Error('Dados de contribuição inválidos.');
        }

        return {
            date: item.date,
            count: item.count,
        };
    });

    const unique = new Set(days.map((item) => item.date));

    if (unique.size !== days.length) {
        throw new Error('Datas de contribuição duplicadas.');
    }

    return {
        data: {
            days: days.sort((a, b) => a.date.localeCompare(b.date)),
        },
        source: 'live',
        updatedAt: Date.now(),
    };
}

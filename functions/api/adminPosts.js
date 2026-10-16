
import { requireAdministrator } from './auth.js';

const json = (body, status = 200) =>
    Response.json(body, {
        status,
        headers: {
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    });

export async function onRequestGet({ request, env }) {
    const access = await requireAdministrator(request, env);

    if (!access.authorized) {
        return access.response;
    }

    const authorization = request.headers.get('authorization');

    if (
        !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
        !env.SUPABASE_ANON_KEY
    ) {
        return json({ error: 'Supabase não configurado.' }, 503);
    }

    try {
        const url = new URL('/rest/v1/posts', env.SUPABASE_URL);

        url.search = new URLSearchParams({
            select: 'id,title,summary,body,tags,status,published_at',
            order: 'published_at.desc.nullslast',
            limit: '200',
        });

        const response = await fetch(url, {
            headers: {
                apikey: env.SUPABASE_ANON_KEY,
                Authorization: authorization,
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return json(
                { error: 'Não foi possível consultar as publicações.' },
                502
            );
        }

        const rows = await response.json();

        if (!Array.isArray(rows)) {
            return json({ error: 'Resposta inválida do Supabase.' }, 502);
        }

        return json({
            posts: rows.map((row) => ({
                id: row.id,
                title: row.title,
                summary: row.summary,
                body: row.body,
                tags: row.tags,
                status: row.status,
                publishedAt: row.published_at,
            })),
        });
    } catch {
        return json(
            { error: 'Serviço de publicações indisponível.' },
            502
        );
    }
}

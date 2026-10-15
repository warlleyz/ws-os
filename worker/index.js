
import { onRequestPost as handleWally } from '../functions/api/wally.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === '/api/wally-health') {
            try {
                if (!env.WALLY_LIMITS_DB) {
                    return Response.json(
                        { database: 'binding_missing' },
                        { status: 503 },
                    );
                }

                const result = await env.WALLY_LIMITS_DB
                    .prepare('SELECT 1 AS ok')
                    .first();

                return Response.json({
                    database: result?.ok === 1 ? 'connected' : 'error',
                });
            } catch {
                return Response.json(
                    { database: 'error' },
                    { status: 503 },
                );
            }
        }

        if (url.pathname === '/api/wally') {
            if (request.method !== 'POST') {
                return Response.json(
                    { error: 'METHOD_NOT_ALLOWED' },
                    {
                        status: 405,
                        headers: {
                            Allow: 'POST',
                            'Cache-Control': 'no-store',
                        },
                    },
                );
            }

            return handleWally({
                request,
                env,
                ...ctx,
            });
        }

        if (url.pathname.startsWith('/api/')) {
            return Response.json(
                { error: 'NOT_FOUND' },
                { status: 404 },
            );
        }

        return env.ASSETS.fetch(request);
    },
};

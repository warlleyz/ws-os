
import { onRequestPost as handleWally } from '../functions/api/wally.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

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

            return handleWally({ request, env, ctx });
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

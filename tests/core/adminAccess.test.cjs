
const { test } = require('node:test');
const assert = require('node:assert/strict');

const loadWorker = () =>
    import('../../worker/index.js').then((module) => module.default);

const env = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
};

test('rotas administrativas bloqueiam visitantes', async () => {
    const worker = await loadWorker();

    for (const endpoint of ['/api/admin/status', '/api/admin/posts']) {
        const response = await worker.fetch(
            new Request(`https://ws.test${endpoint}`),
            env
        );

        assert.equal(response.status, 401);
        assert.equal(
            (await response.json()).error,
            'Não autenticado.'
        );
        assert.equal(response.headers.get('cache-control'), 'no-store');
    }
});

test('rotas administrativas rejeitam métodos incorretos', async () => {
    const worker = await loadWorker();

    const response = await worker.fetch(
        new Request('https://ws.test/api/admin/posts', {
            method: 'DELETE',
        }),
        env
    );

    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET');
});

test('rotas administrativas não funcionam sem configuração', async () => {
    const worker = await loadWorker();

    const response = await worker.fetch(
        new Request('https://ws.test/api/admin/posts'),
        {}
    );

    assert.equal(response.status, 503);
});


/* === Auditoria das rotas administrativas === */
/* ----- Endpoints protegidos ----- */
const protectedRoutes = [
    { path: '/api/admin/status', method: 'GET' },
    { path: '/api/admin/posts', method: 'GET' },
    { path: '/api/admin/posts/create', method: 'POST' },
    { path: '/api/admin/posts/update', method: 'PATCH' },
    { path: '/api/admin/posts/status', method: 'PATCH' },
    { path: '/api/admin/posts/delete', method: 'DELETE' },
    { path: '/api/admin/content?kind=events', method: 'GET' },
    { path: '/api/admin/content?kind=files', method: 'GET' },
];

/* ----- Bloquear requisições sem autenticação ----- */
test('todas as rotas administrativas bloqueiam visitantes', async () => {
    const worker = await loadWorker();

    for (const route of protectedRoutes) {
        const request = new Request(
            `https://ws.test${route.path}`,
            { method: route.method },
        );

        const response = await worker.fetch(request, env);

        assert.equal(
            response.status,
            401,
            `${route.method} ${route.path} deveria exigir autenticação`,
        );

        assert.equal(
            response.headers.get('cache-control'),
            'no-store',
        );
    }
});

/* ----- Bloquear configuração ausente ----- */
test('rotas administrativas falham de forma segura sem configuração', async () => {
    const worker = await loadWorker();

    for (const route of protectedRoutes) {
        const response = await worker.fetch(
            new Request(`https://ws.test${route.path}`, {
                method: route.method,
            }),
            {},
        );

        assert.equal(
            response.status,
            503,
            `${route.method} ${route.path} deveria bloquear acesso sem configuração`,
        );
    }
});

/* ----- Impedir métodos inesperados ----- */
test('rotas de publicações rejeitam métodos incorretos', async () => {
    const worker = await loadWorker();

    const cases = [
        { path: '/api/admin/posts', method: 'POST' },
        { path: '/api/admin/posts/create', method: 'GET' },
        { path: '/api/admin/posts/update', method: 'DELETE' },
        { path: '/api/admin/posts/status', method: 'POST' },
        { path: '/api/admin/posts/delete', method: 'PATCH' },
    ];

    for (const route of cases) {
        const response = await worker.fetch(
            new Request(`https://ws.test${route.path}`, {
                method: route.method,
            }),
            env,
        );

        assert.equal(response.status, 405);
        assert.equal(response.headers.get('cache-control'), 'no-store');
    }
});


/* === Autorização administrativa negativa === */
/* ----- Simular um usuário comum do Supabase ----- */
test('usuário autenticado sem permissão administrativa é bloqueado', async () => {
    const worker = await loadWorker();
    const originalFetch = globalThis.fetch;
    const requests = [];

    globalThis.fetch = async (input) => {
        const url = new URL(String(input));
        requests.push(url.pathname);

        if (url.pathname === '/auth/v1/user') {
            return Response.json({
                id: '00000000-0000-4000-8000-000000000001',
            });
        }

        if (url.pathname === '/rest/v1/admin_users') {
            return Response.json([]);
        }

        throw new Error(`Acesso inesperado: ${url.pathname}`);
    };

    try {
        for (const endpoint of [
            '/api/admin/status',
            '/api/admin/posts',
        ]) {
            const response = await worker.fetch(
                new Request(`https://ws.test${endpoint}`, {
                    headers: {
                        Authorization: 'Bearer usuario-comum',
                    },
                }),
                env,
            );

            assert.equal(response.status, 403);
            assert.equal(response.headers.get('cache-control'), 'no-store');
        }

        assert.equal(
            requests.some((path) => path === '/rest/v1/posts'),
            false,
        );
    } finally {
        globalThis.fetch = originalFetch;
    }
});

/* === Falhas de verificação === */
/* ----- Não conceder acesso quando o Supabase falhar ----- */
test('falha na verificação administrativa não libera acesso', async () => {
    const worker = await loadWorker();
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
        throw new Error('Serviço indisponível');
    };

    try {
        const response = await worker.fetch(
            new Request('https://ws.test/api/admin/status', {
                headers: {
                    Authorization: 'Bearer token-teste',
                },
            }),
            env,
        );

        assert.equal(response.status, 502);
        assert.equal(response.headers.get('cache-control'), 'no-store');
    } finally {
        globalThis.fetch = originalFetch;
    }
});


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

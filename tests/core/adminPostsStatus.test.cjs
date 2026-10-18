
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
    path.resolve(__dirname, '../../functions/api/adminPosts.js'),
    'utf8'
);

function loadHandler({ authorized = true, fetchMock } = {}) {
    const code = source
        .replace(
            /^import\s+\{\s*requireAdministrator\s*\}\s+from\s+['"]\.\/auth\.js['"];?\s*/m,
            ''
        )
        .replace(/\bexport\s+/g, '');

    return vm.runInNewContext(
        `(() => { ${code}; return onRequestChangeStatus; })()`,
        {
            Request,
            Response,
            URL,
            URLSearchParams,
            AbortSignal,
            TextDecoder,
            TextEncoder,
            fetch: fetchMock ?? (async () => {
                throw new Error('Unexpected fetch');
            }),
            requireAdministrator: async () =>
                authorized
                    ? { authorized: true, response: null }
                    : {
                        authorized: false,
                        response: Response.json(
                            { error: 'Não autenticado.' },
                            { status: 401 }
                        ),
                    },
        }
    );
}

const env = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
};

function createRequest(action, id = 'nota-teste') {
    return new Request('https://ws.test/api/admin/posts/status', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token-de-teste',
        },
        body: JSON.stringify({ id, action }),
    });
}

test('visitante não pode alterar status', async () => {
    let called = false;

    const handler = loadHandler({
        authorized: false,
        fetchMock: async () => {
            called = true;
            throw new Error('Unexpected fetch');
        },
    });

    const response = await handler({
        request: createRequest('publish'),
        env,
    });

    assert.equal(response.status, 401);
    assert.equal(called, false);
});

test('ações e identificadores inválidos são rejeitados', async () => {
    const handler = loadHandler();

    for (const [action, id] of [
        ['delete', 'nota-teste'],
        ['publish', '../invalid'],
        ['', 'nota-teste'],
    ]) {
        const response = await handler({
            request: createRequest(action, id),
            env,
        });

        assert.equal(response.status, 400);
    }
});

test('publicar exige draft e define data de publicação', async () => {
    let call;

    const handler = loadHandler({
        fetchMock: async (url, options) => {
            call = { url: new URL(url), options };

            return Response.json([
                {
                    id: 'nota-teste',
                    status: 'published',
                    published_at: '2026-10-17T12:00:00.000Z',
                },
            ]);
        },
    });

    const response = await handler({
        request: createRequest('publish'),
        env,
    });

    assert.equal(response.status, 200);
    assert.equal(call.url.searchParams.get('status'), 'eq.draft');
    assert.equal(call.options.method, 'PATCH');

    const payload = JSON.parse(call.options.body);

    assert.equal(payload.status, 'published');
    assert.ok(Number.isFinite(Date.parse(payload.published_at)));
});

test('despublicar exige published e remove data', async () => {
    let call;

    const handler = loadHandler({
        fetchMock: async (url, options) => {
            call = { url: new URL(url), options };

            return Response.json([
                {
                    id: 'nota-teste',
                    status: 'draft',
                    published_at: null,
                },
            ]);
        },
    });

    const response = await handler({
        request: createRequest('unpublish'),
        env,
    });

    assert.equal(response.status, 200);
    assert.equal(call.url.searchParams.get('status'), 'eq.published');

    const payload = JSON.parse(call.options.body);

    assert.equal(payload.status, 'draft');
    assert.equal(payload.published_at, null);
});

test('mudança concorrente não retorna sucesso', async () => {
    const handler = loadHandler({
        fetchMock: async () => Response.json([]),
    });

    const response = await handler({
        request: createRequest('publish'),
        env,
    });

    assert.equal(response.status, 409);
});

test('falha do Supabase não retorna sucesso', async () => {
    const handler = loadHandler({
        fetchMock: async () =>
            Response.json(
                { error: 'Falha simulada' },
                { status: 500 }
            ),
    });

    const response = await handler({
        request: createRequest('publish'),
        env,
    });

    assert.equal(response.status, 502);
});

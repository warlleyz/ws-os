
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
    path.resolve(__dirname, '../../functions/api/adminPosts.js'),
    'utf8'
);

const env = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
};

function loadHandler({ authorized = true, fetchMock } = {}) {
    const code = source
        .replace(
            /^import\s+\{\s*requireAdministrator\s*\}\s+from\s+['"]\.\/auth\.js['"];?\s*/m,
            ''
        )
        .replace(/\bexport\s+/g, '');

    return vm.runInNewContext(
        `(() => { ${code}; return onRequestDelete; })()`,
        {
            Request,
            Response,
            URL,
            URLSearchParams,
            AbortSignal,
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

function createRequest(id = 'nota-teste') {
    return new Request(
        `https://ws.test/api/admin/posts/delete?id=${encodeURIComponent(id)}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer token-de-teste',
            },
        }
    );
}

test('visitantes não conseguem excluir publicações', async () => {
    let called = false;

    const handler = loadHandler({
        authorized: false,
        fetchMock: async () => {
            called = true;
            throw new Error('Unexpected fetch');
        },
    });

    const response = await handler({
        request: createRequest(),
        env,
    });

    assert.equal(response.status, 401);
    assert.equal(called, false);
});

test('identificadores inválidos são rejeitados', async () => {
    const handler = loadHandler();

    for (const id of ['', '../nota', 'id com espaços']) {
        const response = await handler({
            request: createRequest(id),
            env,
        });

        assert.equal(response.status, 400);
    }
});

test('exclusão válida usa DELETE e exige confirmação do Supabase', async () => {
    let call;

    const handler = loadHandler({
        fetchMock: async (url, options) => {
            call = { url: new URL(url), options };

            return Response.json([{ id: 'nota-teste' }]);
        },
    });

    const response = await handler({
        request: createRequest(),
        env,
    });

    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.success, true);
    assert.equal(result.id, 'nota-teste');
    assert.equal(call.options.method, 'DELETE');
    assert.equal(call.url.searchParams.get('id'), 'eq.nota-teste');
    assert.equal(call.options.headers.Prefer, 'return=representation');
});

test('publicação inexistente não retorna sucesso', async () => {
    const handler = loadHandler({
        fetchMock: async () => Response.json([]),
    });

    const response = await handler({
        request: createRequest(),
        env,
    });

    assert.equal(response.status, 404);
    assert.equal((await response.json()).success, undefined);
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
        request: createRequest(),
        env,
    });

    assert.equal(response.status, 502);
    assert.equal((await response.json()).success, undefined);
});

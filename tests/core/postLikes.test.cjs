
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const source = fs.readFileSync(
    path.resolve(__dirname, '../../functions/api/postLikes.js'),
    'utf8'
);

const env = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    POST_LIKES_HASH_SALT: 'test-hash-salt',
    WALLY_LIMITS_DB: {},
};

function createRequest({
    method = 'POST',
    id = 'nota-teste',
    origin = 'https://ws.test',
    ip = '192.0.2.10',
    visitorId = '0123456789abcdef0123456789abcdef',
} = {}) {
    const headers = {};

    if (origin !== null) {
        headers.Origin = origin;
    }

    if (ip !== null) {
        headers['CF-Connecting-IP'] = ip;
    }

    if (visitorId !== null) {
        headers['X-WS-Visitor-ID'] = visitorId;
    }

    return new Request(
        `https://ws.test/api/posts/likes${method === 'POST' ? '/add' : ''}?id=${encodeURIComponent(id)}`,
        { method, headers }
    );
}

function createMockSupabase({
    published = true,
    count = 0,
    failure = null,
} = {}) {
    const calls = [];
    const visitors = new Set();

    async function fetchMock(url, options = {}) {
        const parsed = new URL(url);
        calls.push({ url: parsed, options });

        if (failure === 'all') {
            return Response.json(
                { error: 'Falha simulada' },
                { status: 500 }
            );
        }

        if (parsed.pathname === '/rest/v1/posts') {
            return Response.json(
                published ? [{ id: 'nota-teste' }] : []
            );
        }


        if (
            parsed.pathname === '/rest/v1/post_likes' &&
            options.method !== 'POST'
        ) {
            const visitorHash = parsed.searchParams
                .get('visitor_hash')
                ?.replace(/^eq\./, '');

            return Response.json(
                visitors.has(visitorHash) ? [{ id: 1 }] : []
            );
        }


        if (parsed.pathname === '/rest/v1/post_likes') {
            if (failure === 'insert') {
                return Response.json(
                    { error: 'Falha simulada' },
                    { status: 500 }
                );
            }

            const payload = JSON.parse(options.body);

            visitors.add(payload.visitor_hash);

            return new Response(null, { status: 201 });
        }

        if (parsed.pathname === '/rest/v1/rpc/get_post_likes_count') {
            return Response.json(count + visitors.size);
        }

        throw new Error(`Rota inesperada: ${parsed.pathname}`);
    }

    return { fetchMock, calls, visitors };
}

function createHandlers(options = {}) {
    const code = source
        .replace(
            /^import\s+\{\s*checkPostLikeRateLimit\s*\}\s+from\s+['"]\.\.\/_lib\/postLikeRateLimit\.js['"];?\s*/m,
            ''
        )
        .replace(/\bexport\s+/g, '');

    return vm.runInNewContext(
        `(() => {
      ${code}
      return {
        get: onRequestGet,
        post: onRequestPost
      };
    })()`,
        {
            Request,
            Response,
            URL,
            URLSearchParams,
            AbortSignal,
            TextEncoder,
            Uint8Array,
            crypto: webcrypto,
            fetch: options.fetchMock ?? (async () => {
                throw new Error('Requisição inesperada');
            }),
            checkPostLikeRateLimit: async () =>
                options.allowed === false
                    ? {
                        allowed: false,
                        reason: options.limitReason || 'RATE_LIMIT_EXCEEDED',
                        retryAfter: 60,
                    }
                    : { allowed: true, reason: null },
        }
    );
}

test('IDs inválidos são rejeitados antes de consultar o Supabase', async () => {
    const handlers = createHandlers();

    for (const id of ['../invalid', 'id com espaços', '']) {
        const response = await handlers.post({
            request: createRequest({ id }),
            env,
        });

        assert.equal(response.status, 400);
    }
});

test('origem diferente do site é bloqueada', async () => {
    const handlers = createHandlers();

    const response = await handlers.post({
        request: createRequest({
            origin: 'https://site-externo.test',
        }),
        env,
    });

    assert.equal(response.status, 403);
});

test('rascunhos não podem receber curtidas', async () => {
    const supabase = createMockSupabase({ published: false });
    const handlers = createHandlers(supabase);

    const response = await handlers.post({
        request: createRequest(),
        env,
    });

    assert.equal(response.status, 404);

    assert.equal(
        supabase.calls.some(
            (call) => call.url.pathname === '/rest/v1/post_likes'
        ),
        false
    );
});

test('curtida válida utiliza chave privilegiada somente na escrita', async () => {
    const supabase = createMockSupabase();
    const handlers = createHandlers(supabase);

    const response = await handlers.post({
        request: createRequest(),
        env,
    });

    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.count, 1);

    const insertion = supabase.calls.find(
        (call) => call.url.pathname === '/rest/v1/post_likes'
    );

    assert.ok(insertion);
    assert.equal(insertion.options.method, 'POST');
    assert.equal(
        insertion.options.headers.apikey,
        env.SUPABASE_SERVICE_ROLE_KEY
    );

    assert.ok(
        !JSON.stringify(data).includes(env.SUPABASE_SERVICE_ROLE_KEY)
    );

    const payload = JSON.parse(insertion.options.body);

    assert.match(payload.visitor_hash, /^[a-f0-9]{64}$/);
    assert.ok(!JSON.stringify(payload).includes('192.0.2.10'));
});

test('curtida repetida não aumenta a contagem', async () => {
    const supabase = createMockSupabase();
    const handlers = createHandlers(supabase);

    const first = await handlers.post({
        request: createRequest(),
        env,
    });

    const second = await handlers.post({
        request: createRequest(),
        env,
    });

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);

    assert.equal((await first.json()).count, 1);
    assert.equal((await second.json()).count, 1);
    assert.equal(supabase.visitors.size, 1);
});

test('limite de requisições retorna HTTP 429', async () => {
    const supabase = createMockSupabase();
    const handlers = createHandlers({
        ...supabase,
        allowed: false,
    });

    const response = await handlers.post({
        request: createRequest(),
        env,
    });

    assert.equal(response.status, 429);
    assert.equal(response.headers.get('Retry-After'), '60');
    assert.equal(supabase.calls.length, 0);
});

test('falha na escrita não retorna sucesso', async () => {
    const supabase = createMockSupabase({ failure: 'insert' });
    const handlers = createHandlers(supabase);

    const response = await handlers.post({
        request: createRequest(),
        env,
    });

    assert.equal(response.status, 502);
    assert.notEqual((await response.json()).success, true);
});

test('consulta pública retorna contagem sem autenticação', async () => {
    const supabase = createMockSupabase({ count: 7 });
    const handlers = createHandlers(supabase);

    const response = await handlers.get({
        request: createRequest({
            method: 'GET',
            ip: null,
            visitorId: null,
        }),
        env,
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).count, 7);

    assert.equal(
        supabase.calls.some(
            (call) =>
                call.options.headers?.apikey ===
                env.SUPABASE_SERVICE_ROLE_KEY
        ),
        false
    );
});

test('falha na consulta pública retorna HTTP 502', async () => {
    const supabase = createMockSupabase({ failure: 'all' });
    const handlers = createHandlers(supabase);

    const response = await handlers.get({
        request: createRequest({ method: 'GET' }),
        env,
    });

    assert.equal(response.status, 502);
});


test('reconhece curtida existente pelo identificador do navegador', async () => {
    const supabase = createMockSupabase();
    const handlers = createHandlers(supabase);

    const requestOptions = {
        visitorId: '0123456789abcdef0123456789abcdef',
    };

    const likedResponse = await handlers.post({
        request: createRequest(requestOptions),
        env,
    });

    assert.equal(likedResponse.status, 200);

    const statusResponse = await handlers.get({
        request: createRequest({
            ...requestOptions,
            method: 'GET',
        }),
        env,
    });

    const data = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(data.count, 1);
    assert.equal(data.liked, true);

    const insertCalls = supabase.calls.filter(
        (call) => call.url.pathname === '/rest/v1/post_likes' &&
            call.options.method === 'POST'
    );

    assert.equal(insertCalls.length, 1);
});

test('visitante diferente não aparece como curtido', async () => {
    const supabase = createMockSupabase();
    const handlers = createHandlers(supabase);

    await handlers.post({
        request: createRequest({
            visitorId: '0123456789abcdef0123456789abcdef',
        }),
        env,
    });

    const response = await handlers.get({
        request: createRequest({
            method: 'GET',
            visitorId: 'fedcba9876543210fedcba9876543210',
        }),
        env,
    });

    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.count, 1);
    assert.equal(data.liked, false);
});

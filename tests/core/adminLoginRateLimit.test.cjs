
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');

const loadLimiter = () =>
    import('../../functions/_lib/adminLoginRateLimit.js');

function createDatabase() {
    const records = new Map();

    return {
        prepare() {
            return {
                bind(key, expiresAt, max) {
                    return {
                        async first() {
                            const current = records.get(key);
                            const attempts = (current?.attempts ?? 0) + 1;

                            if (attempts > max) return null;

                            records.set(key, { attempts, expiresAt });
                            return { attempts };
                        },
                    };
                },
            };
        },
    };
}

function createRequest(ip = '192.0.2.1') {
    return new Request('https://ws.test/api/auth/login', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': ip },
    });
}

function createEnv() {
    return {
        WALLY_LIMITS_DB: createDatabase(),
        ADMIN_LOGIN_RATE_LIMIT_SALT: 'test-salt-not-for-production',
    };
}

test('permite cinco tentativas e bloqueia a sexta', async () => {
    const { checkAdminLoginRateLimit } = await loadLimiter();

    const originalCrypto = globalThis.crypto;

    try {
        Object.defineProperty(globalThis, 'crypto', {
            value: webcrypto,
            configurable: true,
        });

        const env = createEnv();
        const request = createRequest();

        for (let i = 0; i < 5; i++) {
            const result = await checkAdminLoginRateLimit(request, env);
            assert.equal(result.allowed, true);
        }

        const blocked = await checkAdminLoginRateLimit(request, env);

        assert.equal(blocked.allowed, false);
        assert.equal(blocked.reason, 'RATE_LIMIT_EXCEEDED');
        assert.ok(blocked.retryAfter > 0);
    } finally {
        Object.defineProperty(globalThis, 'crypto', {
            value: originalCrypto,
            configurable: true,
        });
    }
});

test('identificadores diferentes possuem contagens independentes', async () => {
    const { checkAdminLoginRateLimit } = await loadLimiter();

    const env = createEnv();

    const first = await checkAdminLoginRateLimit(
        createRequest('192.0.2.10'),
        env
    );

    const second = await checkAdminLoginRateLimit(
        createRequest('192.0.2.20'),
        env
    );

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
});

test('bloqueia login quando o limitador está indisponível', async () => {
    const { checkAdminLoginRateLimit } = await loadLimiter();

    const result = await checkAdminLoginRateLimit(
        createRequest(),
        {}
    );

    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'LIMITER_NOT_CONFIGURED');
});


test('reinicia a contagem em uma nova janela de 15 minutos', async () => {
    const { checkAdminLoginRateLimit } = await loadLimiter();

    const env = createEnv();
    const request = createRequest('192.0.2.30');

    const originalNow = Date.now;
    const windowSeconds = 15 * 60;
    const windowStart = Math.floor(
        originalNow() / 1000 / windowSeconds
    ) * windowSeconds;

    try {
        Date.now = () => (windowStart + 10) * 1000;

        for (let i = 0; i < 5; i++) {
            const result = await checkAdminLoginRateLimit(request, env);
            assert.equal(result.allowed, true);
        }

        const blocked = await checkAdminLoginRateLimit(request, env);
        assert.equal(blocked.reason, 'RATE_LIMIT_EXCEEDED');

        Date.now = () => (windowStart + windowSeconds + 10) * 1000;

        const renewed = await checkAdminLoginRateLimit(request, env);
        assert.equal(renewed.allowed, true);
    } finally {
        Date.now = originalNow;
    }
});

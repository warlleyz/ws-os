
import { checkAdminLoginRateLimit } from '../_lib/adminLoginRateLimit.js';

/* === Constantes e configurações === */
/* ----- Limites de autenticação ----- */
const MAX_BODY_BYTES = 4096;
const AUTH_TIMEOUT_MS = 10000;

/* ----- Respostas JSON ----- */
const json = (body, status = 200) =>
    Response.json(body, {
        status,
        headers: {
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    });

/* === Leitura e validação de requisições === */
/* ----- Leitura limitada do corpo JSON ----- */
async function readLimitedJson(request, maxBytes = MAX_BODY_BYTES) {
    if (!request.body) {
        throw new SyntaxError('EMPTY_BODY');
    }

    const reader = request.body.getReader();
    const chunks = [];
    let totalBytes = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            totalBytes += value.byteLength;

            if (totalBytes > maxBytes) {
                throw new RangeError('BODY_TOO_LARGE');
            }

            chunks.push(value);
        }
    } finally {
        await reader.cancel().catch(() => { });
        reader.releaseLock();
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    );
}

/* === Configuração do Supabase === */
/* ----- Validação das variáveis de ambiente ----- */
function getConfig(env) {
    if (
        !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
        !env.SUPABASE_ANON_KEY
    ) {
        return null;
    }

    return {
        url: env.SUPABASE_URL,
        key: env.SUPABASE_ANON_KEY,
    };
}

/* ----- Requisições ao Supabase ----- */
async function supabaseFetch(config, path, options = {}) {
    return fetch(new URL(path, config.url), {
        ...options,
        headers: {
            apikey: config.key,
            ...options.headers,
        },
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
}

/* === Autorização administrativa === */
/* ----- Verificação do usuário administrador ----- */
async function verifyAdministrator(config, token) {
    const userResponse = await supabaseFetch(config, '/auth/v1/user', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!userResponse.ok) {
        return false;
    }

    const user = await userResponse.json();

    if (!user?.id || typeof user.id !== 'string') {
        return false;
    }

    const url = new URL('/rest/v1/admin_users', config.url);

    url.search = new URLSearchParams({
        select: 'user_id',
        user_id: `eq.${user.id}`,
        limit: '1',
    });

    const adminResponse = await supabaseFetch(
        config,
        url.pathname + url.search,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    if (!adminResponse.ok) {
        throw new Error('ADMIN_VERIFICATION_FAILED');
    }

    const rows = await adminResponse.json();

    return (
        Array.isArray(rows) &&
        rows.length === 1 &&
        rows[0]?.user_id === user.id
    );
}

/* ----- Proteção das rotas administrativas ----- */
export async function requireAdministrator(request, env) {
    const config = getConfig(env);

    if (!config) {
        return {
            authorized: false,
            response: json({ error: 'Autenticação não configurada.' }, 503),
        };
    }

    const authorization = request.headers.get('authorization') ?? '';
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);

    if (!match) {
        return {
            authorized: false,
            response: json({ error: 'Não autenticado.' }, 401),
        };
    }

    try {
        const authorized = await verifyAdministrator(config, match[1]);

        if (!authorized) {
            return {
                authorized: false,
                response: json({ error: 'Acesso não autorizado.' }, 403),
            };
        }

        return {
            authorized: true,
            response: null,
        };
    } catch {
        return {
            authorized: false,
            response: json(
                { error: 'Não foi possível verificar a autorização.' },
                502,
            ),
        };
    }
}

/* === Status administrativo === */
/* ----- Consulta de autorização ----- */
export async function onRequestAdminStatus({ request, env }) {
    const access = await requireAdministrator(request, env);

    if (!access.authorized) {
        return access.response;
    }

    return json({
        admin: true,
        status: 'authorized',
    });
}

/* === Login administrativo === */
/* ----- Autenticação e criação da sessão ----- */
export async function onRequestLogin({ request, env }) {
    const config = getConfig(env);

    if (!config) {
        return json({ error: 'Autenticação não configurada.' }, 503);
    }

    /* ----- Limitação de tentativas ----- */
    const limit = await checkAdminLoginRateLimit(request, env);

    if (!limit.allowed) {
        if (limit.reason === 'RATE_LIMIT_EXCEEDED') {
            return Response.json(
                { error: 'Muitas tentativas. Tente novamente mais tarde.' },
                {
                    status: 429,
                    headers: {
                        'Cache-Control': 'no-store',
                        'Retry-After': String(limit.retryAfter),
                        'X-Content-Type-Options': 'nosniff',
                    },
                },
            );
        }

        return json(
            { error: 'Proteção de autenticação indisponível.' },
            503,
        );
    }

    /* ----- Verificação do tamanho da requisição ----- */
    const contentLength = request.headers.get('content-length');

    if (
        contentLength !== null &&
        Number.isFinite(Number(contentLength)) &&
        Number(contentLength) > MAX_BODY_BYTES
    ) {
        return json({ error: 'Requisição inválida.' }, 413);
    }

    /* ----- Leitura das credenciais ----- */
    let credentials;

    try {
        credentials = await readLimitedJson(request);
    } catch (error) {
        if (
            error instanceof RangeError &&
            error.message === 'BODY_TOO_LARGE'
        ) {
            return json({ error: 'Requisição inválida.' }, 413);
        }

        return json({ error: 'Dados inválidos.' }, 400);
    }

    /* ----- Validação das credenciais ----- */
    const email = credentials?.email;
    const password = credentials?.password;

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        email.length > 254 ||
        !password ||
        password.length > 1024
    ) {
        return json({ error: 'Credenciais inválidas.' }, 400);
    }

    /* ----- Autenticação remota ----- */
    try {
        const response = await supabaseFetch(
            config,
            '/auth/v1/token?grant_type=password',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            },
        );

        if (!response.ok) {
            return json(
                { error: 'Credenciais inválidas ou acesso negado.' },
                401,
            );
        }

        /* ----- Validação da resposta do Supabase ----- */
        const data = await response.json();

        if (
            typeof data.access_token !== 'string' ||
            !Number.isFinite(data.expires_in) ||
            data.expires_in <= 0
        ) {
            return json(
                { error: 'Resposta de autenticação inválida.' },
                502,
            );
        }

        /* ----- Confirmação de permissão administrativa ----- */
        const authorized = await verifyAdministrator(
            config,
            data.access_token,
        );

        if (!authorized) {
            return json(
                { error: 'Credenciais inválidas ou acesso negado.' },
                403,
            );
        }

        /* ----- Retorno da sessão autorizada ----- */
        return json({
            access_token: data.access_token,
            expires_in: data.expires_in,
        });
    } catch {
        return json(
            { error: 'Serviço de autenticação indisponível.' },
            502,
        );
    }
}

/* === Consulta da sessão === */
/* ----- Validação do administrador autenticado ----- */
export async function onRequestMe({ request, env }) {
    const config = getConfig(env);

    if (!config) {
        return json({ error: 'Autenticação não configurada.' }, 503);
    }

    const authorization = request.headers.get('authorization') ?? '';
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);

    if (!match) {
        return json({ error: 'Não autenticado.' }, 401);
    }

    try {
        const authorized = await verifyAdministrator(config, match[1]);

        if (!authorized) {
            return json({ error: 'Acesso não autorizado.' }, 403);
        }

        return json({ admin: true });
    } catch {
        return json(
            { error: 'Não foi possível verificar a sessão.' },
            502,
        );
    }
}

/* === Encerramento da sessão === */
/* ----- Logout remoto ----- */
export async function onRequestLogout({ request, env }) {
    const config = getConfig(env);

    if (!config) {
        return json({ error: 'Autenticação não configurada.' }, 503);
    }

    const authorization = request.headers.get('authorization') ?? '';
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);

    if (!match) {
        return json({ error: 'Não autenticado.' }, 401);
    }

    try {
        const response = await supabaseFetch(
            config,
            '/auth/v1/logout',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${match[1]}`,
                },
            },
        );

        if (!response.ok) {
            return json(
                { error: 'Falha ao encerrar a sessão remota.' },
                502,
            );
        }

        return json({ success: true });
    } catch {
        return json(
            { error: 'Serviço de autenticação indisponível.' },
            502,
        );
    }
}

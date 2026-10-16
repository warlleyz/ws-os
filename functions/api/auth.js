
const json = (body, status = 200) =>
    Response.json(body, {
        status,
        headers: {
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    });

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

async function supabaseFetch(config, path, options = {}) {
    return fetch(new URL(path, config.url), {
        ...options,
        headers: {
            apikey: config.key,
            ...options.headers,
        },
        signal: AbortSignal.timeout(10000),
    });
}

async function verifyAdministrator(config, token) {
    const userResponse = await supabaseFetch(config, '/auth/v1/user', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!userResponse.ok) return false;

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

    const adminResponse = await supabaseFetch(config, url.pathname + url.search, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!adminResponse.ok) {
        throw new Error('ADMIN_VERIFICATION_FAILED');
    }

    const rows = await adminResponse.json();

    return Array.isArray(rows) &&
        rows.length === 1 &&
        rows[0]?.user_id === user.id;
}

export async function onRequestLogin({ request, env }) {
    const config = getConfig(env);

    if (!config) {
        return json({ error: 'Autenticação não configurada.' }, 503);
    }

    if (Number(request.headers.get('content-length')) > 4096) {
        return json({ error: 'Requisição inválida.' }, 413);
    }

    let credentials;

    try {
        credentials = await request.json();
    } catch {
        return json({ error: 'Dados inválidos.' }, 400);
    }

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
            return json({ error: 'Credenciais inválidas ou acesso negado.' }, 401);
        }

        const data = await response.json();

        if (
            typeof data.access_token !== 'string' ||
            !Number.isFinite(data.expires_in) ||
            data.expires_in <= 0
        ) {
            return json({ error: 'Resposta de autenticação inválida.' }, 502);
        }

        const authorized = await verifyAdministrator(
            config,
            data.access_token,
        );

        if (!authorized) {
            return json({ error: 'Credenciais inválidas ou acesso negado.' }, 403);
        }

        return json({
            access_token: data.access_token,
            expires_in: data.expires_in,
        });
    } catch {
        return json({ error: 'Serviço de autenticação indisponível.' }, 502);
    }
}

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
        return json({ error: 'Não foi possível verificar a sessão.' }, 502);
    }
}


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
        const response = await supabaseFetch(config, '/auth/v1/logout', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${match[1]}`,
            },
        });

        if (!response.ok) {
            return json({ error: 'Falha ao encerrar a sessão remota.' }, 502);
        }

        return json({ success: true });
    } catch {
        return json({ error: 'Serviço de autenticação indisponível.' }, 502);
    }
}


const AUTH_ENDPOINT = '/api/auth';

let session = null;

async function authRequest(path, options = {}) {
    const response = await fetch(`${AUTH_ENDPOINT}${path}`, {
        ...options,
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação.');
    }

    return data;
}

export async function loginAdmin(email, password) {
    if (!email?.trim() || !password) {
        throw new Error('Informe o e-mail e a senha.');
    }

    const data = await authRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
            email: email.trim(),
            password,
        }),
    });

    if (!data.access_token || !data.expires_in) {
        throw new Error('Resposta de autenticação inválida.');
    }

    session = {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };

    return true;
}

export function getAdminAccessToken() {
    if (!session) return null;

    if (Date.now() >= session.expiresAt) {
        session = null;
        return null;
    }

    return session.accessToken;
}

export async function verifyAdminSession() {
    const token = getAdminAccessToken();
    if (!token) return false;

    try {
        const data = await authRequest('/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (data.admin !== true) {
            session = null;
            return false;
        }

        return true;
    } catch {
        session = null;
        return false;
    }
}

export function isAdminAuthenticated() {
    return getAdminAccessToken() !== null;
}

export async function logoutAdmin() {
    const token = getAdminAccessToken();

    session = null;

    if (!token) return true;

    try {
        await authRequest('/logout', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return true;
    } catch {
        return false;
    }
}
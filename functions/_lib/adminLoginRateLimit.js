
const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;

async function hashIdentifier(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);

    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export async function checkAdminLoginRateLimit(request, env) {
    if (!env.WALLY_LIMITS_DB || !env.ADMIN_LOGIN_RATE_LIMIT_SALT) {
        return { allowed: false, reason: 'LIMITER_NOT_CONFIGURED' };
    }

    const ip = request.headers.get('CF-Connecting-IP');

    if (!ip) {
        return { allowed: false, reason: 'VISITOR_UNIDENTIFIED' };
    }

    try {
        const identifier = await hashIdentifier(
            `${env.ADMIN_LOGIN_RATE_LIMIT_SALT}:${ip}`
        );

        const now = Math.floor(Date.now() / 1000);
        const windowId = Math.floor(now / WINDOW_SECONDS);
        const expiresAt = (windowId + 1) * WINDOW_SECONDS;
        const key = `admin-login:${windowId}:${identifier}`;

        const row = await env.WALLY_LIMITS_DB.prepare(`
      INSERT INTO admin_login_limits
        (rate_key, attempts, expires_at)
      VALUES (?1, 1, ?2)
      ON CONFLICT(rate_key) DO UPDATE SET
        attempts = attempts + 1
      WHERE attempts < ?3
      RETURNING attempts
    `)
            .bind(key, expiresAt, MAX_ATTEMPTS)
            .first();

        if (!row) {
            return {
                allowed: false,
                reason: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.max(1, expiresAt - now),
            };
        }

        return { allowed: true, reason: null };
    } catch {
        return { allowed: false, reason: 'LIMITER_UNAVAILABLE' };
    }
}


const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 20;

export async function checkPostLikeRateLimit(env, identifier) {
    if (!env.WALLY_LIMITS_DB || !identifier) {
        return {
            allowed: false,
            reason: 'LIMITER_NOT_CONFIGURED',
        };
    }

    try {
        const now = Math.floor(Date.now() / 1000);
        const windowId = Math.floor(now / WINDOW_SECONDS);
        const expiresAt = (windowId + 1) * WINDOW_SECONDS;
        const key = `post-like:${windowId}:${identifier}`;

        const row = await env.WALLY_LIMITS_DB.prepare(`
            INSERT INTO post_like_limits
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

        return {
            allowed: true,
            reason: null,
        };
    } catch {
        return {
            allowed: false,
            reason: 'LIMITER_UNAVAILABLE',
        };
    }
}

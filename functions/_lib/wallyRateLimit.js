
const LIMITS = [
    {
        scope: 'visitor-minute',
        max: 5,
        seconds: 60,
    },
    {
        scope: 'global-minute',
        max: 30,
        seconds: 60,
    },
    {
        scope: 'global-day',
        max: 100,
        seconds: 86400,
    },
];

async function hashIdentifier(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

async function consume(db, key, max, expiresAt, now) {
    const row = await db.prepare(`
    INSERT INTO wally_rate_limits
      (rate_key, requests, expires_at)
    VALUES (?1, 1, ?2)
    ON CONFLICT(rate_key) DO UPDATE SET
      requests = CASE
        WHEN expires_at <= ?3 THEN 1
        ELSE requests + 1
      END,
      expires_at = CASE
        WHEN expires_at <= ?3 THEN ?2
        ELSE expires_at
      END
    WHERE expires_at <= ?3 OR requests < ?4
    RETURNING requests
  `)
        .bind(key, expiresAt, now, max)
        .first();

    return Boolean(row);
}

export async function checkWallyRateLimit(request, env) {
    if (!env.WALLY_LIMITS_DB || !env.WALLY_RATE_LIMIT_SALT) {
        return {
            allowed: false,
            reason: 'LIMITER_NOT_CONFIGURED',
        };
    }

    const ip = request.headers.get('CF-Connecting-IP');

    if (!ip) {
        return {
            allowed: false,
            reason: 'VISITOR_UNIDENTIFIED',
        };
    }

    try {
        const visitorId = await hashIdentifier(
            `${env.WALLY_RATE_LIMIT_SALT}:${ip}`,
        );

        const now = Math.floor(Date.now() / 1000);

        for (const limit of LIMITS) {
            const windowId = Math.floor(now / limit.seconds);
            const expiresAt = (windowId + 1) * limit.seconds;

            const subject = limit.scope.startsWith('visitor')
                ? visitorId
                : 'all';

            const key = `${limit.scope}:${windowId}:${subject}`;

            const allowed = await consume(
                env.WALLY_LIMITS_DB,
                key,
                limit.max,
                expiresAt,
                now,
            );

            if (!allowed) {
                return {
                    allowed: false,
                    reason: 'RATE_LIMIT_EXCEEDED',
                };
            }
        }

        return { allowed: true, reason: null };
    } catch {
        return {
            allowed: false,
            reason: 'LIMITER_UNAVAILABLE',
        };
    }
}

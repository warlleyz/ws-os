
-- WS OS V2
-- Cloudflare D1 / SQLite
-- Migração 002: Limite de tentativas de login administrativo

CREATE TABLE IF NOT EXISTS admin_login_limits (
    rate_key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL
);

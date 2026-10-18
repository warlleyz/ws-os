
-- WS OS V2
-- Cloudflare D1 / SQLite
-- Migração 001: Limite de tentativas de curtidas

CREATE TABLE IF NOT EXISTS post_like_limits (
    rate_key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL
);

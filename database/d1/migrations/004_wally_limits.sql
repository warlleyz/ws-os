-- Base que estava ausente do histórico de migrações; não altera registros existentes.
CREATE TABLE IF NOT EXISTS wally_rate_limits (
 rate_key TEXT PRIMARY KEY,
 requests INTEGER NOT NULL CHECK(requests>=0),
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS wally_rate_limits_expiry ON wally_rate_limits(expires_at);

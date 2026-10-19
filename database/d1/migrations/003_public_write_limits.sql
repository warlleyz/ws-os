CREATE TABLE IF NOT EXISTS public_write_limits (
  rate_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS public_write_limits_expiry ON public_write_limits(expires_at);
-- Programar limpeza operacional: DELETE FROM public_write_limits WHERE expires_at < unixepoch();

import { database } from './backend.js';

/* === Manutenção agendada, sem dados pessoais em logs === */
export async function runMaintenance(env) {
  if (env.WALLY_LIMITS_DB) {
    const now = Math.floor(Date.now() / 1000);
    const tables = [
      'admin_login_limits',
      'post_like_limits',
      'public_write_limits',
      'wally_rate_limits',
    ];
    await env.WALLY_LIMITS_DB.batch(
      tables.map((table) =>
        env.WALLY_LIMITS_DB.prepare(`DELETE FROM ${table} WHERE expires_at <= ?1`).bind(now),
      ),
    );
  }
  /* ----- Habilitar somente depois de validar a migração e a política de retenção em homologação. ----- */
  if (env.REQUEST_RETENTION_ENABLED === 'true') {
    return database(env, 'rpc/purge_expired_private_requests', {
      method: 'POST',
      service: true,
      body: {},
    });
  }
  return null;
}

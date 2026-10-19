/* === Configuração do cache público === */
/* ----- Limites e períodos ----- */
export const PUBLIC_CACHE_LIMITS = Object.freeze({
  MAX_ENTRIES: 32,
  DEFAULT_TTL: 5 * 60 * 1000,
  MAX_STALE_AGE: 24 * 60 * 60 * 1000,
});

/* ----- Categorias de recursos ----- */
export const PUBLIC_CACHE_POLICIES = Object.freeze({
  default: 5 * 60 * 1000,
  content: 5 * 60 * 1000,
  projects: 5 * 60 * 1000,
  weather: 10 * 60 * 1000,
  statistics: 5 * 60 * 1000,
});

/* === Identificação do recurso === */
/* ----- Política por categoria ----- */
export function getPublicCacheTTL(category = 'default') {
  return PUBLIC_CACHE_POLICIES[category] ?? PUBLIC_CACHE_POLICIES.default;
}

/* === Validade dos dados === */
/* ----- Classificação temporal ----- */
export function getPublicCacheStatus(updatedAt, now = Date.now(), category = 'default') {
  if (!Number.isFinite(updatedAt) || !Number.isFinite(now) || updatedAt < 0 || now < updatedAt) {
    return 'invalid';
  }

  const age = now - updatedAt;
  const ttl = getPublicCacheTTL(category);

  if (age < ttl) return 'fresh';

  if (age < PUBLIC_CACHE_LIMITS.MAX_STALE_AGE) {
    return 'stale';
  }

  return 'expired';
}

/* === Política de reutilização === */
/* ----- Consulta de dados armazenados ----- */
export function resolvePublicCacheUsage({
  updatedAt,
  now = Date.now(),
  category = 'default',
  force = false,
  serviceUnavailable = false,
} = {}) {
  const status = getPublicCacheStatus(updatedAt, now, category);

  if (status === 'invalid' || status === 'expired') {
    return {
      status,
      useCache: false,
      requiresRevalidation: true,
    };
  }

  if (force) {
    return {
      status,
      useCache: false,
      requiresRevalidation: true,
    };
  }

  if (status === 'fresh') {
    return {
      status,
      useCache: true,
      requiresRevalidation: false,
    };
  }

  return {
    status,
    useCache: serviceUnavailable,
    requiresRevalidation: true,
  };
}

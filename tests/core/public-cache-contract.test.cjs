const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração dos testes === */
/* ----- Carregamento do contrato ----- */
const contractPath = path.resolve(__dirname, '../../src/services/publicCacheContract.js');

function loadContract() {
  const source = fs
    .readFileSync(contractPath, 'utf8')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

  return vm.runInNewContext(
    `(() => {
      ${source}

      return {
        PUBLIC_CACHE_LIMITS,
        PUBLIC_CACHE_POLICIES,
        getPublicCacheTTL,
        getPublicCacheStatus,
        resolvePublicCacheUsage,
      };
    })()`,
  );
}

/* === Configuração === */
/* ----- Limites padrão ----- */
test('preserva limites atuais do cache', () => {
  const { PUBLIC_CACHE_LIMITS } = loadContract();

  assert.equal(PUBLIC_CACHE_LIMITS.MAX_ENTRIES, 32);
  assert.equal(PUBLIC_CACHE_LIMITS.DEFAULT_TTL, 300000);
  assert.equal(PUBLIC_CACHE_LIMITS.MAX_STALE_AGE, 86400000);
});

/* ----- Política desconhecida ----- */
test('utiliza TTL padrão para categorias desconhecidas', () => {
  const { getPublicCacheTTL } = loadContract();

  assert.equal(getPublicCacheTTL('unknown'), 300000);
});

/* === Classificação temporal === */
/* ----- Dados recentes ----- */
test('identifica dados dentro do prazo de validade', () => {
  const { getPublicCacheStatus } = loadContract();

  assert.equal(getPublicCacheStatus(100000, 200000), 'fresh');
});

/* ----- Dados obsoletos ----- */
test('identifica dados que exigem revalidação', () => {
  const { getPublicCacheStatus } = loadContract();

  assert.equal(getPublicCacheStatus(100000, 500000), 'stale');
});

/* ----- Dados expirados ----- */
test('rejeita dados além do limite de tolerância', () => {
  const { getPublicCacheStatus } = loadContract();

  assert.equal(getPublicCacheStatus(100000, 100000 + 86400000), 'expired');
});

/* ----- Datas inválidas ----- */
test('rejeita datas inconsistentes', () => {
  const { getPublicCacheStatus } = loadContract();

  for (const updatedAt of [-1, NaN, Infinity, 300000]) {
    assert.equal(getPublicCacheStatus(updatedAt, 200000), 'invalid');
  }
});

/* === Utilização do cache === */
/* ----- Dados válidos ----- */
test('reutiliza dados recentes sem nova consulta', () => {
  const { resolvePublicCacheUsage } = loadContract();

  const result = resolvePublicCacheUsage({
    updatedAt: 100000,
    now: 200000,
  });

  assert.equal(result.useCache, true);
  assert.equal(result.requiresRevalidation, false);
});

/* ----- Atualização forçada ----- */
test('permite forçar a revalidação', () => {
  const { resolvePublicCacheUsage } = loadContract();

  const result = resolvePublicCacheUsage({
    updatedAt: 100000,
    now: 200000,
    force: true,
  });

  assert.equal(result.useCache, false);
  assert.equal(result.requiresRevalidation, true);
});

/* ----- Indisponibilidade do serviço ----- */
test('permite dados obsoletos quando o serviço falha', () => {
  const { resolvePublicCacheUsage } = loadContract();

  const result = resolvePublicCacheUsage({
    updatedAt: 100000,
    now: 500000,
    serviceUnavailable: true,
  });

  assert.equal(result.status, 'stale');
  assert.equal(result.useCache, true);
  assert.equal(result.requiresRevalidation, true);
});

/* ----- Ausência de falha ----- */
test('não utiliza dados obsoletos enquanto pode revalidar', () => {
  const { resolvePublicCacheUsage } = loadContract();

  const result = resolvePublicCacheUsage({
    updatedAt: 100000,
    now: 500000,
  });

  assert.equal(result.useCache, false);
  assert.equal(result.requiresRevalidation, true);
});

/* ----- Expiração definitiva ----- */
test('não reutiliza dados expirados mesmo após falha', () => {
  const { resolvePublicCacheUsage } = loadContract();

  const result = resolvePublicCacheUsage({
    updatedAt: 100000,
    now: 100000 + 86400000,
    serviceUnavailable: true,
  });

  assert.equal(result.useCache, false);
});

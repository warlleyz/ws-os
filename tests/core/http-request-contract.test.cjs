const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração === */
/* ----- Carregamento do contrato ----- */
const contractPath = path.resolve(__dirname, '../../src/services/httpRequestContract.js');

function loadContract() {
  const source = fs
    .readFileSync(contractPath, 'utf8')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');

  return vm.runInNewContext(
    `(() => {
      ${source}

      return {
        HTTP_DEFAULT_TIMEOUT,
        HTTP_OPERATIONS,
        HTTP_REQUEST_ERRORS,
        validateHttpRequestOptions,
        classifyHttpFailure,
        resolveHttpRetryPolicy,
      };
    })()`,
  );
}

/* === Configuração de requisições === */
/* ----- Timeout válido ----- */
test('aceita configuração HTTP válida', () => {
  const { validateHttpRequestOptions } = loadContract();

  const result = validateHttpRequestOptions({
    operation: 'read',
    timeout: 15000,
  });

  assert.equal(result.ok, true);
  assert.equal(result.options.timeout, 15000);
});

/* ----- Timeout inválido ----- */
test('rejeita timeout fora dos limites', () => {
  const { validateHttpRequestOptions } = loadContract();

  for (const timeout of [0, 999, 120001, -1, 1.5, null]) {
    assert.equal(
      validateHttpRequestOptions({
        operation: 'read',
        timeout,
      }).ok,
      false,
    );
  }
});

/* === Classificação de falhas === */
/* ----- Cancelamento de leitura ----- */
test('classifica cancelamento de leitura', () => {
  const { classifyHttpFailure } = loadContract();

  const result = classifyHttpFailure({
    operation: 'read',
    reason: 'cancelled',
  });

  assert.equal(result.code, 'HTTP_CANCELLED');
  assert.equal(result.requiresReconciliation, false);
});

/* ----- Timeout de leitura ----- */
test('classifica timeout de leitura', () => {
  const { classifyHttpFailure } = loadContract();

  const result = classifyHttpFailure({
    operation: 'read',
    reason: 'timeout',
  });

  assert.equal(result.code, 'HTTP_TIMEOUT');
});

/* ----- Falha de rede ----- */
test('classifica falhas de rede', () => {
  const { classifyHttpFailure } = loadContract();

  const result = classifyHttpFailure({
    operation: 'read',
    reason: 'network',
  });

  assert.equal(result.code, 'HTTP_NETWORK_ERROR');
});

/* ----- Escrita com resultado incerto ----- */
test('exige reconciliação quando escrita pode ter sido enviada', () => {
  const { classifyHttpFailure } = loadContract();

  for (const reason of ['cancelled', 'timeout', 'network']) {
    const result = classifyHttpFailure({
      operation: 'write',
      reason,
      requestSent: true,
    });

    assert.equal(result.code, 'HTTP_RESULT_UNKNOWN');
    assert.equal(result.requiresReconciliation, true);
  }
});

/* ----- Escrita não enviada ----- */
test('não classifica como incerta uma escrita comprovadamente não enviada', () => {
  const { classifyHttpFailure } = loadContract();

  const result = classifyHttpFailure({
    operation: 'write',
    reason: 'cancelled',
    requestSent: false,
  });

  assert.equal(result.code, 'HTTP_CANCELLED');
  assert.equal(result.requiresReconciliation, false);
});

/* === Política de repetição === */
/* ----- Leitura interrompida ----- */
test('permite repetir leitura após timeout', () => {
  const { resolveHttpRetryPolicy } = loadContract();

  const result = resolveHttpRetryPolicy({
    operation: 'read',
    failure: 'HTTP_TIMEOUT',
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'retry_allowed');
});

/* ----- Cancelamento explícito ----- */
test('não repete automaticamente leitura cancelada', () => {
  const { resolveHttpRetryPolicy } = loadContract();

  const result = resolveHttpRetryPolicy({
    operation: 'read',
    failure: 'HTTP_CANCELLED',
  });

  assert.equal(result.action, 'stop');
});

/* ----- Escrita de resultado incerto ----- */
test('não repete escrita incerta sem reconciliação', () => {
  const { resolveHttpRetryPolicy } = loadContract();

  const result = resolveHttpRetryPolicy({
    operation: 'write',
    failure: 'HTTP_RESULT_UNKNOWN',
    hasIdempotencyKey: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.action, 'reconcile');
  assert.equal(result.requiresIdempotencyKey, true);
});

/* ----- Escrita sem chave ----- */
test('não autoriza repetição direta de escrita sem chave', () => {
  const { resolveHttpRetryPolicy } = loadContract();

  const result = resolveHttpRetryPolicy({
    operation: 'write',
    failure: 'HTTP_NETWORK_ERROR',
    hasIdempotencyKey: false,
  });

  assert.equal(result.ok, false);
  assert.equal(result.action, 'check_previous_result');
});

/* === Opções inválidas === */
/* ----- Operações desconhecidas ----- */
test('rejeita operações HTTP desconhecidas', () => {
  const { classifyHttpFailure, resolveHttpRetryPolicy } = loadContract();

  assert.equal(
    classifyHttpFailure({
      operation: 'unknown',
      reason: 'timeout',
    }).code,
    'INVALID_HTTP_OPTIONS',
  );

  assert.equal(
    resolveHttpRetryPolicy({
      operation: 'unknown',
      failure: 'HTTP_TIMEOUT',
    }).code,
    'INVALID_HTTP_OPTIONS',
  );
});

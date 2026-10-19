const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração === */
/* ----- Carregamento do contrato ----- */
const contractPath = path.resolve(__dirname, '../../src/services/idempotencyContract.js');

function loadContract() {
  const source = fs
    .readFileSync(contractPath, 'utf8')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');

  return vm.runInNewContext(
    `(() => {
      ${source}

      return {
        IDEMPOTENCY_KEY_MAX_LENGTH,
        IDEMPOTENCY_ERRORS,
        IDEMPOTENCY_STATES,
        isValidIdempotencyKey,
        createIdempotencyKey,
        createIdempotencyRequest,
        compareIdempotencyRequests,
        resolveIdempotencyRetry,
      };
    })()`,
    {
      crypto: require('node:crypto').webcrypto,
    },
  );
}

/* === Dados de referência === */
/* ----- Solicitação válida ----- */
function validRequest(overrides = {}) {
  return {
    key: '550e8400-e29b-41d4-a716-446655440000',
    operation: 'create-contact-request',
    scope: 'contact',
    ...overrides,
  };
}

/* === Chaves de idempotência === */
/* ----- Geração de identificadores ----- */
test('gera chaves válidas e distintas', () => {
  const contract = loadContract();

  const first = contract.createIdempotencyKey();
  const second = contract.createIdempotencyKey();

  assert.equal(contract.isValidIdempotencyKey(first), true);
  assert.equal(contract.isValidIdempotencyKey(second), true);
  assert.notEqual(first, second);
});

/* ----- Chaves inválidas ----- */
test('rejeita chaves ausentes ou inseguras', () => {
  const { isValidIdempotencyKey } = loadContract();

  for (const key of ['', 'curta', '../operacao', 'chave com espacos', 'a'.repeat(129), null, 123]) {
    assert.equal(isValidIdempotencyKey(key), false);
  }
});

/* === Descritores de operação === */
/* ----- Solicitação válida ----- */
test('aceita uma operação com identificadores válidos', () => {
  const { createIdempotencyRequest } = loadContract();

  const result = createIdempotencyRequest(validRequest());

  assert.equal(result.ok, true);
  assert.equal(result.request.operation, 'create-contact-request');
  assert.equal(result.request.scope, 'contact');
});

/* ----- Operação inválida ----- */
test('rejeita nomes de operação inválidos', () => {
  const { createIdempotencyRequest } = loadContract();

  const result = createIdempotencyRequest(validRequest({ operation: '../create' }));

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_IDEMPOTENCY_OPERATION');
});

/* ----- Escopo inválido ----- */
test('rejeita escopos inválidos', () => {
  const { createIdempotencyRequest } = loadContract();

  const result = createIdempotencyRequest(validRequest({ scope: ' ' }));

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_IDEMPOTENCY_SCOPE');
});

/* === Repetição de operações === */
/* ----- Mesma solicitação ----- */
test('reconhece repetição da mesma operação', () => {
  const { compareIdempotencyRequests } = loadContract();

  const request = validRequest();

  const result = compareIdempotencyRequests(request, { ...request });

  assert.equal(result.ok, true);
});

/* ----- Operação divergente ----- */
test('rejeita reutilização da chave para outra operação', () => {
  const { compareIdempotencyRequests } = loadContract();

  const result = compareIdempotencyRequests(
    validRequest(),
    validRequest({ operation: 'delete-contact-request' }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, 'IDEMPOTENCY_KEY_CONFLICT');
});

/* ----- Escopo divergente ----- */
test('rejeita reutilização em outro escopo', () => {
  const { compareIdempotencyRequests } = loadContract();

  const result = compareIdempotencyRequests(validRequest(), validRequest({ scope: 'admin' }));

  assert.equal(result.ok, false);
  assert.equal(result.code, 'IDEMPOTENCY_KEY_CONFLICT');
});

/* === Estados de repetição === */
/* ----- Operação concluída ----- */
test('reutiliza o resultado de uma operação concluída', () => {
  const { resolveIdempotencyRetry } = loadContract();

  const result = resolveIdempotencyRetry('completed');

  assert.equal(result.ok, true);
  assert.equal(result.action, 'return_previous_result');
});

/* ----- Operação em andamento ----- */
test('aguarda operação que ainda está em processamento', () => {
  const { resolveIdempotencyRetry } = loadContract();

  const result = resolveIdempotencyRetry('in_progress');

  assert.equal(result.ok, false);
  assert.equal(result.action, 'wait');
});

/* ----- Resultado incerto ----- */
test('exige reconciliação quando o resultado é desconhecido', () => {
  const { resolveIdempotencyRetry } = loadContract();

  const result = resolveIdempotencyRetry('unknown');

  assert.equal(result.ok, false);
  assert.equal(result.action, 'reconcile');
});

/* ----- Falha anterior ----- */
test('não repete automaticamente uma operação com falha', () => {
  const { resolveIdempotencyRetry } = loadContract();

  const result = resolveIdempotencyRetry('failed');

  assert.equal(result.ok, true);
  assert.equal(result.action, 'check_retry_policy');
});

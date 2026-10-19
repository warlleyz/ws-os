const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração dos testes === */
/* ----- Carregamento do contrato ----- */
const contractPath = path.resolve(__dirname, '../../src/services/revisionContract.js');

function loadContract() {
  const source = fs
    .readFileSync(contractPath, 'utf8')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

  return vm.runInNewContext(
    `(() => {
      ${source}

      return {
        REVISION_ERRORS,
        isValidRevision,
        validateRevision,
        prepareRevisionUpdate,
        createRevisionConflict,
      };
    })()`,
  );
}

/* === Validação de revisões === */
/* ----- Revisões válidas ----- */
test('aceita revisões inteiras e positivas', () => {
  const { isValidRevision } = loadContract();

  for (const revision of [1, 2, 100, Number.MAX_SAFE_INTEGER]) {
    assert.equal(isValidRevision(revision), true);
  }
});

/* ----- Revisões inválidas ----- */
test('rejeita revisões inválidas', () => {
  const { isValidRevision } = loadContract();

  for (const revision of [0, -1, 1.5, '1', null, undefined, NaN, Infinity]) {
    assert.equal(isValidRevision(revision), false);
  }
});

/* === Concorrência otimista === */
/* ----- Revisões correspondentes ----- */
test('aceita atualização com revisão atual', () => {
  const { validateRevision } = loadContract();

  const result = validateRevision(3, 3);

  assert.equal(result.ok, true);
  assert.equal(result.revision, 3);
});

/* ----- Revisão desatualizada ----- */
test('identifica conflito de revisão', () => {
  const { validateRevision } = loadContract();

  const result = validateRevision(2, 3);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'REVISION_CONFLICT');
  assert.equal(result.expectedRevision, 2);
  assert.equal(result.currentRevision, 3);
});

/* ----- Revisões inválidas ----- */
test('rejeita comparação com revisões inválidas', () => {
  const { validateRevision } = loadContract();

  const result = validateRevision(0, 2);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_REVISION');
});

/* === Preparação de atualizações === */
/* ----- Próxima revisão ----- */
test('calcula a próxima revisão sem modificar dados', () => {
  const { prepareRevisionUpdate } = loadContract();

  const result = prepareRevisionUpdate(4, 4);

  assert.equal(result.ok, true);
  assert.equal(result.previousRevision, 4);
  assert.equal(result.nextRevision, 5);
});

/* ----- Atualização conflitante ----- */
test('não prepara atualização com revisão desatualizada', () => {
  const { prepareRevisionUpdate } = loadContract();

  const result = prepareRevisionUpdate(2, 5);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'REVISION_CONFLICT');
});

/* ----- Limite numérico ----- */
test('não ultrapassa o limite de inteiros seguros', () => {
  const { prepareRevisionUpdate } = loadContract();

  const result = prepareRevisionUpdate(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_REVISION');
});

/* === Resultados de conflito === */
/* ----- Conflito estruturado ----- */
test('retorna informações do conflito', () => {
  const { createRevisionConflict } = loadContract();

  const result = createRevisionConflict(1, 2);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'REVISION_CONFLICT');
  assert.equal(result.expectedRevision, 1);
  assert.equal(result.currentRevision, 2);
});

/* ----- Ausência de conflito ----- */
test('não cria conflito para revisões iguais', () => {
  const { createRevisionConflict } = loadContract();

  assert.equal(createRevisionConflict(2, 2), null);
});

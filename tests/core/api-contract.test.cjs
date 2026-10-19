const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração dos testes === */
/* ----- Localização do contrato ----- */
const contractPath = path.resolve(__dirname, '../../src/services/apiContract.js');

/* ----- Carregamento isolado ----- */
function loadContract() {
  const source = fs
    .readFileSync(contractPath, 'utf8')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

  return vm.runInNewContext(
    `(() => {
      ${source}

      return {
        API_ERROR_CODES,
        createApiSuccess,
        createApiError,
        validateApiResponse,
      };
    })()`,
  );
}

/* === Respostas de sucesso === */
/* ----- Dados válidos ----- */
test('cria uma resposta de sucesso', () => {
  const { createApiSuccess, validateApiResponse } = loadContract();

  const result = createApiSuccess({ id: '123' });

  assert.equal(result.ok, true);
  assert.equal(result.data.id, '123');
  assert.equal(validateApiResponse(result).ok, true);
});

/* ----- Metadados opcionais ----- */
test('aceita metadados válidos', () => {
  const { createApiSuccess, validateApiResponse } = loadContract();

  const result = createApiSuccess({ id: '123' }, { revision: 2 });

  assert.equal(result.ok, true);
  assert.equal(result.meta.revision, 2);
  assert.equal(validateApiResponse(result).ok, true);
});

/* ----- Metadados inválidos ----- */
test('rejeita metadados malformados', () => {
  const { createApiSuccess } = loadContract();

  for (const meta of [null, [], 'texto', 123]) {
    const result = createApiSuccess({}, meta);

    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'VALIDATION_ERROR');
  }
});

/* === Respostas de erro === */
/* ----- Erro conhecido ----- */
test('cria resposta de erro com código estável', () => {
  const { API_ERROR_CODES, createApiError } = loadContract();

  const result = createApiError(API_ERROR_CODES.NOT_FOUND, 'Recurso não encontrado.', 'req-123');

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'NOT_FOUND');
  assert.equal(result.error.message, 'Recurso não encontrado.');
  assert.equal(result.requestId, 'req-123');
});

/* ----- Código desconhecido ----- */
test('normaliza códigos de erro desconhecidos', () => {
  const { createApiError } = loadContract();

  const result = createApiError('UNKNOWN', 'Erro desconhecido');

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INTERNAL_ERROR');
});

/* ----- Mensagem vazia ----- */
test('utiliza mensagem padrão quando necessário', () => {
  const { createApiError } = loadContract();

  const result = createApiError('NOT_FOUND', ' ');

  assert.equal(result.ok, false);
  assert.ok(result.error.message.trim());
});

/* ----- Identificador de solicitação ----- */
test('ignora requestId inválido', () => {
  const { createApiError } = loadContract();

  for (const requestId of ['', '../request', 'req?token=123', 123, null]) {
    const result = createApiError('NOT_FOUND', 'Recurso não encontrado.', requestId);

    assert.equal(Object.hasOwn(result, 'requestId'), false);
  }
});

/* === Validação de respostas === */
/* ----- Respostas malformadas ----- */
test('rejeita respostas sem estrutura válida', () => {
  const { validateApiResponse } = loadContract();

  for (const response of [null, undefined, [], 'resposta', {}, { ok: 'true', data: {} }]) {
    assert.equal(validateApiResponse(response).ok, false);
  }
});

/* ----- Sucesso sem dados ----- */
test('rejeita sucesso sem a propriedade data', () => {
  const { validateApiResponse } = loadContract();

  assert.equal(validateApiResponse({ ok: true }).ok, false);
});

/* ----- Sucesso com erro simultâneo ----- */
test('rejeita respostas de sucesso contendo erro', () => {
  const { validateApiResponse } = loadContract();

  const result = validateApiResponse({
    ok: true,
    data: {},
    error: { code: 'NOT_FOUND', message: 'Erro' },
  });

  assert.equal(result.ok, false);
});

/* ----- Erro sem código reconhecido ----- */
test('rejeita respostas com código de erro desconhecido', () => {
  const { validateApiResponse } = loadContract();

  const result = validateApiResponse({
    ok: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'Erro',
    },
  });

  assert.equal(result.ok, false);
});

/* ----- Erro válido ----- */
test('aceita respostas de erro corretamente estruturadas', () => {
  const { createApiError, validateApiResponse } = loadContract();

  const response = createApiError('ACCESS_DENIED', 'Acesso negado.', 'req-456');

  assert.equal(validateApiResponse(response).ok, true);
});

/* === Consistência dos códigos === */
/* ----- Categorias compartilhadas ----- */
test('declara os códigos previstos no planejamento', () => {
  const { API_ERROR_CODES } = loadContract();

  const expected = [
    'VALIDATION_ERROR',
    'UNAUTHENTICATED',
    'ACCESS_DENIED',
    'NOT_FOUND',
    'CONFLICT',
    'RATE_LIMITED',
    'QUOTA_EXCEEDED',
    'SERVICE_UNAVAILABLE',
    'TIMEOUT',
    'INTERNAL_ERROR',
  ];

  for (const code of expected) {
    assert.ok(Object.values(API_ERROR_CODES).includes(code));
  }
});

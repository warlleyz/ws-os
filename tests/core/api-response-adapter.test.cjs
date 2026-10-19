const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração === */
/* ----- Carregamento dos módulos ----- */
const root = path.resolve(__dirname, '../..');

function loadAdapter() {
  const contract = fs
    .readFileSync(path.join(root, 'src/services/apiContract.js'), 'utf8')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

  const adapter = fs
    .readFileSync(path.join(root, 'src/services/apiResponseAdapter.js'), 'utf8')
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

  return vm.runInNewContext(
    `(() => {
      ${contract}
      ${adapter}

      return {
        adaptApiResponse,
        unwrapApiResponse,
      };
    })()`,
  );
}

/* === Compatibilidade === */
/* ----- Resposta legada ----- */
test('converte dados legados em resposta padronizada', () => {
  const { adaptApiResponse } = loadAdapter();

  const result = adaptApiResponse({ items: [1, 2] });

  assert.equal(result.ok, true);
  assert.equal(result.data.items.length, 2);
});

/* ----- Arrays legados ----- */
test('preserva arrays recebidos de endpoints antigos', () => {
  const { adaptApiResponse } = loadAdapter();

  const result = adaptApiResponse([1, 2, 3]);

  assert.equal(result.ok, true);
  assert.equal(result.data.length, 3);
});

/* ----- Resposta atual ----- */
test('preserva respostas padronizadas', () => {
  const { adaptApiResponse } = loadAdapter();

  const result = adaptApiResponse({
    ok: true,
    data: { id: '123' },
    meta: { revision: 2 },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.id, '123');
  assert.equal(result.meta.revision, 2);
});

/* ----- Erro padronizado ----- */
test('preserva códigos de erro conhecidos', () => {
  const { adaptApiResponse } = loadAdapter();

  const result = adaptApiResponse({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Recurso não encontrado.',
    },
    requestId: 'req-123',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'NOT_FOUND');
  assert.equal(result.requestId, 'req-123');
});

/* ----- Envelope inválido ----- */
test('rejeita respostas padronizadas malformadas', () => {
  const { adaptApiResponse } = loadAdapter();

  const result = adaptApiResponse({
    ok: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INTERNAL_ERROR');
});

/* ----- Modo estrito ----- */
test('rejeita respostas legadas quando desabilitadas', () => {
  const { adaptApiResponse } = loadAdapter();

  const result = adaptApiResponse({ items: [] }, { allowLegacy: false });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INTERNAL_ERROR');
});

/* === Consumo dos dados === */
/* ----- Extração de sucesso ----- */
test('extrai dados de respostas válidas', () => {
  const { unwrapApiResponse } = loadAdapter();

  const result = unwrapApiResponse({
    ok: true,
    data: { name: 'WS OS' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.name, 'WS OS');
});

/* ----- Extração de erro ----- */
test('preserva erros sem apresentar dados inválidos', () => {
  const { unwrapApiResponse } = loadAdapter();

  const result = unwrapApiResponse({
    ok: false,
    error: {
      code: 'ACCESS_DENIED',
      message: 'Acesso negado.',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.data, null);
  assert.equal(result.error.code, 'ACCESS_DENIED');
});
/* === Respostas incompatíveis e HTTP legado === */
test('rejeita envelope malformado sem converter em sucesso legado', () => {
  const { adaptApiResponse } = loadAdapter();
  assert.equal(adaptApiResponse({ ok: 'true', data: 1 }).ok, false);
});
test('falha HTTP legada tem código estável e não copia detalhes internos', () => {
  const { adaptApiResponse } = loadAdapter();
  const value = adaptApiResponse({ error: 'private-debug-token' }, { status: 409 });
  assert.equal(value.ok, false);
  assert.equal(value.error.code, 'CONFLICT');
  assert.doesNotMatch(JSON.stringify(value), /private-debug-token/);
});

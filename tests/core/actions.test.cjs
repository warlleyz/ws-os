const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');
const load = () => loadContract(path.resolve(__dirname, '../../src/core/actionContract.js'));
const context = (extra = {}) => ({
  context: 'wally',
  localBrowser: true,
  getApp: (id) => ({ id, public: id !== 'administration' }),
  ...extra,
});

/* === Validação e fronteiras de confiança === */
test('catálogo declara parâmetros, capacidades, contextos, confirmação e executor', () => {
  const api = load();
  for (const action of api.getRegisteredActions()) {
    assert.equal(typeof action.id, 'string');
    assert.equal(typeof action.description, 'string');
    assert.equal(typeof action.executor, 'string');
    assert.equal(typeof action.confirmation, 'boolean');
    assert.equal(Array.isArray(action.contexts), true);
  }
});
test('ação externa não pode injetar executor, funções ou parâmetros desconhecidos', () => {
  const api = load();
  for (const request of [
    { id: 'app.open', params: { appId: 'projects' }, executor: 'eval' },
    { id: 'app.open', params: { appId: 'projects', params: { run: () => {} } } },
    { id: 'personal-files.trash', params: { fileId: 'one', url: 'https://remote' } },
  ])
    assert.equal(api.validateActionRequest(request, context()).ok, false);
  assert.equal(
    api.validateActionRequest({ id: 'app.open', params: { appId: 'administration' } }, context())
      .code,
    'ACTION_ACCESS_DENIED',
  );
  assert.equal(
    api.validateActionRequest({ id: 'administration.open' }, context({ administrator: true })).code,
    'ACTION_CONTEXT_DENIED',
  );
});
test('capacidade local não concede acesso remoto e ações administrativas exigem papel adequado', () => {
  const api = load();
  assert.equal(
    api.validateActionRequest(
      { id: 'personal-files.trash', params: { fileId: 'one' } },
      context({ localBrowser: false, administrator: true }),
    ).code,
    'LOCAL_CONTEXT_REQUIRED',
  );
  assert.equal(
    api.validateActionRequest({ id: 'administration.open' }, context({ context: 'search' })).code,
    'ACCESS_DENIED',
  );
});

/* === Confirmação e execução confiável === */
test('ação sensível sem confirmação ou cancelada não chama executor', async () => {
  const api = load();
  let called = 0;
  const request = { id: 'personal-files.trash', params: { fileId: 'one' } };
  const options = context({ executors: { 'files.trash': () => called++ } });
  assert.equal(
    (await api.executeRegisteredAction(request, options)).code,
    'ACTION_CONFIRMATION_REQUIRED',
  );
  assert.equal(
    (await api.executeRegisteredAction(request, { ...options, confirm: () => false })).code,
    'ACTION_CANCELLED',
  );
  assert.equal(called, 0);
});
test('argumentos aprovados são estáveis durante confirmação e autorização é revalidada', async () => {
  const api = load();
  let called = 0;
  const request = { id: 'personal-files.trash', params: { fileId: 'one' } };
  const result = await api.executeRegisteredAction(
    request,
    context({
      confirm: (_action, params) => {
        params.fileId = 'modified';
        request.params.fileId = 'another';
        return true;
      },
      executors: {
        'files.trash': (params) => {
          called++;
          assert.equal(params.fileId, 'one');
        },
      },
    }),
  );
  assert.equal(result.ok, true);
  assert.equal(called, 1);
  const denied = await api.executeRegisteredAction(
    { id: 'preferences.reset' },
    context({
      context: 'system',
      confirm: () => true,
      getContext: () => ({ localBrowser: false }),
      executors: { 'preferences.reset': () => called++ },
    }),
  );
  assert.equal(denied.code, 'LOCAL_CONTEXT_REQUIRED');
  assert.equal(called, 1);
});
test('adaptador legado do Wally só sugere navegação explícita e executor é chamado uma vez', async () => {
  const api = load();
  const action = api.adaptSuggestedAction({ type: 'open-app', appId: 'projects' });
  let calls = 0;
  assert.equal(
    api.adaptSuggestedAction({ type: 'open-app', appId: 'projects', code: 'eval' }),
    null,
  );
  assert.equal(
    (
      await api.executeRegisteredAction(
        action,
        context({ executors: { 'core.open': () => calls++ } }),
      )
    ).ok,
    true,
  );
  assert.equal(calls, 1);
});

/* === Matriz de recursos e operações === */
test('matriz protege rascunhos e solicitações e não confere acesso local remoto ao administrador', () => {
  const api = loadContract(path.resolve(__dirname, '../../src/core/authorizationContract.js'));
  assert.equal(api.authorizeResourceOperation('posts', 'read', { published: true }).ok, true);
  assert.equal(
    api.authorizeResourceOperation('posts', 'read', { published: false }).code,
    'ACCESS_DENIED',
  );
  assert.equal(api.authorizeResourceOperation('requests', 'read', {}).code, 'ACCESS_DENIED');
  assert.equal(
    api.authorizeResourceOperation('requests', 'submit', {}).requiresServerAuthorization,
    true,
  );
  assert.equal(
    api.authorizeResourceOperation('personal-files', 'read', {
      administrator: true,
      localBrowser: false,
    }).code,
    'LOCAL_CONTEXT_REQUIRED',
  );
  assert.equal(
    api.authorizeResourceOperation('events', 'manage', { administrator: true })
      .requiresServerAuthorization,
    true,
  );
});

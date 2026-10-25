const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { test } = require('node:test');
const root = path.resolve(__dirname, '../..');
function moduleAt(file, bindings = {}) {
  if (file === 'src/core/appManager.js')
    bindings = {
      ...require('../helpers/contract-loader.cjs').loadContract(
        path.join(root, 'src/shared/utils/contractValidation.js'),
      ),
      ...require('../helpers/contract-loader.cjs').loadContract(
        path.join(root, 'src/core/authorizationContract.js'),
      ),
      ...bindings,
    };
  const source = fs
    .readFileSync(path.join(root, file), 'utf8')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');
  const context = vm.createContext({ crypto: webcrypto, ...bindings });
  vm.runInContext(source, context);
  return context;
}
function core() {
  const source = fs.readFileSync(path.join(root, 'src/core/appRegistry.js'), 'utf8');
  const names = source
    .match(/import\s*\{([\s\S]*?)\}\s*from/)[1]
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  const registry = moduleAt(
    'src/core/appRegistry.js',
    Object.fromEntries(names.map((n) => [n, () => null])),
  );
  return {
    registry,
    manager: moduleAt('src/core/appManager.js', {
      getAppDefinition: registry.getAppDefinition,
      getAppNavigationContract: registry.getAppNavigationContract,
      isAdminAuthenticated: () => false,
      validateFileResource: loadFileResourceContract().validateFileResource,
    }),
  };
}
const initial = () => ({ instances: [], activeInstanceId: null, focusHistory: [] });

test('somente apps implementados possuem entrada lazy explícita no Registry', () => {
  const { registry } = core();
  for (const app of registry.getRegisteredApps()) {
    assert.equal(typeof app.loadComponent === 'function', app.implemented, app.id);
  }
});

test('solicitação retorna ID criado sem modificar a sessão anterior', () => {
  const { manager: m } = core();
  const before = initial();
  const options = { origin: 'app', params: { projectId: 'first' } };
  const { state, result } = m.requestAppOpen(before, 'projects', options);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'opened');
  assert.equal(result.instanceId, state.activeInstanceId);
  assert.equal(state.instances[0].origin, 'app');
  options.params.projectId = 'changed';
  assert.equal(state.instances[0].params.projectId, 'first');
  assert.equal(before.instances.length, 0);
});

test('erros tipados de app desconhecido e restrito preservam a sessão', () => {
  const { manager: m } = core();
  const before = m.openApp(initial(), 'projects');
  for (const [appId, code] of [
    ['missing', 'APP_NOT_FOUND'],
    ['administration', 'APP_ACCESS_DENIED'],
  ]) {
    const { state, result } = m.requestAppOpen(before, appId);
    assert.equal(state, before);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, code);
    assert.equal(result.instanceId, undefined);
  }
});

test('opções e parâmetros inválidos não criam nem restauram instâncias', () => {
  const { manager: m } = core();
  const opened = m.openApp(initial(), 'about-system');
  const before = m.minimizeApp(opened, opened.activeInstanceId);
  for (const options of [
    null,
    false,
    [],
    new Date(),
    { origin: '' },
    { origin: 12 },
    { params: [] },
    { params: new Date() },
    { params: null },
  ]) {
    const { state, result } = m.requestAppOpen(before, 'about-system', options);
    assert.equal(state, before);
    assert.equal(result.error.code, 'INVALID_OPEN_OPTIONS');
    assert.equal(m.openApp(before, 'projects', options), before);
  }
});

test('instância única retorna restored com o mesmo ID e conserva parâmetros', () => {
  const { manager: m } = core();
  let { state, result } = m.requestAppOpen(initial(), 'about-system', { params: { tab: 'first' } });
  const id = result.instanceId;
  state = m.minimizeApp(state, id);
  ({ state, result } = m.requestAppOpen(state, 'about-system', { params: { tab: 'second' } }));
  assert.equal(result.status, 'restored');
  assert.equal(result.instanceId, id);
  assert.equal(state.instances.length, 1);
  assert.equal(state.instances[0].params.tab, 'first');
  assert.equal(state.instances[0].minimized, false);
});

test('múltiplas instâncias retornam IDs distintos e close/reopen cria nova sessão', () => {
  const { manager: m } = core();
  const first = m.requestAppOpen(initial(), 'file - viewer');
  const second = m.requestAppOpen(first.state, 'file-viewer');
  assert.notEqual(first.result.instanceId, second.result.instanceId);
  const closed = m.closeApp(second.state, first.result.instanceId);
  assert.equal(closed.focusHistory.includes(first.result.instanceId), false);
  const reopened = m.requestAppOpen(closed, 'file-viewer');
  assert.notEqual(reopened.result.instanceId, first.result.instanceId);
  assert.equal(reopened.state.instances.length, 2);
  const freshCore = core().manager;
  const fresh = vm.runInContext('initialAppState', freshCore);
  assert.equal(fresh.instances.length, 0, 'Uma nova sessão não restaura janelas automaticamente');
});

test('minimização preserva dados e comunica pausa seletiva sem destruir instância', () => {
  const { manager: m } = core();
  let state = m.openApp(initial(), 'projects', { origin: 'desktop', params: { projectId: 'one' } });
  const id = state.activeInstanceId;
  const params = state.instances[0].params;
  state = m.minimizeApp(state, id);
  assert.equal(state.instances[0].executionState, 'paused');
  assert.equal(state.instances[0].params, params);
  state = m.restoreApp(state, id);
  assert.equal(state.instances[0].executionState, 'running');
  assert.equal(state.instances[0].params, params);
});

/* === Dependências de arquivos === */
/* ----- Carregamento do contrato compartilhado ----- */
function loadFileResourceContract() {
  const source = fs
    .readFileSync(path.join(root, 'src/services/storage/fileResourceContract.js'), 'utf8')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

  const context = vm.createContext({});
  vm.runInContext(source, context);

  return context;
}
/* === Auditoria de contratos da Etapa 01 === */
test('reutilização contextual distingue navegação efetiva de restauração', () => {
  const { manager: m } = core();
  const first = m.requestAppOpen(initial(), 'notes', { params: { postId: 'one' } });
  const changed = m.requestAppOpen(first.state, 'notes', { params: { postId: 'two' } });
  assert.equal(changed.result.instanceId, first.result.instanceId);
  assert.equal(changed.result.status, 'navigated');
  assert.equal(changed.state.instances[0].params.postId, 'two');
  assert.equal(
    m.requestAppOpen(changed.state, 'notes', { params: { postId: 'two' } }).result.status,
    'restored',
  );
});
test('parâmetros legados continuam aceitos mas valores executáveis e referências mutáveis não entram na instância', () => {
  const { manager: m } = core();
  const before = initial();
  assert.equal(
    m.requestAppOpen(before, 'about-system', { params: { run: () => {} } }).result.error.code,
    'INVALID_NAVIGATION_PARAMS',
  );
  const options = { params: { resource: { source: 'local', fileId: 'one' } } };
  const result = m.requestAppOpen(before, 'file-viewer', options);
  options.params.resource.fileId = 'changed';
  assert.equal(result.state.instances[0].params.resource.fileId, 'one');
});
test('política administrativa está declarada no Registry e não no appId do gerenciador', () => {
  const { registry } = core();
  assert.equal(
    registry.getAppNavigationContract('administration').requiredCapability,
    'administration.access',
  );
  assert.equal(registry.getAppNavigationContract('administration').requiresAuthentication, true);
});

/* === Contrato do catálogo após a remoção de aplicativos === */
test('Terminal normal permanece único e aceita somente navegação sem parâmetros', () => {
  const { manager: m } = core();
  const first = m.requestAppOpen(initial(), 'terminal');
  const again = m.requestAppOpen(first.state, 'terminal');
  assert.equal(first.result.instanceId, again.result.instanceId);
  assert.equal(again.state.instances.length, 1);
  assert.equal(m.requestAppOpen(again.state, 'terminal', { params: { projectId: 'github-1' } }).result.ok, false);
});

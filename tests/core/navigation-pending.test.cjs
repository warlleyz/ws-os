const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');

/* === Carregamento dos módulos === */
/* ----- Execução isolada ----- */
function load(file, bindings, names) {
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
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');

  return vm.runInNewContext(
    `(() => { ${source}; return { ${names.join(',')} }; })()`,
    {
      crypto: webcrypto,
      ...bindings,
    },
    { filename: file },
  );
}

/* ----- Preparação do Core ----- */
function createCore() {
  const registrySource = fs.readFileSync(path.join(root, 'src/core/appRegistry.js'), 'utf8');

  const icons = registrySource
    .match(/import\s*\{([\s\S]*?)\}\s*from/)[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  const registry = load(
    'src/core/appRegistry.js',
    Object.fromEntries(icons.map((name) => [name, () => null])),
    ['getAppDefinition', 'getAppNavigationContract'],
  );

  let authorized = false;

  const manager = load(
    'src/core/appManager.js',
    {
      getAppDefinition: registry.getAppDefinition,
      getAppNavigationContract: registry.getAppNavigationContract,
      isAdminAuthenticated: () => authorized,
      validateFileResource: loadFileResourceContract().validateFileResource,
    },
    ['openApp', 'closeApp', 'requestAppOpen', 'validateAppOpen'],
  );

  const guards = load('src/core/appCloseGuards.js', {}, [
    'registerCloseGuard',
    'requestGuardedAction',
    'cancelCloseConfirmation',
    'confirmAppClose',
  ]);

  const initial = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
  };

  return {
    manager,
    guards,
    initial,
    setAuthorized(value) {
      authorized = value;
    },
  };
}

/* === Testes de confirmação pendente === */
/* ----- Cancelamento sem alteração do estado ----- */
test('cancelar navegação pendente preserva a instância e seus parâmetros', () => {
  const { manager, guards, initial } = createCore();

  let state = manager.openApp(initial, 'settings', {
    params: { section: 'appearance' },
  });

  const instanceId = state.activeInstanceId;
  const originalState = state;
  const unregister = guards.registerCloseGuard(instanceId, () => false);

  const accepted = guards.requestGuardedAction(
    instanceId,
    () => {
      state = manager.openApp(state, 'settings', {
        params: { section: 'wallpaper' },
      });
    },
    'navigate',
  );

  assert.equal(accepted, false);

  guards.cancelCloseConfirmation();

  assert.equal(state, originalState);
  assert.equal(state.instances[0].params.section, 'appearance');

  unregister();
});

/* ----- Confirmação com contexto válido ----- */
test('confirmar navegação válida atualiza a mesma instância', () => {
  const { manager, guards, initial } = createCore();

  let state = manager.openApp(initial, 'settings', {
    params: { section: 'appearance' },
  });

  const instanceId = state.activeInstanceId;
  const unregister = guards.registerCloseGuard(instanceId, () => false);

  guards.requestGuardedAction(
    instanceId,
    () => {
      const request = manager.validateAppOpen('settings', {
        params: { section: 'wallpaper' },
      });

      if (!request.ok) return;

      const target = state.instances.find((instance) => instance.id === instanceId);

      if (!target) return;

      state = manager.openApp(state, 'settings', {
        params: { section: 'wallpaper' },
      });
    },
    'navigate',
  );

  guards.confirmAppClose();

  assert.equal(state.instances.length, 1);
  assert.equal(state.activeInstanceId, instanceId);
  assert.equal(state.instances[0].params.section, 'wallpaper');

  unregister();
});

/* ----- Instância encerrada antes da confirmação ----- */
test('navegação pendente não recria instância que foi encerrada', () => {
  const { manager, guards, initial } = createCore();

  let state = manager.openApp(initial, 'settings', {
    params: { section: 'appearance' },
  });

  const instanceId = state.activeInstanceId;

  const unregister = guards.registerCloseGuard(instanceId, () => false);

  guards.requestGuardedAction(
    instanceId,
    () => {
      const target = state.instances.find((instance) => instance.id === instanceId);

      if (!target) return;

      state = manager.openApp(state, 'settings', {
        params: { section: 'wallpaper' },
      });
    },
    'navigate',
  );

  state = manager.closeApp(state, instanceId);

  guards.confirmAppClose();

  assert.equal(state.instances.length, 0);

  unregister();
});

/* ----- Autorização revogada ----- */
test('revalidação bloqueia abertura administrativa após revogação de acesso', () => {
  const { manager, initial, setAuthorized } = createCore();

  setAuthorized(true);

  const original = manager.validateAppOpen('administration');

  assert.equal(original.ok, true);

  setAuthorized(false);

  const current = manager.validateAppOpen('administration');

  assert.equal(current.ok, false);
  assert.equal(current.error.code, 'APP_ACCESS_DENIED');

  const result = manager.requestAppOpen(initial, 'administration');

  assert.equal(result.state, initial);
  assert.equal(result.result.ok, false);
});

/* ----- Parâmetros inválidos no momento da execução ----- */
test('revalidação impede abertura com parâmetros alterados e inválidos', () => {
  const { manager, initial } = createCore();

  const options = {
    params: { section: 'appearance' },
  };

  const first = manager.validateAppOpen('settings', options);

  assert.equal(first.ok, true);

  options.params.section = 42;

  const second = manager.validateAppOpen('settings', options);

  assert.equal(second.ok, false);
  assert.equal(second.error.code, 'INVALID_NAVIGATION_PARAMS');

  const result = manager.requestAppOpen(initial, 'settings', options);

  assert.equal(result.state, initial);
  assert.equal(result.result.ok, false);
});

/* ----- Confirmação concorrente ----- */
test('segunda navegação não substitui a primeira confirmação pendente', () => {
  const { guards } = createCore();

  const operations = [];
  const unregister = guards.registerCloseGuard('editor', () => false);

  guards.requestGuardedAction('editor', () => operations.push('first'), 'navigate');

  const accepted = guards.requestGuardedAction(
    'editor',
    () => operations.push('second'),
    'navigate',
  );

  assert.equal(accepted, false);

  guards.confirmAppClose();

  assert.deepEqual(operations, ['first']);

  unregister();
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

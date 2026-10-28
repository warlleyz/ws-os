const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { loadContract } = require('../helpers/contract-loader.cjs');
const { renderApp } = require('../helpers/app-ui.cjs');
const root = path.resolve(__dirname, '../..');

/* === AMBIENTE DOS CONTRATOS REAIS === */
function moduleAt(file, bindings = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const names = [
    ...source.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g),
  ].map((match) => match[1]);
  const code = source.replace(/^import[\s\S]*?;\s*$/gm, '').replace(/\bexport\s+/g, '');
  return vm.runInNewContext('(()=>{' + code + ';return {' + names.join(',') + '}})()', {
    crypto: webcrypto,
    URL,
    setTimeout,
    clearTimeout,
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
    ...bindings,
  });
}
const guardsAt = () => moduleAt('src/core/appCloseGuards.js');
const wait = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function clock() {
  let next = 0;
  const timers = new Map();
  return {
    timers,
    set: (callback, duration) => {
      timers.set(++next, { callback, duration });
      return next;
    },
    clear: (id) => timers.delete(id),
    fire() {
      const [id, entry] = timers.entries().next().value;
      timers.delete(id);
      entry.callback();
    },
  };
}
function core() {
  const source = fs.readFileSync(path.join(root, 'src/core/appRegistry.js'), 'utf8');
  const icons = source
    .match(/import\s*\{([\s\S]*?)\}\s*from/)[1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const registry = moduleAt(
    'src/core/appRegistry.js',
    Object.fromEntries(icons.map((name) => [name, () => null])),
  );
  const manager = moduleAt('src/core/appManager.js', {
    ...registry,
    ...loadContract(path.join(root, 'src/shared/utils/contractValidation.js')),
    ...loadContract(path.join(root, 'src/core/authorizationContract.js')),
    ...loadContract(path.join(root, 'src/services/storage/fileResourceContract.js')),
    isAdminAuthenticated: () => false,
    resolveStaticFile: (id) => ({ ok: id === 'curriculo' }),
  });
  return { ...registry, ...manager };
}

/* === PREPARAÇÃO ASSÍNCRONA === */
test('Core aguarda preparação e executa fechamento uma única vez', async () => {
  const guards = guardsAt();
  const save = deferred();
  let executions = 0;
  let saves = 0;
  guards.registerCloseGuard('doom', () => false, {
    beforeClose: () => {
      saves++;
      return save.promise;
    },
  });
  assert.equal(
    guards.requestGuardedAction('doom', () => executions++),
    false,
  );
  assert.equal(
    guards.requestGuardedAction('doom', () => executions++),
    false,
  );
  assert.ok(guards.useClosePreparation());
  assert.equal(guards.useCloseConfirmation(), null);
  await wait();
  assert.equal(saves, 1);
  assert.equal(executions, 0);
  save.resolve(true);
  await wait();
  assert.equal(executions, 1);
  assert.equal(guards.useClosePreparation(), null);
  guards.confirmAppClose();
  assert.equal(executions, 1);
});

test('falha ou rejeição da preparação mantém instância e permite nova tentativa', async () => {
  for (const fail of [() => false, () => Promise.reject(Error('falha'))]) {
    const guards = guardsAt();
    let executions = 0;
    let succeed = false;
    guards.registerCloseGuard('doom', () => false, {
      beforeClose: () => (succeed ? true : fail()),
    });
    guards.requestGuardedAction('doom', () => executions++);
    await wait();
    assert.equal(executions, 0);
    assert.equal(guards.useClosePreparation(), null);
    succeed = true;
    guards.requestGuardedAction('doom', () => executions++);
    await wait();
    assert.equal(executions, 1);
  }
});

test('desmontagem ou substituição do guard invalida conclusão tardia', async () => {
  const guards = guardsAt();
  const save = deferred();
  let executions = 0;
  const remove = guards.registerCloseGuard('doom', () => false, {
    beforeClose: () => save.promise,
  });
  guards.requestGuardedAction('doom', () => executions++);
  await wait();
  remove();
  guards.registerCloseGuard('doom', () => false);
  remove();
  save.resolve(true);
  await wait();
  assert.equal(executions, 0);
  assert.equal(guards.canCloseApp('doom'), false);
  assert.equal(guards.useClosePreparation(), null);
});

test('troca de shell salva primeiro, confirma rascunho e cancelar não desmonta apps', async () => {
  const guards = guardsAt();
  const save = deferred();
  let transitions = 0;
  guards.registerCloseGuard('doom', () => false, { beforeClose: () => save.promise });
  guards.registerCloseGuard('editor', () => false);
  assert.equal(
    guards.requestGuardedTransition(() => transitions++),
    true,
  );
  assert.equal(
    guards.requestGuardedTransition(() => transitions++),
    false,
  );
  await wait();
  save.resolve(true);
  await wait();
  assert.equal(guards.useCloseConfirmation().instanceId, 'editor');
  guards.cancelCloseConfirmation();
  guards.confirmAppClose();
  assert.equal(transitions, 0);
  assert.equal(guards.canCloseApp('editor'), false);
});

test('novo rascunho durante preparação impede a troca de shell até nova solicitação', async () => {
  const guards = guardsAt();
  const save = deferred();
  let transitions = 0;
  guards.registerCloseGuard('doom', () => false, { beforeClose: () => save.promise });
  guards.requestGuardedTransition(() => transitions++);
  await wait();
  const remove = guards.registerCloseGuard('new-editor', () => false);
  save.resolve(true);
  await wait();
  assert.equal(transitions, 0);
  remove();
  guards.requestGuardedTransition(() => transitions++);
  await wait();
  assert.equal(transitions, 1);
});

test('guard inválido ou que lança erro não permite descarte silencioso', () => {
  const guards = guardsAt();
  let closed = false;
  guards.registerCloseGuard('editor', () => {
    throw Error('falha');
  });
  assert.equal(guards.canCloseApp('editor'), false);
  assert.equal(
    guards.requestGuardedAction('editor', () => {
      closed = true;
    }),
    false,
  );
  assert.equal(closed, false);
  guards.cancelCloseConfirmation();
});

/* === INSTÂNCIAS, FOCO E CONFIRMAÇÃO DO DESTINO === */
test('Currículo informa o Visualizador efetivo e fechamento em curso não pode ser reativado', () => {
  const api = core();
  let { state, result } = api.requestAppOpen(api.initialAppState, 'resume');
  assert.equal(result.appId, 'file-viewer');
  assert.equal(state.instances[0].params.resource.catalogId, 'curriculo');
  const viewer = result.instanceId;
  state = api.openApp(state, 'about-system');
  const other = state.activeInstanceId;
  state = api.activateApp(state, viewer);
  state = api.beginAppClose(state, viewer);
  assert.equal(state.instances.find((item) => item.id === viewer).closing, true);
  assert.equal(state.instances.find((item) => item.id === viewer).executionState, 'paused');
  assert.equal(state.activeInstanceId, other);
  assert.equal(api.activateApp(state, viewer), state);
  assert.equal(api.restoreApp(state, viewer), state);
  assert.equal(api.minimizeApp(state, viewer), state);
  state = api.closeApp(state, viewer);
  assert.equal(
    state.instances.some((item) => item.id === viewer),
    false,
  );
});

async function provider(duration = 180) {
  const api = core();
  const guards = guardsAt();
  const timer = clock();
  const body = {};
  const document = { body, activeElement: body, querySelector: () => null };
  const ui = await renderApp(
    'src/core/SystemProvider.jsx',
    { children: null },
    {
      ...api,
      ...guards,
      ...loadContract(path.join(root, 'src/core/notificationManager.js')),
      SystemContext: { Provider: 'Provider' },
      AppCloseDialog: 'CloseDialog',
      window: { location: { search: '' } },
      document,
      resolveSharedEntry: () => null,
      subscribeNotificationPreferences: () => () => {},
      getNotificationPreferences: () => ({}),
      getWindowMotionDuration: () => duration,
      setTimeout: timer.set,
      clearTimeout: timer.clear,
    },
  );
  const context = () => ui.nodes().find((node) => node.type === 'Provider').props.value;
  const settle = async () => {
    await ui.flush();
    ui.render();
    ui.render();
  };
  return { ui, api, guards, timer, context, settle };
}

test('Provider confirma atalhos e duas aberturas no mesmo lote sem perder callbacks', async () => {
  const p = await provider();
  const opened = [];
  p.context().run(p.api.openApp, 'resume', { onOpened: (event) => opened.push(event) });
  p.context().run(p.api.openApp, 'calculator', { onOpened: (event) => opened.push(event) });
  await p.settle();
  assert.equal(opened.length, 2);
  assert.equal(opened[0].requestedAppId, 'resume');
  assert.equal(opened[0].appId, 'file-viewer');
  assert.equal(opened[1].appId, 'calculator');
  p.ui.render();
  assert.equal(opened.length, 2);
  p.ui.unmount();
});

test('Provider mantém instância até terminar animação e chama onClosed após remoção', async () => {
  const p = await provider();
  let closed = 0;
  p.context().run(p.api.openApp, 'calculator');
  await p.settle();
  const id = p.context().appState.activeInstanceId;
  p.context().run(p.api.closeApp, id, {
    onClosed: () => {
      assert.equal(
        p.context().appState.instances.some((item) => item.id === id),
        false,
      );
      closed++;
    },
  });
  await p.settle();
  assert.equal(p.context().appState.instances[0].closing, true);
  assert.equal(closed, 0);
  assert.equal(p.context().run(p.api.closeApp, id), false);
  assert.equal(p.timer.timers.size, 1);
  assert.equal([...p.timer.timers.values()][0].duration, 180);
  p.timer.fire();
  await p.settle();
  assert.equal(closed, 1);
  assert.equal(p.context().appState.instances.length, 0);
  p.ui.unmount();
});

test('Provider mantém falha de salvamento aberta e não deixa nova troca aguardar app já encerrando', async () => {
  const p = await provider();
  let saved = false;
  let closed = 0;
  let transitions = 0;
  p.context().run(p.api.openApp, 'games');
  await p.settle();
  const id = p.context().appState.activeInstanceId;
  p.guards.registerCloseGuard(id, () => false, { beforeClose: async () => saved });
  p.context().run(p.api.closeApp, id, { onClosed: () => closed++ });
  await p.settle();
  assert.equal(closed, 0);
  assert.equal(p.context().appState.instances[0].closing, undefined);
  saved = true;
  p.context().run(p.api.closeApp, id);
  await p.settle();
  assert.equal(p.context().appState.instances[0].closing, true);
  p.guards.requestGuardedTransition(() => transitions++);
  assert.equal(transitions, 1);
  p.ui.unmount();
  assert.equal(p.timer.timers.size, 0);
});

test('fechamento Mobile ou sem movimento não cria atraso artificial e limpa callbacks', async () => {
  for (const [duration, options] of [
    [0, {}],
    [180, { animate: false }],
  ]) {
    const p = await provider(duration);
    let closed = 0;
    p.context().run(p.api.openApp, 'calculator');
    await p.settle();
    const id = p.context().appState.activeInstanceId;
    p.context().run(p.api.closeApp, id, { ...options, onClosed: () => closed++ });
    await p.settle();
    assert.equal(closed, 1);
    assert.equal(p.timer.timers.size, 0);
    p.ui.unmount();
  }
});

/* === APRESENTAÇÃO E MOVIMENTO REDUZIDO === */
test('duração respeita preferências explícitas e do sistema operacional', () => {
  for (const [dataset, media, duration] of [
    [{}, false, 180],
    [{ motionIntensity: 'subtle' }, false, 90],
    [{ motionIntensity: 'off' }, false, 0],
    [{ reducedMotion: 'true' }, false, 0],
    [{ lowEffects: 'true' }, false, 0],
    [{}, true, 0],
  ]) {
    const api = moduleAt('src/core/windowLifecycle.js', {
      document: { documentElement: { dataset } },
      window: { matchMedia: () => ({ matches: media }) },
    });
    assert.equal(api.getWindowMotionDuration(), duration);
  }
});

test('minimização e restauração preservam montagem e cancelam relógios anteriores', async () => {
  const timer = clock();
  const instance = { minimized: false };
  const props = { instance, mode: 'normal' };
  const ui = await renderApp(
    'src/features/windows/useWindowMotion.js',
    props,
    {
      getWindowMotionDuration: () => 180,
      setTimeout: timer.set,
      clearTimeout: timer.clear,
    },
    { getArguments: (value) => [value.instance, value.mode] },
  );
  assert.equal(ui.render().phase, 'opening');
  instance.minimized = true;
  ui.render();
  assert.equal(ui.render().phase, 'minimizing');
  assert.equal(ui.render().visible, true);
  assert.equal(timer.timers.size, 1);
  timer.fire();
  assert.equal(ui.render().visible, false);
  instance.minimized = false;
  ui.render();
  assert.equal(ui.render().phase, 'restoring');
  props.mode = 'maximized';
  ui.render();
  assert.equal(timer.timers.size, 1);
  ui.unmount();
  assert.equal(timer.timers.size, 0);
});

test('diálogo usa a origem registrada do foco ao cancelar e evita devolver foco a área inert', async () => {
  for (const inert of [false, true]) {
    const focused = [];
    const trigger = {
      isConnected: true,
      closest: () => (inert ? {} : null),
      focus: () => focused.push('trigger'),
    };
    const fallback = { focus: () => focused.push('fallback') };
    const ui = await renderApp(
      'src/shared/components/AppCloseDialog.jsx',
      { request: { action: 'close', returnFocus: trigger } },
      {
        document: { activeElement: {}, querySelector: () => fallback },
        attachRef: (type) =>
          type === 'section'
            ? { querySelector: () => ({ focus: () => focused.push('cancel') }) }
            : null,
        cancelCloseConfirmation() {},
        confirmAppClose() {},
      },
    );
    ui.unmount();
    assert.deepEqual(focused, ['cancel', inert ? 'fallback' : 'trigger']);
  }
});

/* === FOCO DE ABERTURA E RESTAURAÇÃO === */
test('janela foca a moldura ao abrir/restaurar e preserva foco dos campos ao ativar', async () => {
  const focused = [];
  const windowRef = {
    current: { querySelector: () => ({ focus: (options) => focused.push(options) }) },
  };
  const props = {
    instance: { id: 'one', appId: 'calculator', minimized: false },
    app: {},
    active: true,
  };
  const ui = await renderApp('src/features/windows/Window.jsx', props, {
    useWindowInteraction: () => ({ windowRef, mode: 'normal', appName: 'Calculadora' }),
    useWindowMotion: () => ({ phase: 'idle', visible: true, duration: 0 }),
    AppHost: 'AppHost',
    Tooltip: 'Tooltip',
  });
  assert.equal(focused.length, 1);
  props.active = false;
  ui.render();
  props.active = true;
  ui.render();
  assert.equal(focused.length, 1);
  props.instance.minimized = true;
  ui.render();
  props.instance.minimized = false;
  ui.render();
  assert.equal(focused.length, 2);
  assert.equal(focused[1].preventScroll, true);
  ui.unmount();
});

const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const { loadContract } = require('../helpers/contract-loader.cjs');
const root = path.resolve(__dirname, '../..');
const geometry = () => loadContract(path.join(root, 'src/features/windows/windowGeometry.js'));

/* === Geometria em resoluções extremas e títulos recuperáveis === */
test('arraste admite saída parcial, mantém título acessível e resize respeita limites', () => {
  const api = geometry();
  for (const width of [60, 300, 768, 1920, 3840])
    for (const height of [40, 220, 720, 2160]) {
      const bounds = { width, height };
      const next = api.constrainGeometry(
        { x: -9999, y: 9999, width: 900, height: 700 },
        bounds,
        true,
      );
      assert.ok(next.width <= width && next.height <= height);
      assert.ok(next.x + next.width >= Math.min(96, width - Math.min(8, width / 2) * 2));
      assert.ok(next.y <= Math.max(8, height - 48));
      const initial = api.constrainGeometry({ x: 0, y: 0, width: 900, height: 700 }, bounds);
      for (const direction of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
        const size = api.resizeGeometry(initial, direction, 9999, -9999, bounds);
        assert.ok(size.width >= 0 && size.height >= 0, direction);
      }
    }
});

/* === Harness de interação: hooks e DOM somente nas fronteiras === */
function interaction() {
  const modeChanges = [];
  const effects = [],
    layouts = [],
    frames = new Map(),
    listeners = new Map();
  let id = 0,
    renders = 0;
  const parent = {
    clientWidth: 1400,
    clientHeight: 900,
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    appendChild() {},
  };
  const element = {
    style: {},
    dataset: {},
    offsetParent: parent,
    setAttribute() {},
    removeAttribute() {},
    getBoundingClientRect() {
      return {
        left: parseFloat(this.style.left) || 200,
        top: parseFloat(this.style.top) || 100,
        width: parseFloat(this.style.width) || 720,
        height: parseFloat(this.style.height) || 480,
      };
    },
  };
  const source = fs
    .readFileSync(path.join(root, 'src/features/windows/useWindowInteraction.js'), 'utf8')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replace('export default function', 'function');
  const hook = vm.runInNewContext(source + ';useWindowInteraction', {
    ...geometry(),
    useRef: (value) => ({ current: value }),
    useState: (value) => [
      value,
      (next) => {
        renders++;
        modeChanges.push(next);
      },
    ],
    useEffect: (callback) => effects.push(callback),
    useLayoutEffect: (callback) => layouts.push(callback),
    document: {
      addEventListener: (key, handler) => listeners.set(key, handler),
      removeEventListener: (key) => listeners.delete(key),
      createElement: () => ({ style: {}, setAttribute() {}, remove() {} }),
    },
    requestAnimationFrame: (callback) => {
      frames.set(++id, callback);
      return id;
    },
    cancelAnimationFrame: (key) => frames.delete(key),
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
  });
  const api = hook({
    instance: { appId: 'projects', minimized: false },
    app: { name: 'Projetos' },
  });
  api.windowRef.current = element;
  const cleanups = [...effects, ...layouts]
    .map((callback) => callback())
    .filter((value) => typeof value === 'function');
  let captured = false;
  const target = {
    setPointerCapture() {
      captured = true;
    },
    hasPointerCapture: () => captured,
    releasePointerCapture() {
      captured = false;
    },
  };
  const event = (x, y, type = 'pointermove') => ({
    clientX: x,
    clientY: y,
    type,
    button: 0,
    pointerId: 1,
    currentTarget: target,
    target: { closest: () => null },
    preventDefault() {},
  });
  return {
    api,
    modeChanges,
    element,
    event,
    frames,
    listeners,
    get renders() {
      return renders;
    },
    flush() {
      for (const [key, callback] of [...frames]) {
        frames.delete(key);
        callback();
      }
    },
    cleanup() {
      cleanups.forEach((fn) => fn());
    },
  };
}

test('duzentos movimentos usam um frame sem render global e pointerup aplica o último ponto', () => {
  const env = interaction();
  env.api.startInteraction(env.event(400, 200, 'pointerdown'), 'drag');
  for (let i = 0; i < 200; i++) env.api.moveInteraction(env.event(400 + i, 200 + i));
  assert.equal(env.frames.size, 1);
  assert.equal(env.renders, 0);
  env.flush();
  assert.equal(env.element.style.left, '399px');
  env.api.moveInteraction(env.event(700, 400));
  env.api.endInteraction(env.event(710, 410, 'pointerup'));
  assert.equal(env.element.style.left, '510px');
  assert.equal(env.frames.size, 0);
  env.cleanup();
});

test('Escape restaura geometria e desmontagem cancela frame e captura pendentes', () => {
  const env = interaction();
  env.api.startInteraction(env.event(400, 200, 'pointerdown'), 'drag');
  env.api.moveInteraction(env.event(800, 500));
  env.listeners.get('keydown')({ key: 'Escape' });
  assert.equal(env.frames.size, 0);
  assert.equal(env.element.style.left, '200px');
  env.api.startInteraction(env.event(400, 200, 'pointerdown'), 'drag');
  env.api.moveInteraction(env.event(800, 500));
  env.cleanup();
  assert.equal(env.frames.size, 0);
});

test('movimento por teclado altera apenas a janela e Shift aumenta o passo', () => {
  const env = interaction();
  env.api.handleMoveKeyDown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(env.element.style.left, '210px');
  env.api.handleMoveKeyDown({ key: 'ArrowDown', shiftKey: true, preventDefault() {} });
  assert.equal(env.element.style.top, '120px');
  assert.equal(env.renders, 0);
  env.cleanup();
});

test('troca de shell exige confirmação de todos os rascunhos e cancelar preserva a origem', () => {
  const code = fs
    .readFileSync(path.join(root, 'src/core/appCloseGuards.js'), 'utf8')
    .replace(/^import.*;$/gm, '')
    .replace(/export /g, '');
  const guards = vm.runInNewContext(
    code +
      ';({registerCloseGuard,requestGuardedTransition,confirmAppClose,cancelCloseConfirmation})',
  );
  guards.registerCloseGuard('first', () => false);
  guards.registerCloseGuard('second', () => false);
  let transitions = 0;
  guards.requestGuardedTransition(() => transitions++);
  guards.confirmAppClose();
  assert.equal(transitions, 0);
  guards.cancelCloseConfirmation();
  guards.confirmAppClose();
  assert.equal(transitions, 0);
  guards.requestGuardedTransition(() => transitions++);
  guards.confirmAppClose();
  guards.confirmAppClose();
  guards.confirmAppClose();
  assert.equal(transitions, 1);
});

test('Escape depois de arrastar janela maximizada recupera o modo anterior', () => {
  const env = interaction();
  env.api.toggleMaximize();
  env.api.startInteraction(env.event(400, 200, 'pointerdown'), 'drag');
  env.api.moveInteraction(env.event(700, 400));
  env.flush();
  env.listeners.get('keydown')({ key: 'Escape' });
  assert.equal(env.modeChanges.at(-1), 'maximized');
  env.cleanup();
});

/* === Integração do breakpoint com confirmação e estado atual === */
test('App não pede descarte para o shell atual e revalida a mudança nos dois sentidos', async () => {
  const { transformWithOxc } = await import('vite');
  const source = fs
    .readFileSync(path.join(root, 'src/App.jsx'), 'utf8')
    .replaceAll('import.meta.env.BASE_URL', "'/'");
  const { code } = await transformWithOxc(source, 'App.jsx', { jsx: { runtime: 'classic' } });
  const states = [],
    effects = [],
    queue = [];
  let stateIndex = 0,
    effectIndex = 0,
    listener;
  const media = {
    matches: false,
    addEventListener: (_key, fn) => (listener = fn),
    removeEventListener: (_key, fn) => {
      if (listener === fn) listener = null;
    },
  };
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [
        states[index],
        (value) => (states[index] = typeof value === 'function' ? value(states[index]) : value),
      ];
    },
    useEffect: (callback, deps) => {
      const index = effectIndex++,
        before = effects[index];
      if (!before || deps.some((value, i) => value !== before.deps[i]))
        queue.push(() => {
          before?.cleanup?.();
          effects[index] = { deps, cleanup: callback() };
        });
    },
  };
  const confirmations = [];
  const App = vm.runInNewContext(
    code.replace(/^import[\s\S]*?;\s*$/gm, '').replace('export default function', 'function') +
      ';App',
    {
      React,
      ...React,
      requestGuardedTransition: (proceed) => {
        confirmations.push(proceed);
        return true;
      },
      window: { matchMedia: () => media, setTimeout: () => 0, clearTimeout() {} },
      localStorage: { getItem: () => 'true' },
      document: {
        documentElement: { dataset: {}, style: { setProperty() {}, removeProperty() {} } },
      },
      useLocale: () => 'pt-BR',
      useTheme: () => 'dark',
      useAppearance: () => ({}),
      useAccessibility: () => ({}),
      useCursorMode: () => 'default',
      CURSOR_VARIANTS: [],
      applyTheme() {},
      applyAppearance() {},
      applyAccessibility() {},
      BootScreen: 'Boot',
    },
  );
  const render = () => {
    stateIndex = 0;
    effectIndex = 0;
    App();
    while (queue.length) queue.shift()();
  };
  render();
  media.matches = true;
  listener({ matches: true });
  assert.equal(confirmations.length, 1);
  media.matches = false;
  listener({ matches: false });
  assert.equal(confirmations.length, 1);
  media.matches = true;
  listener({ matches: true });
  confirmations.at(-1)();
  render();
  media.matches = false;
  listener({ matches: false });
  assert.equal(confirmations.length, 3);
  confirmations.at(-1)();
  render();
  media.matches = false;
  listener({ matches: false });
  assert.equal(confirmations.length, 3);
  effects.forEach((effect) => effect?.cleanup?.());
});

test('Não perturbe sincroniza entre abas e falha ao persistir mantém a sessão viável', () => {
  let storageHandler;
  let saved = '{"doNotDisturb":false}';
  let blocked = false;
  const source = fs
    .readFileSync(path.join(root, 'src/core/notificationPreferences.js'), 'utf8')
    .replace(/^import.*;$/gm, '')
    .replace(/export /g, '');
  const api = vm.runInNewContext(
    source + ';({getNotificationPreferences,setDoNotDisturb,subscribeNotificationPreferences})',
    {
      window: { addEventListener: (_key, handler) => (storageHandler = handler) },
      localStorage: {
        getItem: () => saved,
        setItem: (_key, value) => {
          if (blocked) throw Error('quota');
          saved = value;
        },
      },
    },
  );
  let notifications = 0;
  api.subscribeNotificationPreferences(() => notifications++);
  storageHandler({ key: 'ws-os:notification-preferences', newValue: '{"doNotDisturb":true}' });
  assert.equal(api.getNotificationPreferences().doNotDisturb, true);
  assert.equal(notifications, 1);
  blocked = true;
  assert.equal(api.setDoNotDisturb(false), false);
  assert.equal(api.getNotificationPreferences().doNotDisturb, false);
  storageHandler({ key: 'ws-os:notification-preferences', newValue: 'invalid' });
  assert.equal(api.getNotificationPreferences().doNotDisturb, false);
  const contract = loadContract(path.join(root, 'src/core/preferenceContract.js'));
  assert.equal(contract.adaptStoredPreference('ws-os:cursor-mode', 'native').ok, true);
  assert.ok(contract.createPreferenceResetPlan(['appearance']).actions.includes('cursor'));
  assert.deepEqual(Array.from(contract.createPreferenceResetPlan(['notifications']).actions), [
    'notifications',
  ]);
});

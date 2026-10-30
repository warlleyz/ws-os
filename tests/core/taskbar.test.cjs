const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// Executa o hook com relógio controlado, sem esperar timers reais nem instalar um renderer.
function previewsHarness() {
  const slots = [];
  const timers = new Map();
  let cursor = 0;
  let nextTimer = 0;
  let dirty = false;
  let effects = [];
  let opened = 0;
  const document = { activeElement: null, querySelector: () => null };
  const changed = (a, b) => !a || a.length !== b.length || a.some((v, i) => v !== b[i]);
  const context = vm.createContext({
    document,
    window: {
      setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
      clearTimeout(id) { timers.delete(id); },
    },
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initial };
      return [slots[index].value, (next) => {
        const value = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return (slots[index] ??= { current: initial });
    },
    useCallback(fn, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) slots[index] = { fn, deps };
      return slots[index].fn;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: fn() };
      });
    },
  });
  vm.runInContext(read('src/shells/desktop/taskbar/useTaskbarPreviews.js')
    .replace(/^import[^;]+;\s*/gm, '')
    .replace('export default function', 'function'), context);
  const props = {
    groups: [{ appId: 'projects', instances: [{ id: 'one', minimized: false }] }],
    appState: { instances: [{ id: 'one', minimized: false }], focusHistory: ['one'] },
    onPreviewOpen: () => { opened += 1; },
  };
  let hook;
  function render() {
    let attempts = 0;
    do {
      dirty = false;
      effects = [];
      cursor = 0;
      hook = context.useTaskbarPreviews(props);
      assert.ok(++attempts < 10, 'O hook não deve entrar em um ciclo de renderização');
    } while (dirty);
    for (const effect of effects) effect();
    return hook;
  }
  return {
    render, props, document, timers,
    get opened() { return opened; },
    flush() {
      const pending = [...timers.values()];
      timers.clear();
      for (const fn of pending) fn();
      return render();
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

test('prévia por teclado recebe foco e Escape pode devolver ao grupo', () => {
  const h = previewsHarness();
  let hook = h.render();
  let triggerFocused = 0;
  let previewFocused = 0;
  hook.previewRef.current = { querySelector: () => ({ focus() { previewFocused += 1; } }) };
  hook.openPreview('projects', { focus() { triggerFocused += 1; } });
  hook = h.render();
  assert.equal(hook.previewGroup, 'projects');
  assert.equal(previewFocused, 1);
  assert.equal(h.opened, 1);
  hook.closePreview(true);
  assert.equal(h.render().previewGroup, null);
  assert.equal(triggerFocused, 1);
});

test('timer não fecha a prévia enquanto ela contém o foco do teclado', () => {
  const h = previewsHarness();
  let hook = h.render();
  hook.openPreview('projects');
  hook = h.render();
  const focused = {};
  h.document.activeElement = focused;
  hook.previewRef.current = { matches: () => false, contains: (node) => node === focused };
  hook.schedulePreviewClose();
  assert.equal(h.flush().previewGroup, 'projects');
  h.document.activeElement = null;
  h.render().schedulePreviewClose();
  assert.equal(h.flush().previewGroup, null);
});

test('ativação de app cancela abertura pendente e fecha prévia anterior', () => {
  const h = previewsHarness();
  h.render().schedulePreviewOpen('projects');
  assert.equal(h.timers.size, 1);
  h.props.appState = { ...h.props.appState, focusHistory: ['one', 'other'] };
  assert.equal(h.render().previewGroup, null);
  assert.equal(h.timers.size, 0);
  assert.equal(h.flush().previewGroup, null);
  h.render().openPreview('projects');
  assert.equal(h.render().previewGroup, 'projects');
  h.props.appState = { ...h.props.appState, focusHistory: ['other', 'one'] };
  assert.equal(h.render().previewGroup, null);
});

test('desmontar a Taskbar cancela timers e remove destaque da janela', () => {
  const h = previewsHarness();
  const element = { dataset: { instanceId: 'one' }, isConnected: true };
  h.document.querySelector = () => element;
  const hook = h.render();
  hook.highlightWindow({ id: 'one', minimized: false });
  hook.schedulePreviewOpen('projects');
  assert.equal(element.dataset.taskbarPreview, 'true');
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal(element.dataset.taskbarPreview, undefined);
});

test('hover mantém prévia e saída sem foco permite fechamento', () => {
  const h = previewsHarness();
  let hook = h.render();
  hook.openPreview('projects');
  hook = h.render();
  let hovered = true;
  hook.previewRef.current = { matches: () => hovered, contains: () => false };
  hook.schedulePreviewClose();
  assert.equal(h.flush().previewGroup, 'projects');
  hovered = false;
  h.render().schedulePreviewClose();
  assert.equal(h.flush().previewGroup, null);
});

test('clique no grupo encontra a janela reativada, não a última criada', () => {
  const context = vm.createContext({ getAppDefinition: () => ({ public: true }) });
  vm.runInContext(read('src/core/appManager.js')
    .replace(/^import[^;]+;[ \t]*(?:\r?\n)?/gm, '')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, ''), context);
  const state = {
    instances: [
      { id: 'first', appId: 'projects', minimized: false },
      { id: 'second', appId: 'projects', minimized: false },
      { id: 'other', appId: 'about-me', minimized: false },
    ],
    activeInstanceId: 'other',
    focusHistory: ['second', 'first', 'other'],
  };
  assert.equal(context.getPreferredInstance(state, 'projects').id, 'first');
  let next = context.activateApp(state, 'first');
  next = context.minimizeApp(next, 'first');
  next = context.minimizeApp(next, 'second');
  assert.equal(context.getPreferredInstance(next, 'projects').id, 'first');
  next = context.closeApp(next, 'first');
  assert.equal(context.getPreferredInstance(next, 'projects').id, 'second');
  next = context.closeApp(next, 'second');
  assert.equal(context.getPreferredInstance(next, 'projects'), null);
  assert.equal(next.activeInstanceId, 'other');
});

/* === EXCLUSIVIDADE DO CONTEXTO DA TASKBAR === */
test('abrir painel da Taskbar dispensa seu menu de contexto anterior', () => {
  const source = read('src/shells/desktop/taskbar/Taskbar.jsx');
  for (const name of ['toggleWSMenu', 'toggleNotifications', 'toggleQuickControls', 'toggleWally', 'toggleWeather', 'toggleCalendar']) {
    const start = source.indexOf('  function ' + name + '(');
    const bodyStart = source.indexOf('{', start);
    let end = bodyStart + 1, depth = 1;
    while (depth) {
      if (source[end] === '{') depth += 1;
      if (source[end] === '}') depth -= 1;
      end += 1;
    }
    let contextOpen = true;
    const noop = () => {};
    const bindings = Object.fromEntries([
      'clearWindowHighlight', 'closePreview', 'setContextGroup', 'setShortcutContext',
      'setQuickControlsOpen', 'setWallyOpen', 'setWeatherOpen', 'setMenuView',
      'setMenuSearch', 'setMenuOpen', 'setNotificationOpen', 'setCalendarOpen',
    ].map((key) => [key, noop]));
    vm.runInNewContext(source.slice(start, end) + ';' + name + '()', {
      ...bindings,
      menuOpen: false,
      contextTriggerRef: { current: null },
      shortcutTriggerRef: { current: null },
      setTaskbarContextOpen: (value) => { contextOpen = value; },
    });
    assert.equal(contextOpen, false, name + ' deve preservar exclusividade');
  }
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function loadPureModule(file, bindings = {}) {
  const source = read(file)
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function|async function)\b)/g, '');
  const context = vm.createContext({ crypto: webcrypto, ...bindings });
  vm.runInContext(source, context, { filename: file });
  return context;
}

function loadCore() {
  const registrySource = read('src/core/appRegistry.js');
  const iconNames = registrySource
    .match(/import\s*\{([\s\S]*?)\}\s*from/)[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  const registry = loadPureModule(
    'src/core/appRegistry.js',
    Object.fromEntries(iconNames.map((name) => [name, () => null])),
  );
  const manager = loadPureModule('src/core/appManager.js', {
    getAppDefinition: registry.getAppDefinition,
  });
  return { registry, manager };
}

test('catálogo preserva os 18 aplicativos e os 12 atalhos', () => {
  const { registry } = loadCore();
  const apps = registry.getRegisteredApps();
  assert.equal(apps.length, 18);
  assert.equal(new Set(apps.map((app) => app.id)).size, 18);
  assert.equal(apps.filter((app) => app.desktopShortcut).length, 12);
  assert.equal(apps.filter((app) => app.category === 'system').length, 6);
  assert.equal(registry.getAppDefinition('administration').public, false);
});

test('abrir app de instância única restaura a mesma instância', () => {
  const { manager: m } = loadCore();
  let state = { instances: [], activeInstanceId: null, focusHistory: [] };
  state = m.openApp(state, 'about-me');
  const id = state.activeInstanceId;
  state = m.minimizeApp(state, id);
  assert.equal(state.instances[0].minimized, true);
  state = m.openApp(state, 'about-me');
  assert.equal(state.instances.length, 1);
  assert.equal(state.activeInstanceId, id);
  assert.equal(state.instances[0].minimized, false);
});

test('múltiplas instâncias preservam foco e fecham individualmente', () => {
  const { manager: m } = loadCore();
  let state = { instances: [], activeInstanceId: null, focusHistory: [] };
  state = m.openApp(state, 'projects');
  const first = state.activeInstanceId;
  state = m.openApp(state, 'projects');
  const second = state.activeInstanceId;
  assert.notEqual(first, second);
  state = m.minimizeApp(state, second);
  assert.equal(state.activeInstanceId, first);
  state = m.restoreApp(state, second);
  assert.equal(state.activeInstanceId, second);
  state = m.closeApp(state, second);
  assert.equal(state.instances.length, 1);
  assert.equal(state.activeInstanceId, first);
});

test('app inexistente não cria instância', () => {
  const { manager: m } = loadCore();
  const state = { instances: [], activeInstanceId: null, focusHistory: [] };
  assert.equal(m.openApp(state, 'not-registered'), state);
});

test('geometria e snap preservam limites e layouts existentes', () => {
  const m = loadPureModule('src/features/windows/windowGeometry.js');
  const geometry = m.constrainGeometry(
    { x: -100, y: -100, width: 400, height: 300 },
    { width: 1000, height: 700 },
  );
  assert.equal(geometry.x, 8);
  assert.equal(geometry.y, 8);
  assert.equal(m.getSnapMode(0, 0, 1000, 700), 'top-left');
  assert.equal(m.getSnapMode(500, 0, 1000, 700), 'maximized');
  assert.equal(m.getSnapMode(500, 300, 1000, 700), null);
});

test('grade mantém todos os atalhos em área ampla e evita colisão com relógio', () => {
  const m = loadPureModule('src/shells/desktop/desktopLayout.js');
  const result = m.getDesktopLayout(12, 1000, 700, {
    visible: true,
    position: null,
    size: { columns: 2, rows: 2 },
  });
  assert.equal(result.shortcuts.length, 12);
  assert.ok(result.widget);
  for (const shortcut of result.shortcuts) {
    assert.ok(
      shortcut.left + 90 <= result.widget.left ||
        shortcut.left >= result.widget.left + 180 ||
        shortcut.top + 88 <= result.widget.top ||
        shortcut.top >= result.widget.top + 176,
    );
  }
});

test('resolução de painéis preserva exclusividade e alternância', () => {
  const m = loadPureModule('src/core/panelManager.js');
  assert.equal(m.resolvePanel(true, 'calendar', 'menu'), 'menu');
  assert.equal(m.resolvePanel(false, 'calendar', 'calendar'), null);
  assert.equal(m.resolvePanel(false, 'calendar', 'weather'), 'calendar');
});

test('grupo da Taskbar respeita histórico de foco e minimização', () => {
  const { manager: m } = loadCore();

  let state = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
  };

  state = m.openApp(state, 'projects');
  const first = state.activeInstanceId;

  state = m.openApp(state, 'projects');
  const second = state.activeInstanceId;

  state = m.openApp(state, 'about-me');
  const other = state.activeInstanceId;

  assert.equal(m.getPreferredInstance(state, 'projects').id, second);

  state = m.minimizeApp(state, second);
  assert.equal(m.getPreferredInstance(state, 'projects').id, second);

  state = m.minimizeApp(state, other);
  assert.equal(state.activeInstanceId, first);
  assert.equal(m.getPreferredInstance(state, 'projects').id, first);

  state = m.minimizeApp(state, first);
  assert.equal(state.activeInstanceId, null);
  assert.equal(m.getPreferredInstance(state, 'projects').id, first);

  state = m.restoreApp(state, second);
  assert.equal(m.getPreferredInstance(state, 'projects').id, second);

  state = m.closeApp(state, second);
  assert.equal(m.getPreferredInstance(state, 'projects').id, first);
});

test('calendário e painéis preservam exclusividade', () => {
  const m = loadPureModule('src/core/panelManager.js');

  let panel = 'calendar';

  panel = m.resolvePanel(true, panel, 'menu');
  assert.equal(panel, 'menu');

  panel = m.resolvePanel(true, panel, 'weather');
  assert.equal(panel, 'weather');

  panel = m.resolvePanel(false, panel, 'calendar');
  assert.equal(panel, 'weather');

  panel = m.resolvePanel(false, panel, 'weather');
  assert.equal(panel, null);
});

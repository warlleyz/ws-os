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
    getAppNavigationContract: registry.getAppNavigationContract,
    isAdminAuthenticated: () => false,
    validateFileResource: loadFileResourceContract().validateFileResource,
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

test('registry não declara aplicativos funcionais inexistentes', () => {
  const { registry } = loadCore();
  const apps = registry.getRegisteredApps();
  assert.equal(apps.length, 18);
  assert.equal(apps.filter((app) => app.desktopShortcut).length, 12);
  const source = fs.readFileSync(path.join(root, 'src/core/appRegistry.js'), 'utf8');
  const entries = [...source.matchAll(/import\('\.\.\/apps\/([^']+)'\)/g)];
  assert.equal(apps.filter((app) => app.implemented).length, entries.length);
  for (const [, entry] of entries) {
    const filename = path.join(root, 'src/apps', entry);
    assert.ok(fs.existsSync(filename), entry);
    assert.match(fs.readFileSync(filename, 'utf8'), /export default/, entry);
  }
});

test('Core bloqueia aplicativos restritos sem modificar a sessão', () => {
  const { manager: m } = loadCore();

  let state = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
  };

  const originalState = state;

  state = m.openApp(state, 'administration');

  assert.equal(state, originalState);
  assert.equal(state.instances.length, 0);

  state = m.openApp(state, 'projects');

  assert.equal(state.instances.length, 1);
  assert.equal(state.instances[0].appId, 'projects');
});

test('abertura aceita origem e parâmetros por instância', () => {
  const { manager: m } = loadCore();

  let state = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
  };

  state = m.openApp(state, 'projects', {
    origin: 'app',
    params: { projectId: 'project-01' },
  });

  const first = state.instances[0];

  assert.equal(first.origin, 'app');
  assert.equal(first.params.projectId, 'project-01');

  state = m.openApp(state, 'projects', {
    origin: 'menu',
    params: { projectId: 'project-02' },
  });

  assert.equal(state.instances.length, 2);
  assert.equal(state.instances[0].params.projectId, 'project-01');
  assert.equal(state.instances[1].params.projectId, 'project-02');

  state = m.closeApp(state, first.id);

  assert.equal(state.instances.length, 1);
  assert.equal(state.instances[0].params.projectId, 'project-02');
});

test('abertura mantém compatibilidade com chamadas existentes', () => {
  const { manager: m } = loadCore();

  const initial = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
  };

  const state = m.openApp(initial, 'about-system');

  assert.equal(state.instances.length, 1);
  assert.equal(state.instances[0].origin, 'system');
  assert.equal(Object.keys(state.instances[0].params).length, 0);

  assert.equal(m.openApp(state, 'administration'), state);
});

test('lifecycle mantém estado ao minimizar e restaurar', () => {
  const { manager: m } = loadCore();

  let state = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
  };

  state = m.openApp(state, 'projects');
  const id = state.activeInstanceId;

  assert.equal(state.instances[0].executionState, 'running');

  state = m.minimizeApp(state, id);

  assert.equal(state.instances[0].minimized, true);
  assert.equal(state.instances[0].executionState, 'paused');
  assert.equal(state.activeInstanceId, null);

  state = m.restoreApp(state, id);

  assert.equal(state.instances[0].id, id);
  assert.equal(state.instances[0].minimized, false);
  assert.equal(state.instances[0].executionState, 'running');
  assert.equal(state.activeInstanceId, id);

  state = m.closeApp(state, id);

  assert.equal(state.instances.length, 0);
  assert.equal(state.focusHistory.length, 0);
  assert.equal(state.activeInstanceId, null);
});

test('apps sem pausa seletiva continuam running ao minimizar', () => {
  const { manager: m } = loadCore();

  let state = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
  };

  state = m.openApp(state, 'about-system');
  const id = state.activeInstanceId;

  state = m.minimizeApp(state, id);

  assert.equal(state.instances[0].minimized, true);
  assert.equal(state.instances[0].executionState, 'running');

  const unchanged = m.minimizeApp(state, id);

  assert.equal(unchanged, state);

  state = m.restoreApp(state, id);

  assert.equal(state.instances.length, 1);
  assert.equal(state.instances[0].executionState, 'running');
});

test('widget não oculta atalhos quando a grade está no limite', () => {
  const m = loadPureModule('src/shells/desktop/desktopLayout.js');

  const layout = m.getDesktopLayout(12, 360, 352, {
    visible: true,
    position: null,
    size: { columns: 2, rows: 2 },
  });

  assert.equal(layout.shortcuts.length, 12);
  assert.equal(layout.widget, null);
});

test('widget é realocado quando sua posição preferida não cabe', () => {
  const m = loadPureModule('src/shells/desktop/desktopLayout.js');

  const layout = m.getDesktopLayout(2, 720, 528, {
    visible: true,
    position: { column: 7, row: 5 },
    size: { columns: 2, rows: 2 },
  });

  assert.equal(layout.shortcuts.length, 2);
  assert.ok(layout.widget);

  assert.equal(m.getCellColumn(layout.widget.left, layout), layout.columns - 2);
  assert.equal(layout.widget.top, 0);
});

test('widget preserva posição preferida quando ela continua válida', () => {
  const m = loadPureModule('src/shells/desktop/desktopLayout.js');

  const layout = m.getDesktopLayout(2, 720, 528, {
    visible: true,
    position: { column: 3, row: 1 },
    size: { columns: 2, rows: 2 },
  });

  assert.equal(layout.shortcuts.length, 2);
  assert.equal(m.getCellColumn(layout.widget.left, layout), 3);
  assert.equal(layout.widget.top, 88);
});

test('widgets recuperam estado padrão quando armazenamento falha', () => {
  const storage = {
    getItem() {
      throw new Error('Armazenamento indisponível');
    },
    setItem() {
      throw new Error('Armazenamento indisponível');
    },
  };

  const m = loadPureModule('src/core/widgetManager.js', {
    localStorage: storage,
  });

  const state = m.loadWidgetState();

  assert.equal(state.widgets.length, m.getRegisteredWidgets().length);
  assert.equal(state.widgets[0].instanceId, 'clock-default');
  assert.equal(state.widgets[0].visible, true);
  assert.equal(m.saveWidgetState(state), false);
});

test('widgets recuperam dados corrompidos sem perder valores padrão', () => {
  const storage = {
    getItem() {
      return '{dados inválidos';
    },
  };

  const m = loadPureModule('src/core/widgetManager.js', {
    localStorage: storage,
  });

  const state = m.loadWidgetState();

  assert.equal(state.widgets.length, m.getRegisteredWidgets().length);
  assert.equal(state.widgets[0].widgetId, 'clock');
  assert.equal(state.widgets[0].visible, true);
  assert.equal(state.widgets[0].size.columns, 2);
  assert.equal(state.widgets[0].size.rows, 2);
});

test('widgets preservam preferências válidas armazenadas', () => {
  const storage = {
    getItem(key) {
      assert.equal(key, 'ws-os:desktop-widgets');

      return JSON.stringify({
        widgets: [
          {
            instanceId: 'clock-default',
            widgetId: 'clock',
            visible: false,
            position: { column: 4, row: 2 },
            size: { columns: 3, rows: 2 },
          },
        ],
      });
    },
  };

  const m = loadPureModule('src/core/widgetManager.js', {
    localStorage: storage,
  });

  const widget = m.loadWidgetState().widgets[0];

  assert.equal(widget.visible, false);
  assert.equal(widget.position.column, 4);
  assert.equal(widget.position.row, 2);
  assert.equal(widget.size.columns, 3);
  assert.equal(widget.size.rows, 2);
});

test('resize aplica geometria usando dimensões do observer sem reler layout', () => {
  const m = loadPureModule('src/features/windows/windowGeometry.js');
  const element = {
    style: {},
    get offsetParent() {
      throw new Error('Leitura de layout inesperada');
    },
  };
  const result = m.applyGeometry(
    element,
    { x: 900, y: 600, width: 400, height: 300 },
    { width: 1000, height: 700 },
  );
  assert.equal(result.x, 592);
  assert.equal(result.y, 392);
  assert.equal(element.style.width, '400px');
});

test('geometria inalterada não reescreve estilos a cada resize', () => {
  const m = loadPureModule('src/features/windows/windowGeometry.js');
  let writes = 0;
  const style = new Proxy(
    {},
    {
      set(target, property, value) {
        writes += 1;
        target[property] = value;
        return true;
      },
    },
  );
  const element = { style };
  const geometry = { x: 30, y: 40, width: 400, height: 300 };
  const bounds = { width: 1000, height: 700 };
  m.applyGeometry(element, geometry, bounds);
  assert.equal(writes, 4);
  m.applyGeometry(element, geometry, bounds);
  assert.equal(writes, 4);
  m.applyGeometry(element, { ...geometry, x: 50 }, bounds);
  assert.equal(writes, 5);
});

/* === Dependências de arquivos === */
/* ----- Carregamento do contrato compartilhado ----- */
function loadFileResourceContract() {
  const source = fs.readFileSync(
    path.join(root, 'src/services/storage/fileResourceContract.js'),
    'utf8',
  ).replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

  const context = vm.createContext({});
  vm.runInContext(source, context);

  return context;
}
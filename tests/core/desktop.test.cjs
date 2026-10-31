const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '../..');
function load(file, bindings = {}) {
  const source = fs
    .readFileSync(path.join(root, file), 'utf8')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');
  const context = vm.createContext(bindings);
  vm.runInContext(source, context);
  return context;
}
const layoutModule = () => load('src/shells/desktop/desktopLayout.js');
const apps = Array.from({ length: 12 }, (_, index) => ({ id: `app-${index}` }));
const clock = (size = { columns: 2, rows: 2 }) => ({ visible: true, size, position: null });

/* === Redimensionamento do Desktop === */
/* ----- Preservação de atalhos e widgets ----- */
test('redimensionamento mantém atalhos acessíveis e widgets sem colisões', () => {
  const m = layoutModule();

  const widgets = [
    {
      instanceId: 'clock-default',
      widgetId: 'clock',
      visible: true,
      size: { columns: 2, rows: 2 },
      position: { column: 0, row: 0 },
    },
    {
      instanceId: 'calendar-default',
      widgetId: 'calendar',
      visible: true,
      size: { columns: 3, rows: 2 },
      position: { column: 6, row: 0 },
    },
  ];

  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [1024, 768],
    [800, 600],
    [360, 640],
  ]) {
    const layout = m.getMultiWidgetLayout(12, width, height, widgets);

    assert.equal(layout.shortcuts.length, 12);

    const occupied = new Set();

    for (const position of layout.shortcuts) {
      assert.ok(position, `${width}x${height}: atalho ausente`);

      const column = m.getCellColumn(position.left, layout);
      const row = m.getCellRow(position.top);
      const cell = `${column}:${row}`;

      assert.ok(m.isDesktopCellAvailable(column, row, layout));
      assert.ok(!occupied.has(cell), `Colisão de atalho: ${cell}`);

      occupied.add(cell);
    }

    for (const widget of Object.values(layout.widgets)) {
      for (const cell of m.getWidgetCells(widget.position, widget.size)) {
        const id = `${cell.column}:${cell.row}`;

        assert.ok(m.isDesktopCellAvailable(cell.column, cell.row, layout));
        assert.ok(!occupied.has(id), `Colisão com widget: ${id}`);

        occupied.add(id);
      }
    }

    assert.equal(
      Object.keys(layout.widgets).length + layout.blockedWidgets.length,
      widgets.length,
    );
  }
});

/* === Áreas reservadas do Desktop === */
/* ----- Proteção da Taskbar e notificações ----- */
test('faixa inferior preserva Taskbar e notificações', () => {
  const m = layoutModule();
  const layout = m.getDesktopLayout(12, 1440, 700, null);

  const reservedLeft = (layout.width - m.TASKBAR_RESERVED_WIDTH) / 2;

  for (let row = 0; row < layout.rows; row += 1) {
    const top = m.getCellTop(row);
    const isBottomArea =
      top < layout.viewportHeight &&
      top + m.ROW_STEP > layout.viewportHeight - m.TASKBAR_RESERVED_BOTTOM;

    for (let column = 0; column < layout.columns; column += 1) {
      const left = m.getCellLeft(column, layout);
      const available = m.isDesktopCellAvailable(column, row, layout);

      const expected =
        !isBottomArea || left + m.SHORTCUT_WIDTH <= reservedLeft;

      assert.equal(available, expected, `Célula ${column}:${row}`);
    }
  }
});

test('grade preserva os 12 acessos sem colisões em 96 combinações de viewport/widget', () => {
  const m = layoutModule();
  for (const width of [60, 180, 360, 720, 1000, 1440]) {
    for (const height of [80, 176, 352, 700]) {
      for (const widget of [
        null,
        clock(),
        clock({ columns: 3, rows: 2 }),
        clock({ columns: 3, rows: 3 }),
      ]) {
        const layout = m.getDesktopLayout(12, width, height, widget);
        assert.equal(layout.shortcuts.length, 12);
        assert.ok(layout.shortcuts.every(Boolean), `${width}x${height}`);
        const cells = layout.shortcuts.map((p) => `${p.left}:${p.top}`);
        assert.equal(new Set(cells).size, 12);
        for (const p of layout.shortcuts) {
          assert.ok(
            m.isDesktopCellAvailable(m.getCellColumn(p.left, layout), m.getCellRow(p.top), layout),
          );
          if (layout.widget)
            assert.ok(
              p.left + m.getWidgetWidth(1, layout) <= layout.widget.left ||
                p.left >= layout.widget.left + m.getWidgetWidth(widget.size.columns, layout) ||
                p.top + 88 <= layout.widget.top ||
                p.top >= layout.widget.top + widget.size.rows * 88,
            );
        }
      }
    }
  }
});

test('posições salvas são consumidas e retornam após resize sem alterar preferências', () => {
  const m = layoutModule();
  const preferred = [{ column: 5, row: 2 }];
  const before = JSON.stringify(preferred);
  const wide = m.getDesktopLayout(12, 1000, 700, clock(), preferred);
  assert.equal(m.getCellColumn(wide.shortcuts[0].left, wide), 5);
  assert.equal(wide.shortcuts[0].top, 176);
  const small = m.getDesktopLayout(12, 180, 176, clock(), preferred);
  assert.equal(small.overflow, true);
  assert.equal(small.widgetBlocked, true);
  const restored = m.getDesktopLayout(12, 1000, 700, clock(), preferred);
  assert.equal(JSON.stringify(restored.shortcuts), JSON.stringify(wide.shortcuts));
  assert.equal(JSON.stringify(preferred), before);
});

test('posições duplicadas, negativas e fora da grade são realocadas deterministicamente', () => {
  const m = layoutModule();
  const positions = [
    { column: 0, row: 0 },
    { column: 0, row: 0 },
    { column: -1, row: 1 },
    { column: 9999, row: 99 },
  ];
  const layout = m.getDesktopLayout(12, 1000, 700, null, positions);
  assert.equal(new Set(layout.shortcuts.map((p) => `${p.left}:${p.top}`)).size, 12);
  assert.equal(
    JSON.stringify(layout),
    JSON.stringify(m.getDesktopLayout(12, 1000, 700, null, positions)),
  );
});

test('movimento de grupo conserva deslocamento relativo e rejeita colisão ou borda', () => {
  const m = layoutModule();
  const layout = m.getDesktopLayout(12, 1000, 700, clock());
  const ids = ['app-0', 'app-1'];
  const moved = m.moveDesktopShortcuts(apps, layout, ids, 'app-0', 3, 0);
  assert.ok(moved);
  assert.equal(moved['app-0'].column, 3);
  assert.equal(moved['app-1'].row - moved['app-0'].row, 1);
  assert.equal(m.moveDesktopShortcuts(apps, layout, ids, 'app-0', -1, 0), null);
  assert.equal(m.moveDesktopShortcuts(apps, layout, ids, 'app-0', 1, 0), null);
  const w = layout.widget;
  assert.equal(
    m.moveDesktopShortcuts(
      apps,
      layout,
      ['app-0'],
      'app-0',
      m.getCellColumn(w.left, layout),
      m.getCellRow(w.top),
    ),
    null,
  );
});

test('seleção por área usa posições reais e ignora atalhos fora do retângulo', () => {
  const m = layoutModule();
  const layout = m.getDesktopLayout(12, 1000, 700, null);
  const selected = m.getShortcutsInArea(apps, layout.shortcuts, {
    left: 0,
    top: 0,
    width: 83,
    height: 175,
  });
  assert.equal(Array.from(selected).join(','), 'app-0,app-1');
});

function preferences(storage) {
  const service = load('src/services/storage/preferencesStorage.js', { localStorage: storage });
  return load('src/shells/desktop/desktopPreferences.js', {
    readPreference: service.readPreference,
    writePreference: service.writePreference,
  });
}

test('preferências R3.3 mantêm chaves, formatos e posições existentes', () => {
  const data = new Map([
    ['ws-os:desktop-shortcut-order', 'name'],
    ['ws-os:desktop-shortcut-positions', JSON.stringify({ projects: { column: 3, row: 2 } })],
    ['ws-os:theme', 'light'],
  ]);
  const m = preferences({
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  });
  const state = m.loadDesktopPreferences();
  assert.equal(state.order, 'name');
  assert.equal(state.positions.projects.column, 3);
  assert.equal(state.error, null);
  assert.equal(m.saveDesktopPreferences(state), true);
  assert.equal(data.get('ws-os:theme'), 'light');
  assert.equal(JSON.parse(data.get('ws-os:desktop-shortcut-positions')).projects.row, 2);
});

test('dados corrompidos ou inválidos não são sobrescritos na leitura', () => {
  for (const raw of ['{inválido', 'null', '[]', '{"projects":{"column":-1,"row":0}}']) {
    let writes = 0;
    const m = preferences({
      getItem: (key) => (key.endsWith('positions') ? raw : 'default'),
      setItem: () => {
        writes += 1;
      },
    });
    const state = m.loadDesktopPreferences();
    assert.equal(state.error, 'invalid');
    assert.equal(writes, 0);
    assert.equal(Object.keys(state.positions).length, 0);
  }
});

test('bloqueio de armazenamento e quota preservam sessão sem lançar exceções', () => {
  const m = preferences({
    getItem() {
      throw Error('SecurityError');
    },
    setItem() {
      throw Error('QuotaExceededError');
    },
  });
  const state = m.loadDesktopPreferences();
  assert.equal(state.order, 'default');
  assert.equal(state.error, 'unavailable');
  assert.equal(m.saveDesktopPreferences({ order: 'name', positions: {} }), false);
});

test('widget só aceita tamanhos discretos e informa preferências inválidas', () => {
  const raw = JSON.stringify({
    widgets: [
      {
        instanceId: 'clock-default',
        widgetId: 'clock',
        visible: true,
        position: null,
        size: { columns: 6, rows: 6 },
      },
    ],
  });
  const m = load('src/core/widgetManager.js', { localStorage: { getItem: () => raw } });
  const loaded = m.loadWidgetPreferences();
  assert.equal(loaded.error, 'invalid');
  assert.equal(loaded.state.widgets[0].size.columns, 2);
  const state = m.setWidgetSize(loaded.state, 'clock-default', { columns: 3, rows: 3 });
  assert.equal(state.widgets[0].size.rows, 3);
  assert.equal(
    m.setWidgetSize(state, 'clock-default', { columns: 4, rows: 4 }).widgets[0].size.columns,
    3,
  );
});

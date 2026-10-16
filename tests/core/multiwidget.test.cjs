const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function load(file, globals = {}) {
  const text = fs.readFileSync(path.join(root, file), 'utf8').replace(/\bexport\s+/g, '');
  const context = vm.createContext(globals);
  vm.runInContext(text, context);
  return context;
}
test('grade virtual mantém atalhos alcançáveis abaixo da reserva física da Taskbar', () => {
  const m = load('src/shells/desktop/desktopLayout.js');
  for (const [width, height] of [
    [60, 80],
    [180, 176],
  ]) {
    const layout = m.getMultiWidgetLayout(12, width, height, []);
    assert.equal(layout.shortcuts.filter(Boolean).length, 12);
    assert.equal(new Set(layout.shortcuts.map((p) => `${p.left}:${p.top}`)).size, 12);
    assert.ok(layout.height > height);
    assert.ok(
      layout.shortcuts.every((p) =>
        m.isDesktopCellAvailable(m.getCellColumn(p.left, layout), m.getCellRow(p.top), layout),
      ),
    );
  }
});
test('multiwidget mantém grade compartilhada sem colisões em resize e sem mutar preferências', () => {
  const m = load('src/shells/desktop/desktopLayout.js');
  const widgets = [
    {
      instanceId: 'clock-default',
      visible: true,
      size: { columns: 3, rows: 3 },
      position: { column: 3, row: 0 },
    },
    {
      instanceId: 'calendar-default',
      visible: true,
      size: { columns: 4, rows: 4 },
      position: { column: 8, row: 0 },
    },
    { instanceId: 'weather-default', visible: true, size: { columns: 3, rows: 2 }, position: null },
    {
      instanceId: 'dev-insights-default',
      visible: true,
      size: { columns: 3, rows: 2 },
      position: null,
    },
  ];
  const before = JSON.stringify(widgets);
  for (const [w, h] of [
    [768, 500],
    [1280, 720],
    [1920, 1080],
    [390, 320],
    [1280, 720],
  ]) {
    const layout = m.getMultiWidgetLayout(12, w, h, widgets),
      occupied = new Set();
    assert.equal(layout.shortcuts.filter(Boolean).length, 12);
    for (const placed of Object.values(layout.widgets))
      for (const cell of m.getWidgetCells(placed.position, placed.size)) {
        const key = `${cell.column}:${cell.row}`;
        assert.ok(!occupied.has(key));
        occupied.add(key);
        assert.ok(m.isDesktopCellAvailable(cell.column, cell.row, layout));
      }
    for (const p of layout.shortcuts) {
      const key = `${m.getCellColumn(p.left, layout)}:${m.getCellRow(p.top)}`;
      assert.ok(!occupied.has(key));
      occupied.add(key);
    }
  }
  assert.equal(JSON.stringify(widgets), before);
});
test('relógio legado 3x3 e novos widgets coexistem sem sobrescrever dados armazenados', () => {
  const raw = JSON.stringify({
    widgets: [
      {
        instanceId: 'clock-default',
        widgetId: 'clock',
        visible: false,
        position: { column: 5, row: 2 },
        size: { columns: 3, rows: 3 },
        settings: { timeZone: 'UTC' },
      },
    ],
  });
  let writes = 0;
  const m = load('src/core/widgetManager.js', {
    localStorage: { getItem: () => raw, setItem: () => writes++ },
  });
  const result = m.loadWidgetPreferences(),
    clock = result.state.widgets[0];
  assert.equal(clock.size.rows, 3);
  assert.equal(clock.position.column, 5);
  assert.equal(clock.settings.timeZone, 'UTC');
  assert.equal(clock.visible, false);
  assert.equal(result.state.widgets.length, 4);
  assert.equal(writes, 0);
});

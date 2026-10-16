const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/shared/i18n/locales/en.json'), 'utf8'));
test('interfaces possuem tradução para chamadas literais de texto', () => {
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(jsx|js)$/.test(file))
        for (const match of fs
          .readFileSync(file, 'utf8')
          .matchAll(/\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*?)\1\s*[,)]/gs)) {
          assert.ok(Object.hasOwn(en, match[2]), path.relative(root, file) + ': ' + match[2]);
        }
    }
  }
  walk(path.join(root, 'src'));
});
test('nomes e descrições do catálogo de widgets são traduzíveis', () => {
  const source = fs
    .readFileSync(path.join(root, 'src/core/widgetManager.js'), 'utf8')
    .replace(/\bexport\s+/g, '');
  const widgets = vm.runInNewContext(`(()=>{${source};return getRegisteredWidgets()})()`);
  for (const widget of widgets)
    for (const value of [widget.name, widget.description])
      assert.ok(Object.hasOwn(en, value), value);
});

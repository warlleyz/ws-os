const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* === AMBIENTE ISOLADO === */
/* ----- Contratos reais sem DOM ou armazenamento do usuário ----- */
function load(file, bindings, names) {
  const source = fs
    .readFileSync(path.join(__dirname, '../..', file), 'utf8')
    .replace(/^import[^;]+;\s*/gm, '')
    .replace(/^export \{[^;]+;\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');
  return vm.runInNewContext(`(() => { ${source}; return {${names.join(',')}}; })()`, bindings);
}
function contract(bindings = {}) {
  return load('src/core/appearanceContract.js', bindings, [
    'normalizeAppearance',
    'DEFAULT_APPEARANCE',
    'APPEARANCE_OPTIONS',
    'accentFromPixels',
    'extractWallpaperAccent',
  ]);
}
function manager(initial = null, extract = async () => 'green') {
  const data = new Map(initial ? [['ws-os:appearance', JSON.stringify(initial)]] : []);
  let external;
  const document = { documentElement: { dataset: {} } };
  const m = load(
    'src/core/appearanceManager.js',
    {
      ...contract(),
      extractWallpaperAccent: extract,
      document,
      localStorage: {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
      },
      window: {
        addEventListener: (_event, fn) => {
          external = fn;
        },
      },
    },
    ['getAppearance', 'setAppearance', 'resetAppearance', 'updateAppearanceContext'],
  );
  return { ...m, data, document, external: (event) => external(event) };
}

/* === MIGRAÇÃO E INDEPENDÊNCIA === */
/* ----- Manual por tema, automático por imagem ----- */
test('cor legada é migrada para manual nos dois temas sem regravar', () => {
  const m = manager({ accent: 'green' });
  const before = m.data.get('ws-os:appearance');
  for (const theme of ['dark', 'light']) {
    m.updateAppearanceContext(theme, { id: theme + '-violeta' });
    assert.equal(m.getAppearance().accentMode, 'manual');
    assert.equal(m.getAppearance().accent, 'green');
  }
  assert.equal(m.data.get('ws-os:appearance'), before);
});
test('manual persiste por tema e plataforma sem ser substituído pelo wallpaper', () => {
  const m = manager();
  m.updateAppearanceContext('dark', { id: 'dark-green' });
  assert.equal(m.getAppearance().accent, 'green');
  m.setAppearance({ accent: 'violet' });
  m.updateAppearanceContext('light', { id: 'light-blue' });
  assert.equal(m.getAppearance().accentMode, 'auto');
  m.setAppearance({ accent: 'green' });
  m.updateAppearanceContext('dark', { id: 'dark-blue' });
  assert.equal(m.getAppearance().accent, 'violet');
  m.setAppearance({ accentMode: 'auto' });
  assert.equal(m.getAppearance().accent, 'blue');
  m.setAppearance({ accentMode: 'manual' });
  assert.equal(m.getAppearance().accent, 'violet');
  const restored = manager(JSON.parse(m.data.get('ws-os:appearance')));
  restored.updateAppearanceContext('light', { id: 'light-violeta' });
  assert.equal(restored.getAppearance().accent, 'green');
  restored.resetAppearance();
  assert.equal(restored.getAppearance().accentMode, 'auto');
  restored.updateAppearanceContext('dark', { id: 'dark-blue' });
  assert.equal(restored.getAppearance().accentMode, 'auto');
});
test('sincronização externa não regrava nem perde o contexto automático', () => {
  const m = manager();
  m.updateAppearanceContext('light', { id: 'light-green' });
  m.data.set('ws-os:appearance', JSON.stringify({ accent: 'violet' }));
  m.external({ key: 'ws-os:appearance' });
  assert.equal(m.getAppearance().accent, 'violet');
  m.data.delete('ws-os:appearance');
  m.external({ key: null });
  assert.equal(m.getAppearance().accent, 'green');
  assert.equal(m.data.has('ws-os:appearance'), false);
});

/* === EXTRAÇÃO LOCAL === */
/* ----- Corridas, fallback e amostragem limitada ----- */
test('extração antiga não substitui contexto novo nem preferência manual', async () => {
  let complete;
  const m = manager(
    null,
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  m.updateAppearanceContext('dark', { id: 'personal:one', imageUrl: 'blob:one' });
  m.updateAppearanceContext('light', { id: 'light-violeta' });
  complete('green');
  await new Promise(setImmediate);
  assert.equal(m.getAppearance().accent, 'violet');
  m.updateAppearanceContext('dark', { id: 'personal:two', imageUrl: 'blob:two' });
  m.setAppearance({ accent: 'blue' });
  complete('green');
  await new Promise(setImmediate);
  assert.equal(m.getAppearance().accent, 'blue');
});
test('falha da extração conserva paleta segura e sessão funcional', async () => {
  const m = manager(null, async () => {
    throw Error('decode');
  });
  m.updateAppearanceContext('dark', { id: 'personal:broken', imageUrl: 'blob:broken' });
  await new Promise(setImmediate);
  assert.equal(m.getAppearance().accent, 'blue');
  assert.equal(m.document.documentElement.dataset.accent, 'blue');
});
test('amostragem ignora transparência e tons neutros e escolhe paleta dominante', () => {
  const c = contract();
  assert.equal(c.accentFromPixels([0, 255, 0, 255]), 'green');
  assert.equal(c.accentFromPixels([100, 0, 255, 255]), 'violet');
  assert.equal(c.accentFromPixels([0, 80, 255, 255]), 'blue');
  assert.equal(c.accentFromPixels([0, 255, 0, 0, 255, 255, 255, 255]), 'blue');
});
test('imagem pessoal usa canvas 32x32 e nenhuma URL remota é carregada', async () => {
  const draws = [];
  let decoded = 0;
  const canvas = {
    getContext: () => ({
      drawImage: (...args) => draws.push(args),
      getImageData: () => ({ data: [0, 255, 0, 255] }),
    }),
  };
  const c = contract({
    Image: class {
      async decode() {
        decoded += 1;
      }
    },
    document: { createElement: () => canvas },
  });
  assert.equal(await c.extractWallpaperAccent('https://example.com/image.png'), 'blue');
  assert.equal(decoded, 0);
  assert.equal(await c.extractWallpaperAccent('blob:local'), 'green');
  assert.equal(decoded, 1);
  assert.equal(canvas.width, 32);
  assert.equal(canvas.height, 32);
  assert.deepEqual(draws[0].slice(1), [0, 0, 32, 32]);
});

/* === CURSORES OFICIAIS === */
/* ----- Recursos reais, hotspots e fallback em todos os temas ----- */
test('treze variantes possuem SVG válido por tema e fallback nativo', () => {
  const c = load('src/core/cursorCatalog.js', {}, [
    'CURSOR_VARIANTS',
    'getCursorDefinition',
    'getCursorAssetPath',
    'getCursorCssValue',
  ]);
  assert.equal(c.CURSOR_VARIANTS.length, 13);
  for (const theme of ['dark', 'light'])
    for (const variant of c.CURSOR_VARIANTS) {
      const definition = c.getCursorDefinition(variant);
      const asset = fs.readFileSync(
        path.join(__dirname, '../../public', c.getCursorAssetPath(variant, theme)),
        'utf8',
      );
      assert.match(asset, /<svg/);
      assert.ok(definition.hotspot.every((value) => value >= 0 && value < 32));
      assert.equal(c.getCursorCssValue(variant, theme, 'native'), definition.fallback);
      assert.ok(
        c
          .getCursorCssValue(variant, theme, 'custom', '/portfolio/')
          .startsWith('url("/portfolio/assets/cursors/'),
      );
      assert.ok(c.getCursorCssValue(variant, theme, 'custom').endsWith(', ' + definition.fallback));
    }
  assert.equal(c.getCursorCssValue('invalid', 'dark'), 'auto');
});

/* === VISIBILIDADE INDEPENDENTE === */
/* ----- Ocultar não redefine o contexto nem o destaque ----- */
test('ocultar imagem persiste independentemente de efeitos e retorna no reset', () => {
  const m = manager();
  m.updateAppearanceContext('dark', { id: 'dark-green' });
  m.setAppearance({ hideWallpaper: true, motion: 'subtle' });
  assert.equal(m.document.documentElement.dataset.wallpaperHidden, 'true');
  assert.equal(m.getAppearance().accent, 'green');
  const saved = JSON.parse(m.data.get('ws-os:appearance'));
  assert.equal(saved.hideWallpaper, true);
  assert.equal(saved.motion, 'subtle');
  m.resetAppearance();
  assert.equal(m.document.documentElement.dataset.wallpaperHidden, 'false');
});

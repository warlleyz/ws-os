const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');
const root = path.resolve(__dirname, '../..');

/* === CORE REAL COM ARMAZENAMENTO ISOLADO === */
function environment(initial = {}) {
  const data = new Map(Object.entries(initial)), events = [];
  let blocked = false;
  const localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { if (blocked) throw Error('quota'); data.set(key, String(value)); },
    removeItem: (key) => data.delete(key),
  };
  const bindings = {
    localStorage,
    document: { documentElement: { dataset: {}, style: {} } },
    window: { addEventListener: (name, callback) => events.push([name, callback]) },
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    portuguese: JSON.parse(fs.readFileSync(path.join(root, 'src/shared/i18n/locales/pt-BR.json'), 'utf8')),
    english: JSON.parse(fs.readFileSync(path.join(root, 'src/shared/i18n/locales/en.json'), 'utf8')),
  };
  const load = (file) => loadContract(path.join(root, file), bindings, {
    transformSource: (source) => source
      .replace(/import\s*{[^}]+}\s*from\s*['"]react['"];?/g, '')
      .replace(/import\s+(?:portuguese|english)\s+from[^;]+;/g, '')
      .replace(/export\s*{[^}]+}\s*from[^;]+;/g, ''),
  });
  return { data, load, block: (value) => { blocked = value; },
    external: (key, value) => { data.set(key, value); events.filter(([name]) => name === 'storage').forEach(([, callback]) => callback({ key, newValue: value })); } };
}

/* === CONTRATOS E FORMATOS LEGADOS === */
test('contrato reconhece aparência atual, widgets Mobile e quatro wallpapers sem regravar', () => {
  const env = environment();
  const api = env.load('src/core/preferenceContract.js');
  const appearance = { hideWallpaper: true, accent: 'green', accentMode: 'manual', motion: 'subtle',
    transparency: 'solid', blur: 'soft', accents: { dark: { mode: 'manual', manual: 'green' }, light: { mode: 'auto', manual: 'blue' } } };
  for (const [key, value] of [
    ['ws-os:appearance', appearance],
    ['ws-os:mobile-preferences', { gridDensity: 'comfortable', widgetIds: ['clock', 'weather'] }],
    ['ws-os:mobile-preferences', { gridDensity: 'default' }],
    ['ws-os:wallpaper-fit', { desktop: { dark: 'cover', light: 'contain' }, mobile: { dark: 'center', light: 'cover' } }],
  ]) {
    const result = api.adaptStoredPreference(key, JSON.stringify(value));
    assert.equal(result.ok, true, key);
    assert.equal(result.requiresWrite, false);
    assert.equal(api.encodeStoredPreference(result.record).key, key);
  }
  for (const shell of ['desktop', 'mobile']) for (const theme of ['dark', 'light']) {
    const key = `ws-os:wallpaper:${shell}:${theme}`;
    assert.equal(api.adaptStoredPreference(key, `${theme}-blue`).ok, true);
    assert.equal(api.adaptStoredPreference(key, 'personal:test-image').ok, true);
    assert.equal(api.adaptStoredPreference(key, `${theme === 'dark' ? 'light' : 'dark'}-blue`).ok, false);
  }
  assert.equal(api.createPreferenceRecord('ws-os:mobile-preferences', { gridDensity: 'default', widgetIds: ['clock', 'clock'] }).ok, false);
  assert.equal(api.createPreferenceRecord('ws-os:notification-preferences', { unknown: true }).ok, false);
  assert.equal(api.createPreferenceRecord('ws-os:appearance', { accents: { dark: { mode: 'admin', manual: 'blue' } } }).ok, false);
  assert.equal(env.data.size, 0);
});

/* === RESTAURAÇÃO SELETIVA E DADOS PESSOAIS === */
test('restaurar apenas idioma preserva aparência, identidade, recordes e documentos', () => {
  const initial = { 'ws-os:locale': 'en', 'ws-os:theme': 'light', 'ws-os:visitor-id': 'private-id',
    'ws-os:game-records': '{"snake":9}', 'ws-os:personal-test-document': 'private text',
    'ws-os:desktop-shortcut-positions': '{"games":{"row":2,"column":3}}' };
  const env = environment(initial), api = env.load('src/core/preferencesManager.js');
  assert.equal(api.restoreSystemPreferences(['language']).ok, true);
  for (const [key, value] of Object.entries(initial)) assert.equal(env.data.get(key), key === 'ws-os:locale' ? 'pt-BR' : value);
  const before = JSON.stringify([...env.data]);
  assert.equal(api.restoreSystemPreferences(['personal-files']).ok, false);
  assert.equal(JSON.stringify([...env.data]), before);
});

test('restaurar wallpapers do Desktop preserva Mobile e toda a coleção pessoal', () => {
  const env = environment({ 'ws-os:wallpaper:desktop:dark': 'personal:old',
    'ws-os:wallpaper:mobile:dark': 'dark-green', 'ws-os:wallpaper:mobile:light': 'light-green',
    'ws-os:wallpaper-fit': JSON.stringify({ desktop: { dark: 'contain', light: 'center' }, mobile: { dark: 'center', light: 'contain' } }) });
  const api = env.load('src/core/preferencesManager.js');
  assert.equal(api.restoreSystemPreferences(['desktop']).ok, true);
  assert.equal(env.data.get('ws-os:wallpaper:desktop:dark'), 'dark-blue');
  assert.equal(env.data.get('ws-os:wallpaper:desktop:light'), 'light-blue');
  assert.equal(env.data.get('ws-os:wallpaper:mobile:dark'), 'dark-green');
  assert.deepEqual(JSON.parse(env.data.get('ws-os:wallpaper-fit')).mobile, { dark: 'center', light: 'contain' });
});

test('restauração bloqueada informa falha e não apaga nem regrava dados dos aplicativos', () => {
  const env = environment({ 'ws-os:game-records': '{"snake":12}', 'ws-os:locale': 'en' });
  const api = env.load('src/core/preferencesManager.js');
  env.block(true);
  const result = api.restoreSystemPreferences(['language', 'appearance']);
  assert.equal(result.ok, false);
  assert.ok(result.failed.includes('locale'));
  assert.ok(result.failed.includes('appearance'));
  assert.equal(env.data.get('ws-os:game-records'), '{"snake":12}');
  assert.equal(env.data.get('ws-os:locale'), 'en');
});

/* === WIDGETS: RECARREGAMENTO E POSIÇÕES === */
test('restaurar widgets preserva instâncias adicionais e posições após recarregar', () => {
  const widgets = [{ instanceId: 'clock-extra', widgetId: 'clock', visible: true,
    size: { columns: 3, rows: 3 }, position: { column: 4, row: 2 }, settings: { timeZone: 'UTC' } }];
  const env = environment({ 'ws-os:desktop-widgets': JSON.stringify({ widgets }) });
  const api = env.load('src/core/widgetPreferences.js');
  assert.equal(api.getWidgetPreferences().widgets.find((widget) => widget.instanceId === 'clock-extra').settings.timeZone, 'UTC');
  assert.equal(api.resetWidgetPreferences(), true);
  const reloaded = env.load('src/core/widgetManager.js').loadWidgetPreferences();
  const extra = reloaded.state.widgets.find((widget) => widget.instanceId === 'clock-extra');
  assert.ok(extra);
  assert.equal(extra.visible, false);
  assert.deepEqual(JSON.parse(JSON.stringify(extra.position)), { column: 4, row: 2 });
  assert.equal(extra.size.columns, 2);
  assert.equal(Object.keys(extra.settings).length, 0);
});

/* === SINCRONIZAÇÃO MOBILE === */
test('preferências Mobile recuperam legado, sincronizam e preservam sessão com quota bloqueada', () => {
  const env = environment({ 'ws-os:mobile-preferences': '{"gridDensity":"comfortable"}' });
  const api = env.load('src/core/mobilePreferences.js');
  assert.equal(api.getMobilePreferences().widgetIds.length, 0);
  env.external('ws-os:mobile-preferences', '{"gridDensity":"default","widgetIds":["clock","weather","invalid"]}');
  assert.equal(api.getMobilePreferences().gridDensity, 'default');
  assert.deepEqual(Array.from(api.getMobilePreferences().widgetIds), ['clock', 'weather']);
  env.block(true);
  assert.equal(api.setMobilePreferences({ gridDensity: 'comfortable' }), false);
  assert.equal(api.getMobilePreferences().gridDensity, 'comfortable');
  assert.deepEqual(Array.from(api.getMobilePreferences().widgetIds), ['clock', 'weather']);
});

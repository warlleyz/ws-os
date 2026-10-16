const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
function load(file, bindings, names) {
  const source = read(file)
    .replace(/^import[^;]+;\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');
  return vm.runInNewContext(`(() => { ${source}\nreturn {${names.join(',')}}; })()`, {
    Uint8Array,
    Blob,
    setTimeout,
    clearTimeout,
    ...bindings,
  });
}
const memory = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
};
const png = () =>
  new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], { type: 'image/png' });
async function wallpaper(options = {}) {
  const storage = options.localStorage ?? memory();
  const image = { file: options.file ?? null };
  const revoked = [];
  let urls = 0;
  const m = load(
    'src/core/wallpaperManager.js',
    {
      localStorage: storage,
      URL: {
        createObjectURL: () => 'blob:test-' + ++urls,
        revokeObjectURL: (url) => revoked.push(url),
      },
      createImageBitmap: async () => ({ width: 8, height: 8, close() {} }),
      readWallpaperImage: async () => image.file,
      writeWallpaperImage: async (file) => {
        image.file = file;
      },
      ...options.bindings,
    },
    [
      'getWallpaper',
      'setWallpaper',
      'getWallpaperDefinition',
      'uploadCustomWallpaper',
      'restoreCustomWallpaper',
      'getWallpaperStatus',
      'getCustomWallpaperAvailable',
      'validateWallpaper',
    ],
  );
  await m.restoreCustomWallpaper();
  return { m, image, storage, revoked };
}
test('wallpapers preservam chave legada e separam seleções Desktop/Mobile', async () => {
  const { m, storage } = await wallpaper({ localStorage: memory({ 'ws-os:wallpaper': 'aurora' }) });
  assert.equal(m.getWallpaper(), 'aurora');
  assert.equal(m.getWallpaper('mobile'), 'original');
  assert.equal(m.setWallpaper('minimal', 'mobile'), true);
  assert.equal(m.getWallpaper(), 'aurora');
  assert.equal(storage.data.get('ws-os:mobile-wallpaper'), 'minimal');
  assert.notEqual(
    m.getWallpaperDefinition('aurora').background,
    m.getWallpaperDefinition('aurora', 'mobile').background,
  );
  assert.equal(m.setWallpaper('invalid'), false);
  assert.equal(m.setWallpaper('custom'), false);
});
test('upload permite reseleção e substituição sem perder a imagem no reset visual', async () => {
  const { m, image, revoked } = await wallpaper();
  const file = png();
  assert.equal(await m.uploadCustomWallpaper(file), true);
  assert.equal(image.file, file);
  const first = m.getWallpaperDefinition('custom').background;
  m.setWallpaper('original');
  assert.equal(m.getCustomWallpaperAvailable(), true);
  assert.equal(m.setWallpaper('custom'), true);
  await m.uploadCustomWallpaper(png(), 'mobile');
  assert.equal(m.getWallpaper(), 'custom');
  assert.equal(m.getWallpaper('mobile'), 'custom');
  assert.notEqual(m.getWallpaperDefinition('custom').background, first);
  assert.deepEqual(revoked, ['blob:test-1']);
});
test('imagem persistida é recuperada; falha de leitura não apaga seleção ou dados', async () => {
  const localStorage = memory({ 'ws-os:wallpaper': 'custom', 'app:document': 'preserve' });
  const { m } = await wallpaper({ localStorage, file: png() });
  assert.equal(m.getCustomWallpaperAvailable(), true);
  const { m: broken } = await wallpaper({
    localStorage,
    bindings: {
      readWallpaperImage: async () => {
        throw Error('blocked');
      },
    },
  });
  assert.equal(broken.getWallpaperStatus(), 'error');
  assert.equal(broken.getWallpaper(), 'custom');
  assert.equal(localStorage.data.get('app:document'), 'preserve');
  assert.equal(localStorage.data.get('ws-os:wallpaper'), 'custom');
});
test('validação rejeita MIME, assinatura falsa, imagem vazia, cota e dimensões excessivas', async () => {
  const { m } = await wallpaper();
  await assert.rejects(
    m.validateWallpaper(new Blob(['svg'], { type: 'image/svg+xml' })),
    /Formato/,
  );
  await assert.rejects(m.validateWallpaper(new Blob(['fake'], { type: 'image/png' })), /conteúdo/);
  await assert.rejects(m.validateWallpaper(new Blob([], { type: 'image/png' })), /5 MB/);
  await assert.rejects(
    m.validateWallpaper(new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' })),
    /5 MB/,
  );
  let closed = false;
  const { m: large } = await wallpaper({
    bindings: {
      createImageBitmap: async () => ({
        width: 10000,
        height: 2,
        close() {
          closed = true;
        },
      }),
    },
  });
  await assert.rejects(large.validateWallpaper(png()), /8192/);
  assert.equal(closed, true);
});
test('falha de gravação IndexedDB preserva imagem anterior e seleção', async () => {
  const { m } = await wallpaper({
    file: png(),
    localStorage: memory({ 'ws-os:wallpaper': 'custom' }),
    bindings: {
      writeWallpaperImage: async () => {
        const e = Error('quota');
        e.name = 'QuotaExceededError';
        throw e;
      },
    },
  });
  const before = m.getWallpaperDefinition('custom').background;
  await assert.rejects(m.uploadCustomWallpaper(png()), /Sem espaço/);
  assert.equal(m.getWallpaperDefinition('custom').background, before);
  assert.equal(m.getWallpaper(), 'custom');
});
test('falha no localStorage mantém imagem salva e seleção na sessão', async () => {
  const { m, image } = await wallpaper({
    localStorage: {
      getItem: () => null,
      setItem() {
        throw Error('blocked');
      },
    },
  });
  assert.equal(await m.uploadCustomWallpaper(png(), 'mobile'), false);
  assert.ok(image.file);
  assert.equal(m.getWallpaper('mobile'), 'custom');
});
test('hidratação atrasada não substitui imagem nova; uploads concorrentes são rejeitados', async () => {
  let resolveRead, resolveWrite;
  const m = load(
    'src/core/wallpaperManager.js',
    {
      localStorage: memory(),
      URL: { createObjectURL: () => 'blob:new', revokeObjectURL() {} },
      createImageBitmap: async () => ({ width: 1, height: 1, close() {} }),
      readWallpaperImage: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
      writeWallpaperImage: () =>
        new Promise((resolve) => {
          resolveWrite = resolve;
        }),
    },
    ['uploadCustomWallpaper', 'restoreCustomWallpaper', 'getWallpaperDefinition'],
  );
  const pending = m.uploadCustomWallpaper(png());
  await assert.rejects(m.uploadCustomWallpaper(png()), /Aguarde/);
  while (!resolveWrite) await new Promise((resolve) => setImmediate(resolve));
  resolveWrite();
  await pending;
  resolveRead(null);
  await m.restoreCustomWallpaper();
  assert.equal(
    m.getWallpaperDefinition('custom').background,
    'url("blob:new") center / cover no-repeat',
  );
});
test('widgets centralizados conservam posição e bloqueiam capacidade sem alterar estado', () => {
  const initialWidgetState = {
    widgets: [
      {
        instanceId: 'clock-default',
        widgetId: 'clock',
        visible: true,
        position: { column: 4, row: 1 },
        size: { columns: 2, rows: 2 },
      },
    ],
  };
  let saved;
  const m = load(
    'src/core/widgetPreferences.js',
    {
      initialWidgetState,
      getWidgetDefinition: () => ({ allowedSizes: ['2x2', '3x2', '3x3'] }),
      loadWidgetPreferences: () => ({ state: initialWidgetState, error: null }),
      saveWidgetState: (state) => {
        saved = state;
        return true;
      },
    },
    [
      'getWidgetPreferences',
      'configureWidget',
      'registerWidgetValidator',
      'resetWidgetPreferences',
    ],
  );
  const unregister = m.registerWidgetValidator((widget) => widget.size.columns < 3);
  assert.equal(
    m.configureWidget('clock-default', { size: { columns: 3, rows: 3 } }).reason,
    'capacity',
  );
  assert.equal(saved, undefined);
  assert.equal(m.configureWidget('clock-default', { visible: false }).ok, true);
  assert.equal(m.configureWidget('clock-default', { size: { columns: 3, rows: 3 } }).ok, true);
  assert.equal(m.configureWidget('clock-default', { visible: true }).ok, false);
  assert.equal(
    m.configureWidget('clock-default', { size: { columns: 9, rows: 9 } }).reason,
    'invalid',
  );
  assert.equal(m.configureWidget('clock-default', { size: null }).reason, 'invalid');
  assert.equal(
    m.configureWidget('clock-default', { size: { columns: '2', rows: 2 } }).reason,
    'invalid',
  );
  assert.equal(m.configureWidget('clock-default', null).reason, 'invalid');
  unregister();
  m.resetWidgetPreferences();
  assert.deepEqual(
    m.getWidgetPreferences().widgets[0].position,
    initialWidgetState.widgets[0].position,
  );
});
test('restauração usa allowlist, tenta todas as preferências e relata falha parcial', () => {
  const calls = [];
  const spy =
    (name, ok = true) =>
    (...args) => {
      calls.push([name, args]);
      return ok;
    };
  const m = load(
    'src/core/preferencesManager.js',
    {
      setTheme: spy('theme'),
      setLocale: spy('locale', false),
      resetAppearance: spy('appearance'),
      setAccessibility: spy('accessibility'),
      setTaskbarAutoHide: spy('taskbar'),
      resetMobilePreferences: spy('mobile'),
      setWallpaper: spy('wallpaper'),
      resetWidgetPreferences: spy('widgets'),
    },
    ['restoreSystemPreferences'],
  );
  const result = m.restoreSystemPreferences();
  assert.equal(result.ok, false);
  assert.deepEqual(Array.from(result.failed), ['locale']);
  assert.equal(calls.length, 9);
  assert.deepEqual(
    calls.filter(([name]) => name === 'wallpaper').map(([, args]) => Array.from(args)),
    [
      ['original', 'desktop'],
      ['original', 'mobile'],
    ],
  );
});
test('aparência normaliza valores antigos, aplica intensidade e preserva sessão com armazenamento bloqueado', () => {
  const document = { documentElement: { dataset: {} } };
  const m = load(
    'src/core/appearanceManager.js',
    {
      document,
      localStorage: {
        getItem: () => '{"accent":"green","blur":"oops"}',
        setItem() {
          throw Error('quota');
        },
      },
    },
    ['getAppearance', 'setAppearance'],
  );
  assert.equal(m.getAppearance().motion, 'normal');
  assert.equal(m.getAppearance().blur, 'normal');
  assert.equal(m.setAppearance({ motion: 'subtle' }), false);
  assert.equal(m.getAppearance().accent, 'green');
  assert.equal(document.documentElement.dataset.motionIntensity, 'subtle');
});
test('mudança externa de idioma e auto-ocultação atualiza a sessão sem regravar', () => {
  for (const [file, names, key, next] of [
    ['src/shared/i18n/i18n.js', ['getLocale'], 'ws-os:locale', 'en'],
    ['src/core/taskbarPreferences.js', ['getTaskbarAutoHide'], 'ws-os:taskbar-auto-hide', 'true'],
  ]) {
    let callback;
    const localStorage = memory();
    let writes = 0;
    const setItem = localStorage.setItem;
    localStorage.setItem = (...args) => {
      writes++;
      setItem(...args);
    };
    const m = load(
      file,
      {
        english: JSON.parse(read('src/shared/i18n/locales/en.json')),
        localStorage,
        document: { documentElement: {} },
        window: {
          addEventListener: (_type, fn) => {
            callback = fn;
          },
        },
      },
      names,
    );
    setItem(key, next);
    callback({ key });
    assert.equal(m[names[0]](), next === 'true' ? true : next);
    assert.equal(writes, 0);
  }
});

test('IndexedDB indisponível ou bloqueado rejeita sem deixar conexão aberta', async () => {
  const unavailable = load('src/services/storage/wallpaperStorage.js', {}, ['readWallpaperImage']);
  await assert.rejects(unavailable.readWallpaperImage(), /storage/);
  let request,
    closed = false;
  const blocked = load(
    'src/services/storage/wallpaperStorage.js',
    {
      indexedDB: {
        open() {
          request = {};
          setImmediate(() => {
            request.onblocked();
            request.result = {
              close() {
                closed = true;
              },
            };
            request.onsuccess();
          });
          return request;
        },
      },
    },
    ['readWallpaperImage'],
  );
  await assert.rejects(blocked.readWallpaperImage(), /storage/);
  assert.equal(closed, true);
});
test('mensagens e opções apresentadas por Configurações possuem tradução', () => {
  const english = JSON.parse(read('src/shared/i18n/locales/en.json'));
  for (const file of [
    'src/apps/settings/Settings.jsx',
    'src/apps/settings/SettingsNavigation.jsx',
    'src/apps/settings/SettingsSections.jsx',
    'src/core/wallpaperManager.js',
  ]) {
    for (const match of read(file).matchAll(/'([^'\n]+)'/g)) {
      const text = match[1];
      if (['Escape', 'RIFF', 'WEBP', 'QuotaExceededError'].includes(text)) continue;
      // Identificadores IANA são valores internos, não textos de interface.
      if (
        /^(?:Africa|America|Antarctica|Arctic|Asia|Atlantic|Australia|Europe|Indian|Pacific|Etc)\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(
          text,
        )
      ) {
        assert.doesNotThrow(() => new Intl.DateTimeFormat('en', { timeZone: text }));
        continue;
      }
      if (!/^[A-ZÁÉÍÓÚÇ][\p{L}\p{N} .,;:…?!×/()+—–-]*$/u.test(text)) continue;
      assert.ok(Object.hasOwn(english, text), file + ': ' + text);
    }
  }
});
test('contrastes dos três destaques em vidro claro/escuro e ação com texto branco', () => {
  const colors = {
    blue: ['#65cde1', '#0b657b', '#1d5c96'],
    violet: ['#c3abff', '#6439a9', '#6439a9'],
    green: ['#7de1c4', '#08634f', '#08634f'],
  };
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const luminance = (value) =>
    value
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const darkGlass = [24, 34, 48].map((v) => v * 0.88 + 255 * 0.12),
    lightGlass = [255, 255, 255].map((v) => v * 0.88);
  for (const [name, [dark, light, action]] of Object.entries(colors)) {
    assert.ok(contrast(rgb(dark), darkGlass) >= 4.5, name + ' dark');
    assert.ok(contrast(rgb(light), lightGlass) >= 4.5, name + ' light');
    assert.ok(contrast(rgb(action), [255, 255, 255]) >= 4.5, name + ' action');
  }
});

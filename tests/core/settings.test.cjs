
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* === Arquivos do projeto === */
/* ----- Diretório principal ----- */
const root = path.resolve(__dirname, '../..');

const read = (file) =>
  fs.readFileSync(path.join(root, file), 'utf8');

/* === Carregamento isolado === */
/* ----- Avaliação de módulos ----- */
function load(file, bindings = {}, names = []) {
  if (file === 'src/core/preferencesManager.js') {
    bindings = {
      ...require('../helpers/contract-loader.cjs').loadContract(
        path.join(root, 'src/core/preferenceContract.js'),
      ),
      ...bindings,
    };
  }

  const source = read(file)
    .replace(/^import[^;]+;\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');

  return vm.runInNewContext(
    `(() => { ${source}\nreturn {${names.join(',')}}; })()`,
    {
      Uint8Array,
      Blob,
      setTimeout,
      clearTimeout,
      ...bindings,
    },
  );
}

/* === Armazenamento simulado === */
/* ----- Implementação do localStorage ----- */
function memory(initial = {}) {
  const data = new Map(Object.entries(initial));

  return {
    data,

    getItem(key) {
      return data.get(key) ?? null;
    },

    setItem(key, value) {
      data.set(key, String(value));
    },

    removeItem(key) {
      data.delete(key);
    },
  };
}

/* === Catálogo de wallpapers === */
/* ----- Contratos oficiais ----- */
function wallpaperContracts() {
  const catalog = load(
    'src/core/wallpaperCatalog.js',
    {},
    [
      'WALLPAPER_THEMES',
      'OFFICIAL_WALLPAPERS',
      'DEFAULT_WALLPAPERS',
      'getOfficialWallpaper',
      'getOfficialWallpapersByTheme',
      'getDefaultWallpaper',
      'isOfficialWallpaper',
    ],
  );

  const selection = load(
    'src/core/wallpaperSelectionContract.js',
    catalog,
    [
      'WALLPAPER_SHELLS',
      'WALLPAPER_SELECTION_KEYS',
      'LEGACY_WALLPAPER_KEYS',
      'isWallpaperContext',
      'normalizeWallpaperSelection',
      'resolveWallpaperSelection',
      'createDefaultWallpaperSelections',
      'updateWallpaperSelection',
    ],
  );

  return {
    ...catalog,
    ...selection,
  };
}

/* === Arquivos de imagem simulados === */
/* ----- PNG mínimo para os testes ----- */
function png() {
  return new Blob(
    [
      new Uint8Array([
        137, 80, 78, 71,
        13, 10, 26, 10,
        0, 0, 0, 0,
      ]),
    ],
    { type: 'image/png' },
  );
}

/* === Ambiente de wallpapers === */
/* ----- Gerenciador isolado ----- */
async function wallpaper(options = {}) {
  const storage = options.localStorage ?? memory();
  const image = { file: options.file ?? null };
  const revoked = [];

  let urls = 0;

  const theme = options.theme ?? 'dark';
  const contracts = wallpaperContracts();

  const manager = load(
    'src/core/wallpaperManager.js',
    {
      ...contracts,

      localStorage: storage,

      getTheme: () => theme,
      useTheme: () => theme,

      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),

      URL: {
        createObjectURL: () => `blob:test-${++urls}`,
        revokeObjectURL: (url) => revoked.push(url),
      },

      createImageBitmap: async () => ({
        width: 8,
        height: 8,
        close() { },
      }),

      readWallpaperImage: async () => image.file,

      writeWallpaperImage: async (file) => {
        image.file = file;
      },

      ...options.bindings,
    },
    [
      'WALLPAPERS',
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

  await manager.restoreCustomWallpaper();

  return {
    m: manager,
    image,
    storage,
    revoked,
    contracts,
  };
}

/* === Catálogo oficial === */
/* ----- Distribuição por tema ----- */
test('catálogo contém apenas seis wallpapers oficiais', () => {
  const catalog = wallpaperContracts();

  assert.equal(catalog.OFFICIAL_WALLPAPERS.length, 6);

  assert.deepEqual(
    Array.from(
      catalog.getOfficialWallpapersByTheme('dark'),
      (item) => item.id,
    ),
    ['dark-blue', 'dark-green', 'dark-violeta'],
  );

  assert.deepEqual(
    Array.from(
      catalog.getOfficialWallpapersByTheme('light'),
      (item) => item.id,
    ),
    ['light-blue', 'light-green', 'light-violeta'],
  );

  assert.equal(catalog.getDefaultWallpaper('dark'), 'dark-blue');
  assert.equal(catalog.getDefaultWallpaper('light'), 'light-blue');

  assert.equal(catalog.isOfficialWallpaper('original'), false);
  assert.equal(catalog.isOfficialWallpaper('aurora'), false);
  assert.equal(catalog.isOfficialWallpaper('minimal'), false);

  assert.equal(catalog.isOfficialWallpaper('dark-blue', 'light'), false);
  assert.equal(catalog.isOfficialWallpaper('light-blue', 'dark'), false);
});

/* === Preferências de wallpapers === */
/* ----- Seleções independentes ----- */
test('wallpapers preservam quatro seleções independentes', async () => {
  const { m, storage } = await wallpaper();

  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('desktop', 'light'), 'light-blue');

  assert.equal(m.getWallpaper('mobile', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('mobile', 'light'), 'light-blue');

  assert.equal(m.setWallpaper('dark-green', 'desktop', 'dark'), true);
  assert.equal(m.setWallpaper('light-violeta', 'desktop', 'light'), true);

  assert.equal(m.setWallpaper('dark-violeta', 'mobile', 'dark'), true);
  assert.equal(m.setWallpaper('light-green', 'mobile', 'light'), true);

  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-green');
  assert.equal(m.getWallpaper('desktop', 'light'), 'light-violeta');

  assert.equal(m.getWallpaper('mobile', 'dark'), 'dark-violeta');
  assert.equal(m.getWallpaper('mobile', 'light'), 'light-green');

  assert.equal(
    storage.getItem('ws-os:wallpaper:desktop:dark'),
    'dark-green',
  );

  assert.equal(
    storage.getItem('ws-os:wallpaper:desktop:light'),
    'light-violeta',
  );

  assert.equal(
    storage.getItem('ws-os:wallpaper:mobile:dark'),
    'dark-violeta',
  );

  assert.equal(
    storage.getItem('ws-os:wallpaper:mobile:light'),
    'light-green',
  );

  assert.equal(m.setWallpaper('original'), false);
  assert.equal(m.setWallpaper('aurora'), false);
  assert.equal(m.setWallpaper('minimal'), false);

  assert.equal(m.setWallpaper('dark-blue', 'desktop', 'light'), false);
  assert.equal(m.setWallpaper('invalid'), false);
  assert.equal(m.setWallpaper('custom'), false);
});

/* ----- Migração das preferências antigas ----- */
test('preferências legadas são normalizadas sem apagar dados', async () => {
  const storage = memory({
    'ws-os:wallpaper': 'aurora',
    'ws-os:mobile-wallpaper': 'minimal',
    'app:document': 'preserve',
  });

  const { m } = await wallpaper({ localStorage: storage });

  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('desktop', 'light'), 'light-blue');

  assert.equal(m.getWallpaper('mobile', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('mobile', 'light'), 'light-blue');

  assert.equal(storage.getItem('app:document'), 'preserve');
  assert.equal(storage.getItem('ws-os:wallpaper'), 'aurora');

  assert.equal(
    storage.getItem('ws-os:mobile-wallpaper'),
    'minimal',
  );
});

/* ----- Prioridade das preferências novas ----- */
test('seleções novas prevalecem sobre identificadores legados', async () => {
  const storage = memory({
    'ws-os:wallpaper': 'original',
    'ws-os:wallpaper:desktop:dark': 'dark-green',
    'ws-os:wallpaper:desktop:light': 'light-violeta',
  });

  const { m } = await wallpaper({ localStorage: storage });

  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-green');
  assert.equal(m.getWallpaper('desktop', 'light'), 'light-violeta');
});

/* ----- Definições visuais ----- */
test('wallpapers oficiais utilizam arquivos correspondentes ao tema', async () => {
  const { m } = await wallpaper();

  const dark = m.getWallpaperDefinition(
    'dark-green',
    'desktop',
    'dark',
  );

  const light = m.getWallpaperDefinition(
    'light-green',
    'mobile',
    'light',
  );

  assert.match(dark.background, /dark-green\.jpg/);
  assert.match(light.background, /light-green\.jpg/);

  assert.notEqual(dark.background, light.background);

  assert.match(
    m.getWallpaperDefinition('original', 'desktop', 'dark').background,
    /dark-blue\.jpg/,
  );
});

/* === Imagem pessoal === */
/* ----- Upload e reseleção ----- */
test('upload permite reseleção e substituição da imagem pessoal', async () => {
  const { m, image, revoked } = await wallpaper();

  const file = png();

  assert.equal(await m.uploadCustomWallpaper(file), true);
  assert.equal(image.file, file);

  const first = m.getWallpaperDefinition('custom').background;

  assert.equal(m.setWallpaper('dark-blue'), true);
  assert.equal(m.getCustomWallpaperAvailable(), true);

  assert.equal(m.setWallpaper('custom'), true);

  assert.equal(
    await m.uploadCustomWallpaper(png(), 'mobile'),
    true,
  );

  assert.equal(m.getWallpaper('desktop', 'dark'), 'custom');
  assert.equal(m.getWallpaper('mobile', 'dark'), 'custom');

  assert.notEqual(
    m.getWallpaperDefinition('custom').background,
    first,
  );

  assert.deepEqual(revoked, ['blob:test-1']);
});

/* ----- Recuperação após atualização ----- */
test('imagem persistida é recuperada sem perder seleção ou dados', async () => {
  const localStorage = memory({
    'ws-os:wallpaper': 'custom',
    'app:document': 'preserve',
  });

  const { m } = await wallpaper({
    localStorage,
    file: png(),
  });

  assert.equal(m.getCustomWallpaperAvailable(), true);
  assert.equal(m.getWallpaper('desktop', 'dark'), 'custom');

  const { m: broken } = await wallpaper({
    localStorage,

    bindings: {
      readWallpaperImage: async () => {
        throw Error('blocked');
      },
    },
  });

  assert.equal(broken.getWallpaperStatus(), 'error');
  assert.equal(broken.getWallpaper('desktop', 'dark'), 'custom');

  assert.equal(
    localStorage.getItem('app:document'),
    'preserve',
  );

  assert.equal(
    localStorage.getItem('ws-os:wallpaper'),
    'custom',
  );
});

/* ----- Validação de arquivos ----- */
test('validação rejeita formato, assinatura, tamanho e dimensões inválidas', async () => {
  const { m } = await wallpaper();

  await assert.rejects(
    m.validateWallpaper(
      new Blob(['svg'], { type: 'image/svg+xml' }),
    ),
    /Formato/,
  );

  await assert.rejects(
    m.validateWallpaper(
      new Blob(['fake'], { type: 'image/png' }),
    ),
    /conteúdo/,
  );

  await assert.rejects(
    m.validateWallpaper(
      new Blob([], { type: 'image/png' }),
    ),
    /5 MB/,
  );

  await assert.rejects(
    m.validateWallpaper(
      new Blob(
        [new Uint8Array(5 * 1024 * 1024 + 1)],
        { type: 'image/png' },
      ),
    ),
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

  await assert.rejects(
    large.validateWallpaper(png()),
    /8192/,
  );

  assert.equal(closed, true);
});

/* ----- Erro de gravação no IndexedDB ----- */
test('falha de gravação preserva imagem pessoal anterior', async () => {
  const { m } = await wallpaper({
    file: png(),

    localStorage: memory({
      'ws-os:wallpaper': 'custom',
    }),

    bindings: {
      writeWallpaperImage: async () => {
        const error = Error('quota');
        error.name = 'QuotaExceededError';
        throw error;
      },
    },
  });

  const before = m.getWallpaperDefinition('custom').background;

  await assert.rejects(
    m.uploadCustomWallpaper(png()),
    /Sem espaço/,
  );

  assert.equal(
    m.getWallpaperDefinition('custom').background,
    before,
  );

  assert.equal(m.getWallpaper('desktop', 'dark'), 'custom');
});

/* ----- Armazenamento local indisponível ----- */
test('falha no localStorage mantém imagem e seleção na sessão', async () => {
  const { m, image } = await wallpaper({
    localStorage: {
      getItem: () => null,

      setItem() {
        throw Error('blocked');
      },
    },
  });

  assert.equal(
    await m.uploadCustomWallpaper(png(), 'mobile'),
    false,
  );

  assert.ok(image.file);
  assert.equal(m.getWallpaper('mobile', 'dark'), 'custom');
});

/* ----- Concorrência e hidratação ----- */
test('hidratação atrasada não substitui upload novo', async () => {
  let resolveRead;
  let resolveWrite;

  const m = load(
    'src/core/wallpaperManager.js',
    {
      ...wallpaperContracts(),

      getTheme: () => 'dark',
      useTheme: () => 'dark',
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),

      localStorage: memory(),

      URL: {
        createObjectURL: () => 'blob:new',
        revokeObjectURL() { },
      },

      createImageBitmap: async () => ({
        width: 1,
        height: 1,
        close() { },
      }),

      readWallpaperImage: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),

      writeWallpaperImage: () =>
        new Promise((resolve) => {
          resolveWrite = resolve;
        }),
    },
    [
      'uploadCustomWallpaper',
      'restoreCustomWallpaper',
      'getWallpaperDefinition',
    ],
  );

  const pending = m.uploadCustomWallpaper(png());

  await assert.rejects(
    m.uploadCustomWallpaper(png()),
    /Aguarde/,
  );

  while (!resolveWrite) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  resolveWrite();
  await pending;

  resolveRead(null);
  await m.restoreCustomWallpaper();

  assert.equal(
    m.getWallpaperDefinition('custom').background,
    'url("blob:new") center / cover no-repeat',
  );
});

/* === Widgets === */
/* ----- Organização e capacidade ----- */
test('widgets conservam posição e respeitam limite da grade', () => {
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

      getWidgetDefinition: () => ({
        allowedSizes: ['2x2', '3x2', '3x3'],
      }),

      loadWidgetPreferences: () => ({
        state: initialWidgetState,
        error: null,
      }),

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

  const unregister = m.registerWidgetValidator(
    (widget) => widget.size.columns < 3,
  );

  assert.equal(
    m.configureWidget('clock-default', {
      size: { columns: 3, rows: 3 },
    }).reason,
    'capacity',
  );

  assert.equal(saved, undefined);

  assert.equal(
    m.configureWidget('clock-default', {
      visible: false,
    }).ok,
    true,
  );

  assert.equal(
    m.configureWidget('clock-default', {
      size: { columns: 3, rows: 3 },
    }).ok,
    true,
  );

  assert.equal(
    m.configureWidget('clock-default', {
      visible: true,
    }).ok,
    false,
  );

  assert.equal(
    m.configureWidget('clock-default', {
      size: { columns: 9, rows: 9 },
    }).reason,
    'invalid',
  );

  assert.equal(
    m.configureWidget('clock-default', {
      size: null,
    }).reason,
    'invalid',
  );

  assert.equal(
    m.configureWidget('clock-default', {
      size: { columns: '2', rows: 2 },
    }).reason,
    'invalid',
  );

  assert.equal(
    m.configureWidget('clock-default', null).reason,
    'invalid',
  );

  unregister();
  m.resetWidgetPreferences();

  assert.deepEqual(
    m.getWidgetPreferences().widgets[0].position,
    initialWidgetState.widgets[0].position,
  );
});

/* === Restauração de preferências === */
/* ----- Allowlist e execução completa ----- */
test('restauração aplica padrões dos quatro wallpapers e relata falhas', () => {
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
      getDefaultWallpaper: (theme) =>
        theme === 'light' ? 'light-blue' : 'dark-blue',

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

  assert.deepEqual(
    Array.from(result.failed),
    ['locale'],
  );

  assert.equal(calls.length, 11);

  assert.deepEqual(
    calls
      .filter(([name]) => name === 'wallpaper')
      .map(([, args]) => Array.from(args)),
    [
      ['dark-blue', 'desktop', 'dark'],
      ['light-blue', 'desktop', 'light'],
      ['dark-blue', 'mobile', 'dark'],
      ['light-blue', 'mobile', 'light'],
    ],
  );
});

/* === Aparência === */
/* ----- Compatibilidade e persistência ----- */
test('aparência normaliza valores e preserva sessão com armazenamento bloqueado', () => {
  const document = {
    documentElement: {
      dataset: {},
    },
  };

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
    [
      'getAppearance',
      'setAppearance',
    ],
  );

  assert.equal(m.getAppearance().motion, 'normal');
  assert.equal(m.getAppearance().blur, 'normal');

  assert.equal(
    m.setAppearance({ motion: 'subtle' }),
    false,
  );

  assert.equal(m.getAppearance().accent, 'green');

  assert.equal(
    document.documentElement.dataset.motionIntensity,
    'subtle',
  );
});

/* === Sincronização entre abas === */
/* ----- Idioma e Taskbar ----- */
test('mudança externa atualiza sessão sem regravar', () => {
  const cases = [
    [
      'src/shared/i18n/i18n.js',
      ['getLocale'],
      'ws-os:locale',
      'en',
    ],
    [
      'src/core/taskbarPreferences.js',
      ['getTaskbarAutoHide'],
      'ws-os:taskbar-auto-hide',
      'true',
    ],
  ];

  for (const [file, names, key, next] of cases) {
    let callback;

    const storage = memory();
    let writes = 0;

    const originalSetItem = storage.setItem;

    storage.setItem = (...args) => {
      writes += 1;
      originalSetItem(...args);
    };

    const m = load(
      file,
      {
        english: JSON.parse(
          read('src/shared/i18n/locales/en.json'),
        ),

        localStorage: storage,

        document: {
          documentElement: {},
        },

        window: {
          addEventListener: (_type, fn) => {
            callback = fn;
          },
        },
      },
      names,
    );

    originalSetItem(key, next);
    callback({ key });

    assert.equal(
      m[names[0]](),
      next === 'true' ? true : next,
    );

    assert.equal(writes, 0);
  }
});

/* === Persistência IndexedDB === */
/* ----- Banco indisponível ou bloqueado ----- */
test('IndexedDB indisponível ou bloqueado não mantém conexão aberta', async () => {
  const unavailable = load(
    'src/services/storage/wallpaperStorage.js',
    {},
    ['readWallpaperImage'],
  );

  await assert.rejects(
    unavailable.readWallpaperImage(),
    /storage/,
  );

  let request;
  let closed = false;

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

  await assert.rejects(
    blocked.readWallpaperImage(),
    /storage/,
  );

  assert.equal(closed, true);
});

/* === Cobertura de traduções === */
/* ----- Textos de interface ----- */
test('mensagens e opções de Configurações possuem tradução', () => {
  const english = JSON.parse(
    read('src/shared/i18n/locales/en.json'),
  );

  const files = [
    'src/apps/settings/Settings.jsx',
    'src/apps/settings/SettingsNavigation.jsx',
    'src/apps/settings/SettingsSections.jsx',
    'src/core/wallpaperManager.js',
  ];

  for (const file of files) {
    for (const match of read(file).matchAll(/'([^'\n]+)'/g)) {
      const text = match[1];

      if (
        ['Escape', 'RIFF', 'WEBP', 'QuotaExceededError'].includes(text)
      ) {
        continue;
      }

      /* ----- Fusos horários IANA ----- */
      if (
        /^(?:Africa|America|Antarctica|Arctic|Asia|Atlantic|Australia|Europe|Indian|Pacific|Etc)\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(
          text,
        )
      ) {
        assert.doesNotThrow(
          () => new Intl.DateTimeFormat('en', {
            timeZone: text,
          }),
        );

        continue;
      }

      /* ----- Somente textos visíveis ----- */
      if (
        !/^[A-ZÁÉÍÓÚÇ][\p{L}\p{N} .,;:…?!×/()+—–-]*$/u.test(text)
      ) {
        continue;
      }

      assert.ok(
        Object.hasOwn(english, text),
        `${file}: ${text}`,
      );
    }
  }
});

/* === Contraste visual === */
/* ----- Destaques nos temas Dark e Light ----- */
test('cores de destaque preservam contraste mínimo', () => {
  const colors = {
    blue: ['#65cde1', '#0b657b', '#1d5c96'],
    violet: ['#c3abff', '#6439a9', '#6439a9'],
    green: ['#7de1c4', '#08634f', '#08634f'],
  };

  const rgb = (hex) =>
    [1, 3, 5].map(
      (index) => parseInt(hex.slice(index, index + 2), 16),
    );

  const luminance = (values) =>
    values
      .map((value) => value / 255)
      .map((value) =>
        value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (sum, value, index) =>
          sum + value * [0.2126, 0.7152, 0.0722][index],
        0,
      );

  const contrast = (first, second) => {
    const a = luminance(first);
    const b = luminance(second);

    return (
      (Math.max(a, b) + 0.05) /
      (Math.min(a, b) + 0.05)
    );
  };

  const darkGlass = [24, 34, 48].map(
    (value) => value * 0.88 + 255 * 0.12,
  );

  const lightGlass = [255, 255, 255].map(
    (value) => value * 0.88,
  );

  for (const [name, [dark, light, action]] of Object.entries(colors)) {
    assert.ok(
      contrast(rgb(dark), darkGlass) >= 4.5,
      `${name} dark`,
    );

    assert.ok(
      contrast(rgb(light), lightGlass) >= 4.5,
      `${name} light`,
    );

    assert.ok(
      contrast(rgb(action), [255, 255, 255]) >= 4.5,
      `${name} action`,
    );
  }
});
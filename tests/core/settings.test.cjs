const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* === Arquivos do projeto === */
/* ----- Diretório principal ----- */
const root = path.resolve(__dirname, '../..');

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

/* === Carregamento isolado === */
/* ----- Avaliação de módulos ----- */
function load(file, bindings = {}, names = []) {
  if (file === 'src/core/appearanceManager.js') {
    bindings = {
      ...load('src/core/appearanceContract.js', {}, [
        'DEFAULT_APPEARANCE',
        'APPEARANCE_OPTIONS',
        'normalizeAppearance',
        'extractWallpaperAccent',
      ]),
      ...bindings,
    };
  }
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
    .replace(/^export \{[^;]+;\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');

  return vm.runInNewContext(`(() => { ${source}\nreturn {${names.join(',')}}; })()`, {
    Uint8Array,
    Blob,
    setTimeout,
    clearTimeout,
    ...bindings,
  });
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
  const catalog = load('src/core/wallpaperCatalog.js', {}, [
    'WALLPAPER_THEMES',
    'OFFICIAL_WALLPAPERS',
    'DEFAULT_WALLPAPERS',
    'getOfficialWallpaper',
    'getOfficialWallpapersByTheme',
    'getDefaultWallpaper',
    'isOfficialWallpaper',
  ]);

  const selection = load('src/core/wallpaperSelectionContract.js', catalog, [
    'WALLPAPER_SHELLS',
    'WALLPAPER_SELECTION_KEYS',
    'LEGACY_WALLPAPER_KEYS',
    'isWallpaperContext',
    'normalizeWallpaperSelection',
    'resolveWallpaperSelection',
    'createDefaultWallpaperSelections',
    'updateWallpaperSelection',
    'WALLPAPER_THEMES',
    'LEGACY_CUSTOM_WALLPAPER_ID',
    'PERSONAL_WALLPAPER_PREFIX',
    'isPersonalWallpaperId',
    'getPersonalWallpaperStorageId',
    'createPersonalWallpaperSelectionId',
    'isWallpaperSelectionId',
    'isWallpaperSelectedAnywhere',
  ]);

  return {
    ...catalog,
    ...selection,
  };
}

/* === Arquivos de imagem simulados === */
/* ----- PNG mínimo para os testes ----- */
function png() {
  return new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], {
    type: 'image/png',
  });
}

/* === Ambiente de wallpapers === */
/* ----- Gerenciador isolado ----- */
/* === Ambiente de wallpapers === */
/* ----- Gerenciador e coleção simulados ----- */
async function wallpaper(options = {}) {
  const storage = options.localStorage ?? memory();
  const image = { file: options.file ?? null };
  const files = new Map(options.personalFiles ?? []);
  const revoked = [];

  let urls = 0;
  let nextId = 0;

  const theme = options.theme ?? 'dark';
  const contracts = wallpaperContracts();

  /* ----- Simulação da coleção pessoal ----- */
  const collection = {
    loadPersonalWallpaperCollection: async () => {
      if (image.file && !files.has('legacy')) {
        files.set('legacy', image.file);
      }

      return Array.from(files, ([id, file]) => ({
        id,
        name: file.name || 'Imagem pessoal',
        type: file.type,
        size: file.size,
        lastModified: file.lastModified ?? null,
      }));
    },

    getPersonalWallpaperFile: async (id) => files.get(id) ?? null,

    addPersonalWallpaper: async (file, validate) => {
      await validate(file);

      const id = `test-${++nextId}`;
      files.set(id, file);

      return {
        id,
        name: file.name || 'Imagem pessoal',
        type: file.type,
        size: file.size,
        lastModified: file.lastModified ?? null,
      };
    },

    removeStoredWallpaper: async (id, isInUse) => {
      if (isInUse(id)) {
        return { ok: false, code: 'WALLPAPER_IN_USE' };
      }

      if (!files.has(id)) {
        return { ok: false, code: 'WALLPAPER_NOT_FOUND' };
      }

      files.delete(id);

      return { ok: true, id };
    },
  };

  /* ----- Instância isolada do gerenciador ----- */
  const manager = load(
    'src/core/wallpaperManager.js',
    {
      ...contracts,
      ...collection,

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
        close() {},
      }),

      ...options.bindings,
    },
    [
      'WALLPAPERS',
      'getWallpaperFit',
      'setWallpaperFit',
      'getWallpaper',
      'setWallpaper',
      'getWallpaperDefinition',
      'uploadCustomWallpaper',
      'addWallpaperToCollection',
      'deleteWallpaperFromCollection',
      'isPersonalWallpaperInUse',
      'getPersonalWallpapers',
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
    files,
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
    Array.from(catalog.getOfficialWallpapersByTheme('dark'), (item) => item.id),
    ['dark-blue', 'dark-green', 'dark-violeta'],
  );

  assert.deepEqual(
    Array.from(catalog.getOfficialWallpapersByTheme('light'), (item) => item.id),
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
test('wallpapers preservam as quatro seleções independentes', async () => {
  const { m, storage } = await wallpaper();

  /* ----- Seleções iniciais ----- */
  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('desktop', 'light'), 'light-blue');
  assert.equal(m.getWallpaper('mobile', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('mobile', 'light'), 'light-blue');

  /* ----- Desktop: selecionar violeta no Light ----- */
  assert.equal(m.setWallpaper('light-violeta', 'desktop', 'light'), true);

  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('desktop', 'light'), 'light-violeta');

  /* ----- Mobile: selecionar verde no Dark ----- */
  assert.equal(m.setWallpaper('dark-green', 'mobile', 'dark'), true);

  assert.equal(m.getWallpaper('mobile', 'dark'), 'dark-green');
  assert.equal(m.getWallpaper('mobile', 'light'), 'light-blue');

  /* ----- Desktop e Mobile permanecem independentes ----- */
  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-blue');
  assert.equal(m.getWallpaper('mobile', 'dark'), 'dark-green');

  /* ----- Persistência das quatro variantes ----- */
  assert.equal(storage.getItem('ws-os:wallpaper:desktop:dark'), null);

  assert.equal(storage.getItem('ws-os:wallpaper:desktop:light'), 'light-violeta');

  assert.equal(storage.getItem('ws-os:wallpaper:mobile:dark'), 'dark-green');

  assert.equal(storage.getItem('ws-os:wallpaper:mobile:light'), null);

  /* ----- Identificadores inválidos ----- */
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

  assert.equal(storage.getItem('ws-os:mobile-wallpaper'), 'minimal');
});

/* ----- Prioridade das preferências novas ----- */
test('seleções salvas distintas são recuperadas sem harmonização', async () => {
  const storage = memory({
    'ws-os:wallpaper': 'original',
    'ws-os:wallpaper:desktop:dark': 'dark-green',
    'ws-os:wallpaper:desktop:light': 'light-violeta',
  });

  const { m } = await wallpaper({
    localStorage: storage,
    theme: 'dark',
  });

  /* ----- Cada tema mantém sua seleção inicial ----- */
  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-green');

  assert.equal(m.getWallpaper('desktop', 'light'), 'light-violeta');

  /* ----- Preferência legada permanece preservada ----- */
  assert.equal(storage.getItem('ws-os:wallpaper'), 'original');

  /* ----- Nova seleção preserva o outro tema ----- */
  assert.equal(m.setWallpaper('light-violeta', 'desktop', 'light'), true);

  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-green');

  assert.equal(m.getWallpaper('desktop', 'light'), 'light-violeta');
});

/* ----- Definições visuais ----- */
test('wallpapers oficiais utilizam arquivos correspondentes ao tema', async () => {
  const { m } = await wallpaper();

  const dark = m.getWallpaperDefinition('dark-green', 'desktop', 'dark');

  const light = m.getWallpaperDefinition('light-green', 'mobile', 'light');

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
test('uploads preservam imagens anteriores e seleções independentes', async () => {
  const { m, files } = await wallpaper();

  const firstFile = png();
  const secondFile = png();

  assert.equal(await m.uploadCustomWallpaper(firstFile, 'desktop'), true);

  const firstId = m.getWallpaper('desktop', 'dark');

  assert.equal(firstId, 'personal:test-1');

  assert.equal(await m.uploadCustomWallpaper(secondFile, 'mobile'), true);

  const secondId = m.getWallpaper('mobile', 'dark');

  assert.equal(secondId, 'personal:test-2');

  assert.equal(m.getWallpaper('desktop', 'dark'), firstId);
  assert.equal(m.getWallpaper('mobile', 'dark'), secondId);

  assert.equal(files.get('test-1'), firstFile);
  assert.equal(files.get('test-2'), secondFile);

  assert.equal(m.getPersonalWallpapers().length, 2);

  assert.match(m.getWallpaperDefinition(firstId).background, /blob:test-1/);

  assert.match(m.getWallpaperDefinition(secondId).background, /blob:test-2/);
});

test('imagem selecionada não pode ser excluída', async () => {
  const { m, files } = await wallpaper();

  const entry = await m.addWallpaperToCollection(png());

  assert.equal(m.setWallpaper(entry.id, 'desktop', 'dark'), true);

  assert.equal(m.isPersonalWallpaperInUse(entry.id), true);

  const blocked = await m.deleteWallpaperFromCollection(entry.id);

  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, 'WALLPAPER_IN_USE');

  assert.ok(files.has('test-1'));

  assert.equal(m.setWallpaper('dark-blue', 'desktop', 'dark'), true);

  const removed = await m.deleteWallpaperFromCollection(entry.id);

  assert.equal(removed.ok, true);
  assert.equal(files.has('test-1'), false);
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
      loadPersonalWallpaperCollection: async () => {
        throw Error('blocked');
      },
    },
  });

  assert.equal(broken.getWallpaperStatus(), 'error');
  assert.equal(broken.getWallpaper('desktop', 'dark'), 'custom');

  assert.equal(localStorage.getItem('app:document'), 'preserve');

  assert.equal(localStorage.getItem('ws-os:wallpaper'), 'custom');
});

/* ----- Validação de arquivos ----- */
test('validação rejeita formato, assinatura, tamanho e dimensões inválidas', async () => {
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

/* ----- Erro de gravação no IndexedDB ----- */
test('falha de gravação preserva imagem pessoal anterior', async () => {
  const { m } = await wallpaper({
    file: png(),

    localStorage: memory({
      'ws-os:wallpaper': 'custom',
    }),

    bindings: {
      addPersonalWallpaper: async () => {
        const error = new Error('Sem espaço para salvar a imagem.');
        error.name = 'QuotaExceededError';
        throw error;
      },
    },
  });

  const before = m.getWallpaperDefinition('custom').background;

  await assert.rejects(m.uploadCustomWallpaper(png()), /Sem espaço/);

  assert.equal(m.getWallpaperDefinition('custom').background, before);

  assert.equal(m.getWallpaper('desktop', 'dark'), 'custom');
});

/* ----- Armazenamento local indisponível ----- */
test('falha no localStorage mantém imagem e seleção na sessão', async () => {
  const { m, files } = await wallpaper({
    localStorage: {
      getItem: () => null,

      setItem() {
        throw Error('blocked');
      },
    },
  });

  assert.equal(await m.uploadCustomWallpaper(png(), 'mobile'), false);

  assert.equal(files.size, 1);
  assert.equal(m.getWallpaper('mobile', 'dark'), 'personal:test-1');
});

/* ----- Concorrência e hidratação ----- */
test('hidratação atrasada não substitui upload novo', async () => {
  let resolveRead;
  let resolveWrite;

  const storedFiles = new Map();

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
        revokeObjectURL() {},
      },

      createImageBitmap: async () => ({
        width: 1,
        height: 1,
        close() {},
      }),

      /* ----- Recuperação inicialmente pendente ----- */
      loadPersonalWallpaperCollection: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),

      getPersonalWallpaperFile: async (id) => storedFiles.get(id) ?? null,

      /* ----- Gravação inicialmente pendente ----- */
      addPersonalWallpaper: async (file, validate) => {
        await validate(file);

        await new Promise((resolve) => {
          resolveWrite = resolve;
        });

        storedFiles.set('test-1', file);

        return {
          id: 'test-1',
          name: 'Imagem pessoal',
          type: file.type,
          size: file.size,
        };
      },

      removeStoredWallpaper: async () => ({
        ok: true,
      }),
    },
    ['uploadCustomWallpaper', 'restoreCustomWallpaper', 'getWallpaperDefinition', 'getWallpaper'],
  );

  const pending = m.uploadCustomWallpaper(png());

  await assert.rejects(m.uploadCustomWallpaper(png()), /Aguarde/);

  while (!resolveWrite) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  resolveWrite();

  assert.equal(await pending, true);

  /* ----- Finalizar leitura antiga após o upload ----- */
  resolveRead([]);

  await m.restoreCustomWallpaper();

  assert.equal(m.getWallpaper('desktop', 'dark'), 'personal:test-1');

  assert.equal(
    m.getWallpaperDefinition('personal:test-1').background,
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

  const unregister = m.registerWidgetValidator((widget) => widget.size.columns < 3);

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

  assert.equal(m.configureWidget('clock-default', null).reason, 'invalid');

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
      getDefaultWallpaper: (theme) => (theme === 'light' ? 'light-blue' : 'dark-blue'),

      setTheme: spy('theme'),
      resetCursorMode: spy('cursor'),
      setDoNotDisturb: spy('notifications'),
      setLocale: spy('locale', false),
      resetAppearance: spy('appearance'),
      setAccessibility: spy('accessibility'),
      setTaskbarAutoHide: spy('taskbar'),
      resetMobilePreferences: spy('mobile'),
      setWallpaper: spy('wallpaper'),
      setWallpaperFit: spy('fit'),
      resetWidgetPreferences: spy('widgets'),
    },
    ['restoreSystemPreferences'],
  );

  const result = m.restoreSystemPreferences();

  assert.equal(result.ok, false);

  assert.deepEqual(Array.from(result.failed), ['locale']);

  assert.equal(calls.length, 17);
  assert.deepEqual(
    calls.filter(([name]) => name === 'fit').map(([, args]) => Array.from(args)),
    [
      ['cover', 'desktop', 'dark'],
      ['cover', 'desktop', 'light'],
      ['cover', 'mobile', 'dark'],
      ['cover', 'mobile', 'light'],
    ],
  );

  assert.deepEqual(
    calls.filter(([name]) => name === 'wallpaper').map(([, args]) => Array.from(args)),
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
    ['getAppearance', 'setAppearance'],
  );

  assert.equal(m.getAppearance().motion, 'normal');
  assert.equal(m.getAppearance().blur, 'normal');

  assert.equal(m.setAppearance({ motion: 'subtle' }), false);

  assert.equal(m.getAppearance().accent, 'green');

  assert.equal(document.documentElement.dataset.motionIntensity, 'subtle');
});

/* === Sincronização entre abas === */
/* ----- Idioma e Taskbar ----- */
test('mudança externa atualiza sessão sem regravar', () => {
  const cases = [
    ['src/shared/i18n/i18n.js', ['getLocale'], 'ws-os:locale', 'en'],
    ['src/core/taskbarPreferences.js', ['getTaskbarAutoHide'], 'ws-os:taskbar-auto-hide', 'true'],
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
        portuguese: JSON.parse(read('src/shared/i18n/locales/pt-BR.json')),
        english: JSON.parse(read('src/shared/i18n/locales/en.json')),

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

    assert.equal(m[names[0]](), next === 'true' ? true : next);

    assert.equal(writes, 0);
  }
});

/* === Persistência IndexedDB === */
/* ----- Banco indisponível ou bloqueado ----- */
test('IndexedDB indisponível ou bloqueado não mantém conexão aberta', async () => {
  const unavailable = load('src/services/storage/wallpaperStorage.js', {}, ['readWallpaperImage']);

  await assert.rejects(unavailable.readWallpaperImage(), /storage/);

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

  await assert.rejects(blocked.readWallpaperImage(), /storage/);

  assert.equal(closed, true);
});

/* === Cobertura de traduções === */
/* ----- Textos de interface ----- */
test('mensagens e opções de Configurações possuem tradução', () => {
  const portuguese = JSON.parse(read('src/shared/i18n/locales/pt-BR.json'));

  /* ----- TEXTOS DO DICIONÁRIO ----- */
  function collectTranslations(dictionary) {
    const values = new Set();

    function collect(entries) {
      for (const value of Object.values(entries)) {
        if (typeof value === 'string') {
          values.add(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          collect(value);
        }
      }
    }

    collect(dictionary);
    return values;
  }

  const translatedSources = collectTranslations(portuguese);

  const files = [
    'src/apps/settings/Settings.jsx',
    'src/apps/settings/SettingsNavigation.jsx',
    'src/apps/settings/SettingsSections.jsx',
    'src/core/wallpaperManager.js',
  ];

  for (const file of files) {
    for (const match of read(file).matchAll(/'([^'\n]+)'/g)) {
      const text = match[1];

      if (['Escape', 'RIFF', 'WEBP', 'QuotaExceededError'].includes(text)) {
        continue;
      }

      /* ----- Fusos horários IANA ----- */
      if (
        /^(?:Africa|America|Antarctica|Arctic|Asia|Atlantic|Australia|Europe|Indian|Pacific|Etc)\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(
          text,
        )
      ) {
        assert.doesNotThrow(
          () =>
            new Intl.DateTimeFormat('en', {
              timeZone: text,
            }),
        );

        continue;
      }

      /* ----- Somente textos visíveis ----- */
      if (!/^[A-ZÁÉÍÓÚÇ][\p{L}\p{N} .,;:…?!×/()+—–-]*$/u.test(text)) {
        continue;
      }

      assert.ok(translatedSources.has(text), `${file}: ${text}`);
    }
  }
});

/* === Contraste visual === */
/* ----- Destaques nos temas Dark e Light ----- */
test('cores de destaque preservam contraste mínimo', () => {
  const css = read('src/styles/themes/customization.css');
  const colors = {};
  for (const name of ['blue', 'violet', 'green']) {
    colors[name] = {};
    for (const theme of ['dark', 'light']) {
      const marker = ":root[data-theme='" + theme + "'][data-accent='" + name + "'] {";
      const block = css.slice(css.indexOf(marker) + marker.length).split('}')[0];
      colors[name][theme] = Object.fromEntries(
        Array.from(block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/g), (match) => [
          match[1],
          match[2],
        ]),
      );
    }
  }

  const rgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

  const luminance = (values) =>
    values
      .map((value) => value / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

  const contrast = (first, second) => {
    const a = luminance(first);
    const b = luminance(second);

    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  const darkGlass = [24, 34, 48].map((value) => value * 0.88 + 255 * 0.12);

  const lightGlass = [255, 255, 255].map((value) => value * 0.88);

  for (const [name, themes] of Object.entries(colors)) {
    for (const theme of ['dark', 'light']) {
      const palette = themes[theme];
      const glass = theme === 'dark' ? darkGlass : lightGlass;
      assert.ok(
        contrast(rgb(palette['accent-secondary']), glass) >= 4.5,
        name + ' ' + theme + ' destaque',
      );
      assert.ok(contrast(rgb(palette['link-color']), glass) >= 4.5, name + ' ' + theme + ' link');
      assert.ok(
        contrast(rgb(palette['action-background']), [255, 255, 255]) >= 4.5,
        name + ' ' + theme + ' ação',
      );
    }
  }
});

/* === ENQUADRAMENTO E PERSISTÊNCIA === */
/* ----- Seleções, falhas e recuperação ----- */
test('enquadramento mantém contexto, valida valores e recupera preferência', async () => {
  const storage = memory();
  const { m } = await wallpaper({ localStorage: storage });
  assert.equal(m.setWallpaperFit('contain', 'mobile', 'light'), true);
  assert.equal(m.getWallpaperFit('desktop', 'light'), 'cover');
  assert.equal(m.getWallpaperFit('mobile', 'dark'), 'cover');
  assert.equal(m.getWallpaperFit('mobile', 'light'), 'contain');
  assert.equal(m.setWallpaperFit('invalid', 'mobile', 'light'), false);
  assert.match(m.getWallpaperDefinition('light-green', 'mobile', 'light').background, /contain/);
  const restored = await wallpaper({ localStorage: storage });
  assert.equal(restored.m.getWallpaperFit('mobile', 'light'), 'contain');
  assert.equal(m.setWallpaperFit('center', 'mobile', 'light'), true);
  assert.match(
    m.getWallpaperDefinition('light-green', 'mobile', 'light').background,
    /center \/ auto/,
  );
});

test('falha ao persistir seleção preserva outros contextos e imagens', async () => {
  const storage = memory();
  const { m } = await wallpaper({ localStorage: storage });
  storage.setItem = () => {
    throw Error('quota');
  };
  assert.equal(m.setWallpaper('dark-green', 'desktop', 'dark'), false);
  assert.equal(m.getWallpaper('desktop', 'dark'), 'dark-green');
  assert.equal(m.getWallpaper('desktop', 'light'), 'light-blue');
  assert.equal(m.getWallpaper('mobile', 'dark'), 'dark-blue');
  assert.equal(m.setWallpaperFit('contain', 'mobile', 'light'), false);
  assert.equal(m.getWallpaperFit('mobile', 'light'), 'contain');
});

/* === COLEÇÃO PESSOAL === */
/* ----- Falhas isoladas e seleção externa ----- */
test('imagem inválida não bloqueia recuperação de outra imagem válida', async () => {
  const storage = memory({ 'ws-os:wallpaper:desktop:dark': 'personal:broken' });
  const invalid = new Blob(['invalid'], { type: 'image/png' });
  const { m, files } = await wallpaper({
    localStorage: storage,
    personalFiles: [
      ['broken', invalid],
      ['good', png()],
    ],
  });
  assert.equal(m.getPersonalWallpapers().length, 1);
  assert.equal(m.getPersonalWallpapers()[0].id, 'personal:good');
  assert.equal(m.getWallpaperStatus(), 'missing');
  assert.equal(m.getWallpaper('desktop', 'dark'), 'personal:broken');
  assert.match(m.getWallpaperDefinition('personal:broken').background, /dark-blue.jpg/);
  assert.equal(files.has('broken'), true);
});
test('seleção persistida em outra aba impede exclusão da imagem', async () => {
  const { m, storage, files } = await wallpaper();
  const entry = await m.addWallpaperToCollection(png());
  storage.setItem('ws-os:wallpaper:mobile:light', entry.id);
  const result = await m.deleteWallpaperFromCollection(entry.id);
  assert.equal(result.code, 'WALLPAPER_IN_USE');
  assert.equal(files.has('test-1'), true);
});
test('quota agregada é verificada antes da gravação e preserva arquivos existentes', async () => {
  const stored = new Map([
    ['personal:old', { size: 99 * 1024 * 1024 }],
    ['custom', { size: 3 }],
  ]);
  let closed = 0;
  const indexedDB = {
    open: () => {
      const request = {};
      setImmediate(() => {
        request.result = {
          close: () => closed++,
          transaction: () => {
            const transaction = {};
            const store = {
              getAllKeys: () => ({ result: [...stored.keys()] }),
              getAll: () => {
                const reading = { result: [...stored.values()] };
                setImmediate(() => {
                  reading.onsuccess();
                  transaction.oncomplete();
                });
                return reading;
              },
              put: (file, key) => stored.set(key, file),
            };
            transaction.objectStore = () => store;
            return transaction;
          },
        };
        request.onsuccess();
      });
      return request;
    },
  };
  const m = load('src/services/storage/wallpaperStorage.js', { indexedDB }, [
    'writePersonalWallpaperImage',
  ]);
  await assert.rejects(m.writePersonalWallpaperImage('new', { size: 2 * 1024 * 1024 }), /100 MB/);
  assert.equal(stored.has('personal:new'), false);
  assert.equal(stored.get('personal:old').size, 99 * 1024 * 1024);
  assert.equal(await m.writePersonalWallpaperImage('new', { size: 1024 }), true);
  assert.equal(stored.has('personal:new'), true);
  assert.equal(closed, 2);
});

/* ----- Migração compatível com quota esgotada ----- */
test('falha ao copiar imagem legada preserva sua leitura e a coleção existente', async () => {
  const legacy = png();
  const good = png();
  const m = load(
    'src/core/personalWallpaperCollection.js',
    {
      readWallpaperImage: async () => legacy,
      readPersonalWallpaperImage: async () => null,
      listPersonalWallpaperImages: async () => [{ id: 'good', file: good }],
      writePersonalWallpaperImage: async () => {
        throw Error('quota');
      },
    },
    ['loadPersonalWallpaperCollection', 'getPersonalWallpaperFile'],
  );
  const collection = await m.loadPersonalWallpaperCollection();
  assert.equal(collection.length, 2);
  assert.equal(
    collection.some((entry) => entry.id === 'good'),
    true,
  );
  assert.equal(
    collection.some((entry) => entry.id === 'legacy'),
    true,
  );
  assert.equal(await m.getPersonalWallpaperFile('legacy'), legacy);
});

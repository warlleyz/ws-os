const test = require('node:test');
const assert = require('node:assert/strict');
const { renderApp } = require('../helpers/app-ui.cjs');

/* === Preferências com armazenamento e Core controlados === */
async function settings(section, overrides = {}) {
  const props = { activeSection: section };
  const calls = [];
  const ui = await renderApp('src/apps/settings/SettingsSections.jsx', props, {
    useTheme: () => 'dark',
    useAppearance: () => ({
      accent: 'blue',
      blur: 'normal',
      transparency: 'default',
      motion: 'normal',
    }),
    useAccessibility: () => ({ motion: false, transparency: false, lowEffects: false }),
    useTaskbarAutoHide: () => false,
    useMobilePreferences: () => ({ gridDensity: 'default' }),
    useWidgetPreferences: () => ({ widgets: [] }),
    useSystem: () => ({ notify: (value) => calls.push(value) }),
    Moon: 'Moon',
    Sun: 'Sun',
    Check: 'Check',
    RotateCcw: 'RotateCcw',
    queueMicrotask,
    setTheme: (value) => {
      calls.push(value);
      return false;
    },
    setLocale: (value) => {
      calls.push(value);
      return true;
    },
    setMobilePreferences: (value) => {
      calls.push(value);
      return true;
    },
    restoreSystemPreferences: () => {
      calls.push('reset');
      return { ok: false, failed: ['locale'] };
    },
    ...overrides,
  });
  return { ui, calls };
}

test('Configurações só restaura após confirmação e informa falha parcial', async () => {
  const { ui, calls } = await settings('reset');
  ui.button('Restaurar padrões').props.onClick();
  ui.render();
  assert.equal(calls.length, 0);
  ui.button('Cancelar').props.onClick();
  ui.render();
  assert.equal(calls.length, 0);
  ui.button('Restaurar padrões').props.onClick();
  ui.render();
  ui.button('Confirmar restauração').props.onClick();
  ui.render();
  assert.equal(calls[0], 'reset');
  assert.match(ui.text(), /algumas não puderam ser salvas/);
});

test('Configurações aciona tema e informa preferência mantida na sessão', async () => {
  const { ui, calls } = await settings('appearance');
  ui.nodes()
    .find((node) => node.type === 'button' && ui.text(node).includes('Claro'))
    .props.onClick();
  ui.render();
  assert.equal(calls[0], 'light');
  assert.match(ui.text(), /continua ativa nesta sessão/);
});

test('Configurações encaminha idioma e densidade Mobile aos serviços existentes', async () => {
  for (const [section, value] of [
    ['language', 'en'],
    ['mobile', 'comfortable'],
  ]) {
    const { ui, calls } = await settings(section);
    ui.nodes()
      .find((node) => node.type?.name === 'SettingsSelect')
      .props.onChange(value);
    if (section === 'language') assert.equal(calls[0], 'en');
    else assert.equal(calls[0].gridDensity, 'comfortable');
  }
});

test('Configurações não informa widget ativo quando gravação foi rejeitada', async () => {
  const { ui } = await settings('widgets', {
    useWidgetPreferences: () => ({
      widgets: [
        {
          instanceId: 'clock-default',
          widgetId: 'clock',
          size: { columns: 2, rows: 2 },
          visible: true,
        },
      ],
    }),
    getWidgetDefinition: () => ({ name: 'Relógio', allowedSizes: ['2x2'] }),
    configureWidget: () => ({ ok: true, saved: false }),
  });
  ui.nodes()
    .find((node) => node.type?.name === 'SettingsToggle')
    .props.onChange(false);
  ui.render();
  assert.match(ui.text(), /Não foi possível concluir a operação/);
  assert.doesNotMatch(ui.text(), /continua ativa nesta sessão/);
});

test('Galeria preserva mensagem correta quando upload falha e não anuncia após desmontar', async () => {
  for (const unmount of [false, true]) {
    let finish;
    const messages = [];
    const ui = await renderApp(
      'src/apps/settings/SettingsSections.jsx',
      {
        shell: 'mobile',
        report: (value) => messages.push(value),
        announce: (value) => messages.push(value),
      },
      {
        useTheme: () => 'dark',
        useWallpaper: () => 'dark-blue',
        useWallpaperRevision() {},
        useWallpaperStatus: () => 'ready',
        usePersonalWallpapers: () => [],
        getOfficialWallpapersByTheme: () => [],
        uploadCustomWallpaper: () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      },
      { entryPoint: 'WallpaperGallery' },
    );
    const input = ui.nodes().find((node) => node.type === 'input');
    const operation = input.props.onChange({ currentTarget: { files: [{}], value: 'file' } });
    if (unmount) ui.unmount();
    finish(false);
    await operation;
    assert.deepEqual(
      messages,
      unmount ? [] : ['Não foi possível salvar a imagem. A imagem anterior foi preservada.'],
    );
  }
});

/* === Testes das boas-vindas === */
/* ----- Proteção da apresentação e acessibilidade ----- */
test('Boas-vindas bloqueia Escape, contém Tab e preserva a conclusão explícita', async () => {
  let closed = 0;
  let focused = 0;
  const button = { focus: () => focused++ };
  const mobile = { focus: () => focused++ };

  const document = {
    activeElement: button,
    body: {},
    querySelector: () => mobile,
  };

  const ui = await renderApp(
    'src/features/welcome/WelcomeDialog.jsx',
    { onClose: () => closed++ },
    {
      document,
      HTMLElement: class {},
      useTheme: () => 'dark',
      useAppearance: () => ({ accent: 'blue' }),
      useWallpaper: () => 'dark-blue',
      APPEARANCE_OPTIONS: {
        accent: ['blue', 'violet', 'green'],
      },
      getOfficialWallpapersByTheme: () => [],
      ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight',
      Check: 'Check',
      Moon: 'Moon',
      Sun: 'Sun',
      attachRef: () => ({
        focus: () => focused++,
        scrollTo() {},
        querySelectorAll: () => [button],
      }),
    },
  );

  const dialog = ui.nodes().find((node) => node.props.role === 'dialog');

  let prevented = 0;

  dialog.props.onKeyDown({
    key: 'Tab',
    preventDefault: () => prevented++,
    stopPropagation() {},
  });

  dialog.props.onKeyDown({
    key: 'Escape',
    preventDefault: () => prevented++,
    stopPropagation() {},
  });

  assert.equal(prevented, 2);
  assert.equal(closed, 0);

  /* ----- O título inicial também deve conter Shift+Tab ----- */
  document.activeElement = {};
  dialog.props.onKeyDown({
    key: 'Tab',
    shiftKey: true,
    preventDefault: () => prevented++,
    stopPropagation() {},
  });
  assert.equal(prevented, 3);
  assert.equal(closed, 0);
  ui.button('Próximo').props.onClick();
  ui.render();
  assert.ok(ui.button('Começar'));
  assert.equal(ui.button('Próximo'), undefined);
  ui.button('Voltar').props.onClick();
  ui.render();
  assert.ok(ui.button('Próximo'));
  assert.equal(closed, 0);
  ui.button('Próximo').props.onClick();
  ui.render();
  ui.button('Começar').props.onClick();
  assert.equal(closed, 1);
  ui.unmount();

  assert.ok(focused >= 4);
});

test('Sobre o Sistema utiliza versão versionada e links de licença seguros', async () => {
  const ui = await renderApp(
    'src/apps/about-system/AboutSystem.jsx',
    {},
    { packageInfo: { version: '0.0.0' } },
  );
  assert.match(ui.text(), /WS OS V2 ·/);
  assert.match(ui.text(), /0.0.0/);
  assert.match(ui.text(), /Apache-2.0/);
  assert.equal(
    ui.nodes().filter((node) => node.type === 'a' && node.props.href.includes('LICENSE')).length,
    4,
  );
  for (const link of ui.nodes().filter((node) => node.type === 'a'))
    assert.equal(link.props.rel, 'noopener noreferrer');
});

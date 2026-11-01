const test = require('node:test');
const assert = require('node:assert/strict');
const { renderApp } = require('../helpers/app-ui.cjs');

/* === SHELL MOBILE COM CORE CONTROLADO === */
async function setup(instances, authorized = false) {
  const state = {
    instances,
    activeInstanceId: instances.at(-1)?.id ?? null,
    focusHistory: instances.map((instance) => instance.id),
  };

  let pending;

  const definitions = {
    notes: {
      name: 'Notas',
      public: true,
      desktopShortcut: true,
    },
    resume: {
      name: 'Currículo',
      public: true,
      desktopShortcut: true,
    },
    'file-viewer': {
      name: 'Visualizador de Arquivos',
      public: true,
      desktopShortcut: false,
    },
    administration: {
      name: 'Administração',
      public: false,
      desktopShortcut: false,
    },
    games: {
      name: 'Jogos',
      public: true,
      desktopShortcut: true,
      pauseWhenMinimized: true,
    },
  };

  const ui = await renderApp(
    'src/shells/mobile/Mobile.jsx',
    {},
    {
      useSyncExternalStore() { },
      subscribeAdminSession() { },
      getAdminSessionVersion() { },
      isAdminAuthenticated: () => authorized,
      useMobilePreferences: () => ({ gridDensity: 'default' }),
      useWallpaper: () => 'default',
      useWallpaperRevision() { },
      getWallpaperDefinition: () => ({
        background: '#000',
      }),
      getRegisteredApps: () =>
        Object.entries(definitions).map(([id, app]) => ({
          id,
          ...app,
        })),
      getAppDefinition: (id) => definitions[id],
      resolveNavigationOrigin: (current, origin) => {
        if (!origin) return null;

        return current.instances.find(
          (instance) =>
            instance.id === origin.instanceId &&
            instance.appId === origin.appId,
        ) ?? null;
      },
      useSystem: () => ({
        appState: state,
        notificationState: {
          items: [],
        },
        visibleToasts: [],
        dismissToast() { },
        handleNotificationAction() { },
        run: (action, id, options) => {
          pending = {
            action,
            id,
            options,
          };

          return true;
        },
      }),
      closeApp: 'close',
      openApp: 'open',
      activateApp: 'activate',
      restoreApp: 'restore',
      Bell: 'Bell',
      MobileWeatherStatus: 'MobileWeatherStatus',
      MobileWidgets: 'MobileWidgets',
      Settings2: 'Settings2',
      X: 'X',
      AppIcon: 'AppIcon',
      AppHost: 'AppHost',
      NotificationToasts: 'NotificationToasts',
      QuickControls: 'Controls',
    },
  );

  return {
    ui,
    state,
    pending: () => pending,
  };
}

/* === UTILITÁRIOS DE TESTE === */
/* ----- Tela atual ----- */
function getScreen(ui) {
  return ui.nodes().find(
    (node) => node.props.id === 'ws-mobile',
  ).props['data-screen'];
}

/* ----- Botão de saída ----- */
function getExitButton(ui) {
  return ui.nodes().find(
    (node) =>
      node.type === 'button' &&
      node.props['aria-label'] === 'Fechar',
  );
}

/* ----- Atalho de aplicativo ----- */
function getAppButton(ui, appId) {
  return ui.nodes().find(
    (node) =>
      node.type === 'button' &&
      node.props.className === 'ws-mobile__home-app' &&
      ui.text(node).includes(appId === 'resume' ? 'Currículo' : appId),
  );
}

/* === CONTROLE DE ACESSO === */
test('Mobile não monta administração sem autenticação', async () => {
  const { ui } = await setup([
    {
      id: 'private',
      appId: 'administration',
      origin: 'shared-link',
    },
  ]);

  assert.equal(getScreen(ui), 'apps');

  assert.equal(
    ui.nodes().filter(
      (node) => node.type === 'AppHost',
    ).length,
    0,
  );

  assert.equal(ui.text().includes('Carregando'), false);

  ui.unmount();
});

/* === FECHAMENTO PROTEGIDO === */
test('Mobile mantém aplicativo aberto até confirmação do fechamento', async () => {
  const { ui, state, pending } = await setup([
    {
      id: 'draft',
      appId: 'notes',
      origin: 'shared-link',
    },
  ]);

  assert.equal(getScreen(ui), 'app');

  const exitButton = getExitButton(ui);

  assert.ok(exitButton);

  exitButton.props.onClick();

  assert.equal(pending().action, 'close');
  assert.equal(pending().id, 'draft');
  assert.equal(pending().options.animate, false);

  ui.render();

  assert.equal(getScreen(ui), 'app');

  state.instances = [];
  state.activeInstanceId = null;

  pending().options.onClosed();

  ui.render();

  assert.equal(getScreen(ui), 'apps');

  ui.unmount();
});

/* === GERENCIAMENTO DE INSTÂNCIAS === */
test('Mobile mantém instâncias ocultas e pausa jogos', async () => {
  const { ui } = await setup([
    {
      id: 'game',
      appId: 'games',
    },
    {
      id: 'note',
      appId: 'notes',
      origin: 'shared-link',
    },
  ]);

  const hosts = ui.nodes().filter(
    (node) => node.type === 'AppHost',
  );

  assert.equal(hosts.length, 2);
  assert.equal(hosts[0].props.instance.executionState, 'paused');

  const instances = ui.nodes().filter(
    (node) => node.props.className === 'ws-mobile__instance',
  );

  assert.equal(instances[0].props.inert, true);
  assert.equal(instances[1].props.inert, false);

  ui.unmount();
});

/* === RECUPERAÇÃO DA TELA INICIAL === */
test('Mobile retorna à página Aplicativos quando a instância desaparece', async () => {
  const { ui, state } = await setup([
    {
      id: 'note',
      appId: 'notes',
      origin: 'shared-link',
    },
  ]);

  assert.equal(getScreen(ui), 'app');

  state.instances = [];
  state.activeInstanceId = null;

  ui.render();

  assert.equal(getScreen(ui), 'apps');
  assert.equal(ui.text().includes('Carregando'), false);

  ui.unmount();
});

/* === NAVEGAÇÃO DO CURRÍCULO === */
test('Mobile seleciona o Visualizador confirmado ao abrir Currículo', async () => {
  const { ui, state, pending } = await setup([]);

  const resumeButton = getAppButton(ui, 'resume');

  assert.ok(resumeButton);

  resumeButton.props.onClick();

  assert.equal(pending().action, 'open');
  assert.equal(pending().id, 'resume');

  state.instances = [
    {
      id: 'viewer-1',
      appId: 'file-viewer',
      origin: 'resume',
    },
  ];

  state.activeInstanceId = 'viewer-1';

  pending().options.onOpened({
    instanceId: 'viewer-1',
    appId: 'file-viewer',
  });

  ui.render();

  assert.equal(getScreen(ui), 'app');

  const host = ui.nodes().find(
    (node) => node.type === 'AppHost',
  );

  assert.equal(host.props.instance.id, 'viewer-1');

  getExitButton(ui).props.onClick();

  assert.equal(pending().action, 'close');
  assert.equal(pending().id, 'viewer-1');
  assert.equal(pending().options.animate, false);

  ui.unmount();
});
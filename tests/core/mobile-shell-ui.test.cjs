const test = require('node:test');
const assert = require('node:assert/strict');
const { renderApp } = require('../helpers/app-ui.cjs');

/* === SHELL MOBILE COM CORE CONTROLADO === */
async function setup(instances, authorized = false) {
  const state = {
    instances,
    activeInstanceId: instances.at(-1)?.id,
    focusHistory: instances.map((item) => item.id),
  };
  let pending;
  const definitions = {
    notes: { name: 'Notas', public: true },
    resume: { name: 'Currículo', public: true },
    'file-viewer': { name: 'Visualizador de Arquivos', public: true },
    administration: { name: 'Administração', public: false },
    games: { name: 'Jogos', public: true, pauseWhenMinimized: true },
  };
  const ui = await renderApp(
    'src/shells/mobile/Mobile.jsx',
    {},
    {
      useSyncExternalStore() {},
      subscribeAdminSession() {},
      getAdminSessionVersion() {},
      isAdminAuthenticated: () => authorized,
      useMobilePreferences: () => ({ gridDensity: 'default' }),
      useWallpaper: () => 'default',
      useWallpaperRevision() {},
      getWallpaperDefinition: () => ({ background: '#000' }),
      getRegisteredApps: () => Object.entries(definitions).map(([id, app]) => ({ id, ...app })),
      getAppDefinition: (id) => definitions[id],
      useSystem: () => ({
        appState: state,
        run: (action, id, options) => {
          pending = { action, id, options };
          return false;
        },
      }),
      closeApp: 'close',
      activateApp: 'activate',
      restoreApp: 'restore',
      handleAppBack: () => false,
      resolveContextualBack: () => null,
      Bell: 'Bell',
      Settings2: 'Settings2',
      MobileHome: 'Home',
      MobileCatalog: 'Catalog',
      MobileNavigation: 'Navigation',
      AppHost: 'AppHost',
      NotificationCenter: 'Notifications',
      QuickControls: 'Controls',
    },
  );
  return { ui, state, pending: () => pending };
}

test('Mobile não seleciona nem monta administração sem sessão, mesmo ativa no Core', async () => {
  const { ui } = await setup([{ id: 'private', appId: 'administration', origin: 'shared-link' }]);
  assert.equal(
    ui.nodes().find((node) => node.props.id === 'ws-mobile').props['data-screen'],
    'home',
  );
  assert.equal(ui.nodes().filter((node) => node.type === 'AppHost').length, 0);
  assert.equal(ui.text().includes('Carregando'), false);
});

test('Mobile mantém formulário e navegação até confirmação do fechamento', async () => {
  const { ui, pending } = await setup([{ id: 'draft', appId: 'notes', origin: 'shared-link' }]);
  ui.nodes()
    .find((node) => node.type === 'Navigation')
    .props.onNavigate('catalog');
  ui.render();
  assert.equal(pending().id, 'draft');
  assert.equal(
    ui.nodes().find((node) => node.props.id === 'ws-mobile').props['data-screen'],
    'app',
  );
  pending().options.onClosed();
  ui.render();
  assert.equal(
    ui.nodes().find((node) => node.props.id === 'ws-mobile').props['data-screen'],
    'catalog',
  );
});

test('Mobile preserva instâncias ocultas e pausa jogos fora da visualização', async () => {
  const { ui } = await setup([
    { id: 'game', appId: 'games' },
    { id: 'note', appId: 'notes', origin: 'shared-link' },
  ]);
  const hosts = ui.nodes().filter((node) => node.type === 'AppHost');
  assert.equal(hosts.length, 2);
  assert.equal(hosts[0].props.instance.executionState, 'paused');
  assert.equal(
    ui.nodes().find((node) => node.props.className === 'ws-mobile__instance').props.inert,
    true,
  );
});

test('Mobile recupera Home sem carregamento permanente quando a instância desaparece', async () => {
  const { ui, state } = await setup([{ id: 'note', appId: 'notes', origin: 'shared-link' }]);
  state.instances = [];
  ui.render();
  assert.equal(
    ui.nodes().find((node) => node.props.id === 'ws-mobile').props['data-screen'],
    'home',
  );
  assert.equal(ui.text().includes('Carregando'), false);
});

/* === CONFIRMAÇÃO DO DESTINO EFETIVO DOS ATALHOS === */
test('Mobile seleciona o Visualizador confirmado ao abrir Currículo e preserva a origem do retorno', async () => {
  const { ui, state, pending } = await setup([]);
  ui.nodes()
    .find((node) => node.type === 'Home')
    .props.onOpenApp('resume');
  assert.equal(pending().id, 'resume');
  state.instances = [{ id: 'viewer-1', appId: 'file-viewer', origin: 'resume' }];
  // O callback informa a instância aplicada pelo Core, não o ID do atalho.
  state.activeInstanceId = null;
  pending().options.onOpened({ instanceId: 'viewer-1', appId: 'file-viewer' });
  ui.render();
  assert.equal(
    ui.nodes().find((node) => node.props.id === 'ws-mobile').props['data-screen'],
    'app',
  );
  assert.equal(ui.nodes().find((node) => node.type === 'AppHost').props.instance.id, 'viewer-1');
  ui.nodes()
    .find((node) => node.type === 'Navigation')
    .props.onNavigate('home');
  assert.equal(pending().id, 'viewer-1');
  assert.equal(pending().options.animate, false);
  ui.unmount();
});

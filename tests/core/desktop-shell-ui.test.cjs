const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { renderApp } = require('../helpers/app-ui.cjs');
const { loadContract } = require('../helpers/contract-loader.cjs');
const root = path.resolve(__dirname, '../..');
const icons = Object.fromEntries(
  [
    'CalendarDays',
    'ChevronLeft',
    'ChevronRight',
    'CloudSun',
    'RefreshCw',
    'Droplets',
    'Thermometer',
    'Wind',
    'ChartNoAxesCombined',
    'Code2',
    'GitFork',
    'Star',
    'Users',
    'Clock3',
  ].map((name) => [name, name]),
);
class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : ['2026-10-21T12:00:00Z']));
  }
}
function clockEnvironment() {
  const timers = new Map(),
    listeners = new Map();
  let id = 0;
  const document = {
    hidden: false,
    visibilityState: 'visible',
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const window = {
    setTimeout: (fn) => {
      timers.set(++id, fn);
      return id;
    },
    clearTimeout: (key) => timers.delete(key),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  return { document, window, timers, listeners };
}
test('evento com horário ganha data no fuso publicado sem copiar campos privados', async () => {
  const api = loadContract(
    path.join(root, 'src/services/contentService.js'),
    {
      Response,
      window: { location: { origin: 'https://ws.test' } },
      fetch: async () =>
        Response.json({
          items: [
            {
              id: 'timed',
              status: 'published',
              data: {
                title: 'Público',
                allDay: false,
                startsAt: '2026-10-22T01:00:00Z',
                timezone: 'America/Sao_Paulo',
                email: 'private@example.test',
              },
            },
          ],
        }),
    },
    { transformSource: (source) => source.replaceAll('import.meta.env.BASE_URL', "'/'") },
  );
  const result = await api.fetchManagedContent('events');
  assert.equal(result.data[0].date, '2026-10-21');
  assert.equal(Object.hasOwn(result.data[0], 'email'), false);
});
test('Calendário identifica evento público sem substituir dias ou alterar navegação', async () => {
  const env = clockEnvironment();
  const calendar = loadContract(path.join(root, 'src/features/calendar/CalendarService.js'));
  const ui = await renderApp(
    'src/features/widgets/calendar/CalendarWidget.jsx',
    {},
    {
      ...env,
      ...icons,
      ...calendar,
      Date: FixedDate,
      useCalendarEvents: () => ({
        data: [{ date: '2026-10-21', title: 'Evento público' }],
        error: false,
      }),
    },
  );
  const marked = ui.nodes().filter((n) => n.props.className?.includes('ws-calendar__day--event'));
  assert.equal(marked.length, 1);
  assert.match(marked[0].props['aria-label'], /Evento público/);
  ui.nodes()
    .find((n) => n.props['aria-label'] === 'Próximo mês')
    .props.onClick();
  ui.render();
  assert.ok(ui.button('Voltar para hoje'));
  ui.unmount();
  assert.equal(env.timers.size, 0);
});
test('Relógio usa preferências da própria instância e cancela timer quando oculto', async () => {
  const env = clockEnvironment();
  const ui = await renderApp(
    'src/features/widgets/clock/ClockWidget.jsx',
    { widget: { settings: { timeZone: 'America/Sao_Paulo' } } },
    {
      ...env,
      Date: FixedDate,
      useWidgetPreferences: () => ({
        widgets: [{ instanceId: 'clock-default', settings: { timeZone: 'UTC' } }],
      }),
    },
  );
  assert.match(ui.text(), /09:00/);
  assert.equal(env.timers.size, 1);
  env.document.hidden = true;
  env.listeners.get('visibilitychange')();
  assert.equal(env.timers.size, 0);
  env.document.hidden = false;
  env.listeners.get('visibilitychange')();
  assert.equal(env.timers.size, 1);
  ui.unmount();
  assert.equal(env.timers.size, 0);
  assert.equal(env.listeners.size, 0);
});
test('Clima aplica unidades da instância sem falhar com data de previsão inválida', async () => {
  const ui = await renderApp(
    'src/features/widgets/weather/WeatherWidget.jsx',
    {
      widget: { settings: { temperatureUnit: 'fahrenheit' } },
      weatherData: {
        weather: { temperature_2m: 0, weather_code: 0 },
        forecast: [{ date: 'invalid', weatherCode: 0 }],
        getWeatherDescription: () => 'Céu limpo',
      },
    },
    { ...icons, useWidgetPreferences: () => ({ widgets: [] }) },
  );
  assert.match(ui.text(), /32°/);
  ui.unmount();
});
test('Dev Insights não utiliza WakaTime desativado e trata nomes especiais como dados', async () => {
  const ui = await renderApp(
    'src/features/widgets/dev-insights/DevInsightsWidget.jsx',
    { widget: { settings: { showWakatime: false } } },
    {
      ...icons,
      useWidgetPreferences: () => ({ widgets: [] }),
      portfolio: { githubUser: 'public', wakatimeProxy: '/api/wakatime' },
      usePublicResource: (_load, key) =>
        key === 'github'
          ? {
              data: {
                repositories: [{ technologies: ['__proto__'], stars: 1 }],
                profile: { followers: 2 },
              },
              status: 'ready',
            }
          : { data: { languages: [{ name: 'Stale language', seconds: 100 }] }, status: 'ready' },
    },
  );
  assert.match(ui.text(), /__proto__/);
  assert.doesNotMatch(ui.text(), /Stale language|WakaTime/);
  ui.unmount();
});
test('favoritos sincronizam entre abas e avisam quando a gravação falha', async () => {
  let stored = null,
    listener,
    fail = false;
  const warnings = [];
  const props = {};
  const ui = await renderApp('src/features/launcher/useMenuPreferences.js', props, {
    localStorage: {
      getItem: () => stored,
      setItem: (_key, value) => {
        if (fail) throw Error('quota');
        stored = value;
      },
    },
    window: {
      addEventListener: (_name, fn) => {
        listener = fn;
      },
      removeEventListener: () => {
        listener = null;
      },
    },
    useSystem: () => ({ notify: (value) => warnings.push(value) }),
  });
  stored = JSON.stringify(['notes']);
  listener({ key: 'ws-os:menu-favorites' });
  ui.render();
  assert.deepEqual(Array.from(ui.render().favoriteIds), ['notes']);
  fail = true;
  ui.render().toggleFavorite('projects');
  ui.render();
  assert.equal(warnings.length, 1);
  assert.ok(ui.render().favoriteIds.includes('projects'));
  ui.unmount();
  assert.equal(listener, null);
});
test('negação síncrona de localização não deixa o clima carregando indefinidamente', async () => {
  const ui = await renderApp(
    'src/features/weather/useWeather.js',
    {},
    {
      queueMicrotask,
      navigator: {
        geolocation: {
          getCurrentPosition() {
            throw Error('SecurityError');
          },
        },
      },
    },
  );
  await ui.flush();
  const weather = ui.render();
  assert.equal(weather.weatherLoading, false);
  assert.match(weather.weatherError, /permissão/);
  ui.unmount();
});
test('atalhos globais não consomem composição ou Escape já tratado pelo aplicativo', async () => {
  let listener,
    calls = 0;
  const noop = () => {};
  const props = Object.fromEntries(
    [
      'clearWindowHighlight',
      'clearPreviewTimers',
      'setPreviewGroup',
      'setContextGroup',
      'setShortcutContext',
      'setMenuView',
      'setMenuSearch',
      'onShowDesktop',
    ].map((name) => [name, noop]),
  );
  Object.assign(props, {
    contextTriggerRef: { current: null },
    shortcutTriggerRef: { current: null },
    menuButtonRef: { current: null },
    setActivePanel: () => calls++,
  });
  const ui = await renderApp('src/features/shortcuts/useGlobalShortcuts.js', props, {
    document: {
      addEventListener: (_name, fn) => {
        listener = fn;
      },
      removeEventListener() {},
    },
  });
  listener({ key: 'Escape', defaultPrevented: true });
  listener({ key: 'Escape', isComposing: true });
  assert.equal(calls, 0);
  ui.unmount();
});

test('busca distingue falha remota de ausência de resultados e preserva conteúdo local', async () => {
  const timers = [];
  const ui = await renderApp(
    'src/features/search/GlobalSearchResults.jsx',
    { query: 'local', onOpen() {} },
    {
      Search: 'Search',
      ArrowUpRight: 'ArrowUpRight',
      setTimeout: (callback) => {
        timers.push(callback);
        return 1;
      },
      clearTimeout() {},
      portfolio: { githubUser: 'public', posts: [{ id: 'local' }], projects: [] },
      subscribePublicData: () => () => {},
      fetchGithubPortfolio: async () => {
        throw Error('offline');
      },
      fetchNotes: async () => {
        throw Error('offline');
      },
      normalizeNotes: (items) => items,
      searchContent: (_term, { posts }) =>
        posts.map((post) => ({
          key: post.id,
          label: 'Resultado local',
          appId: 'notes',
          params: { postId: post.id },
          kind: 'post',
        })),
    },
  );
  assert.match(ui.text(), /Carregando/);
  timers[0]();
  await ui.flush();
  assert.match(ui.text(), /busca remota/);
  assert.match(ui.text(), /Resultado local/);
  ui.unmount();
});

test('camada de painel restaura foco no Escape e remove observação ao desmontar', async () => {
  let focused = 0,
    dismissed = 0;
  const listeners = new Map();
  const trigger = { isConnected: true, focus: () => focused++ };
  const panel = {
    matches: () => false,
    contains: () => false,
    querySelector: () => ({ focus() {} }),
  };
  const ui = await renderApp(
    'src/features/panels/PanelLayer.jsx',
    {
      layerRef: { current: { firstElementChild: panel } },
      onDismiss: () => dismissed++,
      children: 'panel',
    },
    {
      document: {
        activeElement: trigger,
        addEventListener: (name, callback) => listeners.set(name, callback),
        removeEventListener: (name) => listeners.delete(name),
      },
    },
  );
  const layer = ui.nodes().find((n) => n.props.className === 'taskbar-floating-layer');
  const event = {
    key: 'Escape',
    target: { closest: () => null },
    preventDefault() {},
    stopPropagation() {},
  };
  layer.props.onKeyDown(event);
  assert.equal(focused, 1);
  assert.equal(dismissed, 1);
  trigger.isConnected = false;
  layer.props.onKeyDown(event);
  assert.equal(focused, 1);
  ui.unmount();
  assert.equal(listeners.size, 0);
});

test('fuso inválido salvo não derruba o relógio nem altera preferências', async () => {
  const env = clockEnvironment(),
    widget = { settings: { timeZone: 'Invalid/Zone' } };
  const ui = await renderApp(
    'src/features/widgets/clock/ClockWidget.jsx',
    { widget },
    { ...env, Date: FixedDate, useWidgetPreferences: () => ({ widgets: [] }) },
  );
  assert.ok(ui.nodes().find((n) => n.type === 'time'));
  assert.equal(widget.settings.timeZone, 'Invalid/Zone');
  ui.unmount();
});

test('miniatura não consulta conteúdo de aplicativos privados ou janela minimizada', async () => {
  let reads = 0;
  for (const instance of [
    { id: 'admin', appId: 'administration' },
    { id: 'files', appId: 'files' },
    { id: 'hidden', appId: 'projects', minimized: true },
  ]) {
    const ui = await renderApp(
      'src/shells/desktop/taskbar/TaskbarThumbnail.jsx',
      { instance },
      {
        attachRef: () => ({ append() {} }),
        document: {
          querySelector: () => {
            reads++;
            return null;
          },
        },
      },
    );
    ui.unmount();
  }
  assert.equal(reads, 0);
});
test('miniatura pública remove recursos e identificadores e é descartada ao desmontar', async () => {
  let removedSensitive = 0,
    discarded = 0,
    appended = 0;
  const clone = {
    attributes: [{ name: 'id' }, { name: 'onclick' }],
    style: {},
    querySelectorAll: (selector) =>
      selector.includes('form,') ? [{ remove: () => removedSensitive++ }] : [],
    removeAttribute() {},
  };
  const svg = {
    setAttribute() {},
    classList: { add() {} },
    append() {},
    remove: () => discarded++,
  };
  const ui = await renderApp(
    'src/shells/desktop/taskbar/TaskbarThumbnail.jsx',
    { instance: { id: 'project-1', appId: 'projects' } },
    {
      attachRef: () => ({ append: () => appended++ }),
      document: {
        querySelector: () => ({
          getBoundingClientRect: () => ({ width: 500, height: 300 }),
          cloneNode: () => clone,
        }),
        createElementNS: (_ns, name) => (name === 'svg' ? svg : { setAttribute() {}, append() {} }),
      },
    },
  );
  assert.equal(appended, 1);
  assert.equal(removedSensitive, 1);
  assert.equal(clone.inert, true);
  ui.unmount();
  assert.equal(discarded, 1);
});

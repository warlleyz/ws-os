const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const { loadContract } = require('../helpers/contract-loader.cjs');
function load(file, bindings, names) {
  if (file === 'src/services/publicDataService.js')
    return loadContract(path.join(root, file), bindings);
  const source = fs
    .readFileSync(path.join(root, file), 'utf8')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '')
    .replaceAll('import.meta.env.BASE_URL', "'/'");
  return vm.runInNewContext(`(()=>{${source};return {${names.join(',')}}})()`, {
    URL,
    AbortController,
    DOMException,
    setTimeout,
    clearTimeout,
    ...bindings,
  });
}
function urls() {
  return load(
    'src/shared/utils/urls.js',
    { window: { location: { origin: 'https://local.test' } } },
    ['safeExternalUrl', 'publicAssetUrl'],
  );
}
test('URLs rejeitam script, credenciais e arquivos oficiais fora da origem', () => {
  const m = urls();
  assert.equal(m.safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(m.safeExternalUrl('https://user:pass@test.com'), null);
  assert.equal(m.publicAssetUrl('https://remote.test/file.pdf'), null);
  assert.equal(m.publicAssetUrl('curriculo.pdf'), 'https://local.test/curriculo.pdf');
});
test('GitHub normaliza apenas repositórios públicos e links HTTPS válidos', () => {
  const m = load('src/services/githubService.js', { safeExternalUrl: urls().safeExternalUrl }, [
    'normalizeRepository',
  ]);
  const item = {
    id: 1,
    name: 'app',
    html_url: 'https://github.com/user/app',
    homepage: 'javascript:alert(1)',
    language: 'JavaScript',
    stargazers_count: 4,
  };
  assert.equal(m.normalizeRepository(item).homepage, null);
  assert.equal(m.normalizeRepository({ ...item, private: true }), null);
  assert.equal(m.normalizeRepository({ ...item, html_url: 'https://other.test/app' }), null);
  assert.equal(m.normalizeRepository(item).stars, 4);
});
test('catálogo local continua disponível sem API e substitui metadados do mesmo repositório', () => {
  const m = load('src/apps/projects/projectModel.js', { safeExternalUrl: urls().safeExternalUrl }, [
    'mergeProjects',
    'filterProjects',
  ]);
  const remote = [
    {
      id: 'github-1',
      name: 'remote',
      repository: 'https://github.com/user/app',
      technologies: ['JS'],
      stars: 2,
    },
  ];
  const result = m.mergeProjects(
    [
      {
        id: 'local',
        name: 'Aplicação',
        repository: remote[0].repository,
        description: 'Descrição',
        technologies: ['React'],
      },
    ],
    remote,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].stars, 2);
  assert.equal(result[0].name, 'Aplicação');
  assert.equal(
    m.filterProjects(result, 'aplicacao', 'React', 'name', 'pt-BR', (value) => value).length,
    1,
  );
  assert.equal(m.mergeProjects([{ id: 'a', name: 'Local' }], []).length, 1);
});
test('demos só aceitam descritores cadastrados e origens autorizadas para incorporação', () => {
  const m = load('src/apps/demo-viewer/demoModel.js', { safeExternalUrl: urls().safeExternalUrl }, [
    'resolveDemo',
  ]);
  const projects = [
    { id: 'p', demos: [{ id: 'd', url: 'https://demo.test/app', mode: 'embedded' }] },
  ];
  assert.equal(m.resolveDemo(projects, [], 'p', 'd').canEmbed, false);
  assert.equal(m.resolveDemo(projects, ['https://demo.test'], 'p', 'd').canEmbed, true);
  assert.equal(m.resolveDemo(projects, [], 'p', 'unknown'), null);
  assert.equal(
    m.resolveDemo(
      [{ id: 'p', demos: [{ id: 'd', url: 'javascript:x', mode: 'embedded' }] }],
      [],
      'p',
      'd',
    ),
    null,
  );
});
test('cancelar um consumidor não cancela a consulta compartilhada do outro', async () => {
  let complete,
    networkSignal,
    calls = 0;
  const m = load(
    'src/services/publicDataService.js',
    {
      fetch: (_url, { signal }) => {
        calls++;
        networkSignal = signal;
        return new Promise((resolve) => {
          complete = resolve;
        });
      },
    },
    ['requestPublicJson'],
  );
  const a = new AbortController(),
    b = new AbortController();
  const first = m.requestPublicJson('https://api.test/data', { signal: a.signal });
  const second = m.requestPublicJson('https://api.test/data', { signal: b.signal });
  a.abort();
  await assert.rejects(first, { name: 'AbortError' });
  assert.equal(networkSignal.aborted, false);
  complete({ ok: true, json: async () => ({ items: [1] }) });
  const result = await second;
  assert.equal(result.source, 'live');
  assert.equal(calls, 1);
  assert.equal((await m.requestPublicJson('https://api.test/data')).source, 'cache');
});
test('falha de atualização usa cache identificado e rate limit não inventa dados', async () => {
  let fail = false;
  const m = load(
    'src/services/publicDataService.js',
    {
      fetch: async () =>
        fail ? { ok: false, status: 429 } : { ok: true, json: async () => ({ count: 3 }) },
    },
    ['requestPublicJson'],
  );
  await m.requestPublicJson('/first');
  fail = true;
  const result = await m.requestPublicJson('/first', { force: true });
  assert.equal(result.source, 'cache');
  assert.ok(result.warning);
  await assert.rejects(m.requestPublicJson('/other'), /Limite/);
});
test('fechar o último consumidor cancela a requisição subjacente', async () => {
  let aborted = false;
  const m = load(
    'src/services/publicDataService.js',
    {
      fetch: (_url, { signal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('cancel', 'AbortError'));
          }),
        ),
    },
    ['requestPublicJson'],
  );
  const controller = new AbortController();
  const pending = m.requestPublicJson('/slow', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(aborted, true);
});
test('retorno interno do Mobile é registrado por instância e limpa ao desmontar', () => {
  const m = load('src/core/navigationManager.js', {}, ['registerAppBack', 'handleAppBack']);
  const remove = m.registerAppBack('a', () => true);
  m.registerAppBack('b', () => false);
  assert.equal(m.handleAppBack('a'), true);
  assert.equal(m.handleAppBack('b'), false);
  remove();
  assert.equal(m.handleAppBack('a'), false);
});

/* === Testes de navegação contextual === */
/* ----- Retorno à instância de origem ----- */
test('retorno contextual identifica a instância exata de origem', () => {
  const m = load('src/core/navigationManager.js', {}, [
    'createNavigationOrigin',
    'resolveNavigationOrigin',
    'resolveContextualBack',
  ]);

  const state = {
    instances: [
      { id: 'projects-a', appId: 'projects' },
      { id: 'projects-b', appId: 'projects' },
      { id: 'demo', appId: 'demo-viewer' },
    ],
    focusHistory: ['projects-a', 'projects-b', 'demo'],
  };

  const getAppDefinition = (id) => ({
    id,
    public: true,
  });

  const origin = m.createNavigationOrigin(state, 'projects-a');

  assert.equal(origin.instanceId, 'projects-a');
  assert.equal(origin.appId, 'projects');

  const resolved = m.resolveNavigationOrigin(state, origin);

  assert.equal(resolved.id, 'projects-a');

  const destination = m.resolveContextualBack(state, origin, getAppDefinition);

  assert.equal(destination.type, 'instance');
  assert.equal(destination.instanceId, 'projects-a');
});

/* ----- Origem encerrada ----- */
test('retorno contextual utiliza outra instância pública quando a origem foi fechada', () => {
  const m = load('src/core/navigationManager.js', {}, ['resolveContextualBack']);

  const state = {
    instances: [
      { id: 'about', appId: 'about-me' },
      { id: 'projects', appId: 'projects' },
    ],
    focusHistory: ['about', 'projects'],
  };

  const destination = m.resolveContextualBack(
    state,
    {
      instanceId: 'closed',
      appId: 'projects',
    },
    () => ({ public: true }),
  );

  assert.equal(destination.type, 'instance');
  assert.equal(destination.instanceId, 'projects');
});

/* ----- Proteção de aplicativos restritos ----- */
test('retorno contextual não seleciona aplicativos privados como fallback', () => {
  const m = load('src/core/navigationManager.js', {}, ['resolveContextualBack']);

  const state = {
    instances: [
      { id: 'admin', appId: 'administration' },
      { id: 'about', appId: 'about-me' },
    ],
    focusHistory: ['about', 'admin'],
  };

  const getAppDefinition = (appId) => ({
    public: appId !== 'administration',
  });

  const destination = m.resolveContextualBack(
    state,
    {
      instanceId: 'closed',
      appId: 'projects',
    },
    getAppDefinition,
  );

  assert.equal(destination.type, 'instance');
  assert.equal(destination.instanceId, 'about');
});

/* ----- Ausência de destino seguro ----- */
test('retorno contextual utiliza a tela inicial quando não existe destino público', () => {
  const m = load('src/core/navigationManager.js', {}, ['resolveContextualBack']);

  const state = {
    instances: [{ id: 'admin', appId: 'administration' }],
    focusHistory: ['admin'],
  };

  const destination = m.resolveContextualBack(
    state,
    {
      instanceId: 'closed',
      appId: 'projects',
    },
    () => ({ public: false }),
  );

  assert.equal(destination.type, 'home');
});

/* ----- Origem incompatível ----- */
test('retorno contextual rejeita origem cujo aplicativo não corresponde à instância', () => {
  const m = load('src/core/navigationManager.js', {}, ['resolveNavigationOrigin']);

  const state = {
    instances: [{ id: 'first', appId: 'projects' }],
    focusHistory: ['first'],
  };

  const resolved = m.resolveNavigationOrigin(state, {
    instanceId: 'first',
    appId: 'administration',
  });

  assert.equal(resolved, null);
});

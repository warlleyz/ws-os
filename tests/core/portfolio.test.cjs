const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function load(file, bindings, names) {
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

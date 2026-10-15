const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function load(file, names, globals = {}) {
  const source = fs
    .readFileSync(path.join(root, file), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/\bexport\s+/g, '');
  return vm.runInNewContext(`(()=>{${source};return {${names.join(',')}}})()`, globals);
}
test('notas só exibem publicações válidas passadas e sem duplicidade', () => {
  const { normalizeNotes } = load('src/services/notesService.js', ['normalizeNotes'], {
    contentText: (value) => (typeof value === 'string' ? value : (value?.['pt-BR'] ?? '')),
  });
  const post = {
    id: 'ola',
    title: 'Olá',
    body: '<script>literal</script>',
    publishedAt: '2020-01-01',
    status: 'published',
    tags: ['web', 42],
  };
  const result = normalizeNotes([
    post,
    post,
    { ...post, id: 'draft', status: 'draft' },
    { ...post, id: 'future', publishedAt: '2099-01-01' },
    { ...post, id: '../bad' },
    { ...post, id: 'empty', body: '' },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].body, post.body);
  assert.deepEqual(Array.from(result[0].tags), ['web']);
  assert.throws(() => normalizeNotes({}), /inválida/);
});
test('WakaTime recusa período e configuração ausente antes de chamar rede', async () => {
  const { onRequestGet } = load('functions/api/wakatime.js', ['onRequestGet'], {
    Request,
    Response,
    URL,
    fetch: () => {
      throw Error('rede inesperada');
    },
  });
  assert.equal(
    (
      await onRequestGet({
        request: new Request('https://ws.test/api/wakatime?range=arbitrary'),
        env: {},
      })
    ).status,
    400,
  );
  assert.equal(
    (await onRequestGet({ request: new Request('https://ws.test/api/wakatime'), env: {} })).status,
    503,
  );
});
test('proxy WakaTime mantém chave no header e remove dados privados', async () => {
  let called;
  const { onRequestGet } = load('functions/api/wakatime.js', ['onRequestGet'], {
    Response,
    URL,
    AbortSignal,
    btoa,
    fetch: async (url, options) => {
      called = { url, options };
      return Response.json({
        data: {
          total_seconds: 42,
          languages: [{ name: 'JavaScript', total_seconds: 42, private: 'hidden' }],
          start: '2020-01-01',
          end: '2020-01-07',
          is_up_to_date: true,
          projects: [{ name: 'private' }],
          email: 'private@example.test',
        },
      });
    },
  });
  const response = await onRequestGet({
    request: new Request('https://ws.test/api/wakatime?range=last_7_days'),
    env: { WAKATIME_API_KEY: 'test-secret' },
  });
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(called.options.headers.Authorization, /^Basic /);
  assert.ok(!called.url.includes('test-secret'));
  assert.ok(!body.includes('private'));
  assert.ok(!body.includes('test-secret'));
  assert.equal(JSON.parse(body).data.total_seconds, 42);
});
test('proxy não expõe mensagens/credenciais em erro do provedor', async () => {
  const { onRequestGet } = load('functions/api/wakatime.js', ['onRequestGet'], {
    Response,
    URL,
    AbortSignal,
    btoa,
    fetch: async () => {
      throw Error('secret-diagnostic');
    },
  });
  const response = await onRequestGet({
    request: new Request('https://ws.test/api/wakatime'),
    env: { WAKATIME_API_KEY: 'test-secret' },
  });
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('secret'));
});
test('posts exige origem Supabase e consulta somente colunas públicas publicadas', async () => {
  let called;
  const { onRequestGet } = load('functions/api/posts.js', ['onRequestGet'], {
    Response,
    URL,
    URLSearchParams,
    AbortSignal,
    fetch: async (url, options) => {
      called = { url, options };
      return Response.json([
        {
          id: 'one',
          title: 'Hello',
          summary: '',
          body: 'Body',
          tags: [],
          published_at: '2020-01-01',
          private: 'discard',
        },
      ]);
    },
  });
  assert.equal(
    (
      await onRequestGet({
        env: { SUPABASE_URL: 'https://evil.test', SUPABASE_ANON_KEY: 'test-anon' },
      })
    ).status,
    503,
  );
  const response = await onRequestGet({
    env: { SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  });
  assert.equal(response.status, 200);
  assert.equal(called.url.searchParams.get('status'), 'eq.published');
  assert.match(called.url.searchParams.get('published_at'), /^lte\./);
  assert.equal(called.url.searchParams.get('limit'), '200');
  assert.ok(!called.url.searchParams.get('select').includes('*'));
  assert.ok(!(await response.text()).includes('private'));
});

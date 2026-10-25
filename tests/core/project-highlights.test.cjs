const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadContract } = require('../helpers/contract-loader.cjs');
const { renderApp } = require('../helpers/app-ui.cjs');
const root = path.resolve(__dirname, '../..');
const validation = loadContract(path.join(root, 'src/shared/utils/contractValidation.js'));
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' };

function service(requestPublicJson) {
  return vm.runInNewContext(fs.readFileSync(path.join(root, 'src/services/projectHighlightService.js'), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '').replace(/export /g, '') + ';({fetchProjectHighlights,applyProjectHighlights})',
    { ...validation, requestPublicJson });
}
function backend({ admin = true, failWrite = false, rows } = {}) {
  let row = { id: 'default', repository_ids: ['github-1'], historical_data: { preserved: true } };
  const calls = [];
  const api = loadContract(path.join(root, 'functions/api/projectHighlights.js'), {
    Response, Headers, Request, AbortSignal, Uint8Array, console: { error() {} },
    fetch: async (address, options = {}) => {
      const url = new URL(address); calls.push({ url, options });
      if (url.pathname === '/auth/v1/user') return Response.json({ id: 'admin' });
      if (url.pathname === '/rest/v1/admin_users') return Response.json(admin ? [{ user_id: 'admin' }] : []);
      assert.equal(url.pathname, '/rest/v1/project_highlights');
      if (options.method === 'POST') {
        if (failWrite) return Response.json({}, { status: 503 });
        const input = JSON.parse(options.body);
        assert.deepEqual(Object.keys(input).sort(), ['id', 'repository_ids']);
        row = { ...row, ...input };
      }
      return Response.json(rows ?? [row]);
    },
  });
  const request = (method = 'GET', body, route = '/api/admin/project-highlights') => api.onRequest({ env,
    request: new Request('https://ws.test' + route, { method, headers: { Authorization: 'Bearer valid' },
      ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    }),
  });
  return { request, calls, row: () => row };
}

/* === Fluxo de destaques com autorização e persistência controladas === */
test('API pública e administrativa consultam a tabela e retornam somente IDs', async () => {
  const api = backend();
  for (const route of ['/api/project-highlights', '/api/admin/project-highlights']) {
    const response = await api.request('GET', undefined, route);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { repositoryIds: ['github-1'] });
    assert.equal(api.calls.at(-1).url.searchParams.get('select'), 'repository_ids');
  }
});

test('salvar, recuperar e remover destaques conserva dados históricos e metadados GitHub', async () => {
  const api = backend();
  const data = service(async () => ({ source: 'live', data: await (await api.request('GET', undefined, '/api/project-highlights')).json() }));
  const projects = [{ id: 'github-1', name: 'Original', technologies: ['Java'], stars: 7 }, { id: 'github-2', name: 'Outro', technologies: ['JS'] }];
  assert.equal((await api.request('PUT', { repositoryIds: ['github-2'] })).status, 200);
  const response = await data.fetchProjectHighlights();
  const result = data.applyProjectHighlights(projects, response.data.repositoryIds);
  assert.equal(result[0].featured, false); assert.equal(result[1].featured, true);
  assert.equal(result[0].stars, 7); assert.equal(result[0].name, 'Original');
  assert.equal(projects[0].featured, undefined);
  assert.equal(api.row().historical_data.preserved, true);
  assert.equal((await api.request('PUT', { repositoryIds: [] })).status, 200);
  assert.deepEqual(await (await api.request('GET', undefined, '/api/project-highlights')).json(), { repositoryIds: [] });
});

test('API rejeita IDs inválidos, duplicados, corpos excessivos e campos não suportados', async () => {
  const api = backend();
  for (const body of [{ repositoryIds: ['github-1', 'github-1'] }, { repositoryIds: ['../x'] },
    { repositoryIds: Array.from({ length: 1001 }, (_, i) => 'github-' + i) }, { repositoryIds: null },
    { repositoryIds: [], unexpected: {} }, [], null, '{']) {
    assert.equal((await api.request('PUT', body)).status, 400);
  }
  assert.equal((await api.request('PUT', ' '.repeat(16001))).status, 413);
  assert.equal(api.calls.some(call => call.options.method === 'POST'), false);
});

test('escrita exige administrador e erro não apaga a seleção anterior', async () => {
  const denied = backend({ admin: false });
  assert.equal((await denied.request('PUT', { repositoryIds: [] })).status, 403);
  assert.equal(denied.calls.some(call => call.options.method === 'POST'), false);
  const failed = backend({ failWrite: true });
  assert.equal((await failed.request('PUT', { repositoryIds: [] })).status, 502);
  assert.deepEqual(failed.row().repository_ids, ['github-1']);
  assert.equal((await failed.request('PUT', { repositoryIds: [] }, '/api/project-highlights')).status, 405);
});

test('respostas inválidas não viram destaques e lista vazia é reconhecida', async () => {
  const invalid = backend({ rows: [{ repository_ids: ['invalid'] }] });
  assert.equal((await invalid.request()).status, 502);
  const empty = backend({ rows: [] });
  assert.deepEqual(await (await empty.request()).json(), { repositoryIds: [] });
  await assert.rejects(service(async () => ({ data: { repositoryIds: ['invalid'] } })).fetchProjectHighlights());
  const projects = [{ id: 'github-1', name: 'Original', featured: true }];
  assert.equal(service().applyProjectHighlights(projects, null)[0].featured, false);
});

test('Administração preserva seleção em falha, salva somente IDs e atualiza o catálogo', async () => {
  const api = backend(); let fail = true; let invalidations = 0; const bodies = [];
  const bindings = {
    ...validation, useUnsavedChanges() {},
    fetchGithubPortfolio: async () => ({ data: { repositories: [{ id: 'github-1', name: 'Original' }, { id: 'github-2', name: 'Outro' }] } }),
    getAdminAccessToken: () => 'valid', getAdminSessionVersion: () => 1, invalidateAdminSession() {},
    createAdminRequestScope: signal => ({ ok: true, signal, isCurrent: () => true, dispose() {} }),
    invalidatePublicData: prefix => { assert.equal(prefix, '/api/project-highlights'); invalidations++; },
    TextEncoder,
    executeJsonRequest: async (_url, options) => {
      if (options.method === 'PUT') { bodies.push(JSON.parse(options.body)); if (fail) throw Error('Falha de rede'); }
      const response = await api.request(options.method, options.body);
      return { response, payload: await response.json() };
    },
  };
  const ui = await renderApp('src/apps/administration/AdminProjects.jsx', { instanceId: 'admin', authorized: true }, bindings);
  await ui.flush();
  const checkboxes = () => ui.nodes().filter(n => n.type === 'input' && n.props.type === 'checkbox');
  assert.equal(checkboxes()[0].props.checked, true);
  checkboxes()[0].props.onChange(); ui.render();
  await ui.button('Salvar').props.onClick(); ui.render();
  assert.match(ui.text(), /Falha de rede/); assert.equal(checkboxes()[0].props.checked, false); assert.equal(invalidations, 0);
  fail = false; await ui.button('Salvar').props.onClick(); ui.render();
  assert.equal(invalidations, 1); assert.match(ui.text(), /Destaques salvos/);
  assert.deepEqual(bodies.at(-1), { repositoryIds: [] });
  checkboxes()[1].props.onChange(); ui.render(); await ui.button('Salvar').props.onClick(); ui.render();
  assert.deepEqual(api.row().repository_ids, ['github-2']);
  assert.equal(invalidations, 2);
  ui.unmount();
  const reopened = await renderApp('src/apps/administration/AdminProjects.jsx', { instanceId: 'admin2', authorized: true }, bindings);
  await reopened.flush();
  assert.equal(reopened.nodes().filter(n => n.type === 'input' && n.props.type === 'checkbox')[1].props.checked, true);
  reopened.unmount();
});

test('migração de permissões mantém dados e concede somente as colunas públicas necessárias', () => {
  const sql = fs.readFileSync(path.join(root, 'database/migrations/014_project_highlights_only.sql'), 'utf8');
  assert.match(sql, /GRANT SELECT \(id, repository_ids\)/);
  assert.doesNotMatch(sql, /\b(DROP|DELETE|TRUNCATE)\b/i);
});

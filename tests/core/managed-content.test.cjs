const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs
  .readFileSync(path.join(__dirname, '../../functions/api/managedContent.js'), 'utf8')
  .replace(/^import .*;$/gm, '')
  .replace(/export /g, '');
function load(
  authorized = true,
  rows = [
    {
      id: 'one',
      data: { title: 'Evento' },
      status: 'published',
      updated_at: '2026-10-18T00:00:00Z',
    },
  ],
) {
  const calls = [];
  const api = vm.runInNewContext(
    '(()=>{' + source + ';return {onRequest,validateManagedContent}})()',
    {
      ...require('../helpers/contract-loader.cjs').loadContract(
        path.join(__dirname, '../../src/shared/utils/contractValidation.js'),
      ),
      URL,
      Response,
      AbortSignal,
      TextDecoder,
      Uint8Array,
      requireAdministrator: async () => ({
        authorized,
        response: Response.json({ error: 'DENIED' }, { status: 403 }),
      }),
      fetch: async (url, options) => {
        calls.push({ url: String(url), options });
        return Response.json(rows);
      },
    },
  );
  return { ...api, calls };
}
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' };
test('conteúdo administrativo exige autorização e público só consulta publicados', async () => {
  const denied = load(false);
  assert.equal(
    (
      await denied.onRequest({
        request: new Request('https://test/api/admin/content?kind=events'),
        env,
      })
    ).status,
    403,
  );
  assert.equal(denied.calls.length, 0);
  const api = load();
  const result = await api.onRequest({
    request: new Request('https://test/api/content?kind=events'),
    env,
  });
  assert.equal(result.status, 200);
  assert.match(api.calls[0].url, /status=eq.published/);
  assert.equal(api.calls[0].options.headers.Authorization, 'Bearer anon');
});
test('catálogo recusa APIs, traversal e esquemas arbitrários; eventos validam data e HTTPS', () => {
  const { validateManagedContent: validate } = load();
  for (const url of [
    'api/auth/me',
    '../private.txt',
    'documents/../a.pdf',
    'https://evil.test/a.pdf',
    'documents/a.svg',
  ])
    assert.throws(() => validate('files', { title: 'Arquivo', url }));
  assert.equal(
    validate('files', { title: 'Currículo', url: 'documents/curriculo-warlley.pdf' }).url,
    'documents/curriculo-warlley.pdf',
  );
  assert.throws(() => validate('events', { title: 'E', date: '2026-02-30' }));
  assert.throws(() =>
    validate('events', { title: 'E', date: '2026-10-18', url: 'javascript:alert(1)' }),
  );
});
test('edição exige revisão, limita corpo e retorna conflito sem sobrescrever', async () => {
  const api = load(true, []),
    payload = { id: 'one', status: 'draft', data: { title: 'Evento', date: '2026-10-18' } };
  const send = (body) =>
    api.onRequest({
      request: new Request('https://test/api/admin/content?kind=events', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test' },
        body: JSON.stringify(body),
      }),
      env,
    });
  assert.equal((await send(payload)).status, 400);
  assert.equal(api.calls.length, 0);
  assert.equal((await send({ ...payload, updatedAt: '2026-10-18T00:00:00Z' })).status, 409);
  assert.match(api.calls[0].url, /updated_at=eq/);
  assert.equal((await send({ ...payload, data: { title: 'a'.repeat(9000) } })).status, 400);
});

/* === Confirmação de identidade nas mutações === */
test('POST, PATCH e DELETE confirmam o ID validado do corpo, nunca da query', async () => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    for (const returnedId of ['one', 'other']) {
      const api = load(true, [{ id: returnedId, status: 'draft' }]);
      const response = await api.onRequest({
        request: new Request('https://test/api/admin/content?kind=events&id=other', {
          method,
          body: JSON.stringify({
            id: 'one',
            updatedAt: '2026-10-18T00:00:00Z',
            status: 'draft',
            data: { title: 'Evento', date: '2026-10-18' },
          }),
        }),
        env,
      });
      assert.equal(response.status, returnedId === 'one' ? 200 : 409, method);
      if (method !== 'POST')
        assert.equal(new URL(api.calls[0].url).searchParams.get('id'), 'eq.one');
    }
    for (const rows of [[], [{ id: 'one' }, { id: 'one' }]]) {
      const api = load(true, rows);
      const result = await api.onRequest({
        request: new Request('https://test/api/admin/content?kind=events', {
          method,
          body: JSON.stringify({
            id: 'one',
            updatedAt: '2026-10-18T00:00:00Z',
            status: 'draft',
            data: { title: 'Evento', date: '2026-10-18' },
          }),
        }),
        env,
      });
      assert.equal(result.status, 409);
    }
  }
});

test('eventos com horário preservam fuso e recusam datas impossíveis ou dados privados', () => {
  const { validateManagedContent: validate } = load();
  const event = {
    title: 'Evento',
    date: '2026-10-20',
    allDay: false,
    startsAt: '2026-10-20T13:00:00Z',
    timezone: 'America/Sao_Paulo',
  };
  assert.equal(validate('events', event).allDay, false);
  assert.throws(() => validate('events', { ...event, startsAt: '2026-02-30T13:00:00Z' }));
  assert.throws(() => validate('events', { ...event, timezone: 'Invalid/Zone' }));
  assert.throws(() => validate('events', { ...event, email: 'private@test.dev' }));
  assert.equal(validate('files', { title: 'Oficial', resourceId: 'file-1' }).resourceId, 'file-1');
  assert.throws(() =>
    validate('files', { title: 'Oficial', resourceId: 'file-1', url: 'documents/x.pdf' }),
  );
});

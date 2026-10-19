const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

/* === Sessão real em ambiente de rede e relógio isolados === */
function loadAuth(fetchMock) {
  let now = 1000,
    nextId = 0;
  const timers = new Map();
  const api = require('../helpers/contract-loader.cjs').loadContract(
    path.resolve(__dirname, '../../src/services/authService.js'),
    {
      fetch: fetchMock,
      Date: { now: () => now },
      setTimeout: (callback, delay) => {
        const id = ++nextId;
        timers.set(id, { callback, at: now + delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  );
  return {
    ...api,
    expire: () => {
      now += 2000;
      for (const [id, timer] of [...timers])
        if (timer.at <= now) {
          timers.delete(id);
          timer.callback();
        }
    },
  };
}

test('login guarda token só na memória, expira e notifica os consumidores', async () => {
  const api = loadAuth(async () => Response.json({ access_token: 'admin-token', expires_in: 1 }));
  let notifications = 0;
  api.subscribeAdminSession(() => notifications++);
  await api.loginAdmin('admin@example.test', 'test-password');
  assert.equal(api.getAdminAccessToken(), 'admin-token');
  api.expire();
  assert.equal(api.getAdminAccessToken(), null);
  assert.equal(notifications, 2);
});

test('logout invalida imediatamente mesmo quando o servidor falha', async () => {
  const api = loadAuth(async (url) =>
    url.endsWith('/login')
      ? Response.json({ access_token: 'admin-token', expires_in: 3600 })
      : Response.json({ error: 'Falha remota' }, { status: 502 }),
  );
  await api.loginAdmin('admin@example.test', 'test-password');
  assert.equal(await api.logoutAdmin(), false);
  assert.equal(api.getAdminAccessToken(), null);
});

test('login pendente não reautentica depois do logout', async () => {
  let resolve;
  const api = loadAuth(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = api.loginAdmin('admin@example.test', 'test-password');
  await api.logoutAdmin();
  resolve(Response.json({ access_token: 'late-token', expires_in: 3600 }));
  await assert.rejects(pending, /cancelada/);
  assert.equal(api.getAdminAccessToken(), null);
});

test('verificação antiga não apaga uma sessão nova', async () => {
  let resolve;
  let counter = 0;
  const api = loadAuth((url) =>
    url.endsWith('/me')
      ? new Promise((done) => {
          resolve = done;
        })
      : Promise.resolve(Response.json({ access_token: `token-${++counter}`, expires_in: 3600 })),
  );
  await api.loginAdmin('admin@example.test', 'test-password');
  const pending = api.verifyAdminSession();
  await api.loginAdmin('admin@example.test', 'test-password');
  resolve(Response.json({ error: 'Expirada' }, { status: 403 }));
  assert.equal(await pending, false);
  assert.equal(api.getAdminAccessToken(), 'token-2');
});

test('respostas de login inválidas não criam sessão', async () => {
  for (const expires_in of [-1, '3600', null]) {
    const api = loadAuth(async () => Response.json({ access_token: 'token', expires_in }));
    await assert.rejects(api.loginAdmin('admin@example.test', 'test-password'), /inválida/);
    assert.equal(api.getAdminAccessToken(), null);
  }
});

test('resposta não autorizada invalida apenas a sessão correspondente', async () => {
  const api = loadAuth(async () => Response.json({ access_token: 'token', expires_in: 3600 }));
  await api.loginAdmin('admin@example.test', 'password');
  const oldVersion = api.getAdminSessionVersion();
  await api.loginAdmin('admin@example.test', 'password');
  api.invalidateAdminSession(oldVersion);
  assert.equal(api.getAdminAccessToken(), 'token');
  api.invalidateAdminSession(api.getAdminSessionVersion());
  assert.equal(api.getAdminAccessToken(), null);
});

/* === Escopos e isolamento dos observadores === */
test('mudança de sessão cancela operação privilegiada e não divulga token em escopo', async () => {
  const api = loadAuth(async () =>
    Response.json({ access_token: 'private-token', expires_in: 3600 }),
  );
  await api.loginAdmin('admin@test.dev', 'password');
  const scope = api.createAdminRequestScope();
  assert.equal(scope.ok, true);
  assert.equal(scope.isCurrent(), true);
  assert.equal(scope.accessToken, undefined);
  await api.logoutAdmin();
  assert.equal(scope.signal.aborted, true);
  assert.equal(scope.isCurrent(), false);
  scope.dispose();
});
test('observador com falha não impede expiração ou aviso a outros consumidores', async () => {
  const api = loadAuth(async () => Response.json({ access_token: 'token', expires_in: 1 }));
  let calls = 0;
  api.subscribeAdminSession(() => {
    throw Error('broken subscriber');
  });
  api.subscribeAdminSession(() => calls++);
  await api.loginAdmin('admin@test.dev', 'password');
  api.expire();
  assert.equal(calls, 2);
  assert.equal(api.getAdminAccessToken(), null);
});

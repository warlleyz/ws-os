const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadAuth(fetchMock) {
  let now = 1000;
  let timer;
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../src/services/authService.js'),
    'utf8',
  );
  const api = vm.runInNewContext(
    `(() => {
    ${source.replace(/\bexport\s+/g, '')}
    return { loginAdmin, logoutAdmin, getAdminAccessToken, verifyAdminSession,
      subscribeAdminSession, getAdminSessionVersion, invalidateAdminSession };
  })()`,
    {
      fetch: fetchMock,
      Date: { now: () => now },
      setTimeout: (callback) => {
        timer = callback;
        return 1;
      },
      clearTimeout: () => {
        timer = null;
      },
    },
  );
  return {
    ...api,
    expire: () => {
      now += 2000;
      timer();
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

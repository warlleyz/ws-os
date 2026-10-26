const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');
const { renderApp } = require('../helpers/app-ui.cjs');
const root = path.resolve(__dirname, '../..');
const commands = loadContract(path.join(root, 'src/apps/terminal/terminalCommands.js'));
const submit = (ui) =>
  ui
    .nodes()
    .find((n) => n.type === 'form')
    .props.onSubmit({ preventDefault() {} });

/* === Terminal: conteúdo sensível e origem de navegação === */
test('login com aspas, espaços ou parser inválido nunca conserva argumentos', () => {
  for (const value of [
    'login private@example.test secret',
    '  LOGIN secret',
    '"login" secret',
    "'lo'gin \"secret",
    'login "unclosed',
  ])
    assert.equal(commands.safeTerminalCommand(value), 'login');
  assert.equal(commands.safeTerminalCommand('echo public'), 'echo public');
});
async function terminal(extra = {}) {
  return renderApp(
    'src/apps/terminal/Terminal.jsx',
    { instance: { id: 'terminal-exact' } },
    {
      ...commands,

      /* === Dependências da navegação virtual === */
      createPortfolioTree: () => new Map(),
      normalizePortfolioPath: (_current, target) => target,
      listPortfolioPath: () => [],
      readPortfolioPath: () => '',
      isPortfolioDirectory: () => true,
      fetchGithubPortfolio: async () => ({
        data: { repositories: [] },
      }),

      getRegisteredApps: () => [{ id: 'notes', name: 'Notas', public: true, implemented: true }],
      useSystem: () => ({ run() {}, appState: { instances: [] } }),
      canCloseApp: () => true,
      isAdminAuthenticated: () => false,
      subscribeAdminSession: () => () => {},
      verifyAdminSession: async () => false,
      loginAdmin: async () => true,
      logoutAdmin: async () => true,
      window: { confirm: () => true },
      ...extra,
    },
  );
}
test('Terminal exibe login sanitizado e não o recupera no histórico', async () => {
  const ui = await terminal();
  ui.nodes()
    .find((n) => n.type === 'input')
    .props.onChange({ target: { value: '  "login" private@example.test secret' } });
  ui.render();
  await submit(ui);
  ui.render();
  assert.doesNotMatch(ui.text(), /private@example|secret/);
  ui.nodes()
    .find((n) => n.type === 'input' && n.props.maxLength === 512)
    .props.onKeyDown({ key: 'ArrowUp', preventDefault() {} });
  ui.render();
  assert.equal(
    ui.nodes().find((n) => n.type === 'input' && n.props.maxLength === 512).props.value,
    '',
  );
  ui.unmount();
});
test('Terminal preserva a instância de origem ao abrir aplicativo público', async () => {
  const calls = [];
  const ui = await terminal({
    useSystem: () => ({ appState: { instances: [] }, run: (...args) => calls.push(args) }),
  });
  ui.nodes()
    .find((n) => n.type === 'input')
    .props.onChange({ target: { value: 'open notes' } });
  ui.render();
  await submit(ui);
  assert.equal(calls[0][2].originInstanceId, 'terminal-exact');
  ui.unmount();
});

/* === Ciclo privado compartilhado, com cancelamento e confirmação da sessão === */
test('recurso administrativo limpa dados privados e aborta operação ao expirar sessão', async () => {
  let listener,
    version = 1;
  const props = {
    authorized: true,
    instanceId: 'admin-1',
    dirty: true,
    loadPage: async () => ({ items: [{ email: 'private@example.test' }], nextOffset: null }),
  };
  const ui = await renderApp('src/apps/administration/useAdministrativeResource.js', props, {
    getAdminSessionVersion: () => version,
    subscribeAdminSession: (callback) => {
      listener = callback;
      return () => {};
    },
    useUnsavedChanges() {},
  });
  await ui.render().load();
  assert.equal(ui.render().items.length, 1);
  let signal, resolve;
  const pending = ui.render().perform((value) => {
    signal = value;
    return new Promise((done) => {
      resolve = done;
    });
  });
  version++;
  listener();
  props.authorized = false;
  ui.render();
  resolve({ success: true });
  assert.equal(await pending, null);
  assert.equal(signal.aborted, true);
  assert.equal(ui.render().items.length, 0);
  ui.unmount();
});
function resource(items = []) {
  return {
    items,
    offset: 0,
    nextOffset: null,
    busy: false,
    message: '',
    load: async () => {},
    perform: async (operation) => {
      try {
        return await operation(new AbortController().signal);
      } catch {
        return null;
      }
    },
  };
}
const requestContracts = loadContract(path.join(root, 'src/services/privateRequestContract.js'));
const record = {
  id: 'request-one',
  type: 'message',
  name: 'Pessoa privada',
  email: 'private@example.test',
  message: 'Mensagem privada exclusiva.',
  requestedAt: null,
  timezone: null,
  status: 'new',
  revision: 1,
  createdAt: '2026-10-21T10:00:00Z',
  updatedAt: '2026-10-21T10:00:00Z',
  idempotencyKey: '12345678-1234-4234-8234-123456789abc',
};
test('solicitação usa revisão e não cria evento; sessão encerrada oculta dados privados', async () => {
  const props = { authorized: true, instanceId: 'admin-1' },
    calls = [];
  const ui = await renderApp('src/apps/administration/AdminRequests.jsx', props, {
    ...requestContracts,
    useAdministrativeResource: ({ authorized }) => resource(authorized ? [record] : []),
    window: { confirm: () => true },
    updatePrivateRequest: async (body) => {
      calls.push(body);
      return { item: { ...record, status: body.status, revision: 2 } };
    },
  });
  ui.nodes()
    .find((n) => n.type === 'button' && ui.text(n).includes(record.name))
    .props.onClick();
  ui.render();
  props.authorized = false;
  ui.render();
  assert.doesNotMatch(ui.text(), /private@example/);
  props.authorized = true;
  ui.render();
  ui.nodes()
    .find((n) => n.type === 'select')
    .props.onChange({ target: { value: 'in_review' } });
  ui.render();
  await submit(ui);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
    id: record.id,
    revision: 1,
    status: 'in_review',
  });
  ui.unmount();
});
test('arquivo oficial retoma o mesmo identificador após confirmação perdida no upload', async () => {
  const attachmentContract = loadContract(
    path.join(root, 'src/services/storage/noteAttachmentContract.js'),
  );
  const managedContract = loadContract(
    path.join(root, 'src/services/storage/managedFileContract.js'),
  );
  let item = null,
    creates = 0,
    uploads = 0;
  const ui = await renderApp(
    'src/apps/administration/AdminFiles.jsx',
    { authorized: true, instanceId: 'admin-1' },
    {
      ...attachmentContract,
      ...managedContract,
      isValidRevision: (value) => Number.isSafeInteger(value) && value > 0,
      useAdministrativeResource: () => resource(),
      crypto: { randomUUID: () => 'stable-file' },
      getOfficialFile: async () => {
        if (!item) throw Object.assign(Error(), { code: 'NOT_FOUND' });
        return { item };
      },
      createOfficialFile: async (input) => {
        creates++;
        item = {
          resourceId: input.id,
          name: input.name,
          size: input.size,
          mimeType: input.mimeType,
          purpose: 'catalog',
          visibility: 'private',
          state: 'pending',
          revision: 1,
        };
        return { item };
      },
      uploadOfficialFile: async () => {
        uploads++;
        item = { ...item, state: 'available', revision: 2 };
        throw Error('lost confirmation');
      },
    },
  );
  ui.nodes()
    .find((n) => n.type === 'input')
    .props.onChange({
      target: { files: [{ name: 'official.pdf', type: 'application/pdf', size: 12 }] },
    });
  ui.render();
  await submit(ui);
  ui.render();
  assert.ok(ui.button('Enviar arquivo oficial'));
  await submit(ui);
  ui.render();
  assert.equal(creates, 1);
  assert.equal(uploads, 1);
  assert.equal(ui.button('Enviar arquivo oficial'), undefined);
  ui.unmount();
});
test('moderação exige confirmação e inclui a pontuação observada', async () => {
  const calls = [],
    row = { game: 'snake', alias: 'Player', score: 5, visitorHash: 'a'.repeat(64) };
  let confirmed = false;
  const ui = await renderApp(
    'src/apps/administration/AdminRankings.jsx',
    { authorized: true, instanceId: 'admin-1' },
    {
      useAdministrativeResource: () => resource([row]),
      window: { confirm: () => confirmed },
      deleteAdministrativeScore: async (body) => {
        calls.push(body);
        return { deleted: true };
      },
    },
  );
  await ui.button('Excluir').props.onClick();
  assert.equal(calls.length, 0);
  confirmed = true;
  await ui.button('Excluir').props.onClick();
  assert.equal(calls[0].score, 5);
  assert.equal(calls[0].confirm, true);
  ui.unmount();
});

/* === Wally preserva o rascunho novo e limites de respostas externas === */
test('resposta do Wally não apaga outra pergunta digitada enquanto aguardava', async () => {
  let resolve;
  const icons = Object.fromEntries(
    [
      'ArrowUp',
      'Bot',
      'CheckCircle2',
      'ExternalLink',
      'LoaderCircle',
      'MessageSquare',
      'ShieldCheck',
      'Sparkles',
      'Square',
      'Trash2',
    ].map((name) => [name, name]),
  );
  const ui = await renderApp(
    'src/apps/wally-extended/WallyExtended.jsx',
    { instance: { id: 'wally-1' } },
    {
      ...icons,
      useSharedWallyConversation: () => ({
        messages: [],
        status: 'idle',
        provider: 'local',
        remoteEnabled: false,
        lastError: null,
        maxQuestionLength: 1000,
        sendMessage: () =>
          new Promise((done) => {
            resolve = done;
          }),
      }),
    },
  );
  const input = () => ui.nodes().find((n) => n.type === 'textarea');
  input().props.onChange({ target: { value: 'Primeira pergunta' } });
  ui.render();
  submit(ui);
  input().props.onChange({ target: { value: 'Próxima pergunta preservada' } });
  ui.render();
  resolve(true);
  await ui.flush();
  assert.equal(input().props.value, 'Próxima pergunta preservada');
  ui.unmount();
});
test('resposta remota acima do limite não é apresentada como Gemini válido', async () => {
  const api = loadContract(path.join(root, 'src/services/wallyRemoteService.js'), {
    fetch: async () => Response.json({ message: 'x'.repeat(4001) }),
  });
  await assert.rejects(
    api.askWallyRemote({ question: 'public', turnstileToken: 'test' }),
    /EMPTY_RESPONSE/,
  );
});

test('editor de eventos preserva formulário quando o servidor confirma outro identificador', async () => {
  const calls = [],
    transport = loadContract(path.join(root, 'src/services/httpRequestContract.js'), {
      fetch: async (_url, options) => {
        calls.push(JSON.parse(options.body));
        return Response.json({
          items: [
            {
              id: 'another',
              data: { title: 'Outro' },
              status: 'draft',
              updatedAt: '2026-10-21T10:00:00Z',
            },
          ],
        });
      },
    });
  const ui = await renderApp(
    'src/apps/administration/AdminContent.jsx',
    { kind: 'events', authorized: true, instanceId: 'admin-1' },
    {
      ...transport,
      getAdminAccessToken: () => 'token',
      getAdminSessionVersion: () => 1,
      createAdminRequestScope: (signal) => ({
        ok: true,
        signal,
        isCurrent: () => true,
        dispose() {},
      }),
      subscribeAdminSession: () => () => {},
      useUnsavedChanges() {},
      crypto: { randomUUID: () => 'same-event' },
      invalidatePublicData() {},
      window: { confirm: () => true },
    },
  );
  ui.button('Novo conteúdo').props.onClick();
  ui.render();
  ui.nodes()
    .find((n) => n.type === 'input')
    .props.onChange({ target: { value: 'Evento preservado' } });
  ui.render();
  await submit(ui);
  ui.render();
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.value, 'Evento preservado');
  await submit(ui);
  assert.equal(calls[0].id, calls[1].id);
  ui.unmount();
});

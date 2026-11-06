const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderApp } = require('../helpers/app-ui.cjs');
const read = (file) => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');

/* === RESPOSTAS LOCAIS E ATALHOS === */
test('Habilidades utiliza conteúdo real do currículo nos dois idiomas e oferece aplicativos públicos', async () => {
  const { localWallyAnswer } = await import('../../src/services/wallyService.js');
  const { portfolio, contentText } = await import('../../src/content/portfolioContent.js');
  for (const [locale, question] of [
    ['pt-BR', 'Quais tecnologias o desenvolvedor utiliza?'],
    ['en', 'Which technologies does the developer use?'],
  ]) {
    const response = localWallyAnswer(question, '', locale, portfolio);
    assert.match(response.message, /Java/);
    assert.match(response.message, /Spring Boot/);
    assert.deepEqual(
      response.actions.map((action) => action.appId),
      ['about-me', 'resume'],
    );
    assert.doesNotMatch(response.message, /modo local|local mode/);
    for (const question of locale === 'en'
      ? [
          'Which projects?',
          'Where is the resume?',
          'How can I contact you?',
          'Settings',
          'Dev Insights',
          'Notes',
          'Calculator',
          'Terminal',
        ]
      : [
          'Projetos',
          'Currículo',
          'Contato',
          'Configurações',
          'Dev Insights',
          'Notas',
          'Calculadora',
          'Terminal',
        ]) {
      assert.equal(
        localWallyAnswer(
          question,
          contentText(portfolio.profile.summary, locale),
          locale,
          portfolio,
        ).actions[0].type,
        'open-app',
      );
    }
    assert.equal(localWallyAnswer('admin projects password', '', locale).actions.length, 0);
  }
});

/* === FORMATAÇÃO SEM HTML EXECUTÁVEL === */
test('mensagens preservam texto não confiável e só transformam links HTTP e negrito', async () => {
  const ui = await renderApp(
    'src/features/wally/WallyMessageText.jsx',
    {
      text: '<img src=x onerror=alert(1)> [segredo](javascript:alert) **Olá** https://example.test/path.',
    },
    { Fragment: 'Fragment' },
  );
  assert.equal(ui.nodes().filter((node) => node.type === 'img').length, 0);
  assert.equal(ui.nodes().filter((node) => node.type === 'strong').length, 1);
  assert.match(ui.text(), /javascript:alert/);
  const link = ui.nodes().find((node) => typeof node.type === 'function');
  assert.equal(link.props.href, 'https://example.test/path');
});

/* === CONCORRÊNCIA E CANCELAMENTO === */
function conversation() {
  const slots = [];
  let cursor = 0;
  let resolveRemote;
  let remoteArgs;
  const source = read('src/features/wally/useWallyConversation.js')
    .replace(/^import[\s\S]*?;\s*$/gm, '')
    .replace('import.meta.env.VITE_WALLY_REMOTE_ENABLED', "'true'")
    .replace('export default function', 'function');
  const hook = vm.runInNewContext(source + ';useWallyConversation', {
    useLocale: () => 'en',
    useRef(value) {
      const index = cursor++;
      return (slots[index] ??= { current: value });
    },
    useState(value) {
      const index = cursor++;
      slots[index] ??= { value };
      return [
        slots[index].value,
        (value) => {
          slots[index].value = value;
        },
      ];
    },
    useEffect() {},
    useCallback: (value) => value,
    AbortController,
    portfolio: { profile: { summary: 'Public profile' } },
    contentText: (value) => value,
    localWallyAnswer: () => ({ message: 'Local', actions: [] }),
    askWallyRemote: (args) => {
      remoteArgs = args;
      return new Promise((resolve) => {
        resolveRemote = resolve;
      });
    },
  });
  return {
    render() {
      cursor = 0;
      return hook();
    },
    resolve(value = { message: 'Remote', provider: 'gemini', actions: [] }) {
      resolveRemote(value);
    },
    get args() {
      return remoteArgs;
    },
  };
}
test('cancelar e limpar descartam respostas tardias sem bloquear uma nova conversa', async () => {
  const ui = conversation();
  let hook = ui.render();
  const pending = hook.sendMessage('Question', { turnstileToken: 'token' });
  assert.equal(await hook.sendMessage('Duplicate'), false);
  hook.cancelResponse();
  assert.equal(ui.args.signal.aborted, true);
  ui.resolve();
  assert.equal(await pending, false);
  hook = ui.render();
  assert.equal(hook.messages.length, 1);
  assert.equal(hook.messages[0].cancelled, true);
  const next = hook.sendMessage('Next', { turnstileToken: 'new-token' });
  assert.equal(ui.args.history.length, 0);
  hook.clearConversation();
  ui.resolve();
  assert.equal(await next, false);
  hook = ui.render();
  assert.equal(hook.messages.length, 0);
  assert.equal(hook.status, 'idle');
  assert.equal(
    await hook.sendMessage('Mensagem sem verificação'),
    false,
  );

  hook = ui.render();

  assert.equal(hook.messages.some((message) => message.role === 'assistant'), false);
  assert.equal(hook.lastError, 'VERIFICATION_REQUIRED');
});

/* === TRANSPORTE REMOTO === */
test('cliente preserva cancelamento, sinaliza timeout e ignora ações remotas', async () => {
  const source = read('src/services/wallyRemoteService.js').replace(/export /g, '');
  let timeoutCallback;
  const load = (fetch) =>
    vm.runInNewContext(source + ';askWallyRemote', {
      fetch,
      AbortController,
      DOMException,
      setTimeout(callback) {
        timeoutCallback = callback;
        return 1;
      },
      clearTimeout() {},
    });
  const abortingFetch = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  const args = { question: 'Hello', turnstileToken: 'token' };
  const pending = load(abortingFetch)(args);
  timeoutCallback();
  await assert.rejects(pending, /AI_TIMEOUT/);
  const controller = new AbortController();
  const cancelled = load(abortingFetch)({ ...args, signal: controller.signal });
  controller.abort();
  await assert.rejects(cancelled, { name: 'AbortError' });
  const answer = await load(async () =>
    Response.json({ message: 'OK', actions: [{ type: 'delete' }] }),
  )(args);
  assert.equal(answer.actions.length, 0);
});

/* === SUGESTÕES EXIBIDAS NOS DOIS IDIOMAS === */
test('todas as perguntas sugeridas nas interfaces têm resposta local e ação pública em português e inglês', async () => {
  const { localWallyAnswer } = await import('../../src/services/wallyService.js');
  const { portfolio, contentText } = await import('../../src/content/portfolioContent.js');
  const english = Object.assign(
    {},
    ...Object.values(JSON.parse(read('src/shared/i18n/locales/en.json'))),
  );
  const expected = {
    Projetos: 'projects',
    Currículo: 'resume',
    Contato: 'contact',
    Configurações: 'settings',
    'Sobre mim': 'about-me',
    Habilidades: 'about-me',
  };
  for (const file of [
    'src/features/wally/WallyPanel.jsx',
    'src/apps/wally-extended/WallyExtended.jsx',
  ]) {
    const suggestions = vm.runInNewContext(
      /const SUGGESTIONS = (\[[\s\S]*?\]);/.exec(read(file))[1],
    );
    for (const suggestion of suggestions) {
      for (const locale of ['pt-BR', 'en']) {
        const question = locale === 'en' ? english[suggestion.question] : suggestion.question;
        assert.ok(question, suggestion.question);
        const response = localWallyAnswer(
          question,
          contentText(portfolio.profile.summary, locale),
          locale,
          portfolio,
        );
        assert.equal(response.actions[0]?.appId, expected[suggestion.label], question);
      }
    }
  }
});

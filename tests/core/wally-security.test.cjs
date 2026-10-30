const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
test('Wally local responde em inglês e orienta login sem sugerir privilégios', () => {
  const source = read('src/services/wallyService.js').replace(/export /g, '');
  const answer = vm.runInNewContext('(()=>{' + source + ';return localWallyAnswer})()');
  assert.match(answer('projects', '', 'en').message, /Open Projects/);
  assert.match(answer('anything', '', 'en').message, /local mode/);
  assert.match(answer('login', '', 'en').message, /Terminal login form/);
  assert.equal(answer('login', '', 'en').actions.length, 0);
  assert.doesNotMatch(answer('login').message, /ainda não configurada/);
});
async function server({
  verification = { success: true, hostname: 'ws.test', action: 'wally' },
  quota = true,
  answer = 'Hello',
} = {}) {
  const { readBoundedJson } = await import('../../functions/_lib/publicWriteProtection.js');
  const calls = [];
  const source = read('functions/api/wally.js')
    .replace(/^import .*;$/gm, '')
    .replace(/export /g, '');
  const onRequestPost = vm.runInNewContext('(()=>{' + source + ';return onRequestPost})()', {
    URL,
    Response,
    TextEncoder,
    AbortController,
    AbortSignal,
    setTimeout,
    clearTimeout,
    readBoundedJson,
    portfolio: {
      profile: {
        name: 'Warlley',
        summary: { en: 'Software engineering student' },
        areas: ['Software'],
      },
      certificates: [],
      githubUser: 'warlleyz',
      contact: { privateTestValue: 'SHOULD_NOT_BE_SENT' },
    },
    checkWallyRateLimit: async () => ({ allowed: quota, reason: 'RATE_LIMIT_EXCEEDED' }),
    fetch: async (url, options) => {
      calls.push({ url: String(url), options });
      return String(url).includes('siteverify')
        ? Response.json(verification)
        : Response.json({ candidates: [{ content: { parts: [{ text: answer }] } }] });
    },
  });
  const env = {
    WALLY_AI_ENABLED: 'true',
    GEMINI_API_KEY: 'test-key',
    TURNSTILE_SECRET_KEY: 'test-secret',
  };
  const send = (body, extra = {}) =>
    onRequestPost({
      request: new Request('https://ws.test/api/wally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      env: { ...env, ...extra },
    });
  return { send, calls };
}
test('Wally limita o corpo por stream e bloqueia antes de chamadas remotas', async () => {
  const api = await server();
  assert.equal((await api.send({ question: 'x'.repeat(13000) })).status, 413);
  assert.equal(api.calls.length, 0);
  assert.equal((await api.send({ question: 'Hello' }, { WALLY_AI_ENABLED: 'false' })).status, 503);
  assert.equal(api.calls.length, 0);
});
test('Wally rejeita verificação de outro domínio ou finalidade e respeita quota', async () => {
  for (const verification of [
    { success: true, hostname: 'other.test', action: 'wally' },
    { success: true, hostname: 'ws.test', action: 'public-write' },
  ]) {
    const api = await server({ verification });
    assert.equal((await api.send({ question: 'Hello', turnstileToken: 'test' })).status, 403);
    assert.equal(api.calls.length, 1);
  }
  const api = await server({ quota: false });
  assert.equal((await api.send({ question: 'Hello', turnstileToken: 'test' })).status, 429);
  assert.equal(api.calls.length, 1);
});
test('Wally transmite idioma e contexto público selecionado, sem ferramentas privilegiadas', async () => {
  const api = await server();
  const response = await api.send({
    question: 'About the developer',
    locale: 'en',
    turnstileToken: 'test',
  });
  assert.equal(response.status, 200);
  const payload = JSON.parse(api.calls[1].options.body);
  assert.match(payload.systemInstruction.parts[0].text, /Respond in English/);
  assert.match(payload.systemInstruction.parts[0].text, /Software engineering student/);
  assert.doesNotMatch(JSON.stringify(payload), /SHOULD_NOT_BE_SENT|test-key/);
  assert.deepEqual((await response.json()).actions, []);
});

/* === FLAG DO CLIENTE E AUSÊNCIA DE TRANSMISSÃO INVOLUNTÁRIA === */
test('Wally cliente só usa remoto com opt-in true e verificação', async () => {
  for (const flag of [undefined, 'false', 'true']) {
    const source = read('src/features/wally/useWallyConversation.js')
      .replace(/^import[\s\S]*?;\s*$/gm, '')
      .replace('import.meta.env.VITE_WALLY_REMOTE_ENABLED', 'remoteFlag')
      .replace('export default function', 'function');
    let remoteCalls = 0;
    const hook = vm.runInNewContext(source + ';useWallyConversation', {
      remoteFlag: flag,
      useLocale: () => 'pt-BR',
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}],
      useEffect: () => {},
      useCallback: (callback) => callback,
      AbortController,
      portfolio: { profile: { summary: 'Perfil público' } },
      contentText: (value) => value,
      localWallyAnswer: () => ({ message: 'Local', actions: [] }),
      askWallyRemote: async () => {
        remoteCalls += 1;
        return { message: 'Remoto', provider: 'remote' };
      },
    })();
    assert.equal(hook.remoteEnabled, flag === 'true');
    assert.equal(await hook.sendMessage('Projetos', { turnstileToken: 'token-de-teste' }), true);
    assert.equal(remoteCalls, flag === 'true' ? 1 : 0);
    await hook.sendMessage('Currículo');
    assert.equal(remoteCalls, flag === 'true' ? 1 : 0);
  }
});

/* === MUDANÇA LOCAL DE TEMA AUTORIZADA === */
test('Wally oferece tema por pedido explícito sem executar, interpretar ambiguidade ou aceitar negação', () => {
  const source = read('src/services/wallyService.js').replace(/export /g, '');
  const answer = vm.runInNewContext('(()=>{' + source + ';return localWallyAnswer})()');
  for (const [question, theme, locale] of [
    ['Mude para o tema claro', 'light', 'pt-BR'],
    ['Troque para o tema escuro', 'dark', 'pt-BR'],
    ['Switch to light theme', 'light', 'en'],
    ['Set dark mode', 'dark', 'en'],
  ]) {
    const response = answer(question, '', locale);
    assert.equal(response.actions.length, 1);
    assert.equal(response.actions[0].type, 'set-theme');
    assert.equal(response.actions[0].theme, theme);
  }
  for (const question of [
    'Não mude o tema claro',
    'Do not switch to dark theme',
    'Mude o tema claro ou escuro',
    'Explique o tema claro',
    'Crie uma pasta',
  ]) {
    assert.equal(
      answer(question).actions.some((action) => action.type === 'set-theme'),
      false,
    );
  }
});

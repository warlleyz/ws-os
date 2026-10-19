const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
function load(file, bindings, names) {
  const source = fs
    .readFileSync(path.join(root, file), 'utf8')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function|async)\b)/g, '');
  return vm.runInNewContext(`(()=>{${source};return {${names.join(',')}}})()`, {
    URL,
    AbortController,
    DOMException,
    crypto: webcrypto,
    setTimeout,
    clearTimeout,
    ...bindings,
  });
}
const engine = () => load('src/apps/calculator/calculatorEngine.js', {}, ['calculate']);
test('calculadora respeita precedência, potência, sinais, decimal e percentual', () => {
  const { calculate: c } = engine();
  for (const [input, result] of [
    ['2+3*4', 14],
    ['(2+3)*4', 20],
    ['-2^2', -4],
    ['2^-2', 0.25],
    ['2^3^2', 512],
    ['0,1+0.2', 0.3],
    ['50%', 0.5],
    ['1e3/2', 500],
  ])
    assert.equal(c(input), result, input);
});
test('calculadora científica usa unidade explícita e trata domínio e divisão por zero', () => {
  const { calculate: c } = engine();
  assert.equal(c('sin(90)'), 1);
  assert.equal(c('cos(pi)', 'rad'), -1);
  assert.equal(c('sqrt(16)+log(100)'), 6);
  for (const input of [
    '1/0',
    'sqrt(-1)',
    'ln(0)',
    'tan(90)',
    '1e309',
    '(2+3',
    'process.exit()',
    '2;alert(1)',
    '2 3',
    '2**3',
  ])
    assert.throws(() => c(input), undefined, input);
  assert.throws(() => c('('.repeat(40) + '1' + ')'.repeat(40)), /longa/);
});
function fixture() {
  return {
    name: 'Teste local',
    email: 'test@example.test',
    message: 'Mensagem exclusiva de teste, sem envio real.',
    kind: 'message',
    website: '',
    consent: true,
    startedAt: Date.now() - 5000,
  };
}
function contact(bindings = {}) {
  return load(
    'src/services/contactService.js',
    {
      portfolio: {
        contact: { emailService: 'test', emailTemplate: 'test', emailPublicKey: 'public-test' },
      },
      ...bindings,
    },
    ['validateContact', 'sendContact', 'isContactConfigured'],
  );
}
test('contato valida nome, e-mail, mensagem, consentimento e honeypot', () => {
  const m = contact();
  assert.equal(m.validateContact(fixture()).name, 'Teste local');
  for (const patch of [
    { name: 'x' },
    { email: 'bad' },
    { message: 'short' },
    { consent: false },
    { website: 'spam' },
    { startedAt: Date.now() },
    { kind: 'other' },
  ])
    assert.throws(() => m.validateContact({ ...fixture(), ...patch }));
});
test('agendamento deve ser futuro, privado e não confirma reunião', () => {
  const m = contact();
  const now = Date.now();
  const result = m.validateContact(
    { ...fixture(), kind: 'schedule', requestedAt: new Date(now + 86400000).toISOString() },
    now,
  );
  assert.equal(result.kind, 'schedule');
  assert.ok(result.requestedAt.endsWith('Z'));
  assert.throws(() =>
    m.validateContact(
      { ...fixture(), kind: 'schedule', requestedAt: new Date(now - 1000).toISOString() },
      now,
    ),
  );
});
test('contato não configurado ou falha do provedor não produz sucesso', async () => {
  const m = contact({ portfolio: { contact: {} } });
  await assert.rejects(m.sendContact(fixture()), /configurado/);
  const failed = contact({ fetch: async () => ({ ok: false, status: 500 }) });
  await assert.rejects(failed.sendContact(fixture()), /não confirmou/);
});
test('envio só confirma após resposta técnica, com ID e limite de repetição', async () => {
  let resolveRequest, body;
  const m = contact({
    fetch: (_url, options) => {
      body = JSON.parse(options.body);
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    },
  });
  let complete = false;
  const pending = m.sendContact(fixture()).then((result) => {
    complete = true;
    return result;
  });
  assert.equal(complete, false);
  assert.equal(body.template_params.request_type, 'message');
  assert.ok(body.template_params.request_id);
  assert.equal(body.accessToken, undefined);
  resolveRequest({ ok: true });
  const result = await pending;
  assert.ok(result.requestId);
  await assert.rejects(m.sendContact(fixture()), /minuto/);
});
test('guards de fechamento são independentes por instância e liberam ao desmontar', () => {
  const m = load('src/core/appCloseGuards.js', {}, ['registerCloseGuard', 'canCloseApp']);
  const remove = m.registerCloseGuard('dirty', () => false);
  assert.equal(m.canCloseApp('dirty'), false);
  assert.equal(m.canCloseApp('clean'), true);
  remove();
  assert.equal(m.canCloseApp('dirty'), true);
});


/* === Proteção de ações do sistema === */
/* ----- Execução sem alterações pendentes ----- */
test('ação protegida executa imediatamente quando a instância está limpa', () => {
  const m = load(
    'src/core/appCloseGuards.js',
    {},
    [
      'requestGuardedAction',
      'canCloseApp',
    ],
  );

  let executions = 0;

  const result = m.requestGuardedAction(
    'clean',
    () => {
      executions += 1;
    },
    'navigate',
  );

  assert.equal(result, true);
  assert.equal(executions, 1);
  assert.equal(m.canCloseApp('clean'), true);
});

/* ----- Cancelamento de navegação ----- */
test('cancelar navegação protegida preserva alterações e não executa a ação', () => {
  const m = load(
    'src/core/appCloseGuards.js',
    {},
    [
      'registerCloseGuard',
      'requestGuardedAction',
      'cancelCloseConfirmation',
      'confirmAppClose',
    ],
  );

  let executions = 0;

  const unregister = m.registerCloseGuard('editor', () => false);

  const result = m.requestGuardedAction(
    'editor',
    () => {
      executions += 1;
    },
    'navigate',
  );

  assert.equal(result, false);
  assert.equal(executions, 0);

  m.cancelCloseConfirmation();
  m.confirmAppClose();

  assert.equal(executions, 0);

  unregister();
});

/* ----- Confirmação de navegação ----- */
test('confirmar navegação protegida executa a ação uma única vez', () => {
  const m = load(
    'src/core/appCloseGuards.js',
    {},
    [
      'registerCloseGuard',
      'requestGuardedAction',
      'confirmAppClose',
    ],
  );

  let executions = 0;

  const unregister = m.registerCloseGuard('editor', () => false);

  m.requestGuardedAction(
    'editor',
    () => {
      executions += 1;
    },
    'navigate',
  );

  assert.equal(executions, 0);

  m.confirmAppClose();
  m.confirmAppClose();

  assert.equal(executions, 1);

  unregister();
});

/* ----- Exclusividade da confirmação ----- */
test('confirmação pendente não pode ser substituída por outra operação', () => {
  const m = load(
    'src/core/appCloseGuards.js',
    {},
    [
      'registerCloseGuard',
      'requestGuardedAction',
      'confirmAppClose',
    ],
  );

  const actions = [];

  const unregister = m.registerCloseGuard('editor', () => false);

  const first = m.requestGuardedAction(
    'editor',
    () => actions.push('first'),
    'navigate',
  );

  const second = m.requestGuardedAction(
    'editor',
    () => actions.push('second'),
    'close',
  );

  assert.equal(first, false);
  assert.equal(second, false);

  m.confirmAppClose();

  assert.deepEqual(actions, ['first']);

  unregister();
});

/* ----- Desmontagem da instância ----- */
test('desmontar instância cancela confirmação pendente', () => {
  const m = load(
    'src/core/appCloseGuards.js',
    {},
    [
      'registerCloseGuard',
      'requestGuardedAction',
      'confirmAppClose',
    ],
  );

  let executed = false;

  const unregister = m.registerCloseGuard('editor', () => false);

  m.requestGuardedAction(
    'editor',
    () => {
      executed = true;
    },
    'navigate',
  );

  unregister();
  m.confirmAppClose();

  assert.equal(executed, false);
});

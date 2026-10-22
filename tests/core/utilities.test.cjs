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
    .replace(/\bexport\s+(?=(?:const|let|function|async)\b)/g, '')
    .replaceAll('import.meta.env.VITE_TURNSTILE_SITE_KEY', '__siteKey');
  return vm.runInNewContext(`(()=>{${source};return {${names.join(',')}}})()`, {
    URL,
    AbortController,
    DOMException,
    crypto: webcrypto,
    __siteKey: 'test-site-key',
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
  const { loadContract } = require('../helpers/contract-loader.cjs');
  const contracts = loadContract(path.join(root, 'src/services/privateRequestContract.js'));
  const { isValidIdempotencyKey } = loadContract(
    path.join(root, 'src/services/idempotencyContract.js'),
  );
  const { validInstant } = loadContract(path.join(root, 'src/shared/utils/contractValidation.js'));
  return load(
    'src/services/contactService.js',
    {
      ...contracts,
      isValidIdempotencyKey,
      validInstant,
      submitPrivateRequest: async () => {
        throw Error('Unexpected network');
      },
      ...bindings,
    },
    [
      'validateContact',
      'prepareContactRequest',
      'sendContact',
      'isContactConfigured',
      'isContactResultUncertain',
    ],
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
  assert.equal(typeof result.timezone, 'string');
  for (const requestedAt of ['2027-02-30T10:00', '2027-02-30T10:00:00Z']) {
    assert.throws(
      () =>
        m.validateContact(
          { ...fixture(), kind: 'schedule', requestedAt },
          Date.parse('2027-01-01T00:00:00Z'),
        ),
      /data futura/,
    );
  }
  assert.throws(() =>
    m.validateContact(
      { ...fixture(), kind: 'schedule', requestedAt: new Date(now - 1000).toISOString() },
      now,
    ),
  );
});
test('contato exige configuração e não confirma persistência ausente', async () => {
  const off = contact({ __siteKey: '' });
  assert.equal(off.isContactConfigured(), false);
  await assert.rejects(
    off.sendContact(off.prepareContactRequest(fixture()), { turnstileToken: 'token' }),
    /configurado/,
  );
  const malformed = contact({
    submitPrivateRequest: async () => ({ persisted: false, email: 'confirmed' }),
  });
  await assert.rejects(
    malformed.sendContact(malformed.prepareContactRequest(fixture()), { turnstileToken: 'token' }),
    (error) => error.code === 'HTTP_RESULT_UNKNOWN',
  );
});

test('contato só confirma após persistência, separa e-mail e limita outro pedido', async () => {
  let resolveRequest, input;
  const m = contact({
    submitPrivateRequest: (body) => {
      input = body;
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    },
  });
  const original = m.prepareContactRequest(fixture());
  let completed = false;
  const pending = m.sendContact(original, { turnstileToken: 'token' }).then((result) => {
    completed = true;
    return result;
  });
  assert.equal(completed, false);
  assert.equal(input.type, 'message');
  assert.equal(input.idempotencyKey, original.idempotencyKey);
  assert.equal(input.turnstileToken, 'token');
  assert.equal(input.service_id, undefined);
  resolveRequest({ requestId: 'request-one', persisted: true, email: 'failed' });
  const result = await pending;
  assert.equal(result.persisted, true);
  assert.equal(result.emailConfirmed, false);
  await assert.rejects(
    m.sendContact(m.prepareContactRequest(fixture()), { turnstileToken: 'new-token' }),
    /minuto/,
  );
});

test('resultado incerto reutiliza pedido sem repetir envio direto de e-mail', async () => {
  const calls = [];
  const m = contact({
    submitPrivateRequest: async (body) => {
      calls.push(body);
      if (calls.length === 1)
        throw Object.assign(Error('timeout'), { code: 'HTTP_RESULT_UNKNOWN' });
      return { requestId: 'same-request', persisted: true, email: 'unknown' };
    },
  });
  const original = m.prepareContactRequest(fixture());
  await assert.rejects(m.sendContact(original, { turnstileToken: 'first' }));
  const result = await m.sendContact(original, { turnstileToken: 'second' });
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.equal(calls[0].message, calls[1].message);
  assert.notEqual(calls[0].turnstileToken, calls[1].turnstileToken);
  assert.equal(result.requestId, 'same-request');
  assert.equal(result.emailConfirmed, false);
  assert.equal(m.isContactResultUncertain({ code: 'SERVICE_UNAVAILABLE' }), true);
  assert.equal(m.isContactResultUncertain({ code: 'VALIDATION_ERROR' }), false);
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
  const m = load('src/core/appCloseGuards.js', {}, ['requestGuardedAction', 'canCloseApp']);

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
  const m = load('src/core/appCloseGuards.js', {}, [
    'registerCloseGuard',
    'requestGuardedAction',
    'cancelCloseConfirmation',
    'confirmAppClose',
  ]);

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
  const m = load('src/core/appCloseGuards.js', {}, [
    'registerCloseGuard',
    'requestGuardedAction',
    'confirmAppClose',
  ]);

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
  const m = load('src/core/appCloseGuards.js', {}, [
    'registerCloseGuard',
    'requestGuardedAction',
    'confirmAppClose',
  ]);

  const actions = [];

  const unregister = m.registerCloseGuard('editor', () => false);

  const first = m.requestGuardedAction('editor', () => actions.push('first'), 'navigate');

  const second = m.requestGuardedAction('editor', () => actions.push('second'), 'close');

  assert.equal(first, false);
  assert.equal(second, false);

  m.confirmAppClose();

  assert.deepEqual(actions, ['first']);

  unregister();
});

/* ----- Desmontagem da instância ----- */
test('desmontar instância cancela confirmação pendente', () => {
  const m = load('src/core/appCloseGuards.js', {}, [
    'registerCloseGuard',
    'requestGuardedAction',
    'confirmAppClose',
  ]);

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

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { renderApp } = require('../helpers/app-ui.cjs');
const { loadContract } = require('../helpers/contract-loader.cjs');
const root = path.resolve(__dirname, '../..');
const service = loadContract(
  path.join(root, 'src/services/contactService.js'),
  {},
  {
    transformSource: (source) =>
      source
        .replaceAll('import.meta.env.VITE_TURNSTILE_SITE_KEY', "'test-site-key'")
        .replaceAll('import.meta.env.BASE_URL', "'/'"),
  },
);
async function contact(bindings = {}) {
  return renderApp(
    'src/apps/contact/Contact.jsx',
    { instance: { id: 'contact' } },
    {
      ...service,
      WallyTurnstile: 'Verification',
      safeContactUrl: (url) => url,
      portfolio: { contact: { links: [{ label: 'E-mail', url: 'mailto:test@example.test' }] } },
      prepareContactRequest: (form) =>
        service.prepareContactRequest({ ...form, startedAt: Date.now() - 5000 }),
      useUnsavedChanges() {},
      ...bindings,
    },
  );
}
function fill(ui) {
  ui.nodes()
    .find((node) => node.type === 'input' && node.props.autoComplete === 'name')
    .props.onChange({ target: { value: 'Pessoa' } });
  ui.nodes()
    .find((node) => node.type === 'input' && node.props.type === 'email')
    .props.onChange({ target: { value: 'p@example.test' } });
  ui.nodes()
    .find((node) => node.type === 'textarea')
    .props.onChange({ target: { value: 'Mensagem privada válida para teste.' } });
  ui.nodes()
    .find((node) => node.type === 'input' && node.props.type === 'checkbox')
    .props.onChange({ target: { checked: true } });
  ui.render();
}
function verify(ui, token) {
  ui.nodes()
    .find((node) => node.type === 'Verification')
    .props.onTokenChange(token);
  ui.render();
}
function submit(ui) {
  return ui
    .nodes()
    .find((node) => node.type === 'form')
    .props.onSubmit({ preventDefault() {} });
}

/* === Formulário privado e reconciliação de resultado === */
test('resultado incerto bloqueia alterações e conserva chave mesmo após retry limitado', async () => {
  const calls = [];
  let prepared = 0,
    dirty = false;
  const ui = await contact({
    prepareContactRequest: (form) => {
      prepared++;
      return service.prepareContactRequest({ ...form, startedAt: Date.now() - 5000 });
    },
    useUnsavedChanges: (_id, value) => {
      dirty = value;
    },
    sendContact: async (request, { turnstileToken }) => {
      calls.push({ ...request, turnstileToken });
      if (calls.length === 1)
        throw Object.assign(Error('timeout'), { code: 'HTTP_RESULT_UNKNOWN' });
      if (calls.length === 2) throw Object.assign(Error('rate limit'), { code: 'RATE_LIMITED' });
      return {
        requestId: 'private-request',
        persisted: true,
        email: 'failed',
        emailConfirmed: false,
        kind: 'message',
      };
    },
  });
  fill(ui);
  verify(ui, 'first');
  await submit(ui);
  ui.render();
  assert.equal(ui.nodes().find((node) => node.type === 'textarea').props.readOnly, true);
  assert.equal(dirty, true);
  ui.nodes()
    .find((node) => node.type === 'textarea')
    .props.onChange({ target: { value: 'não pode substituir o pedido' } });
  ui.render();
  assert.equal(
    ui.nodes().find((node) => node.type === 'textarea').props.value,
    'Mensagem privada válida para teste.',
  );
  verify(ui, 'second');
  await submit(ui);
  ui.render();
  assert.equal(ui.nodes().find((node) => node.type === 'textarea').props.readOnly, true);
  verify(ui, 'third');
  await submit(ui);
  ui.render();
  assert.equal(prepared, 1);
  assert.ok(calls.every((call) => call.idempotencyKey === calls[0].idempotencyKey));
  assert.deepEqual(
    calls.map((call) => call.turnstileToken),
    ['first', 'second', 'third'],
  );
  assert.equal(ui.nodes().find((node) => node.type === 'textarea').props.value, '');
  assert.equal(dirty, false);
  assert.match(ui.text(), /private-request/);
  assert.doesNotMatch(ui.text(), /Mensagem enviada e confirmada pelo serviço/);
  ui.unmount();
});

test('gravação impede envio duplo e fechamento da instância cancela a espera', async () => {
  let finish,
    signal,
    calls = 0,
    dirty = false;
  const ui = await contact({
    useUnsavedChanges: (_id, value) => {
      dirty = value;
    },
    sendContact: (_request, options) => {
      calls++;
      signal = options.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  fill(ui);
  verify(ui, 'token');
  const pending = submit(ui);
  ui.render();
  await submit(ui);
  assert.equal(calls, 1);
  assert.equal(dirty, true);
  assert.equal(ui.nodes().find((node) => node.type === 'fieldset').props.disabled, true);
  ui.unmount();
  assert.equal(signal.aborted, true);
  finish({ requestId: 'one', persisted: true, emailConfirmed: true, kind: 'message' });
  await pending;
});

test('contato sem configuração mantém canais e bloqueia envio', async () => {
  let dirty = false;

  const ui = await contact({
    isContactConfigured: () => false,
    useUnsavedChanges: (_id, value) => {
      dirty = value;
    },
  });

  /* === Canais disponíveis === */
  const emailLink = ui.nodes().find(
    (node) =>
      node.type === 'a' &&
      node.props.href?.startsWith('mailto:'),
  );

  assert.ok(emailLink, 'O contato por e-mail deve permanecer disponível.');

  /* === Envio desabilitado === */
  const submitButton = ui.nodes().find(
    (node) =>
      node.type === 'button' &&
      node.props.type === 'submit',
  );

  assert.ok(submitButton);
  assert.equal(submitButton.props.disabled, true);

  /* === Agendamento removido da interface === */
  assert.equal(
    ui.nodes().some((node) => node.type === 'select'),
    false,
  );

  assert.equal(
    ui.nodes().some((node) => node.props?.type === 'datetime-local'),
    false,
  );

  /* === Proteção de rascunho === */
  ui.nodes()
    .find((node) =>
      node.type === 'input' &&
      node.props.autoComplete === 'name'
    )
    .props.onChange({ target: { value: 'Pessoa' } });

  ui.render();

  assert.equal(dirty, true);

  ui.unmount();
});
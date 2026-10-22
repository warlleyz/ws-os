const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { renderApp } = require('../helpers/app-ui.cjs');
const { loadContract } = require('../helpers/contract-loader.cjs');
const { calculate } = loadContract(
  path.resolve(__dirname, '../../src/apps/calculator/calculatorEngine.js'),
);

/* === Interação real dos handlers com DOM e armazenamento controlados === */
async function calculator({ stored = null, failSave = false } = {}) {
  const saved = [];
  const field = {
    selectionStart: null,
    selectionEnd: null,
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
  };
  const ui = await renderApp(
    'src/apps/calculator/Calculator.jsx',
    {},
    {
      calculate,
      attachRef: () => field,
      localStorage: {
        getItem: () => stored,
        setItem: (_key, value) => {
          if (failSave) throw Error('quota');
          saved.push(JSON.parse(value));
        },
      },
    },
  );
  const input = () => ui.nodes().find((n) => n.type === 'input' && n.props.maxLength === 256);
  const change = (value) => {
    field.selectionStart = field.selectionEnd = value.length;
    input().props.onChange({ target: { value } });
    ui.render();
  };
  const click = (label) => {
    ui.button(label).props.onClick();
    ui.render();
  };
  const result = () => ui.text(ui.nodes().find((n) => n.type === 'output'));
  return { ...ui, input, change, click, result, field, saved };
}

test('edição, correção e histórico invalidam resultados anteriores', async () => {
  const ui = await calculator();
  ui.change('2+3');
  ui.click('=');
  assert.equal(ui.result(), '5');
  ui.change('9');
  assert.equal(ui.result(), '—');
  ui.click('=');
  assert.equal(ui.result(), '9');
  ui.click('⌫');
  assert.equal(ui.input().props.value, '');
  assert.equal(ui.result(), '—');
  ui.nodes()
    .find((n) => n.type === 'button' && ui.text(n).replace(/\s+/g, ' ').trim() === '2+3 = 5')
    .props.onClick();
  ui.render();
  assert.equal(ui.input().props.value, '2+3');
  assert.equal(ui.result(), '—');
});

test('teclas substituem seleção e apagam antes do cursor sem perder o restante', async () => {
  const ui = await calculator();
  ui.change('12+34');
  ui.field.selectionStart = 3;
  ui.field.selectionEnd = 5;
  ui.click('9');
  assert.equal(ui.input().props.value, '12+9');
  ui.field.selectionStart = ui.field.selectionEnd = 2;
  ui.click('⌫');
  assert.equal(ui.input().props.value, '1+9');
  ui.field.selectionStart = ui.field.selectionEnd = 0;
  ui.click('7');
  assert.equal(ui.input().props.value, '71+9');
});

test('teclado calcula, respeita composição e Escape não chega ao shell', async () => {
  const ui = await calculator();
  ui.change('3*4');
  let prevented = 0,
    stopped = 0;
  const key = (value, composing = false) => {
    ui.input().props.onKeyDown({
      key: value,
      nativeEvent: { isComposing: composing },
      preventDefault: () => prevented++,
      stopPropagation: () => stopped++,
    });
    ui.render();
  };
  key('Enter', true);
  assert.equal(ui.result(), '—');
  key('=');
  assert.equal(ui.result(), '12');
  key('Escape');
  assert.equal(ui.input().props.value, '');
  assert.equal(ui.result(), '—');
  assert.equal(stopped, 1);
  assert.equal(prevented, 2);
});

test('unidade científica invalida resultado e mantém grau e radiano explícitos', async () => {
  const ui = await calculator();
  ui.change('sin(90)');
  ui.click('=');
  assert.equal(ui.result(), '1');
  ui.nodes()
    .find((n) => n.type === 'input' && n.props.type === 'checkbox')
    .props.onChange({ target: { checked: true } });
  ui.render();
  ui.nodes()
    .find((n) => n.type === 'select')
    .props.onChange({ target: { value: 'rad' } });
  ui.render();
  assert.equal(ui.result(), '—');
  ui.change('cos(pi)');
  ui.click('=');
  assert.equal(ui.result(), '-1');
});

test('falha de persistência conserva resultado e histórico da sessão', async () => {
  const ui = await calculator({ failSave: true });
  ui.change('8/2');
  ui.click('=');
  assert.equal(ui.result(), '4');
  assert.match(ui.text(), /Histórico disponível somente nesta sessão/);
  assert.ok(
    ui
      .nodes()
      .find((n) => n.type === 'button' && ui.text(n).replace(/\s+/g, ' ').trim() === '8/2 = 4'),
  );
  ui.change('1/0');
  ui.click('=');
  assert.equal(ui.result(), '—');
  assert.match(ui.text(), /Divisão por zero/);
  ui.click('AC');
  assert.doesNotMatch(ui.text(), /Divisão por zero/);
});

test('histórico inválido ou excessivo é descartado sem quebrar a calculadora', async () => {
  for (const stored of [
    '{broken',
    'x'.repeat(20001),
    JSON.stringify([
      { expression: '', result: 1 },
      { expression: '1+1', result: 2 },
    ]),
  ]) {
    const ui = await calculator({ stored });
    assert.equal(ui.input().props.value, '');
    assert.equal(ui.button(' = 1'), undefined);
    ui.change('6*7');
    ui.click('=');
    assert.equal(ui.result(), '42');
  }
});

/* === Fronteiras do motor preservado === */
test('percentuais são pós-fixos e entradas ou unidades inválidas são recusadas', () => {
  assert.equal(calculate('200+10%'), 200.1);
  assert.equal(calculate('200*10%'), 20);
  assert.equal(calculate('(-2)^2'), 4);
  assert.equal(calculate('2×3÷2'), 3);
  assert.throws(() => calculate('1', 'invalid'), /inválida/);
  assert.throws(() => calculate('1'.repeat(257)), /inválida/);
  assert.throws(() => calculate('1e309%'), /domínio/);
});

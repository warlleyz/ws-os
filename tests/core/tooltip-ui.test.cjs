const test = require('node:test');
const assert = require('node:assert/strict');
const { renderApp } = require('../helpers/app-ui.cjs');

test('Escape dispensa tooltip antes da ação do controle e mantém descrição existente', async () => {
  let original = 0,
    prevented = 0,
    stopped = 0;
  const ui = await renderApp(
    'src/shared/components/Tooltip.jsx',
    {
      content: 'Dica',
      children: {
        type: 'button',
        props: { 'aria-describedby': 'help', onKeyDown: () => original++ },
      },
    },
    {
      useId: () => 'tip',
      useImperativeHandle() {},
      isValidElement: (value) => Boolean(value?.type),
      createPortal: (node) => node,
      document: { body: {} },
      window: { clearTimeout, setTimeout },
    },
  );
  ui.nodes()
    .find((node) => node.type === 'button')
    .props.onFocus({ currentTarget: { matches: () => true } });
  ui.render();
  let button = ui.nodes().find((node) => node.type === 'button');
  assert.equal(button.props['aria-describedby'], 'help tip');
  assert.ok(ui.nodes().some((node) => node.props.role === 'tooltip'));
  button.props.onKeyDown({
    key: 'Escape',
    preventDefault: () => prevented++,
    stopPropagation: () => stopped++,
  });
  ui.render();
  assert.equal(original, 0);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.ok(!ui.nodes().some((node) => node.props.role === 'tooltip'));
  button = ui.nodes().find((node) => node.type === 'button');
  assert.equal(button.props['aria-describedby'], 'help');
  button.props.onKeyDown({ key: 'Escape' });
  assert.equal(original, 1);
  ui.unmount();
});

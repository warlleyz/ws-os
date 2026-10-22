
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadContract } = require('../helpers/contract-loader.cjs');
const { renderApp } = require('../helpers/app-ui.cjs');

const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'src/core/branding.js');

/* === Logos oficiais === */
/* ----- Validar as seis combinações de tema e cor ----- */
test('Branding seleciona as seis logos oficiais e respeita o subdiretório', () => {
  const { getBrandingLogo } = loadContract(file);

  for (const theme of ['dark', 'light']) {
    for (const accent of ['blue', 'green', 'violet']) {
      const expected =
        '/portfolio/assets/branding/ws-os-' +
        accent +
        '-' +
        theme +
        '.svg';

      assert.equal(
        getBrandingLogo(theme, accent, '/portfolio'),
        expected,
      );

      assert.ok(
        fs.existsSync(
          path.join(
            root,
            'public',
            expected.replace('/portfolio/', ''),
          ),
        ),
        `Logo oficial não encontrada: ${expected}`,
      );
    }
  }

  assert.equal(
    getBrandingLogo('invalid', 'invalid'),
    '/assets/branding/ws-os-blue-dark.svg',
  );
});

/* === Tela de inicialização === */
/* ----- Validar o símbolo e a identidade do sistema ----- */
test('Boot utiliza o processador e apresenta a identidade WS OS v2', async () => {
  const ui = await renderApp(
    'src/features/boot/BootScreen.jsx',
    {},
    {
      Cpu: 'Cpu',
    },
  );

  const nodes = ui.nodes();

  assert.ok(
    nodes.some((node) => node.type === 'Cpu'),
    'O símbolo do processador não foi encontrado.',
  );

  assert.equal(
    nodes.filter((node) => node.type === 'img').length,
    0,
    'O Boot não deve utilizar as logos reservadas ao favicon.',
  );

  assert.ok(
    ui.text().includes('WS OS'),
    'O nome do sistema não foi encontrado.',
  );

  assert.ok(
    ui.text().includes('WS OS v2'),
    'A versão do sistema não foi encontrada no rodapé.',
  );

  assert.ok(
    ui.text().includes('Inicializando sistema...'),
    'A mensagem de inicialização não foi encontrada.',
  );
});

/* === Favicon dinâmico === */
/* ----- Atualização do ícone existente e criação recuperável ----- */
test('Favicon acompanha tema e cor sem acumular links', () => {
  let icon = null;
  let created = 0;

  const { applyBrandingFavicon } = loadContract(file, {
    document: {
      querySelector: () => icon,

      createElement: () => {
        created++;
        return {};
      },

      head: {
        appendChild: (value) => {
          icon = value;
        },
      },
    },
  });

  for (const theme of ['dark', 'light']) {
    for (const accent of ['blue', 'green', 'violet']) {
      applyBrandingFavicon(theme, accent, '/portfolio/');

      assert.equal(
        icon.href,
        '/portfolio/assets/branding/ws-os-' +
        accent +
        '-' +
        theme +
        '.svg',
      );

      assert.equal(icon.type, 'image/svg+xml');
    }
  }

  assert.equal(
    created,
    1,
    'O favicon deve reutilizar o mesmo elemento link.',
  );
});

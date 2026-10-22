const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

/* === Componentes profissionais: contratos e recuperação de erros === */
const { renderApp } = require('../helpers/app-ui.cjs');

test('certificados locais abrem o Visualizador com origem e mantêm download; externos ficam no navegador', async () => {
  const calls = [];
  const ui = await renderApp(
    'src/apps/certificates/Certificates.jsx',
    { instance: { id: 'certs' } },
    {
      portfolio: {
        certificates: [
          { id: 'local', title: 'Local', url: '/local.pdf' },
          { id: 'external', title: 'Externo', url: 'https://issuer.test/cert' },
        ],
      },
      useSystem: () => ({ run: (...args) => calls.push(args) }),
    },
  );
  ui.button('Visualizar').props.onClick();
  assert.equal(calls[0][1], 'file-viewer');
  assert.equal(calls[0][2].originInstanceId, 'certs');
  assert.equal(calls[0][2].params.url, 'https://ws.test/local.pdf');
  assert.equal(
    ui.nodes().find((node) => node.type === 'a' && node.props.download).props.href,
    'https://ws.test/local.pdf',
  );
  assert.equal(
    ui.nodes().find((node) => node.type === 'a' && node.props.target === '_blank').props.href,
    'https://issuer.test/cert',
  );
  ui.unmount();
});

test('currículo sai de timeout e permite tentar novamente antes de abrir o documento', async () => {
  let expire,
    requests = 0;
  const calls = [];
  const ui = await renderApp(
    'src/apps/resume/Resume.jsx',
    { instance: { id: 'resume' } },
    {
      setTimeout: (callback) => {
        expire = callback;
        return 1;
      },
      clearTimeout() {},
      fetch: (_url, options) =>
        ++requests === 1
          ? new Promise((_resolve, reject) =>
              options.signal.addEventListener('abort', () => reject(Error('abort'))),
            )
          : Promise.resolve(new Response(null, { headers: { 'Content-Type': 'application/pdf' } })),
      useSystem: () => ({ run: (...args) => calls.push(args) }),
    },
  );
  expire();
  await ui.flush();
  assert.match(ui.text(), /Documento indisponível/);
  ui.button('Tentar novamente').props.onClick();
  ui.render();
  await ui.flush();
  ui.button('Visualizar currículo').props.onClick();
  assert.equal(requests, 2);
  assert.equal(calls[0][2].params.resource.catalogId, 'curriculo');
  assert.equal(calls[0][2].originInstanceId, 'resume');
  ui.unmount();
});

test('demo incorporada tem timeout, sandbox e nova tentativa sem carregar URL não cadastrada', async () => {
  let timeout,
    clears = 0;
  const props = { instance: { params: { projectId: 'p', demoId: 'd' } } };
  const ui = await renderApp('src/apps/demo-viewer/DemoViewer.jsx', props, {
    resolveDemo: (_projects, _origins, _project, id) =>
      id === 'd'
        ? { url: 'https://demo.test/', title: 'Demo', mode: 'embedded', canEmbed: true }
        : null,
    setTimeout: (callback) => {
      timeout = callback;
      return 1;
    },
    clearTimeout: () => {
      clears++;
    },
  });
  const iframe = () => ui.nodes().find((node) => node.type === 'iframe');
  assert.equal(iframe().props.sandbox, 'allow-scripts allow-forms');
  timeout();
  ui.render();
  assert.ok(ui.nodes().some((node) => node.props.role === 'alert'));
  ui.button('Recarregar demonstração').props.onClick();
  ui.render();
  iframe().props.onLoad();
  ui.render();
  assert.equal(
    ui.nodes().some((node) => node.props.role === 'alert'),
    false,
  );
  props.instance.params.demoId = 'unknown';
  ui.render();
  assert.equal(iframe(), undefined);
  assert.match(ui.text(), /Demonstração não cadastrada/);
  assert.ok(clears > 0);
  ui.unmount();
});

/* === Compartilhamento e origem contextual === */
const { loadContract } = require('../helpers/contract-loader.cjs');
const projectModel = loadContract(
  path.join(root, 'src/apps/projects/projectModel.js'),
  {},
  {
    transformSource: (source) => source.replaceAll('import.meta.env.BASE_URL', "'/portfolio/'"),
  },
);
const { resolveSharedEntry } = loadContract(
  path.join(root, 'src/features/search/searchService.js'),
);

test('link de projeto preserva subdiretório e resolve pela entrada pública existente', () => {
  const link = projectModel.createProjectShareUrl(
    'github-123',
    'https://ws.test/portfolio/?post=old#top',
  );
  assert.equal(link, 'https://ws.test/portfolio/?project=github-123');
  assert.equal(resolveSharedEntry(new URL(link).search).params.projectId, 'github-123');
  for (const id of ['', '../private', 'a'.repeat(81), null]) {
    assert.equal(projectModel.createProjectShareUrl(id, 'https://ws.test/'), null);
  }
  assert.equal(projectModel.createProjectShareUrl('ok', 'javascript:alert(1)'), null);
  assert.equal(projectModel.createProjectShareUrl('ok', 'https://user:secret@ws.test/'), null);
});

test('Projeto copia URL sem navegar e permite cópia manual se o navegador bloquear', async () => {
  const copied = [],
    selected = [];
  const location = { origin: 'https://ws.test' };
  let blocked = false;
  const input = {
    value: 'https://ws.test/portfolio/?project=one',
    focus() {
      selected.push('focus');
    },
    select() {
      selected.push('select');
    },
  };
  const ui = await renderApp(
    'src/apps/projects/Projects.jsx',
    { instance: { id: 'projects', params: { projectId: 'one' } } },
    {
      ...projectModel,
      window: { location },
      navigator: {
        clipboard: {
          writeText: async (value) => {
            if (blocked) throw Error('denied');
            copied.push(value);
          },
        },
      },
      portfolio: {
        githubUser: '',
        projects: [{ id: 'one', name: 'Projeto real', technologies: [] }],
      },
      useAppBack() {},
      usePublicResource: () => ({ status: 'idle', data: null, refresh() {} }),
      attachRef: () => input,
    },
  );
  await ui.button('Ctrl+C').props.onClick();
  ui.render();
  assert.deepEqual(copied, ['https://ws.test/portfolio/?project=one']);
  assert.match(ui.text(), /Operação concluída/);
  assert.deepEqual(location, { origin: 'https://ws.test' });
  blocked = true;
  await ui.button('Ctrl+C').props.onClick();
  ui.render();
  assert.match(ui.text(), /Não foi possível concluir/);
  assert.deepEqual(selected, ['focus', 'select']);
  assert.equal(
    ui.nodes().find((node) => node.type === 'input' && node.props.readOnly).props.value,
    input.value,
  );
  ui.unmount();
});

test('Sobre Mim mantém a instância de origem nos quatro destinos profissionais', async () => {
  const calls = [];
  const ui = await renderApp(
    'src/apps/about-me/AboutMe.jsx',
    { instance: { id: 'profile-instance' } },
    {
      portfolio: {
        profile: {
          name: 'Autor',
          headline: 'Perfil',
          summary: 'Resumo',
          areas: [],
          timeline: [],
          interests: [],
          links: [],
        },
      },
      useSystem: () => ({ run: (...args) => calls.push(args) }),
    },
  );
  for (const label of ['Projetos', 'Currículo', 'Certificados', 'Contato'])
    ui.button(label).props.onClick();
  assert.deepEqual(
    calls.map((call) => call[1]),
    ['projects', 'resume', 'certificates', 'contact'],
  );
  assert.ok(
    calls.every(
      (call) => call[2].origin === 'about-me' && call[2].originInstanceId === 'profile-instance',
    ),
  );
  ui.unmount();
});

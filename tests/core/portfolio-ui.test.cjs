const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

/* === Componentes profissionais: contratos e recuperação de erros === */
const { renderApp } = require('../helpers/app-ui.cjs');
const fs = require('node:fs');
const vm = require('node:vm');
const { validRepositoryIds } = require('../helpers/contract-loader.cjs').loadContract(
  path.join(root, 'src/shared/utils/contractValidation.js'),
);
const highlightsService = vm.runInNewContext(
  fs
    .readFileSync(path.join(root, 'src/services/projectHighlightService.js'), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '')
    .replace(/export /g, '') + ';({applyProjectHighlights})',
  { validRepositoryIds },
);

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

test('Projeto apresenta detalhes sem compartilhamento', async () => {
  const location = {
    origin: 'https://ws.test',
  };

  const ui = await renderApp(
    'src/apps/projects/Projects.jsx',
    {
      instance: {
        id: 'projects',
        params: {
          projectId: 'one',
        },
      },
    },
    {
      ...projectModel,
      applyProjectHighlights: highlightsService.applyProjectHighlights,

      // === Componentes simulados ===
      // ----- Ícones utilizados pelo aplicativo -----
      ArrowLeft: 'ArrowLeft',
      ArrowUpRight: 'ArrowUpRight',
      BookOpen: 'BookOpen',
      FolderGit2: 'FolderGit2',
      Search: 'Search',
      Star: 'Star',

      // === Ambiente e conteúdo ===
      window: { location },

      portfolio: {
        githubUser: '',
        projects: [
          {
            id: 'one',
            name: 'Projeto real',
            description: 'Descrição do projeto.',
            repository: 'https://github.com/warlleyz/projeto-real',
            technologies: ['Java'],
          },
        ],
      },

      useAppBack() {},

      usePublicResource: () => ({
        status: 'idle',
        data: null,
        refresh() {},
      }),
    },
  );

  // === Validação dos detalhes ===
  // ----- Informações do projeto -----
  assert.match(ui.text(), /Projeto real/);
  assert.match(ui.text(), /Descrição do projeto/);

  // ----- Repositório externo -----
  const repositoryLink = ui
    .nodes()
    .find(
      (node) => node.type === 'a' && node.props.href === 'https://github.com/warlleyz/projeto-real',
    );

  assert.ok(repositoryLink, 'Os detalhes devem oferecer acesso ao repositório.');

  assert.equal(repositoryLink.props.target, '_blank');
  assert.match(repositoryLink.props.rel, /noopener/);

  // ----- Compartilhamento removido -----
  assert.equal(
    ui.button('Ctrl+C'),
    undefined,
    'O compartilhamento não deve aparecer nos detalhes.',
  );

  // ----- A navegação não deve ser modificada -----
  assert.deepEqual(location, {
    origin: 'https://ws.test',
  });

  ui.unmount();
});

/* ----- Contato preserva a instância de origem ----- */
test('Sobre Mim abre Contato preservando a instância de origem', async () => {
  const calls = [];

  const ui = await renderApp(
    'src/apps/about-me/AboutMe.jsx',
    { instance: { id: 'profile-instance' } },
    {
      Code2: 'Code2',
      Database: 'Database',
      Layers3: 'Layers3',
      Wrench: 'Wrench',
      BookOpen: 'BookOpen',
      GitBranch: 'GitBranch',
      GraduationCap: 'GraduationCap',
      Mail: 'Mail',
      MapPin: 'MapPin',
      Rocket: 'Rocket',
      SkillsGlobe: 'SkillsGlobe',
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

  const contact = ui
    .nodes()
    .find(
      (node) =>
        node.type === 'button' &&
        node.props.className?.split(' ').includes('ws-about__link--contact'),
    );

  assert.ok(contact, 'O aplicativo deve oferecer acesso ao Contato.');

  contact.props.onClick();

  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'contact');
  assert.equal(calls[0][2].origin, 'about-me');
  assert.equal(calls[0][2].originInstanceId, 'profile-instance');

  ui.unmount();
});

/* === Falhas dos destaques não removem o catálogo principal === */
test('Projetos preserva metadados e permite recuperar destaques quando a integração falha', async () => {
  let refreshed = 0;
  const bindings = {
    ...projectModel,
    applyProjectHighlights: highlightsService.applyProjectHighlights,
    portfolio: { githubUser: 'owner', projects: [] },
    usePublicResource: (_load, key) =>
      key === 'github'
        ? {
            status: 'ready',
            updatedAt: 1,
            data: {
              repositories: [
                {
                  id: 'github-1',
                  name: 'Metadados preservados',
                  description: 'Descrição original',
                  technologies: [],
                  stars: 7,
                },
              ],
              complete: true,
            },
            refresh: () => refreshed++,
          }
        : { status: 'error', data: null, refresh: () => refreshed++ },
    useAppBack() {},
    ArrowLeft: 'ArrowLeft',
    ArrowUpRight: 'ArrowUpRight',
    BookOpen: 'BookOpen',
    FolderGit2: 'FolderGit2',
    Search: 'Search',
    Star: 'Star',
    Select: 'Select',
    GitFork: 'GitFork',
  };
  const projects = await renderApp(
    'src/apps/projects/Projects.jsx',
    { instance: { id: 'projects', params: { projectId: 'github-1' } } },
    bindings,
  );
  assert.match(projects.text(), /Metadados preservados/);
  assert.match(projects.text(), /Descrição original/);
  assert.match(projects.text(), /Não foi possível carregar os projetos em destaque/);
  projects.button('Tentar novamente').props.onClick();
  assert.equal(refreshed, 1);
  projects.unmount();
});

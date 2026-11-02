const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs
  .readFileSync(path.join(__dirname, '../../src/features/search/searchService.js'), 'utf8')
  .replace(/export /g, '');
const { searchContent, resolveSharedEntry } = vm.runInNewContext(
  '(()=>{' + source + ';return {searchContent,resolveSharedEntry}})()',
  { URL, URLSearchParams },
);
const portfolio = {
  projects: [{ id: 'one', name: 'Árvore', description: 'Local', technologies: ['React'] }],
  certificates: [{ id: 'cert', title: 'Segurança', issuer: 'Universidade' }],
  profile: { name: 'Warlley', summary: 'Engenharia', areas: ['Software'] },
};
test('busca contextual normaliza acentos e retorna contratos seguros de abertura', () => {
  const results = searchContent('arvore', { portfolio, projects: portfolio.projects });
  assert.equal(results.length, 1);
  assert.equal(results[0].params.projectId, 'one');
  const certificates = searchContent('seguranca', { portfolio });
  assert.equal(certificates.length, 1);
  assert.equal(certificates[0].appId, 'certificates');
  assert.equal(certificates[0].params.certificateId, 'cert');
  assert.equal(searchContent('software', { portfolio })[0].appId, 'about-me');
  assert.equal(searchContent('idioma', { portfolio })[0].params.section, 'language');
  assert.equal(searchContent('a', { portfolio }).length, 0);
});
test('busca prioriza títulos e elimina projetos duplicados', () => {
  const data = {
    ...portfolio,
    projects: [
      {
        id: 'local',
        name: 'Sistema Solar',
        description: 'Projeto acadêmico',
        repository: 'https://github.com/exemplo/solar',
        technologies: ['React'],
      },
      {
        id: 'secondary',
        name: 'Painel',
        description: 'Sistema Solar com indicadores',
        technologies: ['JavaScript'],
      },
    ],
  };

  const remote = [
    {
      id: 'github-123',
      name: 'solar',
      description: 'Repositório remoto',
      repository: 'https://github.com/exemplo/solar',
      technologies: ['React'],
    },
  ];

  const results = searchContent('solar', {
    portfolio: data,
    projects: remote,
  });

  assert.deepEqual(
    Array.from(results, (result) => result.params.projectId),
    ['local', 'secondary'],
  );
});

test('busca aplica limite após classificação por relevância', () => {
  const projects = Array.from({ length: 30 }, (_, index) => ({
    id: `project-${index}`,
    name: `Projeto ${index}`,
    description: 'Sistema de exemplo',
    technologies: [],
  }));

  projects.push({
    id: 'exact',
    name: 'Sistema',
    description: '',
    technologies: [],
  });

  const results = searchContent('sistema', {
    portfolio: {
      ...portfolio,
      projects,
    },
  });

  assert.equal(results.length, 24);
  assert.equal(results[0].params.projectId, 'exact');
});
test('busca encontra configurações em português e inglês', () => {
  const terms = [
    ['aparencia', 'appearance'],
    ['wallpaper', 'appearance'],
    ['brightness', 'appearance'],
    ['idioma', 'language'],
    ['translation', 'language'],
    ['acessibilidade', 'accessibility'],
    ['contrast', 'accessibility'],
    ['relogio', 'widgets'],
    ['calendar', 'widgets'],
    ['barra de tarefas', 'desktop'],
    ['shortcuts', 'desktop'],
    ['smartphone', 'mobile'],
    ['touch', 'mobile'],
  ];

  for (const [query, section] of terms) {
    const results = searchContent(query, { portfolio });

    assert.ok(
      results.some(
        (result) =>
          result.kind === 'setting' &&
          result.params.section === section,
      ),
      `Termo não encontrado: ${query}`,
    );
  }
});

test('busca encontra o perfil por termos profissionais bilíngues', () => {
  for (const query of ['sobre mim', 'about me', 'software engineering', 'skills']) {
    const results = searchContent(query, { portfolio });

    assert.ok(
      results.some((result) => result.appId === 'about-me'),
      `Perfil não encontrado para: ${query}`,
    );
  }
});
test('links de compartilhamento aceitam destinos públicos com identificadores válidos', () => {
  assert.equal(resolveSharedEntry('?post=abc_1').appId, 'notes');
  assert.equal(resolveSharedEntry('?project=github-123').params.projectId, 'github-123');
  const certificate = resolveSharedEntry('?certificate=java-completo-udemy');

  assert.equal(certificate.appId, 'certificates');
  assert.equal(certificate.params.certificateId, 'java-completo-udemy');
  assert.equal(certificate.origin, 'shared-link');
  for (const query of [
    '?app=administration',
    '?post=../secret',
    '?post=<script>',
    '?post=' + 'a'.repeat(81),
    '?certificate=',
    '?certificate=../admin',
    '?certificate=abc&certificate=def',
    '?project=one&post=two',
    '?project=one&certificate=cert',
  ])
    assert.equal(resolveSharedEntry(query), null);
});

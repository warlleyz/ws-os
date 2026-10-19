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
  { URLSearchParams },
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
  assert.equal(searchContent('software', { portfolio })[0].appId, 'about-me');
  assert.equal(searchContent('idioma', { portfolio })[0].params.section, 'language');
  assert.equal(searchContent('a', { portfolio }).length, 0);
});
test('links de compartilhamento permitem somente projetos e notas com identificadores válidos', () => {
  assert.equal(resolveSharedEntry('?post=abc_1').appId, 'notes');
  assert.equal(resolveSharedEntry('?project=github-123').params.projectId, 'github-123');
  for (const query of [
    '?app=administration',
    '?post=../secret',
    '?post=<script>',
    '?post=' + 'a'.repeat(81),
  ])
    assert.equal(resolveSharedEntry(query), null);
});

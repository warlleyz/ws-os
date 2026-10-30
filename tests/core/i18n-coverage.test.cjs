const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/shared/i18n/locales/en.json'), 'utf8'));
const pt = JSON.parse(
  fs.readFileSync(path.join(root, 'src/shared/i18n/locales/pt-BR.json'), 'utf8'),
);
/* === NORMALIZAÇÃO DOS DICIONÁRIOS === */
/* ----- EXTRAÇÃO DAS CHAVES E DOS TEXTOS ----- */
function flattenTranslations(dictionary, prefix = '') {
  const entries = [];

  for (const [key, value] of Object.entries(dictionary)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      entries.push([path, value]);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenTranslations(value, path));
    } else {
      throw new Error(`Entrada de tradução inválida: ${path}`);
    }
  }

  return entries;
}

const englishEntries = new Map(flattenTranslations(en));
const portugueseEntries = new Map(flattenTranslations(pt));
const translatedSources = new Set(portugueseEntries.values());
test('interfaces possuem tradução sem dispensas temporárias', () => {
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(jsx|js)$/.test(file))
        for (const match of fs
          .readFileSync(file, 'utf8')
          .matchAll(/\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*?)\1\s*[,)]/gs)) {
          assert.ok(
            translatedSources.has(match[2]),
            path.relative(root, file) + ': ' + match[2],
          );
        }
    }
  }
  walk(path.join(root, 'src'));
});
test('nomes e descrições do catálogo de widgets são traduzíveis', () => {
  const source = fs
    .readFileSync(path.join(root, 'src/core/widgetManager.js'), 'utf8')
    .replace(/\bexport\s+/g, '');
  const widgets = vm.runInNewContext(`(()=>{${source};return getRegisteredWidgets()})()`);
  for (const widget of widgets)
    for (const value of [widget.name, widget.description])
      assert.ok(translatedSources.has(value), value);
});

test('catálogos têm as mesmas chaves e preservam placeholders', () => {
  assert.deepEqual(
    [...englishEntries.keys()].sort(),
    [...portugueseEntries.keys()].sort(),
  );

  for (const [key, value] of englishEntries) {
    const source = portugueseEntries.get(key);

    assert.equal(typeof source, 'string', key);
    assert.equal(typeof value, 'string', key);
    assert.ok(source.trim(), key);
    assert.ok(value.trim(), key);

    assert.deepEqual(
      (source.match(/\{\d+\}/g) ?? [])
        .filter((token) => source !== '{0} não lida{1}' || token !== '{1}')
        .sort(),
      (value.match(/\{\d+\}/g) ?? []).sort(),
      key,
    );
  }
});

test('traduções finais respondem à troca de idioma e preservam parâmetros', () => {
  const source = fs
    .readFileSync(path.join(root, 'src/shared/i18n/i18n.js'), 'utf8')
    .replace(/^import.*$/gm, '')
    .replace(/\bexport /g, '');
  const i18n = vm.runInNewContext('(()=>{' + source + '; return {translate,setLocale};})()', {
    portuguese: pt,
    english: en,
    useSyncExternalStore() { },
    localStorage: { getItem: () => 'en', setItem() {} },
    document: { documentElement: { lang: 'en' } },
  });
  assert.equal(i18n.translate('Selecionar anexo'), 'Select attachment');
  assert.equal(
    i18n.translate('O caminho deve começar com WS Files.'),
    'The path must start with WS Files.',
  );
  assert.equal(i18n.translate('Página 2 de 8'), 'Page 2 of 8');
  assert.equal(i18n.setLocale('pt-BR'), true);
  assert.equal(i18n.translate('Select attachment'), 'Selecionar anexo');
  assert.equal(i18n.translate('Página 2 de 8'), 'Página 2 de 8');
});

test('Visualizador, PDF e Arquivos não reintroduzem texto literal traduzível', () => {
  for (const file of [
    'src/apps/files/Files.jsx',
    'src/apps/file-viewer/DocumentView.jsx',
    'src/apps/file-viewer/PdfPreview.jsx',
  ]) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of source.matchAll(/>([^<>{}]+)</g)) {
      const value = match[1].trim().replace(/\s+/g, ' ');
      if (/^[\p{L}\p{N}\s.,:;!?/…+-]+$/u.test(value) && /[A-Za-zÀ-ÿ]{3}/.test(value))
        assert.ok(['WS Files', 'WS OS / Explorer', 'PDF'].includes(value), file + ': ' + value);
    }
  }
});

/* === CATÁLOGO DE JOGOS COM CHAVES DINÂMICAS === */
test('nomes, categorias, descrições e controles dos cinco jogos possuem tradução', () => {
  const source = fs.readFileSync(path.join(root, 'src/apps/games/catalog/gameDefinitions.js'), 'utf8').replace(/export /g, '');
  const catalog = vm.runInNewContext(source + ';GAMES_CATALOG');
  for (const game of catalog) {
    for (const field of ['name', 'category', 'description', 'controls']) {
      assert.ok(translatedSources.has(game[field]), game.id + ': ' + field + ' sem tradução');
    }
  }
});

test('ajuda do Terminal traduz descrições sem alterar os comandos', () => {
  const source = fs.readFileSync(path.join(root, 'src/apps/terminal/terminalCommands.js'), 'utf8').replace(/export /g, '');
  const api = vm.runInNewContext(source + ';({commandHelp, TERMINAL_GROUPS})');
  const lookup = new Map([...portugueseEntries].map(([key,value]) => [value, englishEntries.get(key)]));
  for (const group of api.TERMINAL_GROUPS) {
    assert.ok(lookup.has(group.title), group.title);
    for (const [,description] of group.commands) assert.ok(lookup.has(description), description);
  }
  const lines = api.commandHelp(undefined, (value) => lookup.get(value) ?? value);
  assert.ok(lines.some((line) => line.includes('help') && line.includes('Show help')));
  assert.ok(lines.includes('SYSTEM'));
  assert.ok(!lines.some((line) => line.includes('Exibe a ajuda')));
});

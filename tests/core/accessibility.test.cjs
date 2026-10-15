const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const english = JSON.parse(read('src/shared/i18n/locales/en.json'));
function moduleAt(file, bindings = {}) {
  const source = read(file)
    .replace(/^import[^;]+;\s*/gm, '')
    .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');
  const context = vm.createContext({
    english,
    localStorage: { getItem: () => null, setItem() {} },
    document: { documentElement: { dataset: {}, lang: 'pt-BR' } },
    ...bindings,
  });
  vm.runInContext(source, context);
  return context;
}

test('catálogos pt-BR/en possuem as mesmas chaves e valores de texto', () => {
  const portuguese = JSON.parse(read('src/shared/i18n/locales/pt-BR.json'));
  assert.deepEqual(Object.keys(english).sort(), Object.keys(portuguese).sort());
  assert.ok(Object.values(english).every((value) => typeof value === 'string' && value.length > 0));
  assert.ok(Object.keys(english).length > 180);
});
test('idioma é persistido, muda lang e notifica assinantes sem recarregar', () => {
  const saved = new Map();
  let count = 0,
    unsubscribe;
  const document = { documentElement: { lang: 'pt-BR' } };
  const m = moduleAt('src/shared/i18n/i18n.js', {
    document,
    localStorage: { getItem: () => null, setItem: (key, value) => saved.set(key, value) },
    useSyncExternalStore(subscribe, snapshot) {
      unsubscribe = subscribe(() => {
        count += 1;
      });
      return snapshot();
    },
  });
  assert.equal(m.useLocale(), 'pt-BR');
  assert.equal(m.setLocale('en'), true);
  assert.equal(m.getLocale(), 'en');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(saved.get('ws-os:locale'), 'en');
  assert.equal(count, 1);
  unsubscribe();
  m.setLocale('pt-BR');
  assert.equal(count, 1);
});
test('tradução cobre templates, nomes, reversão e fallback seguro', () => {
  const m = moduleAt('src/shared/i18n/i18n.js');
  m.setLocale('en');
  assert.equal(m.translate('Abrir Sobre Mim'), 'Open About me');
  assert.equal(m.translate('Projetos — Janela 2'), 'Projects — Window 2');
  assert.equal(
    m.translate('Sobre o Sistema foi aberto na WS OS.'),
    'About the system was opened in WS OS.',
  );
  assert.equal(m.translate('__proto__'), '__proto__');
  assert.equal(m.translate('constructor'), 'constructor');
  assert.equal(m.translate('Texto externo sem tradução'), 'Texto externo sem tradução');
  m.setLocale('pt-BR');
  assert.equal(m.translate('Open Projects'), 'Abrir Projetos');
});
test('armazenamento bloqueado mantém idioma da sessão e sinaliza falha', () => {
  const m = moduleAt('src/shared/i18n/i18n.js', {
    localStorage: {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('quota');
      },
    },
  });
  assert.equal(m.getLocale(), 'pt-BR');
  assert.equal(m.setLocale('en'), false);
  assert.equal(m.translate('Controle Rápido'), 'Quick controls');
  assert.equal(m.setLocale('fr'), false);
  assert.equal(m.getLocale(), 'en');
});
test('preferências de efeitos aplicam atributos sem tocar em outras chaves', () => {
  const saved = new Map([['ws-os:theme', 'light']]);
  const document = { documentElement: { dataset: {} } };
  const m = moduleAt('src/core/effectsManager.js', {
    document,
    localStorage: {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
    },
  });
  assert.equal(m.setAccessibility({ motion: true, transparency: true, lowEffects: true }), true);
  assert.equal(document.documentElement.dataset.reducedMotion, 'true');
  assert.equal(JSON.parse(saved.get('ws-os:accessibility')).lowEffects, true);
  assert.equal(saved.get('ws-os:theme'), 'light');
});
test('efeitos continuam ativos na sessão quando a persistência falha', () => {
  const m = moduleAt('src/core/effectsManager.js', {
    localStorage: {
      getItem: () => '{invalid',
      setItem() {
        throw Error('quota');
      },
    },
  });
  assert.equal(m.getAccessibility().motion, false);
  assert.equal(m.setAccessibility({ motion: true }), false);
  assert.equal(m.getAccessibility().motion, true);
});

function declarations(source) {
  return Object.fromEntries(
    [...source.matchAll(/(--[\w-]+):\s*(#[a-fA-F\d]{6})\s*;/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}
function ratio(a, b) {
  function luminance(hex) {
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  const first = luminance(a),
    second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
for (const theme of ['dark', 'light'])
  test(`contrastes representativos do tema ${theme} atendem aos limiares medidos`, () => {
    const foundation = read('src/styles/themes/foundation.css');
    const sections = foundation.match(/:root[^\{]*\{[^}]+\}/g);
    const tokens = {
      ...declarations(read(`src/styles/themes/${theme}.css`)),
      ...declarations(sections[0]),
      ...(theme === 'light' ? declarations(sections[1]) : {}),
    };
    for (const foreground of [
      '--text-primary',
      '--text-secondary',
      '--link-color',
      '--accent-secondary',
      '--status-success',
      '--status-warning',
      '--status-error',
    ]) {
      for (const background of ['--surface-primary', '--surface-secondary', '--surface-canvas'])
        assert.ok(
          ratio(tokens[foreground], tokens[background]) >= 4.5,
          `${foreground}/${background}: ${ratio(tokens[foreground], tokens[background])}`,
        );
    }
    assert.ok(ratio(tokens['--action-text'], tokens['--action-background']) >= 4.5);
    assert.ok(ratio('#ffffff', tokens['--badge-background']) >= 4.5);
    assert.ok(ratio(tokens['--border-control'], tokens['--surface-primary']) >= 3);
  });

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..');

async function component(file, props, bindings = {}) {
  const { transformWithOxc } = await import('vite');
  const source = fs
    .readFileSync(path.join(root, file), 'utf8')
    .replaceAll('import.meta.env.BASE_URL', "'/'");
  const { code } = await transformWithOxc(source, file, { jsx: { runtime: 'classic' } });
  let cursor = 0,
    tree,
    dirty = false;
  const slots = [],
    effects = [];
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: (initial) => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], (v) => (slots[i] = typeof v === 'function' ? v(slots[i]) : v)];
    },
    useRef: (initial) => (slots[cursor++] ??= { current: initial }),
    useMemo: (fn) => fn(),
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    useEffect: (effect, deps) => {
      const i = cursor++;
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i].deps[j])) {
        slots[i]?.cleanup?.();
        slots[i] = { deps };
        effects.push(() => (slots[i].cleanup = effect()));
      }
    },
  };
  const name = /export default function (\w+)/.exec(code)[1];
  const clean = code
    .replace(/^import[\s\S]*?;\s*$/gm, '')
    .replace('export default function', 'function');
  const Component = vm.runInNewContext(`${clean}; ${name}`, {
    React,
    ...React,
    URL,
    AbortController,
    Blob,
    TextDecoder,
    useLocale: () => 'pt-BR',
    t: (s) => s,
    fileKind: (name) =>
      name.endsWith('.txt')
        ? 'text'
        : name.endsWith('.png')
          ? 'image'
          : name.endsWith('.pdf')
            ? 'pdf'
            : null,
    TEXT_LIMIT: 1024 * 1024,
    useUnsavedChanges: (_id, value) => {
      dirty = value;
    },
    subscribeLocalFiles: () => () => {},
    localFilesRevision: () => 0,
    ...bindings,
  });
  function render() {
    cursor = 0;
    tree = Component(props);
    while (effects.length) effects.shift()();
    return tree;
  }
  function nodes(n = tree) {
    if (Array.isArray(n)) return n.flatMap(nodes);
    return n && typeof n === 'object' ? [n, ...nodes(n.props.children)] : [];
  }
  function text(n = tree) {
    if (Array.isArray(n)) return n.map(text).join(' ');
    return n && typeof n === 'object' ? text(n.props.children) : String(n ?? '');
  }
  render();
  return {
    render,
    nodes,
    text,
    dirty: () => dirty,
    props,
    button: (label) => nodes().find((n) => n.type === 'button' && text(n).trim() === label),
    flush: async () => {
      await new Promise((resolve) => setImmediate(resolve));
      render();
    },
    unmount: () => {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
}
const entry = (overrides = {}) => ({
  id: 'file',
  kind: 'file',
  name: 'a.txt',
  revision: 1,
  parentId: null,
  blob: new Blob(['original']),
  ...overrides,
});
const editorProps = () => ({ instance: { id: 'editor', params: { fileId: 'file' } } });

test('editor detecta alterações externas sem apagar rascunho e não sobrescreve revisão antiga', async () => {
  let current = entry(),
    revision = 0;
  const ui = await component('src/apps/file-editor/FileEditor.jsx', editorProps(), {
    readLocalFile: async () => current,
    localFilesRevision: () => revision,
    saveLocalText: async (_id, _text, expected) => {
      assert.equal(expected, 1);
      throw Error('O arquivo foi alterado em outra janela. Recarregue ou salve uma cópia.');
    },
  });
  await ui.flush();
  ui.nodes()
    .find((n) => n.type === 'textarea')
    .props.onChange({ target: { value: 'rascunho' } });
  ui.render();
  current = entry({ revision: 2, blob: new Blob(['externo']) });
  revision++;
  ui.render();
  await ui.flush();
  assert.match(ui.text(), /outra janela/);
  await ui.button('Salvar').props.onClick();
  ui.render();
  assert.equal(ui.nodes().find((n) => n.type === 'textarea').props.value, 'rascunho');
  assert.equal(ui.dirty(), true);
});

test('salvar cópia recupera rascunho na raiz quando pasta e arquivo foram removidos', async () => {
  let current = entry({ parentId: 'folder' }),
    revision = 0,
    saved;
  const ui = await component('src/apps/file-editor/FileEditor.jsx', editorProps(), {
    readLocalFile: async () => {
      if (!current) throw Error('Arquivo ou pasta não encontrado.');
      return current;
    },
    localFilesRevision: () => revision,
    listLocalFiles: async () => [],
    createLocalText: async (...args) => {
      saved = args;
    },
  });
  await ui.flush();
  ui.nodes()
    .find((n) => n.type === 'textarea')
    .props.onChange({ target: { value: 'recuperado' } });
  ui.render();
  current = null;
  revision++;
  ui.render();
  await ui.flush();
  assert.match(ui.text(), /não encontrado/);
  await ui.button('Salvar cópia').props.onClick();
  ui.render();
  assert.equal(saved[1], null);
  assert.equal(saved[2], 'recuperado');
  assert.equal(ui.dirty(), true);
});

test('recarregar exige confirmação e protege fechamento durante gravação', async () => {
  let current = entry(),
    resolve;
  const ui = await component('src/apps/file-editor/FileEditor.jsx', editorProps(), {
    readLocalFile: async () => current,
    saveLocalText: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  await ui.flush();
  ui.nodes()
    .find((n) => n.type === 'textarea')
    .props.onChange({ target: { value: 'rascunho' } });
  ui.render();
  ui.button('Recarregar arquivo').props.onClick();
  ui.render();
  assert.ok(ui.button('Descartar rascunho e recarregar'));
  ui.button('Cancelar').props.onClick();
  ui.render();
  assert.equal(ui.nodes().find((n) => n.type === 'textarea').props.value, 'rascunho');
  const pending = ui.button('Salvar').props.onClick();
  ui.render();
  assert.equal(ui.nodes().find((n) => n.type === 'textarea').props.disabled, true);
  assert.equal(ui.dirty(), true);
  current = entry({ revision: 2, blob: new Blob(['rascunho']) });
  resolve(current);
  await pending;
  ui.render();
  assert.equal(ui.dirty(), false);
});

test('editor recusa URL oficial e arquivos não textuais', async () => {
  let calls = 0;
  const ui = await component(
    'src/apps/file-editor/FileEditor.jsx',
    { instance: { id: 'editor', params: { url: '/curriculo.pdf' } } },
    {
      readLocalFile: async () => {
        calls++;
      },
    },
  );
  await ui.flush();
  assert.equal(calls, 0);
  assert.equal(ui.button('Salvar'), undefined);
  const image = await component('src/apps/file-editor/FileEditor.jsx', editorProps(), {
    readLocalFile: async () => entry({ name: 'x.png' }),
  });
  await image.flush();
  assert.match(image.text(), /1 MB/);
  assert.equal(image.button('Salvar'), undefined);
});

test('visualizador mostra texto escapado, download e libera URLs ao atualizar e fechar', async () => {
  const revoked = [];
  let revision = 0,
    id = 0,
    current = entry({ blob: new Blob(['<script>literal</script>']) });
  const ui = await component(
    'src/apps/file-viewer/LocalFileViewer.jsx',
    { fileId: 'file' },
    {
      readLocalFile: async () => current,
      localFilesRevision: () => revision,
      URL: { createObjectURL: () => `blob:${++id}`, revokeObjectURL: (url) => revoked.push(url) },
    },
  );
  await ui.flush();
  assert.match(ui.text(), /<script>literal/);
  assert.equal(ui.nodes().find((n) => n.type === 'a').props.download, 'a.txt');
  current = entry({ revision: 2 });
  revision++;
  ui.render();
  await ui.flush();
  assert.deepEqual(revoked, ['blob:1']);
  ui.unmount();
  assert.deepEqual(revoked, ['blob:1', 'blob:2']);
});

test('visualizador não cria URL após fechamento e informa arquivo removido', async () => {
  let resolve,
    created = 0;
  const ui = await component(
    'src/apps/file-viewer/LocalFileViewer.jsx',
    { fileId: 'file' },
    {
      readLocalFile: () =>
        new Promise((done) => {
          resolve = done;
        }),
      URL: {
        createObjectURL: () => {
          created++;
          return 'blob:x';
        },
        revokeObjectURL() {},
      },
    },
  );
  ui.unmount();
  resolve(entry());
  await ui.flush();
  assert.equal(created, 0);
  const removed = await component(
    'src/apps/file-viewer/LocalFileViewer.jsx',
    { fileId: 'file' },
    {
      readLocalFile: async () => {
        throw Error('Arquivo ou pasta não encontrado.');
      },
    },
  );
  await removed.flush();
  assert.match(removed.text(), /não encontrado/);
});

test('visualizador mantém download ao falhar imagem, limita zoom e isola PDF', async () => {
  const bindings = {
    readLocalFile: async () => entry({ name: 'a.png' }),
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  };
  const image = await component(
    'src/apps/file-viewer/LocalFileViewer.jsx',
    { fileId: 'file' },
    bindings,
  );
  await image.flush();
  for (let i = 0; i < 20; i++) {
    image.button('Ampliar').props.onClick();
    image.render();
  }
  assert.match(image.text(), /300\s*%/);
  image
    .nodes()
    .find((n) => n.type === 'img')
    .props.onError({ currentTarget: {} });
  image.render();
  assert.match(image.text(), /Não foi possível/);
  assert.ok(image.nodes().find((n) => n.type === 'a'));
  const pdf = await component(
    'src/apps/file-viewer/LocalFileViewer.jsx',
    { fileId: 'file' },
    { ...bindings, readLocalFile: async () => entry({ name: 'a.pdf' }) },
  );
  await pdf.flush();
  assert.equal(pdf.nodes().find((n) => n.type === 'iframe').props.sandbox, '');
});

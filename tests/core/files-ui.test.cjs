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
    useMemo: (fn, deps) => {
      const i = cursor++;
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i].deps[j]))
        slots[i] = { deps, value: fn() };
      return slots[i].value;
    },
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
  const name = bindings.componentName ?? /export default function (\w+)/.exec(code)[1];
  const clean = code
    .replace(/^import[\s\S]*?;\s*$/gm, '')
    .replace('export default function', 'function');
  const Component = vm.runInNewContext(`${clean}; ${name}`, {
    ...Object.fromEntries(
      [
        'House',
        'FolderOpen',
        'ShieldCheck',
        'Trash2',
        'LayoutGrid',
        'List',
        'Folder',
        'FileText',
        'FileImage',
        'FileCode2',
        'FileJson',
        'FileSpreadsheet',
        'FileType',
        'File',
      ].map((name) => [name, name]),
    ),
    localStorage: { getItem: () => null, setItem() {} },
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
    FILE_LIMIT: 10 * 1024 * 1024,
    Uint8Array,
    setTimeout,
    clearTimeout,
    Download: 'Download',
    ExternalLink: 'ExternalLink',
    FileQuestion: 'FileQuestion',
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
  function nodes(n) {
    if (!arguments.length) n = tree;
    if (Array.isArray(n)) return n.flatMap(nodes);
    return n && typeof n === 'object' ? [n, ...nodes(n.props.children)] : [];
  }
  function text(n) {
    if (!arguments.length) n = tree;
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

function officialBindings(fetchMock, overrides = {}) {
  const revoked = [];
  class AssetURL extends URL {
    static createObjectURL() {
      return 'blob:official';
    }
    static revokeObjectURL(url) {
      revoked.push(url);
    }
  }
  return {
    componentName: 'OfficialFileViewer',
    URL: AssetURL,
    window: { location: { href: 'https://ws.test/', origin: 'https://ws.test' } },
    fetch: fetchMock,
    revoked,
    ...overrides,
  };
}
const officialProps = (url = '/curriculo.pdf') => ({
  instance: { id: 'viewer', origin: 'resume', params: { url, name: 'Currículo' } },
});

test('documentos oficiais aceitam contrato url/name e isolam PDF validado', async () => {
  let request;
  const bindings = officialBindings(async (url, options) => {
    request = { url, options };
    return new Response('%PDF-1.7\n', { headers: { 'Content-Type': 'application/pdf' } });
  });
  const ui = await component('src/apps/file-viewer/FileViewer.jsx', officialProps(), bindings);
  await ui.flush();
  assert.equal(request.url, 'https://ws.test/curriculo.pdf');
  assert.equal(request.options.redirect, 'error');
  assert.equal(ui.nodes().find((n) => n.type === 'iframe').props.sandbox, '');
  assert.equal(
    ui.nodes().find((n) => n.type === 'a' && n.props.download).props.href,
    'blob:official',
  );
  ui.unmount();
  assert.deepEqual(bindings.revoked, ['blob:official']);
});

test('visualizador oficial recusa origens externas, credenciais, consultas e PDFs inválidos', async () => {
  let calls = 0;
  for (const url of [
    'https://other.test/x.pdf',
    'https://user:pass@ws.test/x.pdf',
    '/x.pdf?token=x',
    '/x.pdf#fragment',
    'javascript:alert(1)',
  ]) {
    const ui = await component(
      'src/apps/file-viewer/FileViewer.jsx',
      officialProps(url),
      officialBindings(async () => {
        calls++;
      }),
    );
    await ui.flush();
    assert.match(ui.text(), /Nenhum arquivo selecionado/);
  }
  assert.equal(calls, 0);
  for (const [body, type] of [
    ['<html>SPA</html>', 'text/html'],
    ['not pdf', 'application/pdf'],
  ]) {
    const ui = await component(
      'src/apps/file-viewer/FileViewer.jsx',
      officialProps(),
      officialBindings(async () => new Response(body, { headers: { 'Content-Type': type } })),
    );
    await ui.flush();
    assert.match(ui.text(), /Não foi possível abrir/);
    assert.equal(
      ui.nodes().find((n) => n.type === 'iframe'),
      undefined,
    );
  }
});

test('prévia oficial limita leitura por stream mesmo sem Content-Length e oferece download', async () => {
  const ui = await component(
    'src/apps/file-viewer/FileViewer.jsx',
    officialProps('/grande.txt'),
    officialBindings(
      async () =>
        new Response('x'.repeat(1024 * 1024 + 1), { headers: { 'Content-Type': 'text/plain' } }),
    ),
  );
  await ui.flush();
  assert.match(ui.text(), /grande demais/);
  assert.equal(
    ui.nodes().find((n) => n.type === 'a' && n.props.download).props.href,
    'https://ws.test/grande.txt',
  );
  assert.equal(
    ui.nodes().find((n) => n.type === 'pre'),
    undefined,
  );
});

test('HTML oficial é exibido como texto, nunca como iframe executável', async () => {
  const ui = await component(
    'src/apps/file-viewer/FileViewer.jsx',
    officialProps('/exemplo.html'),
    officialBindings(
      async () =>
        new Response('<script>literal</script>', { headers: { 'Content-Type': 'text/html' } }),
    ),
  );
  await ui.flush();
  assert.match(ui.text(), /<script>literal/);
  assert.equal(
    ui.nodes().find((n) => n.type === 'iframe'),
    undefined,
  );
});

test('gerenciador impede criar na raiz por engano quando a pasta aberta é removida', async () => {
  const store = {
    entries: [entry({ id: 'folder', kind: 'folder', name: 'Pasta', blob: null })],
    loading: false,
    error: '',
    refresh() {},
  };
  let back,
    created = 0;
  const ui = await component(
    'src/apps/files/Files.jsx',
    { instance: { id: 'files' } },
    {
      useLocalFiles: () => store,
      useSystem: () => ({ run() {} }),
      useAppBack: (_id, handler) => {
        back = handler;
      },
      portfolio: { officialFiles: [] },
      contentText: (value) => value,
      publicAssetUrl: () => null,
      openApp: 'open',
      createLocalFolder: async () => {
        created++;
      },
    },
  );
  ui.button('Meus arquivos').props.onClick();
  ui.render();
  ui.button('Abrir').props.onClick();
  ui.render();
  store.entries = [];
  ui.render();
  assert.match(ui.text(), /Pasta de destino indisponível/);
  ui.nodes()
    .find((n) => n.type === 'input')
    .props.onChange({ target: { value: 'Nova' } });
  ui.render();
  assert.equal(ui.button('Criar pasta').props.disabled, true);
  await ui.button('Criar pasta').props.onClick();
  ui.render();
  assert.equal(created, 0);
  assert.equal(back(), true);
  ui.render();
  assert.equal(ui.button('Pasta anterior'), undefined);
});

test('Arquivos abre visualizador/editor pelo contrato fileId e mantém oficiais sem escrita', async () => {
  const calls = [];
  const store = { entries: [entry()], loading: false, error: '', refresh() {} };
  const ui = await component(
    'src/apps/files/Files.jsx',
    { instance: { id: 'files' } },
    {
      useLocalFiles: () => store,
      useSystem: () => ({ run: (...args) => calls.push(args) }),
      useAppBack() {},
      portfolio: { officialFiles: [{ id: 'official', name: 'PDF oficial', url: '/oficial.pdf' }] },
      contentText: (value) => value,
      publicAssetUrl: (url) => url,
      openApp: 'open',
    },
  );
  ui.button('Meus arquivos').props.onClick();
  ui.render();
  ui.button('Abrir').props.onClick();
  ui.button('Editar').props.onClick();
  assert.equal(calls[0][1], 'file-viewer');
  assert.equal(calls[0][2].params.fileId, 'file');
  assert.equal(calls[1][1], 'file-editor');
  ui.button('Arquivos oficiais').props.onClick();
  ui.render();
  assert.equal(ui.button('Criar pasta'), undefined);
  assert.equal(ui.button('Editar'), undefined);
  ui.button('Visualizar').props.onClick();
  assert.equal(calls[2][2].params.url, '/oficial.pdf');
});

test('leitura do gerenciador ignora resposta antiga e preserva listagem ao falhar atualização', async () => {
  const requests = [];
  const ui = await component(
    'src/shared/hooks/useLocalFiles.js',
    {},
    {
      listLocalFiles: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
    },
  );
  ui.render().refresh();
  ui.render();
  requests[1].resolve([entry({ name: 'atual.txt' })]);
  await ui.flush();
  requests[0].resolve([entry({ name: 'antigo.txt' })]);
  await ui.flush();
  assert.equal(ui.render().entries[0].name, 'atual.txt');
  ui.render().refresh();
  ui.render();
  requests[2].reject(Error('Falha de leitura'));
  await ui.flush();
  const state = ui.render();
  assert.equal(state.error, 'Falha de leitura');
  assert.equal(state.entries[0].name, 'atual.txt');
});

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
    createElement: (type, props, ...children) => {
      if (props?.ref && bindings.attachRef) props.ref.current = bindings.attachRef(type, props);
      return { type, props: { ...props, children } };
    },
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
        'Search',
        'FilePlus2',
        'ChevronRight',
        'HardDrive',
        'Sparkles',
        'RotateCcw',
        'Copy',
        'Save',
        'Replace',
        'X',
        'MoreHorizontal',
        'Info',
        'Upload',
        'Plus',
        'ArrowLeft',
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
        'DocumentView',
        'PdfPreview',
        'ChevronLeft',
        'Minus',
        'RotateCw',
      ].map((name) => [name, name]),
    ),
    fetchManagedContent: async () => ({ data: [] }),
    window: { addEventListener() {}, removeEventListener() {} },
    subscribePublicData: () => () => {},
    localStorage: { getItem: () => null, setItem() {} },
    createPortal: (node) => node,
    document: { body: {}, activeElement: null },
    React,
    ...React,
    URL,
    AbortController,
    Blob,
    TextDecoder,
    useLocale: () => 'pt-BR',
    t: (s) => s,
    findText: (text, query, start = 0) => text.indexOf(query, start),
    replaceText: (text, query, replacement) => text.replace(query, replacement),
    tokenizeText: (text) => [{ text, type: 'plain' }],
    fileKind: (name) =>
      name.endsWith('.txt')
        ? 'text'
        : name.endsWith('.png')
          ? 'image'
          : name.endsWith('.pdf')
            ? 'pdf'
            : null,
    validateFileName: require('../helpers/contract-loader.cjs').loadContract(
      path.join(root, 'src/services/storage/fileModel.js'),
    ).validateFileName,
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

/* === Testes do Visualizador de Arquivos === */
/* ----- Localização da interface compartilhada ----- */
function documentView(ui) {
  const node = ui.nodes().find((item) => item.type === 'DocumentView');

  assert.ok(node, 'O visualizador deve utilizar DocumentView.');

  return node.props;
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
  /* ----- Conflito bloqueia o salvamento direto ----- */
  assert.equal(ui.button('Salvar').props.disabled, true);
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
  /* ----- Abertura do diálogo e confirmação da cópia ----- */
  ui.button('Salvar cópia').props.onClick();
  ui.render();

  assert.ok(ui.button('Criar cópia'));

  /* ----- Confirmação do formulário de cópia ----- */
  const copyForm = ui
    .nodes()
    .find((node) => node.type === 'form' && node.props.className === 'ws-editor__modal');

  assert.ok(copyForm, 'O formulário de cópia deve estar aberto.');

  copyForm.props.onSubmit({
    preventDefault() {},
  });

  await ui.flush();

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
  assert.match(documentView(ui).text, /<script>literal/);
  assert.equal(documentView(ui).name, 'a.txt');
  assert.equal(documentView(ui).url, 'blob:1');
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
  assert.match(documentView(removed).error, /não encontrado/);
});

test('visualizador local encaminha imagens e PDFs à interface compartilhada', async () => {
  const bindings = {
    readLocalFile: async () => entry({ name: 'a.png' }),
    URL: {
      createObjectURL: () => 'blob:x',
      revokeObjectURL() {},
    },
  };

  /* ----- Pré-visualização de imagem ----- */
  const image = await component(
    'src/apps/file-viewer/LocalFileViewer.jsx',
    { fileId: 'file' },
    bindings,
  );

  await image.flush();

  const imageProps = documentView(image);

  assert.equal(imageProps.kind, 'image');
  assert.equal(imageProps.name, 'a.png');
  assert.equal(imageProps.url, 'blob:x');
  assert.ok(imageProps.blob instanceof Blob);
  assert.equal(typeof imageProps.onImageError, 'function');

  imageProps.onImageError();
  image.render();

  assert.equal(documentView(image).previewError, true);

  image.unmount();

  /* ----- Pré-visualização de PDF ----- */
  const pdf = await component(
    'src/apps/file-viewer/LocalFileViewer.jsx',
    { fileId: 'file' },
    {
      ...bindings,
      readLocalFile: async () => entry({ name: 'a.pdf' }),
    },
  );

  await pdf.flush();

  const pdfProps = documentView(pdf);

  assert.equal(pdfProps.kind, 'pdf');
  assert.equal(pdfProps.name, 'a.pdf');
  assert.ok(pdfProps.blob instanceof Blob);

  pdf.unmount();
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
  const props = documentView(ui);

  assert.equal(props.kind, 'pdf');
  assert.ok(props.blob instanceof Blob);
  assert.equal(props.url, 'blob:official');
  assert.equal(documentView(ui).url, 'blob:official');
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

    /* ----- URL inválida não disponibiliza o documento ----- */
    const props = documentView(ui);

    assert.equal(Boolean(props.blob), false);
    assert.equal(Boolean(props.url), false);
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
    /* ----- Rejeição de conteúdo inválido ----- */
    const props = documentView(ui);

    assert.ok(props.error);
    assert.equal(Boolean(props.blob), false);
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
  /* ----- Limite de pré-visualização ----- */
  const props = documentView(ui);

  assert.equal(props.kind, 'text');
  assert.equal(Boolean(props.blob), false);
  assert.ok(props.error);
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
  /* ----- HTML apresentado como texto ----- */
  const props = documentView(ui);

  assert.equal(props.kind, 'text');
  assert.match(props.text, /<script>literal/);
  assert.ok(props.blob instanceof Blob);
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
  ui.nodes()
    .find((n) => n.type === 'li' && n.props.onDoubleClick)
    .props.onDoubleClick();
  ui.render();
  store.entries = [];
  ui.render();
  assert.match(ui.text(), /Pasta de destino indisponível/);
  assert.equal(ui.button('Criar pasta').props.disabled, true);

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
  const row = ui.nodes().find((n) => n.type === 'li' && n.props.onDoubleClick);
  row.props.onDoubleClick();
  row.props.onClick({});
  ui.render();
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

/* === Compatibilidade dos descritores com o Visualizador === */
/* ----- Roteamento de arquivos locais e gerenciados ----- */
test('Visualizador roteia descritores locais e gerenciados validados', async () => {
  const { loadContract } = require('../helpers/contract-loader.cjs');

  const { validateFileResource } = loadContract(
    path.join(root, 'src/services/storage/fileResourceContract.js'),
  );

  /* ----- Arquivo pessoal ----- */
  const local = await component(
    'src/apps/file-viewer/FileViewer.jsx',
    {
      instance: {
        params: {
          resource: { source: 'local', fileId: 'one' },
        },
      },
    },
    {
      validateFileResource,
      LocalFileViewer: 'LocalViewer',
    },
  );

  assert.equal(local.nodes()[0].type, 'LocalViewer');
  assert.equal(local.nodes()[0].props.fileId, 'one');

  /* ----- Arquivo gerenciado autorizado pelo contrato ----- */
  const managed = await component(
    'src/apps/file-viewer/FileViewer.jsx',
    {
      instance: {
        params: {
          resource: { source: 'managed', resourceId: 'one' },
        },
      },
    },
    { validateFileResource },
  );

  assert.equal(managed.nodes()[0].props.resourceId, 'one');

  /* ----- Identificador inválido ----- */
  const invalid = await component(
    'src/apps/file-viewer/FileViewer.jsx',
    {
      instance: {
        params: {
          resource: {
            source: 'managed',
            resourceId: '../arquivo',
          },
        },
      },
    },
    { validateFileResource },
  );

  assert.equal(invalid.nodes()[0].props.source, 'invalid');
});

/* === Menus de contexto do explorador === */
const contextEvent = (extra = {}) => ({
  preventDefault() {},
  stopPropagation() {},
  clientX: 310,
  clientY: 240,
  currentTarget: { getBoundingClientRect: () => ({ left: 100, top: 80 }), focus() {} },
  ...extra,
});
async function filesMenu(store, extra = {}) {
  return component(
    'src/apps/files/Files.jsx',
    { instance: { id: 'files' } },
    {
      useLocalFiles: () => store,
      useSystem: () => ({ run() {} }),
      useAppBack() {},
      portfolio: { officialFiles: [{ id: 'pdf', name: 'Oficial', url: '/oficial.pdf' }] },
      contentText: (value) => value,
      publicAssetUrl: (url) => url,
      openApp: 'open',
      ...extra,
    },
  );
}
const menuNode = (ui) => ui.nodes().find((node) => node.props.role === 'menu');

test('clique direito no espaço vazio oferece criação apenas no espaço pessoal', async () => {
  let refreshed = 0;
  const store = {
    entries: [entry()],
    loading: false,
    error: '',
    refresh() {
      refreshed++;
    },
  };
  const ui = await filesMenu(store);
  const background = () => ui.nodes().find((node) => node.type === 'main');
  const event = () => contextEvent({ target: { closest: () => null } });
  background().props.onContextMenu(event());
  ui.render();
  assert.ok(menuNode(ui));
  assert.equal(ui.button('Criar pasta'), undefined);
  ui.button('Atualizar').props.onClick();
  ui.render();
  assert.equal(refreshed, 1);
  ui.button('Meus arquivos').props.onClick();
  ui.render();
  background().props.onContextMenu(event());
  ui.render();
  const menu = menuNode(ui);
  assert.equal(menu.props.style.left, 310);
  assert.equal(menu.props.style.top, 240);
  const create = ui
    .nodes(menu)
    .find((node) => node.type === 'button' && ui.text(node).trim() === 'Criar pasta');
  create.props.onClick();
  menu.props.onClick();
  ui.render();
  assert.ok(ui.nodes().find((node) => node.type === 'form' && node.props.onSubmit));
  assert.equal(menuNode(ui), undefined);
  ui.unmount();
});

test('menu local preserva seleção múltipla e expõe ações próprias da lixeira', async () => {
  let operations;
  const store = {
    entries: [entry(), entry({ id: 'second', name: 'b.txt' })],
    loading: false,
    error: '',
    refresh() {},
  };
  const ui = await filesMenu(store, {
    changeLocalFiles: async (items) => {
      operations = items;
    },
  });
  ui.button('Meus arquivos').props.onClick();
  ui.render();
  const rows = () => ui.nodes().filter((node) => node.type === 'li' && node.props.onContextMenu);
  rows()[0].props.onClick({});
  ui.render();
  rows()[1].props.onClick({ ctrlKey: true });
  ui.render();
  rows()[0].props.onContextMenu(contextEvent());
  ui.render();
  assert.equal(
    ui
      .nodes(menuNode(ui))
      .find((node) => node.type === 'button' && ui.text(node).trim() === 'Renomear').props.disabled,
    true,
  );
  const trash = ui
    .nodes(menuNode(ui))
    .find((node) => node.type === 'button' && ui.text(node).trim() === 'Mover para lixeira');
  await trash.props.onClick();
  ui.render();
  assert.deepEqual(
    Array.from(operations, (item) => item.id),
    ['file', 'second'],
  );
  store.entries = [entry({ trashed: true })];
  ui.button('Lixeira').props.onClick();
  ui.render();
  rows()[0].props.onContextMenu(contextEvent());
  ui.render();
  assert.match(ui.text(menuNode(ui)), /Restaurar.*Excluir definitivamente/);
  assert.doesNotMatch(ui.text(menuNode(ui)), /Renomear|Editar/);
  ui.unmount();
});

test('menu oficial por teclado permite visualizar e nunca expõe alterações', async () => {
  const calls = [];
  const ui = await filesMenu(
    { entries: [], loading: false, error: '', refresh() {} },
    {
      useSystem: () => ({ run: (...args) => calls.push(args) }),
    },
  );
  ui.button('Arquivos oficiais').props.onClick();
  ui.render();
  const card = ui.nodes().find((node) => node.props.className?.includes('ws-files__official-card'));
  const target = { getBoundingClientRect: () => ({ left: 120, top: 90 }) };
  card.props.onKeyDown(
    contextEvent({
      key: 'F10',
      shiftKey: true,
      clientX: undefined,
      clientY: undefined,
      currentTarget: target,
      target,
    }),
  );
  ui.render();
  assert.equal(menuNode(ui).props.style.left, 132);
  assert.equal(menuNode(ui).props.style.top, 102);
  assert.doesNotMatch(ui.text(menuNode(ui)), /Renomear|Mover|Excluir|Criar|Editar/);
  ui.nodes(menuNode(ui))
    .find((node) => node.type === 'button' && ui.text(node) === 'Visualizar')
    .props.onClick();
  assert.equal(calls[0][1], 'file-viewer');
  assert.equal(calls[0][2].params.url, '/oficial.pdf');
  ui.unmount();
});

test('pesquisa em todas as pastas alterna escopo sem modificar os arquivos', async () => {
  const store = {
    entries: [entry(), entry({ id: 'nested', parentId: 'folder', name: 'oculto.txt' })],
    loading: false,
    error: '',
    refresh() {},
  };
  const ui = await filesMenu(store);
  ui.button('Meus arquivos').props.onClick();
  ui.render();
  ui.nodes()
    .find((node) => node.type === 'input' && node.props.type === 'search')
    .props.onChange({ target: { value: 'oculto' } });
  ui.render();
  assert.equal(
    ui.nodes().filter((node) => node.type === 'li' && node.props.onDoubleClick).length,
    0,
  );
  ui.button('Todas as pastas').props.onClick();
  ui.render();
  assert.equal(ui.button('Todas as pastas').props['aria-pressed'], true);
  assert.equal(
    ui.nodes().filter((node) => node.type === 'li' && node.props.onDoubleClick).length,
    1,
  );
  assert.equal(store.entries.length, 2);
  ui.unmount();
});

/* === Regressões do fechamento da Etapa 05: Editor === */
test('cópia mantém a pasta atual e preserva o rascunho quando a gravação falha', async () => {
  let destination;
  const file = entry({ parentId: 'original' });
  const ui = await component('src/apps/file-editor/FileEditor.jsx', editorProps(), {
    readLocalFile: async () => file,
    listLocalFiles: async () => [
      entry({ parentId: 'moved' }),
      entry({ id: 'moved', kind: 'folder', blob: null }),
    ],
    createLocalText: async (...args) => {
      destination = args;
      throw Error('Não foi possível salvar o arquivo.');
    },
  });
  await ui.flush();
  ui.nodes()
    .find((node) => node.type === 'textarea')
    .props.onChange({ target: { value: 'rascunho seguro' } });
  ui.render();
  ui.button('Salvar cópia').props.onClick();
  ui.render();
  ui.nodes()
    .find((node) => node.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  await ui.flush();
  assert.equal(destination[1], 'moved');
  assert.equal(destination[2], 'rascunho seguro');
  assert.equal(ui.nodes().find((node) => node.type === 'textarea').props.value, 'rascunho seguro');
  assert.equal(ui.dirty(), true);
  assert.ok(ui.button('Criar cópia'));
  assert.match(ui.text(), /Não foi possível salvar/);
  ui.unmount();
});

test('controles do Editor têm identificadores por instância e recarregar registra o foco de origem', async () => {
  const trigger = { focus() {}, isConnected: true };
  const first = await component('src/apps/file-editor/FileEditor.jsx', editorProps(), {
    readLocalFile: async () => entry(),
    document: { activeElement: trigger },
  });
  const second = await component(
    'src/apps/file-editor/FileEditor.jsx',
    { instance: { id: 'other-editor', params: { fileId: 'file' } } },
    {
      readLocalFile: async () => entry(),
    },
  );
  await first.flush();
  await second.flush();
  const panelA = first.button('Localizar').props['aria-controls'];
  const panelB = second.button('Localizar').props['aria-controls'];
  assert.notEqual(panelA, panelB);
  first.button('Localizar').props.onClick();
  first.render();
  assert.ok(first.nodes().some((node) => node.props.id === panelA));
  first
    .nodes()
    .find((node) => node.type === 'textarea')
    .props.onChange({ target: { value: 'alterado' } });
  first.render();
  first.button('Recarregar arquivo').props.onClick();
  first.render();
  const dialog = first.nodes().find((node) => node.props.role === 'dialog');
  assert.ok(first.nodes(dialog).some((node) => node.props.id === dialog.props['aria-labelledby']));
  first.button('Cancelar').props.onClick();
  first.render();
  assert.equal(first.nodes().find((node) => node.type === 'textarea').props.value, 'alterado');
  first.unmount();
  second.unmount();
});

/* === Regressões do fechamento da Etapa 05: PDF e catálogo === */
function pdfBindings(getDocument, extra = {}) {
  const canvas = { getContext: () => ({}), style: {} };
  return {
    pdfjs: { GlobalWorkerOptions: {}, getDocument },
    workerSrc: '/worker.mjs',
    window: { devicePixelRatio: 1 },
    attachRef: (type) =>
      type === 'canvas' ? canvas : type === 'div' ? { clientWidth: 600 } : null,
    ...extra,
  };
}
function pdfDocument(overrides = {}) {
  return {
    numPages: 3,
    getPage: async () => ({
      getViewport: ({ scale }) => ({ width: 500 * scale, height: 700 * scale }),
      render: () => ({ promise: Promise.resolve(), cancel() {} }),
      getTextContent: async () => ({ items: [{ str: 'conteúdo do documento' }] }),
    }),
    ...overrides,
  };
}

test('PDF troca documento sem manter página antiga e recupera falha anterior', async () => {
  let attempt = 0,
    destroyed = 0;
  const props = { blob: new Blob(['bad']), name: 'teste.pdf' };
  const ui = await component(
    'src/apps/file-viewer/PdfPreview.jsx',
    props,
    pdfBindings(() => ({
      promise:
        ++attempt === 1 ? Promise.reject(Error('PDF inválido')) : Promise.resolve(pdfDocument()),
      destroy: async () => {
        destroyed++;
      },
    })),
  );
  await ui.flush();
  assert.match(ui.text(), /Não foi possível interpretar/);
  props.blob = new Blob(['good']);
  ui.render();
  assert.match(ui.text(), /Carregando PDF/);
  await ui.flush();
  await ui.flush();
  assert.doesNotMatch(ui.text(), /Não foi possível interpretar/);
  assert.equal(ui.nodes().find((node) => node.type === 'canvas').props.hidden, false);
  ui.nodes()
    .find((node) => node.props['aria-label'] === 'Próxima página')
    .props.onClick();
  ui.render();
  assert.match(ui.text(), /2.*3/);
  props.blob = new Blob(['next']);
  ui.render();
  await ui.flush();
  await ui.flush();
  assert.match(ui.text(), /1.*3/);
  ui.unmount();
  assert.equal(destroyed, 3);
});

test('PDF cancela renderização e rejeita ajuste de largura atrasado ao trocar página', async () => {
  let cancelled = 0,
    resolveFit,
    count = 0;
  const page = {
    getViewport: ({ scale }) => ({ width: 500 * scale, height: 700 * scale }),
    render: () => ({
      promise: Promise.resolve(),
      cancel() {
        cancelled++;
      },
    }),
  };
  const document = pdfDocument({
    getPage: () =>
      ++count === 2
        ? new Promise((resolve) => {
            resolveFit = resolve;
          })
        : Promise.resolve(page),
  });
  const ui = await component(
    'src/apps/file-viewer/PdfPreview.jsx',
    { blob: new Blob(['pdf']), name: 'teste.pdf' },
    pdfBindings(() => ({ promise: Promise.resolve(document), destroy: async () => {} })),
  );
  await ui.flush();
  await ui.flush();
  ui.button('Ajustar largura').props.onClick();
  ui.nodes()
    .find((node) => node.props['aria-label'] === 'Próxima página')
    .props.onClick();
  ui.render();
  resolveFit(page);
  await ui.flush();
  assert.match(ui.text(), /100\s*%/);
  assert.equal(cancelled, 1);
  ui.unmount();
  assert.equal(cancelled, 2);
});

test('PDF encerra pesquisa cancelada antes de ler o texto de outra página', async () => {
  let getTextCalls = 0,
    resolvePage;
  const document = pdfDocument({
    getPage: (number) =>
      number === 2
        ? new Promise((resolve) => {
            resolvePage = resolve;
          })
        : Promise.resolve({
            getViewport: () => ({ width: 500, height: 700 }),
            render: () => ({ promise: Promise.resolve(), cancel() {} }),
            getTextContent: async () => {
              getTextCalls++;
              return { items: [{ str: 'busca' }] };
            },
          }),
  });
  const ui = await component(
    'src/apps/file-viewer/PdfPreview.jsx',
    { blob: new Blob(['pdf']), name: 'teste.pdf' },
    pdfBindings(() => ({ promise: Promise.resolve(document), destroy: async () => {} })),
  );
  await ui.flush();
  await ui.flush();
  const input = () => ui.nodes().find((node) => node.type === 'input');
  input().props.onChange({ target: { value: 'busca' } });
  ui.render();
  await ui.flush();
  input().props.onChange({ target: { value: '' } });
  ui.render();
  resolvePage({
    getTextContent: async () => {
      getTextCalls++;
      return { items: [] };
    },
  });
  await ui.flush();
  assert.equal(getTextCalls, 1);
  assert.equal(ui.button('Ir ao resultado'), undefined);
  ui.unmount();
});

test('catálogo gerenciado informa timeout e limpa o temporizador', async () => {
  let abort,
    cleared = 0;
  const ui = await component(
    'src/apps/file-viewer/FileViewer.jsx',
    { instance: {}, resourceId: 'one' },
    {
      componentName: 'ManagedFileViewer',
      setTimeout: (callback) => {
        abort = callback;
        return 1;
      },
      clearTimeout: () => {
        cleared++;
      },
      fetch: (_url, { signal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(Error('abort'))),
        ),
    },
  );
  abort();
  await ui.flush();
  assert.match(documentView(ui).error, /Tempo de carregamento esgotado/);
  assert.equal(cleared, 1);
  ui.unmount();
});

test('arquivo oficial com tamanho declarado acima do limite cancela o corpo e mantém download', async () => {
  let cancelled = 0;
  const ui = await component(
    'src/apps/file-viewer/FileViewer.jsx',
    officialProps('/grande.txt'),
    officialBindings(
      async () =>
        new Response(
          new ReadableStream({
            cancel() {
              cancelled++;
            },
          }),
          {
            headers: { 'Content-Type': 'text/plain', 'Content-Length': String(1024 * 1024 + 1) },
          },
        ),
    ),
  );
  await ui.flush();
  assert.equal(cancelled, 1);
  assert.match(documentView(ui).error, /grande demais/);
  assert.equal(documentView(ui).url, 'https://ws.test/grande.txt');
  ui.unmount();
});

/* === Regressões do fechamento da Etapa 05: gerenciador === */
test('criação de texto valida o nome antes de adicionar a extensão', async () => {
  const created = [];
  const ui = await filesMenu(
    { entries: [], loading: false, error: '', refresh() {} },
    {
      createLocalText: async (name) => {
        created.push(name);
        return entry({ name });
      },
    },
  );
  ui.button('Meus arquivos').props.onClick();
  ui.render();
  ui.button('Criar arquivo de texto').props.onClick();
  ui.render();
  const nameInput = () =>
    ui.nodes().find((node) => node.props['aria-label'] === 'Nome do novo item');
  for (const name of [' ', '.', '..', 'x'.repeat(121)]) {
    nameInput().props.onChange({ target: { value: name } });
    ui.render();
    await ui
      .nodes()
      .find((node) => node.type === 'form' && node.props.role === 'dialog')
      .props.onSubmit({ preventDefault() {} });
    ui.render();
    assert.match(ui.text(), /Nome inválido/);
    assert.equal(created.length, 0);
  }
  nameInput().props.onChange({ target: { value: 'novo' } });
  ui.render();
  await ui
    .nodes()
    .find((node) => node.type === 'form' && node.props.role === 'dialog')
    .props.onSubmit({ preventDefault() {} });
  ui.render();
  ui.button('Criar arquivo de texto').props.onClick();
  ui.render();
  nameInput().props.onChange({ target: { value: 'OUTRO.TXT' } });
  ui.render();
  await ui
    .nodes()
    .find((node) => node.type === 'form' && node.props.role === 'dialog')
    .props.onSubmit({ preventDefault() {} });
  ui.render();
  assert.deepEqual(created, ['novo.txt', 'OUTRO.TXT']);
  ui.unmount();
});

test('diálogo de Arquivos restringe foco, impede Escape durante gravação e restaura a origem', async () => {
  const handlers = new Map();
  const document = {
    activeElement: null,
    body: {},
    addEventListener: (name, handler) => handlers.set(name, handler),
    removeEventListener: (name) => handlers.delete(name),
  };
  const trigger = {
    isConnected: true,
    focus() {
      document.activeElement = this;
    },
  };
  document.activeElement = trigger;
  const controls = [0, 1].map(() => ({
    focus() {
      document.activeElement = this;
    },
  }));
  const dialog = { closest: () => null, querySelectorAll: () => controls, focus() {} };
  let finish;
  const ui = await filesMenu(
    { entries: [], loading: false, error: '', refresh() {} },
    {
      document,
      attachRef: (type) => (type === 'form' ? dialog : null),
      createLocalFolder: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
  );
  ui.button('Meus arquivos').props.onClick();
  ui.render();
  ui.button('Criar pasta').props.onClick();
  ui.render();
  assert.equal(document.activeElement, controls[0]);
  document.activeElement = controls[1];
  handlers.get('keydown')({ key: 'Tab', preventDefault() {} });
  assert.equal(document.activeElement, controls[0]);
  handlers.get('keydown')({ key: 'Tab', shiftKey: true, preventDefault() {} });
  assert.equal(document.activeElement, controls[1]);
  const form = () =>
    ui.nodes().find((node) => node.type === 'form' && node.props.role === 'dialog');
  const pending = form().props.onSubmit({ preventDefault() {} });
  ui.render();
  handlers.get('keydown')({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
  ui.render();
  assert.ok(form());
  finish(entry({ kind: 'folder', blob: null }));
  await pending;
  ui.render();
  assert.equal(form(), undefined);
  assert.equal(document.activeElement, trigger);
  assert.equal(handlers.has('keydown'), false);
  ui.unmount();
});

/* ----- Foco do Editor não interfere em janelas de fundo ----- */
test('Editor foca o texto ao abrir somente quando sua janela está ativa', async () => {
  for (const active of [true, false]) {
    let focused = 0;
    const area = {
      closest: () => ({ classList: { contains: () => active } }),
      focus() {
        focused++;
      },
    };
    const ui = await component('src/apps/file-editor/FileEditor.jsx', editorProps(), {
      readLocalFile: async () => entry(),
      attachRef: (type) => (type === 'textarea' ? area : null),
    });
    await ui.flush();
    ui.render();
    assert.equal(focused, active ? 1 : 0);
    ui.unmount();
  }
});

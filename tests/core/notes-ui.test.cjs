const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Executa os handlers reais de JSX, com hooks e rede isolados, sem banco externo.
async function component(name, fetchMock) {
  const { transformWithOxc } = await import('vite');
  const source = fs.readFileSync(
    path.resolve(__dirname, `../../src/apps/notes/${name}.jsx`),
    'utf8',
  );
  const compiled = await transformWithOxc(source, `${name}.jsx`, { jsx: { runtime: 'classic' } });
  let cursor = 0,
    tree,
    dirty,
    version = 1,
    authenticated = true,
    confirmed = true;
  let refreshed = 0,
    deleted = 0;
  const slots = [],
    effects = [];
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useCallback: (callback) => callback,
    useState: (initial) => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === 'function' ? value(slots[i]) : value;
        },
      ];
    },
    useRef: (initial) => {
      const i = cursor++;
      return (slots[i] ??= { current: initial });
    },
    useEffect: (effect, deps) => {
      const i = cursor++;
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i].deps[j])) {
        slots[i]?.cleanup?.();
        slots[i] = { deps };
        effects.push(() => {
          slots[i].cleanup = effect();
        });
      }
    },
  };
  const code = compiled.code
    .replace(/^import[\s\S]*?;\s*$/gm, '')
    .replace('export default function', 'function');
  const Component = vm.runInNewContext(`${code}; ${name}`, {
    React,
    PostAttachmentManager: () => null,
    FilePlus2: 'FilePlus2', Paperclip: 'Paperclip', Send: 'Send', X: 'X', Heart: 'Heart',
    createPortal: (children) => children, document: { body: {} },
    ...React,
    AbortController,
    crypto: { randomUUID: () => 'created-note' },
    ...require('../helpers/contract-loader.cjs').loadContract(
      path.resolve(__dirname, '../../src/services/httpRequestContract.js'),
      { fetch: (...args) => fetchMock(...args) },
    ),
    subscribePublicData: () => () => {},
    invalidatePublicData: () => {},
    useLocale: () => 'pt-BR',
    t: (value) => value,
    getVisitorId: () => '0123456789abcdef0123456789abcdef',
    getAdminAccessToken: () => (authenticated ? 'token' : null),
    getAdminSessionVersion: () => version,
    invalidateAdminSession: () => {
      authenticated = false;
      version++;
    },
    subscribeAdminSession: () => () => {},
    useUnsavedChanges: (_id, value) => {
      dirty = value;
    },
    contentText: (value) => (typeof value === 'string' ? value : (value?.['pt-BR'] ?? '')),
    fetch: (...args) => fetchMock(...args),
    window: { confirm: () => confirmed },
  });
  const props = {
    postId: 'note-one',
    instanceId: 'notes-1',
    isAdmin: true,
    refreshPublicPosts: () => refreshed++,
    onDeletePublicPost: () => deleted++,
  };
  function render() {
    cursor = 0;
    tree = Component(props);
    while (effects.length) effects.shift()();
    return tree;
  }
  function nodes(node = tree) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== 'object') return [];
    return [node, ...nodes(node.props.children)];
  }
  function text(node = tree) {
    if (Array.isArray(node)) return node.map(text).join(' ');
    return node && typeof node === 'object' ? text(node.props.children) : String(node ?? '');
  }
  const flush = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    render();
  };
  render();
  return {
    render,
    flush,
    nodes,
    text,
    button: (label) => nodes().find((n) => n.type === 'button' && (n.props['aria-label'] === label || text(n).trim() === label)),
    input: (i, value) =>
      nodes()
        .filter((n) => n.type === 'input' || n.type === 'textarea')
        [i].props.onChange({ target: { value } }),
    confirm: (value) => {
      confirmed = value;
    },
    session: (value) => {
      authenticated = value;
      props.isAdmin = value;
      version++;
      render();
    },
    dirty: () => dirty,
    refreshed: () => refreshed,
    deleted: () => deleted,
  };
}

test('curtidas lê estado GET, confirma gravação sem contador e permite reconciliar', async () => {
  let liked = false;
  const ui = await component('PostLikes', async (_url, options) => {
    if (options.method === 'POST') {
      liked = true;
      return Response.json({ success: true, postId: 'note-one', count: null });
    }
    return Response.json({ postId: 'note-one', count: liked ? 1 : 0, liked });
  });
  await ui.flush();
  assert.equal(ui.button('Curtir').props.disabled, false);
  await ui.button('Curtir').props.onClick();
  ui.render();
  assert.equal(ui.button('Curtido').props.disabled, true);
  assert.match(ui.text(), /registrada/);
  ui.button('Tentar novamente').props.onClick();
  ui.render();
  await ui.flush();
  assert.ok(ui.nodes().some((n) => n.props['aria-label'] === '1 curtida'));
  assert.equal(ui.button('Tentar novamente'), undefined);
});

test('editar não descarta texto sem confirmação e expiração preserva o rascunho', async () => {
  const posts = [
    {
      id: 'one',
      title: 'Primeira',
      body: 'Texto',
      summary: 'Resumo',
      tags: [],
      updatedAt: '2026-10-18T10:00:00Z',
      status: 'draft',
    },
    {
      id: 'two',
      title: 'Segunda',
      body: 'Outro',
      summary: 'Resumo',
      tags: [],
      updatedAt: '2026-10-18T10:00:00Z',
      status: 'draft',
    },
  ];
  const ui = await component('NotesManagement', async () => Response.json({ posts }));
  await ui.button('Gerenciar publicações').props.onClick();
  await ui.flush();
  ui.button('Editar').props.onClick();
  ui.render();
  ui.input(0, 'Título pendente');
  ui.render();
  assert.equal(ui.dirty(), true);
  ui.confirm(false);
  ui.nodes()
    .filter((n) => n.type === 'button' && ui.text(n).trim() === 'Editar')[1]
    .props.onClick();
  ui.render();
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.value, 'Título pendente');
  ui.session(false);
  assert.match(ui.text(), /Sessão administrativa encerrada/);
  assert.equal(ui.dirty(), true);
  ui.session(true);
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.value, 'Título pendente');
});

test('publicar e excluir liberam seus controles e atualizam a leitura pública', async () => {
  let posts = [
    { id: 'one', title: 'Primeira', tags: [], updatedAt: '2026-10-18T10:00:00Z', status: 'draft' },
  ];
  const ui = await component('NotesManagement', async (url, options) => {
    if (options?.method === 'PATCH') {
      posts = [{ ...posts[0], status: 'published', updatedAt: '2026-10-18T11:00:00Z' }];
      return Response.json({ success: true, ...posts[0] });
    }
    if (options?.method === 'DELETE') {
      posts = [];
      return Response.json({ success: true, id: 'one' });
    }
    return Response.json({ posts });
  });
  ui.button('Gerenciar publicações').props.onClick();
  await ui.flush();
  await ui.button('Publicar').props.onClick();
  ui.render();
  assert.equal(ui.button('Despublicar').props.disabled, false);
  assert.equal(ui.refreshed(), 1);
  await ui.button('Excluir').props.onClick();
  ui.render();
  assert.match(ui.text(), /Nenhuma publicação cadastrada/);
  assert.equal(ui.deleted(), 1);
  assert.equal(ui.refreshed(), 2);
});

test('salvar cria uma nota, atualiza a leitura e ignora sucesso de sessão antiga', async () => {
  let resolve;
  const ui = await component(
    'NotesManagement',
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  ui.button('Criar rascunho').props.onClick();
  ui.render();
  ui.input(0, 'Novo título');
  ui.input(1, 'Resumo');
  ui.input(2, 'Conteúdo');
  ui.render();
  const pending = ui
    .nodes()
    .find((n) => n.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  ui.session(false);
  resolve(Response.json({ success: true, id: 'created-note' }, { status: 201 }));
  await pending;
  ui.render();
  assert.equal(ui.refreshed(), 0);
  ui.session(true);
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.value, 'Novo título');
  const save = ui
    .nodes()
    .find((n) => n.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  resolve(Response.json({ success: true, id: 'created-note' }, { status: 201 }));
  await save;
  ui.render();
  assert.equal(ui.dirty(), false);
  assert.equal(ui.refreshed(), 1);
});

/* === Regressões da finalização editorial === */
test('editor preserva texto quando a confirmação pertence a outra publicação', async () => {
  const post = {
    id: 'one',
    title: 'Título',
    summary: 'Resumo',
    body: 'Texto',
    tags: [],
    status: 'draft',
    updatedAt: '2026-10-18T10:00:00Z',
  };
  const ui = await component('NotesManagement', async (_url, options) =>
    options.method === 'PATCH'
      ? Response.json({ success: true, id: 'another-note' })
      : Response.json({ posts: [post] }),
  );
  ui.button('Gerenciar publicações').props.onClick();
  await ui.flush();
  ui.button('Editar').props.onClick();
  ui.render();
  ui.input(0, 'Texto preservado');
  ui.render();
  await ui
    .nodes()
    .find((n) => n.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  ui.render();
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.value, 'Texto preservado');
  assert.equal(ui.refreshed(), 0);
  assert.equal(ui.dirty(), true);
});

test('criação repete a mesma identidade após perda da confirmação', async () => {
  const ids = [];
  const ui = await component('NotesManagement', async (_url, options) => {
    ids.push(JSON.parse(options.body).id);
    if (ids.length === 1) throw Error('network lost after write');
    return Response.json({ success: true, id: ids[0] });
  });
  ui.button('Criar rascunho').props.onClick();
  ui.render();
  ui.input(0, 'Preservado');
  ui.render();
  const submit = () =>
    ui
      .nodes()
      .find((n) => n.type === 'form')
      .props.onSubmit({ preventDefault() {} });
  await submit();
  ui.render();
  assert.equal(ui.dirty(), true);
  await submit();
  ui.render();
  assert.deepEqual(ids, ['created-note', 'created-note']);
  assert.equal(ui.refreshed(), 1);
});

const { renderApp } = require('../helpers/app-ui.cjs');
const { loadContract } = require('../helpers/contract-loader.cjs');
const attachmentsContract = loadContract(
  path.resolve(__dirname, '../../src/services/storage/noteAttachmentContract.js'),
);
const attachment = {
  resourceId: 'attachment-1',
  name: 'nota.pdf',
  mimeType: 'application/pdf',
  size: 12,
};

test('anexo público validado abre Visualizador com origem exata e sem credenciais', async () => {
  const calls = [];
  const ui = await renderApp(
    'src/apps/notes/PostAttachments.jsx',
    { postId: 'one', instanceId: 'notes-exact' },
    {
      ...attachmentsContract,
      executeJsonRequest: async () => ({
        response: { ok: true },
        payload: { attachments: [attachment] },
      }),
      subscribePublicData: () => () => {},
      useSystem: () => ({ run: (...args) => calls.push(args) }),
    },
  );
  await ui.flush();
  ui.button('nota.pdf').props.onClick();
  assert.equal(calls[0][1], 'file-viewer');
  assert.equal(calls[0][2].originInstanceId, 'notes-exact');
  assert.equal(calls[0][2].params.url, '/api/files?id=attachment-1');
  ui.unmount();
});

test('metadados privados ou inválidos não viram botões de anexos', async () => {
  const ui = await renderApp(
    'src/apps/notes/PostAttachments.jsx',
    { postId: 'one', instanceId: 'notes-1' },
    {
      ...attachmentsContract,
      executeJsonRequest: async () => ({
        response: { ok: true },
        payload: { attachments: [{ ...attachment, storageKey: 'secret' }] },
      }),
      subscribePublicData: () => () => {},
    },
  );
  await ui.flush();
  assert.equal(ui.button('nota.pdf'), undefined);
  assert.ok(ui.button('Tentar novamente'));
  ui.unmount();
});

test('upload interrompido consulta o mesmo arquivo antes de reenviar e usa a revisão da nota', async () => {
  let item = null,
    uploads = 0;
  const created = [],
    linked = [],
    busy = [];
  const ui = await renderApp(
    'src/apps/notes/PostAttachmentManager.jsx',
    {
      post: { id: 'one', updatedAt: 'revision-one', attachments: [] },
      onPending() {},
      onBusy: (value) => busy.push(value),
      onRefresh: async () => {},
    },
    {
      ...attachmentsContract,
      MAX_POST_ATTACHMENTS: 5,
      crypto: { randomUUID: () => 'same-file' },
      getOfficialFile: async () => {
        if (!item) throw Object.assign(Error('missing'), { code: 'NOT_FOUND' });
        return { item };
      },
      createOfficialFile: async (input) => {
        created.push(input);
        item = { resourceId: input.id, state: 'pending', revision: 1 };
        return { item };
      },
      uploadOfficialFile: async (id) => {
        uploads++;
        item = { resourceId: id, state: 'available', revision: 2 };
        throw Error('lost confirmation');
      },
      setPostAttachment: async (input) => {
        linked.push(input);
        return { success: true, postId: input.postId, resourceId: input.resourceId };
      },
    },
  );
  ui.nodes()
    .find((n) => n.type === 'input')
    .props.onChange({
      target: { files: [{ name: 'test.pdf', type: 'application/pdf', size: 12 }] },
    });
  ui.render();
  await ui.button('Enviar e vincular anexo').props.onClick();
  ui.render();
  await ui.button('Enviar e vincular anexo').props.onClick();
  ui.render();
  assert.equal(created.length, 1);
  assert.equal(uploads, 1);
  assert.equal(linked[0].resourceId, 'same-file');
  assert.equal(linked[0].updatedAt, 'revision-one');
  assert.deepEqual(busy, [true, false, true, false]);
  ui.unmount();
});

test('limite de anexos bloqueia upload sem consultar ou gravar serviços', async () => {
  const ui = await renderApp(
    'src/apps/notes/PostAttachmentManager.jsx',
    {
      post: {
        id: 'one',
        updatedAt: 'revision',
        attachments: Array.from({ length: 5 }, (_, i) => ({
          ...attachment,
          resourceId: 'file-' + i,
        })),
      },
      onBusy() {},
      onPending() {},
      onRefresh() {},
    },
    { ...attachmentsContract, MAX_POST_ATTACHMENTS: 5 },
  );
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.disabled, true);
  ui.unmount();
});

test('notificação pública revalida curtidas sem transmitir dados do visitante', async () => {
  let listener,
    reads = 0;
  const transport = loadContract(
    path.resolve(__dirname, '../../src/services/httpRequestContract.js'),
    { fetch: async () => Response.json({ postId: 'one', liked: false, count: ++reads }) },
  );
  const ui = await renderApp(
    'src/apps/notes/PostLikes.jsx',
    { postId: 'one' },
    {
      ...transport,
      getVisitorId: () => 'visitor',
      subscribePublicData: (callback) => {
        listener = callback;
        return () => {};
      },
      invalidatePublicData() {},
    },
  );
  await ui.flush();
  listener({ prefix: '/api/posts' });
  ui.render();
  await ui.flush();
  assert.equal(reads, 2);
  assert.ok(ui.nodes().some((n) => n.props['aria-label'] === '2 curtidas'));
  ui.unmount();
});

/* === FEED COMPLETO E CARD DE CRIAÇÃO === */
test('feed exibe corpo integral, anexos e curtidas sem navegação de detalhes', async () => {
  const focused = [];
  const note = { id: 'one', title: 'Nota completa', summary: 'Resumo', body: 'Primeira linha\nÚltima linha da publicação', tags: ['React'], publishedAt: '2026-11-02T12:00:00Z' };
  const ui = await renderApp('src/apps/notes/Notes.jsx', {
    instance: { id: 'feed', params: { postId: 'one' }, navigationRequestId: 1 },
  }, {
    useSyncExternalStore: () => false,
    subscribeAdminSession() {}, isAdminAuthenticated: () => false,
    usePublicResource: () => ({ status: 'ready', data: [note], refresh() {} }),
    fetchNotes() {}, NotesAdmin: 'NotesAdmin', PostLikes: 'PostLikes', PostAttachments: 'PostAttachments',
    attachRef: () => ({ focus: () => focused.push('focus'), scrollIntoView: () => focused.push('scroll') }),
  });
  assert.match(ui.text(), /Última linha da publicação/);
  assert.ok(!ui.nodes().some((n) => n.type === 'button' && /detalhes|Ler publicação/.test(n.props['aria-label'] ?? '')));
  assert.equal(ui.nodes().find((n) => n.type === 'PostAttachments').props.postId, 'one');
  assert.equal(ui.nodes().find((n) => n.type === 'PostLikes').props.postId, 'one');
  assert.deepEqual(focused, ['scroll', 'focus']);
  ui.unmount();
});

test('criador fica oculto ao visitante e preserva texto ao cancelar descarte ou expirar sessão', async () => {
  const ui = await component('NotesAdmin', async () => { throw Error('nenhuma chamada esperada'); });
  ui.session(false);
  assert.equal(ui.button('Nova nota'), undefined);
  ui.session(true);
  ui.button('Nova nota').props.onClick(); ui.render();
  ui.input(0, 'Título preservado'); ui.render();
  ui.confirm(false); ui.button('Cancelar').props.onClick(); ui.render();
  assert.equal(ui.dirty(), true);
  assert.ok(ui.nodes().some((n) => n.props.role === 'dialog'));
  ui.session(false);
  assert.match(ui.text(), /Sessão administrativa encerrada/);
  assert.equal(ui.button('Salvar rascunho').props.disabled, true);
  ui.session(true);
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.value, 'Título preservado');
});

test('criador salva uma vez, usa revisão confirmada e só fecha após publicação confirmada', async () => {
  const calls = [];
  const post = { id: 'created-note', status: 'draft', updatedAt: 'revision-one' };
  const ui = await component('NotesAdmin', async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/create')) return Response.json({ success: true, id: post.id });
    if (url.endsWith('/status')) return Response.json({ success: true, id: post.id, status: 'published' });
    return Response.json({ posts: [post] });
  });
  ui.button('Nova nota').props.onClick(); ui.render();
  ui.input(0, 'Título'); ui.input(2, 'Corpo completo'); ui.render();
  const submit = ui.nodes().find((n) => n.type === 'form').props.onSubmit;
  await Promise.all([submit({ preventDefault() {} }), submit({ preventDefault() {} })]);
  ui.render();
  assert.equal(calls.filter((c) => c.url.endsWith('/create')).length, 1);
  assert.equal(ui.dirty(), false);
  assert.equal(ui.button('Publicar').props.disabled, false);
  await ui.button('Publicar').props.onClick(); ui.render();
  const mutation = calls.find((c) => c.url.endsWith('/status'));
  assert.equal(JSON.parse(mutation.options.body).updatedAt, 'revision-one');
  assert.ok(!ui.nodes().some((n) => n.props.role === 'dialog'));
  assert.equal(ui.refreshed(), 2);
});

test('criador ignora resposta de sessão antiga e não envia publicação depois da expiração', async () => {
  let resolve;
  const calls = [];
  const ui = await component('NotesAdmin', (url) => {
    calls.push(url);
    return new Promise((done) => { resolve = done; });
  });
  ui.button('Nova nota').props.onClick(); ui.render();
  ui.input(0, 'Rascunho'); ui.input(2, 'Conteúdo'); ui.render();
  const pending = ui.nodes().find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} });
  ui.session(false);
  resolve(Response.json({ success: true, id: 'created-note' }));
  await pending; ui.render();
  assert.equal(calls.length, 1);
  assert.equal(ui.refreshed(), 0);
  assert.equal(ui.dirty(), true);
});

test('criador mantém identidade após falha e preserva o card em conflito de publicação', async () => {
  const ids = [];
  const ui = await component('NotesAdmin', async (url, options) => {
    if (url.endsWith('/create')) {
      ids.push(JSON.parse(options.body).id);
      if (ids.length === 1) throw Error('rede interrompida');
      return Response.json({ success: true, id: 'created-note' });
    }
    if (url.endsWith('/status')) return Response.json({ error: 'Conflito de revisão.' }, { status: 409 });
    return Response.json({ posts: [{ id: 'created-note', status: 'draft', updatedAt: 'revision-one' }] });
  });
  ui.button('Nova nota').props.onClick(); ui.render();
  ui.input(0, 'Rascunho'); ui.input(2, 'Conteúdo'); ui.render();
  await ui.nodes().find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} }); ui.render();
  await ui.nodes().find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} }); ui.render();
  assert.deepEqual(ids, ['created-note', 'created-note']);
  await ui.button('Publicar').props.onClick(); ui.render();
  assert.ok(ui.nodes().some((n) => n.props.role === 'dialog'));
  assert.equal(ui.nodes().find((n) => n.type === 'input').props.value, 'Rascunho');
  assert.equal(ui.refreshed(), 1);
});

/* === RECUPERAÇÃO DE ANEXOS === */
test('Atualizar lista reconhece vínculo confirmado após perda de resposta e libera publicação', async () => {
  let linked = false, pendingState = false, writes = 0;
  const file = { resourceId: 'same-file', name: 'test.pdf', mimeType: 'application/pdf', size: 12 };
  const ui = await renderApp('src/apps/notes/PostAttachmentManager.jsx', {
    post: { id: 'one', updatedAt: 'revision-one', attachments: [] },
    onPending: (value) => { pendingState = value; }, onBusy() {},
    onRefresh: async () => ({ id: 'one', updatedAt: linked ? 'revision-two' : 'revision-one', attachments: linked ? [file] : [] }),
  }, {
    ...attachmentsContract, MAX_POST_ATTACHMENTS: 5,
    crypto: { randomUUID: () => 'same-file' },
    getOfficialFile: async () => ({ item: { resourceId: 'same-file', state: 'available', revision: 3 } }),
    setPostAttachment: async () => { writes++; linked = true; throw Error('lost response after commit'); },
  });
  ui.nodes().find((n) => n.type === 'input').props.onChange({ target: { files: [{ name: 'test.pdf', type: 'application/pdf', size: 12 }] } });
  ui.render();
  await ui.button('Enviar e vincular anexo').props.onClick(); ui.render();
  assert.equal(pendingState, true);
  await ui.button('Atualizar lista').props.onClick(); ui.render();
  assert.equal(pendingState, false);
  assert.equal(ui.button('Enviar e vincular anexo'), undefined);
  assert.match(ui.text(), /Anexos atualizados/);
  assert.doesNotMatch(ui.text(), /Operação não confirmada/);
  assert.equal(writes, 1);
  ui.unmount();
});

test('envio usa revisão atual da nota e atualização não descarta arquivo ainda não vinculado', async () => {
  const writes = [];
  const ui = await renderApp('src/apps/notes/PostAttachmentManager.jsx', {
    post: { id: 'one', updatedAt: 'old-revision', attachments: [] },
    onPending() {}, onBusy() {},
    onRefresh: async () => ({ id: 'one', updatedAt: 'current-revision', attachments: [] }),
  }, {
    ...attachmentsContract, MAX_POST_ATTACHMENTS: 5,
    crypto: { randomUUID: () => 'same-file' },
    getOfficialFile: async () => ({ item: { resourceId: 'same-file', state: 'available', revision: 3 } }),
    setPostAttachment: async (input) => { writes.push(input); return { success: true, postId: 'one', resourceId: 'same-file' }; },
  });
  ui.nodes().find((n) => n.type === 'input').props.onChange({ target: { files: [{ name: 'test.pdf', type: 'application/pdf', size: 12 }] } }); ui.render();
  await ui.button('Atualizar lista').props.onClick(); ui.render();
  assert.ok(ui.button('Enviar e vincular anexo'));
  assert.match(ui.text(), /ainda não foi vinculado/);
  await ui.button('Enviar e vincular anexo').props.onClick(); ui.render();
  assert.equal(writes[0].updatedAt, 'current-revision');
  ui.unmount();
});

test('arquivo texto sem MIME é normalizado antes do upload sem perder nome ou conteúdo', async () => {
  const created = [], uploaded = [];
  const file = new File(['Nota local'], 'nota.txt');
  const ui = await renderApp('src/apps/notes/PostAttachmentManager.jsx', {
    post: { id: 'one', updatedAt: 'revision', attachments: [] }, onPending() {}, onBusy() {}, onRefresh: async () => {},
  }, {
    ...attachmentsContract, MAX_POST_ATTACHMENTS: 5,
    crypto: { randomUUID: () => 'text-file' },
    getOfficialFile: async () => { throw Object.assign(Error('missing'), { code: 'NOT_FOUND' }); },
    createOfficialFile: async (input) => { created.push(input); return { item: { resourceId: input.id, state: 'pending', revision: 1 } }; },
    uploadOfficialFile: async (_id, _revision, blob) => { uploaded.push(blob); return { item: { resourceId: 'text-file', state: 'available', revision: 3 } }; },
    setPostAttachment: async () => ({ success: true, postId: 'one', resourceId: 'text-file' }),
  });
  ui.nodes().find((n) => n.type === 'input').props.onChange({ target: { files: [file] } }); ui.render();
  await ui.button('Enviar e vincular anexo').props.onClick(); ui.render();
  assert.equal(created[0].name, 'nota.txt');
  assert.equal(created[0].mimeType, 'text/plain');
  assert.equal(uploaded[0].type, 'text/plain');
  assert.equal(await uploaded[0].text(), 'Nota local');
  ui.unmount();
});

test('criador retorna a revisão reconciliada dos anexos e a utiliza na publicação', async () => {
  let revision = '2026-11-02T10:00:00Z';
  const calls = [];
  const ui = await component('NotesAdmin', async (url, options) => {
    if (url.endsWith('/create')) return Response.json({ success: true, id: 'created-note' });
    if (url.endsWith('/status')) { calls.push(JSON.parse(options.body)); return Response.json({ success: true, id: 'created-note', status: 'published' }); }
    return Response.json({ posts: [{ id: 'created-note', status: 'draft', updatedAt: revision, attachments: [] }] });
  });
  ui.button('Nova nota').props.onClick(); ui.render();
  ui.input(0, 'Título'); ui.input(2, 'Corpo'); ui.render();
  await ui.nodes().find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} }); ui.render();
  revision = '2026-11-02T11:00:00Z';
  const manager = ui.nodes().find((n) => typeof n.type === 'function');
  const updated = await manager.props.onRefresh(); ui.render();
  assert.equal(updated.updatedAt, revision);
  await ui.button('Publicar').props.onClick(); ui.render();
  assert.equal(calls[0].updatedAt, revision);
});

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
    ...React,
    AbortController,
    useLocale: () => 'pt-BR',
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
    button: (label) => nodes().find((n) => n.type === 'button' && text(n).trim() === label),
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
  assert.match(ui.text(), /1 curtida/);
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
  const ui = await component('NotesAdmin', async () => Response.json({ posts }));
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
  const ui = await component('NotesAdmin', async (url, options) => {
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
    'NotesAdmin',
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

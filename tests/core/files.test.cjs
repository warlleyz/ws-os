const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function model() {
  const source = fs
    .readFileSync(path.join(root, 'src/services/storage/fileModel.js'), 'utf8')
    .replace(/\bexport\s+/g, '');
  return vm.runInNewContext(
    `(()=>{${source};return {applyFileOperation,validateFileEntries,fileKind,validateFileName}})()`,
    { Blob },
  );
}
const create = (id, name, parentId = null, kind = 'folder', text = '') => ({
  type: 'create',
  id,
  name,
  parentId,
  kind,
  blob: new Blob([text], { type: 'text/plain' }),
  now: 100,
});
test('arquivos locais criam pastas/textos e rejeitam nomes duplicados ou inválidos', () => {
  const m = model();
  let entries = m.applyFileOperation([], create('folder', 'Trabalho'));
  entries = m.applyFileOperation(
    entries,
    create('file', 'teste.txt', 'folder', 'file', 'conteúdo'),
  );
  assert.equal(entries.length, 2);
  assert.equal(entries[1].blob.size, 9);
  assert.throws(
    () => m.applyFileOperation(entries, create('other', 'TESTE.txt', 'folder', 'file')),
    /Já existe/,
  );
  for (const name of ['../escape', '..', 'a\\b', 'x/y', ''])
    assert.throws(() => m.validateFileName(name));
});
test('mover pastas não cria ciclos e renomear preserva extensão', () => {
  const m = model();
  let entries = m.applyFileOperation([], create('a', 'A'));
  entries = m.applyFileOperation(entries, create('b', 'B', 'a'));
  assert.throws(
    () => m.applyFileOperation(entries, { type: 'move', id: 'a', parentId: 'b' }),
    /dela mesma/,
  );
  entries = m.applyFileOperation(entries, create('text', 'a.txt', 'b', 'file'));
  assert.throws(
    () => m.applyFileOperation(entries, { type: 'rename', id: 'text', name: 'a.html' }),
    /extensão/,
  );
  const moved = m.applyFileOperation(entries, { type: 'move', id: 'text', parentId: null });
  assert.equal(moved.find((item) => item.id === 'text').parentId, null);
});
test('gravação exige revisão atual e conserva rascunho concorrente', async () => {
  const m = model();
  let entries = m.applyFileOperation([], create('a', 'a.txt', null, 'file', 'inicial'));
  const first = m.applyFileOperation(entries, {
    type: 'write',
    id: 'a',
    revision: 1,
    text: 'primeiro',
  });
  assert.equal(first[0].revision, 2);
  assert.throws(
    () => m.applyFileOperation(first, { type: 'write', id: 'a', revision: 1, text: 'antigo' }),
    /outra janela/,
  );
  assert.equal(await first[0].blob.text(), 'primeiro');
  assert.equal(await entries[0].blob.text(), 'inicial');
});
test('lixeira é recuperável e restaurar pasta não recupera filho removido antes', () => {
  const m = model();
  let entries = m.applyFileOperation([], create('p', 'Pasta'));
  entries = m.applyFileOperation(entries, create('a', 'a.txt', 'p', 'file'));
  entries = m.applyFileOperation(entries, create('b', 'b.txt', 'p', 'file'));
  entries = m.applyFileOperation(entries, { type: 'trash', id: 'a' });
  entries = m.applyFileOperation(entries, { type: 'trash', id: 'p' });
  assert.ok(entries.every((item) => item.trashed));
  entries = m.applyFileOperation(entries, { type: 'restore', id: 'p' });
  assert.equal(entries.find((item) => item.id === 'a').trashed, true);
  assert.equal(entries.find((item) => item.id === 'b').trashed, false);
  assert.throws(() => m.applyFileOperation(entries, { type: 'purge', id: 'p' }), /lixeira/);
});
test('exclusão permanente só após lixeira e inclui descendentes', () => {
  const m = model();
  let entries = m.applyFileOperation([], create('p', 'Pasta'));
  entries = m.applyFileOperation(entries, create('f', 'f.txt', 'p', 'file'));
  entries = m.applyFileOperation(entries, { type: 'trash', id: 'p' });
  assert.equal(m.applyFileOperation(entries, { type: 'purge', id: 'p' }).length, 0);
});
test('limites de tamanho e integridade rejeitam operação sem alterar dados anteriores', () => {
  const m = model();
  const before = m.applyFileOperation([], create('a', 'a.txt', null, 'file'));
  assert.throws(
    () =>
      m.applyFileOperation(before, {
        type: 'write',
        id: 'a',
        revision: 1,
        text: 'x'.repeat(1024 * 1024 + 1),
      }),
    /1 MB/,
  );
  assert.equal(before[0].revision, 1);
  assert.throws(() => m.validateFileEntries([{ ...before[0], parentId: 'missing' }]), /inválidos/);
  assert.throws(() => m.validateFileEntries([{ ...before[0], blob: 'not blob' }]), /inválidos/);
});

test('operações diretas não modificam a lixeira nem restauram itens ativos', () => {
  const m = model();
  const original = m.applyFileOperation([], create('a', 'a.txt', null, 'file'));
  assert.throws(() => m.applyFileOperation(original, { type: 'restore', id: 'a' }), /lixeira/);
  const trashed = m.applyFileOperation(original, { type: 'trash', id: 'a' });
  for (const operation of [
    { type: 'rename', name: 'b.txt' },
    { type: 'move', parentId: null },
    { type: 'write', text: 'x', revision: 2 },
    { type: 'trash' },
  ])
    assert.throws(() => m.applyFileOperation(trashed, { ...operation, id: 'a' }), /lixeira/);
  assert.throws(() => m.applyFileOperation(original, null), /inválida/);
});

test('movimento e restauração rejeitam colisões e preservam a árvore original', () => {
  const m = model();
  let entries = m.applyFileOperation([], create('p', 'Pasta'));
  entries = m.applyFileOperation(entries, create('a', 'a.txt', 'p', 'file'));
  entries = m.applyFileOperation(entries, create('b', 'a.txt', null, 'file'));
  assert.throws(
    () => m.applyFileOperation(entries, { type: 'move', id: 'a', parentId: null }),
    /Já existe/,
  );
  entries = m.applyFileOperation(entries, { type: 'trash', id: 'b' });
  entries = m.applyFileOperation(entries, create('c', 'A.TXT', null, 'file'));
  assert.throws(() => m.applyFileOperation(entries, { type: 'restore', id: 'b' }), /Já existe/);
  assert.equal(entries.find((item) => item.id === 'a').parentId, 'p');
  assert.equal(m.fileKind(null), null);
  assert.equal(m.fileKind('txt'), null);
});

test('integridade rejeita duplicidade persistida, pai na lixeira e limites corrompidos', () => {
  const m = model();
  let entries = m.applyFileOperation([], create('p', 'Pasta'));
  entries = m.applyFileOperation(entries, create('a', 'a.txt', 'p', 'file'));
  assert.throws(() => m.validateFileEntries([...entries, { ...entries[1], id: 'b' }]), /Já existe/);
  assert.throws(
    () => m.validateFileEntries([{ ...entries[0], trashed: true, trashRootId: 'p' }, entries[1]]),
    /inválidos/,
  );
  assert.throws(
    () =>
      m.validateFileEntries([
        { ...entries[1], parentId: null, blob: new Blob(['x'.repeat(10 * 1024 * 1024 + 1)]) },
      ]),
    /inválidos/,
  );
  assert.throws(() => m.validateFileEntries([{ ...entries[1], parentId: undefined }]), /inválidos/);
});

test('limite de 500 itens e 50 MB inclui a lixeira sem alterar a coleção', () => {
  const m = model();
  const single = m.applyFileOperation([], create('a', 'a.txt', null, 'file'))[0];
  const full = Array.from({ length: 500 }, (_, i) => ({
    ...single,
    id: 'id' + i,
    name: i + '.txt',
  }));
  assert.throws(() => m.applyFileOperation(full, create('extra', 'extra')), /500 itens/);
  const blob = new Blob(['x'.repeat(10 * 1024 * 1024)]);
  const large = Array.from({ length: 5 }, (_, i) => ({
    ...single,
    id: 'big' + i,
    name: i + '.txt',
    blob,
    trashed: true,
    trashRootId: 'big' + i,
  }));
  assert.throws(
    () => m.applyFileOperation(large, create('extra', 'extra.txt', null, 'file', 'x')),
    /50 MB/,
  );
  assert.equal(full.length, 500);
});

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

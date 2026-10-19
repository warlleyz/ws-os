const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function storage(options = {}) {
  const records = new Map(),
    events = new Map();
  let queue = Promise.resolve(),
    closed = 0,
    quota = false;
  const indexedDB = {
    open() {
      const request = {};
      const db = {
        close() {
          closed++;
        },
        transaction() {
          const tx = { error: null };
          let pendingRead,
            aborted = false,
            working;
          const store = {
            getAll() {
              return (pendingRead = {});
            },
            put(item) {
              working.set(item.id, item);
            },
            delete(id) {
              working.delete(id);
            },
          };
          tx.objectStore = () => store;
          tx.abort = () => {
            aborted = true;
          };
          queue = queue.then(
            () =>
              new Promise((done) =>
                setImmediate(() => {
                  working = new Map([...records].map(([id, item]) => [id, { ...item }]));
                  pendingRead.result = [...working.values()];
                  pendingRead.onsuccess();
                  if (quota) {
                    tx.error = new DOMException('quota', 'QuotaExceededError');
                    tx.onerror?.({ target: { error: tx.error } });
                    aborted = true;
                  }
                  if (aborted) tx.onabort?.();
                  else {
                    records.clear();
                    for (const [id, item] of working) records.set(id, item);
                    tx.oncomplete?.();
                  }
                  done();
                }),
              ),
          );
          return tx;
        },
      };
      queueMicrotask(() => {
        request.result = db;
        request.onsuccess?.();
      });
      return request;
    },
  };
  const model = read('src/services/storage/fileModel.js').replace(/\bexport\s+/g, '');
  const service = read('src/services/storage/localFilesStorage.js')
    .replace(/^import[^;]+;\s*/gm, '')
    .replace(/\bexport\s+/g, '');
  const bindings = {
    Blob,
    Uint8Array,
    TextDecoder,
    setTimeout,
    clearTimeout,
    crypto: webcrypto,
    indexedDB,
    window: {
      addEventListener: (key, cb) => events.set(key, cb),
      removeEventListener: (key) => events.delete(key),
    },
    BroadcastChannel: class {
      constructor() {
        throw Error('blocked');
      }
    },
    localStorage: {
      setItem() {
        throw Error('blocked');
      },
    },
    createImageBitmap: async () => ({ width: 1, height: 1, close() {} }),
    ...options,
  };
  const api = vm.runInNewContext(
    `(()=>{${model}\n${service};return {createLocalText,createLocalFolder,changeLocalFile,saveLocalText,readLocalFile,listLocalFiles,uploadLocalFile,subscribeLocalFiles,localFilesRevision};})()`,
    bindings,
  );
  return {
    ...api,
    records,
    events,
    closed: () => closed,
    quota: (value) => {
      quota = value;
    },
  };
}

test('transações concorrentes não sobrescrevem revisões ou nomes duplicados', async () => {
  const db = storage();
  const original = await db.createLocalText('a.txt', null, 'inicial');
  const writes = await Promise.allSettled([
    db.saveLocalText(original.id, 'primeiro', 1),
    db.saveLocalText(original.id, 'segundo', 1),
  ]);
  assert.equal(writes.filter((r) => r.status === 'fulfilled').length, 1);
  assert.match(writes.find((r) => r.status === 'rejected').reason.message, /outra janela/);
  assert.equal(await (await db.readLocalFile(original.id)).blob.text(), 'primeiro');
  const duplicates = await Promise.allSettled([
    db.createLocalFolder('Pasta'),
    db.createLocalFolder('PASTA'),
  ]);
  assert.equal(duplicates.filter((r) => r.status === 'fulfilled').length, 1);
});

test('quota aborta a transação, preserva conteúdo e não anuncia gravação', async () => {
  const db = storage();
  const file = await db.createLocalText('a.txt', null, 'preservado');
  const revision = db.localFilesRevision();
  db.quota(true);
  await assert.rejects(db.saveLocalText(file.id, 'perdido', 1), /Cota/);
  assert.equal(await db.records.get(file.id).blob.text(), 'preservado');
  assert.equal(db.localFilesRevision(), revision);
  assert.equal(db.closed(), 2);
});

test('falhas de assinantes e sinalização entre abas não tornam um commit em erro', async () => {
  const db = storage();
  const unsubscribe = db.subscribeLocalFiles(() => {
    throw Error('listener');
  });
  const file = await db.createLocalText('a.txt');
  assert.ok(file.id);
  const before = db.localFilesRevision();
  db.events.get('focus')();
  db.events.get('storage')({ key: 'ws-os:files-changed' });
  assert.equal(db.localFilesRevision(), before + 2);
  unsubscribe();
  assert.equal(db.events.size, 0);
});

test('importação e criação direta validam conteúdo antes de abrir o banco', async () => {
  const db = storage();
  const fake = new File(['not PDF'], 'fake.pdf');
  await assert.rejects(db.uploadLocalFile(fake), /conteúdo/);
  await assert.rejects(
    db.changeLocalFile({ type: 'create', id: 'fake', kind: 'file', name: 'fake.pdf', blob: fake }),
    /conteúdo/,
  );
  await assert.rejects(
    db.uploadLocalFile(new File([new Uint8Array([255, 255])], 'binary.txt')),
    /conteúdo/,
  );
  assert.equal(db.records.size, 0);
  assert.equal(db.closed(), 0);
  const imported = await db.uploadLocalFile(new File(['%PDF-1.7\n'], 'real.pdf'));
  assert.equal(imported.blob.type, 'application/pdf');
});

test('imagens têm assinatura, limite de pixels e bitmap liberado', async () => {
  let closed = false;
  const db = storage({
    createImageBitmap: async () => ({
      width: 8000,
      height: 8000,
      close() {
        closed = true;
      },
    }),
  });
  const png = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'image.png');
  await assert.rejects(db.uploadLocalFile(png), /32 megapixels/);
  assert.equal(closed, true);
  assert.equal(db.records.size, 0);
});

test('IndexedDB ausente e abertura bloqueada informam falha sem apagar dados', async () => {
  await assert.rejects(storage({ indexedDB: undefined }).listLocalFiles(), /indisponível/);
  let request;
  const db = storage({
    indexedDB: {
      open() {
        request = {};
        queueMicrotask(() => request.onblocked());
        return request;
      },
    },
  });
  await assert.rejects(db.listLocalFiles(), /bloqueado/);
  let closed = false;
  request.result = {
    close() {
      closed = true;
    },
  };
  request.onsuccess();
  assert.equal(closed, true);
});

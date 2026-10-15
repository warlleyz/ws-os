import {
  applyFileOperation,
  validateFileEntries,
  FILE_LIMIT,
  TEXT_LIMIT,
  fileKind,
} from './fileModel';
const NAME = 'ws-os-personal-files',
  STORE = 'entries';
const listeners = new Set();
let revision = 0;
const channel =
  typeof BroadcastChannel === 'function' ? new BroadcastChannel('ws-os-personal-files') : null;
function emit() {
  revision++;
  listeners.forEach((listener) => listener());
}
if (channel) channel.onmessage = emit;
export function subscribeLocalFiles(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const localFilesRevision = () => revision;
function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined')
      return reject(new Error('Armazenamento local indisponível.'));
    let finished = false;
    const request = indexedDB.open(NAME, 1);
    const timer = setTimeout(() => finish(new Error('Armazenamento local bloqueado.')), 8000);
    function finish(error, db) {
      if (finished) {
        db?.close();
        return;
      }
      finished = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(db);
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => finish(null, request.result);
    request.onerror = () => finish(request.error ?? new Error('Armazenamento local indisponível.'));
    request.onblocked = () => finish(new Error('Armazenamento local bloqueado.'));
  });
}
async function transact(operation) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, operation ? 'readwrite' : 'readonly'),
        store = tx.objectStore(STORE),
        request = store.getAll();
      let next, problem;
      request.onsuccess = () => {
        try {
          if (!operation) {
            next = validateFileEntries(request.result);
            return;
          }
          const previous = request.result;
          next = applyFileOperation(previous, operation);
          const ids = new Set(next.map((item) => item.id));
          for (const item of previous) if (!ids.has(item.id)) store.delete(item.id);
          const before = new Map(previous.map((item) => [item.id, item]));
          for (const item of next) if (before.get(item.id) !== item) store.put(item);
        } catch (error) {
          problem = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(next);
      tx.onabort = () => reject(problem ?? tx.error ?? new Error('A gravação foi cancelada.'));
      tx.onerror = (event) =>
        reject(
          tx.error ?? event.target?.error ?? new Error('Não foi possível salvar os arquivos.'),
        );
    });
  } catch (cause) {
    if (cause?.name === 'QuotaExceededError')
      throw new Error('Cota do navegador esgotada. Seus arquivos anteriores foram preservados.', {
        cause,
      });
    throw cause;
  } finally {
    db.close();
  }
}
export const listLocalFiles = () => transact(null);
export async function readLocalFile(id) {
  const item = (await listLocalFiles()).find((item) => item.id === id && !item.trashed);
  if (!item || item.kind !== 'file') throw new Error('Arquivo ou pasta não encontrado.');
  return item;
}
export async function changeLocalFile(operation) {
  const result = await transact(operation);
  emit();
  channel?.postMessage('change');
  return result.find((item) => item.id === operation.id) ?? null;
}
export function createLocalFolder(name, parentId = null) {
  return changeLocalFile({
    type: 'create',
    kind: 'folder',
    id: crypto.randomUUID(),
    name,
    parentId,
  });
}
export function createLocalText(name, parentId = null, text = '') {
  if (fileKind(name) !== 'text' || new Blob([text]).size > TEXT_LIMIT)
    throw new Error('O editor aceita textos de até 1 MB.');
  return changeLocalFile({
    type: 'create',
    kind: 'file',
    id: crypto.randomUUID(),
    name,
    parentId,
    blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
  });
}
export function saveLocalText(id, text, revision) {
  return changeLocalFile({ type: 'write', id, text, revision });
}
export async function uploadLocalFile(file, parentId = null) {
  if (!file || typeof file.name !== 'string' || file.size > FILE_LIMIT)
    throw new Error('Formato não suportado ou arquivo maior que 10 MB.');
  const kind = fileKind(file.name);
  if (!kind) throw new Error('Formato não suportado ou arquivo maior que 10 MB.');
  const buffer = await file.arrayBuffer(),
    bytes = new Uint8Array(buffer);
  let type = 'text/plain;charset=utf-8';
  if (kind === 'pdf') {
    if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-')
      throw new Error('O conteúdo não corresponde ao formato do arquivo.');
    type = 'application/pdf';
  }
  if (kind === 'image') {
    const ext = file.name.split('.').at(-1).toLowerCase();
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!(ext === 'png' ? png : ext === 'webp' ? webp : jpeg))
      throw new Error('O conteúdo não corresponde ao formato do arquivo.');
    type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const image = await createImageBitmap(new Blob([buffer], { type }));
    try {
      if (image.width * image.height > 32000000)
        throw new Error('A imagem deve ter até 32 megapixels.');
    } finally {
      image.close();
    }
  }
  return changeLocalFile({
    type: 'create',
    kind: 'file',
    id: crypto.randomUUID(),
    name: file.name,
    parentId,
    blob: new Blob([buffer], { type }),
  });
}

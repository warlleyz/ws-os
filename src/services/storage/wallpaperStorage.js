const DATABASE = 'ws-os-wallpapers';
const STORE = 'images';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('storage'));
    let settled = false;
    const request = indexedDB.open(DATABASE, 1);
    const timer = setTimeout(() => finish(new Error('storage')), 8000);
    function finish(error, database) {
      if (settled) {
        database?.close();
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(database);
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => finish(null, request.result);
    request.onerror = () => finish(request.error ?? new Error('storage'));
    request.onblocked = () => finish(new Error('storage'));
  });
}

async function transact(mode, file) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const store = transaction.objectStore(STORE);
      const request = mode === 'readonly' ? store.get('custom') : store.put(file, 'custom');
      transaction.oncomplete = () => resolve(mode === 'readonly' ? (request.result ?? null) : true);
      transaction.onerror = () =>
        reject(transaction.error ?? request.error ?? new Error('storage'));
      transaction.onabort = () => reject(transaction.error ?? new Error('storage'));
    });
  } finally {
    database.close();
  }
}

export const readWallpaperImage = () => transact('readonly');
export const writeWallpaperImage = (file) => transact('readwrite', file);

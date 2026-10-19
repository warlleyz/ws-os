
/* === Banco de wallpapers === */
/* ----- Configuração ----- */
const DATABASE = 'ws-os-wallpapers';
const STORE = 'images';
const LEGACY_KEY = 'custom';
const PERSONAL_PREFIX = 'personal:';

/* === Validação === */
/* ----- Identificadores pessoais ----- */
function personalKey(id) {
  if (
    typeof id !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,64}$/.test(id)
  ) {
    throw new Error('Identificador de wallpaper inválido.');
  }

  return `${PERSONAL_PREFIX}${id}`;
}

/* === Conexão IndexedDB === */
/* ----- Abrir banco existente ----- */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('storage'));
      return;
    }

    let settled = false;

    const request = indexedDB.open(DATABASE, 1);

    const timer = setTimeout(() => {
      finish(new Error('storage'));
    }, 8000);

    function finish(error, database) {
      if (settled) {
        database?.close();
        return;
      }

      settled = true;
      clearTimeout(timer);

      if (error) {
        reject(error);
      } else {
        resolve(database);
      }
    }

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };

    request.onsuccess = () => {
      finish(null, request.result);
    };

    request.onerror = () => {
      finish(request.error ?? new Error('storage'));
    };

    request.onblocked = () => {
      finish(new Error('storage'));
    };
  });
}

/* === Transações === */
/* ----- Operação isolada ----- */
async function transact(mode, operation) {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const store = transaction.objectStore(STORE);

      let result;

      try {
        result = operation(store);
      } catch (error) {
        transaction.abort();
        reject(error);
        return;
      }

      transaction.oncomplete = () => {
        resolve(result?.());
      };

      transaction.onerror = () => {
        reject(
          transaction.error ?? new Error('storage'),
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ?? new Error('storage'),
        );
      };
    });
  } finally {
    database.close();
  }
}

/* === Compatibilidade legada === */
/* ----- Recuperar imagem pessoal antiga ----- */
export function readWallpaperImage() {
  return transact('readonly', (store) => {
    const request = store.get(LEGACY_KEY);

    return () => request.result ?? null;
  });
}

/* ----- Salvar imagem no formato antigo ----- */
export function writeWallpaperImage(file) {
  return transact('readwrite', (store) => {
    store.put(file, LEGACY_KEY);

    return () => true;
  });
}

/* === Coleção pessoal === */
/* ----- Recuperar imagem pelo identificador ----- */
export function readPersonalWallpaperImage(id) {
  const key = personalKey(id);

  return transact('readonly', (store) => {
    const request = store.get(key);

    return () => request.result ?? null;
  });
}

/* ----- Adicionar ou atualizar imagem ----- */
export function writePersonalWallpaperImage(id, file) {
  const key = personalKey(id);

  if (!file) {
    return Promise.reject(
      new Error('Arquivo de wallpaper inválido.'),
    );
  }

  return transact('readwrite', (store) => {
    store.put(file, key);

    return () => true;
  });
}

/* ----- Remover imagem pessoal ----- */
export function deletePersonalWallpaperImage(id) {
  const key = personalKey(id);

  return transact('readwrite', (store) => {
    store.delete(key);

    return () => true;
  });
}

/* ----- Listar imagens armazenadas ----- */
export function listPersonalWallpaperImages() {
  return transact('readonly', (store) => {
    const keysRequest = store.getAllKeys();
    const valuesRequest = store.getAll();

    return () => {
      const keys = keysRequest.result ?? [];
      const values = valuesRequest.result ?? [];

      return keys
        .map((key, index) => ({
          key,
          file: values[index],
        }))
        .filter(
          (entry) =>
            typeof entry.key === 'string' &&
            entry.key.startsWith(PERSONAL_PREFIX),
        )
        .map((entry) => ({
          id: entry.key.slice(PERSONAL_PREFIX.length),
          file: entry.file,
        }));
    };
  });
}

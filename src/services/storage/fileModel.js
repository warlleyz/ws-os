/* === CONFIGURAÇÃO === */
export const FILE_LIMIT = 10 * 1024 * 1024;
export const TEXT_LIMIT = 1024 * 1024;
export const TOTAL_LIMIT = 50 * 1024 * 1024;

const MAX_ENTRIES = 500;

const FILE_ERROR = 'Dados locais inválidos. Os arquivos não foram substituídos.';
const OPERATION_ERROR = 'Operação de arquivo inválida.';
const LIMIT_ERROR = 'Limite local de 500 itens ou 50 MB atingido. Revise a lixeira.';


/* === TIPOS E VALIDAÇÕES === */
/* ----- Identificação do formato ----- */
export function fileKind(name) {
  if (typeof name !== 'string' || !name.includes('.')) {
    return null;
  }

  const extension = name.split('.').at(-1).toLowerCase();

  if (['txt', 'md', 'json', 'csv', 'log', 'js', 'css', 'html'].includes(extension)) {
    return 'text';
  }

  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
    return 'image';
  }

  if (extension === 'pdf') {
    return 'pdf';
  }

  return null;
}

/* ----- Validação do nome ----- */
export function validateFileName(name) {
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 120 ||
    /[\\/:]/.test(name) ||
    [...name].some((char) => char.charCodeAt(0) < 32) ||
    ['.', '..'].includes(name.trim())
  ) {
    throw new Error('Nome inválido. Use até 120 caracteres, sem barras.');
  }

  return name.trim().normalize('NFC');
}

/* ----- Validação da pasta de destino ----- */
function parentIsValid(entries, id) {
  return (
    id === null ||
    entries.some(
      (item) => item.id === id && item.kind === 'folder' && !item.trashed,
    )
  );
}

/* ----- Prevenção de nomes duplicados ----- */
function ensureUnique(entries, name, parentId, except) {
  const normalizedName = name.normalize('NFC').toLowerCase();

  const duplicated = entries.some(
    (item) =>
      !item.trashed &&
      item.id !== except &&
      item.parentId === parentId &&
      item.name.normalize('NFC').toLowerCase() === normalizedName,
  );

  if (duplicated) {
    throw new Error('Já existe um item com esse nome nesta pasta.');
  }
}

/* ----- Identificação dos descendentes ----- */
function descendants(entries, id) {
  const ids = new Set([id]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const item of entries) {
      if (ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    }
  }

  return ids;
}

/* ----- Validação da estrutura e integridade ----- */
export function validateFileEntries(entries) {
  if (!Array.isArray(entries) || entries.length > MAX_ENTRIES) {
    throw new Error(FILE_ERROR);
  }

  const ids = new Set();

  for (const item of entries) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      (item.parentId !== null && typeof item.parentId !== 'string') ||
      typeof item.trashed !== 'boolean' ||
      (item.trashed && typeof item.trashRootId !== 'string') ||
      ids.has(item.id) ||
      !['folder', 'file'].includes(item.kind) ||
      !Number.isSafeInteger(item.revision) ||
      item.revision < 1 ||
      (item.kind === 'file' &&
        (!(item.blob instanceof Blob) ||
          item.blob.size > FILE_LIMIT ||
          !fileKind(item.name)))
    ) {
      throw new Error(FILE_ERROR);
    }

    validateFileName(item.name);
    ids.add(item.id);
  }

  /* ----- Hierarquia e prevenção de ciclos ----- */
  for (const item of entries) {
    if (!item.trashed) {
      ensureUnique(entries, item.name, item.parentId, item.id);
    }

    const visited = new Set([item.id]);
    let parent = item.parentId;

    while (parent !== null) {
      if (visited.has(parent)) {
        throw new Error(FILE_ERROR);
      }

      visited.add(parent);

      const folder = entries.find(
        (entry) => entry.id === parent && entry.kind === 'folder',
      );

      if (!folder) {
        throw new Error(FILE_ERROR);
      }

      if (!item.trashed && folder.trashed) {
        throw new Error(FILE_ERROR);
      }

      parent = folder.parentId;
    }
  }

  /* ----- Limite agregado de armazenamento ----- */
  const totalSize = entries.reduce(
    (sum, item) => sum + (item.blob?.size ?? 0),
    0,
  );

  if (totalSize > TOTAL_LIMIT) {
    throw new Error(LIMIT_ERROR);
  }

  return entries;
}


/* === OPERAÇÕES DE ARQUIVOS === */
/* ----- Criação de arquivos e pastas ----- */
function createEntry(entries, operation, now) {
  const exists = entries.some((item) => item.id === operation.id);

  if (exists || !['folder', 'file'].includes(operation.kind)) {
    throw new Error(OPERATION_ERROR);
  }

  const name = validateFileName(operation.name);
  const parentId = operation.parentId ?? null;

  if (!parentIsValid(entries, parentId)) {
    throw new Error('Pasta de destino indisponível.');
  }

  ensureUnique(entries, name, parentId);

  if (
    operation.kind === 'file' &&
    (!fileKind(name) ||
      !(operation.blob instanceof Blob) ||
      operation.blob.size > FILE_LIMIT)
  ) {
    throw new Error('Formato não suportado ou arquivo maior que 10 MB.');
  }

  return [
    ...entries,
    {
      id: operation.id,
      name,
      parentId,
      kind: operation.kind,
      blob: operation.kind === 'file' ? operation.blob : null,
      trashed: false,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/* ----- Renomeação ----- */
function renameEntry(entries, item, operation, now) {
  const name = validateFileName(operation.name);

  ensureUnique(entries, name, item.parentId, item.id);

  if (
    item.kind === 'file' &&
    name.split('.').at(-1).toLowerCase() !==
    item.name.split('.').at(-1).toLowerCase()
  ) {
    throw new Error('Preserve a extensão do arquivo ao renomear.');
  }

  return entries.map((entry) =>
    entry.id === item.id
      ? {
        ...entry,
        name,
        revision: entry.revision + 1,
        updatedAt: now,
      }
      : entry,
  );
}

/* ----- Movimentação entre pastas ----- */
function moveEntry(entries, item, operation, now) {
  const parentId = operation.parentId ?? null;

  if (!parentIsValid(entries, parentId) || descendants(entries, item.id).has(parentId)) {
    throw new Error('Não é possível mover uma pasta para dentro dela mesma.');
  }

  ensureUnique(entries, item.name, parentId, item.id);

  return entries.map((entry) =>
    entry.id === item.id
      ? {
        ...entry,
        parentId,
        revision: entry.revision + 1,
        updatedAt: now,
      }
      : entry,
  );
}

/* ----- Gravação com controle de revisão ----- */
function writeEntry(entries, item, operation, now) {
  if (item.kind !== 'file' || item.trashed || fileKind(item.name) !== 'text') {
    throw new Error('Este arquivo não pode ser editado.');
  }

  if (item.revision !== operation.revision) {
    throw new Error('O arquivo foi alterado em outra janela. Recarregue ou salve uma cópia.');
  }

  if (typeof operation.text !== 'string') {
    throw new Error('Conteúdo inválido.');
  }

  const blob = new Blob([operation.text], {
    type: 'text/plain;charset=utf-8',
  });

  if (blob.size > TEXT_LIMIT) {
    throw new Error('O editor aceita textos de até 1 MB.');
  }

  return entries.map((entry) =>
    entry.id === item.id
      ? {
        ...entry,
        blob,
        revision: entry.revision + 1,
        updatedAt: now,
      }
      : entry,
  );
}


/* === LIXEIRA E RECUPERAÇÃO === */
/* ----- Exclusão lógica ----- */
function trashEntry(entries, item, now) {
  const ids = descendants(entries, item.id);

  return entries.map((entry) => {
    if (!ids.has(entry.id) || entry.trashed) {
      return entry;
    }

    return {
      ...entry,
      trashed: true,
      trashRootId: item.id,
      revision: entry.revision + 1,
      updatedAt: now,
    };
  });
}

/* ----- Restauração protegida ----- */
function restoreEntry(entries, item, now) {
  const ids = descendants(entries, item.id);

  const parentId = parentIsValid(entries, item.parentId)
    ? item.parentId
    : null;

  ensureUnique(entries, item.name, parentId, item.id);

  return entries.map((entry) => {
    if (!ids.has(entry.id) || entry.trashRootId !== item.trashRootId) {
      return entry;
    }

    return {
      ...entry,
      parentId: entry.id === item.id ? parentId : entry.parentId,
      trashed: false,
      trashRootId: null,
      revision: entry.revision + 1,
      updatedAt: now,
    };
  });
}

/* ----- Exclusão definitiva protegida ----- */
function purgeEntry(entries, item, now) {
  if (!item.trashed) {
    throw new Error('Mova o item para a lixeira antes de excluí-lo definitivamente.');
  }

  const ids = descendants(entries, item.id);
  const preserved = new Set();

  /* ----- Preservação de exclusões independentes ----- */
  for (const entry of entries) {
    if (
      ids.has(entry.id) &&
      entry.trashed &&
      entry.trashRootId === entry.id &&
      entry.id !== item.id
    ) {
      for (const descendantId of descendants(entries, entry.id)) {
        preserved.add(descendantId);
      }
    }
  }

  /* ----- Remoção e recuperação da hierarquia ----- */
  return entries
    .filter((entry) => !ids.has(entry.id) || preserved.has(entry.id))
    .map((entry) => {
      if (
        !preserved.has(entry.id) ||
        entry.parentId === null ||
        !ids.has(entry.parentId) ||
        preserved.has(entry.parentId)
      ) {
        return entry;
      }

      return {
        ...entry,
        parentId: null,
        revision: entry.revision + 1,
        updatedAt: now,
      };
    });
}


/* === EXECUÇÃO DAS OPERAÇÕES === */
/* ----- Operação individual ----- */
export function applyFileOperation(entries, operation) {
  validateFileEntries(entries);

  if (operation?.type === 'batch') {
    return applyFileOperations(entries, operation.operations);
  }

  if (
    !operation ||
    typeof operation !== 'object' ||
    Array.isArray(operation) ||
    typeof operation.id !== 'string' ||
    !operation.id.trim()
  ) {
    throw new Error(OPERATION_ERROR);
  }

  const now = operation.now ?? Date.now();
  const item = entries.find((entry) => entry.id === operation.id);

  let next;

  if (operation.type === 'create') {
    next = createEntry(entries, operation, now);
  } else {
    if (!item) {
      throw new Error('Arquivo ou pasta não encontrado.');
    }

    if (item.trashed && !['restore', 'purge'].includes(operation.type)) {
      throw new Error('Restaure o item da lixeira antes de modificá-lo.');
    }

    if (operation.type === 'restore' && !item.trashed) {
      throw new Error('Este item não está na lixeira.');
    }

    switch (operation.type) {
      case 'rename':
        next = renameEntry(entries, item, operation, now);
        break;

      case 'move':
        next = moveEntry(entries, item, operation, now);
        break;

      case 'write':
        next = writeEntry(entries, item, operation, now);
        break;

      case 'trash':
        next = trashEntry(entries, item, now);
        break;

      case 'restore':
        next = restoreEntry(entries, item, now);
        break;

      case 'purge':
        next = purgeEntry(entries, item, now);
        break;

      default:
        throw new Error(OPERATION_ERROR);
    }
  }

  /* ----- Validação antes da persistência ----- */
  if (
    next.length > MAX_ENTRIES ||
    next.reduce((sum, entry) => sum + (entry.blob?.size ?? 0), 0) > TOTAL_LIMIT
  ) {
    throw new Error(LIMIT_ERROR);
  }

  return validateFileEntries(next);
}

/* ----- Operações em lote ----- */
export function applyFileOperations(entries, operations) {
  validateFileEntries(entries);

  if (
    !Array.isArray(operations) ||
    !operations.length ||
    operations.length > MAX_ENTRIES ||
    operations.some(
      (operation) =>
        !operation ||
        !['move', 'trash', 'restore', 'purge'].includes(operation.type) ||
        typeof operation.id !== 'string',
    ) ||
    new Set(operations.map((operation) => operation.id)).size !== operations.length
  ) {
    throw new Error(OPERATION_ERROR);
  }

  /* ----- Remoção de operações redundantes ----- */
  const selected = new Map(
    operations.map((operation) => [operation.id, operation.type]),
  );

  const roots = operations.filter((operation) => {
    let current = entries.find((entry) => entry.id === operation.id);

    if (!current) {
      throw new Error('Arquivo ou pasta não encontrado.');
    }

    while (current?.parentId !== null) {
      current = entries.find((entry) => entry.id === current.parentId);

      if (selected.get(current?.id) === operation.type) {
        return false;
      }
    }

    return true;
  });

  /* ----- Aplicação sequencial e validação final ----- */
  return roots.reduce(
    (current, operation) => applyFileOperation(current, operation),
    entries,
  );
}

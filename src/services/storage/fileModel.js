export const FILE_LIMIT = 10 * 1024 * 1024;
export const TEXT_LIMIT = 1024 * 1024;
export const TOTAL_LIMIT = 50 * 1024 * 1024;
export function fileKind(name) {
  if (typeof name !== 'string' || !name.includes('.')) return null;
  const extension = name.split('.').at(-1).toLowerCase();
  if (['txt', 'md', 'json', 'csv', 'log', 'js', 'css', 'html'].includes(extension)) return 'text';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  return null;
}
export function validateFileName(name) {
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 120 ||
    /[\\/:]/.test(name) ||
    [...name].some((char) => char.charCodeAt(0) < 32) ||
    ['.', '..'].includes(name.trim())
  )
    throw new Error('Nome inválido. Use até 120 caracteres, sem barras.');
  return name.trim().normalize('NFC');
}
function parentIsValid(entries, id) {
  return (
    id === null || entries.some((item) => item.id === id && item.kind === 'folder' && !item.trashed)
  );
}
function ensureUnique(entries, name, parentId, except) {
  if (
    entries.some(
      (item) =>
        !item.trashed &&
        item.id !== except &&
        item.parentId === parentId &&
        item.name.normalize('NFC').toLowerCase() === name.normalize('NFC').toLowerCase(),
    )
  )
    throw new Error('Já existe um item com esse nome nesta pasta.');
}
function descendants(entries, id) {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of entries)
      if (ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
  }
  return ids;
}
export function validateFileEntries(entries) {
  if (!Array.isArray(entries) || entries.length > 500)
    throw new Error('Dados locais inválidos. Os arquivos não foram substituídos.');
  const ids = new Set();
  for (const item of entries) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      ids.has(item.id) ||
      !['folder', 'file'].includes(item.kind) ||
      !Number.isInteger(item.revision) ||
      item.revision < 1 ||
      (item.kind === 'file' && !(item.blob instanceof Blob))
    )
      throw new Error('Dados locais inválidos. Os arquivos não foram substituídos.');
    validateFileName(item.name);
    ids.add(item.id);
  }
  for (const item of entries) {
    const visited = new Set([item.id]);
    let parent = item.parentId;
    while (parent !== null) {
      if (visited.has(parent))
        throw new Error('Dados locais inválidos. Os arquivos não foram substituídos.');
      visited.add(parent);
      const folder = entries.find((entry) => entry.id === parent && entry.kind === 'folder');
      if (!folder) throw new Error('Dados locais inválidos. Os arquivos não foram substituídos.');
      parent = folder.parentId;
    }
  }
  return entries;
}
export function applyFileOperation(entries, operation) {
  validateFileEntries(entries);
  if (
    !Array.isArray(entries) ||
    entries.some(
      (item) =>
        !item ||
        typeof item.id !== 'string' ||
        typeof item.name !== 'string' ||
        !['folder', 'file'].includes(item.kind),
    )
  )
    throw new Error('Dados locais inválidos. Os arquivos não foram substituídos.');
  if (
    !operation ||
    typeof operation !== 'object' ||
    Array.isArray(operation) ||
    typeof operation.id !== 'string' ||
    !operation.id.trim()
  )
    throw new Error('Operação de arquivo inválida.');
  const now = operation.now ?? Date.now();
  let next;
  const item = entries.find((item) => item.id === operation.id);
  if (operation.type === 'create') {
    if (item || !operation.id || !['folder', 'file'].includes(operation.kind))
      throw new Error('Operação de arquivo inválida.');
    const name = validateFileName(operation.name);
    const parentId = operation.parentId ?? null;
    if (!parentIsValid(entries, parentId)) throw new Error('Pasta de destino indisponível.');
    ensureUnique(entries, name, parentId);
    if (
      operation.kind === 'file' &&
      (!fileKind(name) || !(operation.blob instanceof Blob) || operation.blob.size > FILE_LIMIT)
    )
      throw new Error('Formato não suportado ou arquivo maior que 10 MB.');
    next = [
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
  } else {
    if (!item) throw new Error('Arquivo ou pasta não encontrado.');
    if (item.trashed && !['restore', 'purge'].includes(operation.type))
      throw new Error('Restaure o item da lixeira antes de modificá-lo.');
    if (operation.type === 'restore' && !item.trashed)
      throw new Error('Este item não está na lixeira.');
    if (operation.type === 'rename') {
      const name = validateFileName(operation.name);
      ensureUnique(entries, name, item.parentId, item.id);
      if (
        item.kind === 'file' &&
        name.split('.').at(-1).toLowerCase() !== item.name.split('.').at(-1).toLowerCase()
      )
        throw new Error('Preserve a extensão do arquivo ao renomear.');
      next = entries.map((entry) =>
        entry.id === item.id
          ? { ...entry, name, revision: entry.revision + 1, updatedAt: now }
          : entry,
      );
    } else if (operation.type === 'move') {
      const parentId = operation.parentId ?? null;
      if (!parentIsValid(entries, parentId) || descendants(entries, item.id).has(parentId))
        throw new Error('Não é possível mover uma pasta para dentro dela mesma.');
      ensureUnique(entries, item.name, parentId, item.id);
      next = entries.map((entry) =>
        entry.id === item.id
          ? { ...entry, parentId, revision: entry.revision + 1, updatedAt: now }
          : entry,
      );
    } else if (operation.type === 'write') {
      if (item.kind !== 'file' || item.trashed || fileKind(item.name) !== 'text')
        throw new Error('Este arquivo não pode ser editado.');
      if (item.revision !== operation.revision)
        throw new Error('O arquivo foi alterado em outra janela. Recarregue ou salve uma cópia.');
      if (typeof operation.text !== 'string') throw new Error('Conteúdo inválido.');
      const blob = new Blob([operation.text], { type: 'text/plain;charset=utf-8' });
      if (blob.size > TEXT_LIMIT) throw new Error('O editor aceita textos de até 1 MB.');
      next = entries.map((entry) =>
        entry.id === item.id
          ? { ...entry, blob, revision: entry.revision + 1, updatedAt: now }
          : entry,
      );
    } else if (['trash', 'restore', 'purge'].includes(operation.type)) {
      const ids = descendants(entries, item.id);
      if (operation.type === 'purge') {
        if (!item.trashed)
          throw new Error('Mova o item para a lixeira antes de excluí-lo definitivamente.');
        next = entries.filter((entry) => !ids.has(entry.id));
      } else {
        const parentId =
          operation.type === 'restore' && !parentIsValid(entries, item.parentId)
            ? null
            : item.parentId;
        if (operation.type === 'restore') ensureUnique(entries, item.name, parentId, item.id);
        next = entries.map((entry) => {
          if (!ids.has(entry.id)) return entry;
          if (operation.type === 'trash' && entry.trashed) return entry;
          if (operation.type === 'restore' && entry.trashRootId !== item.trashRootId) return entry;
          return {
            ...entry,
            parentId: entry.id === item.id ? parentId : entry.parentId,
            trashed: operation.type === 'trash',
            trashRootId: operation.type === 'trash' ? item.id : null,
            revision: entry.revision + 1,
            updatedAt: now,
          };
        });
      }
    } else throw new Error('Operação de arquivo inválida.');
  }
  if (
    next.length > 500 ||
    next.reduce((sum, item) => sum + (item.blob?.size ?? 0), 0) > TOTAL_LIMIT
  )
    throw new Error('Limite local de 500 itens ou 50 MB atingido. Revise a lixeira.');
  return next;
}

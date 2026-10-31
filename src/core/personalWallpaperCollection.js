import {
  readWallpaperImage,
  readPersonalWallpaperImage,
  writePersonalWallpaperImage,
  deletePersonalWallpaperImage,
  listPersonalWallpaperImages,
} from '../services/storage/wallpaperStorage';

/* === CONFIGURAÇÃO DA COLEÇÃO === */
const LEGACY_PERSONAL_ID = 'legacy';

/* === METADADOS DAS IMAGENS === */
function createWallpaperEntry(id, file) {
  return {
    id,
    name: file.name || 'Imagem pessoal',
    type: file.type,
    size: file.size,
    lastModified: file.lastModified ?? null,
  };
}

/* === IDENTIFICADORES === */
/* ----- GERAÇÃO SEGURA ----- */
function generateWallpaperId() {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error('Não foi possível gerar um identificador seguro para a imagem.');
  }

  return crypto.randomUUID();
}

/* === MIGRAÇÃO DE IMAGENS === */
/* ----- MIGRAÇÃO DA IMAGEM LEGADA ----- */
async function migrateLegacyWallpaper(existing) {
  const alreadyMigrated = existing.some((entry) => entry.id === LEGACY_PERSONAL_ID);

  if (alreadyMigrated) {
    return existing;
  }

  const legacyFile = await readWallpaperImage();

  if (!legacyFile) {
    return existing;
  }

  try {
    await writePersonalWallpaperImage(LEGACY_PERSONAL_ID, legacyFile);
  } catch {
    /* ----- FALHA NA MIGRAÇÃO ----- */
  }

  return [
    ...existing,
    {
      id: LEGACY_PERSONAL_ID,
      file: legacyFile,
    },
  ];
}

/* === CONSULTAS À COLEÇÃO === */
/* ----- CARREGAMENTO DA COLEÇÃO ----- */
export async function loadPersonalWallpaperCollection() {
  const stored = await listPersonalWallpaperImages();
  const migrated = await migrateLegacyWallpaper(stored);

  return migrated
    .map(({ id, file }) => createWallpaperEntry(id, file))
    .sort((first, second) => first.name.localeCompare(second.name));
}

/* ----- CONSULTA DE IMAGEM ----- */
export async function getPersonalWallpaperFile(id) {
  if (id === LEGACY_PERSONAL_ID) {
    const migrated = await readPersonalWallpaperImage(id);

    if (migrated) {
      return migrated;
    }

    return readWallpaperImage();
  }

  return readPersonalWallpaperImage(id);
}

/* === INCLUSÃO DE IMAGENS === */
export async function addPersonalWallpaper(file, validate) {
  if (typeof validate !== 'function') {
    throw new Error('Validação de wallpaper indisponível.');
  }

  await validate(file);

  const id = generateWallpaperId();

  await writePersonalWallpaperImage(id, file);

  return createWallpaperEntry(id, file);
}

/* === REMOÇÃO DE IMAGENS === */
/* ----- VERIFICAÇÃO DE USO ----- */
export async function removePersonalWallpaper(id, isInUse) {
  if (typeof isInUse !== 'function') {
    throw new Error('Não foi possível verificar o uso da imagem.');
  }

  if (isInUse(id)) {
    return {
      ok: false,
      code: 'WALLPAPER_IN_USE',
    };
  }

  const file = await readPersonalWallpaperImage(id);

  if (!file) {
    return {
      ok: false,
      code: 'WALLPAPER_NOT_FOUND',
    };
  }

  /* ----- REVALIDAÇÃO ANTES DA EXCLUSÃO ----- */
  if (isInUse(id)) {
    return { ok: false, code: 'WALLPAPER_IN_USE' };
  }

  await deletePersonalWallpaperImage(id);

  return {
    ok: true,
    id,
  };
}

/* === COMPATIBILIDADE === */
/* ----- IDENTIFICADOR LEGADO ----- */
export function getLegacyPersonalWallpaperId() {
  return LEGACY_PERSONAL_ID;
}
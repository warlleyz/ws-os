import { useSyncExternalStore } from 'react';
import { getTheme, useTheme } from './themeManager';

import {
  OFFICIAL_WALLPAPERS,
  getDefaultWallpaper,
  getOfficialWallpaper,
  isOfficialWallpaper,
} from './wallpaperCatalog';

import {
  WALLPAPER_SHELLS,
  WALLPAPER_THEMES,
  WALLPAPER_SELECTION_KEYS,
  LEGACY_WALLPAPER_KEYS,
  createDefaultWallpaperSelections,
  isWallpaperContext,
  isPersonalWallpaperId,
  getPersonalWallpaperStorageId,
  createPersonalWallpaperSelectionId,
  isWallpaperSelectedAnywhere,
  resolveWallpaperSelection,
  updateWallpaperSelection,
} from './wallpaperSelectionContract';

import {
  loadPersonalWallpaperCollection,
  getPersonalWallpaperFile,
  addPersonalWallpaper,
  removePersonalWallpaper as removeStoredWallpaper,
} from './personalWallpaperCollection';

/* === Configuração === */
/* ----- Catálogo oficial ----- */
export const WALLPAPERS = Object.freeze(
  OFFICIAL_WALLPAPERS.map((item) =>
    Object.freeze({
      ...item,
      background: `url("/${item.file}") center / cover no-repeat`,
    }),
  ),
);

export const MAX_WALLPAPER_BYTES = 5 * 1024 * 1024;

const IMAGE_REVISION_KEY = 'ws-os:wallpaper-image-revision';
const LEGACY_ID = 'personal:legacy';

/* === Persistência das seleções === */
/* ----- Leitura protegida ----- */
function readSelection(shell, theme) {
  const fallback = getDefaultWallpaper(theme);

  try {
    const result = resolveWallpaperSelection({
      savedId: localStorage.getItem(WALLPAPER_SELECTION_KEYS[shell][theme]),
      legacyId: localStorage.getItem(LEGACY_WALLPAPER_KEYS[shell]),
      theme,
    });

    return result.ok ? result.id : fallback;
  } catch {
    return fallback;
  }
}

/* ----- Carregamento das quatro seleções ----- */
function loadSelections() {
  const next = createDefaultWallpaperSelections();

  for (const shell of WALLPAPER_SHELLS) {
    for (const theme of WALLPAPER_THEMES) {
      next[shell][theme] = readSelection(shell, theme);
    }
  }

  return next;
}

/* === Estado compartilhado === */
/* ----- Preferências e coleção ----- */
let selected = loadSelections();
let fits = loadFits();
let personalWallpapers = [];
let personalUrls = new Map();

let revision = 0;
let status = 'loading';
let generation = 0;
let uploading = false;
let restoringPromise = null;

const listeners = new Set();

/* ----- Assinatura e atualização ----- */
export function subscribeWallpapers(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function emit() {
  revision += 1;

  for (const listener of listeners) {
    listener();
  }
}

/* === Consultas às seleções === */
/* ----- Seleção por plataforma e tema ----- */
export function getWallpaper(shell = 'desktop', theme = getTheme()) {
  if (!isWallpaperContext(shell, theme)) {
    return getDefaultWallpaper('dark');
  }

  return selected[shell][theme];
}

/* ----- Assinatura React ----- */
export function useWallpaper(shell = 'desktop') {
  const theme = useTheme();

  return useSyncExternalStore(
    subscribeWallpapers,
    () => getWallpaper(shell, theme),
    () => getDefaultWallpaper(theme),
  );
}

/* ----- Revisão visual ----- */
export function useWallpaperRevision() {
  return useSyncExternalStore(
    subscribeWallpapers,
    () => revision,
    () => 0,
  );
}

/* === Consultas à coleção pessoal === */
/* ----- Lista de imagens disponíveis ----- */
export function getPersonalWallpapers() {
  return personalWallpapers;
}

/* ----- Assinatura da coleção ----- */
export function usePersonalWallpapers() {
  return useSyncExternalStore(subscribeWallpapers, getPersonalWallpapers, () => []);
}

/* ----- Disponibilidade ----- */
export function getCustomWallpaperAvailable() {
  return personalUrls.size > 0;
}

export function useCustomWallpaperAvailable() {
  return useSyncExternalStore(subscribeWallpapers, getCustomWallpaperAvailable, () => false);
}

/* ----- Estado de recuperação ----- */
export function getWallpaperStatus() {
  return status;
}

export function useWallpaperStatus() {
  return useSyncExternalStore(subscribeWallpapers, getWallpaperStatus, () => 'loading');
}

/* === Definições visuais === */
/* ----- Identificador pessoal legado ----- */
function resolvePersonalId(id) {
  return id === 'custom' ? LEGACY_ID : id;
}

/* ----- Wallpaper oficial ou pessoal ----- */
export function getWallpaperDefinition(id, shell = 'desktop', theme = getTheme()) {
  const resolvedTheme = WALLPAPER_THEMES.includes(theme) ? theme : 'dark';

  const personalId = resolvePersonalId(id);

  if (isPersonalWallpaperId(personalId)) {
    const url = personalUrls.get(personalId);

    if (url) {
      const metadata = personalWallpapers.find((item) => item.id === personalId);

      return {
        id,
        name: metadata?.name ?? 'Personalizado',
        theme: resolvedTheme,
        shell,
        imageUrl: url,
        background: imageBackground(url, shell, resolvedTheme),
      };
    }
  }

  const officialId = isOfficialWallpaper(id, resolvedTheme)
    ? id
    : getDefaultWallpaper(resolvedTheme);

  const item = getOfficialWallpaper(officialId);

  return {
    ...item,
    shell,
    imageUrl: `/${item.file}`,
    background: imageBackground(`/${item.file}`, shell, resolvedTheme),
  };
}

/* === Alterações de preferência === */
/* ----- Verificação da imagem pessoal ----- */
function isAvailableSelection(id) {
  if (id === 'custom') {
    return personalUrls.has(LEGACY_ID);
  }

  if (isPersonalWallpaperId(id)) {
    return personalUrls.has(id);
  }

  return true;
}

/* ----- Seleção independente por plataforma e tema ----- */
export function setWallpaper(id, shell = 'desktop', theme = getTheme()) {
  if (!isWallpaperContext(shell, theme) || !isAvailableSelection(id)) return false;
  const result = updateWallpaperSelection(selected, { shell, theme, id });
  if (!result.ok) return false;
  // A sessão continua funcional quando o navegador bloqueia a persistência.
  selected = result.selections;
  emit();
  try {
    localStorage.setItem(WALLPAPER_SELECTION_KEYS[shell][theme], id);
    return true;
  } catch {
    return false;
  }
}

/* === Enquadramento === */
/* ----- Preferência independente das quatro seleções ----- */
export function getWallpaperFit(shell = 'desktop', theme = getTheme()) {
  return fits[shell]?.[theme] ?? 'cover';
}

export function setWallpaperFit(fit, shell = 'desktop', theme = getTheme()) {
  if (!['cover', 'contain', 'center'].includes(fit) || !isWallpaperContext(shell, theme))
    return false;
  fits = { ...fits, [shell]: { ...fits[shell], [theme]: fit } };
  emit();
  try {
    localStorage.setItem('ws-os:wallpaper-fit', JSON.stringify(fits));
    return true;
  } catch {
    return false;
  }
}

function loadFits() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem('ws-os:wallpaper-fit') ?? 'null');
  } catch {
    /* Preferências padrão preservadas. */
  }
  const result = {};
  for (const shell of WALLPAPER_SHELLS) {
    result[shell] = {};
    for (const theme of WALLPAPER_THEMES) {
      const fit = saved?.[shell]?.[theme];
      result[shell][theme] = ['cover', 'contain', 'center'].includes(fit) ? fit : 'cover';
    }
  }
  return result;
}

function imageBackground(url, shell, theme) {
  const fit = getWallpaperFit(shell, theme);
  return fit === 'center'
    ? `url("${url}") center / auto no-repeat`
    : `url("${url}") center / ${fit} no-repeat`;
}

/* === Validação de imagens === */
/* ----- MIME, assinatura e tamanho ----- */
export async function validateWallpaper(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Formato inválido. Utilize PNG, JPEG ou WebP.');
  }

  if (!file.size || file.size > MAX_WALLPAPER_BYTES) {
    throw new Error('A imagem deve ter até 5 MB.');
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  const png =
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10;

  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;

  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';

  const validSignature = {
    'image/png': png,
    'image/jpeg': jpeg,
    'image/webp': webp,
  }[file.type];

  if (!validSignature) {
    throw new Error('O conteúdo não corresponde ao formato da imagem.');
  }

  let image;

  try {
    image = await createImageBitmap(file);
  } catch (cause) {
    throw new Error('Não foi possível decodificar a imagem.', { cause });
  }

  try {
    if (
      !image.width ||
      !image.height ||
      image.width * image.height > 32000000 ||
      Math.max(image.width, image.height) > 8192
    ) {
      throw new Error('A imagem deve ter até 32 megapixels e 8192 pixels por lado.');
    }
  } finally {
    image.close();
  }
}

/* === Instalação da coleção === */
/* ----- Metadados públicos ----- */
function createPublicEntry(entry) {
  return {
    ...entry,
    id: createPersonalWallpaperSelectionId(entry.id),
  };
}

/* ----- Atualização das imagens carregadas ----- */
async function installCollection(entries, version) {
  const nextUrls = new Map();
  const nextEntries = [];

  try {
    for (const entry of entries) {
      const file = await getPersonalWallpaperFile(entry.id);

      if (!file) {
        continue;
      }

      try {
        await validateWallpaper(file);
      } catch {
        // Uma imagem inválida não impede a recuperação das demais.
        continue;
      }

      const selectionId = createPersonalWallpaperSelectionId(entry.id);

      if (!selectionId) {
        continue;
      }

      const existingUrl = personalUrls.get(selectionId);
      const url = existingUrl ?? URL.createObjectURL(file);

      nextUrls.set(selectionId, url);
      nextEntries.push(createPublicEntry(entry));
    }
  } catch (error) {
    for (const [id, url] of nextUrls) {
      if (!personalUrls.has(id)) {
        URL.revokeObjectURL(url);
      }
    }

    throw error;
  }

  if (version !== generation) {
    for (const [id, url] of nextUrls) {
      if (!personalUrls.has(id)) {
        URL.revokeObjectURL(url);
      }
    }

    return;
  }

  const previousUrls = personalUrls;

  personalUrls = nextUrls;
  personalWallpapers = nextEntries;

  for (const [id, url] of previousUrls) {
    if (!nextUrls.has(id)) {
      URL.revokeObjectURL(url);
    }
  }

  const missingSelection = WALLPAPER_SHELLS.some((shell) =>
    WALLPAPER_THEMES.some((theme) => {
      const id = resolvePersonalId(selected[shell][theme]);
      return isPersonalWallpaperId(id) && !personalUrls.has(id);
    }),
  );
  status = missingSelection ? 'missing' : personalWallpapers.length ? 'ready' : 'empty';
  emit();
}

/* === Recuperação === */
/* ----- Carregar e migrar coleção pessoal ----- */
export function restoreCustomWallpaper() {
  if (restoringPromise) {
    return restoringPromise;
  }

  const version = generation;

  status = 'loading';
  emit();

  restoringPromise = loadPersonalWallpaperCollection()
    .then((entries) => installCollection(entries, version))
    .catch(() => {
      if (version === generation) {
        status = 'error';
        emit();
      }
    })
    .finally(() => {
      restoringPromise = null;
    });

  return restoringPromise;
}

/* === Upload === */
/* ----- Adicionar nova imagem pessoal ----- */
export async function addWallpaperToCollection(file) {
  if (uploading) {
    throw new Error('Aguarde o salvamento da imagem.');
  }

  uploading = true;

  try {
    const entry = await addPersonalWallpaper(file, validateWallpaper);

    const selectionId = createPersonalWallpaperSelectionId(entry.id);

    const url = URL.createObjectURL(file);

    personalUrls = new Map(personalUrls);
    personalUrls.set(selectionId, url);

    personalWallpapers = [...personalWallpapers, createPublicEntry(entry)];

    generation += 1;
    status = 'ready';
    emit();

    signalImageChange();

    return {
      ...entry,
      id: selectionId,
    };
  } finally {
    uploading = false;
  }
}

/* ----- Compatibilidade com upload anterior ----- */
export async function uploadCustomWallpaper(file, shell = 'desktop') {
  if (!WALLPAPER_SHELLS.includes(shell)) {
    throw new Error('Preferência inválida.');
  }

  const theme = getTheme();
  const entry = await addWallpaperToCollection(file);

  return setWallpaper(entry.id, shell, theme);
}

/* === Exclusão segura === */
/* ----- Verificação de uso nas quatro seleções ----- */
export function isPersonalWallpaperInUse(id) {
  const selectionId =
    id === 'custom'
      ? LEGACY_ID
      : isPersonalWallpaperId(id)
        ? id
        : createPersonalWallpaperSelectionId(id);

  if (!selectionId) {
    return false;
  }

  if (
    selectionId === LEGACY_ID &&
    WALLPAPER_SHELLS.some((shell) =>
      WALLPAPER_THEMES.some((theme) => selected[shell][theme] === 'custom'),
    )
  ) {
    return true;
  }

  return (
    isWallpaperSelectedAnywhere(selected, selectionId) ||
    WALLPAPER_SHELLS.some((shell) =>
      WALLPAPER_THEMES.some(
        (theme) => resolvePersonalId(readSelection(shell, theme)) === selectionId,
      ),
    )
  );
}

/* ----- Remover imagem não utilizada ----- */
export async function deleteWallpaperFromCollection(id) {
  const selectionId = isPersonalWallpaperId(id) ? id : createPersonalWallpaperSelectionId(id);

  if (!selectionId || !personalUrls.has(selectionId)) {
    return {
      ok: false,
      code: 'WALLPAPER_NOT_FOUND',
    };
  }

  if (isPersonalWallpaperInUse(selectionId)) {
    return {
      ok: false,
      code: 'WALLPAPER_IN_USE',
    };
  }

  // A cópia original da imagem legada permanece protegida.
  if (selectionId === LEGACY_ID) {
    return {
      ok: false,
      code: 'WALLPAPER_LEGACY_PROTECTED',
    };
  }

  const storageId = getPersonalWallpaperStorageId(selectionId);

  const result = await removeStoredWallpaper(storageId, () =>
    isPersonalWallpaperInUse(selectionId),
  );

  if (!result.ok) {
    return result;
  }

  const url = personalUrls.get(selectionId);

  personalUrls = new Map(personalUrls);
  personalUrls.delete(selectionId);

  personalWallpapers = personalWallpapers.filter((entry) => entry.id !== selectionId);

  generation += 1;
  status = personalWallpapers.length ? 'ready' : 'empty';

  emit();

  if (url) {
    URL.revokeObjectURL(url);
  }

  signalImageChange();

  return {
    ok: true,
    id: selectionId,
  };
}

/* === Sincronização === */
/* ----- Notificar outras abas ----- */
function signalImageChange() {
  try {
    localStorage.setItem(IMAGE_REVISION_KEY, String(Date.now()));
  } catch {
    /* ----- Persistência bloqueada: sessão preservada ----- */
  }
}

/* ----- Inicialização ----- */
restoreCustomWallpaper();

/* ----- Alterações externas ----- */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    const selectionKeys = Object.values(WALLPAPER_SELECTION_KEYS).flatMap((keys) =>
      Object.values(keys),
    );

    const legacyKeys = Object.values(LEGACY_WALLPAPER_KEYS);

    if (event.key === null || selectionKeys.includes(event.key) || legacyKeys.includes(event.key)) {
      selected = loadSelections();
      emit();
    }

    if (event.key === null || event.key === 'ws-os:wallpaper-fit') {
      fits = loadFits();
      emit();
    }

    if (event.key === null || event.key === IMAGE_REVISION_KEY) {
      restoreCustomWallpaper();
    }
  });
}

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
  WALLPAPER_SELECTION_KEYS,
  LEGACY_WALLPAPER_KEYS,
  createDefaultWallpaperSelections,
  isWallpaperContext,
  resolveWallpaperSelection,
  updateWallpaperSelection,
} from './wallpaperSelectionContract';
import {
  readWallpaperImage,
  writeWallpaperImage,
} from '../services/storage/wallpaperStorage';

/* === Catálogo === */
/* ----- Wallpapers oficiais ----- */
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

/* === Seleções === */
/* ----- Leitura de preferências ----- */
function readSelection(shell, theme) {
  const fallback = getDefaultWallpaper(theme);

  try {
    const savedId = localStorage.getItem(
      WALLPAPER_SELECTION_KEYS[shell][theme],
    );

    const legacyId = localStorage.getItem(
      LEGACY_WALLPAPER_KEYS[shell],
    );

    const result = resolveWallpaperSelection({
      savedId,
      legacyId,
      theme,
    });

    return result.ok ? result.id : fallback;
  } catch {
    return fallback;
  }
}

/* ----- Estado inicial ----- */
function loadSelections() {
  const next = createDefaultWallpaperSelections();

  for (const shell of WALLPAPER_SHELLS) {
    for (const theme of ['dark', 'light']) {
      next[shell][theme] = readSelection(shell, theme);
    }
  }

  return next;
}

let selected = loadSelections();

/* === Estado compartilhado === */
/* ----- Imagem pessoal e operações ----- */
let customUrl = null;
let revision = 0;
let status = 'loading';
let generation = 0;
let uploading = false;
let restorePromise;

const listeners = new Set();

/* ----- Assinaturas ----- */
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  revision += 1;
  listeners.forEach((listener) => listener());
}

/* === Consultas === */
/* ----- Seleção por plataforma e tema ----- */
export function getWallpaper(
  shell = 'desktop',
  theme = getTheme(),
) {
  if (!isWallpaperContext(shell, theme)) {
    return getDefaultWallpaper('dark');
  }

  return selected[shell][theme];
}

/* ----- Hook de seleção ----- */
export function useWallpaper(shell = 'desktop') {
  const theme = useTheme();

  return useSyncExternalStore(
    subscribe,
    () => getWallpaper(shell, theme),
    () => getDefaultWallpaper(theme),
  );
}

/* ----- Hook de atualização visual ----- */
export function useWallpaperRevision() {
  return useSyncExternalStore(
    subscribe,
    () => revision,
    () => 0,
  );
}

/* ----- Disponibilidade da imagem pessoal ----- */
export function getCustomWallpaperAvailable() {
  return Boolean(customUrl);
}

export function useCustomWallpaperAvailable() {
  return useSyncExternalStore(
    subscribe,
    getCustomWallpaperAvailable,
    () => false,
  );
}

/* ----- Estado de recuperação ----- */
export function getWallpaperStatus() {
  return status;
}

export function useWallpaperStatus() {
  return useSyncExternalStore(
    subscribe,
    getWallpaperStatus,
    () => 'loading',
  );
}

/* === Definições visuais === */
/* ----- Wallpaper oficial ou pessoal ----- */
export function getWallpaperDefinition(
  id,
  shell = 'desktop',
  theme = getTheme(),
) {
  const resolvedTheme = ['dark', 'light'].includes(theme)
    ? theme
    : 'dark';

  if (id === 'custom' && customUrl) {
    return {
      id: 'custom',
      name: 'Personalizado',
      theme: resolvedTheme,
      background: `url("${customUrl}") center / cover no-repeat`,
    };
  }

  const officialId = isOfficialWallpaper(id, resolvedTheme)
    ? id
    : getDefaultWallpaper(resolvedTheme);

  const item = getOfficialWallpaper(officialId);

  return {
    ...item,
    shell,
    background: `url("/${item.file}") center / cover no-repeat`
  };
}

/* === Atualização de preferências === */
/* ----- Seleção independente ----- */
export function setWallpaper(
  id,
  shell = 'desktop',
  theme = getTheme(),
) {
  if (!isWallpaperContext(shell, theme)) {
    return false;
  }

  if (id === 'custom' && !customUrl) {
    return false;
  }

  const result = updateWallpaperSelection(selected, {
    shell,
    theme,
    id,
  });

  if (!result.ok) {
    return false;
  }

  selected = result.selections;
  emit();

  try {
    localStorage.setItem(
      WALLPAPER_SELECTION_KEYS[shell][theme],
      id,
    );

    return true;
  } catch {
    return false;
  }
}

/* === Imagem personalizada === */
/* ----- Instalação da imagem ----- */
function install(file) {
  const previous = customUrl;

  customUrl = URL.createObjectURL(file);
  status = 'ready';
  emit();

  if (previous) {
    URL.revokeObjectURL(previous);
  }
}

/* ----- Validação de arquivo ----- */
export async function validateWallpaper(file) {
  if (
    !file ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  ) {
    throw new Error(
      'Formato inválido. Utilize PNG, JPEG ou WebP.',
    );
  }

  if (!file.size || file.size > MAX_WALLPAPER_BYTES) {
    throw new Error('A imagem deve ter até 5 MB.');
  }

  const bytes = new Uint8Array(
    await file.slice(0, 12).arrayBuffer(),
  );

  const png =
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10;

  const jpeg =
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255;

  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';

  const signatures = {
    'image/png': png,
    'image/jpeg': jpeg,
    'image/webp': webp,
  };

  if (!signatures[file.type]) {
    throw new Error(
      'O conteúdo não corresponde ao formato da imagem.',
    );
  }

  let image;

  try {
    image = await createImageBitmap(file);
  } catch (cause) {
    throw new Error(
      'Não foi possível decodificar a imagem.',
      { cause },
    );
  }

  try {
    if (
      !image.width ||
      !image.height ||
      image.width * image.height > 32000000 ||
      Math.max(image.width, image.height) > 8192
    ) {
      throw new Error(
        'A imagem deve ter até 32 megapixels e 8192 pixels por lado.',
      );
    }
  } finally {
    image.close();
  }
}

/* ----- Upload e seleção ----- */
export async function uploadCustomWallpaper(
  file,
  shell = 'desktop',
) {
  if (!WALLPAPER_SHELLS.includes(shell)) {
    throw new Error('Preferência inválida.');
  }

  if (uploading) {
    throw new Error('Aguarde o salvamento da imagem.');
  }

  uploading = true;

  try {
    await validateWallpaper(file);

    try {
      await writeWallpaperImage(file);
    } catch (error) {
      throw new Error(
        error?.name === 'QuotaExceededError'
          ? 'Sem espaço para salvar a imagem. A imagem anterior foi preservada.'
          : 'Não foi possível salvar a imagem. A imagem anterior foi preservada.',
        { cause: error },
      );
    }

    generation += 1;
    install(file);

    try {
      localStorage.setItem(
        IMAGE_REVISION_KEY,
        String(Date.now()),
      );
    } catch {
      /* ----- Falha de persistência não apaga a imagem ----- */
    }

    return setWallpaper('custom', shell);
  } finally {
    uploading = false;
  }
}

/* === Recuperação === */
/* ----- Imagem persistida no IndexedDB ----- */
export function restoreCustomWallpaper() {
  if (restorePromise) {
    return restorePromise;
  }

  const version = generation;

  restorePromise = readWallpaperImage()
    .then(async (file) => {
      if (file) {
        await validateWallpaper(file);
      }

      if (version !== generation) {
        return;
      }

      if (file) {
        install(file);
      } else {
        status = WALLPAPER_SHELLS.some((shell) =>
          ['dark', 'light'].some(
            (theme) => selected[shell][theme] === 'custom',
          ),
        )
          ? 'missing'
          : 'empty';

        emit();
      }
    })
    .catch(() => {
      if (version === generation) {
        status = 'error';
        emit();
      }
    });

  return restorePromise;
}

/* === Sincronização === */
/* ----- Inicialização da imagem pessoal ----- */
restoreCustomWallpaper();

/* ----- Alterações em outras abas ----- */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    const selectionKeys = Object.values(
      WALLPAPER_SELECTION_KEYS,
    ).flatMap((keys) => Object.values(keys));

    const legacyKeys = Object.values(
      LEGACY_WALLPAPER_KEYS,
    );

    if (
      event.key === null ||
      selectionKeys.includes(event.key) ||
      legacyKeys.includes(event.key)
    ) {
      selected = loadSelections();
      emit();
    }

    if (
      event.key === null ||
      event.key === IMAGE_REVISION_KEY
    ) {
      restorePromise = null;
      restoreCustomWallpaper();
    }
  });
}
import { useSyncExternalStore } from 'react';
import { readWallpaperImage, writeWallpaperImage } from '../services/storage/wallpaperStorage';

export const MAX_WALLPAPER_BYTES = 5 * 1024 * 1024;
const KEYS = { desktop: 'ws-os:wallpaper', mobile: 'ws-os:mobile-wallpaper' };
export const WALLPAPERS = Object.freeze([
  {
    id: 'original',
    name: 'WS OS Original',
    background:
      'radial-gradient(ellipse at 75% 20%, #378ce440, transparent 50%), radial-gradient(ellipse at 20% 85%, #65cde124, transparent 48%), #111925',
    mobileBackground:
      'radial-gradient(ellipse at 85% 15%, #378ce466, transparent 55%), linear-gradient(170deg, #111925, #122e42)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    background:
      'radial-gradient(ellipse at 80% 15%, #5d44b473, transparent 52%), radial-gradient(ellipse at 15% 80%, #23aaa847, transparent 55%), #101625',
    mobileBackground:
      'radial-gradient(ellipse at 15% 30%, #5d44b488, transparent 60%), radial-gradient(ellipse at 85% 85%, #23aaa877, transparent 60%), #101625',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: 'linear-gradient(145deg, #14283e, #162132 50%, #0b1522)',
    mobileBackground: 'linear-gradient(180deg, #14283e, #0b1522)',
  },
]);
const validId = (id) => id === 'custom' || WALLPAPERS.some((item) => item.id === id);
function load(shell) {
  try {
    const value = localStorage.getItem(KEYS[shell]);
    return validId(value) ? value : 'original';
  } catch {
    return 'original';
  }
}
const selected = { desktop: load('desktop'), mobile: load('mobile') };
let customUrl = null;
let revision = 0;
let status = 'loading';
let generation = 0;
let uploading = false;
let restorePromise;
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function emit() {
  revision += 1;
  listeners.forEach((listener) => listener());
}
export const getWallpaper = (shell = 'desktop') => selected[shell] ?? 'original';
export function useWallpaper(shell = 'desktop') {
  return useSyncExternalStore(
    subscribe,
    () => getWallpaper(shell),
    () => 'original',
  );
}
export function useWallpaperRevision() {
  return useSyncExternalStore(
    subscribe,
    () => revision,
    () => 0,
  );
}
export const getCustomWallpaperAvailable = () => Boolean(customUrl);
export function useCustomWallpaperAvailable() {
  return useSyncExternalStore(subscribe, getCustomWallpaperAvailable, () => false);
}
export const getWallpaperStatus = () => status;
export function useWallpaperStatus() {
  return useSyncExternalStore(subscribe, getWallpaperStatus, () => 'loading');
}
export function getWallpaperDefinition(id, shell = 'desktop') {
  if (id === 'custom' && customUrl)
    return {
      id,
      name: 'Personalizado',
      background: `url("${customUrl}") center / cover no-repeat`,
    };
  const item = WALLPAPERS.find((entry) => entry.id === id) ?? WALLPAPERS[0];
  return { ...item, background: shell === 'mobile' ? item.mobileBackground : item.background };
}
export function setWallpaper(id, shell = 'desktop') {
  if (!Object.hasOwn(KEYS, shell) || !validId(id) || (id === 'custom' && !customUrl)) return false;
  selected[shell] = id;
  emit();
  try {
    localStorage.setItem(KEYS[shell], id);
    return true;
  } catch {
    return false;
  }
}
function install(file) {
  const previous = customUrl;
  customUrl = URL.createObjectURL(file);
  status = 'ready';
  emit();
  if (previous) URL.revokeObjectURL(previous);
}
export async function validateWallpaper(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Formato inválido. Utilize PNG, JPEG ou WebP.');
  if (!file.size || file.size > MAX_WALLPAPER_BYTES) throw new Error('A imagem deve ter até 5 MB.');
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
  if (!{ 'image/png': png, 'image/jpeg': jpeg, 'image/webp': webp }[file.type])
    throw new Error('O conteúdo não corresponde ao formato da imagem.');
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
    )
      throw new Error('A imagem deve ter até 32 megapixels e 8192 pixels por lado.');
  } finally {
    image.close();
  }
}
export async function uploadCustomWallpaper(file, shell = 'desktop') {
  if (!Object.hasOwn(KEYS, shell)) throw new Error('Preferência inválida.');
  if (uploading) throw new Error('Aguarde o salvamento da imagem.');
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
      localStorage.setItem('ws-os:wallpaper-image-revision', String(Date.now()));
    } catch {
      /* Selection saving reports storage failure below. */
    }
    return setWallpaper('custom', shell);
  } finally {
    uploading = false;
  }
}
export function restoreCustomWallpaper() {
  if (restorePromise) return restorePromise;
  const version = generation;
  restorePromise = readWallpaperImage()
    .then(async (file) => {
      if (file) await validateWallpaper(file);
      if (version !== generation) return;
      if (file) install(file);
      else {
        status = Object.values(selected).includes('custom') ? 'missing' : 'empty';
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
restoreCustomWallpaper();

if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key === null || Object.values(KEYS).includes(event.key)) {
      selected.desktop = load('desktop');
      selected.mobile = load('mobile');
      emit();
    }
    if (event.key === 'ws-os:wallpaper-image-revision') {
      restorePromise = null;
      restoreCustomWallpaper();
    }
  });

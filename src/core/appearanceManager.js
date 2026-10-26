import { useSyncExternalStore } from 'react';
import {
  DEFAULT_APPEARANCE,
  APPEARANCE_OPTIONS,
  normalizeAppearance,
  extractWallpaperAccent,
} from './appearanceContract';
export { DEFAULT_APPEARANCE, APPEARANCE_OPTIONS } from './appearanceContract';

/* === CONFIGURAÇÃO === */
/* ----- Persistência e contexto efetivamente apresentado ----- */
const STORAGE_KEY = 'ws-os:appearance';
let activeTheme = 'dark';
let automaticAccent = 'blue';
let generation = 0;
const extracted = new Map();
const listeners = new Set();
export function loadAppearance() {
  try {
    return normalizeAppearance(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return normalizeAppearance(null);
  }
}
let currentAppearance = loadAppearance();

/* === APLICAÇÃO VISUAL === */
/* ----- Tokens compartilhados por todos os consumidores ----- */
export function applyAppearance(preferences) {
  const root = document.documentElement;
  root.dataset.wallpaperHidden = String(preferences.hideWallpaper === true);
  root.dataset.accent = preferences.accent;
  root.dataset.motionIntensity = preferences.motion;
  root.dataset.blur = preferences.blur;
  root.dataset.transparency = preferences.transparency;
}
function publish() {
  const preference = currentAppearance.accents[activeTheme];
  currentAppearance = {
    ...currentAppearance,
    accentMode: preference.mode,
    accent: preference.mode === 'manual' ? preference.manual : automaticAccent,
  };
  applyAppearance(currentAppearance);
  listeners.forEach((listener) => listener());
}

/* === CONTEXTO AUTOMÁTICO === */
/* ----- O shell aprovado pelo Core determina a imagem de referência ----- */
export function updateAppearanceContext(theme, wallpaper) {
  activeTheme = theme === 'light' ? 'light' : 'dark';
  const version = ++generation;
  const id = wallpaper?.id ?? '';
  automaticAccent = id.endsWith('-green') ? 'green' : id.endsWith('-violeta') ? 'violet' : 'blue';
  const url = wallpaper?.imageUrl;
  if (url?.startsWith('blob:')) {
    automaticAccent = extracted.get(url) ?? 'blue';
    if (!extracted.has(url)) {
      extractWallpaperAccent(url)
        .catch(() => 'blue')
        .then((accent) => {
          // Nenhuma extração antiga pode substituir uma imagem ou tema mais recente.
          if (version !== generation) return;
          if (extracted.size >= 32) extracted.clear();
          extracted.set(url, accent);
          automaticAccent = accent;
          publish();
        });
    }
  }
  publish();
}

/* === PREFERÊNCIAS === */
/* ----- Assinatura estável e gravação por tema ----- */
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getAppearance() {
  return currentAppearance;
}
export function useAppearance() {
  return useSyncExternalStore(subscribe, getAppearance, () => DEFAULT_APPEARANCE);
}
function save(next) {
  currentAppearance = normalizeAppearance(next);
  publish();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentAppearance));
    return true;
  } catch {
    return false;
  }
}
export function setAppearance(values) {
  const next = normalizeAppearance({ ...currentAppearance, ...values });
  if (APPEARANCE_OPTIONS.accent.includes(values.accent)) {
    next.accents[activeTheme] = { mode: 'manual', manual: values.accent };
  } else if (['auto', 'manual'].includes(values.accentMode)) {
    next.accents[activeTheme].mode = values.accentMode;
  }
  return save(next);
}
export function resetAppearance() {
  return save(DEFAULT_APPEARANCE);
}
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    currentAppearance = loadAppearance();
    publish();
  });

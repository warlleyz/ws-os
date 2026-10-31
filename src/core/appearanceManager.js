import { useSyncExternalStore } from 'react';

import {
  DEFAULT_APPEARANCE,
  APPEARANCE_OPTIONS,
  normalizeAppearance,
  extractWallpaperAccent,
} from './appearanceContract';

export { DEFAULT_APPEARANCE, APPEARANCE_OPTIONS } from './appearanceContract';

/* === CONFIGURAÇÃO DE APARÊNCIA === */
const STORAGE_KEY = 'ws-os:appearance';

/* === ESTADO COMPARTILHADO === */
let activeTheme = 'dark';
let automaticAccent = 'blue';
let generation = 0;

const extracted = new Map();
const listeners = new Set();

/* === PERSISTÊNCIA DE APARÊNCIA === */
/* ----- CARREGAMENTO ----- */
export function loadAppearance() {
  try {
    return normalizeAppearance(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return normalizeAppearance(null);
  }
}

let currentAppearance = loadAppearance();

/* === APLICAÇÃO VISUAL === */
/* ----- ATUALIZAÇÃO DOS ATRIBUTOS ----- */
export function applyAppearance(preferences) {
  const root = document.documentElement;

  root.dataset.wallpaperHidden = String(preferences.hideWallpaper === true);
  root.dataset.accent = preferences.accent;
  root.dataset.motionIntensity = preferences.motion;
  root.dataset.blur = preferences.blur;
  root.dataset.transparency = preferences.transparency;
}

/* ----- PUBLICAÇÃO DA APARÊNCIA ----- */
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
/* ----- ATUALIZAÇÃO DO TEMA E WALLPAPER ----- */
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
          /* ----- VERIFICAÇÃO DA GERAÇÃO ATUAL ----- */
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

/* === CONSULTAS E ASSINATURAS === */
/* ----- ASSINATURA DE ALTERAÇÕES ----- */
function subscribe(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

/* ----- CONSULTA DA APARÊNCIA ----- */
export function getAppearance() {
  return currentAppearance;
}

/* ----- HOOK DE APARÊNCIA ----- */
export function useAppearance() {
  return useSyncExternalStore(subscribe, getAppearance, () => DEFAULT_APPEARANCE);
}

/* === ATUALIZAÇÃO DE PREFERÊNCIAS === */
/* ----- SALVAMENTO ----- */
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

/* ----- ALTERAÇÃO DA APARÊNCIA ----- */
export function setAppearance(values) {
  const next = normalizeAppearance({ ...currentAppearance, ...values });

  if (APPEARANCE_OPTIONS.accent.includes(values.accent)) {
    next.accents[activeTheme] = { mode: 'manual', manual: values.accent };
  } else if (['auto', 'manual'].includes(values.accentMode)) {
    next.accents[activeTheme].mode = values.accentMode;
  }

  return save(next);
}

/* ----- RESTAURAÇÃO DO PADRÃO ----- */
export function resetAppearance() {
  return save(DEFAULT_APPEARANCE);
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;

    currentAppearance = loadAppearance();
    publish();
  });
}
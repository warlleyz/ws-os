import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ws-os:appearance';

export const DEFAULT_APPEARANCE = Object.freeze({
  accent: 'blue',
  motion: 'normal',
  blur: 'normal',
  transparency: 'default',
});

export const APPEARANCE_OPTIONS = Object.freeze({
  accent: ['blue', 'violet', 'green'],
  motion: ['off', 'subtle', 'normal'],
  blur: ['off', 'soft', 'normal', 'strong'],
  transparency: ['solid', 'default', 'high'],
});

function normalizeAppearance(value) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};

  for (const [key, options] of Object.entries(APPEARANCE_OPTIONS)) {
    result[key] = options.includes(source[key]) ? source[key] : DEFAULT_APPEARANCE[key];
  }

  return result;
}

export function loadAppearance() {
  try {
    return normalizeAppearance(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function applyAppearance(preferences) {
  const appearance = normalizeAppearance(preferences);
  const root = document.documentElement;

  root.dataset.accent = appearance.accent;
  root.dataset.motionIntensity = appearance.motion;
  root.dataset.blur = appearance.blur;
  root.dataset.transparency = appearance.transparency;
}

let currentAppearance = loadAppearance();
const listeners = new Set();

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

export function setAppearance(nextValues) {
  const next = normalizeAppearance({
    ...currentAppearance,
    ...nextValues,
  });

  currentAppearance = next;
  applyAppearance(next);

  listeners.forEach((listener) => listener());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function resetAppearance() {
  return setAppearance(DEFAULT_APPEARANCE);
}

if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    currentAppearance = loadAppearance();
    applyAppearance(currentAppearance);
    listeners.forEach((listener) => listener());
  });

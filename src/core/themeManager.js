import { useSyncExternalStore } from 'react';

const THEME_STORAGE_KEY = 'ws-os:theme';

export const AVAILABLE_THEMES = ['dark', 'light'];

export function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return AVAILABLE_THEMES.includes(saved) ? saved : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme) {
  if (!AVAILABLE_THEMES.includes(theme)) return false;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

export function applyTheme(theme) {
  const resolvedTheme = AVAILABLE_THEMES.includes(theme) ? theme : 'dark';

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

let currentTheme = loadTheme();
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTheme() {
  return currentTheme;
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, () => 'dark');
}

export function setTheme(theme) {
  if (!AVAILABLE_THEMES.includes(theme)) return false;

  if (currentTheme !== theme) {
    currentTheme = theme;
    applyTheme(theme);

    listeners.forEach((listener) => listener());
  }

  return saveTheme(theme);
}

if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    currentTheme = loadTheme();
    applyTheme(currentTheme);
    listeners.forEach((listener) => listener());
  });

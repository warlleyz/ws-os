
import { useSyncExternalStore } from 'react';

/* === CONFIGURAÇÃO DOS TEMAS === */
const THEME_STORAGE_KEY = 'ws-os:theme';

export const AVAILABLE_THEMES = ['dark', 'light'];

/* === PERSISTÊNCIA DOS TEMAS === */
/* ----- CARREGAMENTO ----- */
export function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return AVAILABLE_THEMES.includes(saved) ? saved : 'dark';
  } catch {
    return 'dark';
  }
}

/* ----- SALVAMENTO ----- */
export function saveTheme(theme) {
  if (!AVAILABLE_THEMES.includes(theme)) return false;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

/* === APLICAÇÃO VISUAL === */
export function applyTheme(theme) {
  const resolvedTheme = AVAILABLE_THEMES.includes(theme) ? theme : 'dark';

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

/* === ESTADO COMPARTILHADO === */
let currentTheme = loadTheme();
const listeners = new Set();

/* ----- ASSINATURA DE ALTERAÇÕES ----- */
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ----- CONSULTA DO TEMA ----- */
export function getTheme() {
  return currentTheme;
}

/* ----- HOOK DO TEMA ----- */
export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, () => 'dark');
}

/* === ALTERAÇÃO DO TEMA === */
export function setTheme(theme) {
  if (!AVAILABLE_THEMES.includes(theme)) return false;

  if (currentTheme !== theme) {
    currentTheme = theme;
    applyTheme(theme);

    listeners.forEach((listener) => listener());
  }

  return saveTheme(theme);
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;

    currentTheme = loadTheme();
    applyTheme(currentTheme);
    listeners.forEach((listener) => listener());
  });
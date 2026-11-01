import { useSyncExternalStore } from 'react';

/* === CONFIGURAÇÃO MOBILE === */
const STORAGE_KEY = 'ws-os:mobile-preferences';
const DEFAULT_DOCK = ['about-me', 'projects', 'resume', 'contact'];
export const DEFAULT_MOBILE_PREFERENCES = Object.freeze({
  gridDensity: 'default',
  dockAppIds: DEFAULT_DOCK,
  homeAppIds: [],
});

/* === VALIDAÇÃO === */
function normalizeIds(value, max = 100) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => typeof id === 'string' && id.trim()))].slice(0, max);
}
function normalize(value) {
  return {
    gridDensity: ['default', 'comfortable'].includes(value?.gridDensity) ? value.gridDensity : 'default',
    dockAppIds: Array.isArray(value?.dockAppIds) ? normalizeIds(value.dockAppIds, 4) : [...DEFAULT_DOCK],
    homeAppIds: normalizeIds(value?.homeAppIds),
  };
}
function load() {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return normalize(DEFAULT_MOBILE_PREFERENCES);
  }
}

/* === ESTADO E PERSISTÊNCIA === */
let current = load();
const listeners = new Set();
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getMobilePreferences() { return current; }
export function useMobilePreferences() {
  return useSyncExternalStore(subscribe, getMobilePreferences, () => DEFAULT_MOBILE_PREFERENCES);
}
export function setMobilePreferences(values) {
  current = normalize({ ...current, ...values });
  listeners.forEach((listener) => listener());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch {
    return false;
  }
}
export function resetMobilePreferences() {
  return setMobilePreferences(DEFAULT_MOBILE_PREFERENCES);
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    current = load();
    listeners.forEach((listener) => listener());
  });
}
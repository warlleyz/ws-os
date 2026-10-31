
import { useSyncExternalStore } from 'react';

/* === CONFIGURAÇÃO MOBILE === */
const STORAGE_KEY = 'ws-os:mobile-preferences';

export const DEFAULT_MOBILE_PREFERENCES = Object.freeze({
  gridDensity: 'default',
});

const GRID_DENSITIES = ['default', 'comfortable'];

/* === VALIDAÇÃO DE PREFERÊNCIAS === */
function normalize(value) {
  return {
    gridDensity: GRID_DENSITIES.includes(value?.gridDensity)
      ? value.gridDensity
      : DEFAULT_MOBILE_PREFERENCES.gridDensity,
  };
}

/* === PERSISTÊNCIA DE PREFERÊNCIAS === */
/* ----- CARREGAMENTO ----- */
function load() {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return { ...DEFAULT_MOBILE_PREFERENCES };
  }
}

/* === ESTADO COMPARTILHADO === */
let current = load();
const listeners = new Set();

/* ----- ASSINATURA DE ALTERAÇÕES ----- */
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ----- CONSULTA DE PREFERÊNCIAS ----- */
export function getMobilePreferences() {
  return current;
}

/* ----- HOOK DE PREFERÊNCIAS ----- */
export function useMobilePreferences() {
  return useSyncExternalStore(subscribe, getMobilePreferences, () => DEFAULT_MOBILE_PREFERENCES);
}

/* === GERENCIAMENTO DE PREFERÊNCIAS === */
/* ----- ATUALIZAÇÃO E PERSISTÊNCIA ----- */
export function setMobilePreferences(values) {
  const next = normalize({ ...current, ...values });

  current = next;
  listeners.forEach((listener) => listener());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/* ----- RESTAURAÇÃO DOS PADRÕES ----- */
export function resetMobilePreferences() {
  return setMobilePreferences(DEFAULT_MOBILE_PREFERENCES);
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;

    current = load();
    listeners.forEach((listener) => listener());
  });
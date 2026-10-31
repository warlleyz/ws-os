import { useSyncExternalStore } from 'react';

/* === CONFIGURAÇÃO DE ACESSIBILIDADE === */
const STORAGE_KEY = 'ws-os:accessibility';

const DEFAULT_ACCESSIBILITY = Object.freeze({
  motion: false,
  transparency: false,
  lowEffects: false,
});

/* === VALIDAÇÃO DE PREFERÊNCIAS === */
/* ----- NORMALIZAÇÃO ----- */
function normalizeAccessibility(preferences) {
  return {
    motion: preferences?.motion === true,
    transparency: preferences?.transparency === true,
    lowEffects: preferences?.lowEffects === true,
  };
}

/* ----- COMPARAÇÃO DE PREFERÊNCIAS ----- */
function isSameAccessibility(first, second) {
  return (
    first.motion === second.motion &&
    first.transparency === second.transparency &&
    first.lowEffects === second.lowEffects
  );
}

/* === PERSISTÊNCIA DE PREFERÊNCIAS === */
/* ----- CARREGAMENTO ----- */
export function loadAccessibility() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return normalizeAccessibility(saved);
  } catch {
    return { ...DEFAULT_ACCESSIBILITY };
  }
}

/* ----- SALVAMENTO ----- */
export function saveAccessibility(preferences) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeAccessibility(preferences)),
    );
    return true;
  } catch {
    return false;
  }
}

/* === APLICAÇÃO VISUAL === */
export function applyAccessibility(preferences) {
  if (typeof document === 'undefined') return;

  const normalized = normalizeAccessibility(preferences);
  const root = document.documentElement;

  root.dataset.reducedMotion = String(normalized.motion);
  root.dataset.reducedTransparency = String(normalized.transparency);
  root.dataset.lowEffects = String(normalized.lowEffects);
}

/* === ESTADO COMPARTILHADO === */
let current = loadAccessibility();
const listeners = new Set();

/* ----- ASSINATURA DE ALTERAÇÕES ----- */
function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ----- NOTIFICAÇÃO DE ALTERAÇÕES ----- */
function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/* === CONSULTA DE PREFERÊNCIAS === */
/* ----- ESTADO ATUAL ----- */
export function getAccessibility() {
  return current;
}

/* ----- HOOK DE ACESSIBILIDADE ----- */
export function useAccessibility() {
  return useSyncExternalStore(
    subscribe,
    getAccessibility,
    getAccessibility,
  );
}

/* === ATUALIZAÇÃO DE PREFERÊNCIAS === */
export function setAccessibility(preferences) {
  const next = normalizeAccessibility(preferences);
  const changed = !isSameAccessibility(current, next);

  if (changed) {
    current = next;
    applyAccessibility(current);
    emit();
  }

  return saveAccessibility(next);
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
/* ----- RESTAURAÇÃO DE PREFERÊNCIAS ----- */
function restoreAccessibility() {
  const next = loadAccessibility();

  if (isSameAccessibility(current, next)) {
    return;
  }

  current = next;
  applyAccessibility(current);
  emit();
}

/* ----- MONITORAMENTO DE ALTERAÇÕES ----- */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) {
      return;
    }

    restoreAccessibility();
  });
}
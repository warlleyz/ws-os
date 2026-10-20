import { useSyncExternalStore } from 'react';

/* === Configuração === */
/* ----- Persistência das preferências ----- */
const STORAGE_KEY = 'ws-os:accessibility';

const DEFAULT_ACCESSIBILITY = Object.freeze({
  motion: false,
  transparency: false,
  lowEffects: false,
});

/* === Normalização === */
/* ----- Garantir valores booleanos ----- */
function normalizeAccessibility(preferences) {
  return {
    motion: preferences?.motion === true,
    transparency: preferences?.transparency === true,
    lowEffects: preferences?.lowEffects === true,
  };
}

/* ----- Comparar preferências ----- */
function isSameAccessibility(first, second) {
  return (
    first.motion === second.motion &&
    first.transparency === second.transparency &&
    first.lowEffects === second.lowEffects
  );
}

/* === Armazenamento === */
/* ----- Carregar preferências ----- */
export function loadAccessibility() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}',
    );

    return normalizeAccessibility(saved);
  } catch {
    return { ...DEFAULT_ACCESSIBILITY };
  }
}

/* ----- Salvar preferências ----- */
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

/* === Aplicação visual === */
/* ----- Atualizar atributos globais ----- */
export function applyAccessibility(preferences) {
  if (typeof document === 'undefined') return;

  const normalized = normalizeAccessibility(preferences);
  const root = document.documentElement;

  root.dataset.reducedMotion = String(normalized.motion);
  root.dataset.reducedTransparency = String(normalized.transparency);
  root.dataset.lowEffects = String(normalized.lowEffects);
}

/* === Estado compartilhado === */
/* ----- Preferências atuais ----- */
let current = loadAccessibility();

const listeners = new Set();

/* ----- Inscrição de consumidores ----- */
function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/* ----- Notificação de alterações ----- */
function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/* === Consultas === */
/* ----- Obter preferências ----- */
export function getAccessibility() {
  return current;
}

/* ----- Hook React ----- */
export function useAccessibility() {
  return useSyncExternalStore(
    subscribe,
    getAccessibility,
    getAccessibility,
  );
}

/* === Atualização das preferências === */
/* ----- Alterar configuração ----- */
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

/* === Sincronização entre abas === */
/* ----- Recuperar alterações externas ----- */
function restoreAccessibility() {
  const next = loadAccessibility();

  if (isSameAccessibility(current, next)) {
    return;
  }

  current = next;

  applyAccessibility(current);
  emit();
}

/* ----- Escutar alterações do navegador ----- */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (
      event.key !== STORAGE_KEY &&
      event.key !== null
    ) {
      return;
    }

    restoreAccessibility();
  });
}
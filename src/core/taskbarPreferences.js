import { useSyncExternalStore } from 'react';

/* === CONFIGURAÇÃO DA TASKBAR === */
const STORAGE_KEY = 'ws-os:taskbar-auto-hide';

/* === CARREGAMENTO DE PREFERÊNCIAS === */
function loadAutoHide() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

let currentAutoHide = loadAutoHide();
const listeners = new Set();

/* === ESTADO COMPARTILHADO === */
/* ----- ASSINATURA DE ALTERAÇÕES ----- */
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTaskbarAutoHide() {
  return currentAutoHide;
}

export function useTaskbarAutoHide() {
  return useSyncExternalStore(subscribe, getTaskbarAutoHide, () => false);
}

/* === ATUALIZAÇÃO DE PREFERÊNCIAS === */
export function setTaskbarAutoHide(enabled) {
  if (typeof enabled !== 'boolean') return false;

  if (currentAutoHide !== enabled) {
    currentAutoHide = enabled;
    listeners.forEach((listener) => listener());
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    return true;
  } catch {
    return false;
  }
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    currentAutoHide = loadAutoHide();
    listeners.forEach((listener) => listener());
  });
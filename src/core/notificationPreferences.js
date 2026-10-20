import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ws-os:notification-preferences';

const DEFAULT_PREFERENCES = Object.freeze({
  doNotDisturb: false,
});

function readPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

    return {
      doNotDisturb: stored?.doNotDisturb === true,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

let currentPreferences = readPreferences();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getNotificationPreferences() {
  return currentPreferences;
}

export function subscribeNotificationPreferences(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotificationPreferences() {
  return useSyncExternalStore(
    subscribeNotificationPreferences,
    getNotificationPreferences,
    () => DEFAULT_PREFERENCES,
  );
}

export function setDoNotDisturb(enabled) {
  if (typeof enabled !== 'boolean') return false;

  currentPreferences = {
    ...currentPreferences,
    doNotDisturb: enabled,
  };

  emit();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPreferences));
    return true;
  } catch {
    return false;
  }
}

/* === Sincronização entre abas: somente a preferência, nunca as notificações === */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    let stored;
    try {
      stored = event.key === null ? null : JSON.parse(event.newValue ?? 'null');
    } catch {
      return;
    }
    currentPreferences = { doNotDisturb: stored?.doNotDisturb === true };
    emit();
  });
}

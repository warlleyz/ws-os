import { useSyncExternalStore } from 'react';
const KEY = 'ws-os:accessibility';
export function loadAccessibility() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      motion: saved?.motion === true,
      transparency: saved?.transparency === true,
      lowEffects: saved?.lowEffects === true,
    };
  } catch {
    return { motion: false, transparency: false, lowEffects: false };
  }
}
export function applyAccessibility(preferences) {
  const root = document.documentElement;
  root.dataset.reducedMotion = String(preferences.motion);
  root.dataset.reducedTransparency = String(preferences.transparency);
  root.dataset.lowEffects = String(preferences.lowEffects);
}
export function saveAccessibility(preferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

let current = loadAccessibility();
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export function getAccessibility() {
  return current;
}
export function useAccessibility() {
  return useSyncExternalStore(subscribe, getAccessibility, getAccessibility);
}
export function setAccessibility(preferences) {
  current = {
    motion: preferences.motion === true,
    transparency: preferences.transparency === true,
    lowEffects: preferences.lowEffects === true,
  };
  applyAccessibility(current);
  const saved = saveAccessibility(current);
  listeners.forEach((listener) => listener());
  return saved;
}

if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return;
    current = loadAccessibility();
    applyAccessibility(current);
    listeners.forEach((listener) => listener());
  });

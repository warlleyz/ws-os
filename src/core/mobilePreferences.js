import { useSyncExternalStore } from 'react';
import { getRegisteredWidgets } from './widgetManager';

/* === CONFIGURAÇÃO MOBILE === */
const STORAGE_KEY = 'ws-os:mobile-preferences';
const GRID_DENSITIES = ['default', 'comfortable'];

export const DEFAULT_MOBILE_PREFERENCES = Object.freeze({
  gridDensity: 'default',
  widgetIds: [],
});

/* === VALIDAÇÃO DE PREFERÊNCIAS === */
/* ----- Widgets disponíveis ----- */
function normalizeWidgetIds(value) {
  if (!Array.isArray(value)) return [];

  const available = new Set(
    getRegisteredWidgets().map((widget) => widget.id),
  );

  return [...new Set(
    value.filter(
      (id) => typeof id === 'string' && available.has(id),
    ),
  )];
}

/* ----- Normalização ----- */
function normalize(value) {
  return {
    gridDensity: GRID_DENSITIES.includes(value?.gridDensity)
      ? value.gridDensity
      : DEFAULT_MOBILE_PREFERENCES.gridDensity,
    widgetIds: normalizeWidgetIds(value?.widgetIds),
  };
}

/* === PERSISTÊNCIA DE PREFERÊNCIAS === */
/* ----- Carregamento ----- */
function load() {
  try {
    return normalize(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'),
    );
  } catch {
    return normalize(DEFAULT_MOBILE_PREFERENCES);
  }
}

/* === ESTADO COMPARTILHADO === */
let current = load();
const listeners = new Set();

/* ----- Assinatura de alterações ----- */
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ----- Consulta de preferências ----- */
export function getMobilePreferences() {
  return current;
}

/* ----- Hook de preferências ----- */
export function useMobilePreferences() {
  return useSyncExternalStore(
    subscribe,
    getMobilePreferences,
    () => DEFAULT_MOBILE_PREFERENCES,
  );
}

/* === GERENCIAMENTO DE PREFERÊNCIAS === */
/* ----- Atualização e persistência ----- */
export function setMobilePreferences(values) {
  const next = normalize({
    ...current,
    ...values,
  });

  current = next;
  listeners.forEach((listener) => listener());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/* ----- Seleção de widgets ----- */
export function setMobileWidgetVisibility(widgetId, visible) {
  const available = getRegisteredWidgets().some(
    (widget) => widget.id === widgetId,
  );

  if (!available || typeof visible !== 'boolean') {
    return false;
  }

  const selected = new Set(current.widgetIds);

  if (visible) {
    selected.add(widgetId);
  } else {
    selected.delete(widgetId);
  }

  return setMobilePreferences({
    widgetIds: [...selected],
  });
}

/* ----- Restauração dos padrões ----- */
export function resetMobilePreferences() {
  return setMobilePreferences(DEFAULT_MOBILE_PREFERENCES);
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;

    current = load();
    listeners.forEach((listener) => listener());
  });
}
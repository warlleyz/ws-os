import { useSyncExternalStore } from 'react';
import {
  getWidgetDefinition,
  initialWidgetState,
  loadWidgetPreferences,
  saveWidgetState,
} from './widgetManager';

const initial = loadWidgetPreferences();
let current = initial.state;
let validator = null;
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getWidgetPreferences = () => current;
export const getWidgetPreferenceError = () => initial.error;
export function useWidgetPreferences() {
  return useSyncExternalStore(subscribe, getWidgetPreferences, getWidgetPreferences);
}
export function registerWidgetValidator(callback) {
  validator = callback;
  return () => {
    if (validator === callback) validator = null;
  };
}
export function saveWidgetPreferences(next) {
  current = typeof next === 'function' ? next(current) : next;
  const saved = saveWidgetState(current);
  listeners.forEach((listener) => listener());
  return saved;
}

export function configureWidget(instanceId, patch) {
  if (
    !patch ||
    typeof patch !== 'object' ||
    Array.isArray(patch)
  ) {
    return { ok: false, reason: 'invalid' };
  }

  const widget = current.widgets.find(
    (item) => item.instanceId === instanceId,
  );

  if (!widget) {
    return { ok: false, reason: 'not-found' };
  }

  const definition = getWidgetDefinition(widget.widgetId);

  if (!definition) {
    return { ok: false, reason: 'not-found' };
  }

  const keys = Object.keys(patch);

  if (
    keys.length === 0 ||
    keys.some((key) => !['visible', 'size'].includes(key))
  ) {
    return { ok: false, reason: 'invalid' };
  }

  if (
    Object.hasOwn(patch, 'visible') &&
    typeof patch.visible !== 'boolean'
  ) {
    return { ok: false, reason: 'invalid' };
  }

  if (Object.hasOwn(patch, 'size')) {
    const { size } = patch;

    if (
      !Number.isInteger(size?.columns) ||
      !Number.isInteger(size?.rows) ||
      !definition.allowedSizes.includes(
        `${size.columns}x${size.rows}`,
      )
    ) {
      return { ok: false, reason: 'invalid' };
    }
  }

  // Até a W2, somente o relógio está conectado
  // ao motor de layout e ao validador de capacidade.
  if (widget.widgetId !== 'clock') {
    return { ok: false, reason: 'not-ready' };
  }

  const candidate = { ...widget, ...patch };

  if (candidate.visible && validator && !validator(candidate)) {
    return { ok: false, reason: 'capacity' };
  }

  return {
    ok: true,
    saved: saveWidgetPreferences({
      ...current,
      widgets: current.widgets.map((item) =>
        item.instanceId === instanceId
          ? candidate
          : item,
      ),
    }),
  };
}

export function resetWidgetPreferences() {
  // Reset visual preferences, retaining the user's arrangement even when the widget cannot fit now.
  return saveWidgetPreferences({
    widgets: initialWidgetState.widgets.map((item) => ({
      ...item,
      position:
        current.widgets.find((entry) => entry.instanceId === item.instanceId)?.position ?? null,
    })),
  });
}

if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== 'ws-os:desktop-widgets' && event.key !== null) return;
    current = loadWidgetPreferences().state;
    listeners.forEach((listener) => listener());
  });

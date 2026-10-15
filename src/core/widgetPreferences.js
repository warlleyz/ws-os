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
  const previous = current;

  const candidate =
    typeof next === 'function'
      ? next(previous)
      : next;

  if (
    !candidate ||
    !Array.isArray(candidate.widgets)
  ) {
    return false;
  }

  const saved = saveWidgetState(candidate);

  // A preferência só é aplicada ao estado compartilhado
  // depois que a gravação é confirmada.
  if (!saved) {
    return false;
  }

  current = candidate;

  listeners.forEach((listener) => listener());

  return true;
}


/**
 * Publica no React um estado de widgets que já foi
 * gravado por uma operação coordenada.
 *
 * Não realiza uma segunda gravação.
 */
export function publishWidgetPreferences(state) {
  if (!state || !Array.isArray(state.widgets)) {
    return false;
  }

  current = state;
  listeners.forEach((listener) => listener());

  return true;
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
    keys.some((key) => !['visible', 'size', 'settings'].includes(key))
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
  if (
    ![
      'clock',
      'calendar',
      'weather',
      'dev-insights',
    ].includes(widget.widgetId)
  ) {
    return { ok: false, reason: 'not-ready' };
  }



  if (Object.hasOwn(patch, 'settings')) {
    const settings = patch.settings;

    if (
      !settings ||
      typeof settings !== 'object' ||
      Array.isArray(settings)
    ) {
      return { ok: false, reason: 'invalid' };
    }

    if (widget.widgetId === 'clock') {
      if (
        Object.keys(settings).some(
          (key) => key !== 'timeZone',
        )
      ) {
        return { ok: false, reason: 'invalid' };
      }

      const zone = settings.timeZone;

      if (typeof zone !== 'string') {
        return { ok: false, reason: 'invalid' };
      }

      if (zone !== '') {
        try {
          new Intl.DateTimeFormat('pt-BR', {
            timeZone: zone,
          });
        } catch {
          return { ok: false, reason: 'invalid' };
        }
      }
    } else if (widget.widgetId === 'weather') {
      const allowedKeys = [
        'temperatureUnit',
        'windUnit',
        'showFeelsLike',
        'showForecast',
      ];

      if (
        Object.keys(settings).some(
          (key) => !allowedKeys.includes(key),
        )
      ) {
        return { ok: false, reason: 'invalid' };
      }

      if (
        settings.temperatureUnit !== undefined &&
        !['celsius', 'fahrenheit'].includes(
          settings.temperatureUnit,
        )
      ) {
        return { ok: false, reason: 'invalid' };
      }

      if (
        settings.windUnit !== undefined &&
        !['kmh', 'mph'].includes(settings.windUnit)
      ) {
        return { ok: false, reason: 'invalid' };
      }

      if (
        settings.showFeelsLike !== undefined &&
        typeof settings.showFeelsLike !== 'boolean'
      ) {
        return { ok: false, reason: 'invalid' };
      }

      if (
        settings.showForecast !== undefined &&
        typeof settings.showForecast !== 'boolean'
      ) {
        return { ok: false, reason: 'invalid' };
      }

    } else if (widget.widgetId === 'dev-insights') {
      const allowedKeys = [
        'showStars',
        'showFollowers',
        'showWakatime',
        'showLanguages',
      ];

      // Impede configurações desconhecidas.
      if (
        Object.keys(settings).some(
          (key) => !allowedKeys.includes(key),
        )
      ) {
        return { ok: false, reason: 'invalid' };
      }

      // Todas as opções do Dev Insights são booleanas.
      if (
        Object.values(settings).some(
          (value) => typeof value !== 'boolean',
        )
      ) {
        return { ok: false, reason: 'invalid' };
      }
    } else {
      return { ok: false, reason: 'invalid' };
    }
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

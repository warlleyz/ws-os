import { useSyncExternalStore } from 'react';
import {
  getWidgetDefinition,
  initialWidgetState,
  loadWidgetPreferences,
  saveWidgetState,
} from './widgetManager';

/* === ESTADO COMPARTILHADO DOS WIDGETS === */
const initial = loadWidgetPreferences();
let current = initial.state;
let validator = null;
const listeners = new Set();

/* ----- ASSINATURA DE ALTERAÇÕES ----- */
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/* ----- CONSULTA DE PREFERÊNCIAS ----- */
export const getWidgetPreferences = () => current;
export const getWidgetPreferenceError = () => initial.error;

/* ----- HOOK DE PREFERÊNCIAS ----- */
export function useWidgetPreferences() {
  return useSyncExternalStore(subscribe, getWidgetPreferences, getWidgetPreferences);
}

/* === VALIDAÇÃO DE CAPACIDADE === */
/* ----- REGISTRO DO VALIDADOR ----- */
export function registerWidgetValidator(callback) {
  validator = callback;

  return () => {
    if (validator === callback) validator = null;
  };
}

/* === PERSISTÊNCIA DOS WIDGETS === */
/* ----- SALVAMENTO ----- */
export function saveWidgetPreferences(next) {
  const previous = current;
  const candidate = typeof next === 'function' ? next(previous) : next;

  if (!candidate || !Array.isArray(candidate.widgets)) {
    return false;
  }

  const saved = saveWidgetState(candidate);

  if (!saved) {
    return false;
  }

  current = candidate;
  listeners.forEach((listener) => listener());

  return true;
}

/* ----- PUBLICAÇÃO DO ESTADO ----- */
export function publishWidgetPreferences(state) {
  if (!state || !Array.isArray(state.widgets)) {
    return false;
  }

  current = state;
  listeners.forEach((listener) => listener());

  return true;
}

/* === CONFIGURAÇÃO DOS WIDGETS === */
/* ----- VALIDAÇÃO DA ALTERAÇÃO ----- */
export function configureWidget(instanceId, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return { ok: false, reason: 'invalid' };
  }

  const widget = current.widgets.find((item) => item.instanceId === instanceId);

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

  /* ----- VALIDAÇÃO DA VISIBILIDADE ----- */
  if (Object.hasOwn(patch, 'visible') && typeof patch.visible !== 'boolean') {
    return { ok: false, reason: 'invalid' };
  }

  /* ----- VALIDAÇÃO DO TAMANHO ----- */
  if (Object.hasOwn(patch, 'size')) {
    const { size } = patch;

    if (
      !Number.isInteger(size?.columns) ||
      !Number.isInteger(size?.rows) ||
      !definition.allowedSizes.includes(`${size.columns}x${size.rows}`)
    ) {
      return { ok: false, reason: 'invalid' };
    }
  }

  /* ----- WIDGETS CONFIGURÁVEIS ----- */
  if (!['clock', 'calendar', 'weather', 'dev-insights'].includes(widget.widgetId)) {
    return { ok: false, reason: 'not-ready' };
  }

  /* ----- VALIDAÇÃO DAS CONFIGURAÇÕES ----- */
  if (Object.hasOwn(patch, 'settings')) {
    const settings = patch.settings;

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return { ok: false, reason: 'invalid' };
    }

    /* ----- CONFIGURAÇÕES DO RELÓGIO ----- */
    if (widget.widgetId === 'clock') {
      if (Object.keys(settings).some((key) => key !== 'timeZone')) {
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
    }

    /* ----- CONFIGURAÇÕES DO CLIMA ----- */
    else if (widget.widgetId === 'weather') {
      const allowedKeys = [
        'temperatureUnit',
        'windUnit',
        'showFeelsLike',
        'showForecast',
      ];

      if (Object.keys(settings).some((key) => !allowedKeys.includes(key))) {
        return { ok: false, reason: 'invalid' };
      }

      if (
        settings.temperatureUnit !== undefined &&
        !['celsius', 'fahrenheit'].includes(settings.temperatureUnit)
      ) {
        return { ok: false, reason: 'invalid' };
      }

      if (settings.windUnit !== undefined && !['kmh', 'mph'].includes(settings.windUnit)) {
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
    }

    /* ----- CONFIGURAÇÕES DO DEV INSIGHTS ----- */
    else if (widget.widgetId === 'dev-insights') {
      const allowedKeys = [
        'showStars',
        'showFollowers',
        'showWakatime',
        'showLanguages',
      ];

      if (Object.keys(settings).some((key) => !allowedKeys.includes(key))) {
        return { ok: false, reason: 'invalid' };
      }

      if (Object.values(settings).some((value) => typeof value !== 'boolean')) {
        return { ok: false, reason: 'invalid' };
      }
    } else {
      return { ok: false, reason: 'invalid' };
    }
  }

  /* ----- VERIFICAÇÃO DE CAPACIDADE ----- */
  const candidate = { ...widget, ...patch };

  if (candidate.visible && validator && !validator(candidate)) {
    return { ok: false, reason: 'capacity' };
  }

  /* ----- PERSISTÊNCIA DA CONFIGURAÇÃO ----- */
  return {
    ok: true,
    saved: saveWidgetPreferences({
      ...current,
      widgets: current.widgets.map((item) =>
        item.instanceId === instanceId ? candidate : item,
      ),
    }),
  };
}

/* === RESTAURAÇÃO DOS WIDGETS === */
export function resetWidgetPreferences() {
  return saveWidgetPreferences({
    widgets: initialWidgetState.widgets.map((item) => ({
      ...item,
      position:
        current.widgets.find((entry) => entry.instanceId === item.instanceId)?.position ?? null,
    })),
  });
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== 'ws-os:desktop-widgets' && event.key !== null) return;

    current = loadWidgetPreferences().state;
    listeners.forEach((listener) => listener());
  });
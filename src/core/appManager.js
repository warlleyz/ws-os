import { getAppDefinition } from './appRegistry';

export const initialAppState = {
  instances: [],
  activeInstanceId: null,
  focusHistory: [],
};

export function getPreferredInstance(state, appId) {
  const instances = state.instances.filter((instance) => instance.appId === appId);

  if (instances.length === 0) return null;

  const active = instances.find((instance) => instance.id === state.activeInstanceId);

  if (active) return active;

  for (let index = state.focusHistory.length - 1; index >= 0; index -= 1) {
    const instance = instances.find((item) => item.id === state.focusHistory[index]);

    if (instance) return instance;
  }

  return instances.find((instance) => !instance.minimized) ?? instances.at(-1);
}

function getLastAvailableFocus(instances, history) {
  return (
    [...history]
      .reverse()
      .find((id) => instances.some((instance) => instance.id === id && !instance.minimized)) ?? null
  );
}

export function activateApp(state, instanceId) {
  const instance = state.instances.find((item) => item.id === instanceId);

  if (!instance || instance.minimized) return state;

  return {
    ...state,
    activeInstanceId: instanceId,
    focusHistory: [...state.focusHistory.filter((id) => id !== instanceId), instanceId],
  };
}

function isPlainRecord(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

export function validateAppOpen(appId, options = {}) {
  const app = getAppDefinition(appId);
  if (!app) {
    return { ok: false, error: { code: 'APP_NOT_FOUND', message: 'Aplicativo não encontrado.' } };
  }
  if (!app.public) {
    return {
      ok: false,
      error: {
        code: 'APP_ACCESS_DENIED',
        message: 'Este aplicativo não permite abertura pública.',
      },
    };
  }
  if (
    !isPlainRecord(options) ||
    (options.origin !== undefined &&
      (typeof options.origin !== 'string' || !options.origin.trim())) ||
    (options.params !== undefined && !isPlainRecord(options.params))
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OPEN_OPTIONS',
        message: 'Origem ou parâmetros de abertura inválidos.',
      },
    };
  }
  return { ok: true, app, origin: options.origin ?? 'system', params: { ...options.params } };
}

// Contrato com resultado explícito; openApp continua compatível com os reducers existentes.
export function requestAppOpen(state, appId, options = {}) {
  const request = validateAppOpen(appId, options);
  if (!request.ok) return { state, result: { ok: false, error: request.error } };
  const { app, origin, params } = request;

  if (!app.allowMultipleInstances) {
    const existing = state.instances.find(
      (instance) => instance.appId === appId,
    );

    if (existing) {
      const hasSettingsNavigation =
        appId === 'settings' &&
        typeof params.section === 'string';

      const nextState = hasSettingsNavigation
        ? {
          ...state,
          instances: state.instances.map((instance) =>
            instance.id === existing.id
              ? {
                ...instance,
                params: {
                  ...instance.params,
                  section: params.section,
                },
                navigationRequestId:
                  (instance.navigationRequestId ?? 0) + 1,
              }
              : instance,
          ),
        }
        : state;

      return {
        state: restoreApp(nextState, existing.id),
        result: {
          ok: true,
          instanceId: existing.id,
          status: 'restored',
        },
      };
    }
  }
  const instance = {
    id: crypto.randomUUID(),
    appId,
    minimized: false,
    executionState: 'running',
    origin,
    params,
  };
  return {
    state: activateApp({ ...state, instances: [...state.instances, instance] }, instance.id),
    result: { ok: true, instanceId: instance.id, status: 'opened' },
  };
}

export function openApp(state, appId, options = {}) {
  return requestAppOpen(state, appId, options).state;
}

export function minimizeApp(state, instanceId) {
  const instance = state.instances.find((item) => item.id === instanceId);

  if (!instance || instance.minimized) return state;

  const app = getAppDefinition(instance.appId);

  const instances = state.instances.map((item) =>
    item.id === instanceId
      ? {
          ...item,
          minimized: true,
          executionState: app?.pauseWhenMinimized ? 'paused' : 'running',
        }
      : item,
  );

  const activeInstanceId =
    state.activeInstanceId === instanceId
      ? getLastAvailableFocus(instances, state.focusHistory)
      : state.activeInstanceId;

  const focusHistory =
    activeInstanceId && state.activeInstanceId === instanceId
      ? [...state.focusHistory.filter((id) => id !== activeInstanceId), activeInstanceId]
      : state.focusHistory;

  return {
    ...state,
    instances,
    focusHistory,
    activeInstanceId,
  };
}

export function restoreApp(state, instanceId) {
  if (!state.instances.some((item) => item.id === instanceId)) {
    return state;
  }

  const instances = state.instances.map((item) =>
    item.id === instanceId
      ? {
          ...item,
          minimized: false,
          executionState: 'running',
        }
      : item,
  );

  return activateApp({ ...state, instances }, instanceId);
}

export function closeApp(state, instanceId) {
  if (!state.instances.some((item) => item.id === instanceId)) {
    return state;
  }

  const instances = state.instances.filter((item) => item.id !== instanceId);

  const focusHistory = state.focusHistory.filter((id) => id !== instanceId);

  return {
    ...state,
    instances,
    focusHistory,
    activeInstanceId:
      state.activeInstanceId === instanceId
        ? getLastAvailableFocus(instances, focusHistory)
        : state.activeInstanceId,
  };
}

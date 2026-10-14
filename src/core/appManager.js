import { getAppDefinition } from './appRegistry';

export const initialAppState = {
  instances: [],
  activeInstanceId: null,
  focusHistory: [],
};

export function getPreferredInstance(state, appId) {
  const instances = state.instances.filter(
    (instance) => instance.appId === appId,
  );

  if (instances.length === 0) return null;

  const active = instances.find(
    (instance) => instance.id === state.activeInstanceId,
  );

  if (active) return active;

  for (let index = state.focusHistory.length - 1; index >= 0; index -= 1) {
    const instance = instances.find(
      (item) => item.id === state.focusHistory[index],
    );

    if (instance) return instance;
  }

  return (
    instances.find((instance) => !instance.minimized) ??
    instances.at(-1)
  );
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

export function openApp(state, appId, options = {}) {
  const app = getAppDefinition(appId);

  if (!app?.public) return state;

  const params =
    options?.params &&
      typeof options.params === 'object' &&
      !Array.isArray(options.params)
      ? { ...options.params }
      : {};

  const origin =
    typeof options?.origin === 'string'
      ? options.origin
      : 'system';

  if (!app.allowMultipleInstances) {
    const existing = state.instances.find((instance) => instance.appId === appId);

    if (existing) return restoreApp(state, existing.id);
  }

  const instance = {
    id: crypto.randomUUID(),
    appId,
    minimized: false,
    executionState: 'running',
    origin,
    params,
  };

  return activateApp(
    {
      ...state,
      instances: [...state.instances, instance],
    },
    instance.id,
  );
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
      ? [
        ...state.focusHistory.filter((id) => id !== activeInstanceId),
        activeInstanceId,
      ]
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

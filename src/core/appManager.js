
import { getAppDefinition } from './appRegistry';

export const initialAppState = {
    instances: [],
    activeInstanceId: null,
    focusHistory: [],
};

function getLastAvailableFocus(instances, history) {
    return (
        [...history]
            .reverse()
            .find((id) =>
                instances.some(
                    (instance) => instance.id === id && !instance.minimized,
                ),
            ) ?? null
    );
}

export function activateApp(state, instanceId) {
    const instance = state.instances.find(
        (item) => item.id === instanceId,
    );

    if (!instance || instance.minimized) return state;

    return {
        ...state,
        activeInstanceId: instanceId,
        focusHistory: [
            ...state.focusHistory.filter((id) => id !== instanceId),
            instanceId,
        ],
    };
}

export function openApp(state, appId) {
    const app = getAppDefinition(appId);

    if (!app) return state;

    if (!app.allowMultipleInstances) {
        const existing = state.instances.find(
            (instance) => instance.appId === appId,
        );

        if (existing) return restoreApp(state, existing.id);
    }

    const instance = {
        id: crypto.randomUUID(),
        appId,
        minimized: false,
        executionState: 'running',
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
    const instance = state.instances.find(
        (item) => item.id === instanceId,
    );

    if (!instance || instance.minimized) return state;

    const app = getAppDefinition(instance.appId);

    const instances = state.instances.map((item) =>
        item.id === instanceId
            ? {
                ...item,
                minimized: true,
                executionState: app?.pauseWhenMinimized
                    ? 'paused'
                    : 'running',
            }
            : item,
    );

    const focusHistory = state.focusHistory.filter(
        (id) => id !== instanceId,
    );

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

    return activateApp(
        { ...state, instances },
        instanceId,
    );
}

export function closeApp(state, instanceId) {
    if (!state.instances.some((item) => item.id === instanceId)) {
        return state;
    }

    const instances = state.instances.filter(
        (item) => item.id !== instanceId,
    );

    const focusHistory = state.focusHistory.filter(
        (id) => id !== instanceId,
    );

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


import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ws-os:mobile-preferences';

export const DEFAULT_MOBILE_PREFERENCES = Object.freeze({
    gridDensity: 'default',
});

const GRID_DENSITIES = ['default', 'comfortable'];

function normalize(value) {
    return {
        gridDensity: GRID_DENSITIES.includes(value?.gridDensity)
            ? value.gridDensity
            : DEFAULT_MOBILE_PREFERENCES.gridDensity,
    };
}

function load() {
    try {
        return normalize(
            JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'),
        );
    } catch {
        return { ...DEFAULT_MOBILE_PREFERENCES };
    }
}

let current = load();
const listeners = new Set();

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getMobilePreferences() {
    return current;
}

export function useMobilePreferences() {
    return useSyncExternalStore(
        subscribe,
        getMobilePreferences,
        () => DEFAULT_MOBILE_PREFERENCES,
    );
}

export function setMobilePreferences(values) {
    const next = normalize({ ...current, ...values });

    current = next;
    listeners.forEach((listener) => listener());

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
    } catch {
        return false;
    }
}

export function resetMobilePreferences() {
    return setMobilePreferences(DEFAULT_MOBILE_PREFERENCES);
}

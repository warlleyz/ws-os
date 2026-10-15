
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ws-os:taskbar-auto-hide';

function loadAutoHide() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

let currentAutoHide = loadAutoHide();
const listeners = new Set();

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getTaskbarAutoHide() {
    return currentAutoHide;
}

export function useTaskbarAutoHide() {
    return useSyncExternalStore(
        subscribe,
        getTaskbarAutoHide,
        () => false,
    );
}

export function setTaskbarAutoHide(enabled) {
    if (typeof enabled !== 'boolean') return false;

    if (currentAutoHide !== enabled) {
        currentAutoHide = enabled;
        listeners.forEach((listener) => listener());
    }

    try {
        localStorage.setItem(STORAGE_KEY, String(enabled));
        return true;
    } catch {
        return false;
    }
}

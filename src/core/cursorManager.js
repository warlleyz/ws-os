import { useSyncExternalStore } from 'react';

import {
    CURSOR_MODES,
    DEFAULT_CURSOR_MODE,
    normalizeCursorMode,
} from './cursorCatalog';

/* === CONFIGURAÇÃO DO CURSOR === */
export const CURSOR_STORAGE_KEY = 'ws-os:cursor-mode';

/* === PERSISTÊNCIA DO CURSOR === */
/* ----- CARREGAMENTO ----- */
function loadCursorMode() {
    try {
        return normalizeCursorMode(localStorage.getItem(CURSOR_STORAGE_KEY));
    } catch {
        return DEFAULT_CURSOR_MODE;
    }
}

/* ----- SALVAMENTO ----- */
function saveCursorMode(mode) {
    try {
        localStorage.setItem(CURSOR_STORAGE_KEY, mode);
        return true;
    } catch {
        return false;
    }
}

/* === ESTADO COMPARTILHADO === */
let currentMode = loadCursorMode();
const listeners = new Set();

/* ----- ASSINATURA DE ALTERAÇÕES ----- */
function subscribe(listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

/* ----- NOTIFICAÇÃO DE ALTERAÇÕES ----- */
function emit() {
    for (const listener of listeners) {
        listener();
    }
}

/* === CONSULTAS DO CURSOR === */
/* ----- MODO ATUAL ----- */
export function getCursorMode() {
    return currentMode;
}

/* ----- HOOK DO CURSOR ----- */
export function useCursorMode() {
    return useSyncExternalStore(
        subscribe,
        getCursorMode,
        () => DEFAULT_CURSOR_MODE,
    );
}

/* ----- MODOS DISPONÍVEIS ----- */
export function getAvailableCursorModes() {
    return CURSOR_MODES;
}

/* === ATUALIZAÇÃO DO CURSOR === */
/* ----- ALTERAÇÃO DO MODO ----- */
export function setCursorMode(mode) {
    if (!CURSOR_MODES.includes(mode)) {
        return false;
    }

    if (currentMode !== mode) {
        currentMode = mode;
        emit();
    }

    return saveCursorMode(mode);
}

/* ----- RESTAURAÇÃO DO PADRÃO ----- */
export function resetCursorMode() {
    return setCursorMode(DEFAULT_CURSOR_MODE);
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
/* ----- RESTAURAÇÃO DE ALTERAÇÕES EXTERNAS ----- */
function restoreCursorMode() {
    const restored = loadCursorMode();

    if (restored !== currentMode) {
        currentMode = restored;
        emit();
    }
}

/* ----- MONITORAMENTO DE ALTERAÇÕES ----- */
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key !== CURSOR_STORAGE_KEY && event.key !== null) {
            return;
        }

        restoreCursorMode();
    });
}
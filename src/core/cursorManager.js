
import { useSyncExternalStore } from 'react';

import {
    CURSOR_MODES,
    DEFAULT_CURSOR_MODE,
    normalizeCursorMode,
} from './cursorCatalog';

/* === Configuração === */
/* ----- Chave de persistência ----- */
export const CURSOR_STORAGE_KEY = 'ws-os:cursor-mode';

/* === Persistência === */
/* ----- Recuperar preferência salva ----- */
function loadCursorMode() {
    try {
        return normalizeCursorMode(
            localStorage.getItem(CURSOR_STORAGE_KEY),
        );
    } catch {
        return DEFAULT_CURSOR_MODE;
    }
}

/* ----- Salvar preferência ----- */
function saveCursorMode(mode) {
    try {
        localStorage.setItem(CURSOR_STORAGE_KEY, mode);
        return true;
    } catch {
        return false;
    }
}

/* === Estado compartilhado === */
/* ----- Modo atual ----- */
let currentMode = loadCursorMode();

const listeners = new Set();

/* ----- Assinaturas ----- */
function subscribe(listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

/* ----- Notificar consumidores ----- */
function emit() {
    for (const listener of listeners) {
        listener();
    }
}

/* === Consultas === */
/* ----- Modo selecionado ----- */
export function getCursorMode() {
    return currentMode;
}

/* ----- Hook React ----- */
export function useCursorMode() {
    return useSyncExternalStore(
        subscribe,
        getCursorMode,
        () => DEFAULT_CURSOR_MODE,
    );
}

/* ----- Disponibilidade de modos ----- */
export function getAvailableCursorModes() {
    return CURSOR_MODES;
}

/* === Atualização de preferência === */
/* ----- Selecionar modo ----- */
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

/* ----- Restaurar modo padrão ----- */
export function resetCursorMode() {
    return setCursorMode(DEFAULT_CURSOR_MODE);
}

/* === Sincronização entre abas === */
/* ----- Recarregar preferência externa ----- */
function restoreCursorMode() {
    const restored = loadCursorMode();

    if (restored !== currentMode) {
        currentMode = restored;
        emit();
    }
}

/* ----- Escutar alterações do navegador ----- */
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (
            event.key !== CURSOR_STORAGE_KEY &&
            event.key !== null
        ) {
            return;
        }

        restoreCursorMode();
    });
}

import {
    getDefaultWallpaper,
    isOfficialWallpaper,
} from './wallpaperCatalog';

/* === CONFIGURAÇÃO DAS SELEÇÕES === */
/* ----- PLATAFORMAS E TEMAS ----- */
export const WALLPAPER_SHELLS = Object.freeze([
    'desktop',
    'mobile',
]);

export const WALLPAPER_THEMES = Object.freeze([
    'dark',
    'light',
]);

/* ----- CHAVES DE PERSISTÊNCIA ----- */
export const WALLPAPER_SELECTION_KEYS = Object.freeze({
    desktop: Object.freeze({
        dark: 'ws-os:wallpaper:desktop:dark',
        light: 'ws-os:wallpaper:desktop:light',
    }),
    mobile: Object.freeze({
        dark: 'ws-os:wallpaper:mobile:dark',
        light: 'ws-os:wallpaper:mobile:light',
    }),
});

/* ----- CHAVES LEGADAS ----- */
export const LEGACY_WALLPAPER_KEYS = Object.freeze({
    desktop: 'ws-os:wallpaper',
    mobile: 'ws-os:mobile-wallpaper',
});

/* === WALLPAPERS PESSOAIS === */
/* ----- IDENTIFICADORES ----- */
export const LEGACY_CUSTOM_WALLPAPER_ID = 'custom';
export const PERSONAL_WALLPAPER_PREFIX = 'personal:';

/* ----- VALIDAÇÃO DOS IDENTIFICADORES ----- */
export function isPersonalWallpaperId(id) {
    if (typeof id !== 'string') {
        return false;
    }

    if (!id.startsWith(PERSONAL_WALLPAPER_PREFIX)) {
        return false;
    }

    const personalId = id.slice(PERSONAL_WALLPAPER_PREFIX.length);

    return /^[a-zA-Z0-9_-]{1,64}$/.test(personalId);
}

/* ----- IDENTIFICADOR DE ARMAZENAMENTO ----- */
export function getPersonalWallpaperStorageId(id) {
    if (!isPersonalWallpaperId(id)) {
        return null;
    }

    return id.slice(PERSONAL_WALLPAPER_PREFIX.length);
}

/* ----- IDENTIFICADOR DE SELEÇÃO ----- */
export function createPersonalWallpaperSelectionId(id) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
        return null;
    }

    return `${PERSONAL_WALLPAPER_PREFIX}${id}`;
}

/* === VALIDAÇÃO DE SELEÇÕES === */
/* ----- CONTEXTO DE SELEÇÃO ----- */
export function isWallpaperContext(shell, theme) {
    return WALLPAPER_SHELLS.includes(shell) && WALLPAPER_THEMES.includes(theme);
}

/* ----- NORMALIZAÇÃO DA SELEÇÃO ----- */
export function normalizeWallpaperSelection(id, theme = 'dark') {
    if (isOfficialWallpaper(id, theme)) {
        return id;
    }

    return getDefaultWallpaper(theme);
}

/* ----- IDENTIFICADORES ACEITOS ----- */
export function isWallpaperSelectionId(id, theme) {
    return (
        isOfficialWallpaper(id, theme) ||
        id === LEGACY_CUSTOM_WALLPAPER_ID ||
        isPersonalWallpaperId(id)
    );
}

/* === MIGRAÇÃO DE PREFERÊNCIAS === */
/* ----- RESOLUÇÃO DA SELEÇÃO EXISTENTE ----- */
export function resolveWallpaperSelection({
    savedId,
    legacyId,
    theme = 'dark',
} = {}) {
    if (!WALLPAPER_THEMES.includes(theme)) {
        return {
            ok: false,
            code: 'INVALID_WALLPAPER_THEME',
        };
    }

    if (isWallpaperSelectionId(savedId, theme)) {
        return {
            ok: true,
            id: savedId,
            source: 'saved',
            requiresMigration: savedId === LEGACY_CUSTOM_WALLPAPER_ID,
        };
    }

    if (isWallpaperSelectionId(legacyId, theme)) {
        return {
            ok: true,
            id: legacyId,
            source: 'legacy',
            requiresMigration: true,
        };
    }

    return {
        ok: true,
        id: getDefaultWallpaper(theme),
        source: 'default',
        requiresMigration: true,
    };
}

/* === PREFERÊNCIAS INDEPENDENTES === */
/* ----- ESTADO INICIAL ----- */
export function createDefaultWallpaperSelections() {
    return {
        desktop: {
            dark: getDefaultWallpaper('dark'),
            light: getDefaultWallpaper('light'),
        },
        mobile: {
            dark: getDefaultWallpaper('dark'),
            light: getDefaultWallpaper('light'),
        },
    };
}

/* ----- ATUALIZAÇÃO IMUTÁVEL ----- */
export function updateWallpaperSelection(
    selections,
    { shell, theme, id } = {},
) {
    if (!isWallpaperContext(shell, theme) || !isWallpaperSelectionId(id, theme)) {
        return {
            ok: false,
            code: 'INVALID_WALLPAPER_SELECTION',
        };
    }

    return {
        ok: true,
        selections: {
            ...selections,
            [shell]: {
                ...selections[shell],
                [theme]: id,
            },
        },
    };
}

/* === PROTEÇÃO DE EXCLUSÃO === */
/* ----- VERIFICAÇÃO DE SELEÇÕES EM USO ----- */
export function isWallpaperSelectedAnywhere(selections, id) {
    if (!isPersonalWallpaperId(id)) {
        return false;
    }

    return WALLPAPER_SHELLS.some((shell) =>
        WALLPAPER_THEMES.some(
            (theme) => selections?.[shell]?.[theme] === id,
        ),
    );
}
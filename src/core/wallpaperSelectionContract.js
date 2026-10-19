
import {
    getDefaultWallpaper,
    isOfficialWallpaper,
} from './wallpaperCatalog';

/* === Configuração das seleções === */
/* ----- Plataformas e temas ----- */
export const WALLPAPER_SHELLS = Object.freeze([
    'desktop',
    'mobile',
]);

export const WALLPAPER_THEMES = Object.freeze([
    'dark',
    'light',
]);

/* ----- Chaves de persistência ----- */
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

/* ----- Chaves legadas ----- */
export const LEGACY_WALLPAPER_KEYS = Object.freeze({
    desktop: 'ws-os:wallpaper',
    mobile: 'ws-os:mobile-wallpaper',
});

/* === Wallpapers pessoais === */
/* ----- Identificador legado ----- */
export const LEGACY_CUSTOM_WALLPAPER_ID = 'custom';

/* ----- Prefixo dos wallpapers da coleção ----- */
export const PERSONAL_WALLPAPER_PREFIX = 'personal:';

/* ----- Validação dos identificadores ----- */
export function isPersonalWallpaperId(id) {
    if (typeof id !== 'string') {
        return false;
    }

    if (!id.startsWith(PERSONAL_WALLPAPER_PREFIX)) {
        return false;
    }

    const personalId = id.slice(
        PERSONAL_WALLPAPER_PREFIX.length,
    );

    return /^[a-zA-Z0-9_-]{1,64}$/.test(personalId);
}

/* ----- Extrair identificador de armazenamento ----- */
export function getPersonalWallpaperStorageId(id) {
    if (!isPersonalWallpaperId(id)) {
        return null;
    }

    return id.slice(PERSONAL_WALLPAPER_PREFIX.length);
}

/* ----- Construir identificador de seleção ----- */
export function createPersonalWallpaperSelectionId(id) {
    if (
        typeof id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,64}$/.test(id)
    ) {
        return null;
    }

    return `${PERSONAL_WALLPAPER_PREFIX}${id}`;
}

/* === Validação === */
/* ----- Contexto de seleção ----- */
export function isWallpaperContext(shell, theme) {
    return (
        WALLPAPER_SHELLS.includes(shell) &&
        WALLPAPER_THEMES.includes(theme)
    );
}

/* ----- Identificador oficial ----- */
export function normalizeWallpaperSelection(
    id,
    theme = 'dark',
) {
    if (isOfficialWallpaper(id, theme)) {
        return id;
    }

    return getDefaultWallpaper(theme);
}

/* ----- Identificador aceito pelo contrato ----- */
export function isWallpaperSelectionId(id, theme) {
    return (
        isOfficialWallpaper(id, theme) ||
        id === LEGACY_CUSTOM_WALLPAPER_ID ||
        isPersonalWallpaperId(id)
    );
}

/* === Migração de preferências === */
/* ----- Resolução da seleção existente ----- */
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
            requiresMigration:
                savedId === LEGACY_CUSTOM_WALLPAPER_ID,
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

/* === Preferências independentes === */
/* ----- Estado inicial ----- */
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

/* ----- Atualização imutável ----- */
export function updateWallpaperSelection(
    selections,
    { shell, theme, id } = {},
) {
    if (
        !isWallpaperContext(shell, theme) ||
        !isWallpaperSelectionId(id, theme)
    ) {
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

/* === Proteção de exclusão === */
/* ----- Verificar uso nas quatro seleções ----- */
export function isWallpaperSelectedAnywhere(
    selections,
    id,
) {
    if (!isPersonalWallpaperId(id)) {
        return false;
    }

    return WALLPAPER_SHELLS.some((shell) =>
        WALLPAPER_THEMES.some(
            (theme) => selections?.[shell]?.[theme] === id,
        ),
    );
}

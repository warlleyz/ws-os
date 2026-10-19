
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

/* === Validação === */
/* ----- Contexto de seleção ----- */
export function isWallpaperContext(shell, theme) {
    return (
        WALLPAPER_SHELLS.includes(shell) &&
        Object.hasOwn(WALLPAPER_SELECTION_KEYS[shell], theme)
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

/* === Migração de preferências === */
/* ----- Resolução da seleção existente ----- */
export function resolveWallpaperSelection({
    savedId,
    legacyId,
    theme = 'dark',
} = {}) {
    if (!['dark', 'light'].includes(theme)) {
        return {
            ok: false,
            code: 'INVALID_WALLPAPER_THEME',
        };
    }

    if (isOfficialWallpaper(savedId, theme)) {
        return {
            ok: true,
            id: savedId,
            source: 'saved',
            requiresMigration: false,
        };
    }

    if (savedId === 'custom') {
        return {
            ok: true,
            id: 'custom',
            source: 'saved',
            requiresMigration: true,
        };
    }

    if (legacyId === 'custom') {
        return {
            ok: true,
            id: 'custom',
            source: 'legacy',
            requiresMigration: true,
        };
    }

    if (isOfficialWallpaper(legacyId, theme)) {
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
        !(
            id === 'custom' ||
            isOfficialWallpaper(id, theme)
        )
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

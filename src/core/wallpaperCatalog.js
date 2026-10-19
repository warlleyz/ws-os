
/* === Catálogo oficial de wallpapers === */
/* ----- Temas disponíveis ----- */
export const WALLPAPER_THEMES = Object.freeze([
    'dark',
    'light',
]);

/* ----- Wallpapers oficiais ----- */
export const OFFICIAL_WALLPAPERS = Object.freeze([
    {
        id: 'dark-blue',
        name: 'Dark Blue',
        theme: 'dark',
        file: 'wallpapers/dark-blue.jpg',
    },
    {
        id: 'dark-green',
        name: 'Dark Green',
        theme: 'dark',
        file: 'wallpapers/dark-green.jpg',
    },
    {
        id: 'dark-violeta',
        name: 'Dark Violet',
        theme: 'dark',
        file: 'wallpapers/dark-violeta.jpg',
    },
    {
        id: 'light-blue',
        name: 'Light Blue',
        theme: 'light',
        file: 'wallpapers/light-blue.jpg',
    },
    {
        id: 'light-green',
        name: 'Light Green',
        theme: 'light',
        file: 'wallpapers/light-green.jpg',
    },
    {
        id: 'light-violeta',
        name: 'Light Violet',
        theme: 'light',
        file: 'wallpapers/light-violeta.jpg',
    },
]);

/* === Configuração padrão === */
/* ----- Wallpaper inicial por tema ----- */
export const DEFAULT_WALLPAPERS = Object.freeze({
    dark: 'dark-blue',
    light: 'light-blue',
});

/* === Consultas ao catálogo === */
/* ----- Wallpaper pelo identificador ----- */
export function getOfficialWallpaper(id) {
    return (
        OFFICIAL_WALLPAPERS.find(
            (wallpaper) => wallpaper.id === id,
        ) ?? null
    );
}

/* ----- Wallpapers disponíveis por tema ----- */
export function getOfficialWallpapersByTheme(theme) {
    if (!WALLPAPER_THEMES.includes(theme)) {
        return [];
    }

    return OFFICIAL_WALLPAPERS.filter(
        (wallpaper) => wallpaper.theme === theme,
    );
}

/* ----- Wallpaper padrão ----- */
export function getDefaultWallpaper(theme = 'dark') {
    return DEFAULT_WALLPAPERS[theme] ?? DEFAULT_WALLPAPERS.dark;
}

/* ----- Verificação de compatibilidade ----- */
export function isOfficialWallpaper(id, theme) {
    const wallpaper = getOfficialWallpaper(id);

    return Boolean(
        wallpaper &&
        (theme === undefined || wallpaper.theme === theme),
    );
}

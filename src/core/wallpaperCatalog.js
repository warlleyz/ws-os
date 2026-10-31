/* === CATÁLOGO OFICIAL DE WALLPAPERS === */
/* ----- TEMAS DISPONÍVEIS ----- */
export const WALLPAPER_THEMES = Object.freeze([
    'dark',
    'light',
]);

/* ----- WALLPAPERS OFICIAIS ----- */
export const OFFICIAL_WALLPAPERS = Object.freeze([
    {
        id: 'dark-blue',
        name: 'Dark Blue',
        theme: 'dark',
        file: 'wallpapers/dark-blue.webp',
    },
    {
        id: 'dark-green',
        name: 'Dark Green',
        theme: 'dark',
        file: 'wallpapers/dark-green.webp',
    },
    {
        id: 'dark-violeta',
        name: 'Dark Violet',
        theme: 'dark',
        file: 'wallpapers/dark-violeta.webp',
    },
    {
        id: 'light-blue',
        name: 'Light Blue',
        theme: 'light',
        file: 'wallpapers/light-blue.webp',
    },
    {
        id: 'light-green',
        name: 'Light Green',
        theme: 'light',
        file: 'wallpapers/light-green.webp',
    },
    {
        id: 'light-violeta',
        name: 'Light Violet',
        theme: 'light',
        file: 'wallpapers/light-violeta.webp',
    },
]);

/* === CONFIGURAÇÃO PADRÃO === */
/* ----- WALLPAPER INICIAL POR TEMA ----- */
export const DEFAULT_WALLPAPERS = Object.freeze({
    dark: 'dark-blue',
    light: 'light-blue',
});

/* === CONSULTAS AO CATÁLOGO === */
/* ----- CONSULTA POR IDENTIFICADOR ----- */
export function getOfficialWallpaper(id) {
    return OFFICIAL_WALLPAPERS.find((wallpaper) => wallpaper.id === id) ?? null;
}

/* ----- CONSULTA POR TEMA ----- */
export function getOfficialWallpapersByTheme(theme) {
    if (!WALLPAPER_THEMES.includes(theme)) {
        return [];
    }

    return OFFICIAL_WALLPAPERS.filter((wallpaper) => wallpaper.theme === theme);
}

/* ----- CONSULTA DO PADRÃO ----- */
export function getDefaultWallpaper(theme = 'dark') {
    return DEFAULT_WALLPAPERS[theme] ?? DEFAULT_WALLPAPERS.dark;
}

/* ----- VERIFICAÇÃO DE COMPATIBILIDADE ----- */
export function isOfficialWallpaper(id, theme) {
    const wallpaper = getOfficialWallpaper(id);

    return Boolean(
        wallpaper &&
        (theme === undefined || wallpaper.theme === theme),
    );
}
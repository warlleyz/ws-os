const THEME_STORAGE_KEY = 'ws-os:theme';

export const AVAILABLE_THEMES = ['dark', 'light'];

export function loadTheme() {
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);

        return AVAILABLE_THEMES.includes(saved) ? saved : 'dark';
    } catch {
        return 'dark';
    }
}

export function saveTheme(theme) {
    if (!AVAILABLE_THEMES.includes(theme)) return false;

    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        return true;
    } catch {
        return false;
    }
}

export function applyTheme(theme) {
    const resolvedTheme = AVAILABLE_THEMES.includes(theme)
        ? theme
        : 'dark';

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
}
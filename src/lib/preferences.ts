
export type Theme = 'dark' | 'light'

export type Preferences = {
    theme: Theme
}

type StoredPreferences = {
    version: number
    preferences: Preferences
}

const STORAGE_KEY = 'ws-os-preferences'
const LEGACY_THEME_KEY = 'ws-os-theme'
const STORAGE_VERSION = 1

const DEFAULT_PREFERENCES: Preferences = {
    theme: 'dark',
}

function isTheme(value: unknown): value is Theme {
    return value === 'dark' || value === 'light'
}

function readTheme(value: unknown): Theme | null {
    if (
        typeof value !== 'object' ||
        value === null ||
        !('theme' in value)
    ) {
        return null
    }

    return isTheme(value.theme) ? value.theme : null
}

export function loadPreferences(): Preferences {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)

        if (stored) {
            const parsed: unknown = JSON.parse(stored)

            if (typeof parsed === 'object' && parsed !== null) {
                if (
                    'version' in parsed &&
                    parsed.version === STORAGE_VERSION &&
                    'preferences' in parsed
                ) {
                    const theme = readTheme(parsed.preferences)

                    if (theme) {
                        return { theme }
                    }
                }

                // Compatibilidade com o formato anterior sem versão.
                const previousTheme = readTheme(parsed)

                if (previousTheme) {
                    return { theme: previousTheme }
                }
            }
        }

        // Compatibilidade com o armazenamento inicial do M01.
        const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY)

        if (isTheme(legacyTheme)) {
            return { theme: legacyTheme }
        }
    } catch {
        // O sistema permanece funcional sem armazenamento válido.
    }

    return { ...DEFAULT_PREFERENCES }
}

export function savePreferences(preferences: Preferences): void {
    const stored: StoredPreferences = {
        version: STORAGE_VERSION,
        preferences,
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
        // Falhas de armazenamento não impedem o uso da interface.
    }
}


/* === Catálogo de cursores da WS OS === */
/* ----- Temas e configuração ----- */
export const CURSOR_THEMES = Object.freeze([
    'dark',
    'light',
]);

export const DEFAULT_CURSOR_MODE = 'custom';

export const CURSOR_MODES = Object.freeze([
    'custom',
    'native',
]);

const CURSOR_ASSET_DIRECTORY = 'assets/cursors';

/* === Definições das variantes === */
/* ----- Hotspots preservados da V1 ----- */
const CURSOR_DEFINITIONS = Object.freeze({
    
    /* ----- Ajuda ----- */
    help: Object.freeze({
        file: 'cursor-help.svg',
        hotspot: [3, 2],
        fallback: 'help',
    }),

    /* ----- Ocupado ----- */
    wait: Object.freeze({
        file: 'cursor-wait.svg',
        hotspot: [12, 12],
        fallback: 'wait',
    }),

    default: Object.freeze({
        file: 'cursor-default.svg',
        hotspot: [4, 2],
        fallback: 'default',
    }),

    pointer: Object.freeze({
        file: 'cursor-pointer.svg',
        hotspot: [4, 2],
        fallback: 'pointer',
    }),

    grab: Object.freeze({
        file: 'cursor-grab.svg',
        hotspot: [8, 8],
        fallback: 'grab',
    }),

    grabbing: Object.freeze({
        file: 'cursor-grabbing.svg',
        hotspot: [8, 8],
        fallback: 'grabbing',
    }),

    text: Object.freeze({
        file: 'cursor-text.svg',
        hotspot: [12, 12],
        fallback: 'text',
    }),

    'resize-horizontal': Object.freeze({
        file: 'cursor-resize-horizontal.svg',
        hotspot: [12, 12],
        fallback: 'ew-resize',
    }),

    'resize-vertical': Object.freeze({
        file: 'cursor-resize-vertical.svg',
        hotspot: [12, 12],
        fallback: 'ns-resize',
    }),

    'resize-diagonal-1': Object.freeze({
        file: 'cursor-resize-diagonal-1.svg',
        hotspot: [12, 12],
        fallback: 'nwse-resize',
    }),

    'resize-diagonal-2': Object.freeze({
        file: 'cursor-resize-diagonal-2.svg',
        hotspot: [12, 12],
        fallback: 'nesw-resize',
    }),

    move: Object.freeze({
        file: 'cursor-move.svg',
        hotspot: [12, 12],
        fallback: 'move',
    }),

    'not-allowed': Object.freeze({
        file: 'cursor-not-allowed.svg',
        hotspot: [12, 12],
        fallback: 'not-allowed',
    }),
});

/* === Variantes disponíveis === */
/* ----- Identificadores públicos ----- */
export const CURSOR_VARIANTS = Object.freeze(
    Object.keys(CURSOR_DEFINITIONS),
);

/* === Validação === */
/* ----- Temas e modos ----- */
export function isCursorTheme(theme) {
    return CURSOR_THEMES.includes(theme);
}

export function isCursorMode(mode) {
    return CURSOR_MODES.includes(mode);
}

export function isCursorVariant(variant) {
    return Object.hasOwn(CURSOR_DEFINITIONS, variant);
}

/* === Consultas === */
/* ----- Definição de uma variante ----- */
export function getCursorDefinition(variant) {
    return CURSOR_DEFINITIONS[variant] ?? null;
}

/* ----- Caminho do recurso SVG ----- */
export function getCursorAssetPath(
    variant,
    theme = 'dark',
) {
    if (
        !isCursorVariant(variant) ||
        !isCursorTheme(theme)
    ) {
        return null;
    }

    const definition = CURSOR_DEFINITIONS[variant];

    return (
        `${CURSOR_ASSET_DIRECTORY}/` +
        `${theme}-${definition.file}`
    );
}

/* ----- Hotspot e fallback ----- */
export function getCursorHotspot(variant) {
    const definition = getCursorDefinition(variant);

    return definition
        ? [...definition.hotspot]
        : null;
}

export function getCursorFallback(variant) {
    return getCursorDefinition(variant)?.fallback ?? 'auto';
}

/* === Valores CSS === */
/* ----- Cursor com fallback nativo ----- */
export function getCursorCssValue(
    variant,
    theme = 'dark',
    mode = DEFAULT_CURSOR_MODE,
    baseUrl = '/',
) {
    const fallback = getCursorFallback(variant);

    if (
        mode !== 'custom' ||
        !isCursorVariant(variant) ||
        !isCursorTheme(theme)
    ) {
        return fallback;
    }

    const definition = CURSOR_DEFINITIONS[variant];
    const file = getCursorAssetPath(variant, theme);

    const base = typeof baseUrl === 'string'
        ? baseUrl.replace(/\/?$/, '/')
        : '/';

    const url = `${base}${file}`;

    const [x, y] = definition.hotspot;

    return `url("${url}") ${x} ${y}, ${fallback}`;
}

/* === Preferências === */
/* ----- Normalização do modo ----- */
export function normalizeCursorMode(mode) {
    return isCursorMode(mode)
        ? mode
        : DEFAULT_CURSOR_MODE;
}

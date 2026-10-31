/* === CATÁLOGO DE CURSORES === */
/* ----- TEMAS DISPONÍVEIS ----- */
export const CURSOR_THEMES = Object.freeze([
    'dark',
    'light',
]);

/* ----- MODOS DISPONÍVEIS ----- */
export const DEFAULT_CURSOR_MODE = 'custom';

export const CURSOR_MODES = Object.freeze([
    'custom',
    'native',
]);

const CURSOR_ASSET_DIRECTORY = 'assets/cursors';

/* === DEFINIÇÕES DOS CURSORES === */
const CURSOR_DEFINITIONS = Object.freeze({
    help: Object.freeze({
        file: 'cursor-help.svg',
        hotspot: [3, 2],
        fallback: 'help',
    }),
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

/* === VARIANTES DISPONÍVEIS === */
export const CURSOR_VARIANTS = Object.freeze(Object.keys(CURSOR_DEFINITIONS));

/* === VALIDAÇÃO DE CURSORES === */
/* ----- VALIDAÇÃO DE TEMA ----- */
export function isCursorTheme(theme) {
    return CURSOR_THEMES.includes(theme);
}

/* ----- VALIDAÇÃO DE MODO ----- */
export function isCursorMode(mode) {
    return CURSOR_MODES.includes(mode);
}

/* ----- VALIDAÇÃO DE VARIANTE ----- */
export function isCursorVariant(variant) {
    return Object.hasOwn(CURSOR_DEFINITIONS, variant);
}

/* === CONSULTAS AO CATÁLOGO === */
/* ----- DEFINIÇÃO DA VARIANTE ----- */
export function getCursorDefinition(variant) {
    return CURSOR_DEFINITIONS[variant] ?? null;
}

/* ----- CAMINHO DO RECURSO ----- */
export function getCursorAssetPath(variant, theme = 'dark') {
    if (!isCursorVariant(variant) || !isCursorTheme(theme)) {
        return null;
    }

    const definition = CURSOR_DEFINITIONS[variant];

    return `${CURSOR_ASSET_DIRECTORY}/` + `${theme}-${definition.file}`;
}

/* ----- HOTSPOT ----- */
export function getCursorHotspot(variant) {
    const definition = getCursorDefinition(variant);

    return definition ? [...definition.hotspot] : null;
}

/* ----- FALLBACK NATIVO ----- */
export function getCursorFallback(variant) {
    return getCursorDefinition(variant)?.fallback ?? 'auto';
}

/* === APLICAÇÃO CSS === */
/* ----- VALOR CSS DO CURSOR ----- */
export function getCursorCssValue(
    variant,
    theme = 'dark',
    mode = DEFAULT_CURSOR_MODE,
    baseUrl = '/',
) {
    const fallback = getCursorFallback(variant);

    if (mode !== 'custom' || !isCursorVariant(variant) || !isCursorTheme(theme)) {
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

/* === PREFERÊNCIAS DO CURSOR === */
/* ----- NORMALIZAÇÃO DO MODO ----- */
export function normalizeCursorMode(mode) {
    return isCursorMode(mode) ? mode : DEFAULT_CURSOR_MODE;
}
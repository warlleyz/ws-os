import { getWidgetDefinition } from './widgetManager.js';
import { isContractData, isRecord, validId } from '../shared/utils/contractValidation.js';

/* === Preferências: versões lógicas sem renomear chaves existentes === */
export const PREFERENCE_SCHEMA_VERSION = 1;
export const PREFERENCE_KEYS = Object.freeze({
  'ws-os:theme': { category: 'appearance', encoding: 'raw' },
  'ws-os:cursor-mode': { category: 'appearance', encoding: 'raw' },
  'ws-os:appearance': { category: 'appearance', encoding: 'json' },
  'ws-os:locale': { category: 'language', encoding: 'raw' },
  'ws-os:accessibility': { category: 'accessibility', encoding: 'json' },
  'ws-os:desktop-shortcut-order': { category: 'desktop', encoding: 'raw' },
  'ws-os:desktop-shortcut-positions': { category: 'desktop', encoding: 'json' },
  'ws-os:wallpaper': { category: 'desktop', encoding: 'raw' },
  'ws-os:mobile-wallpaper': { category: 'mobile', encoding: 'raw' },
  'ws-os:mobile-preferences': { category: 'mobile', encoding: 'json' },
  'ws-os:desktop-widgets': { category: 'widgets', encoding: 'json' },
  'ws-os:taskbar-auto-hide': { category: 'taskbar', encoding: 'boolean' },
  'ws-os:notification-preferences': { category: 'notifications', encoding: 'json' },
  'ws-os:menu-favorites': { category: 'desktop', encoding: 'json' },
  'ws-os:files-view': { category: 'apps', encoding: 'json-or-raw' },
  'ws-os:files-sort': { category: 'apps', encoding: 'json-or-raw' },
  'ws-os:files-location': { category: 'apps', encoding: 'json' },
});

/* ----- Validação estrutural; gerenciadores mantêm suas regras específicas ----- */
export function validatePreferenceValue(key, value) {
  if (!Object.hasOwn(PREFERENCE_KEYS, key) || !isContractData(value)) return false;
  const enums = {
    'ws-os:theme': ['dark', 'light'],
    'ws-os:cursor-mode': ['custom', 'native'],
    'ws-os:locale': ['pt-BR', 'en'],
    'ws-os:desktop-shortcut-order': ['default', 'name'],
    'ws-os:files-view': ['grid', 'list'],
    'ws-os:files-sort': ['name', 'updated', 'size'],
  };
  if (enums[key]) return enums[key].includes(value);
  if (key === 'ws-os:taskbar-auto-hide') return typeof value === 'boolean';
  if (key.endsWith('wallpaper')) return typeof value === 'string' && validId(value);
  if (key === 'ws-os:menu-favorites')
    return (
      Array.isArray(value) &&
      value.length <= 6 &&
      value.every(validId) &&
      new Set(value).size === value.length
    );
  if (!isRecord(value)) return false;
  if (key === 'ws-os:appearance')
    return Object.entries(value).every(([field, item]) =>
      ({
        accent: ['blue', 'violet', 'green'],
        motion: ['off', 'subtle', 'normal'],
        blur: ['off', 'soft', 'normal', 'strong'],
        transparency: ['solid', 'default', 'high'],
      })[field]?.includes(item),
    );
  if (key === 'ws-os:accessibility')
    return Object.keys(value).every(
      (field) =>
        ['motion', 'transparency', 'lowEffects'].includes(field) &&
        typeof value[field] === 'boolean',
    );
  if (key === 'ws-os:mobile-preferences')
    return (
      ['default', 'comfortable'].includes(value.gridDensity) &&
      Object.keys(value).every((field) => field === 'gridDensity')
    );
  if (key === 'ws-os:desktop-shortcut-positions')
    return Object.entries(value).every(
      ([id, position]) =>
        validId(id) &&
        isRecord(position) &&
        Number.isSafeInteger(position.column) &&
        position.column >= 0 &&
        Number.isSafeInteger(position.row) &&
        position.row >= 0,
    );
  if (key === 'ws-os:desktop-widgets')
    return (
      Array.isArray(value.widgets) &&
      value.widgets.length <= 20 &&
      new Set(value.widgets.map((widget) => widget?.instanceId)).size === value.widgets.length &&
      value.widgets.every((widget) => {
        const definition = getWidgetDefinition(widget?.widgetId);
        return (
          isRecord(widget) &&
          validId(widget.instanceId) &&
          !!definition &&
          typeof widget.visible === 'boolean' &&
          definition.allowedSizes.includes(widget.size?.columns + 'x' + widget.size?.rows) &&
          (widget.position === null ||
            (isRecord(widget.position) &&
              Number.isSafeInteger(widget.position.column) &&
              widget.position.column >= 0 &&
              Number.isSafeInteger(widget.position.row) &&
              widget.position.row >= 0)) &&
          isRecord(widget.settings ?? {})
        );
      })
    );
  if (key === 'ws-os:files-location')
    return (
      ['home', 'personal', 'official', 'trash'].includes(value.space) &&
      (value.folderId === null || validId(value.folderId))
    );
  if (key === 'ws-os:notification-preferences')
    return Object.values(value).every((item) => typeof item === 'boolean');
  return false;
}

/* === Adaptação em memória: nunca sobrescreve leitura legada ou inválida === */
export function createPreferenceRecord(key, value) {
  return validatePreferenceValue(key, value)
    ? {
        ok: true,
        record: {
          schemaVersion: PREFERENCE_SCHEMA_VERSION,
          key,
          value: JSON.parse(JSON.stringify(value)),
        },
      }
    : { ok: false, code: 'INVALID_PREFERENCE' };
}

export function adaptStoredPreference(key, raw) {
  const definition = PREFERENCE_KEYS[key];
  if (!definition || raw === null || raw === undefined)
    return { ok: false, code: 'PREFERENCE_NOT_FOUND' };
  let value;
  try {
    if (typeof raw !== 'string' || raw.length > 131072)
      return { ok: false, code: 'INVALID_PREFERENCE' };
    if (definition.encoding === 'raw') value = raw;
    else if (definition.encoding === 'boolean') {
      if (!['true', 'false'].includes(raw)) throw Error();
      value = raw === 'true';
    } else {
      try {
        value = JSON.parse(raw);
      } catch {
        if (definition.encoding === 'json-or-raw') value = raw;
        else throw Error();
      }
    }
    if (isRecord(value) && Object.hasOwn(value, 'schemaVersion')) {
      if (value.schemaVersion !== PREFERENCE_SCHEMA_VERSION || value.key !== key)
        return { ok: false, code: 'UNSUPPORTED_PREFERENCE_VERSION' };
      value = value.value;
    }
    const result = createPreferenceRecord(key, value);
    return { ...result, legacyEncoding: true, requiresWrite: false };
  } catch {
    return { ok: false, code: 'INVALID_PREFERENCE' };
  }
}

export function encodeStoredPreference(record) {
  if (
    !isRecord(record) ||
    record.schemaVersion !== PREFERENCE_SCHEMA_VERSION ||
    !createPreferenceRecord(record.key, record.value).ok
  )
    return { ok: false, code: 'INVALID_PREFERENCE' };
  const encoding = PREFERENCE_KEYS[record.key].encoding;
  return {
    ok: true,
    key: record.key,
    value:
      encoding === 'raw'
        ? record.value
        : encoding === 'boolean'
          ? String(record.value)
          : JSON.stringify(record.value),
  };
}

/* === Redefinição seletiva: ações confiáveis, sem clear ou bancos pessoais === */
export const PREFERENCE_RESET_ACTIONS = Object.freeze({
  theme: 'appearance',
  cursor: 'appearance',
  notifications: 'notifications',
  locale: 'language',
  appearance: 'appearance',
  accessibility: 'accessibility',
  taskbar: 'taskbar',
  mobile: 'mobile',
  desktopWallpaper: 'desktop',
  mobileWallpaper: 'mobile',
  widgets: 'widgets',
});

export function createPreferenceResetPlan(categories) {
  const allowed = [...new Set(Object.values(PREFERENCE_RESET_ACTIONS))];
  if (
    categories !== undefined &&
    (!Array.isArray(categories) ||
      !categories.length ||
      categories.some((category) => !allowed.includes(category)))
  )
    return { ok: false, code: 'INVALID_PREFERENCE_RESET', actions: [] };
  return {
    ok: true,
    actions: Object.keys(PREFERENCE_RESET_ACTIONS).filter(
      (action) => categories === undefined || categories.includes(PREFERENCE_RESET_ACTIONS[action]),
    ),
    preserves: [
      'personal-files',
      'application-content',
      'session',
      'desktop-positions',
      'custom-wallpaper-image',
    ],
  };
}

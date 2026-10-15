import { readPreference, writePreference } from '../../services/storage/preferencesStorage';

export const DEFAULT_SHORTCUT_ORDER = [
  'about-me',
  'projects',
  'dev-insights',
  'resume',
  'certificates',
  'contact',
  'terminal',
  'games',
  'notes',
  'files',
  'settings',
  'about-system',
];
const ORDER_KEY = 'ws-os:desktop-shortcut-order';
const POSITIONS_KEY = 'ws-os:desktop-shortcut-positions';

export function loadDesktopPreferences() {
  const order = readPreference(ORDER_KEY);
  const positions = readPreference(POSITIONS_KEY);
  let error = order.error || positions.error;
  let parsed;
  try {
    parsed = JSON.parse(positions.value ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('Posições inválidas');
    for (const [id, position] of Object.entries(parsed)) {
      if (
        !DEFAULT_SHORTCUT_ORDER.includes(id) ||
        !Number.isInteger(position?.column) ||
        !Number.isInteger(position?.row) ||
        position.column < 0 ||
        position.row < 0
      ) {
        delete parsed[id];
        error ||= 'invalid';
      }
    }
  } catch {
    parsed = {};
    error ||= 'invalid';
  }
  if (order.value !== null && !['name', 'default'].includes(order.value)) error ||= 'invalid';
  return { order: order.value === 'name' ? 'name' : 'default', positions: parsed, error };
}

export function saveDesktopPreferences(preferences) {
  // Mantém as duas chaves e os formatos iniciados na R3.3.
  const orderSaved = writePreference(ORDER_KEY, preferences.order);
  const positionsSaved = writePreference(POSITIONS_KEY, JSON.stringify(preferences.positions));
  return orderSaved && positionsSaved;
}

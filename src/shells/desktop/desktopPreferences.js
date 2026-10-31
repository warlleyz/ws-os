import {
  readPreference,
  writePreference,
} from '../../services/storage/preferencesStorage';

/* === Configurações do Desktop === */
/* ----- Ordem padrão dos atalhos ----- */
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

/* ----- Chaves de armazenamento ----- */
const ORDER_KEY = 'ws-os:desktop-shortcut-order';
const POSITIONS_KEY = 'ws-os:desktop-shortcut-positions';

/* === Carregamento das preferências === */
/* ----- Recuperar ordem e posições ----- */
export function loadDesktopPreferences() {
  const order = readPreference(ORDER_KEY);
  const positions = readPreference(POSITIONS_KEY);

  let error = order.error || positions.error;
  let parsed;

  /* ----- Validar posições armazenadas ----- */
  try {
    parsed = JSON.parse(positions.value ?? '{}');

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Posições inválidas');
    }

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

  /* ----- Validar ordenação armazenada ----- */
  if (
    order.value !== null &&
    !['name', 'default'].includes(order.value)
  ) {
    error ||= 'invalid';
  }

  /* ----- Retornar preferências normalizadas ----- */
  return {
    order: order.value === 'name' ? 'name' : 'default',
    positions: parsed,
    error,
  };
}

/* === Persistência das preferências === */
/* ----- Salvar ordem e posições ----- */
export function saveDesktopPreferences(preferences) {
  const orderSaved = writePreference(
    ORDER_KEY,
    preferences.order,
  );

  const positionsSaved = writePreference(
    POSITIONS_KEY,
    JSON.stringify(preferences.positions),
  );

  return orderSaved && positionsSaved;
}
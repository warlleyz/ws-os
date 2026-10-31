/* === CONFIGURAÇÃO DAS NOTIFICAÇÕES === */
const MAX_NOTIFICATIONS = 100;
const VALID_TYPES = ['info', 'success', 'warning', 'error'];

/* === ESTADO INICIAL === */
export const initialNotificationState = {
  items: [],
};

/* === CRIAÇÃO DE NOTIFICAÇÕES === */
export function createNotification({
  title,
  message,
  source = 'WS OS',
  type = 'info',
  action = null,
}) {
  if (typeof title !== 'string' || !title.trim()) {
    return null;
  }

  const validAction =
    action?.type === 'open-app' && typeof action.appId === 'string' && action.appId.trim()
      ? {
        type: 'open-app',
        appId: action.appId.trim(),
        label: 'Abrir aplicativo',
      }
      : null;

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    message: typeof message === 'string' ? message.trim() : '',
    source: typeof source === 'string' && source.trim() ? source.trim() : 'WS OS',
    type: VALID_TYPES.includes(type) ? type : 'info',
    createdAt: Date.now(),
    read: false,
    action: validAction,
  };
}

/* === GERENCIAMENTO DE NOTIFICAÇÕES === */
/* ----- ADIÇÃO ----- */
export function addNotification(state, notification) {
  if (!notification) return state;

  return {
    ...state,
    items: [notification, ...state.items].slice(0, MAX_NOTIFICATIONS),
  };
}

/* ----- MARCAR COMO LIDA ----- */
export function markNotificationAsRead(state, id) {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
  };
}

/* ----- MARCAR TODAS COMO LIDAS ----- */
export function markAllNotificationsAsRead(state) {
  return {
    ...state,
    items: state.items.map((item) => ({
      ...item,
      read: true,
    })),
  };
}

/* ----- REMOVER NOTIFICAÇÃO ----- */
export function removeNotification(state, id) {
  return {
    ...state,
    items: state.items.filter((item) => item.id !== id),
  };
}

/* ----- LIMPAR NOTIFICAÇÕES ----- */
export function clearNotifications(state) {
  return {
    ...state,
    items: [],
  };
}

/* === CONSULTAS DE NOTIFICAÇÕES === */
/* ----- CONTAGEM DE NÃO LIDAS ----- */
export function getUnreadCount(state) {
  return state.items.filter((item) => !item.read).length;
}
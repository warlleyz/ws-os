const MAX_NOTIFICATIONS = 100;

const VALID_TYPES = ['info', 'success', 'warning', 'error'];

export const initialNotificationState = {
  items: [],
};

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

export function addNotification(state, notification) {
  if (!notification) return state;

  return {
    ...state,
    items: [notification, ...state.items].slice(0, MAX_NOTIFICATIONS),
  };
}

export function markNotificationAsRead(state, id) {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
  };
}

export function markAllNotificationsAsRead(state) {
  return {
    ...state,
    items: state.items.map((item) => ({
      ...item,
      read: true,
    })),
  };
}

export function removeNotification(state, id) {
  return {
    ...state,
    items: state.items.filter((item) => item.id !== id),
  };
}

export function clearNotifications(state) {
  return {
    ...state,
    items: [],
  };
}

export function getUnreadCount(state) {
  return state.items.filter((item) => !item.read).length;
}

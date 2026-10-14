import { useState } from 'react';
import { SystemContext } from './systemContext';
import { activateApp, initialAppState, openApp, restoreApp, minimizeApp } from './appManager';
import { getAppDefinition } from './appRegistry';
import {
  initialNotificationState,
  createNotification,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
} from './notificationManager';
// Avisos temporários: o histórico é mantido pelo notificationManager.

const MAX_VISIBLE_TOASTS = 3;
export default function SystemProvider({ children }) {
  const [appState, setAppState] = useState(initialAppState);
  const [notificationState, setNotificationState] = useState(initialNotificationState);
  const [visibleToasts, setVisibleToasts] = useState([]);
  // Único ponto de entrada para ações de aplicativos e avisos do sistema.
  function run(operation, id) {
    setAppState((current) => operation(current, id));
    if (operation === openApp) {
      const app = getAppDefinition(id);
      if (app?.public) {
        const notification = createNotification({
          title: 'Aplicativo iniciado',
          message: `${app.name} foi aberto na WS OS.`,
          source: 'Sistema',
          type: 'info',
          action: {
            type: 'open-app',
            appId: app.id,
          },
        });
        if (notification) {
          setNotificationState((current) => addNotification(current, notification));
          setVisibleToasts((current) => [...current, notification].slice(-MAX_VISIBLE_TOASTS));
        }
      }
    }
  }
  function handleNotificationAction(action, id) {
    if (action === 'remove') {
      dismissToast(id);
    }
    if (action === 'clear') {
      setVisibleToasts([]);
    }
    setNotificationState((current) => {
      switch (action) {
        case 'read':
          return markNotificationAsRead(current, id);
        case 'read-all':
          return markAllNotificationsAsRead(current);
        case 'remove':
          return removeNotification(current, id);
        case 'clear':
          return clearNotifications(current);
        default:
          return current;
      }
    });
  }
  function dismissToast(id) {
    setVisibleToasts((current) => current.filter((notification) => notification.id !== id));
  }
  function handleNotificationOpen(notification) {
    const action = notification?.action;
    if (action?.type !== 'open-app') return;
    const app = getAppDefinition(action.appId);
    if (!app?.public) return;
    const instance = [...appState.instances].reverse().find((item) => item.appId === action.appId);
    if (instance) {
      run(instance.minimized ? restoreApp : activateApp, instance.id);
    } else {
      run(openApp, action.appId);
    }
    setNotificationState((current) => markNotificationAsRead(current, notification.id));
    dismissToast(notification.id);
  }
  function minimizeAllApps() {
    setAppState((current) =>
      current.instances.reduce((state, instance) => minimizeApp(state, instance.id), current),
    );
  }
  return (
    <SystemContext.Provider
      value={{
        minimizeAllApps,
        appState,
        notificationState,
        visibleToasts,
        run,
        handleNotificationAction,
        dismissToast,
        handleNotificationOpen,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

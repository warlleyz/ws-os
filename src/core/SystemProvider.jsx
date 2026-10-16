import { canCloseApp, requestCloseConfirmation, useCloseConfirmation } from './appCloseGuards';
import AppCloseDialog from '../shared/components/AppCloseDialog';
import { closeApp } from './appManager';
import { translate as t, useLocale } from '../shared/i18n/i18n';
import { useCallback, useEffect, useState } from 'react';
import { SystemContext } from './systemContext';
import {
  activateApp,
  initialAppState,
  openApp,
  restoreApp,
  minimizeApp,
  validateAppOpen,
} from './appManager';
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
import {
  getNotificationPreferences,
  subscribeNotificationPreferences,
} from './notificationPreferences';
// Avisos temporários: o histórico é mantido pelo notificationManager.

export default function SystemProvider({ children }) {
  useLocale();
  const closeRequest = useCloseConfirmation();
  const [appState, setAppState] = useState(initialAppState);
  const [notificationState, setNotificationState] = useState(initialNotificationState);
  const [visibleToasts, setVisibleToasts] = useState([]);
  useEffect(
    () =>
      subscribeNotificationPreferences(() => {
        if (getNotificationPreferences().doNotDisturb) setVisibleToasts([]);
      }),
    [],
  );

  const notify = useCallback((details) => {
    const notification = createNotification(details);

    if (!notification) return;

    setNotificationState((current) => addNotification(current, notification));

    const doNotDisturb = getNotificationPreferences().doNotDisturb;

    const canShowToast =
      details?.toast !== false && (!doNotDisturb || notification.type === 'error');

    if (canShowToast) {
      setVisibleToasts((current) => [...current, notification].slice(0, 20));
    }
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    window.wsNotify = (type = 'info') => {
      notify({
        title: 'Notificação de teste',
        message: `Testando notificação do tipo ${type}.`,
        source: 'WS OS',
        type,
      });
    };

    return () => {
      delete window.wsNotify;
    };
  }, [notify]);

  // Único ponto de entrada para ações de aplicativos e avisos do sistema.
  function run(operation, id, options) {
    if (operation === closeApp && !canCloseApp(id)) {
      requestCloseConfirmation(id, () => setAppState((current) => closeApp(current, id)));
      return false;
    }
    if (operation === openApp) {
      const request = validateAppOpen(id, options);
      if (!request.ok) {
        notify({
          title: t('Não foi possível abrir o aplicativo'),
          message: request.error.message,
          source: t('Sistema'),
          type: 'error',
        });
        return false;
      }
    }
    setAppState((current) => operation(current, id, options));
    return true;
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
        notify,
        run,
        handleNotificationAction,
        dismissToast,
        handleNotificationOpen,
      }}
    >
      <div style={{ display: 'contents' }} inert={Boolean(closeRequest)}>
        {children}
      </div>
      <AppCloseDialog request={closeRequest} />
    </SystemContext.Provider>
  );
}

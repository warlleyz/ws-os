import { useCallback, useEffect, useRef, useState } from 'react';

import {
  activateApp,
  closeApp,
  initialAppState,
  minimizeApp,
  openApp,
  requestAppOpen,
  restoreApp,
  validateAppOpen,
} from './appManager';
import {
  requestGuardedAction,
  useCloseConfirmation,
} from './appCloseGuards';
import {
  getAppDefinition,
  getAppNavigationContract,
} from './appRegistry';
import {
  addNotification,
  clearNotifications,
  createNotification,
  initialNotificationState,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  removeNotification,
} from './notificationManager';
import {
  getNotificationPreferences,
  subscribeNotificationPreferences,
} from './notificationPreferences';
import { SystemContext } from './systemContext';

import { resolveSharedEntry } from '../features/search/searchService';
import AppCloseDialog from '../shared/components/AppCloseDialog';
import { translate as t, useLocale } from '../shared/i18n/i18n';

export default function SystemProvider({ children }) {
  /* === Idioma e confirmações === */
  useLocale();

  const closeRequest = useCloseConfirmation();

  /* === Estado dos aplicativos === */
  /* ----- Controle de abertura pendente ----- */
  const pendingOpenRef = useRef(null);
  const openRequestSequenceRef = useRef(0);
  /* ----- Inicialização da sessão ----- */
  const [appState, setAppState] = useState(() => {
    const entry = resolveSharedEntry(window.location.search);

    if (!entry) return initialAppState;

    return openApp(initialAppState, entry.appId, {
      origin: entry.origin,
      params: entry.params,
    });
  });

  /* ----- Confirmação da abertura aplicada ----- */
  useEffect(() => {
    const pending = pendingOpenRef.current;
    const outcome = appState.navigationOutcome;

    if (!pending || !outcome) return;
    if (pending.id !== outcome.id) return;

    pendingOpenRef.current = null;

    if (!outcome.ok) return;

    const instance = appState.instances.find(
      (item) => item.id === outcome.instanceId,
    );

    if (!instance || instance.appId !== pending.appId) return;

    pending.onOpened?.({
      instanceId: instance.id,
      appId: instance.appId,
      status: outcome.status,
    });
  }, [appState]);

  /* ----- Limpeza dos links compartilhados ----- */
  useEffect(() => {
    if (!resolveSharedEntry(window.location.search)) return;

    window.history.replaceState(
      null,
      '',
      import.meta.env.BASE_URL,
    );
  }, []);

  /* === Estado das notificações === */
  const [notificationState, setNotificationState] = useState(
    initialNotificationState,
  );

  const [visibleToasts, setVisibleToasts] = useState([]);

  /* ----- Preferências de notificações ----- */
  useEffect(
    () =>
      subscribeNotificationPreferences(() => {
        if (getNotificationPreferences().doNotDisturb) {
          setVisibleToasts([]);
        }
      }),
    [],
  );

  /* ----- Criação de notificações ----- */
  const notify = useCallback((details) => {
    const notification = createNotification(details);

    if (!notification) return;

    setNotificationState((current) =>
      addNotification(current, notification),
    );

    const doNotDisturb =
      getNotificationPreferences().doNotDisturb;

    const canShowToast =
      details?.toast !== false &&
      (!doNotDisturb || notification.type === 'error');

    if (canShowToast) {
      setVisibleToasts((current) =>
        [...current, notification].slice(0, 20),
      );
    }
  }, []);

  /* ----- Notificações de desenvolvimento ----- */
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

  /* === Navegação protegida === */
  /* ----- Identificação de navegação contextual ----- */
  function getContextualTarget(appId, params = {}) {
    const contract = getAppNavigationContract(appId);

    if (!contract || contract.params === null) return null;

    const keys = Object.keys(contract.params).filter(
      (key) => Object.hasOwn(params, key),
    );

    if (keys.length === 0) return null;

    const instances = appState.instances.filter(
      (instance) => instance.appId === appId,
    );

    if (contract.reusePolicy === 'multiple') return null;

    if (contract.reusePolicy === 'contextual') {
      return (
        instances.find((instance) =>
          keys.every(
            (key) => instance.params?.[key] === params[key],
          ),
        ) ?? null
      );
    }

    return instances[0] ?? null;
  }

  /* ----- Detecção de substituição de contexto ----- */
  function getProtectedNavigationInstance(appId, params = {}) {
    const target = getContextualTarget(appId, params);

    if (!target) return null;

    const contract = getAppNavigationContract(appId);

    const changesContext = Object.keys(
      contract?.params ?? {},
    ).some(
      (key) =>
        Object.hasOwn(params, key) &&
        target.params?.[key] !== params[key],
    );

    return changesContext ? target : null;
  }

  /* === Execução de operações === */
  /* ----- Fechamento protegido ----- */
  function runClose(instanceId, options) {
    return requestGuardedAction(
      instanceId,
      () => {
        setAppState((current) =>
          closeApp(current, instanceId),
        );

        options?.onClosed?.();
      },
      'close',
    );
  }

  /* ----- Abertura protegida ----- */
  function runOpen(appId, options) {
    const request = validateAppOpen(appId, options);

    if (!request.ok) {
      notify({
        title: t('Não foi possível abrir o aplicativo'),
        message: request.error.message,
        source: t('Sistema'),
        type: 'error',
      });

      return false;
    }

    /* ----- Preservação dos parâmetros ----- */
    const openingOptions = {
      origin: request.origin,
      params: { ...request.params },
    };

    if (options?.originInstanceId !== undefined) {
      openingOptions.originInstanceId = options.originInstanceId;
    }

    /* ----- Identificação do contexto protegido ----- */
    const target = getProtectedNavigationInstance(
      appId,
      openingOptions.params,
    );

    const targetInstanceId = target?.id ?? null;
    const previousParams = target
      ? { ...target.params }
      : null;

    /* ----- Identificação da solicitação ----- */
    const requestId = ++openRequestSequenceRef.current;

    /* ----- Execução da abertura ----- */
    const proceed = () => {
      pendingOpenRef.current = {
        id: requestId,
        appId,
        onOpened: options?.onOpened,
      };

      setAppState((current) => {
        /* ----- Verificação da instância protegida ----- */
        if (targetInstanceId) {
          const currentTarget = current.instances.find(
            (instance) => instance.id === targetInstanceId,
          );

          const contract = getAppNavigationContract(appId);
          const keys = Object.keys(contract?.params ?? {});

          const contextUnchanged =
            currentTarget?.appId === appId &&
            keys.every(
              (key) =>
                currentTarget.params?.[key] ===
                previousParams?.[key],
            );

          if (!contextUnchanged) {
            return {
              ...current,
              navigationOutcome: {
                id: requestId,
                ok: false,
                code: 'NAVIGATION_CONTEXT_CHANGED',
              },
            };
          }
        }

        /* ----- Revalidação e abertura ----- */
        const response = requestAppOpen(
          current,
          appId,
          openingOptions,
        );

        return {
          ...response.state,
          navigationOutcome: {
            id: requestId,
            ok: response.result.ok,
            instanceId: response.result.instanceId ?? null,
            status: response.result.status ?? null,
            code: response.result.error?.code ?? null,
          },
        };
      });
    };

    /* ----- Proteção de alterações não salvas ----- */
    if (targetInstanceId) {
      return requestGuardedAction(
        targetInstanceId,
        proceed,
        'navigate',
      );
    }

    proceed();
    return true;
  }

  /* ----- Despacho de operações ----- */
  function run(operation, id, options) {
    if (operation === closeApp) {
      return runClose(id, options);
    }

    if (operation === openApp) {
      return runOpen(id, options);
    }

    setAppState((current) =>
      operation(current, id, options),
    );

    return true;
  }

  /* === Gerenciamento de notificações === */
  /* ----- Remoção de notificações visíveis ----- */
  function dismissToast(id) {
    setVisibleToasts((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }

  /* ----- Ações da central de notificações ----- */
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

  /* ----- Abertura de aplicativos por notificações ----- */
  function handleNotificationOpen(notification) {
    const action = notification?.action;

    if (action?.type !== 'open-app') return;

    const app = getAppDefinition(action.appId);

    if (!app?.public) return;

    const instance = [...appState.instances]
      .reverse()
      .find(
        (item) => item.appId === action.appId,
      );

    if (instance) {
      run(
        instance.minimized ? restoreApp : activateApp,
        instance.id,
      );
    } else {
      if (!run(openApp, action.appId)) return;
    }

    setNotificationState((current) =>
      markNotificationAsRead(current, notification.id),
    );

    dismissToast(notification.id);
  }

  /* === Controles globais === */
  /* ----- Minimização de todas as janelas ----- */
  function minimizeAllApps() {
    setAppState((current) =>
      current.instances.reduce(
        (state, instance) =>
          minimizeApp(state, instance.id),
        current,
      ),
    );
  }

  /* === Disponibilização do sistema === */
  return (
    <SystemContext.Provider
      value={{
        appState,
        notificationState,
        visibleToasts,
        notify,
        run,
        minimizeAllApps,
        dismissToast,
        handleNotificationAction,
        handleNotificationOpen,
      }}
    >
      {/* ----- Conteúdo do sistema ----- */}
      <div
        style={{ display: 'contents' }}
        inert={Boolean(closeRequest)}
      >
        {children}
      </div>

      {/* ----- Confirmação de alterações não salvas ----- */}
      <AppCloseDialog request={closeRequest} />
    </SystemContext.Provider>
  );
}

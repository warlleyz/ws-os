import { useCallback, useEffect, useRef, useState } from 'react';

import {
  activateApp,
  beginAppClose,
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
  releaseCloseGuard,
  useCloseConfirmation,
  useClosePreparation,
} from './appCloseGuards';
import { getAppDefinition, getAppNavigationContract } from './appRegistry';
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
import { getWindowMotionDuration } from './windowLifecycle';

import { resolveSharedEntry } from '../features/search/searchService';
import AppCloseDialog from '../shared/components/AppCloseDialog';
import { translate as t, useLocale } from '../shared/i18n/i18n';

/* === RETORNO DE FOCO SEM INTERROMPER OUTRA INTERAÇÃO === */
function restoreFocus(previous) {
  if (document.activeElement !== document.body && document.activeElement !== previous) return;
  if (previous?.isConnected && !previous.closest?.('[inert]')) {
    previous.focus?.();
    return;
  }
  const target =
    document.querySelector?.('.desktop-window--active:not([inert]) .desktop-window__drag-area') ??
    document.querySelector?.('.taskbar__menu-button') ??
    document.querySelector?.('#ws-mobile');
  target?.focus();
}

export default function SystemProvider({ children }) {
  /* === IDIOMA E CONFIRMAÇÕES === */
  useLocale();

  const closeRequest = useCloseConfirmation();
  const preparation = useClosePreparation();

  /* === ESTADO DOS APLICATIVOS === */
  /* ----- CONTROLE DE ABERTURA PENDENTE ----- */
  const pendingOpenRef = useRef(new Map());
  const pendingClosuresRef = useRef(new Map());
  const closeTimersRef = useRef(new Map());
  const openRequestSequenceRef = useRef(0);
  /* ----- INICIALIZAÇÃO DA SESSÃO ----- */
  const [appState, setAppState] = useState(() => {
    const entry = resolveSharedEntry(window.location.search);

    if (!entry) return initialAppState;

    return openApp(initialAppState, entry.appId, {
      origin: entry.origin,
      params: entry.params,
    });
  });

  /* ----- CONFIRMAR CADA ABERTURA APLICADA, INCLUSIVE DESTINOS DE ATALHOS ----- */
  useEffect(() => {
    const outcomes = appState.navigationOutcomes ?? [];
    if (!outcomes.length) return;
    for (const outcome of outcomes) {
      const pending = pendingOpenRef.current.get(outcome.id);
      pendingOpenRef.current.delete(outcome.id);
      if (!pending || !outcome.ok) continue;
      const instance = appState.instances.find(
        (item) => item.id === outcome.instanceId && !item.closing,
      );
      if (!instance || instance.appId !== outcome.appId) continue;
      pending.onOpened?.({
        instanceId: instance.id,
        appId: instance.appId,
        requestedAppId: pending.appId,
        status: outcome.status,
      });
    }
  }, [appState]);

  /* ----- DESMONTAR SOMENTE APÓS A PREPARAÇÃO E O CICLO VISUAL ----- */
  useEffect(() => {
    for (const [id, entry] of pendingClosuresRef.current) {
      const instance = appState.instances.find((item) => item.id === id);
      if (!instance) {
        clearTimeout(closeTimersRef.current.get(id));
        closeTimersRef.current.delete(id);
        pendingClosuresRef.current.delete(id);
        entry.onClosed?.();
        restoreFocus(entry.returnFocus);
        continue;
      }
      if (!instance.closing || closeTimersRef.current.has(id)) continue;
      const duration = instance.minimized ? 0 : getWindowMotionDuration();
      closeTimersRef.current.set(
        id,
        setTimeout(() => {
          closeTimersRef.current.delete(id);
          setAppState((current) => closeApp(current, id));
        }, duration),
      );
    }
  }, [appState]);

  /* ----- ENCERRAR CALLBACKS E RELÓGIOS AO DESMONTAR O SISTEMA ----- */
  useEffect(() => {
    const timers = closeTimersRef.current;
    const closures = pendingClosuresRef.current;
    const openings = pendingOpenRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      closures.clear();
      openings.clear();
    };
  }, []);

  /* ----- RECUPERAR FOCO APÓS SUCESSO OU FALHA DA PREPARAÇÃO ----- */
  useEffect(() => {
    if (!preparation) return undefined;
    return () => restoreFocus(preparation.returnFocus);
  }, [preparation]);

  /* ----- LIMPEZA DOS LINKS COMPARTILHADOS ----- */
  useEffect(() => {
    if (!resolveSharedEntry(window.location.search)) return;

    window.history.replaceState(null, '', import.meta.env.BASE_URL);
  }, []);

  /* === ESTADO DAS NOTIFICAÇÕES === */
  const [notificationState, setNotificationState] = useState(initialNotificationState);

  const [visibleToasts, setVisibleToasts] = useState([]);

  /* ----- PREFERÊNCIAS DE NOTIFICAÇÕES ----- */
  useEffect(
    () =>
      subscribeNotificationPreferences(() => {
        if (getNotificationPreferences().doNotDisturb) {
          setVisibleToasts([]);
        }
      }),
    [],
  );

  /* ----- CRIAÇÃO DE NOTIFICAÇÕES ----- */
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

  /* ----- NOTIFICAÇÕES DE DESENVOLVIMENTO ----- */
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

  /* === NAVEGAÇÃO PROTEGIDA === */
  /* ----- IDENTIFICAÇÃO DE NAVEGAÇÃO CONTEXTUAL ----- */
  function getContextualTarget(appId, params = {}) {
    const contract = getAppNavigationContract(appId);

    if (!contract || contract.params === null) return null;

    const keys = Object.keys(contract.params).filter((key) => Object.hasOwn(params, key));

    if (keys.length === 0) return null;

    const instances = appState.instances.filter(
      (instance) => instance.appId === appId && !instance.closing,
    );

    if (contract.reusePolicy === 'multiple') return null;

    if (contract.reusePolicy === 'contextual') {
      return (
        instances.find((instance) => keys.every((key) => instance.params?.[key] === params[key])) ??
        null
      );
    }

    return instances[0] ?? null;
  }

  /* ----- DETECÇÃO DE SUBSTITUIÇÃO DE CONTEXTO ----- */
  function getProtectedNavigationInstance(appId, params = {}) {
    const target = getContextualTarget(appId, params);

    if (!target) return null;

    const contract = getAppNavigationContract(appId);

    const changesContext = Object.keys(contract?.params ?? {}).some(
      (key) =>
        Object.hasOwn(params, key) &&
        JSON.stringify(target.params?.[key]) !== JSON.stringify(params[key]),
    );

    return changesContext ? target : null;
  }

  /* === EXECUÇÃO DE OPERAÇÕES === */
  /* ----- FECHAMENTO PROTEGIDO ----- */
  function runClose(instanceId, options) {
    if (
      !appState.instances.some((item) => item.id === instanceId) ||
      pendingClosuresRef.current.has(instanceId)
    )
      return false;
    return requestGuardedAction(
      instanceId,
      () => {
        pendingClosuresRef.current.set(instanceId, {
          onClosed: options?.onClosed,
          returnFocus: document.activeElement,
        });
        releaseCloseGuard(instanceId);
        const animate = options?.animate !== false && getWindowMotionDuration() > 0;
        setAppState((current) => {
          const instance = current.instances.find((item) => item.id === instanceId);
          return animate && instance && !instance.minimized
            ? beginAppClose(current, instanceId)
            : closeApp(current, instanceId);
        });
      },
      'close',
    );
  }

  /* ----- ABERTURA PROTEGIDA ----- */
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

    /* ----- PRESERVAÇÃO DOS PARÂMETROS ----- */
    const openingOptions = {
      origin: request.origin,
      params: { ...request.params },
    };

    if (options?.originInstanceId !== undefined) {
      openingOptions.originInstanceId = options.originInstanceId;
    }

    /* ----- IDENTIFICAÇÃO DO CONTEXTO PROTEGIDO ----- */
    const target = getProtectedNavigationInstance(appId, openingOptions.params);

    const targetInstanceId = target?.id ?? null;
    const previousParams = target ? { ...target.params } : null;

    /* ----- IDENTIFICAÇÃO DA SOLICITAÇÃO ----- */
    const requestId = ++openRequestSequenceRef.current;

    /* ----- EXECUÇÃO DA ABERTURA ----- */
    const proceed = () => {
      pendingOpenRef.current.set(requestId, { appId, onOpened: options?.onOpened });

      setAppState((current) => {
        /* ----- VERIFICAÇÃO DA INSTÂNCIA PROTEGIDA ----- */
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
                JSON.stringify(currentTarget.params?.[key]) ===
                JSON.stringify(previousParams?.[key]),
            );

          if (!contextUnchanged) {
            return {
              ...current,
              navigationOutcomes: [
                ...(current.navigationOutcomes ?? []).filter((outcome) =>
                  pendingOpenRef.current.has(outcome.id),
                ),
                {
                  id: requestId,
                  ok: false,
                  code: 'NAVIGATION_CONTEXT_CHANGED',
                },
              ],
            };
          }
        }

        /* ----- REVALIDAÇÃO E ABERTURA ----- */
        const response = requestAppOpen(current, appId, openingOptions);

        const outcome = {
          id: requestId,
          ok: response.result.ok,
          instanceId: response.result.instanceId ?? null,
          appId: response.result.appId ?? null,
          status: response.result.status ?? null,
          code: response.result.error?.code ?? null,
        };
        return {
          ...response.state,
          navigationOutcome: outcome,
          navigationOutcomes: [
            ...(current.navigationOutcomes ?? []).filter((outcome) =>
              pendingOpenRef.current.has(outcome.id),
            ),
            outcome,
          ],
        };
      });
    };

    /* ----- PROTEÇÃO DE ALTERAÇÕES NÃO SALVAS ----- */
    if (targetInstanceId) {
      return requestGuardedAction(targetInstanceId, proceed, 'navigate');
    }

    proceed();
    return true;
  }

  /* ----- DESPACHO DE OPERAÇÕES ----- */
  function run(operation, id, options) {
    if (operation === closeApp) {
      return runClose(id, options);
    }

    if (operation === openApp) {
      return runOpen(id, options);
    }

    setAppState((current) => operation(current, id, options));

    return true;
  }

  /* === GERENCIAMENTO DE NOTIFICAÇÕES === */
  /* ----- REMOÇÃO DE NOTIFICAÇÕES VISÍVEIS ----- */
  function dismissToast(id) {
    setVisibleToasts((current) => current.filter((notification) => notification.id !== id));
  }

  /* ----- AÇÕES DA CENTRAL DE NOTIFICAÇÕES ----- */
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

  /* ----- ABERTURA DE APLICATIVOS POR NOTIFICAÇÕES ----- */
  function handleNotificationOpen(notification) {
    const action = notification?.action;

    if (action?.type !== 'open-app') return;

    const app = getAppDefinition(action.appId);

    if (!app?.public) return;

    const instance = [...appState.instances].reverse().find((item) => item.appId === action.appId);

    if (instance) {
      run(instance.minimized ? restoreApp : activateApp, instance.id);
    } else {
      if (!run(openApp, action.appId)) return;
    }

    setNotificationState((current) => markNotificationAsRead(current, notification.id));

    dismissToast(notification.id);
  }

  /* === CONTROLES GLOBAIS === */
  /* ----- MINIMIZAÇÃO DE TODAS AS JANELAS ----- */
  function minimizeAllApps() {
    setAppState((current) =>
      current.instances.reduce((state, instance) => minimizeApp(state, instance.id), current),
    );
  }

  /* === DISPONIBILIZAÇÃO DO SISTEMA === */
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
      {/* ----- CONTEÚDO DO SISTEMA ----- */}
      <div style={{ display: 'contents' }} inert={Boolean(closeRequest || preparation)}>
        {children}
      </div>

      {/* ----- CONFIRMAÇÃO DE ALTERAÇÕES NÃO SALVAS ----- */}
      <AppCloseDialog request={closeRequest} />
      {preparation && (
        <div className="ws-close-overlay">
          <section className="ws-close-dialog" role="status" aria-live="polite">
            <p>{t('Salvando...')}</p>
          </section>
        </div>
      )}
    </SystemContext.Provider>
  );
}

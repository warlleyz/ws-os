import { isContractData } from '../shared/utils/contractValidation';
import { checkCapability } from './authorizationContract';
import { getAppDefinition, getAppNavigationContract } from './appRegistry';
import { isAdminAuthenticated } from '../services/authService';
import { validateFileResource } from '../services/storage/fileResourceContract';

/* === Estado inicial === */
export const initialAppState = {
  instances: [],
  activeInstanceId: null,
  focusHistory: [],
};

/* === Consultas de instâncias === */
/* ----- Instância preferencial ----- */
export function getPreferredInstance(state, appId) {
  const instances = state.instances.filter((instance) => instance.appId === appId);

  if (instances.length === 0) return null;

  const active = instances.find((instance) => instance.id === state.activeInstanceId);

  if (active) return active;

  for (let index = state.focusHistory.length - 1; index >= 0; index -= 1) {
    const instance = instances.find((item) => item.id === state.focusHistory[index]);

    if (instance) return instance;
  }

  return instances.find((instance) => !instance.minimized) ?? instances.at(-1);
}

/* ----- Última instância disponível ----- */
function getLastAvailableFocus(instances, history) {
  return (
    [...history]
      .reverse()
      .find((id) => instances.some((instance) => instance.id === id && !instance.minimized)) ?? null
  );
}

/* === Validação de abertura === */
/* ----- Objetos de parâmetros ----- */
function isPlainRecord(value) {
  if (!value || typeof value !== 'object') return false;

  const prototype = Object.getPrototypeOf(value);

  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

/* ----- Parâmetros declarados pelo aplicativo ----- */
function validateNavigationParams(appId, params) {
  const contract = getAppNavigationContract(appId);

  if (!contract) {
    return {
      ok: false,
      code: 'APP_NOT_FOUND',
    };
  }

  if (!isPlainRecord(params)) {
    return {
      ok: false,
      code: 'INVALID_NAVIGATION_PARAMS',
    };
  }

  const acceptedParams = contract.params;

  if (!isContractData(params)) return { ok: false, code: 'INVALID_NAVIGATION_PARAMS' };
  if (acceptedParams === null) return { ok: true };

  for (const [key, value] of Object.entries(params)) {
    /* ----- Verificação dos campos declarados ----- */
    if (!Object.hasOwn(acceptedParams, key)) {
      return {
        ok: false,
        code: 'INVALID_NAVIGATION_PARAMS',
      };
    }

    const expectedType = acceptedParams[key];

    /* ----- Validação de descritores de arquivos ----- */
    if (expectedType === 'file-resource') {
      if (!validateFileResource(value).ok) {
        return {
          ok: false,
          code: 'INVALID_NAVIGATION_PARAMS',
        };
      }

      continue;
    }

    /* ----- Validação dos parâmetros simples ----- */
    if (expectedType !== 'string' || typeof value !== 'string' || !value.trim()) {
      return {
        ok: false,
        code: 'INVALID_NAVIGATION_PARAMS',
      };
    }
  }

  return { ok: true };
}

/* ----- Solicitação de abertura ----- */
export function validateAppOpen(appId, options = {}) {
  const app = getAppDefinition(appId);

  if (!app) {
    return {
      ok: false,
      error: {
        code: 'APP_NOT_FOUND',
        message: 'Aplicativo não encontrado.',
      },
    };
  }

  const navigationContract = getAppNavigationContract(appId);
  if (
    !app.public &&
    (!navigationContract?.requiredCapability ||
      !checkCapability(navigationContract.requiredCapability, {
        administrator: isAdminAuthenticated(),
      }).ok)
  ) {
    return {
      ok: false,
      error: {
        code: 'APP_ACCESS_DENIED',
        message: 'Este aplicativo não permite abertura pública.',
      },
    };
  }

  if (
    !isPlainRecord(options) ||
    (options.origin !== undefined &&
      (typeof options.origin !== 'string' || !options.origin.trim())) ||
    (options.params !== undefined && !isPlainRecord(options.params)) ||
    (options.originInstanceId !== undefined &&
      (typeof options.originInstanceId !== 'string' || !options.originInstanceId.trim()))
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OPEN_OPTIONS',
        message: 'Origem ou parâmetros de abertura inválidos.',
      },
    };
  }

  const params = { ...options.params };
  const validation = validateNavigationParams(appId, params);

  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: validation.code,
        message: 'Parâmetros de navegação inválidos.',
      },
    };
  }

  return {
    ok: true,
    app,
    origin: options.origin ?? 'system',
    params: JSON.parse(JSON.stringify(params)),
  };
}

/* === Gerenciamento de foco === */
/* ----- Ativação de instância ----- */
export function activateApp(state, instanceId) {
  const instance = state.instances.find((item) => item.id === instanceId);

  if (!instance || instance.minimized) return state;

  return {
    ...state,
    activeInstanceId: instanceId,
    focusHistory: [...state.focusHistory.filter((id) => id !== instanceId), instanceId],
  };
}

/* ----- Seleção de instância reutilizável ----- */
function findReusableInstance(state, appId, params) {
  const contract = getAppNavigationContract(appId);

  if (!contract) return null;

  const instances = state.instances.filter((instance) => instance.appId === appId);

  if (contract.reusePolicy === 'multiple') return null;

  if (contract.reusePolicy === 'existing') {
    return instances[0] ?? null;
  }

  if (contract.reusePolicy === 'contextual') {
    const keys = Object.keys(contract.params ?? {});

    if (!keys.some((key) => Object.hasOwn(params, key))) {
      return null;
    }

    return (
      instances.find((instance) => keys.every((key) => instance.params?.[key] === params[key])) ??
      null
    );
  }

  return null;
}

/* === Abertura de aplicativos === */
/* ----- Resolução da instância de origem ----- */
function resolveOpeningOrigin(state, options) {
  const instanceId = options.originInstanceId;

  if (!instanceId) return null;

  const instance = state.instances.find((item) => item.id === instanceId);

  if (!instance) return null;

  return {
    instanceId: instance.id,
    appId: instance.appId,
  };
}

/* ----- Atualização de navegação contextual ----- */
function updateInstanceNavigation(state, instanceId, appId, params) {
  const contract = getAppNavigationContract(appId);
  const acceptedParams = contract?.params ?? {};

  const target = state.instances.find((instance) => instance.id === instanceId);
  const hasContextualNavigation = Object.keys(acceptedParams).some(
    (key) =>
      Object.hasOwn(params, key) &&
      JSON.stringify(target?.params?.[key]) !== JSON.stringify(params[key]),
  );

  if (!hasContextualNavigation) return state;

  return {
    ...state,
    instances: state.instances.map((instance) =>
      instance.id === instanceId
        ? {
            ...instance,
            params: {
              ...instance.params,
              ...params,
            },
            navigationRequestId: (instance.navigationRequestId ?? 0) + 1,
          }
        : instance,
    ),
  };
}

/* ----- Abertura com resultado ----- */
export function requestAppOpen(state, appId, options = {}) {
  const request = validateAppOpen(appId, options);

  if (!request.ok) {
    return {
      state,
      result: {
        ok: false,
        error: request.error,
      },
    };
  }

  const { origin, params } = request;
  const navigationOrigin = resolveOpeningOrigin(state, options);

  const existing = findReusableInstance(state, appId, params);

  if (existing) {
    const nextState = updateInstanceNavigation(state, existing.id, appId, params);

    const stateWithOrigin = navigationOrigin
      ? {
          ...nextState,
          instances: nextState.instances.map((instance) =>
            instance.id === existing.id ? { ...instance, navigationOrigin } : instance,
          ),
        }
      : nextState;

    return {
      state: restoreApp(stateWithOrigin, existing.id),
      result: {
        ok: true,
        instanceId: existing.id,
        status: nextState === state ? 'restored' : 'navigated',
      },
    };
  }

  const instance = {
    id: crypto.randomUUID(),
    appId,
    minimized: false,
    executionState: 'running',
    origin,
    navigationOrigin,
    params,
  };

  return {
    state: activateApp(
      {
        ...state,
        instances: [...state.instances, instance],
      },
      instance.id,
    ),
    result: {
      ok: true,
      instanceId: instance.id,
      status: 'opened',
    },
  };
}

/* ----- Abertura compatível com reducers ----- */
export function openApp(state, appId, options = {}) {
  return requestAppOpen(state, appId, options).state;
}

/* === Ciclo de vida das instâncias === */
/* ----- Minimização ----- */
export function minimizeApp(state, instanceId) {
  const instance = state.instances.find((item) => item.id === instanceId);

  if (!instance || instance.minimized) return state;

  const app = getAppDefinition(instance.appId);

  const instances = state.instances.map((item) =>
    item.id === instanceId
      ? {
          ...item,
          minimized: true,
          executionState: app?.pauseWhenMinimized ? 'paused' : 'running',
        }
      : item,
  );

  const activeInstanceId =
    state.activeInstanceId === instanceId
      ? getLastAvailableFocus(instances, state.focusHistory)
      : state.activeInstanceId;

  const focusHistory =
    activeInstanceId && state.activeInstanceId === instanceId
      ? [...state.focusHistory.filter((id) => id !== activeInstanceId), activeInstanceId]
      : state.focusHistory;

  return {
    ...state,
    instances,
    focusHistory,
    activeInstanceId,
  };
}

/* ----- Restauração ----- */
export function restoreApp(state, instanceId) {
  if (!state.instances.some((item) => item.id === instanceId)) return state;

  const instances = state.instances.map((item) =>
    item.id === instanceId
      ? {
          ...item,
          minimized: false,
          executionState: 'running',
        }
      : item,
  );

  return activateApp({ ...state, instances }, instanceId);
}

/* ----- Fechamento ----- */
export function closeApp(state, instanceId) {
  if (!state.instances.some((item) => item.id === instanceId)) return state;

  const instances = state.instances.filter((item) => item.id !== instanceId);
  const focusHistory = state.focusHistory.filter((id) => id !== instanceId);

  return {
    ...state,
    instances,
    focusHistory,
    activeInstanceId:
      state.activeInstanceId === instanceId
        ? getLastAvailableFocus(instances, focusHistory)
        : state.activeInstanceId,
  };
}

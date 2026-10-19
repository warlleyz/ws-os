
/* === Registro de navegação interna === */
const backHandlers = new Map();

/* ----- Registro de retorno ----- */
export function registerAppBack(instanceId, handler) {
  if (typeof instanceId !== 'string' || !instanceId || typeof handler !== 'function') {
    return () => { };
  }

  backHandlers.set(instanceId, handler);

  return () => {
    if (backHandlers.get(instanceId) === handler) {
      backHandlers.delete(instanceId);
    }
  };
}

/* ----- Execução de retorno interno ----- */
export function handleAppBack(instanceId) {
  return backHandlers.get(instanceId)?.() === true;
}

/* === Navegação contextual === */
/* ----- Validação de instâncias ----- */
function findInstance(state, instanceId) {
  if (!state || !Array.isArray(state.instances)) return null;

  return state.instances.find((instance) => instance.id === instanceId) ?? null;
}

/* ----- Registro da origem ----- */
export function createNavigationOrigin(state, instanceId) {
  const instance = findInstance(state, instanceId);

  if (!instance) return null;

  return {
    instanceId: instance.id,
    appId: instance.appId,
  };
}

/* ----- Resolução da origem ----- */
export function resolveNavigationOrigin(state, origin) {
  if (!origin || typeof origin !== 'object') return null;

  const instance = findInstance(state, origin.instanceId);

  if (!instance || instance.appId !== origin.appId) return null;

  return instance;
}

/* === Retorno contextual === */
/* ----- Verificação de destino seguro ----- */
function isSafeReturnTarget(instance, getAppDefinition) {
  if (!instance || typeof getAppDefinition !== 'function') return false;

  const app = getAppDefinition(instance.appId);

  return app?.public === true;
}

/* ----- Resolução do retorno ----- */
export function resolveContextualBack(state, origin, getAppDefinition) {
  const source = resolveNavigationOrigin(state, origin);

  if (isSafeReturnTarget(source, getAppDefinition)) {
    return {
      type: 'instance',
      instanceId: source.id,
      appId: source.appId,
    };
  }

  const fallback = state?.instances
    ?.filter((instance) => isSafeReturnTarget(instance, getAppDefinition))
    .sort((first, second) => {
      const history = state.focusHistory ?? [];

      return history.lastIndexOf(second.id) - history.lastIndexOf(first.id);
    })[0];

  if (fallback) {
    return {
      type: 'instance',
      instanceId: fallback.id,
      appId: fallback.appId,
    };
  }

  return {
    type: 'home',
  };
}

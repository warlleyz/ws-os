/* === REGISTRO DE NAVEGAÇÃO INTERNA === */
const backHandlers = new Map();

/* ----- REGISTRO DE RETORNO ----- */
export function registerAppBack(instanceId, handler) {
  if (typeof instanceId !== 'string' || !instanceId || typeof handler !== 'function') {
    return () => {};
  }

  backHandlers.set(instanceId, handler);

  return () => {
    if (backHandlers.get(instanceId) === handler) {
      backHandlers.delete(instanceId);
    }
  };
}

/* ----- EXECUÇÃO DE RETORNO INTERNO ----- */
export function handleAppBack(instanceId) {
  return backHandlers.get(instanceId)?.() === true;
}

/* === NAVEGAÇÃO CONTEXTUAL === */
/* ----- VALIDAÇÃO DE INSTÂNCIAS ----- */
function findInstance(state, instanceId) {
  if (!state || !Array.isArray(state.instances)) return null;

  return state.instances.find((instance) => instance.id === instanceId) ?? null;
}

/* ----- REGISTRO DA ORIGEM ----- */
export function createNavigationOrigin(state, instanceId) {
  const instance = findInstance(state, instanceId);

  if (!instance) return null;

  return {
    instanceId: instance.id,
    appId: instance.appId,
  };
}

/* ----- RESOLUÇÃO DA ORIGEM ----- */
export function resolveNavigationOrigin(state, origin) {
  if (!origin || typeof origin !== 'object') return null;

  const instance = findInstance(state, origin.instanceId);

  if (!instance || instance.appId !== origin.appId) return null;

  return instance;
}

/* === RETORNO CONTEXTUAL === */
/* ----- VERIFICAÇÃO DE DESTINO SEGURO ----- */
function isSafeReturnTarget(instance, getAppDefinition) {
  if (!instance || instance.closing || typeof getAppDefinition !== 'function') return false;

  const app = getAppDefinition(instance.appId);

  return app?.public === true;
}

/* ----- RESOLUÇÃO DO RETORNO ----- */
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

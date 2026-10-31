import { useSyncExternalStore } from 'react';

/* === ESTADO DAS PROTEÇÕES === */
const guards = new Map();
const listeners = new Set();
let pending = null;
let preparing = null;
let transition = null;

/* ----- NOTIFICAR CONFIRMAÇÕES SEM EXPOR RASCUNHOS ----- */
function emit() {
  listeners.forEach((listener) => listener());
}

/* ----- CANCELAR SOMENTE A OPERAÇÃO QUE PERDEU SEU CONTEXTO ----- */
function invalidate(instanceId) {
  if (pending?.instanceId === instanceId) {
    if (pending.owner === transition) transition = null;
    pending = null;
    emit();
  }
  if (preparing?.instanceId === instanceId) {
    if (preparing.owner === transition) transition = null;
    preparing.cancelled = true;
    preparing = null;
    emit();
  }
}

/* === REGISTRO POR INSTÂNCIA === */
export function registerCloseGuard(instanceId, guard, options = {}) {
  if (typeof instanceId !== 'string' || !instanceId || typeof guard !== 'function') {
    return () => {};
  }
  invalidate(instanceId);
  const entry = {
    guard,
    beforeClose: typeof options?.beforeClose === 'function' ? options.beforeClose : null,
  };
  guards.set(instanceId, entry);
  return () => {
    if (guards.get(instanceId) !== entry) return;
    guards.delete(instanceId);
    invalidate(instanceId);
  };
}

/* ----- GUARDS DE DESCARTE CONTINUAM SÍNCRONOS E FALHAM DE FORMA SEGURA ----- */
export function canCloseApp(instanceId) {
  try {
    const result = guards.get(instanceId)?.guard();
    return result !== false && !result?.then;
  } catch {
    return false;
  }
}

/* ----- LIBERAR A PROTEÇÃO APÓS O FECHAMENTO ACEITO, ANTES DA ANIMAÇÃO ----- */
export function releaseCloseGuard(instanceId) {
  guards.delete(instanceId);
  invalidate(instanceId);
}

/* === CONFIRMAÇÃO DE DESCARTE === */
export function requestCloseConfirmation(instanceId, proceed, action = 'close') {
  if (typeof proceed !== 'function' || pending || preparing || transition) return false;
  pending = {
    instanceId,
    proceed,
    action,
    owner: null,
    returnFocus: typeof document === 'undefined' ? null : document.activeElement,
  };
  emit();
  return true;
}

/* === PREPARAÇÃO ASSÍNCRONA E EXCLUSIVIDADE === */
function executeGuardedAction(instanceId, proceed, action, owner = null) {
  if (
    typeof proceed !== 'function' ||
    pending ||
    preparing ||
    (transition && transition !== owner)
  ) {
    return false;
  }
  const entry = guards.get(instanceId);
  if (entry?.beforeClose) {
    const operation = {
      instanceId,
      owner,
      cancelled: false,
      returnFocus: typeof document === 'undefined' ? null : document.activeElement,
    };
    preparing = operation;
    emit();
    Promise.resolve()
      .then(() => (operation.cancelled ? false : entry.beforeClose()))
      .then((success) => {
        if (operation.cancelled || preparing !== operation || guards.get(instanceId) !== entry)
          return;
        preparing = null;
        if (success === true) proceed();
        else if (owner === transition) transition = null;
        emit();
      })
      .catch(() => {
        if (preparing !== operation) return;
        preparing = null;
        if (owner === transition) transition = null;
        emit();
      });
    return false;
  }
  if (canCloseApp(instanceId)) {
    proceed();
    return true;
  }
  pending = {
    instanceId,
    proceed,
    action,
    owner,
    returnFocus: typeof document === 'undefined' ? null : document.activeElement,
  };
  emit();
  return false;
}

export function requestGuardedAction(instanceId, proceed, action = 'close') {
  return executeGuardedAction(instanceId, proceed, action);
}

/* ----- CANCELAR PRESERVA OS DADOS E A TRANSIÇÃO INTEIRA ----- */
export function cancelCloseConfirmation() {
  if (!pending) return;
  if (pending.owner === transition) transition = null;
  pending = null;
  emit();
}

/* ----- RETIRAR A CONFIRMAÇÃO ANTES DE EXECUTAR EVITA DUPLICIDADE ----- */
export function confirmAppClose() {
  const request = pending;
  if (!request) return;
  pending = null;
  emit();
  request.proceed();
}

/* === ASSINATURA DAS CONFIRMAÇÕES === */
export function useCloseConfirmation() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
    () => null,
  );
}

/* ----- A PREPARAÇÃO EXPÕE SOMENTE ATIVIDADE E ORIGEM DO FOCO, NUNCA DADOS DO APP ----- */
export function useClosePreparation() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => preparing,
    () => null,
  );
}

/* === MUDANÇA DE SHELL === */
/* ----- PREPARAR TODAS AS INSTÂNCIAS ANTES DE DESMONTAR QUALQUER UMA ----- */
export function requestGuardedTransition(proceed) {
  if (typeof proceed !== 'function' || pending || preparing || transition) return false;
  const snapshot = [...guards.entries()];
  const owner = {};
  transition = owner;
  function next(index) {
    if (transition !== owner) return;
    if (index >= snapshot.length) {
      if (
        [...guards].some(
          ([id, entry]) => !snapshot.some(([savedId, saved]) => id === savedId && entry === saved),
        )
      ) {
        transition = null;
        return;
      }
      transition = null;
      proceed();
      return;
    }
    const [instanceId, entry] = snapshot[index];
    const current = guards.get(instanceId);
    if (!current) {
      next(index + 1);
      return;
    }
    if (current !== entry) {
      transition = null;
      return;
    }
    executeGuardedAction(instanceId, () => next(index + 1), 'navigate', owner);
  }
  next(0);
  return true;
}
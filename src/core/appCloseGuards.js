import { useSyncExternalStore } from 'react';

/* === Estado das proteções === */
const guards = new Map();
const listeners = new Set();

let pending = null;

/* === Notificações de estado === */
/* ----- Atualização dos assinantes ----- */
function emit() {
  listeners.forEach((listener) => listener());
}

/* === Registro de proteções === */
/* ----- Registro por instância ----- */
export function registerCloseGuard(instanceId, guard) {
  if (
    typeof instanceId !== 'string' ||
    !instanceId ||
    typeof guard !== 'function'
  ) {
    return () => { };
  }

  guards.set(instanceId, guard);

  return () => {
    if (guards.get(instanceId) !== guard) return;

    guards.delete(instanceId);

    if (pending?.instanceId === instanceId) {
      pending = null;
      emit();
    }
  };
}

/* ----- Verificação da proteção ----- */
export function canCloseApp(instanceId) {
  return guards.get(instanceId)?.() !== false;
}

/* === Confirmações protegidas === */
/* ----- Solicitação de confirmação ----- */
export function requestCloseConfirmation(instanceId, proceed, action = 'close') {
  if (typeof proceed !== 'function') return false;

  if (pending) return false;

  pending = {
    instanceId,
    proceed,
    action,
  };

  emit();
  return true;
}

/* ----- Execução de ação protegida ----- */
export function requestGuardedAction(instanceId, proceed, action = 'close') {
  if (typeof proceed !== 'function') return false;

  if (pending) return false;

  if (canCloseApp(instanceId)) {
    proceed();
    return true;
  }

  requestCloseConfirmation(instanceId, proceed, action);
  return false;
}

/* ----- Cancelamento da confirmação ----- */
export function cancelCloseConfirmation() {
  if (!pending) return;

  pending = null;
  emit();
}

/* ----- Confirmação da ação ----- */
export function confirmAppClose() {
  const request = pending;

  if (!request) return;

  pending = null;
  emit();

  request.proceed();
}

/* === Assinatura do estado === */
/* ----- Hook de confirmação ----- */
export function useCloseConfirmation() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    () => pending,
    () => null,
  );
}
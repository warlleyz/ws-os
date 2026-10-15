import { useSyncExternalStore } from 'react';
const guards = new Map();
const listeners = new Set();
let pending = null;
const emit = () => listeners.forEach((listener) => listener());
export function registerCloseGuard(instanceId, guard) {
  guards.set(instanceId, guard);
  return () => {
    if (guards.get(instanceId) === guard) guards.delete(instanceId);
    if (pending?.instanceId === instanceId) {
      pending = null;
      emit();
    }
  };
}
export function canCloseApp(instanceId) {
  return guards.get(instanceId)?.() !== false;
}
export function requestCloseConfirmation(instanceId, proceed) {
  pending = { instanceId, proceed };
  emit();
}
export function cancelCloseConfirmation() {
  pending = null;
  emit();
}
export function confirmAppClose() {
  const request = pending;
  pending = null;
  emit();
  request?.proceed();
}
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

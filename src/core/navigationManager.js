const handlers = new Map();
export function registerAppBack(instanceId, handler) {
  handlers.set(instanceId, handler);
  return () => {
    if (handlers.get(instanceId) === handler) handlers.delete(instanceId);
  };
}
export function handleAppBack(instanceId) {
  return handlers.get(instanceId)?.() === true;
}

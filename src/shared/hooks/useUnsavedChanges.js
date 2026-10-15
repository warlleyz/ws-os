import { useLayoutEffect } from 'react';
import { registerCloseGuard } from '../../core/appCloseGuards';
export default function useUnsavedChanges(instanceId, dirty) {
  useLayoutEffect(() => {
    if (!dirty) return;
    const remove = registerCloseGuard(instanceId, () => false);
    const unload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', unload);
    return () => {
      remove();
      window.removeEventListener('beforeunload', unload);
    };
  }, [instanceId, dirty]);
}

import { useLayoutEffect } from 'react';

import { registerCloseGuard } from '../../core/appCloseGuards';

/* === PROTEÇÃO DE ALTERAÇÕES NÃO SALVAS === */
export default function useUnsavedChanges(instanceId, dirty) {

  /* ----- REGISTRO DA PROTEÇÃO ----- */
  useLayoutEffect(() => {
    if (!dirty) return;

    const remove = registerCloseGuard(instanceId, () => false);

    /* ----- PROTEÇÃO CONTRA SAÍDA DA PÁGINA ----- */
    const unload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', unload);

    /* ----- LIMPEZA DOS EVENTOS ----- */
    return () => {
      remove();
      window.removeEventListener('beforeunload', unload);
    };
  }, [instanceId, dirty]);
}
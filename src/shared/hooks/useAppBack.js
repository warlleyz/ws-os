import { useEffect } from 'react';

import { registerAppBack } from '../../core/navigationManager';

/* === NAVEGAÇÃO INTERNA DOS APLICATIVOS === */
/* ----- REGISTRO DO RETORNO ----- */
export default function useAppBack(instanceId, handler) {
  useEffect(() => registerAppBack(instanceId, handler), [instanceId, handler]);
}
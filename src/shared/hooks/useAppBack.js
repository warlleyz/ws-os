import { useEffect } from 'react';
import { registerAppBack } from '../../core/navigationManager';
export default function useAppBack(instanceId, handler) {
  useEffect(() => registerAppBack(instanceId, handler), [instanceId, handler]);
}

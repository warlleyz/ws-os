import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { registerCloseGuard } from '../../core/appCloseGuards';

/* === UZDoom: confirmação de persistência antes de desmontar o iframe === */
export default function useDoomSession(instanceId, active) {
  const frameRef = useRef(null);
  const pendingRef = useRef(null);
  const mountedRef = useRef(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pendingRef.current?.finish(false);
    };
  }, []);

  const synchronize = useCallback(() => {
    if (pendingRef.current) return pendingRef.current.promise;
    const frame = frameRef.current?.contentWindow;
    if (!frame) return Promise.resolve(false);
    setSaving(true);
    setError('');
    const requestId = crypto.randomUUID();
    let resolve;
    const promise = new Promise((done) => {
      resolve = done;
    });
    let timeout;
    let finished = false;
    function finish(success) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      window.removeEventListener('message', receive);
      pendingRef.current = null;
      if (mountedRef.current) {
        setSaving(false);
        if (!success)
          setError('Não foi possível confirmar o salvamento. Tente novamente antes de sair.');
      }
      resolve(success);
    }
    function receive(event) {
      if (event.origin !== window.location.origin || event.source !== frame) return;
      if (event.data?.type !== 'ws-os:doom-save-result' || event.data.requestId !== requestId)
        return;
      finish(event.data.success === true);
    }
    pendingRef.current = { promise, finish };
    timeout = setTimeout(() => finish(false), 10000);
    window.addEventListener('message', receive);
    try {
      frame.postMessage({ type: 'ws-os:doom-save', requestId }, window.location.origin);
    } catch {
      finish(false);
    }
    return promise;
  }, []);

  useLayoutEffect(() => {
    if (!active) return undefined;
    /* ----- O Core aguarda o resultado; falhas mantêm a instância aberta. ----- */
    return registerCloseGuard(instanceId, () => false, { beforeClose: synchronize });
  }, [instanceId, active, synchronize]);

  useEffect(() => {
    if (!active) return undefined;
    const unload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [active]);

  return { frameRef, saving, error, synchronize };
}

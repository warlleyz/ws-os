import { useCallback, useEffect, useState } from 'react';
import { subscribePublicData } from '../../services/publicDataService';

/* === Recurso público compartilhado === */
export default function usePublicResource(load, key, enabled = true, { invalidateOn = [] } = {}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: '', data: null });
  const requestKey = `${key}:${attempt}`;
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  const prefixes = JSON.stringify(invalidateOn);

  /* ----- Assinatura seletiva e limpeza ----- */
  useEffect(() => {
    if (!enabled) return;
    const watched = JSON.parse(prefixes);
    if (!watched.length) return;
    return subscribePublicData(({ prefix }) => {
      if (watched.some((item) => prefix.startsWith(item) || item.startsWith(prefix))) refresh();
    });
  }, [enabled, prefixes, refresh]);

  /* ----- Revalidação cancelável ----- */
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    Promise.resolve()
      .then(() => load({ signal: controller.signal, force: attempt > 0 }))
      .then((result) => {
        if (!controller.signal.aborted) setState({ ...result, key: requestKey, status: 'ready' });
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.code !== 'PUBLIC_DATA_INVALIDATED')
          setState({
            key: requestKey,
            status: 'error',
            error: error.message,
            errorCode: error.code,
            data: null,
          });
      });
    return () => controller.abort();
  }, [load, requestKey, attempt, enabled]);

  return {
    ...state,
    status: !enabled ? 'idle' : state.key === requestKey ? state.status : 'loading',
    refresh,
  };
}

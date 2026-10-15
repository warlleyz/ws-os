import { useEffect, useState } from 'react';

export default function usePublicResource(load, key, enabled = true) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: '', data: null });
  const requestKey = `${key}:${attempt}`;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    Promise.resolve()
      .then(() => load({ signal: controller.signal, force: attempt > 0 }))
      .then((result) => {
        if (!controller.signal.aborted) setState({ ...result, key: requestKey, status: 'ready' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ key: requestKey, status: 'error', error: error.message, data: null });
      });
    return () => controller.abort();
  }, [load, requestKey, attempt, enabled]);
  return {
    ...state,
    status: !enabled ? 'idle' : state.key === requestKey ? state.status : 'loading',
    refresh: () => setAttempt((value) => value + 1),
  };
}

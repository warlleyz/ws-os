const cache = new Map();
const requests = new Map();
const MAX_CACHE = 32;
const TTL = 5 * 60 * 1000;

// Shared requests have leases: closing one app never cancels another consumer.
export function requestPublicJson(url, { signal, force = false } = {}) {
  if (signal?.aborted) return Promise.reject(new DOMException('Operação cancelada.', 'AbortError'));
  const previous = cache.get(url);
  if (!force && previous && Date.now() - previous.updatedAt < TTL)
    return Promise.resolve({ ...previous, source: 'cache' });
  let task = requests.get(url);
  if (!task || task.controller.signal.aborted) {
    const controller = new AbortController();
    task = { controller, users: 0 };
    const timeout = setTimeout(
      () => controller.abort(new Error('Tempo limite ao consultar o serviço.')),
      10000,
    );
    task.promise = (async () => {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok)
          throw new Error(
            response.status === 403 || response.status === 429
              ? 'Limite do serviço atingido. Tente mais tarde.'
              : 'Não foi possível consultar o serviço.',
          );
        const data = await response.json();
        const value = { data, updatedAt: Date.now(), source: 'live' };
        if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
        cache.set(url, value);
        return value;
      } catch (cause) {
        if (previous && Date.now() - previous.updatedAt < 86400000 && task.users > 0)
          return {
            ...previous,
            source: 'cache',
            warning: 'Serviço indisponível. Exibindo dados salvos nesta sessão.',
          };
        throw cause;
      } finally {
        clearTimeout(timeout);
        if (requests.get(url) === task) requests.delete(url);
      }
    })();
    requests.set(url, task);
  }
  task.users += 1;
  return new Promise((resolve, reject) => {
    let finished = false;
    function finish(callback, value) {
      if (finished) return;
      finished = true;
      signal?.removeEventListener('abort', abort);
      task.users -= 1;
      if (task.users === 0 && requests.get(url) === task) task.controller.abort();
      callback(value);
    }
    function abort() {
      finish(reject, new DOMException('Operação cancelada.', 'AbortError'));
    }
    signal?.addEventListener('abort', abort, { once: true });
    task.promise.then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
  });
}

export function invalidatePublicData(prefix) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

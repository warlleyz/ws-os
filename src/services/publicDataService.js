import {
  PUBLIC_CACHE_LIMITS,
  getPublicCacheStatus,
  resolvePublicCacheUsage,
} from './publicCacheContract';
import { unwrapApiResponse } from './apiResponseAdapter';

/* === Armazenamento público da sessão === */
const cache = new Map();
const requests = new Map();
const subscribers = new Set();
const channelName = 'ws-os:public-data';
const storageKey = 'ws-os:public-data-invalidated';
const publicPrefixes = [
  '/api/posts',
  '/api/content',
  '/api/files',
  '/api/project-highlights',
];
let channel = null;
let stopTransport = null;
let sequence = 0;

/* === Erros e armazenamento === */
function failure(code, message, name = 'Error') {
  return Object.assign(new Error(message), { code, name });
}

function saveCache(key, value) {
  cache.delete(key);
  if (cache.size >= PUBLIC_CACHE_LIMITS.MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

function cachedResult(entry, category, warning) {
  const status = getPublicCacheStatus(entry?.updatedAt, Date.now(), category);
  if (!['fresh', 'stale'].includes(status)) return null;
  return {
    ...entry,
    source: 'cache',
    cacheStatus: status,
    requiresRevalidation: status === 'stale',
    ...(warning ? { warning } : {}),
  };
}

/* === Sinais públicos de invalidação === */
/* ----- Apenas prefixos públicos conhecidos atravessam abas ----- */
function safeSignal(value) {
  return (
    value &&
    typeof value === 'object' &&
    Object.keys(value).length === 2 &&
    publicPrefixes.includes(value.prefix) &&
    typeof value.id === 'string' &&
    /^[a-z\d.-]{1,100}$/i.test(value.id)
  );
}

function notify(prefix) {
  for (const listener of subscribers) {
    try {
      listener({ prefix });
    } catch {
      /* ----- Consumidor isolado ----- */
    }
  }
}

function invalidate(prefix) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
  for (const [key, task] of requests) {
    if (!key.startsWith(prefix)) continue;
    task.cacheable = false;
    requests.delete(key);
    task.controller.abort(
      failure('PUBLIC_DATA_INVALIDATED', 'Os dados públicos foram atualizados.'),
    );
  }
  notify(prefix);
}

function startTransport() {
  if (stopTransport || typeof window === 'undefined') return;
  const seen = new Set();
  const receive = (value) => {
    if (!safeSignal(value) || seen.has(value.id)) return;
    if (seen.size >= 64) seen.delete(seen.values().next().value);
    seen.add(value.id);
    invalidate(value.prefix);
  };
  try {
    if (typeof BroadcastChannel === 'function') {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event) => receive(event.data);
    }
  } catch {
    channel = null;
  }
  const storage = (event) => {
    if (event.key !== storageKey || !event.newValue) return;
    try {
      receive(JSON.parse(event.newValue));
    } catch {
      /* ----- Sinal inválido ignorado ----- */
    }
  };
  const focus = () => publicPrefixes.forEach(invalidate);
  window.addEventListener('storage', storage);
  window.addEventListener('focus', focus);
  stopTransport = () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener('focus', focus);
    channel?.close();
    channel = null;
    stopTransport = null;
  };
}

export function subscribePublicData(listener) {
  subscribers.add(listener);
  startTransport();
  return () => {
    subscribers.delete(listener);
    if (!subscribers.size) stopTransport?.();
  };
}

export function invalidatePublicData(prefix) {
  if (typeof prefix !== 'string' || !prefix) return;
  invalidate(prefix);
  const publicPrefix = publicPrefixes.find(
    (item) => prefix === item || prefix.startsWith(item + '?') || prefix.startsWith(item + '/'),
  );
  if (!publicPrefix || typeof window === 'undefined') return;
  const signal = {
    prefix: publicPrefix,
    id: `${Date.now().toString(36)}.${(++sequence).toString(36)}.${Math.random().toString(36).slice(2)}`,
  };
  let temporary;
  try {
    if (channel) channel.postMessage(signal);
    else if (typeof BroadcastChannel === 'function') {
      temporary = new BroadcastChannel(channelName);
      temporary.postMessage(signal);
    }
  } catch {
    /* ----- Fallback por storage e foco ----- */
  } finally {
    temporary?.close();
  }
  try {
    window.localStorage?.setItem(storageKey, JSON.stringify(signal));
  } catch {
    /* ----- Foco revalida sem persistência ----- */
  }
}

/* === Consulta compartilhada com cancelamento individual === */
export function requestPublicJson(url, { signal, force = false, category = 'default' } = {}) {
  const cancelled = () => failure('HTTP_CANCELLED', 'Operação cancelada.', 'AbortError');
  if (signal?.aborted) return Promise.reject(cancelled());
  if (typeof url !== 'string' || !url.trim())
    return Promise.reject(failure('VALIDATION_ERROR', 'Recurso público inválido.'));
  const previous = cache.get(url);
  if (
    previous &&
    resolvePublicCacheUsage({ updatedAt: previous.updatedAt, category, force }).useCache
  )
    return Promise.resolve(cachedResult(previous, category));

  let task = requests.get(url);
  if (!task || task.controller.signal.aborted) {
    const controller = new AbortController();
    task = { controller, users: 0, cacheable: true };
    const timeout = setTimeout(
      () => controller.abort(failure('HTTP_TIMEOUT', 'Tempo limite ao consultar o serviço.')),
      10000,
    );
    task.promise = (async () => {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const payload =
          typeof response.json === 'function'
            ? await response.json().catch((error) => {
                if (response.ok) throw error;
                return null;
              })
            : null;
        if (response.ok && typeof response.json !== 'function')
          throw failure('INTERNAL_ERROR', 'Resposta inválida do serviço.');
        if (controller.signal.aborted) throw controller.signal.reason ?? cancelled();
        const result = unwrapApiResponse(payload, {
          status: response.ok ? 200 : response.status || 503,
        });
        if (!response.ok || !result.ok) {
          const code = result.error?.code ?? 'SERVICE_UNAVAILABLE';
          throw failure(
            code,
            ['RATE_LIMITED', 'ACCESS_DENIED'].includes(code)
              ? 'Limite do serviço atingido. Tente mais tarde.'
              : 'Não foi possível consultar o serviço.',
          );
        }
        const value = { data: result.data, updatedAt: Date.now() };
        if (task.cacheable) saveCache(url, value);
        return { ...value, source: 'live', cacheStatus: 'fresh', requiresRevalidation: false };
      } catch (error) {
        if (
          !task.cacheable ||
          (controller.signal.aborted && controller.signal.reason?.code !== 'HTTP_TIMEOUT')
        )
          throw controller.signal.reason ?? error;
        const fallback =
          task.users > 0 &&
          cachedResult(
            cache.get(url),
            category,
            'Serviço indisponível. Exibindo dados salvos nesta sessão.',
          );
        if (fallback) return fallback;
        if (controller.signal.aborted) throw controller.signal.reason ?? error;
        throw error.code
          ? error
          : failure('HTTP_NETWORK_ERROR', 'Não foi possível consultar o serviço.');
      } finally {
        clearTimeout(timeout);
        if (requests.get(url) === task) requests.delete(url);
      }
    })();
    requests.set(url, task);
  }

  task.users++;
  return new Promise((resolve, reject) => {
    let finished = false;
    function finish(callback, value) {
      if (finished) return;
      finished = true;
      signal?.removeEventListener('abort', abort);
      task.users--;
      if (!task.users && requests.get(url) === task) task.controller.abort(cancelled());
      callback(value);
    }
    function abort() {
      finish(reject, cancelled());
    }
    task.promise.then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

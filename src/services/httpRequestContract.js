/* === Configuração HTTP === */
/* ----- Limites e tipos de operação ----- */
export const HTTP_DEFAULT_TIMEOUT = 15000;

export const HTTP_OPERATIONS = Object.freeze({
  READ: 'read',
  WRITE: 'write',
});

/* === Códigos de falha === */
/* ----- Resultados estáveis ----- */
export const HTTP_REQUEST_ERRORS = Object.freeze({
  INVALID_OPTIONS: 'INVALID_HTTP_OPTIONS',
  CANCELLED: 'HTTP_CANCELLED',
  TIMEOUT: 'HTTP_TIMEOUT',
  NETWORK: 'HTTP_NETWORK_ERROR',
  RESULT_UNKNOWN: 'HTTP_RESULT_UNKNOWN',
});

/* === Validação das opções === */
/* ----- Parâmetros da requisição ----- */
export function validateHttpRequestOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return {
      ok: false,
      code: HTTP_REQUEST_ERRORS.INVALID_OPTIONS,
    };
  }

  const { operation, timeout } = options;

  if (
    !Object.values(HTTP_OPERATIONS).includes(operation) ||
    !Number.isSafeInteger(timeout) ||
    timeout < 1000 ||
    timeout > 120000
  ) {
    return {
      ok: false,
      code: HTTP_REQUEST_ERRORS.INVALID_OPTIONS,
    };
  }

  return {
    ok: true,
    options: { operation, timeout },
  };
}

/* === Classificação de falhas === */
/* ----- Identificação do resultado ----- */
export function classifyHttpFailure({ operation, reason, requestSent = false } = {}) {
  if (!Object.values(HTTP_OPERATIONS).includes(operation)) {
    return {
      ok: false,
      code: HTTP_REQUEST_ERRORS.INVALID_OPTIONS,
    };
  }

  if (!['cancelled', 'timeout', 'network'].includes(reason)) {
    return {
      ok: false,
      code: HTTP_REQUEST_ERRORS.INVALID_OPTIONS,
    };
  }

  /* ----- Escritas com resultado incerto ----- */
  if (operation === HTTP_OPERATIONS.WRITE && requestSent === true) {
    return {
      ok: false,
      code: HTTP_REQUEST_ERRORS.RESULT_UNKNOWN,
      requiresReconciliation: true,
      reason,
    };
  }

  /* ----- Falhas sem confirmação de escrita ----- */
  const codes = {
    cancelled: HTTP_REQUEST_ERRORS.CANCELLED,
    timeout: HTTP_REQUEST_ERRORS.TIMEOUT,
    network: HTTP_REQUEST_ERRORS.NETWORK,
  };

  return {
    ok: false,
    code: codes[reason],
    requiresReconciliation: false,
    reason,
  };
}

/* === Política de repetição === */
/* ----- Elegibilidade de retry ----- */
export function resolveHttpRetryPolicy({ operation, failure, hasIdempotencyKey = false } = {}) {
  if (!Object.values(HTTP_OPERATIONS).includes(operation) || typeof failure !== 'string') {
    return {
      ok: false,
      code: HTTP_REQUEST_ERRORS.INVALID_OPTIONS,
    };
  }

  /* ----- Escritas de resultado incerto ----- */
  if (operation === HTTP_OPERATIONS.WRITE && failure === HTTP_REQUEST_ERRORS.RESULT_UNKNOWN) {
    return {
      ok: false,
      action: 'reconcile',
      requiresIdempotencyKey: true,
      hasIdempotencyKey,
    };
  }

  /* ----- Consultas sem efeitos colaterais ----- */
  if (operation === HTTP_OPERATIONS.READ) {
    return {
      ok: true,
      action: failure === HTTP_REQUEST_ERRORS.CANCELLED ? 'stop' : 'retry_allowed',
    };
  }

  /* ----- Escritas não confirmadas ----- */
  return {
    ok: false,
    action: 'check_previous_result',
    requiresIdempotencyKey: true,
    hasIdempotencyKey,
  };
}

/* === Execução HTTP cancelável === */
export async function executeJsonRequest(
  url,
  options = {},
  { operation = 'read', timeout = HTTP_DEFAULT_TIMEOUT, signal } = {},
) {
  const validation = validateHttpRequestOptions({ operation, timeout });
  const method = (options.method ?? 'GET').toUpperCase();
  if (!validation.ok || (operation === 'read') !== ['GET', 'HEAD'].includes(method))
    throw Object.assign(new Error('Opções HTTP inválidas.'), {
      code: HTTP_REQUEST_ERRORS.INVALID_OPTIONS,
    });
  const controller = new AbortController();
  let reason = 'network',
    sent = false;
  const abort = () => {
    reason = 'cancelled';
    controller.abort();
  };
  const timer = setTimeout(() => {
    reason = 'timeout';
    controller.abort();
  }, timeout);
  signal?.addEventListener('abort', abort, { once: true });
  try {
    if (signal?.aborted) abort();
    if (controller.signal.aborted) throw new Error('cancelled');
    sent = true;
    const response = await fetch(url, { ...options, method, signal: controller.signal });
    const payload = await response.json();
    if (controller.signal.aborted) throw new Error(reason);
    return { response, payload };
  } catch {
    const result = classifyHttpFailure({ operation, reason, requestSent: sent });
    throw Object.assign(
      new Error(
        result.requiresReconciliation
          ? 'O resultado da operação precisa ser verificado antes de reenviar.'
          : 'Não foi possível concluir a requisição.',
      ),
      result,
      { name: reason === 'cancelled' ? 'AbortError' : 'Error' },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

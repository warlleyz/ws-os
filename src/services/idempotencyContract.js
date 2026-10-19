/* === Configuração de idempotência === */
/* ----- Limites e identificação ----- */
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

export const IDEMPOTENCY_ERRORS = Object.freeze({
  INVALID_KEY: 'INVALID_IDEMPOTENCY_KEY',
  INVALID_OPERATION: 'INVALID_IDEMPOTENCY_OPERATION',
  INVALID_SCOPE: 'INVALID_IDEMPOTENCY_SCOPE',
  KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',
  IN_PROGRESS: 'IDEMPOTENCY_IN_PROGRESS',
  RESULT_UNKNOWN: 'IDEMPOTENCY_RESULT_UNKNOWN',
});

/* === Validação === */
/* ----- Chave de idempotência ----- */
export function isValidIdempotencyKey(key) {
  return (
    typeof key === 'string' &&
    key.length >= 16 &&
    key.length <= IDEMPOTENCY_KEY_MAX_LENGTH &&
    /^[a-zA-Z0-9_-]+$/.test(key)
  );
}

/* ----- Identificação da operação ----- */
function isValidOperationIdentifier(value) {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 100 &&
    /^[a-zA-Z][a-zA-Z0-9._:-]*$/.test(value)
  );
}

/* === Criação de solicitações === */
/* ----- Chave única para uma nova operação ----- */
export function createIdempotencyKey() {
  return crypto.randomUUID();
}

/* ----- Descritor da operação ----- */
export function createIdempotencyRequest(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { ok: false, code: IDEMPOTENCY_ERRORS.INVALID_KEY };
  const { key, operation, scope } = input;
  if (!isValidIdempotencyKey(key)) {
    return {
      ok: false,
      code: IDEMPOTENCY_ERRORS.INVALID_KEY,
    };
  }

  if (!isValidOperationIdentifier(operation)) {
    return {
      ok: false,
      code: IDEMPOTENCY_ERRORS.INVALID_OPERATION,
    };
  }

  if (!isValidOperationIdentifier(scope)) {
    return {
      ok: false,
      code: IDEMPOTENCY_ERRORS.INVALID_SCOPE,
    };
  }

  return {
    ok: true,
    request: {
      key,
      operation,
      scope,
    },
  };
}

/* === Estados de processamento === */
/* ----- Resultados possíveis ----- */
export const IDEMPOTENCY_STATES = Object.freeze({
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  UNKNOWN: 'unknown',
});

/* === Comparação de solicitações === */
/* ----- Reutilização da mesma operação ----- */
export function compareIdempotencyRequests(original, retry) {
  const first = createIdempotencyRequest(original);
  const second = createIdempotencyRequest(retry);

  if (!first.ok) return first;
  if (!second.ok) return second;

  const sameKey = first.request.key === second.request.key;
  const sameOperation = first.request.operation === second.request.operation;
  const sameScope = first.request.scope === second.request.scope;

  if (!sameKey || !sameOperation || !sameScope) {
    return {
      ok: false,
      code: IDEMPOTENCY_ERRORS.KEY_CONFLICT,
    };
  }

  return {
    ok: true,
    request: first.request,
  };
}

/* === Decisão de repetição === */
/* ----- Avaliação do estado anterior ----- */
export function resolveIdempotencyRetry(state) {
  switch (state) {
    case IDEMPOTENCY_STATES.COMPLETED:
      return { ok: true, action: 'return_previous_result' };

    case IDEMPOTENCY_STATES.IN_PROGRESS:
      return {
        ok: false,
        code: IDEMPOTENCY_ERRORS.IN_PROGRESS,
        action: 'wait',
      };

    case IDEMPOTENCY_STATES.FAILED:
      return { ok: true, action: 'check_retry_policy' };

    case IDEMPOTENCY_STATES.UNKNOWN:
      return {
        ok: false,
        code: IDEMPOTENCY_ERRORS.RESULT_UNKNOWN,
        action: 'reconcile',
      };

    default:
      return {
        ok: false,
        code: IDEMPOTENCY_ERRORS.RESULT_UNKNOWN,
        action: 'reject',
      };
  }
}

/* === Identidade do conteúdo sem persistência de dados pessoais === */
export async function createIdempotencyFingerprint(payload) {
  function canonical(value, depth = 0) {
    if (depth > 20) throw new Error('INVALID_IDEMPOTENCY_PAYLOAD');
    if (value === null || typeof value === 'boolean' || typeof value === 'string')
      return JSON.stringify(value);
    if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
    if (Array.isArray(value))
      return '[' + value.map((item) => canonical(item, depth + 1)).join(',') + ']';
    if (
      value &&
      typeof value === 'object' &&
      (Object.getPrototypeOf(value) === null ||
        Object.getPrototypeOf(Object.getPrototypeOf(value)) === null)
    )
      return (
        '{' +
        Object.keys(value)
          .sort()
          .map((key) => JSON.stringify(key) + ':' + canonical(value[key], depth + 1))
          .join(',') +
        '}'
      );
    throw new Error('INVALID_IDEMPOTENCY_PAYLOAD');
  }
  const bytes = new TextEncoder().encode(canonical(payload));
  if (bytes.length > 65536) throw new Error('INVALID_IDEMPOTENCY_PAYLOAD');
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/* === Reconciliação de registro persistido pelo servidor === */
export function resolveIdempotencyRecord(record, request, fingerprint) {
  const validation = createIdempotencyRequest(request);
  if (!validation.ok) return validation;
  if (!/^[a-f0-9]{64}$/.test(fingerprint ?? ''))
    return { ok: false, code: IDEMPOTENCY_ERRORS.KEY_CONFLICT, action: 'reject' };
  if (!record)
    return { ok: true, action: 'reserve_atomically', request: validation.request, fingerprint };
  const same = compareIdempotencyRequests(record.request, request);
  if (!same.ok || record.fingerprint !== fingerprint)
    return { ok: false, code: IDEMPOTENCY_ERRORS.KEY_CONFLICT, action: 'reject' };
  const result = resolveIdempotencyRetry(record.state);
  if (result.action === 'return_previous_result') {
    if (!Object.hasOwn(record, 'result'))
      return { ok: false, code: IDEMPOTENCY_ERRORS.RESULT_UNKNOWN, action: 'reconcile' };
    return { ...result, result: record.result };
  }
  return result;
}

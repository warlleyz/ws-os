import {
  API_ERROR_CODES,
  createApiError,
  createApiSuccess,
  validateApiResponse,
} from './apiContract';

/* === Adaptação de respostas legadas e envelopes === */
export function apiErrorCodeForStatus(status) {
  return (
    {
      400: API_ERROR_CODES.VALIDATION,
      401: API_ERROR_CODES.UNAUTHENTICATED,
      403: API_ERROR_CODES.ACCESS_DENIED,
      404: API_ERROR_CODES.NOT_FOUND,
      409: API_ERROR_CODES.CONFLICT,
      413: API_ERROR_CODES.QUOTA_EXCEEDED,
      429: API_ERROR_CODES.RATE_LIMITED,
      503: API_ERROR_CODES.SERVICE_UNAVAILABLE,
      504: API_ERROR_CODES.TIMEOUT,
    }[status] ??
    (status >= 500 ? API_ERROR_CODES.SERVICE_UNAVAILABLE : API_ERROR_CODES.INTERNAL_ERROR)
  );
}

export function adaptApiResponse(payload, { allowLegacy = true, status = 200 } = {}) {
  const hasEnvelope =
    payload !== null &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Object.hasOwn(payload, 'ok');
  if (hasEnvelope) {
    const validation = validateApiResponse(payload);
    if (!validation.ok)
      return createApiError(API_ERROR_CODES.INTERNAL_ERROR, 'Resposta inválida do serviço.');
    if (status >= 400 && payload.ok)
      return createApiError(apiErrorCodeForStatus(status), 'Não foi possível concluir a operação.');
    return validation.response;
  }
  if (
    status >= 400 ||
    (payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      Object.hasOwn(payload, 'error'))
  )
    return createApiError(apiErrorCodeForStatus(status), 'Não foi possível concluir a operação.');
  if (allowLegacy) return createApiSuccess(payload);
  return createApiError(API_ERROR_CODES.INTERNAL_ERROR, 'Formato de resposta não suportado.');
}

export function unwrapApiResponse(payload, options = {}) {
  const response = adaptApiResponse(payload, options);
  return response.ok
    ? { ok: true, data: response.data, meta: response.meta ?? null }
    : { ok: false, data: null, error: response.error, requestId: response.requestId ?? null };
}

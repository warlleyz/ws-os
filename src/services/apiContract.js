import { isContractData } from '../shared/utils/contractValidation.js';
/* === Códigos de erro === */
/* ----- Categorias compartilhadas ----- */
export const API_ERROR_CODES = Object.freeze({
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

/* === Validações auxiliares === */
/* ----- Identificador de solicitação ----- */
function isValidRequestId(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 200 &&
    /^[a-zA-Z0-9._:-]+$/.test(value)
  );
}

/* ----- Objeto simples ----- */
function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

/* === Resposta de sucesso === */
/* ----- Criação da resposta ----- */
export function createApiSuccess(data, meta) {
  if (!isContractData(data))
    return createApiError(API_ERROR_CODES.VALIDATION, 'Dados de resposta inválidos.');
  const response = {
    ok: true,
    data,
  };

  if (meta !== undefined) {
    if (!isPlainObject(meta) || !isContractData(meta)) {
      return {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION,
          message: 'Metadados de resposta inválidos.',
        },
      };
    }

    response.meta = meta;
  }

  return response;
}

/* === Resposta de erro === */
/* ----- Criação da resposta ----- */
export function createApiError(code, message, requestId) {
  const validCode = Object.values(API_ERROR_CODES).includes(code);

  const response = {
    ok: false,
    error: {
      code: validCode ? code : API_ERROR_CODES.INTERNAL_ERROR,
      message:
        typeof message === 'string' && message.trim()
          ? message
          : 'Não foi possível concluir a operação.',
    },
  };

  if (isValidRequestId(requestId)) {
    response.requestId = requestId;
  }

  return response;
}

/* === Validação de respostas === */
/* ----- Estrutura compartilhada ----- */
export function validateApiResponse(response) {
  if (!isPlainObject(response) || typeof response.ok !== 'boolean') {
    return {
      ok: false,
      code: 'INVALID_API_RESPONSE',
    };
  }

  /* ----- Resposta de sucesso ----- */
  if (response.ok) {
    if (
      !Object.hasOwn(response, 'data') ||
      !isContractData(response.data) ||
      Object.hasOwn(response, 'error') ||
      (response.meta !== undefined &&
        (!isPlainObject(response.meta) || !isContractData(response.meta)))
    ) {
      return {
        ok: false,
        code: 'INVALID_API_RESPONSE',
      };
    }

    return {
      ok: true,
      response,
    };
  }

  /* ----- Resposta de erro ----- */
  const error = response.error;

  if (
    !isPlainObject(error) ||
    typeof error.code !== 'string' ||
    !Object.values(API_ERROR_CODES).includes(error.code) ||
    typeof error.message !== 'string' ||
    !error.message.trim() ||
    Object.hasOwn(response, 'data') ||
    (response.requestId !== undefined && !isValidRequestId(response.requestId))
  ) {
    return {
      ok: false,
      code: 'INVALID_API_RESPONSE',
    };
  }

  return {
    ok: true,
    response,
  };
}

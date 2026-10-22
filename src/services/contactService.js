import { validInstant } from '../shared/utils/contractValidation';
import { submitPrivateRequest } from './backendDomainService';
import { validateRequestInput, resolveRequestDelivery } from './privateRequestContract';
import { isValidIdempotencyKey } from './idempotencyContract';

/* === Validação do formulário público === */
export function validateContact(value, now = Date.now()) {
  if (!value || typeof value !== 'object') throw new Error('Dados de contato inválidos.');
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const email = typeof value.email === 'string' ? value.email.trim() : '';
  const message = typeof value.message === 'string' ? value.message.trim() : '';
  if (name.length < 2 || name.length > 100)
    throw new Error('Informe um nome entre 2 e 100 caracteres.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Informe um e-mail válido.');
  if (message.length < 10 || message.length > 5000)
    throw new Error('A mensagem deve ter entre 10 e 5000 caracteres.');
  if (
    value.website ||
    value.consent !== true ||
    !Number.isFinite(value.startedAt) ||
    now - value.startedAt < 3000
  ) {
    throw new Error('Revise o formulário e confirme o envio dos dados.');
  }
  if (!['message', 'schedule'].includes(value.kind))
    throw new Error('Tipo de solicitação inválido.');
  let requestedAt = null;
  let timezone = null;
  if (value.kind === 'schedule') {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value.requestedAt) &&
      !validInstant(value.requestedAt)
    )
      throw new Error('Informe uma data futura dentro de um ano.');
    const date = new Date(value.requestedAt);
    const timestamp = date.getTime();
    if (!Number.isFinite(timestamp) || timestamp <= now || timestamp > now + 366 * 86400000) {
      throw new Error('Informe uma data futura dentro de um ano.');
    }
    /* ----- Não normalizar silenciosamente datas ou horários locais impossíveis ----- */
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value.requestedAt)) {
      const parts = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
      ];
      const original = value.requestedAt.split(/[-T:]/).map(Number);
      if (parts.some((part, index) => part !== original[index]))
        throw new Error('Informe uma data futura dentro de um ano.');
    }
    requestedAt = date.toISOString();
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  const parsed = validateRequestInput(
    { type: value.kind, name, email, message, requestedAt, timezone },
    now,
  );
  if (!parsed.ok) throw new Error('Revise o formulário e confirme o envio dos dados.');
  return { ...parsed.data, kind: value.kind };
}

/* === Pedido original: somente em memória na instância do formulário === */
export function prepareContactRequest(value, now = Date.now()) {
  const validated = validateContact(value, now);
  const data = {
    type: validated.type,
    name: validated.name,
    email: validated.email,
    message: validated.message,
    requestedAt: validated.requestedAt,
    timezone: validated.timezone,
  };
  return Object.freeze({
    ...data,
    consent: true,
    website: '',
    idempotencyKey: crypto.randomUUID(),
  });
}
export function isContactConfigured(siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY) {
  return typeof siteKey === 'string' && Boolean(siteKey.trim());
}

/* === Persistência e notificação são confirmações independentes === */
let sending = false;
let lastSent = 0;
let lastKey = null;
export async function sendContact(request, { signal, turnstileToken } = {}) {
  if (!isContactConfigured())
    throw Object.assign(
      new Error('O envio ainda não foi configurado. Utilize os canais profissionais disponíveis.'),
      { code: 'REQUESTS_NOT_CONFIGURED' },
    );
  if (
    !request ||
    !isValidIdempotencyKey(request.idempotencyKey) ||
    request.consent !== true ||
    request.website
  ) {
    throw Object.assign(new Error('Revise o formulário e confirme o envio dos dados.'), {
      code: 'INVALID_PRIVATE_REQUEST',
    });
  }
  if (typeof turnstileToken !== 'string' || !turnstileToken || turnstileToken.length > 2048) {
    throw Object.assign(new Error('Não foi possível concluir a verificação.'), {
      code: 'VERIFICATION_REQUIRED',
    });
  }
  if (signal?.aborted)
    throw Object.assign(new Error('Operação cancelada.'), { code: 'HTTP_CANCELLED' });
  if (sending || (request.idempotencyKey !== lastKey && Date.now() - lastSent < 60000)) {
    throw Object.assign(new Error('Aguarde um minuto antes de enviar novamente.'), {
      code: 'CONTACT_RATE_LIMITED',
    });
  }
  sending = true;
  try {
    const result = await submitPrivateRequest({ ...request, turnstileToken }, { signal });
    const delivery = resolveRequestDelivery(result);
    if (!delivery.ok || !delivery.persisted) {
      throw Object.assign(
        new Error('Envio não confirmado. Confira antes de reenviar para evitar duplicidade.'),
        { code: 'HTTP_RESULT_UNKNOWN' },
      );
    }
    lastSent = Date.now();
    lastKey = request.idempotencyKey;
    return { ...delivery, kind: request.type };
  } finally {
    sending = false;
  }
}

/* ----- Somente recusas comprovadamente anteriores à persistência liberam novo pedido ----- */
export function isContactResultUncertain(error) {
  return ![
    'REQUESTS_NOT_CONFIGURED',
    'PROTECTION_UNAVAILABLE',
    'VERIFICATION_REQUIRED',
    'VERIFICATION_FAILED',
    'INVALID_ORIGIN',
    'RATE_LIMITED',
    'CONTACT_RATE_LIMITED',
    'VALIDATION_ERROR',
    'ACCESS_DENIED',
    'NOT_FOUND',
    'QUOTA_EXCEEDED',
    'INVALID_BODY',
    'BODY_TOO_LARGE',
    'INVALID_CONTENT_TYPE',
    'INVALID_PRIVATE_REQUEST',
    'INVALID_REQUEST_SCHEDULE',
    'HTTP_CANCELLED',
  ].includes(error?.code);
}
export function contactErrorMessage(error) {
  if (['REQUESTS_NOT_CONFIGURED', 'PROTECTION_UNAVAILABLE'].includes(error?.code))
    return 'O envio ainda não foi configurado. Utilize os canais profissionais disponíveis.';
  if (['VERIFICATION_REQUIRED', 'VERIFICATION_FAILED'].includes(error?.code))
    return 'Não foi possível concluir a verificação.';
  if (error?.code === 'CONTACT_RATE_LIMITED') return 'Aguarde um minuto antes de enviar novamente.';
  if (
    ['VALIDATION_ERROR', 'INVALID_PRIVATE_REQUEST', 'INVALID_REQUEST_SCHEDULE'].includes(
      error?.code,
    )
  )
    return 'Revise o formulário e confirme o envio dos dados.';
  if (isContactResultUncertain(error))
    return 'Envio não confirmado. Confira antes de reenviar para evitar duplicidade.';
  return 'O serviço não confirmou o envio. Tente novamente mais tarde.';
}

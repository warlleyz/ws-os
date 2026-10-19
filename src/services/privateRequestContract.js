import {
  isRecord,
  validId,
  validText,
  validInstant,
  validTimezone,
  contractError,
} from '../shared/utils/contractValidation.js';
import { isValidRevision, prepareRevisionUpdate } from './revisionContract.js';
import { isValidIdempotencyKey } from './idempotencyContract.js';

/* === Solicitações privadas e retenção === */
export const REQUEST_STATUSES = Object.freeze([
  'new',
  'in_review',
  'awaiting_response',
  'responded',
  'completed',
  'archived',
]);
export const REQUEST_RETENTION_DAYS = 180;
const closed = (status) => ['completed', 'archived'].includes(status);

export function validateRequestInput(input, now = Date.now()) {
  if (
    !isRecord(input) ||
    !['message', 'schedule'].includes(input.type) ||
    !validText(input.name, 100, 2) ||
    !validText(input.email, 254, 3) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) ||
    !validText(input.message, 5000, 10)
  )
    return contractError('INVALID_PRIVATE_REQUEST');
  if (
    input.type === 'schedule' &&
    (!validInstant(input.requestedAt) ||
      Date.parse(input.requestedAt) <= now ||
      Date.parse(input.requestedAt) > now + 366 * 86400000 ||
      !validTimezone(input.timezone))
  )
    return contractError('INVALID_REQUEST_SCHEDULE');
  if (input.type === 'message' && (input.requestedAt != null || input.timezone != null))
    return contractError('INVALID_REQUEST_SCHEDULE');
  return {
    ok: true,
    data: {
      type: input.type,
      name: input.name.trim(),
      email: input.email.trim(),
      message: input.message.trim(),
      requestedAt: input.type === 'schedule' ? input.requestedAt : null,
      timezone: input.type === 'schedule' ? input.timezone : null,
    },
  };
}

export function validatePrivateRequest(record) {
  if (
    !isRecord(record) ||
    !validId(record.id) ||
    !REQUEST_STATUSES.includes(record.status) ||
    !isValidRevision(record.revision) ||
    !validInstant(record.createdAt) ||
    !validInstant(record.updatedAt) ||
    Date.parse(record.updatedAt) < Date.parse(record.createdAt) ||
    !isValidIdempotencyKey(record.idempotencyKey)
  )
    return contractError('INVALID_PRIVATE_REQUEST');
  const input = validateRequestInput(record, Date.parse(record.createdAt) - 1);
  if (!input.ok) return input;
  if (closed(record.status)) {
    const terminalDate = record.status === 'completed' ? record.completedAt : record.archivedAt;
    const dates = [record.completedAt, record.archivedAt].filter((value) => value != null);
    if (!validInstant(terminalDate) || dates.some((value) => !validInstant(value)))
      return contractError('INVALID_REQUEST_RETENTION');
    const date = dates.sort((a, b) => Date.parse(a) - Date.parse(b))[0];
    if (
      !validInstant(date) ||
      Date.parse(date) < Date.parse(record.createdAt) ||
      Date.parse(date) > Date.parse(record.updatedAt) ||
      !validInstant(record.retentionUntil) ||
      Date.parse(record.retentionUntil) !== Date.parse(date) + REQUEST_RETENTION_DAYS * 86400000
    )
      return contractError('INVALID_REQUEST_RETENTION');
  } else if (record.retentionUntil != null) return contractError('INVALID_REQUEST_RETENTION');
  return {
    ok: true,
    data: {
      ...input.data,
      id: record.id,
      status: record.status,
      revision: record.revision,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      completedAt: record.completedAt ?? null,
      archivedAt: record.archivedAt ?? null,
      retentionUntil: record.retentionUntil ?? null,
      idempotencyKey: record.idempotencyKey,
    },
  };
}

/* ----- Mudança explícita: não cria reuniões nem eventos públicos ----- */
export function transitionPrivateRequest(
  record,
  nextStatus,
  expectedRevision,
  { now = Date.now(), actorId } = {},
) {
  const validation = validatePrivateRequest(record);
  if (!validation.ok) return validation;
  const revision = prepareRevisionUpdate(expectedRevision, record.revision);
  if (!revision.ok) return revision;
  if (
    !REQUEST_STATUSES.includes(nextStatus) ||
    nextStatus === record.status ||
    !validId(actorId) ||
    !Number.isFinite(now) ||
    now < Date.parse(record.updatedAt)
  )
    return contractError('INVALID_REQUEST_TRANSITION');
  const date = new Date(now).toISOString();
  const data = {
    ...validation.data,
    status: nextStatus,
    revision: revision.nextRevision,
    updatedAt: date,
    completedAt: null,
    archivedAt: null,
    retentionUntil: null,
  };
  if (closed(nextStatus)) {
    if (closed(record.status)) {
      data.completedAt = record.completedAt ?? null;
      data.archivedAt = record.archivedAt ?? null;
      data.retentionUntil = record.retentionUntil;
    } else data.retentionUntil = new Date(now + REQUEST_RETENTION_DAYS * 86400000).toISOString();
    data[nextStatus === 'completed' ? 'completedAt' : 'archivedAt'] = date;
  }
  return {
    ok: true,
    data,
    change: {
      requestId: record.id,
      actorId,
      from: record.status,
      to: nextStatus,
      at: date,
      revision: data.revision,
    },
  };
}

export function isRequestRetentionExpired(record, now = Date.now()) {
  return (
    validatePrivateRequest(record).ok &&
    closed(record.status) &&
    Date.parse(record.retentionUntil) <= now
  );
}

/* ----- Persistência e aviso por e-mail são resultados independentes ----- */
export function resolveRequestDelivery({ requestId, persisted = false, email = 'not_sent' } = {}) {
  if (
    !['not_sent', 'confirmed', 'failed', 'unknown'].includes(email) ||
    (persisted && !validId(requestId))
  )
    return contractError('INVALID_REQUEST_DELIVERY');
  return {
    ok: true,
    persisted,
    requestId: persisted ? requestId : null,
    email,
    emailConfirmed: email === 'confirmed',
    requiresReconciliation: email === 'unknown',
    mayRepeatCreation: !persisted && email !== 'unknown',
  };
}

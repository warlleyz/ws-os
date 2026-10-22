import { notifyPrivateRequest } from '../_lib/requestNotification.js';
import { requireAdministrator } from './auth.js';
import { readBoundedJson, protectPublicWrite } from '../_lib/publicWriteProtection.js';
import { configured, database, domainFailure, json, single, pageOffset } from '../_lib/backend.js';
import {
  validateRequestInput,
  validatePrivateRequest,
  transitionPrivateRequest,
} from '../../src/services/privateRequestContract.js';
import {
  createIdempotencyFingerprint,
  isValidIdempotencyKey,
} from '../../src/services/idempotencyContract.js';
import { validId } from '../../src/shared/utils/contractValidation.js';

/* === Solicitações privadas: nenhuma leitura pública ou confirmação de reunião === */
export async function onRequest({ request, env }) {
  const administrative = new URL(request.url).pathname === '/api/admin/requests';
  if (administrative) {
    const access = await requireAdministrator(request, env);
    if (!access.authorized) return access.response;
  }
  if (env.REQUESTS_ENABLED !== 'true' || !configured(env, true))
    return json({ error: 'REQUESTS_NOT_CONFIGURED' }, 503);
  if (!(administrative ? ['GET', 'PATCH', 'DELETE'] : ['POST']).includes(request.method))
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  try {
    if (!administrative) {
      const input = await readBoundedJson(request, 40 * 1024);
      const parsed = validateRequestInput(input);
      if (
        !parsed.ok ||
        input.consent !== true ||
        input.website ||
        !isValidIdempotencyKey(input.idempotencyKey)
      )
        throw Error('INVALID_PRIVATE_REQUEST');
      const visitor = await protectPublicWrite(request, env, input.turnstileToken, 'requests');
      const fingerprint = await createIdempotencyFingerprint(parsed.data);
      const result = await database(env, 'rpc/submit_private_request', {
        method: 'POST',
        service: true,
        body: {
          request_data: parsed.data,
          request_key: input.idempotencyKey,
          request_fingerprint: fingerprint,
          request_visitor: visitor,
        },
      });
      if (result?.conflict) throw Error('CONFLICT');
      if (
        !validId(result?.id) ||
        !['new', 'in_review', 'awaiting_response', 'responded', 'completed', 'archived'].includes(
          result.status,
        )
      )
        throw Error('SERVICE_UNAVAILABLE');
      const email = await notifyPrivateRequest(env, result, parsed.data, visitor);
      /* ----- A persistência é a confirmação técnica. Entrega de e-mail não é reunião confirmada. ----- */
      return json(
        { requestId: result.id, status: result.status, persisted: true, email },
        result.reused ? 200 : 201,
      );
    }
    const token = request.headers.get('authorization');
    if (request.method === 'GET') {
      const offset = pageOffset(request);
      const rows = await database(
        env,
        'private_requests?select=id,record&order=created_at.desc,id.asc&limit=100&offset=' + offset,
        { token },
      );
      if (!Array.isArray(rows) || rows.some((row) => !validatePrivateRequest(row.record).ok))
        throw Error('SERVICE_UNAVAILABLE');
      return json({
        items: rows.map((row) => validatePrivateRequest(row.record).data),
        nextOffset: rows.length === 100 ? offset + 100 : null,
      });
    }
    const input = await readBoundedJson(request);
    if (!validId(input.id) || !Number.isSafeInteger(input.revision) || input.revision < 1)
      throw Error('INVALID_PRIVATE_REQUEST');
    const query =
      'private_requests?' +
      new URLSearchParams({ id: 'eq.' + input.id, select: 'id,record', limit: '1' });
    const row = single(await database(env, query, { token }), input.id);
    if (row.record?.revision !== input.revision) throw Error('CONFLICT');
    let record;
    if (request.method === 'PATCH') {
      const change = transitionPrivateRequest(row.record, input.status, input.revision, {
        actorId: 'administrator',
      });
      if (!change.ok)
        throw Error(
          change.code === 'REVISION_CONFLICT' ? 'CONFLICT' : 'INVALID_REQUEST_TRANSITION',
        );
      record = change.data;
    } else if (input.confirm !== true) throw Error('INVALID_CONFIRMATION');
    const rows = await database(
      env,
      'private_requests?' +
        new URLSearchParams({ id: 'eq.' + input.id, revision: 'eq.' + input.revision }),
      {
        method: request.method,
        token,
        body: record ? { record, revision: record.revision } : undefined,
      },
    );
    single(rows, input.id);
    return json(request.method === 'DELETE' ? { deleted: true, id: input.id } : { item: record });
  } catch (error) {
    return domainFailure(error);
  }
}

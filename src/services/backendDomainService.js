import {
  createAdminRequestScope,
  getAdminAccessToken,
  invalidateAdminSession,
} from './authService.js';
import { executeJsonRequest } from './httpRequestContract.js';
import { unwrapApiResponse } from './apiResponseAdapter.js';
import { invalidatePublicData } from './publicDataService.js';
import { validId } from '../shared/utils/contractValidation.js';

/* === Transporte compartilhado dos domínios; sem credenciais persistidas === */
async function requestDomain(
  path,
  {
    method = 'GET',
    body,
    signal,
    administrative = false,
    headers = {},
    binary = false,
    invalidate = [],
  } = {},
) {
  const scope = administrative ? createAdminRequestScope(signal) : null;
  if (scope && !scope.ok)
    throw Object.assign(new Error('UNAUTHENTICATED'), { code: 'UNAUTHENTICATED' });
  try {
    const result = await executeJsonRequest(
      path,
      {
        method,
        headers: {
          ...(binary ? {} : { 'Content-Type': 'application/json' }),
          ...(administrative ? { Authorization: 'Bearer ' + getAdminAccessToken() } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : binary ? body : JSON.stringify(body),
      },
      { operation: method === 'GET' ? 'read' : 'write', signal: scope?.signal ?? signal },
    );
    if (scope && [401, 403].includes(result.response.status)) invalidateAdminSession(scope.version);
    if (scope && !scope.isCurrent()) throw new DOMException('Operação cancelada.', 'AbortError');
    const parsed = unwrapApiResponse(result.payload, { status: result.response.status });
    if (!result.response.ok || !parsed.ok)
      throw Object.assign(new Error(parsed.error?.message ?? 'SERVICE_UNAVAILABLE'), {
        code: parsed.error?.code ?? 'SERVICE_UNAVAILABLE',
      });
    invalidate.forEach((prefix) => invalidatePublicData(prefix));
    return parsed.data;
  } catch (error) {
    if (error.code === 'HTTP_RESULT_UNKNOWN')
      invalidate.forEach((prefix) => invalidatePublicData(prefix));
    throw error;
  } finally {
    scope?.dispose();
  }
}
function resourcePath(id) {
  if (!validId(id)) throw Error('INVALID_FILE_ID');
  return '/api/admin/files?id=' + encodeURIComponent(id);
}

/* === Solicitações: idempotência pertence ao pedido original, não ao retry === */
export function submitPrivateRequest(input, { signal } = {}) {
  return requestDomain('/api/requests', { method: 'POST', body: input, signal });
}
export function getPrivateRequests({ signal, offset = 0 } = {}) {
  return requestDomain('/api/admin/requests?offset=' + encodeURIComponent(offset), {
    administrative: true,
    signal,
  });
}
export function updatePrivateRequest(input, { signal, remove = false } = {}) {
  return requestDomain('/api/admin/requests', {
    method: remove ? 'DELETE' : 'PATCH',
    body: input,
    signal,
    administrative: true,
  });
}

/* === Arquivos oficiais e vínculos; interface dos apps é responsabilidade posterior === */
const publicFiles = ['/api/files', '/api/content', '/api/posts'];
export function createOfficialFile(input, { signal } = {}) {
  return requestDomain('/api/admin/files', {
    method: 'POST',
    body: input,
    signal,
    administrative: true,
    invalidate: publicFiles,
  });
}
export function getOfficialFile(id, { signal } = {}) {
  return requestDomain(resourcePath(id), { signal, administrative: true });
}
export function uploadOfficialFile(id, revision, blob, { signal } = {}) {
  return requestDomain(resourcePath(id), {
    method: 'PUT',
    body: blob,
    binary: true,
    headers: { 'Content-Type': blob.type, 'If-Match': String(revision) },
    signal,
    administrative: true,
    invalidate: publicFiles,
  });
}
export function updateOfficialFile(id, revision, visibility, { signal, remove = false } = {}) {
  return requestDomain(resourcePath(id), {
    method: remove ? 'DELETE' : 'PATCH',
    body: remove ? undefined : { visibility },
    headers: { 'If-Match': String(revision), ...(remove ? { 'X-Confirm-Delete': 'true' } : {}) },
    signal,
    administrative: true,
    invalidate: publicFiles,
  });
}
export function setPostAttachment(input, { signal, remove = false } = {}) {
  return requestDomain('/api/admin/attachments', {
    method: remove ? 'DELETE' : 'POST',
    body: input,
    signal,
    administrative: true,
    invalidate: publicFiles,
  });
}

export function getOfficialFiles({ signal, offset = 0 } = {}) {
  return requestDomain('/api/admin/files?offset=' + encodeURIComponent(offset), {
    administrative: true,
    signal,
  });
}

/* === Moderação de rankings; projeção privada somente para administrador === */
export function getAdministrativeScores({ signal } = {}) {
  return requestDomain('/api/admin/rankings', { administrative: true, signal });
}
export function deleteAdministrativeScore(input, { signal } = {}) {
  return requestDomain('/api/admin/rankings', {
    method: 'DELETE',
    body: input,
    administrative: true,
    signal,
  });
}

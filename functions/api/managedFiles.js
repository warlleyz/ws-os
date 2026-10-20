import { requireAdministrator } from './auth.js';
import { readBoundedJson } from '../_lib/publicWriteProtection.js';
import { configured, database, domainFailure, json, single, pageOffset } from '../_lib/backend.js';
import { validateNoteAttachment } from '../../src/services/storage/noteAttachmentContract.js';
import { validId } from '../../src/shared/utils/contractValidation.js';

/* === Arquivos oficiais privados no R2; nunca arquivos pessoais === */
const projection = (row) => ({
  resourceId: row.id,
  name: row.name,
  mimeType: row.mime_type,
  size: row.size,
  state: row.state,
  visibility: row.visibility,
  revision: row.revision,
  purpose: row.purpose,
});
export function validateFileBytes(bytes, mime) {
  const starts = (signature) => signature.every((value, index) => bytes[index] === value);
  if (mime === 'application/pdf') return starts([37, 80, 68, 70, 45]);
  if (mime === 'image/png') return starts([137, 80, 78, 71, 13, 10, 26, 10]);
  if (mime === 'image/jpeg') return starts([255, 216, 255]);
  if (mime === 'image/webp')
    return starts([82, 73, 70, 70]) && [87, 69, 66, 80].every((v, i) => bytes[i + 8] === v);
  if (mime === 'text/plain') {
    try {
      return !new TextDecoder('utf-8', { fatal: true }).decode(bytes).includes('\0');
    } catch {
      return false;
    }
  }
  return false;
}
async function readBytes(request, size) {
  const reader = request.body?.getReader();
  if (!reader) throw Error('INVALID_FILE');
  let count = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > size || count > 10485760) throw Error('BODY_TOO_LARGE');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (count !== size) throw Error('INVALID_FILE_SIZE');
  const bytes = new Uint8Array(count);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
async function readObject(row, env) {
  const object = await env.OFFICIAL_FILES.get(row.object_key);
  if (!object || object.size !== row.size) throw Error('SERVICE_UNAVAILABLE');
  return new Response(object.body, {
    headers: {
      'Content-Type': row.mime_type,
      'Content-Length': String(row.size),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.name)}`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
export async function onRequest({ request, env }) {
  const url = new URL(request.url),
    admin = url.pathname === '/api/admin/files';
  if (admin) {
    const access = await requireAdministrator(request, env);
    if (!access.authorized) return access.response;
  }
  if (env.MANAGED_FILES_ENABLED !== 'true' || !env.OFFICIAL_FILES || !configured(env, true))
    return json({ error: 'FILES_NOT_CONFIGURED' }, 503);
  if (!(admin ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] : ['GET']).includes(request.method))
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  try {
    const token = request.headers.get('authorization');
    const id = url.searchParams.get('id');
    if (admin && request.method === 'GET' && id === null) {
      const offset = pageOffset(request);
      const rows = await database(
        env,
        'official_files?order=updated_at.desc,id.asc&limit=100&offset=' + offset,
        { token },
      );
      if (!Array.isArray(rows)) throw Error('SERVICE_UNAVAILABLE');
      return json({
        items: rows.map(projection),
        nextOffset: rows.length === 100 ? offset + 100 : null,
      });
    }
    if (!admin) {
      if (id === null) {
        const rows = await database(env, 'rpc/list_public_files', {
          method: 'POST',
          service: true,
          body: {},
        });
        if (!Array.isArray(rows)) throw Error('SERVICE_UNAVAILABLE');
        return json({ items: rows.map(projection) });
      }
      if (!validId(id)) throw Error('INVALID_FILE_ID');
      const rows = await database(env, 'rpc/read_public_file', {
        method: 'POST',
        service: true,
        body: { target_id: id },
      });
      if (!Array.isArray(rows) || rows.length !== 1) throw Error('NOT_FOUND');
      const row = single(rows, id);
      return await readObject(row, env);
    }
    if (request.method === 'POST') {
      const input = await readBoundedJson(request);
      if (
        !validId(input.id) ||
        !['catalog', 'attachment'].includes(input.purpose) ||
        !['private', 'public'].includes(input.visibility) ||
        !validateNoteAttachment({
          resourceId: input.id,
          name: input.name,
          mimeType: input.mimeType,
          size: input.size,
        }).ok ||
        input.size < 1 ||
        /[\r\n]/.test(input.name)
      )
        throw Error('INVALID_FILE_METADATA');
      const row = {
        id: input.id,
        name: input.name,
        mime_type: input.mimeType,
        size: input.size,
        visibility: input.visibility,
        purpose: input.purpose,
        state: 'pending',
        revision: 1,
        object_key: 'official/' + crypto.randomUUID(),
      };
      const created = single(
        await database(env, 'official_files', { method: 'POST', token, body: row }),
        input.id,
      );
      return json({ item: projection(created) }, 201);
    }
    if (!validId(id)) throw Error('INVALID_FILE_ID');
    const query = 'official_files?' + new URLSearchParams({ id: 'eq.' + id, limit: '1' });
    const row = single(await database(env, query, { token }), id);
    if (request.method === 'GET') {
      if (url.searchParams.get('download') === '1') {
        if (row.state !== 'available') throw Error('CONFLICT');
        return await readObject(row, env);
      }
      return json({ item: projection(row) });
    }
    const revision = Number(request.headers.get('If-Match'));
    if (
      !request.headers.has('If-Match') ||
      !Number.isSafeInteger(revision) ||
      revision < 1 ||
      revision >= Number.MAX_SAFE_INTEGER - 2 ||
      row.revision !== revision
    )
      throw Error('CONFLICT');
    const mutate = async (body) =>
      single(
        await database(
          env,
          'official_files?' +
            new URLSearchParams({ id: 'eq.' + id, revision: 'eq.' + row.revision }),
          { method: 'PATCH', token, body },
        ),
        id,
      );
    if (request.method === 'PUT') {
      if (!['pending', 'uploading'].includes(row.state)) throw Error('CONFLICT');
      const bytes = await readBytes(request, row.size);
      if (
        request.headers.get('Content-Type') !== row.mime_type ||
        !validateFileBytes(bytes, row.mime_type)
      )
        throw Error('INVALID_FILE_TYPE');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), (v) =>
        v.toString(16).padStart(2, '0'),
      ).join('');
      if (row.state === 'pending') {
        const locked = await mutate({ state: 'uploading', revision: revision + 1 });
        row.revision = locked.revision;
      }
      const written = await env.OFFICIAL_FILES.put(row.object_key, bytes, {
        onlyIf: new Headers({ 'If-None-Match': '*' }),
        sha256: digest,
        httpMetadata: { contentType: row.mime_type },
        customMetadata: { sha256 },
      });
      const object = written ?? (await env.OFFICIAL_FILES.head(row.object_key));
      if (!object || object.size !== row.size || object.customMetadata?.sha256 !== sha256)
        throw Error('CONFLICT');
      const saved = await mutate({ state: 'available', revision: row.revision + 1, sha256 });
      return json({ item: projection(saved) });
    }
    if (request.method === 'PATCH') {
      const input = await readBoundedJson(request);
      if (!['private', 'public'].includes(input.visibility) || row.state !== 'available')
        throw Error('INVALID_FILE_VISIBILITY');
      const saved = await mutate({ visibility: input.visibility, revision: revision + 1 });
      return json({ item: projection(saved) });
    }
    if (request.headers.get('X-Confirm-Delete') !== 'true') throw Error('INVALID_CONFIRMATION');
    if (row.state === 'uploading') throw Error('CONFLICT');
    if (row.state !== 'deleting') {
      const locked = await mutate({ state: 'deleting', revision: revision + 1 });
      row.revision = locked.revision;
    }
    await env.OFFICIAL_FILES.delete(row.object_key);
    const saved = await mutate({ state: 'deleted', revision: row.revision + 1 });
    return json({ item: projection(saved) });
  } catch (error) {
    return domainFailure(error);
  }
}

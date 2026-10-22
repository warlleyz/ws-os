
import { requireAdministrator } from './auth.js';
import { readBoundedJson } from '../_lib/publicWriteProtection.js';
import {
  configured,
  database,
  domainFailure,
  json,
  single,
  pageOffset,
} from '../_lib/backend.js';
import {
  isStorageConfigured,
  uploadOfficialFile,
  downloadOfficialFile,
  deleteOfficialFile,
  inspectOfficialFile,
} from '../_lib/supabaseStorage.js';
import { validateNoteAttachment } from '../../src/services/storage/noteAttachmentContract.js';
import { validId } from '../../src/shared/utils/contractValidation.js';

/* === Configuração dos arquivos oficiais === */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ADMIN_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const PUBLIC_METHODS = ['GET'];

/* === Projeção de metadados === */
/* ----- Informações permitidas ao consumidor ----- */
function projectFile(row) {
  return {
    resourceId: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: row.size,
    state: row.state,
    visibility: row.visibility,
    revision: row.revision,
    purpose: row.purpose,
  };
}

/* === Validação de arquivos === */
/* ----- Verificação da assinatura e do conteúdo ----- */
export function validateFileBytes(bytes, mime) {
  const startsWith = (signature) =>
    signature.every((value, index) => bytes[index] === value);

  if (mime === 'application/pdf') {
    return startsWith([37, 80, 68, 70, 45]);
  }

  if (mime === 'image/png') {
    return startsWith([137, 80, 78, 71, 13, 10, 26, 10]);
  }

  if (mime === 'image/jpeg') {
    return startsWith([255, 216, 255]);
  }

  if (mime === 'image/webp') {
    return (
      startsWith([82, 73, 70, 70]) &&
      [87, 69, 66, 80].every(
        (value, index) => bytes[index + 8] === value,
      )
    );
  }

  if (mime === 'text/plain') {
    try {
      return !new TextDecoder('utf-8', { fatal: true })
        .decode(bytes)
        .includes('\0');
    } catch {
      return false;
    }
  }

  return false;
}

/* ----- Leitura limitada do corpo binário ----- */
async function readFileBytes(request, expectedSize) {
  const reader = request.body?.getReader();

  if (!reader) {
    throw Error('INVALID_FILE');
  }

  let totalSize = 0;
  const chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalSize += value.byteLength;

      if (
        totalSize > expectedSize ||
        totalSize > MAX_FILE_SIZE
      ) {
        throw Error('BODY_TOO_LARGE');
      }

      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => { });
    reader.releaseLock();
  }

  if (totalSize !== expectedSize) {
    throw Error('INVALID_FILE_SIZE');
  }

  const bytes = new Uint8Array(totalSize);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

/* ----- Cálculo de integridade SHA-256 ----- */
async function calculateSha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(
    new Uint8Array(digest),
    (value) => value.toString(16).padStart(2, '0'),
  ).join('');
}

/* === Comunicação com o banco de dados === */
/* ----- Consulta de um recurso oficial ----- */
async function findOfficialFile(env, id, token) {
  const query =
    'official_files?' +
    new URLSearchParams({
      id: `eq.${id}`,
      limit: '1',
    });

  const rows = await database(env, query, { token });

  if (Array.isArray(rows) && rows.length === 0) {
    throw Error('NOT_FOUND');
  }

  return single(rows, id);
}

/* ----- Atualização condicional da revisão ----- */
async function updateOfficialFile(env, row, token, changes) {
  const query =
    'official_files?' +
    new URLSearchParams({
      id: `eq.${row.id}`,
      revision: `eq.${row.revision}`,
    });

  const updated = single(
    await database(env, query, {
      method: 'PATCH',
      token,
      body: changes,
    }),
    row.id,
  );

  row.revision = updated.revision;

  return updated;
}

/* === Leitura segura de arquivos === */
/* ----- Download mediado pelo Worker ----- */
async function readOfficialFile(row, env) {
  const response = await downloadOfficialFile(
    env,
    row.object_key,
  );

  const bytes = new Uint8Array(
    await response.arrayBuffer(),
  );

  if (bytes.byteLength !== row.size) {
    throw Error('SERVICE_UNAVAILABLE');
  }

  const checksum = await calculateSha256(bytes);

  if (checksum !== row.sha256) {
    throw Error('SERVICE_UNAVAILABLE');
  }

  return new Response(bytes, {
    headers: {
      'Content-Type': row.mime_type,
      'Content-Length': String(row.size),
      'Content-Disposition':
        `attachment; filename*=UTF-8''${encodeURIComponent(row.name)}`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}

/* === Consulta pública === */
/* ----- Catálogo de recursos publicados ----- */
async function listPublicFiles(env) {
  const rows = await database(
    env,
    'rpc/list_public_files',
    {
      method: 'POST',
      service: true,
      body: {},
    },
  );

  if (!Array.isArray(rows)) {
    throw Error('SERVICE_UNAVAILABLE');
  }

  return json({
    items: rows.map(projectFile),
  });
}

/* ----- Leitura de recurso publicável ----- */
async function getPublicFile(env, id) {
  if (!validId(id)) {
    throw Error('INVALID_FILE_ID');
  }

  const rows = await database(
    env,
    'rpc/read_public_file',
    {
      method: 'POST',
      service: true,
      body: {
        target_id: id,
      },
    },
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw Error('NOT_FOUND');
  }

  const row = single(rows, id);

  return readOfficialFile(row, env);
}

/* === Administração de arquivos === */
/* ----- Listagem paginada ----- */
async function listAdminFiles(request, env, token) {
  const offset = pageOffset(request);

  const rows = await database(
    env,
    'official_files?order=updated_at.desc,id.asc&limit=100&offset=' +
    offset,
    { token },
  );

  if (!Array.isArray(rows)) {
    throw Error('SERVICE_UNAVAILABLE');
  }

  return json({
    items: rows.map(projectFile),
    nextOffset: rows.length === 100 ? offset + 100 : null,
  });
}

/* ----- Criação de metadados ----- */
async function createOfficialFile(request, env, token) {
  const input = await readBoundedJson(request);

  const validation = validateNoteAttachment({
    resourceId: input.id,
    name: input.name,
    mimeType: input.mimeType,
    size: input.size,
  });

  if (
    !validId(input.id) ||
    !['catalog', 'attachment'].includes(input.purpose) ||
    !['private', 'public'].includes(input.visibility) ||
    !validation.ok ||
    input.size < 1 ||
    /[\r\n]/.test(input.name)
  ) {
    throw Error('INVALID_FILE_METADATA');
  }

  const row = {
    id: input.id,
    name: input.name,
    mime_type: input.mimeType,
    size: input.size,
    visibility: input.visibility,
    purpose: input.purpose,
    state: 'pending',
    revision: 1,
    object_key: `official/${crypto.randomUUID()}`,
  };

  const created = single(
    await database(env, 'official_files', {
      method: 'POST',
      token,
      body: row,
    }),
    input.id,
  );

  return json({
    item: projectFile(created),
  }, 201);
}

/* ----- Conferência da revisão solicitada ----- */
function validateRevision(request, row) {
  const rawRevision = request.headers.get('If-Match');
  const revision = Number(rawRevision);

  if (
    rawRevision === null ||
    !Number.isSafeInteger(revision) ||
    revision < 1 ||
    revision >= Number.MAX_SAFE_INTEGER - 2 ||
    row.revision !== revision
  ) {
    throw Error('CONFLICT');
  }

  return revision;
}

/* === Upload e reconciliação === */
/* ----- Conferência do objeto armazenado ----- */
async function verifyStoredFile(env, row, expectedSha256) {
  const metadata = await inspectOfficialFile(
    env,
    row.object_key,
  );

  if (!metadata.exists) {
    return false;
  }

  if (
    metadata.size !== row.size ||
    metadata.mimeType !== row.mime_type
  ) {
    throw Error('CONFLICT');
  }

  const response = await downloadOfficialFile(
    env,
    row.object_key,
  );

  const bytes = new Uint8Array(
    await response.arrayBuffer(),
  );

  if (bytes.byteLength !== row.size) {
    throw Error('CONFLICT');
  }

  const actualSha256 = await calculateSha256(bytes);

  if (actualSha256 !== expectedSha256) {
    throw Error('CONFLICT');
  }

  return true;
}

/* ----- Envio e confirmação no PostgreSQL ----- */
async function uploadFile(request, env, row, token) {
  if (!['pending', 'uploading'].includes(row.state)) {
    throw Error('CONFLICT');
  }

  const bytes = await readFileBytes(request, row.size);

  if (
    request.headers.get('Content-Type') !== row.mime_type ||
    !validateFileBytes(bytes, row.mime_type)
  ) {
    throw Error('INVALID_FILE_TYPE');
  }

  const sha256 = await calculateSha256(bytes);

  if (row.state === 'pending') {
    await updateOfficialFile(env, row, token, {
      state: 'uploading',
      revision: row.revision + 1,
    });
  }

  let verified;

  try {
    await uploadOfficialFile(env, {
      objectKey: row.object_key,
      bytes,
      mimeType: row.mime_type,
    });

    verified = await verifyStoredFile(
      env,
      row,
      sha256,
    );
  } catch (error) {
    if (
      error.message !== 'CONFLICT' &&
      error.message !== 'STORAGE_RESULT_UNKNOWN'
    ) {
      throw error;
    }

    verified = await verifyStoredFile(
      env,
      row,
      sha256,
    );
  }

  if (!verified) {
    throw Error('STORAGE_RESULT_UNKNOWN');
  }

  const updated = await updateOfficialFile(
    env,
    row,
    token,
    {
      state: 'available',
      revision: row.revision + 1,
      sha256,
    },
  );

  return json({
    item: projectFile(updated),
  });
}

/* === Visibilidade dos recursos === */
/* ----- Publicação e privatização ----- */
async function updateFileVisibility(request, env, row, token) {
  if (row.state !== 'available') {
    throw Error('INVALID_FILE_VISIBILITY');
  }

  const input = await readBoundedJson(request);

  if (!['private', 'public'].includes(input.visibility)) {
    throw Error('INVALID_FILE_VISIBILITY');
  }

  const updated = await updateOfficialFile(
    env,
    row,
    token,
    {
      visibility: input.visibility,
      revision: row.revision + 1,
    },
  );

  return json({
    item: projectFile(updated),
  });
}

/* === Exclusão de arquivos === */
/* ----- Remoção física e confirmação no banco ----- */
async function removeOfficialFile(request, env, row, token) {
  if (
    request.headers.get('X-Confirm-Delete') !== 'true'
  ) {
    throw Error('INVALID_CONFIRMATION');
  }

  if (row.state === 'uploading') {
    throw Error('CONFLICT');
  }

  if (row.state !== 'deleting') {
    await updateOfficialFile(env, row, token, {
      state: 'deleting',
      revision: row.revision + 1,
    });
  }

  try {
    await deleteOfficialFile(
      env,
      row.object_key,
    );
  } catch (error) {
    if (error.message !== 'STORAGE_RESULT_UNKNOWN') {
      throw error;
    }
  }

  const metadata = await inspectOfficialFile(
    env,
    row.object_key,
  );

  if (metadata.exists) {
    throw Error('STORAGE_RESULT_UNKNOWN');
  }

  const updated = await updateOfficialFile(
    env,
    row,
    token,
    {
      state: 'deleted',
      revision: row.revision + 1,
    },
  );

  return json({
    item: projectFile(updated),
  });
}

/* === Roteamento das requisições === */
/* ----- Operações administrativas ----- */
async function handleAdminRequest(request, env, url) {
  const token = request.headers.get('authorization');
  const id = url.searchParams.get('id');

  if (request.method === 'GET' && id === null) {
    return listAdminFiles(request, env, token);
  }

  if (request.method === 'POST') {
    return createOfficialFile(request, env, token);
  }

  if (!validId(id)) {
    throw Error('INVALID_FILE_ID');
  }

  const row = await findOfficialFile(env, id, token);

  if (request.method === 'GET') {
    if (url.searchParams.get('download') === '1') {
      if (row.state !== 'available') {
        throw Error('CONFLICT');
      }

      return readOfficialFile(row, env);
    }

    return json({
      item: projectFile(row),
    });
  }

  validateRevision(request, row);

  if (request.method === 'PUT') {
    return uploadFile(request, env, row, token);
  }

  if (request.method === 'PATCH') {
    return updateFileVisibility(request, env, row, token);
  }

  return removeOfficialFile(request, env, row, token);
}

/* ----- Operações públicas ----- */
async function handlePublicRequest(env, url) {
  const id = url.searchParams.get('id');

  if (id === null) {
    return listPublicFiles(env);
  }

  return getPublicFile(env, id);
}

/* === Entrada principal da API === */
/* ----- Autorização, configuração e execução ----- */
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const admin = url.pathname === '/api/admin/files';

  if (admin) {
    const access = await requireAdministrator(
      request,
      env,
    );

    if (!access.authorized) {
      return access.response;
    }
  }

  if (
    env.MANAGED_FILES_ENABLED !== 'true' ||
    !configured(env, true) ||
    !isStorageConfigured(env)
  ) {
    return json({
      error: 'FILES_NOT_CONFIGURED',
    }, 503);
  }

  const allowedMethods = admin
    ? ADMIN_METHODS
    : PUBLIC_METHODS;

  if (!allowedMethods.includes(request.method)) {
    return json({
      error: 'METHOD_NOT_ALLOWED',
    }, 405);
  }

  try {
    if (admin) {
      return await handleAdminRequest(
        request,
        env,
        url,
      );
    }

    return await handlePublicRequest(
      env,
      url,
    );
  } catch (error) {
    return domainFailure(error);
  }
}
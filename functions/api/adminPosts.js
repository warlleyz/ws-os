import { requireAdministrator } from './auth.js';

const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

async function readLimitedJson(request, maxBytes = 80 * 1024) {
  if (!request.body) {
    throw new SyntaxError('EMPTY_BODY');
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        throw new RangeError('BODY_TOO_LARGE');
      }

      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export async function onRequestGet({ request, env }) {
  const access = await requireAdministrator(request, env);

  if (!access.authorized) {
    return access.response;
  }

  const authorization = request.headers.get('authorization');

  if (
    !/^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') ||
    !env.SUPABASE_ANON_KEY
  ) {
    return json({ error: 'Supabase não configurado.' }, 503);
  }

  try {
    const url = new URL('/rest/v1/posts', env.SUPABASE_URL);

    url.search = new URLSearchParams({
      select:
        'id,title,summary,body,tags,status,published_at,updated_at,post_attachments(official_files(id,name,mime_type,size))',
      order: 'published_at.desc.nullslast',
      limit: '200',
    });

    const response = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: authorization,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return json({ error: 'Não foi possível consultar as publicações.' }, 502);
    }

    const rows = await response.json();

    if (!Array.isArray(rows)) {
      return json({ error: 'Resposta inválida do Supabase.' }, 502);
    }

    return json({
      posts: rows.map((row) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        body: row.body,
        tags: row.tags,
        status: row.status,
        updatedAt: row.updated_at,
        attachments: (row.post_attachments ?? []).map(({ official_files: file }) => ({
          resourceId: file.id,
          name: file.name,
          mimeType: file.mime_type,
          size: file.size,
        })),
      })),
    });
  } catch {
    return json({ error: 'Serviço de publicações indisponível.' }, 502);
  }
}

export async function onRequestCreate({ request, env }) {
  const access = await requireAdministrator(request, env);

  if (!access.authorized) {
    return access.response;
  }

  if (Number(request.headers.get('content-length')) > 80 * 1024) {
    return json({ error: 'Conteúdo muito grande.' }, 413);
  }

  let input;

  try {
    input = await readLimitedJson(request);
  } catch (error) {
    if (error instanceof RangeError && error.message === 'BODY_TOO_LARGE') {
      return json({ error: 'Conteúdo muito grande.' }, 413);
    }

    return json({ error: 'Dados inválidos.' }, 400);
  }

  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const body = typeof input?.body === 'string' ? input.body.trim() : '';
  const summary = typeof input?.summary === 'string' ? input.summary.trim() : '';

  if (
    (input?.id !== undefined &&
      (typeof input.id !== 'string' || !/^[a-z\d_-]{1,80}$/i.test(input.id))) ||
    typeof input?.title !== 'string' ||
    typeof input?.body !== 'string' ||
    typeof input?.summary !== 'string' ||
    !title ||
    !body ||
    title.length > 160 ||
    summary.length > 500 ||
    body.length > 10000 ||
    !Array.isArray(input.tags) ||
    input.tags.length > 12 ||
    input.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 40)
  ) {
    return json({ error: 'Dados da publicação inválidos.' }, 400);
  }

  const id = input.id ?? crypto.randomUUID();
  const url = new URL('/rest/v1/posts', env.SUPABASE_URL);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: request.headers.get('authorization'),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        title: { 'pt-BR': title },
        summary: { 'pt-BR': summary },
        body: { 'pt-BR': body },
        tags: [...new Set(input.tags.map((tag) => tag.trim()))],
        status: 'draft',
        published_at: null,
      }),
      signal: AbortSignal.timeout(10000),
    });

    /* ----- Reenvio da mesma criação não duplica a publicação ----- */
    if (response.status === 409 && input.id) {
      const lookup = new URL('/rest/v1/posts', env.SUPABASE_URL);
      lookup.search = new URLSearchParams({
        id: 'eq.' + id,
        select: 'id,title,summary,body,tags,status',
        limit: '1',
      });
      const previousResponse = await fetch(lookup, {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: request.headers.get('authorization'),
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!previousResponse.ok)
        return json({ error: 'Não foi possível conferir o rascunho anterior.' }, 502);
      const previous = (await previousResponse.json())?.[0];
      const same =
        previous?.id === id &&
        previous.status === 'draft' &&
        previous.title?.['pt-BR'] === title &&
        previous.summary?.['pt-BR'] === summary &&
        previous.body?.['pt-BR'] === body &&
        JSON.stringify(previous.tags) ===
          JSON.stringify([...new Set(input.tags.map((tag) => tag.trim()))]);
      return same
        ? json({ success: true, id })
        : json({ error: 'Confira o rascunho já existente antes de salvar novas alterações.' }, 409);
    }
    if (!response.ok) {
      return json({ error: 'Não foi possível salvar o rascunho.' }, 502);
    }

    const rows = await response.json();
    const created = rows?.[0];

    if (!created || created.id !== id) {
      return json({ error: 'Resposta inválida ao salvar rascunho.' }, 502);
    }

    return json({ success: true, id: created.id }, 201);
  } catch {
    return json({ error: 'Serviço de publicações indisponível.' }, 502);
  }
}

export async function onRequestUpdate({ request, env }) {
  const access = await requireAdministrator(request, env);

  if (!access.authorized) {
    return access.response;
  }

  if (Number(request.headers.get('content-length')) > 80 * 1024) {
    return json({ error: 'Conteúdo muito grande.' }, 413);
  }

  let input;

  try {
    input = await readLimitedJson(request);
  } catch (error) {
    if (error instanceof RangeError && error.message === 'BODY_TOO_LARGE') {
      return json({ error: 'Conteúdo muito grande.' }, 413);
    }

    return json({ error: 'Dados inválidos.' }, 400);
  }

  if (
    typeof input?.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(input.updatedAt)) ||
    !/^[a-z\d_-]{1,80}$/i.test(input.id) ||
    typeof input.title !== 'string' ||
    typeof input.summary !== 'string' ||
    typeof input.body !== 'string' ||
    !input.title.trim() ||
    !input.body.trim() ||
    input.title.length > 160 ||
    input.summary.length > 500 ||
    input.body.length > 10000 ||
    !Array.isArray(input.tags) ||
    input.tags.length > 12 ||
    input.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 40)
  ) {
    return json({ error: 'Dados da publicação inválidos.' }, 400);
  }

  const token = request.headers.get('authorization');

  try {
    const url = new URL('/rest/v1/posts', env.SUPABASE_URL);

    url.search = new URLSearchParams({
      select: 'id,title,summary,body',
      id: `eq.${input.id}`,
      limit: '1',
    });

    const existingResponse = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: token,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!existingResponse.ok) {
      return json({ error: 'Não foi possível consultar a publicação.' }, 502);
    }

    const existingRows = await existingResponse.json();
    const existing = existingRows?.[0];

    if (!existing) {
      return json({ error: 'Publicação não encontrada.' }, 404);
    }

    const update = {
      title: {
        ...(typeof existing.title === 'object' && existing.title !== null ? existing.title : {}),
        'pt-BR': input.title.trim(),
      },
      summary: {
        ...(typeof existing.summary === 'object' && existing.summary !== null
          ? existing.summary
          : {}),
        'pt-BR': input.summary.trim(),
      },
      body: {
        ...(typeof existing.body === 'object' && existing.body !== null ? existing.body : {}),
        'pt-BR': input.body.trim(),
      },
      tags: [...new Set(input.tags.map((tag) => tag.trim()))],
    };

    const updateUrl = new URL('/rest/v1/posts', env.SUPABASE_URL);

    updateUrl.search = new URLSearchParams({
      id: `eq.${input.id}`,
      updated_at: `eq.${input.updatedAt}`,
      select: 'id,status,updated_at',
    });

    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: token,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return json({ error: 'Não foi possível atualizar a publicação.' }, 502);
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length !== 1) {
      return json(
        {
          error:
            'Esta publicação foi modificada em outra janela. Atualize a lista antes de editar novamente.',
        },
        409,
      );
    }

    if (rows[0].id !== input.id || !['draft', 'published'].includes(rows[0].status)) {
      return json({ error: 'Resposta inválida ao atualizar a publicação.' }, 502);
    }

    return json({
      success: true,
      id: rows[0].id,
      status: rows[0].status,
    });
  } catch {
    return json({ error: 'Serviço de publicações indisponível.' }, 502);
  }
}

export async function onRequestChangeStatus({ request, env }) {
  const access = await requireAdministrator(request, env);

  if (!access.authorized) {
    return access.response;
  }

  const MAX_BODY_BYTES = 1024;

  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    return json({ error: 'Requisição muito grande.' }, 413);
  }

  let input;

  try {
    if (!request.body) {
      return json({ error: 'Dados inválidos.' }, 400);
    }

    const reader = request.body.getReader();
    const chunks = [];
    let size = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        size += value.byteLength;

        if (size > MAX_BODY_BYTES) {
          return json({ error: 'Requisição muito grande.' }, 413);
        }

        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }

    const bytes = new Uint8Array(size);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return json({ error: 'Dados inválidos.' }, 400);
  }

  if (
    typeof input?.id !== 'string' ||
    !/^[a-z\d_-]{1,80}$/i.test(input.id) ||
    !['publish', 'unpublish'].includes(input.action) ||
    typeof input.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(input.updatedAt))
  ) {
    return json({ error: 'Operação inválida.' }, 400);
  }

  const publishing = input.action === 'publish';

  const previousStatus = publishing ? 'draft' : 'published';
  const nextStatus = publishing ? 'published' : 'draft';

  const url = new URL('/rest/v1/posts', env.SUPABASE_URL);

  url.search = new URLSearchParams({
    id: `eq.${input.id}`,
    status: `eq.${previousStatus}`,
    updated_at: `eq.${input.updatedAt}`,
    select: 'id,status,published_at,updated_at',
  });

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: request.headers.get('authorization'),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: nextStatus,
        published_at: publishing ? new Date().toISOString() : null,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return json(
        {
          error: 'Não foi possível alterar o status da publicação.',
        },
        502,
      );
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length !== 1) {
      return json(
        {
          error:
            'Esta publicação foi modificada desde a última consulta. ' +
            'Atualize a lista antes de tentar novamente.',
        },
        409,
      );
    }

    return json({
      success: true,
      id: rows[0].id,
      status: rows[0].status,
      updatedAt: rows[0].updated_at,
    });
  } catch {
    return json(
      {
        error: 'Serviço de publicações indisponível.',
      },
      502,
    );
  }
}

export async function onRequestDelete({ request, env }) {
  const access = await requireAdministrator(request, env);

  if (!access.authorized) {
    return access.response;
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const updatedAt = url.searchParams.get('updatedAt');
  if (updatedAt !== null && !Number.isFinite(Date.parse(updatedAt)))
    return json({ error: 'Revisão inválida.' }, 400);

  if (!id || !/^[a-z\d_-]{1,80}$/i.test(id)) {
    return json({ error: 'Identificador inválido.' }, 400);
  }

  const supabaseUrl = new URL('/rest/v1/posts', env.SUPABASE_URL);

  supabaseUrl.search = new URLSearchParams({
    id: `eq.${id}`,
    ...(updatedAt ? { updated_at: `eq.${updatedAt}` } : {}),
    select: 'id',
  });

  try {
    const response = await fetch(supabaseUrl, {
      method: 'DELETE',
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: request.headers.get('authorization'),
        Prefer: 'return=representation',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return json(
        {
          error: 'Não foi possível excluir a publicação.',
        },
        502,
      );
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== id) {
      return json(
        {
          error: updatedAt
            ? 'A publicação foi modificada. Atualize a lista antes de excluir.'
            : 'Publicação não encontrada ou não excluída.',
        },
        updatedAt ? 409 : 404,
      );
    }

    return json({ success: true, id });
  } catch {
    return json(
      {
        error: 'Serviço de publicações indisponível.',
      },
      502,
    );
  }
}

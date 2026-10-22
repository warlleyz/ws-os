
/* === Configurações dos serviços de domínio === */
/* ----- Tempo limite das requisições ----- */
const REQUEST_TIMEOUT_MS = 10000;

/* === Respostas HTTP === */
/* ----- Respostas JSON padronizadas ----- */
export const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

/* === Configuração do Supabase === */
/* ----- Validação das variáveis de ambiente ----- */
export function configured(env, service = false) {
  return (
    /^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(env.SUPABASE_URL ?? '') &&
    Boolean(service ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY)
  );
}

/* === Comunicação com o banco de dados === */
/* ----- Requisições ao Supabase PostgREST ----- */
export async function database(
  env,
  path,
  { method = 'GET', body, token, service = false } = {},
) {
  if (!configured(env, service)) {
    throw Error('SERVICE_UNAVAILABLE');
  }

  /* ----- Seleção da credencial ----- */
  const key = service
    ? env.SUPABASE_SERVICE_ROLE_KEY
    : env.SUPABASE_ANON_KEY;

  /* ----- Execução da requisição ----- */
  const response = await fetch(
    new URL('/rest/v1/' + path, env.SUPABASE_URL),
    {
      method,
      headers: {
        apikey: key,
        Authorization: token ?? `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  /* ----- Tratamento de falhas HTTP ----- */
  if (!response.ok) {
    throw Error(
      response.status === 409
        ? 'CONFLICT'
        : 'SERVICE_UNAVAILABLE',
    );
  }

  /* ----- Retorno dos dados ----- */
  return response.json();
}

/* === Tratamento de erros de domínio === */
/* ----- Conversão dos códigos internos em respostas HTTP ----- */
export function domainFailure(error) {
  const code =
    typeof error?.message === 'string'
      ? error.message
      : 'SERVICE_UNAVAILABLE';

  let status = 503;

  if (code === 'CONFLICT') {
    status = 409;
  } else if (code === 'NOT_FOUND') {
    status = 404;
  } else if (code === 'ACCESS_DENIED') {
    status = 403;
  } else if (code === 'RATE_LIMITED') {
    status = 429;
  } else if (code === 'BODY_TOO_LARGE') {
    status = 413;
  } else if (code.startsWith('INVALID_')) {
    status = 400;
  } else if (code.startsWith('VERIFICATION_')) {
    status = 403;
  }

  /* ----- Resposta pública segura ----- */
  return json(
    {
      error: status === 503
        ? 'SERVICE_UNAVAILABLE'
        : code,
    },
    status,
  );
}

/* === Validação de registros === */
/* ----- Confirmação de resultado único ----- */
export function single(rows, id) {
  if (
    !Array.isArray(rows) ||
    rows.length !== 1 ||
    rows[0]?.id !== id
  ) {
    throw Error('CONFLICT');
  }

  return rows[0];
}

/* === Paginação administrativa === */
/* ----- Validação do deslocamento solicitado ----- */
export function pageOffset(request) {
  const raw =
    new URL(request.url).searchParams.get('offset') ?? '0';

  if (!/^\d{1,7}$/.test(raw) || Number(raw) > 1000000) {
    throw Error('INVALID_OFFSET');
  }

  return Number(raw);
}

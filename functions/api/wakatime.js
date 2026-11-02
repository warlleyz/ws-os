/* === ESTATÍSTICAS PÚBLICAS DO WAKATIME === */
function entries(items) {
  if (!Array.isArray(items)) return undefined;
  return items
    .filter(
      (item) =>
        typeof item?.name === 'string' &&
        Number.isFinite(item.total_seconds) &&
        item.total_seconds >= 0,
    )
    .slice(0, 100)
    .map((item) => ({ name: item.name.slice(0, 100), total_seconds: item.total_seconds }));
}

export async function onRequestGet({ request, env }) {
  const json = (body, status = 200) =>
    Response.json(body, {
      status,
      headers: {
        'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  const range = new URL(request.url).searchParams.get('range') ?? 'last_7_days';
  if (!['last_7_days', 'last_30_days', 'last_year'].includes(range))
    return json({ error: 'Período inválido.' }, 400);
  const token = env.WAKATIME_ACCESS_TOKEN;
  if (!token)
    return json(
      { error: 'WakaTime requer configuração do token OAuth.', code: 'WAKATIME_AUTH_REQUIRED' },
      503,
    );
  try {
    const response = await fetch('https://api.wakatime.com/api/v1/users/current/stats/' + range, {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(10000),
    });
    if ([401, 403].includes(response.status))
      return json(
        {
          error: 'Token do WakaTime inválido ou sem permissão de leitura.',
          code: 'WAKATIME_AUTH_REQUIRED',
        },
        503,
      );
    if (!response.ok) return json({ error: 'Métricas temporariamente indisponíveis.' }, 502);
    const { data } = await response.json();
    if (
      response.status === 202 ||
      (data?.is_up_to_date === false && !Number.isFinite(data?.total_seconds))
    )
      return json(
        { error: 'O WakaTime ainda está processando este período.', code: 'WAKATIME_PROCESSING' },
        503,
      );
    if (
      !Number.isFinite(data?.total_seconds) ||
      data.total_seconds < 0 ||
      !Array.isArray(data.languages)
    )
      return json({ error: 'Resposta do serviço inválida.' }, 502);
    const publicData = {
      total_seconds: data.total_seconds,
      languages: entries(data.languages),
      start: typeof data.start === 'string' ? data.start : null,
      end: typeof data.end === 'string' ? data.end : null,
      is_up_to_date: data.is_up_to_date === true,
    };
    for (const key of ['editors', 'operating_systems', 'categories']) {
      const value = entries(data[key]);
      if (value) publicData[key] = value;
    }
    /* ----- Somente projetos explicitamente públicos ----- */
    const allowed = new Set(
      (env.WAKATIME_PUBLIC_PROJECTS ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    );
    if (allowed.size && Array.isArray(data.projects))
      publicData.projects = entries(data.projects).filter((item) => allowed.has(item.name));
    return json({ data: publicData });
  } catch {
    return json({ error: 'Métricas temporariamente indisponíveis.' }, 502);
  }
}

// Cloudflare Pages Function. Nunca importar este módulo no cliente.
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
  if (!env.WAKATIME_API_KEY) return json({ error: 'WakaTime ainda não configurado.' }, 503);
  try {
    const response = await fetch(`https://wakatime.com/api/v1/users/current/stats/${range}`, {
      headers: { Authorization: `Basic ${btoa(`${env.WAKATIME_API_KEY}:`)}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return json({ error: 'Métricas temporariamente indisponíveis.' }, 502);
    const { data } = await response.json();
    if (!Number.isFinite(data?.total_seconds) || !Array.isArray(data.languages))
      return json({ error: 'Resposta do serviço inválida.' }, 502);
    return json({
      data: {
        total_seconds: Math.max(0, data.total_seconds),
        languages: data.languages
          .filter(
            (item) =>
              typeof item.name === 'string' &&
              Number.isFinite(item.total_seconds) &&
              item.total_seconds >= 0,
          )
          .slice(0, 100)
          .map((item) => ({ name: item.name.slice(0, 100), total_seconds: item.total_seconds })),
        start: typeof data.start === 'string' ? data.start : null,
        end: typeof data.end === 'string' ? data.end : null,
        is_up_to_date: data.is_up_to_date === true,
      },
    });
  } catch {
    return json({ error: 'Métricas temporariamente indisponíveis.' }, 502);
  }
}

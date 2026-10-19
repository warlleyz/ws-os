import { requestPublicJson } from './publicDataService';
import { portfolio } from '../content/portfolioContent';

export async function fetchWakatimeStats(range, options = {}) {
  if (!['last_7_days', 'last_30_days', 'last_year'].includes(range))
    throw new Error('Período inválido.');
  const endpoint = portfolio.wakatimeProxy;
  if (!endpoint || !/^\/api\/[a-z\d/_-]+$/i.test(endpoint))
    throw new Error('WakaTime ainda não configurado.');
  const result = await requestPublicJson(`${endpoint}?range=${range}`, {
    category: 'statistics',
    ...options,
  });
  const data = result.data?.data;
  if (
    !Number.isFinite(data?.total_seconds) ||
    data.total_seconds < 0 ||
    !Array.isArray(data.languages)
  )
    throw new Error('Resposta do serviço inválida.');
  return {
    ...result,
    data: {
      totalSeconds: data.total_seconds,
      start: data.start ?? null,
      end: data.end ?? null,
      upToDate: data.is_up_to_date !== false,
      languages: data.languages
        .filter(
          (item) =>
            typeof item.name === 'string' &&
            Number.isFinite(item.total_seconds) &&
            item.total_seconds >= 0,
        )
        .map((item) => ({ name: item.name, seconds: item.total_seconds })),
    },
  };
}

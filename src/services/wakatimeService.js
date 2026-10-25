import { requestPublicJson } from './publicDataService';
import { portfolio } from '../content/portfolioContent';

/* === Configuração === */
const VALID_RANGES = new Set([
  'last_7_days',
  'last_30_days',
  'last_year',
]);

function normalizeTimeEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .filter(
      (item) =>
        item &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        Number.isFinite(item.total_seconds) &&
        item.total_seconds >= 0,
    )
    .map((item) => ({
      name: item.name.trim(),
      seconds: item.total_seconds,
    }))
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name));
}

/* === Consulta pública === */
export async function fetchWakatimeStats(range, options = {}) {

  /* ----- Validação do período ----- */
  if (!VALID_RANGES.has(range)) {
    throw new Error('Período inválido.');
  }

  /* ----- Validação do endpoint ----- */
  const endpoint = portfolio.wakatimeProxy;

  if (!endpoint || !/^\/api\/[a-z\d/_-]+$/i.test(endpoint)) {
    throw new Error('WakaTime ainda não configurado.');
  }

  /* ----- Requisição ----- */
  const result = await requestPublicJson(`${endpoint}?range=${range}`, {
    category: 'statistics',
    ...options,
  });

  const data = result.data?.data;

  /* ----- Verificação da resposta obrigatória ----- */
  if (
    !Number.isFinite(data?.total_seconds) ||
    data.total_seconds < 0 ||
    !Array.isArray(data.languages)
  ) {
    throw new Error('Resposta do serviço inválida.');
  }

  /* ----- Campos opcionais ----- */
  const languages = normalizeTimeEntries(data.languages);
  const editors = normalizeTimeEntries(data.editors);
  const operatingSystems = normalizeTimeEntries(data.operating_systems);
  const categories = normalizeTimeEntries(data.categories);
  const projects = normalizeTimeEntries(data.projects);

  /* ----- Retorno padronizado ----- */
  return {
    ...result,

    data: {

      /* Dados já existentes */
      totalSeconds: data.total_seconds,
      start: data.start ?? null,
      end: data.end ?? null,
      upToDate: data.is_up_to_date !== false,
      languages,

      /* Novas métricas */
      editors,
      operatingSystems,
      categories,
      projects,

      /* Disponibilidade dos conjuntos de dados */
      available: {
        languages: Array.isArray(data.languages),
        editors: Array.isArray(data.editors),
        operatingSystems: Array.isArray(data.operating_systems),
        categories: Array.isArray(data.categories),
        projects: Array.isArray(data.projects),
      },
    },
  };
}
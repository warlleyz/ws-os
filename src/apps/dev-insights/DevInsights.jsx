
import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Code2,
  GitBranch,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

import { portfolio } from '../../content/portfolioContent';
import { useLocale } from '../../shared/i18n/i18n';
import { fetchGithubPortfolio } from '../../services/githubService';
import { fetchWakatimeStats } from '../../services/wakatimeService';
import { fetchGithubContributions } from '../../services/githubContributionsService';
import usePublicResource from '../../shared/hooks/usePublicResource';
import Select from '../../shared/components/Select';
import ContributionCity from './ContributionCity';
import RepositoryOrbit from './RepositoryOrbit';

import './DevInsights.css';

/* === Textos da interface === */
const COPY = {
  'pt-BR': {
    eyebrow: 'DESENVOLVIMENTO / ANALYTICS',
    title: 'Dev Insights',
    subtitle: 'Uma visão interativa da minha atividade de desenvolvimento.',
    period: 'Período',
    seven: '7 dias',
    thirty: '30 dias',
    year: '365 dias',
    refresh: 'Atualizar',
    updating: 'Atualizando',
    repositories: 'Repositórios',
    stars: 'Estrelas',
    followers: 'Seguidores',
    recent: 'Repos. ativos',
    github: 'Ecossistema GitHub',
    githubDescription: 'Indicadores obtidos dos repositórios públicos.',
    languages: 'Linguagens dos projetos',
    languagesDescription: 'Distribuição pela linguagem principal dos repositórios.',
    all: 'Todas',
    projects: 'projetos',
    project: 'projeto',
    unavailable: 'Dados indisponíveis',
    empty: 'Nenhum dado disponível.',
    loading: 'Consultando dados...',
    retry: 'Tentar novamente',
    updated: 'Atualizado em',
    cached: 'Dados em cache',
    limited: 'O catálogo está limitado aos primeiros 1.000 repositórios.',
    languageInfo: 'A distribuição representa repositórios, não linhas de código.',
    githubInfo: 'O período afeta apenas o indicador de repositórios ativos.',
    wakatime: 'Atividade de programação',
    wakatimeDescription: 'Tempo registrado pelo WakaTime.',
    hours: 'Horas registradas',
    hoursUnit: 'h',
    codingLanguages: 'Tempo por linguagem',
    wakaMissing: 'WakaTime não configurado.',
    wakaUpdating: 'O WakaTime ainda está processando este período.',
    wakaInfo: 'Os valores representam somente a atividade capturada pelo WakaTime.',
    openGithub: 'Ver perfil no GitHub',
    cityIntro: 'Visualização tridimensional da atividade diária.',
    cityUnavailable: 'Aguardando integração do calendário de contribuições.',
    source: 'Fonte',
    registered: 'Registrado entre',
    and: 'e',
    unknown: 'Sem informação',
    details: 'Detalhes',
    selectLanguage: 'Selecione uma linguagem para destacar sua participação.',
  },
  en: {
    eyebrow: 'DEVELOPMENT / ANALYTICS',
    title: 'Dev Insights',
    subtitle: 'An interactive overview of my development activity.',
    period: 'Period',
    seven: '7 days',
    thirty: '30 days',
    year: '365 days',
    refresh: 'Refresh',
    updating: 'Updating',
    repositories: 'Repositories',
    stars: 'Stars',
    followers: 'Followers',
    recent: 'Active repos',
    github: 'GitHub ecosystem',
    githubDescription: 'Insights from public repositories.',
    languages: 'Project languages',
    languagesDescription: 'Distribution by primary repository language.',
    all: 'All',
    projects: 'projects',
    project: 'project',
    unavailable: 'Data unavailable',
    empty: 'No data available.',
    loading: 'Fetching data...',
    retry: 'Try again',
    updated: 'Updated on',
    cached: 'Cached data',
    limited: 'The catalog is limited to the first 1,000 repositories.',
    languageInfo: 'Distribution represents repositories, not lines of code.',
    githubInfo: 'The period only affects the active repositories indicator.',
    wakatime: 'Coding activity',
    wakatimeDescription: 'Time tracked by WakaTime.',
    hours: 'Tracked hours',
    hoursUnit: 'h',
    codingLanguages: 'Time by language',
    wakaMissing: 'WakaTime is not configured.',
    wakaUpdating: 'WakaTime is still processing this period.',
    wakaInfo: 'Values represent only activity tracked by WakaTime.',
    openGithub: 'View GitHub profile',
    cityIntro: 'Three-dimensional visualization of daily activity.',
    cityUnavailable: 'Waiting for contribution calendar integration.',
    source: 'Source',
    registered: 'Tracked between',
    and: 'and',
    unknown: 'Unknown',
    details: 'Details',
    selectLanguage: 'Select a language to highlight its share.',
  },
};

const PERIOD_DAYS = {
  last_7_days: 7,
  last_30_days: 30,
  last_year: 365,
};

/* === Componentes de apresentação === */
function SectionHeading({ icon: Icon, title, description, action }) {
  return (
    <div className="ws-insights__section-heading">
      <div className="ws-insights__section-title">
        <span className="ws-insights__section-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="ws-insights__metric">
      <div className="ws-insights__metric-top">
        <span>{label}</span>
        <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function ResourceStatus({ resource, copy, onRetry }) {
  if (resource.status === 'loading' && !resource.data) {
    return (
      <div className="ws-insights__resource-state" role="status">
        <RefreshCw className="ws-insights__spin" size={20} />
        <span>{copy.loading}</span>
      </div>
    );
  }

  if (resource.status === 'error') {
    return (
      <div className="ws-insights__resource-state" role="status">
        <Activity size={22} />
        <strong>{copy.unavailable}</strong>
        <p>{resource.error || copy.unavailable}</p>
        <button type="button" onClick={onRetry}>
          {copy.retry}
        </button>
      </div>
    );
  }

  return null;
}

/* === Explorador de atividade WakaTime === */
const WAKA_VIEWS = [
  { key: 'languages', pt: 'Linguagens', en: 'Languages' },
  { key: 'editors', pt: 'Editores', en: 'Editors' },
  { key: 'operatingSystems', pt: 'Sistemas', en: 'Systems' },
  { key: 'categories', pt: 'Categorias', en: 'Categories' },
  { key: 'projects', pt: 'Projetos', en: 'Projects' },
];

const WAKA_COLORS = [
  '#59a6ff',
  '#a58aff',
  '#42cdb1',
  '#edaf74',
  '#df84bd',
  '#8eca80',
];

function formatCodingTime(seconds, locale) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';

  const hours = seconds / 3600;

  if (hours >= 1) {
    return `${hours.toLocaleString(locale, {
      maximumFractionDigits: 1,
    })} h`;
  }

  return `${Math.round(seconds / 60).toLocaleString(locale)} min`;
}

/* === Formatação de datas do WakaTime === */
function formatWakaDate(value, locale) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function WakaTimeExplorer({ data, locale }) {
  const [activeView, setActiveView] = useState('languages');
  const [selectedName, setSelectedName] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const isEnglish = locale === 'en';

  const labels = isEnglish
    ? {
      total: 'Tracked coding time',
      breakdown: 'Activity breakdown',
      unavailable: 'This metric is not provided by the data source.',
      empty: 'No activity recorded in this category.',
      selection: 'Selected activity',
      share: 'Share of this category',
      entries: 'items',
      showMore: 'Show all',
      showLess: 'Show less',
      noSelection: 'Select an item to explore its details.',
      period: 'Recorded period',
      top: 'Most used language',
    }
    : {
      total: 'Tempo de programação',
      breakdown: 'Distribuição da atividade',
      unavailable: 'Esta métrica não foi fornecida pela fonte.',
      empty: 'Nenhuma atividade registrada nesta categoria.',
      selection: 'Atividade selecionada',
      share: 'Participação nesta categoria',
      entries: 'itens',
      showMore: 'Ver todos',
      showLess: 'Ver menos',
      noSelection: 'Selecione um item para explorar seus detalhes.',
      period: 'Período registrado',
      top: 'Linguagem mais utilizada',
    };

  const availableViews = WAKA_VIEWS.filter(
    (view) => data.available?.[view.key] !== false,
  );

  const currentView =
    availableViews.find((view) => view.key === activeView) ??
    availableViews[0] ??
    WAKA_VIEWS[0];

  const items = data[currentView.key] ?? [];
  const visibleItems = expanded ? items : items.slice(0, 6);
  const totalCategorySeconds = items.reduce(
    (sum, item) => sum + item.seconds,
    0,
  );

  const selected =
    items.find((item) => item.name === selectedName) ??
    items[0] ??
    null;

  const selectedPercentage =
    selected && totalCategorySeconds > 0
      ? (selected.seconds / totalCategorySeconds) * 100
      : 0;

  const topLanguage = data.languages?.[0] ?? null;

  return (
    <div className="ws-waka2">
      {/* === Indicadores superiores === */}
      <div className="ws-waka2__summary">
        <div className="ws-waka2__total">
          <span>{labels.total}</span>
          <strong>
            {(data.totalSeconds / 3600).toLocaleString(locale, {
              maximumFractionDigits: 1,
            })}
            <small>h</small>
          </strong>
        </div>

        <div className="ws-waka2__summary-detail">
          <span>{labels.top}</span>
          <strong>{topLanguage?.name ?? '—'}</strong>
          <small>
            {topLanguage
              ? formatCodingTime(topLanguage.seconds, locale)
              : '—'}
          </small>
        </div>

        <div className="ws-waka2__summary-detail">
          <span>{labels.period}</span>

          <strong className="ws-waka2__period-value">
            {formatWakaDate(data.start, locale)}
          </strong>

          <small>
            {locale === 'en' ? 'to ' : 'até '}
            {formatWakaDate(data.end, locale)}
          </small>
        </div>
      </div>

      {/* === Categorias disponíveis === */}
      <div
        className="ws-waka2__tabs"
        role="group"
        aria-label={labels.breakdown}
      >
        {availableViews.map((view) => (
          <button
            key={view.key}
            type="button"
            className={
              currentView.key === view.key ? 'is-active' : ''
            }
            aria-pressed={currentView.key === view.key}
            onClick={() => {
              setActiveView(view.key);
              setSelectedName(null);
              setExpanded(false);
            }}
          >
            {isEnglish ? view.en : view.pt}
          </button>
        ))}
      </div>

      {/* === Visualização detalhada === */}
      <div className="ws-waka2__workspace">
        <div className="ws-waka2__chart">
          <div className="ws-waka2__chart-heading">
            <div>
              <strong>
                {isEnglish ? currentView.en : currentView.pt}
              </strong>
              <span>{labels.breakdown}</span>
            </div>
            <small>
              {items.length} {labels.entries}
            </small>
          </div>

          {data.available?.[currentView.key] === false ? (
            <p className="ws-waka2__empty">{labels.unavailable}</p>
          ) : items.length === 0 ? (
            <p className="ws-waka2__empty">{labels.empty}</p>
          ) : (
            <>
              <div className="ws-waka2__list">
                {visibleItems.map((item, index) => {
                  const percentage =
                    totalCategorySeconds > 0
                      ? (item.seconds / totalCategorySeconds) * 100
                      : 0;

                  const color = WAKA_COLORS[
                    index % WAKA_COLORS.length
                  ];

                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={[
                        'ws-waka2__item',
                        selected?.name === item.name ? 'is-active' : '',
                      ].filter(Boolean).join(' ')}
                      style={{
                        '--waka-color': color,
                        '--waka-width': `${percentage}%`,
                      }}
                      aria-pressed={selected?.name === item.name}
                      onClick={() => setSelectedName(item.name)}
                    >
                      <span className="ws-waka2__item-heading">
                        <span className="ws-waka2__item-name">
                          <i />
                          {item.name}
                        </span>
                        <strong>
                          {formatCodingTime(item.seconds, locale)}
                        </strong>
                      </span>

                      <span className="ws-waka2__track">
                        <span className="ws-waka2__fill" />
                      </span>
                    </button>
                  );
                })}
              </div>

              {items.length > 6 && (
                <button
                  className="ws-waka2__expand"
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? labels.showLess : labels.showMore}
                  <span>{items.length}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* === Detalhes da seleção === */}
        <aside className="ws-waka2__details" aria-live="polite">
          <span className="ws-waka2__details-label">
            {labels.selection}
          </span>

          {selected ? (
            <>
              <strong className="ws-waka2__selected-name">
                {selected.name}
              </strong>

              <div className="ws-waka2__selected-time">
                {formatCodingTime(selected.seconds, locale)}
              </div>

              <div className="ws-waka2__share">
                <span>{labels.share}</span>
                <strong>
                  {selectedPercentage.toLocaleString(locale, {
                    maximumFractionDigits: 1,
                  })}
                  %
                </strong>
              </div>

              <div className="ws-waka2__share-track">
                <div
                  style={{
                    width: `${selectedPercentage}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <p className="ws-waka2__empty">
              {labels.noSelection}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

/* === Aplicativo Dev Insights === */
export default function DevInsights() {
  const locale = useLocale();
  const copy = COPY[locale] || COPY['pt-BR'];
  const [range, setRange] = useState('last_7_days');

  const githubLoad = useCallback(
    (options) => fetchGithubPortfolio(portfolio.githubUser, options),
    [],
  );

  const wakaLoad = useCallback(
    (options) => fetchWakatimeStats(range, options),
    [range],
  );

  const github = usePublicResource(
    githubLoad,
    'github',
    Boolean(portfolio.githubUser),
  );

  const contributionsLoad = useCallback(
    (options) => fetchGithubContributions(portfolio.githubUser, options),
    [],
  );

  const contributions = usePublicResource(
    contributionsLoad,
    'github-contributions',
    Boolean(portfolio.githubUser),
  );

  const waka = usePublicResource(
    wakaLoad,
    range,
    Boolean(portfolio.wakatimeProxy),
  );

  const repositories = useMemo(
    () => github.data?.repositories ?? [],
    [github.data],
  );

  const stats = useMemo(() => {
    const days = PERIOD_DAYS[range];
    const cutoff = github.updatedAt - days * 86400000;

    const stars = repositories.reduce(
      (sum, repo) => sum + (Number(repo.stars) || 0),
      0,
    );

    const recent = repositories.filter((repo) => {
      const date = Date.parse(repo.updatedAt ?? '');
      return Number.isFinite(date) && date >= cutoff;
    }).length;

    return { stars, recent };
  }, [repositories, range, github.updatedAt]);

  const contributionDays = useMemo(() => {
    const days = contributions.data?.days ?? [];
    const count = PERIOD_DAYS[range];

    return days.slice(-count);
  }, [contributions.data, range]);

  const number = (value) => Number(value ?? 0).toLocaleString(locale);

  const timestamp = (value) => {
    if (!Number.isFinite(value)) return copy.unknown;
    return new Date(value).toLocaleString(locale);
  };

  const refreshAll = () => {
    github.refresh();
    contributions.refresh();
    if (portfolio.wakatimeProxy) waka.refresh();
  };

  const isRefreshing =
    github.status === 'loading' ||
    contributions.status === 'loading' ||
    (Boolean(portfolio.wakatimeProxy) && waka.status === 'loading');

  return (
    <article className="desktop-window__content ws-app ws-insights">
      {/* === Apresentação === */}
      <header className="ws-insights__hero">
        <div>
          <span className="ws-insights__eyebrow">
            <Activity size={13} />
            {copy.eyebrow}
          </span>
          <h2>{copy.title}</h2>
          <p>{copy.subtitle}</p>
        </div>

        <div className="ws-insights__toolbar">
          <div className="ws-insights__period-control">
            <CalendarDays size={15} aria-hidden="true" />
            <Select
              variant="ghost"
              label={copy.period}
              value={range}
              onChange={setRange}
              options={[
                { value: 'last_7_days', label: copy.seven },
                { value: 'last_30_days', label: copy.thirty },
                { value: 'last_year', label: copy.year },
              ]}
            />
          </div>

          <button
            className="ws-insights__refresh"
            type="button"
            disabled={isRefreshing}
            onClick={refreshAll}
          >
            <RefreshCw
              size={15}
              className={isRefreshing ? 'ws-insights__spin' : ''}
            />
            {isRefreshing ? copy.updating : copy.refresh}
          </button>
        </div>
      </header>

      {/* === Indicadores GitHub === */}
      <section className="ws-insights__section" aria-label={copy.github}>
        <SectionHeading
          icon={FaGithub}
          title={copy.github}
          description={copy.githubDescription}
          action={
            github.data?.profile?.url && (
              <a
                className="ws-insights__external"
                href={github.data.profile.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.openGithub}
                <ArrowUpRight size={15} />
              </a>
            )
          }
        />

        <ResourceStatus
          resource={github}
          copy={copy}
          onRetry={github.refresh}
        />

        {github.data && (
          <>
            <div className="ws-insights__metrics">
              <MetricCard
                icon={GitBranch}
                label={copy.repositories}
                value={number(repositories.length)}
                detail="GitHub"
              />
              <MetricCard
                icon={Star}
                label={copy.stars}
                value={number(stats.stars)}
                detail="GitHub"
              />
              <MetricCard
                icon={Users}
                label={copy.followers}
                value={number(github.data.profile.followers)}
                detail="GitHub"
              />
              <MetricCard
                icon={Activity}
                label={copy.recent}
                value={number(stats.recent)}
                detail={`${PERIOD_DAYS[range]} ${locale === 'en' ? 'days' : 'dias'}`}
              />
            </div>

            <div className="ws-insights__metadata">
              <span>
                <Clock3 size={13} />
                {github.source === 'cache'
                  ? copy.cached
                  : copy.updated}{' '}
                · {timestamp(github.updatedAt)}
              </span>
              {github.warning && <span>{github.warning}</span>}
              {!github.data.complete && <span>{copy.limited}</span>}
            </div>
            <p className="ws-insights__note">{copy.githubInfo}</p>
          </>
        )}
      </section>

      {/* === WakaTime === */}
      <section className="ws-insights__panel">
        <SectionHeading
          icon={Code2}
          title={copy.wakatime}
          description={copy.wakatimeDescription}
          action={
            <span className="ws-insights__source">WakaTime</span>
          }
        />

        {!portfolio.wakatimeProxy ? (
          <div className="ws-insights__resource-state">
            <Clock3 size={23} />
            <p>{copy.wakaMissing}</p>
          </div>
        ) : (
          <>
            <ResourceStatus
              resource={waka}
              copy={copy}
              onRetry={waka.refresh}
            />

            {waka.data && (
              <WakaTimeExplorer
                data={waka.data}
                locale={locale}
              />
            )}

            {waka.data && (
              <div className="ws-insights__metadata">
                <span>
                  <Clock3 size={13} />
                  {waka.source === 'cache'
                    ? copy.cached
                    : copy.updated}{' '}
                  · {timestamp(waka.updatedAt)}
                </span>
                {!waka.data.upToDate && (
                  <span>{copy.wakaUpdating}</span>
                )}
                {waka.warning && <span>{waka.warning}</span>}
              </div>
            )}
          </>
        )}

        <p className="ws-insights__note">{copy.wakaInfo}</p>
      </section>

      {/* === Cidade 3D === */}
      <section className="ws-insights__section ws-insights__city-section">
        <ContributionCity
          days={contributionDays}
          locale={locale}
          status={contributions.status}
          onRetry={contributions.refresh}
        />
      </section>

      {/* === Órbita de repositórios === */}
      <RepositoryOrbit
        repositories={repositories}
        locale={locale}
      />

    </article>
  );
}

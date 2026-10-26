import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
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
    unavailable: 'Dados indisponíveis',
    empty: 'Nenhum dado disponível.',
    loading: 'Consultando dados...',
    retry: 'Tentar novamente',
    updated: 'Atualizado em',
    cached: 'Dados em cache',
    limited: 'O catálogo está limitado aos primeiros 1.000 repositórios.',
    githubInfo: 'O período afeta apenas o indicador de repositórios ativos.',
    wakatime: 'Atividade de Programação',
    wakatimeDescription: 'Tempo e tecnologias registrados pelo WakaTime.',
    wakaMissing: 'WakaTime não configurado.',
    wakaUpdating: 'O WakaTime ainda está processando este período.',
    wakaInfo: 'Os valores representam somente a atividade capturada pelo WakaTime.',
    totalTime: 'Tempo registrado',
    mainLanguage: 'Linguagem mais utilizada',
    mainLanguageTime: 'Tempo nessa linguagem',
    languageDistribution: 'Distribuição por linguagem',
    languageDistributionInfo: 'Participação no tempo registrado.',
    noLanguages: 'Nenhuma linguagem registrada neste período.',
    otherLanguages: 'Outras linguagens',
    explore: 'Explorar atividade detalhada',
    collapse: 'Ocultar atividade detalhada',
    openGithub: 'Ver perfil no GitHub',
    unknown: 'Sem informação',
    summary: 'Resumo da atividade',
    details: 'Exploração detalhada',
    breakdown: 'Distribuição da atividade',
    selection: 'Atividade selecionada',
    share: 'Participação nesta categoria',
    entries: 'itens',
    showMore: 'Ver todos',
    showLess: 'Ver menos',
    noSelection: 'Selecione um item para explorar seus detalhes.',
    recordedPeriod: 'Período registrado',
    notProvided: 'Esta métrica não foi fornecida pela fonte.',
    noCategoryActivity: 'Nenhuma atividade registrada nesta categoria.',
    to: 'até',
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
    unavailable: 'Data unavailable',
    empty: 'No data available.',
    loading: 'Fetching data...',
    retry: 'Try again',
    updated: 'Updated on',
    cached: 'Cached data',
    limited: 'The catalog is limited to the first 1,000 repositories.',
    githubInfo: 'The period only affects the active repositories indicator.',
    wakatime: 'Coding Activity',
    wakatimeDescription: 'Coding time and technologies tracked by WakaTime.',
    wakaMissing: 'WakaTime is not configured.',
    wakaUpdating: 'WakaTime is still processing this period.',
    wakaInfo: 'Values represent only activity tracked by WakaTime.',
    totalTime: 'Tracked coding time',
    mainLanguage: 'Most used language',
    mainLanguageTime: 'Time in this language',
    languageDistribution: 'Language distribution',
    languageDistributionInfo: 'Share of tracked coding time.',
    noLanguages: 'No languages recorded for this period.',
    otherLanguages: 'Other languages',
    explore: 'Explore detailed activity',
    collapse: 'Hide detailed activity',
    openGithub: 'View GitHub profile',
    unknown: 'Unknown',
    summary: 'Activity summary',
    details: 'Detailed exploration',
    breakdown: 'Activity breakdown',
    selection: 'Selected activity',
    share: 'Share of this category',
    entries: 'items',
    showMore: 'Show all',
    showLess: 'Show less',
    noSelection: 'Select an item to explore its details.',
    recordedPeriod: 'Recorded period',
    notProvided: 'This metric is not provided by the data source.',
    noCategoryActivity: 'No activity recorded in this category.',
    to: 'to',
  },
};

const PERIOD_DAYS = {
  last_7_days: 7,
  last_30_days: 30,
  last_year: 365,
};

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

/* === Utilitários === */
function formatCodingTime(seconds, locale) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }

  const hours = seconds / 3600;

  if (hours >= 1) {
    return `${hours.toLocaleString(locale, {
      maximumFractionDigits: 1,
    })} h`;
  }

  return `${Math.round(seconds / 60).toLocaleString(locale)} min`;
}

/* === Componentes compartilhados === */
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
        <RefreshCw
          className="ws-insights__spin"
          size={20}
          aria-hidden="true"
        />
        <span>{copy.loading}</span>
      </div>
    );
  }

  if (resource.status === 'error' && !resource.data) {
    return (
      <div className="ws-insights__resource-state" role="status">
        <Activity size={22} aria-hidden="true" />
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

/* === Resumo da atividade de programação === */
function WakaTimeSummary({ data, locale, copy }) {
  const languages = useMemo(() => {
    const values = Array.isArray(data.languages)
      ? data.languages
      : [];

    return values.filter(
      (item) =>
        typeof item.name === 'string' &&
        Number.isFinite(item.seconds) &&
        item.seconds >= 0,
    );
  }, [data.languages]);

  const totalLanguageSeconds = languages.reduce(
    (sum, item) => sum + item.seconds,
    0,
  );

  const mainLanguage = languages[0] ?? null;

  const visibleLanguages = languages.slice(0, 5);
  const remainingLanguages = languages.slice(5);

  const remainingSeconds = remainingLanguages.reduce(
    (sum, item) => sum + item.seconds,
    0,
  );

  const distribution = remainingSeconds > 0
    ? [
      ...visibleLanguages,
      {
        name: copy.otherLanguages,
        seconds: remainingSeconds,
      },
    ]
    : visibleLanguages;

  return (
    <div className="ws-insights__coding-summary">
      {/* === Indicadores resumidos === */}
      <div className="ws-insights__coding-metrics">
        <div className="ws-insights__coding-metric">
          <span>{copy.totalTime}</span>
          <strong>
            {formatCodingTime(data.totalSeconds, locale)}
          </strong>
          <small>WakaTime</small>
        </div>

        <div className="ws-insights__coding-metric">
          <span>{copy.mainLanguage}</span>
          <strong>{mainLanguage?.name ?? '—'}</strong>
          <small>
            {mainLanguage
              ? `${copy.mainLanguageTime}: ${formatCodingTime(
                mainLanguage.seconds,
                locale,
              )}`
              : copy.noLanguages}
          </small>
        </div>
      </div>

      {/* === Distribuição por tempo === */}
      <div className="ws-insights__coding-distribution">
        <div className="ws-insights__coding-distribution-heading">
          <div>
            <h4>{copy.languageDistribution}</h4>
            <p>{copy.languageDistributionInfo}</p>
          </div>
        </div>

        {distribution.length === 0 ? (
          <p className="ws-insights__muted">
            {copy.noLanguages}
          </p>
        ) : (
          <div className="ws-insights__coding-list">
            {distribution.map((item, index) => {
              const percentage = totalLanguageSeconds > 0
                ? (item.seconds / totalLanguageSeconds) * 100
                : 0;

              return (
                <div
                  className="ws-insights__coding-row"
                  key={item.name}
                  style={{
                    '--coding-color':
                      WAKA_COLORS[index % WAKA_COLORS.length],
                    '--coding-width': `${percentage}%`,
                  }}
                >
                  <div className="ws-insights__coding-row-heading">
                    <span className="ws-insights__coding-name">
                      <i aria-hidden="true" />
                      <strong>{item.name}</strong>
                    </span>

                    <span className="ws-insights__coding-value">
                      {formatCodingTime(item.seconds, locale)}
                      <small>
                        {percentage.toLocaleString(locale, {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </small>
                    </span>
                  </div>

                  <div className="ws-insights__coding-track">
                    <span className="ws-insights__coding-fill" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* === Exploração detalhada do WakaTime === */
function WakaTimeExplorer({ data, locale, copy }) {
  const [activeView, setActiveView] = useState('languages');
  const [selectedName, setSelectedName] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const isEnglish = locale === 'en';

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

  return (
    <div className="ws-waka2">
      {/* === Categorias de exploração === */}
      <div
        className="ws-waka2__tabs"
        role="group"
        aria-label={copy.breakdown}
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

      {/* === Lista e detalhes === */}
      <div className="ws-waka2__workspace">
        <div className="ws-waka2__chart">
          <div className="ws-waka2__chart-heading">
            <div>
              <strong>
                {isEnglish ? currentView.en : currentView.pt}
              </strong>
              <span>{copy.breakdown}</span>
            </div>

            <small>
              {items.length} {copy.entries}
            </small>
          </div>

          {data.available?.[currentView.key] === false ? (
            <p className="ws-waka2__empty">
              {copy.notProvided}
            </p>
          ) : items.length === 0 ? (
            <p className="ws-waka2__empty">
              {copy.noCategoryActivity}
            </p>
          ) : (
            <>
              <div className="ws-waka2__list">
                {visibleItems.map((item, index) => {
                  const percentage =
                    totalCategorySeconds > 0
                      ? (item.seconds / totalCategorySeconds) * 100
                      : 0;

                  const color =
                    WAKA_COLORS[index % WAKA_COLORS.length];

                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={[
                        'ws-waka2__item',
                        selected?.name === item.name
                          ? 'is-active'
                          : '',
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
                          <i aria-hidden="true" />
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
                  {expanded ? copy.showLess : copy.showMore}
                  <span>{items.length}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* === Detalhes da seleção === */}
        <aside className="ws-waka2__details" aria-live="polite">
          <span className="ws-waka2__details-label">
            {copy.selection}
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
                <span>{copy.share}</span>
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
              {copy.noSelection}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

/* === Painel de atividade WakaTime === */
function WakaTimePanel({
  data,
  locale,
  copy,
  resource,
  onRetry,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <section
      className="ws-insights__panel ws-insights__wakatime-panel"
      aria-label={copy.wakatime}
    >
      <SectionHeading
        icon={Code2}
        title={copy.wakatime}
        description={copy.wakatimeDescription}
        action={
          <span className="ws-insights__source">
            WakaTime
          </span>
        }
      />

      {!portfolio.wakatimeProxy ? (
        <div className="ws-insights__resource-state">
          <Clock3 size={23} aria-hidden="true" />
          <p>{copy.wakaMissing}</p>
        </div>
      ) : (
        <>
          <ResourceStatus
            resource={resource}
            copy={copy}
            onRetry={onRetry}
          />

          {data && (
            <>
              {/* === Resumo sempre visível === */}
              <WakaTimeSummary
                data={data}
                locale={locale}
                copy={copy}
              />

              {/* === Exploração sob demanda === */}
              <button
                className="ws-insights__explore-toggle"
                type="button"
                aria-expanded={detailsOpen}
                aria-controls="ws-insights-wakatime-details"
                onClick={() => setDetailsOpen((value) => !value)}
              >
                <span>
                  {detailsOpen ? copy.collapse : copy.explore}
                </span>

                <ChevronDown
                  size={17}
                  className={detailsOpen ? 'is-open' : ''}
                  aria-hidden="true"
                />
              </button>

              <div
                id="ws-insights-wakatime-details"
                className="ws-insights__explore-content"
                hidden={!detailsOpen}
              >
                {detailsOpen && (
                  <WakaTimeExplorer
                    data={data}
                    locale={locale}
                    copy={copy}
                  />
                )}
              </div>

              {/* === Proveniência e atualização === */}
              <div className="ws-insights__metadata">
                <span>
                  <Clock3 size={13} aria-hidden="true" />
                  {resource.source === 'cache'
                    ? copy.cached
                    : copy.updated}{' '}
                  · {Number.isFinite(resource.updatedAt)
                    ? new Date(resource.updatedAt).toLocaleString(locale)
                    : copy.unknown}
                </span>

                {!data.upToDate && (
                  <span>{copy.wakaUpdating}</span>
                )}

                {resource.warning && (
                  <span>{resource.warning}</span>
                )}
              </div>
            </>
          )}
        </>
      )}

      <p className="ws-insights__note">
        {copy.wakaInfo}
      </p>
    </section>
  );
}

/* === Aplicativo Dev Insights === */
export default function DevInsights() {
  const locale = useLocale();
  const language = locale === 'en' ? 'en' : 'pt-BR';
  const copy = COPY[language];

  const [range, setRange] = useState('last_7_days');

  /* === Integração GitHub === */
  const githubLoad = useCallback(
    (options) =>
      fetchGithubPortfolio(portfolio.githubUser, options),
    [],
  );

  const github = usePublicResource(
    githubLoad,
    'github',
    Boolean(portfolio.githubUser),
  );

  /* === Integração WakaTime === */
  const wakaLoad = useCallback(
    (options) =>
      fetchWakatimeStats(range, options),
    [range],
  );

  const waka = usePublicResource(
    wakaLoad,
    range,
    Boolean(portfolio.wakatimeProxy),
  );

  /* === Calendário de contribuições === */
  const contributionsLoad = useCallback(
    (options) =>
      fetchGithubContributions(portfolio.githubUser, options),
    [],
  );

  const contributions = usePublicResource(
    contributionsLoad,
    'github-contributions',
    Boolean(portfolio.githubUser),
  );

  /* === Dados derivados === */
  const repositories = useMemo(
    () => github.data?.repositories ?? [],
    [github.data],
  );

  const stats = useMemo(() => {
    const days = PERIOD_DAYS[range];

    const cutoff =
      github.updatedAt - days * 86400000;

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

  /* === Formatação === */
  const number = (value) =>
    Number(value ?? 0).toLocaleString(locale);

  const timestamp = (value) => {
    if (!Number.isFinite(value)) {
      return copy.unknown;
    }

    return new Date(value).toLocaleString(locale);
  };

  /* === Atualização manual === */
  const refreshAll = () => {
    github.refresh();
    contributions.refresh();

    if (portfolio.wakatimeProxy) {
      waka.refresh();
    }
  };

  const isRefreshing =
    github.status === 'loading' ||
    contributions.status === 'loading' ||
    (
      Boolean(portfolio.wakatimeProxy) &&
      waka.status === 'loading'
    );

  /* === Interface === */
  return (
    <article
      className="desktop-window__content ws-app ws-insights"
      lang={language}
    >
      {/* === Cabeçalho === */}
      <header className="ws-insights__hero">
        <div className="ws-insights__hero-content">
          <span className="ws-insights__eyebrow">
            <Activity size={13} aria-hidden="true" />
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
              className={
                isRefreshing ? 'ws-insights__spin' : ''
              }
              aria-hidden="true"
            />

            {isRefreshing
              ? copy.updating
              : copy.refresh}
          </button>
        </div>
      </header>

      {/* === Indicadores GitHub === */}
      <section
        className="ws-insights__section ws-insights__github-section"
        aria-label={copy.github}
      >
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
                <ArrowUpRight
                  size={15}
                  aria-hidden="true"
                />
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
                detail={`${PERIOD_DAYS[range]} ${language === 'en' ? 'days' : 'dias'
                  }`}
              />
            </div>

            <div className="ws-insights__metadata">
              <span>
                <Clock3 size={13} aria-hidden="true" />
                {github.source === 'cache'
                  ? copy.cached
                  : copy.updated}{' '}
                · {timestamp(github.updatedAt)}
              </span>

              {github.warning && (
                <span>{github.warning}</span>
              )}

              {!github.data.complete && (
                <span>{copy.limited}</span>
              )}
            </div>

            <p className="ws-insights__note">
              {copy.githubInfo}
            </p>
          </>
        )}
      </section>

      {/* === Atividade de programação === */}
      <WakaTimePanel
        data={waka.data}
        locale={locale}
        copy={copy}
        resource={waka}
        onRetry={waka.refresh}
      />

      {/* === Cidade 3D de contribuições === */}
      <section className="ws-insights__section ws-insights__city-section">
        <ContributionCity
          days={contributionDays}
          locale={locale}
          status={contributions.status}
          onRetry={contributions.refresh}
        />
      </section>

      {/* === Universo de projetos === */}
      <RepositoryOrbit
        repositories={repositories}
        locale={locale}
      />
    </article>
  );
}
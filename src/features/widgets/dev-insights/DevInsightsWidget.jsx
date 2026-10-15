
import { memo, useCallback } from 'react';
import {
    ChartNoAxesCombined,
    Code2,
    GitFork,
    RefreshCw,
    Star,
    Users,
    Clock3,
} from 'lucide-react';

import { portfolio } from '../../../content/portfolioContent';
import { fetchGithubPortfolio } from '../../../services/githubService';
import { fetchWakatimeStats } from '../../../services/wakatimeService';
import usePublicResource from '../../../shared/hooks/usePublicResource';
import { useWidgetPreferences } from '../../../core/widgetPreferences';
import {
    translate as t,
    useLocale,
} from '../../../shared/i18n/i18n';

import './DevInsightsWidget.css';

function Metric({ icon: Icon, label, value, className = '' }) {
    return (
        <div className={`ws-dev-widget__metric ${className}`}>
            <div className="ws-dev-widget__metric-label">
                <Icon size={14} aria-hidden="true" />
                <span>{label}</span>
            </div>
            <strong>{value}</strong>
        </div>
    );
}

function DevInsightsWidget() {
    const locale = useLocale();
    const { widgets } = useWidgetPreferences();

    const widget = widgets.find(
        (item) => item.instanceId === 'dev-insights-default',
    );

    const settings = widget?.settings ?? {};
    const showStars = settings.showStars !== false;
    const showFollowers = settings.showFollowers !== false;
    const showWakatime = settings.showWakatime !== false;
    const showLanguages = settings.showLanguages !== false;

    const loadGithub = useCallback(
        (options) => fetchGithubPortfolio(portfolio.githubUser, options),
        [],
    );

    const loadWakatime = useCallback(
        (options) => fetchWakatimeStats('last_7_days', options),
        [],
    );

    const github = usePublicResource(
        loadGithub,
        'github',
        Boolean(portfolio.githubUser),
    );

    const wakatime = usePublicResource(
        loadWakatime,
        'last_7_days',
        Boolean(portfolio.wakatimeProxy) && showWakatime,
    );

    const repositories = github.data?.repositories ?? [];

    const stars = repositories.reduce(
        (total, repository) => total + (repository.stars ?? 0),
        0,
    );

    const followers = github.data?.profile?.followers;

    const hours = wakatime.data?.totalSeconds != null
        ? wakatime.data.totalSeconds / 3600
        : null;

    const topLanguage = [...(wakatime.data?.languages ?? [])]
        .sort((a, b) => b.seconds - a.seconds)[0];

    const githubLanguages = repositories.reduce((result, repo) => {
        const language = repo.technologies?.[0];
        if (language) {
            result[language] = (result[language] ?? 0) + 1;
        }
        return result;
    }, {});

    const fallbackLanguage = Object.entries(githubLanguages)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

    const language = topLanguage?.name ?? fallbackLanguage ?? null;
    const languageSource = topLanguage ? 'WakaTime' : 'GitHub';

    const loading =
        github.status === 'loading' ||
        (showWakatime && wakatime.status === 'loading');

    function refresh() {
        if (portfolio.githubUser) github.refresh();
        if (portfolio.wakatimeProxy && showWakatime) wakatime.refresh();
    }

    const number = (value) =>
        value == null ? '—' : value.toLocaleString(locale);

    const hoursLabel = hours == null
        ? '—'
        : `${hours.toLocaleString(locale, {
            maximumFractionDigits: 1,
        })} h`;

    return (
        <section
            className="ws-widget ws-widget--dev-insights"
            aria-label="Dev Insights"
            aria-busy={loading}
        >
            <header className="ws-dev-widget__header">
                <div className="ws-dev-widget__heading">
                    <ChartNoAxesCombined size={16} aria-hidden="true" />
                    <strong>Dev Insights</strong>
                </div>

                <button
                    type="button"
                    className="ws-dev-widget__refresh"
                    onClick={refresh}
                    disabled={loading}
                    aria-label={t('Atualizar dados')}
                    title={t('Atualizar dados')}
                >
                    <RefreshCw
                        size={15}
                        className={loading ? 'is-loading' : ''}
                        aria-hidden="true"
                    />
                </button>
            </header>

            <div className="ws-dev-widget__metrics">
                <Metric
                    icon={GitFork}
                    label={t('Repositórios')}
                    value={github.data ? number(repositories.length) : '—'}
                    className="ws-dev-widget__metric--repos"
                />

                {showStars && (
                    <Metric
                        icon={Star}
                        label={t('Estrelas')}
                        value={github.data ? number(stars) : '—'}
                        className="ws-dev-widget__metric--stars"
                    />
                )}

                {showFollowers && (
                    <Metric
                        icon={Users}
                        label={t('Seguidores')}
                        value={number(followers)}
                        className="ws-dev-widget__metric--followers"
                    />
                )}

                {showWakatime && (
                    <Metric
                        icon={Clock3}
                        label={t('Horas registradas') + ' · 7d'}
                        value={hoursLabel}
                        className="ws-dev-widget__metric--wakatime"
                    />
                )}
            </div>

            {showLanguages && language && (
                <div className="ws-dev-widget__language">
                    <Code2 size={15} aria-hidden="true" />
                    <span>{t('Linguagem principal')}</span>
                    <strong>{language}</strong>
                    <small>{languageSource}</small>
                </div>
            )}

            <div className="ws-dev-widget__status-area">
                {loading && (
                    <p role="status">{t('Carregando')}</p>
                )}

                {github.status === 'error' && (
                    <p role="status">
                        GitHub: {t(github.error)}
                    </p>
                )}

                {showWakatime && !portfolio.wakatimeProxy && (
                    <p>{t('WakaTime ainda não configurado.')}</p>
                )}

                {showWakatime && wakatime.status === 'error' && (
                    <p role="status">
                        WakaTime: {t(wakatime.error)}
                    </p>
                )}

                {github.warning && (
                    <p role="status">{t(github.warning)}</p>
                )}
            </div>

            <footer className="ws-dev-widget__footer">
                <span>GitHub</span>
                {showWakatime && <span>· WakaTime</span>}
            </footer>
        </section>
    );
}

export default memo(DevInsightsWidget);

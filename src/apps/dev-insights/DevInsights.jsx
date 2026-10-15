import { useCallback, useState } from 'react';
import { portfolio } from '../../content/portfolioContent';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { fetchGithubPortfolio } from '../../services/githubService';
import { fetchWakatimeStats } from '../../services/wakatimeService';
import usePublicResource from '../../shared/hooks/usePublicResource';
import '../../styles/apps.css';
export default function DevInsights() {
  const locale = useLocale();
  const [range, setRange] = useState('last_7_days');
  const githubLoad = useCallback(
    (options) => fetchGithubPortfolio(portfolio.githubUser, options),
    [],
  );
  const wakaLoad = useCallback((options) => fetchWakatimeStats(range, options), [range]);
  const github = usePublicResource(githubLoad, 'github', Boolean(portfolio.githubUser));
  const waka = usePublicResource(wakaLoad, range, Boolean(portfolio.wakatimeProxy));
  const repos = github.data?.repositories ?? [];
  const days = { last_7_days: 7, last_30_days: 30, last_year: 365 }[range];
  const languages = Object.entries(
    repos.reduce((result, item) => {
      const name = item.technologies[0];
      if (name) result[name] = (result[name] ?? 0) + 1;
      return result;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  return (
    <article className="desktop-window__content ws-app">
      <h2>{t('Dev Insights')}</h2>
      <p>{t('Métricas públicas com fonte, período e estado de atualização.')}</p>
      <label>
        {t('Período')}
        <select value={range} onChange={(event) => setRange(event.target.value)}>
          <option value="last_7_days">{t('Últimos 7 dias')}</option>
          <option value="last_30_days">{t('Últimos 30 dias')}</option>
          <option value="last_year">{t('Últimos 365 dias')}</option>
        </select>
      </label>
      <section>
        <h3>GitHub</h3>
        <button type="button" onClick={github.refresh} disabled={github.status === 'loading'}>
          {t('Atualizar dados')}
        </button>
        {github.status === 'loading' && <p role="status">{t('Carregando')}</p>}
        {github.status === 'error' && <p role="status">{t(github.error)}</p>}
        {github.data && (
          <>
            <p>
              {t(github.source === 'cache' ? 'Cache desta sessão' : 'Dados atualizados')}:{' '}
              {new Date(github.updatedAt).toLocaleString(locale)}
            </p>
            <p role="status">{t(github.warning ?? '')}</p>
            <dl className="ws-app__metrics">
              <div>
                <dt>{t('Repositórios carregados')}</dt>
                <dd>{repos.length}</dd>
              </div>
              <div>
                <dt>{t('Estrelas nos repositórios carregados')}</dt>
                <dd>{repos.reduce((sum, item) => sum + item.stars, 0)}</dd>
              </div>
              <div>
                <dt>{t('Seguidores')}</dt>
                <dd>{github.data.profile.followers}</dd>
              </div>
              <div>
                <dt>{t('Repositórios atualizados no período')}</dt>
                <dd>
                  {
                    repos.filter(
                      (item) => Date.parse(item.updatedAt) >= github.updatedAt - days * 86400000,
                    ).length
                  }
                </dd>
              </div>
            </dl>
            <p>
              {t(
                'Os totais de repositórios e linguagens não representam commits nem horas de trabalho.',
              )}
              {!github.data.complete && t('Catálogo limitado aos primeiros 1000 repositórios.')}
            </p>
            <h4>{t('Linguagem principal por repositório')}</h4>
            <ul>
              {languages.map(([name, count]) => (
                <li key={name}>
                  {name}: {count}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section>
        <h3>WakaTime</h3>
        {!portfolio.wakatimeProxy ? (
          <p role="status">{t('WakaTime ainda não configurado.')}</p>
        ) : (
          <>
            <button type="button" onClick={waka.refresh}>
              {t('Atualizar dados')}
            </button>
            {waka.status === 'loading' && <p role="status">{t('Carregando')}</p>}
            {waka.status === 'error' && <p role="status">{t(waka.error)}</p>}
            {waka.status === 'ready' && (
              <>
                <p>
                  {t('Horas registradas')}:{' '}
                  {(waka.data.totalSeconds / 3600).toLocaleString(locale, {
                    maximumFractionDigits: 1,
                  })}
                </p>
                <p>
                  {t(waka.source === 'cache' ? 'Cache desta sessão' : 'Dados atualizados')}:{' '}
                  {new Date(waka.updatedAt).toLocaleString(locale)}
                </p>
                <p>
                  {waka.data.start} — {waka.data.end}
                </p>
                {!waka.data.upToDate && (
                  <p role="status">{t('O provedor ainda está atualizando este período.')}</p>
                )}
                <ul>
                  {waka.data.languages.map((item) => (
                    <li key={item.name}>
                      {item.name}:{' '}
                      {(item.seconds / 3600).toLocaleString(locale, { maximumFractionDigits: 1 })} h
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </article>
  );
}

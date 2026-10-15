import { useCallback, useMemo, useState } from 'react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { useLocale, translate as t } from '../../shared/i18n/i18n';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import usePublicResource from '../../shared/hooks/usePublicResource';
import useAppBack from '../../shared/hooks/useAppBack';
import { fetchGithubPortfolio } from '../../services/githubService';
import { safeExternalUrl, publicAssetUrl } from '../../shared/utils/urls';
import { mergeProjects, filterProjects } from './projectModel';
import '../../styles/apps.css';

export default function Projects({ instance }) {
  const locale = useLocale();
  const { run } = useSystem();
  const load = useCallback((options) => fetchGithubPortfolio(portfolio.githubUser, options), []);
  const remote = usePublicResource(load, 'github', Boolean(portfolio.githubUser));
  const projects = useMemo(
    () => mergeProjects(portfolio.projects, remote.data?.repositories ?? []),
    [remote.data],
  );
  const [search, setSearch] = useState('');
  const [technology, setTechnology] = useState('all');
  const [order, setOrder] = useState('updated');
  const [selectedId, setSelectedId] = useState(
    typeof instance?.params?.projectId === 'string' ? instance.params.projectId : null,
  );
  useAppBack(instance?.id, () => {
    if (!selectedId) return false;
    setSelectedId(null);
    return true;
  });
  const selected = projects.find((item) => item.id === selectedId);
  const visible = filterProjects(projects, search, technology, order, locale, contentText);
  const link = (value) => safeExternalUrl(value);
  return (
    <article className="desktop-window__content ws-app ws-projects">
      <header>
        <h2>{t('Projetos')}</h2>
        <p>{t('Projetos selecionados e repositórios públicos do GitHub.')}</p>
      </header>
      <div className="ws-app__toolbar">
        <button type="button" onClick={remote.refresh} disabled={remote.status === 'loading'}>
          {t('Atualizar dados')}
        </button>
        {selectedId && (
          <button type="button" onClick={() => setSelectedId(null)}>
            {t('Voltar ao catálogo')}
          </button>
        )}
      </div>
      {remote.status === 'loading' && <p role="status">{t('Carregando dados públicos…')}</p>}
      {remote.status === 'error' && (
        <p role="status">
          {t(remote.error)} {t('O conteúdo cadastrado continua disponível.')}
        </p>
      )}
      {remote.status === 'ready' && (
        <p className="ws-app__muted">
          {t(remote.source === 'cache' ? 'Cache desta sessão' : 'Dados atualizados')}:{' '}
          {new Date(remote.updatedAt).toLocaleString(locale)}. {t(remote.warning ?? '')}
          {!remote.data.complete && t('Catálogo limitado aos primeiros 1000 repositórios.')}
        </p>
      )}
      {selectedId ? (
        selected ? (
          <section>
            <h3>{contentText(selected.name, locale)}</h3>
            <p>{contentText(selected.description, locale)}</p>
            {publicAssetUrl(selected.image) && (
              <img
                className="ws-app__cover"
                src={publicAssetUrl(selected.image)}
                alt={contentText(selected.name, locale)}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            )}
            <p>{selected.technologies.join(' · ')}</p>
            <p>{t(selected.status ?? 'Público')}</p>
            <div className="ws-app__toolbar">
              {link(selected.repository) && (
                <a href={link(selected.repository)} target="_blank" rel="noopener noreferrer">
                  {t('Repositório externo')}
                </a>
              )}
              {link(selected.homepage) && (
                <a href={link(selected.homepage)} target="_blank" rel="noopener noreferrer">
                  {t('Site externo')}
                </a>
              )}
              {selected.demos.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() =>
                    run(openApp, 'demo-viewer', {
                      origin: 'projects',
                      params: { projectId: selected.id, demoId: demo.id },
                    })
                  }
                >
                  {contentText(demo.title, locale) || t('Abrir demonstração')}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <p role="status">
            {t(remote.status === 'loading' ? 'Carregando' : 'Projeto não encontrado.')}
          </p>
        )
      ) : (
        <>
          <div className="ws-app__filters">
            <label>
              {t('Pesquisar projetos')}
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              {t('Tecnologia')}
              <select value={technology} onChange={(event) => setTechnology(event.target.value)}>
                <option value="all">{t('Todas')}</option>
                {[...new Set(projects.flatMap((item) => item.technologies))].sort().map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              {t('Ordenar')}
              <select value={order} onChange={(event) => setOrder(event.target.value)}>
                <option value="updated">{t('Atualização')}</option>
                <option value="name">{t('Nome')}</option>
              </select>
            </label>
          </div>
          <p role="status">
            {t('Resultados')}: {visible.length}
          </p>
          <div className="ws-app__grid">
            {visible.map((item) => (
              <section className="ws-app__card" key={item.id}>
                <h3>{contentText(item.name, locale)}</h3>
                <p>{contentText(item.description, locale) || t('Sem descrição cadastrada.')}</p>
                <p className="ws-app__muted">
                  {item.technologies.join(' · ')} · {t(item.source)}
                </p>
                {Number.isFinite(item.stars) && (
                  <p>
                    ★ {item.stars} · {t('Forks')}: {item.forks}
                  </p>
                )}
                <button type="button" onClick={() => setSelectedId(item.id)}>
                  {t('Ver detalhes')}
                </button>
              </section>
            ))}
          </div>
          {visible.length === 0 && remote.status !== 'loading' && (
            <p>{t('Nenhum projeto encontrado. Ajuste os filtros ou cadastre projetos.')}</p>
          )}
        </>
      )}
    </article>
  );
}

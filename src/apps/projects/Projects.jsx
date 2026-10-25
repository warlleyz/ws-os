import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  FileText,
  FolderGit2,
  GitFork,
  Layers3,
  Search,
  Star,
} from 'lucide-react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { fetchGithubPortfolio } from '../../services/githubService';
import {
  fetchProjectHighlights,
  applyProjectHighlights,
} from '../../services/projectHighlightService';
import useAppBack from '../../shared/hooks/useAppBack';
import usePublicResource from '../../shared/hooks/usePublicResource';
import Select from '../../shared/components/Select';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { publicAssetUrl, safeExternalUrl } from '../../shared/utils/urls';
import { filterProjects, mergeProjects } from './projectModel';
import { summarizeReadme } from './readmeSummary';
import '../../styles/apps.css';
import './Projects.css';
/* === Aplicativo Projetos === */
export default function Projects({ instance }) {
  /* ----- Integrações e contexto ----- */
  const locale = useLocale();
  /* ----- Catálogo e dados remotos ----- */
  const load = useCallback(
    (options) => fetchGithubPortfolio(portfolio.githubUser, { ...options, force: true }),
    [],
  );
  const remote = usePublicResource(load, 'github', Boolean(portfolio.githubUser));
  /* ----- Atualizar a seleção quando o administrador salvar os destaques ----- */
  const loadHighlights = useCallback((options) => fetchProjectHighlights(options), []);
  const highlights = usePublicResource(loadHighlights, 'project-highlights', true, {
    invalidateOn: ['/api/project-highlights'],
  });
  const projects = useMemo(() => {
    const catalog = mergeProjects(portfolio.projects, remote.data?.repositories ?? []);
    return applyProjectHighlights(
      catalog,
      highlights.status === 'ready' ? highlights.data?.repositoryIds : null,
    );
  }, [remote.data, highlights.status, highlights.data]);
  /* ----- Pesquisa, filtros e ordenação ----- */
  const [search, setSearch] = useState('');
  const [technology, setTechnology] = useState('all');
  const [order, setOrder] = useState('updated');
  const visible = filterProjects(projects, search, technology, order, locale, contentText);
  const featuredProjects = visible.filter((item) => item.featured === true);
  const regularProjects = visible.filter((item) => item.featured !== true);
  const english = locale === 'en' || locale === 'en-US';
  const label = (pt, en) => (english ? en : pt);
  const projectImage = (item) => publicAssetUrl(item.image);
  const technologies = useMemo(
    () => [...new Set(projects.flatMap((item) => item.technologies))].sort(),
    [projects],
  );
  /* ----- Navegação entre catálogo e detalhes ----- */
  const navigation = instance?.navigationRequestId ?? 0;
  const [selection, setSelection] = useState({
    request: navigation,
    id: instance?.params?.projectId ?? null,
  });
  const selectedId =
    selection.request === navigation ? selection.id : (instance?.params?.projectId ?? null);
  function setSelectedId(id) {
    setSelection({ request: navigation, id });
  }
  useAppBack(instance?.id, () => {
    if (!selectedId) return false;
    setSelectedId(null);
    return true;
  });
  const selected = projects.find((item) => item.id === selectedId);
  /* === Documentação GitHub === */
  /* ----- Prévia do README carregada somente nos detalhes ----- */
  const [readme, setReadme] = useState({ key: '', status: 'idle', paragraphs: [] });
  useEffect(() => {
    const repositoryUrl = safeExternalUrl(selected?.repository);
    if (!selectedId || !repositoryUrl) return undefined;
    const url = new URL(repositoryUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (url.hostname !== 'github.com' || parts.length !== 2) return undefined;
    if (!parts.every((part) => /^[a-z0-9_.-]+$/i.test(part))) return undefined;
    const controller = new AbortController();
    const key = selected.id;
    const endpoint = `https://api.github.com/repos/${parts.map(encodeURIComponent).join('/')}/readme`;
    async function loadReadme() {
      setReadme({ key, status: 'loading', paragraphs: [] });
      try {
        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github.raw+json' },
        });
        if (!response.ok) throw new Error('README indisponível');
        const markdown = (await response.text()).slice(0, 24000);
        /* ----- Priorizar contexto, funcionalidades e tecnologias do README ----- */
        const paragraphs = summarizeReadme(markdown);
        if (!controller.signal.aborted) setReadme({ key, status: 'ready', paragraphs });
      } catch {
        if (!controller.signal.aborted) setReadme({ key, status: 'error', paragraphs: [] });
      }
    }
    loadReadme();
    return () => controller.abort();
  }, [selectedId, selected?.id, selected?.repository]);
  /* ----- Formatação de datas reais do repositório ----- */
  function formatProjectDate(date) {
    if (!date || Number.isNaN(Date.parse(date))) return null;
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }
  /* ----- Conteúdo editorial opcional ----- */
  function editorial(value) {
    return contentText(value, locale).trim();
  }
  /* === Card unificado de projeto === */
  /* ----- Tamanho e ações consistentes para todos os projetos ----- */
  function renderProjectCard(item) {
    return (
      <article className="ws-projects__card" key={item.id}>
        <div className="ws-projects__card-media">
          {projectImage(item) && (
            <img
              key={item.id}
              src={projectImage(item)}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
          <span className="ws-projects__card-fallback" aria-hidden="true">
            <FolderGit2 size={34} strokeWidth={1.4} />
          </span>
          {item.featured === true && (
            <span className="ws-projects__featured-label">
              <Star size={12} aria-hidden="true" /> {label('Destaque', 'Featured')}
            </span>
          )}
        </div>
        <div className="ws-projects__card-body">
          <span className="ws-projects__card-source">{t(item.source)}</span>
          <h3 title={contentText(item.name, locale)}>{contentText(item.name, locale)}</h3>
          <p className="ws-projects__card-description">
            {contentText(item.description, locale) || t('Sem descrição cadastrada.')}
          </p>
          <div className="ws-projects__tags">
            {item.technologies.slice(0, 4).map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
          <div className="ws-projects__card-footer">
            {Number.isFinite(item.stars) && (
              <span className="ws-projects__card-stats">
                ★ {item.stars} · {t('Forks')}: {item.forks}
              </span>
            )}
            <div className="ws-projects__card-actions">
              <button
                className="ws-projects__card-action"
                type="button"
                onClick={() => setSelectedId(item.id)}
              >
                {t('Ver detalhes')} <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }
  /* === Interface === */
  return (
    <article className="desktop-window__content ws-app ws-projects">
      {/* === Cabeçalho exclusivo do catálogo === */}
      {!selectedId && (
        <header className="ws-projects__hero">
          <div className="ws-projects__hero-copy">
            <span className="ws-projects__eyebrow">WS OS / SELECTED WORK</span>
            <h2>{t('Projetos')}</h2>
            <p>
              {label(
                'Explore meus projetos, tecnologias e repositórios.',
                'Explore my projects, technologies, and repositories.',
              )}
            </p>
          </div>
          <FolderGit2
            className="ws-projects__hero-icon"
            size={34}
            strokeWidth={1.3}
            aria-hidden="true"
          />
        </header>
      )}
      {/* ----- Situação da integração ----- */}
      <div className="ws-projects__feedback" aria-live="polite">
        {highlights.status === 'error' && (
          <p role="status">
            {t('Não foi possível carregar os projetos em destaque.')}{' '}
            <button type="button" onClick={highlights.refresh}>
              {t('Tentar novamente')}
            </button>
          </p>
        )}
        {remote.status === 'loading' && <p role="status">{t('Carregando dados públicos…')}</p>}
        {remote.status === 'error' && (
          <p role="status">
            {t(remote.error)} {t('O conteúdo cadastrado continua disponível.')}
          </p>
        )}
        {remote.status === 'ready' && remote.data && (
          <p className="ws-app__muted">
            {t(remote.source === 'cache' ? 'Cache desta sessão' : 'Dados atualizados')}:{' '}
            {new Date(remote.updatedAt).toLocaleString(locale)}. {t(remote.warning ?? '')}
            {!remote.data.complete && t('Catálogo limitado aos primeiros 1000 repositórios.')}
          </p>
        )}
      </div>
      {/* === Catálogo ou detalhes do projeto === */}
      {selectedId ? (
        selected ? (
          <section className="ws-projects__case" aria-labelledby="ws-projects-detail-title">
            <button className="ws-projects__back" type="button" onClick={() => setSelectedId(null)}>
              <ArrowLeft size={16} aria-hidden="true" />
              {t("Voltar ao catálogo")}
            </button>
            {/* === Apresentação editorial do projeto === */}
            <header className="ws-projects__case-hero">
              <div className="ws-projects__case-cover">
                <FolderGit2
                  className="ws-projects__case-cover-fallback"
                  size={64}
                  strokeWidth={1.1}
                  aria-hidden="true"
                />
                {publicAssetUrl(selected.image) && (
                  <img
                    key={selected.id}
                    src={publicAssetUrl(selected.image)}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                )}
                {selected.featured === true && (
                  <span className="ws-projects__case-featured">
                    <Star size={13} aria-hidden="true" />{' '}
                    {label('Projeto em destaque', 'Featured project')}
                  </span>
                )}
              </div>
              <div className="ws-projects__case-intro">
                <span className="ws-projects__case-eyebrow">
                  {label('PORTFÓLIO / PROJETO', 'PORTFOLIO / PROJECT')}
                </span>
                <h3 id="ws-projects-detail-title">{contentText(selected.name, locale)}</h3>
                {editorial(selected.description) && <p>{editorial(selected.description)}</p>}
                {selected.technologies?.length > 0 && (
                  <div className="ws-projects__case-tags" aria-label={t('Tecnologia')}>
                    {selected.technologies.map((technology) => (
                      <span key={technology}>{technology}</span>
                    ))}
                  </div>
                )}
              </div>
            </header>
            {/* === Conteúdo principal e informações rápidas === */}
            <div className="ws-projects__case-layout">
              <aside
                className="ws-projects__case-aside"
                aria-label={label('Resumo do repositório', 'Repository summary')}
              >
                {/* ----- Metadados reais do GitHub ----- */}
                {(Number.isFinite(selected.stars) ||
                  Number.isFinite(selected.forks) ||
                  selected.language ||
                  selected.status ||
                  selected.visibility ||
                  selected.license ||
                  formatProjectDate(selected.createdAt) ||
                  formatProjectDate(selected.updatedAt)) && (
                    <section className="ws-projects__case-sidebar-block">
                      <h4>{label('Informações do projeto', 'Project information')}</h4>
                      {/* ----- Dados mais úteis para contextualizar o repositório ----- */}
                      <dl className="ws-projects__case-facts">
                        {selected.language && (
                          <>
                            <dt>{label('Linguagem principal', 'Primary language')}</dt>
                            <dd>{selected.language}</dd>
                          </>
                        )}
                        {formatProjectDate(selected.updatedAt) && (
                          <>
                            <dt>{label('Última atividade', 'Last activity')}</dt>
                            <dd>{formatProjectDate(selected.updatedAt)}</dd>
                          </>
                        )}
                        {formatProjectDate(selected.createdAt) && (
                          <>
                            <dt>{label('Criado em', 'Created')}</dt>
                            <dd>{formatProjectDate(selected.createdAt)}</dd>
                          </>
                        )}
                        {selected.license && (
                          <>
                            <dt>{label('Licença', 'License')}</dt>
                            <dd>{selected.license}</dd>
                          </>
                        )}
                        {(selected.status || selected.visibility) && (
                          <>
                            <dt>{label('Situação', 'Status')}</dt>
                            <dd>
                              {selected.archived
                                ? label('Arquivado', 'Archived')
                                : label('Público', 'Public')}
                            </dd>
                          </>
                        )}
                      </dl>
                      {(Number.isFinite(selected.stars) || Number.isFinite(selected.forks)) && (
                        <div
                          className="ws-projects__case-stats"
                          aria-label={label('Indicadores do GitHub', 'GitHub metrics')}
                        >
                          {Number.isFinite(selected.stars) && (
                            <div>
                              <Star size={15} aria-hidden="true" />
                              <strong>{selected.stars}</strong>
                              <span>{label('Estrelas', 'Stars')}</span>
                            </div>
                          )}
                          {Number.isFinite(selected.forks) && (
                            <div>
                              <GitFork size={15} aria-hidden="true" />
                              <strong>{selected.forks}</strong>
                              <span>Forks</span>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  )}
                {/* ----- Acesso a recursos válidos ----- */}
                {(safeExternalUrl(selected.repository) || safeExternalUrl(selected.homepage)) && (
                  <section className="ws-projects__case-sidebar-block">
                    <h4>{label('Acessar projeto', 'Explore project')}</h4>
                    <div className="ws-projects__case-actions">
                      {safeExternalUrl(selected.repository) && (
                        <a
                          href={safeExternalUrl(selected.repository)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FolderGit2 size={16} aria-hidden="true" />{' '}
                          {label('Repositório GitHub', 'GitHub repository')}{' '}
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </a>
                      )}
                      {safeExternalUrl(selected.homepage) && (
                        <a
                          href={safeExternalUrl(selected.homepage)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ArrowUpRight size={16} aria-hidden="true" />{' '}
                          {label('Abrir site', 'Open website')}
                        </a>
                      )}
                    </div>
                  </section>
                )}
              </aside>
              <div className="ws-projects__case-content">
                {/* ----- Apresentação e objetivos opcionais ----- */}
                {(editorial(selected.details?.description) ||
                  editorial(selected.details?.objective) ||
                  editorial(selected.details?.problem)) && (
                    <section className="ws-projects__case-section">
                      <div className="ws-projects__case-heading">
                        <BookOpen size={19} aria-hidden="true" />
                        <h4>{label('Sobre o projeto', 'About the project')}</h4>
                      </div>
                      {editorial(selected.details?.description) && (
                        <p>{editorial(selected.details.description)}</p>
                      )}
                      {editorial(selected.details?.objective) && (
                        <p>
                          <strong>{label('Objetivo', 'Objective')}</strong> —{' '}
                          {editorial(selected.details.objective)}
                        </p>
                      )}
                      {editorial(selected.details?.problem) && (
                        <p>
                          <strong>{label('Problema resolvido', 'Problem solved')}</strong> —{' '}
                          {editorial(selected.details.problem)}
                        </p>
                      )}
                    </section>
                  )}
                {/* ----- Conhecimentos e características documentadas ----- */}
                {Array.isArray(selected.details?.features) &&
                  selected.details.features.some((feature) => editorial(feature)) && (
                    <section className="ws-projects__case-section">
                      <div className="ws-projects__case-heading">
                        <Layers3 size={19} aria-hidden="true" />
                        <h4>{label('Funcionalidades', 'Features')}</h4>
                      </div>
                      <ul className="ws-projects__case-features">
                        {selected.details.features
                          .filter((feature) => editorial(feature))
                          .map((feature, index) => (
                            <li key={index}>{editorial(feature)}</li>
                          ))}
                      </ul>
                    </section>
                  )}
                {(editorial(selected.details?.challenges) ||
                  editorial(selected.details?.learnings)) && (
                    <div className="ws-projects__case-editorial-grid">
                      {editorial(selected.details?.challenges) && (
                        <section className="ws-projects__case-note">
                          <h4>{label('Desafios técnicos', 'Technical challenges')}</h4>
                          <p>{editorial(selected.details.challenges)}</p>
                        </section>
                      )}
                      {editorial(selected.details?.learnings) && (
                        <section className="ws-projects__case-note">
                          <h4>{label('Aprendizados', 'Lessons learned')}</h4>
                          <p>{editorial(selected.details.learnings)}</p>
                        </section>
                      )}
                    </div>
                  )}
                {/* ----- Documentação resumida em parágrafos legíveis ----- */}
                {readme.key === selected.id &&
                  readme.status === 'ready' &&
                  readme.paragraphs.length > 0 && (
                    <section className="ws-projects__case-section ws-projects__case-readme">
                      <div className="ws-projects__case-heading">
                        <FileText size={19} aria-hidden="true" />
                        <div>
                          <h4>{label('Documentação', 'Documentation')}</h4>
                          <span className="ws-projects__case-readme-caption">
                            {label('Prévia do README do GitHub', 'GitHub README preview')}
                          </span>
                        </div>
                      </div>
                      <div className="ws-projects__case-readme-preview">
                        {readme.paragraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      {safeExternalUrl(selected.repository) && (
                        <a
                          href={`${safeExternalUrl(selected.repository)}/blob/HEAD/README.md`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {label('Ler documentação completa', 'Read full documentation')}
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </a>
                      )}
                    </section>
                  )}
                {/* ----- Orientação discreta quando não há conteúdo adicional ----- */}
                {!editorial(selected.details?.description) &&
                  !editorial(selected.details?.objective) &&
                  !editorial(selected.details?.problem) &&
                  !selected.details?.features?.length &&
                  !editorial(selected.details?.challenges) &&
                  !editorial(selected.details?.learnings) &&
                  !(readme.key === selected.id && readme.paragraphs.length > 0) && (
                    <div className="ws-projects__case-intro-note">
                      <BookOpen size={19} aria-hidden="true" />
                      <p>
                        {label(
                          'As informações disponíveis deste projeto estão reunidas no resumo e no repositório do GitHub.',
                          'Available information about this project is summarized here and in its GitHub repository.',
                        )}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </section>
        ) : (
          <p role="status">
            {t(remote.status === 'loading' ? 'Carregando' : 'Projeto não encontrado.')}
          </p>
        )
      ) : (
        <>
          {/* === Destaques definidos pelo administrador === */}
          {featuredProjects.length > 0 && (
            <section
              className="ws-projects__group"
              aria-label={label('Projetos em destaque', 'Featured projects')}
            >
              <div className="ws-projects__group-heading">
                <div>
                  <h3>{label('Projetos em destaque', 'Featured projects')}</h3>
                  <p>
                    {label(
                      'Trabalhos selecionados pelo administrador.',
                      'Projects selected by the administrator.',
                    )}
                  </p>
                </div>
              </div>
              <div className="ws-projects__grid ws-projects__grid--featured">
                {featuredProjects.map((item) => renderProjectCard(item))}
              </div>
            </section>
          )}
          {/* === Catálogo e barra única de filtros === */}
          <section
            className="ws-projects__catalog"
            aria-label={label('Explorar projetos', 'Explore projects')}
          >
            <div className="ws-projects__catalog-heading">
              <h3>{label('Explorar projetos', 'Explore projects')}</h3>
            </div>
            <div className="ws-projects__filters">
              <label className="ws-projects__search">
                <span className="ws-projects__sr-only">{t('Pesquisar projetos')}</span>
                <span className="ws-projects__input-wrap">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('Pesquisar projetos')}
                    aria-label={t('Pesquisar projetos')}
                  />
                </span>
              </label>
              <div className="ws-projects__filter-field">
                <span className="ws-projects__filter-label">{t('Tecnologia')}</span>
                <Select
                  label={t('Tecnologia')}
                  value={technology}
                  onChange={setTechnology}
                  options={[
                    { value: 'all', label: t('Todas') },
                    ...technologies.map((item) => ({ value: item, label: item })),
                  ]}
                />
              </div>
              <div className="ws-projects__filter-field">
                <span className="ws-projects__filter-label">{t('Ordenar')}</span>
                <Select
                  label={t('Ordenar')}
                  value={order}
                  onChange={setOrder}
                  options={[
                    { value: 'updated', label: t('Atualização') },
                    { value: 'name', label: t('Nome') },
                  ]}
                />
              </div>
              <span className="ws-projects__count" role="status">
                {visible.length} {label('resultados', 'results')}
              </span>
            </div>
          </section>
          {/* === Catálogo completo sem duplicar os destaques === */}
          {regularProjects.length > 0 && (
            <section
              className="ws-projects__group"
              aria-label={label('Demais projetos', 'Remaining projects')}
            >
              {featuredProjects.length > 0 && (
                <div className="ws-projects__group-heading">
                  <FolderGit2 size={17} aria-hidden="true" />
                  <h3>{label('Demais projetos', 'Remaining projects')}</h3>
                </div>
              )}
              <div className="ws-projects__grid">
                {regularProjects.map((item) => renderProjectCard(item))}
              </div>
            </section>
          )}
          {visible.length === 0 && remote.status !== 'loading' && (
            <p className="ws-projects__empty" role="status">
              {t('Nenhum projeto encontrado. Ajuste os filtros ou cadastre projetos.')}
            </p>
          )}
        </>
      )}
    </article>
  );
}

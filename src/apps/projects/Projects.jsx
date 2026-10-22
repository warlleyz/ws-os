import { useCallback, useMemo, useRef, useState } from 'react';
import { openApp } from '../../core/appManager';
import { useSystem } from '../../core/useSystem';
import { portfolio, contentText } from '../../content/portfolioContent';
import { fetchGithubPortfolio } from '../../services/githubService';
import useAppBack from '../../shared/hooks/useAppBack';
import usePublicResource from '../../shared/hooks/usePublicResource';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { publicAssetUrl, safeExternalUrl } from '../../shared/utils/urls';
import { createProjectShareUrl, filterProjects, mergeProjects } from './projectModel';
import '../../styles/apps.css';
import './Projects.css';

export default function Projects({ instance }) {
  /* === Integrações e contexto === */
  const locale = useLocale();
  const { run } = useSystem();

  /* === Catálogo de projetos === */
  /* ----- Carregamento remoto ----- */
  const load = useCallback((options) => fetchGithubPortfolio(portfolio.githubUser, options), []);

  const remote = usePublicResource(load, 'github', Boolean(portfolio.githubUser));

  /* ----- Consolidação do catálogo ----- */
  const projects = useMemo(
    () => mergeProjects(portfolio.projects, remote.data?.repositories ?? []),
    [remote.data],
  );

  /* === Filtros e ordenação === */
  const [search, setSearch] = useState('');
  const [technology, setTechnology] = useState('all');
  const [order, setOrder] = useState('updated');

  const visible = filterProjects(projects, search, technology, order, locale, contentText);

  const technologies = useMemo(
    () => [...new Set(projects.flatMap((item) => item.technologies))].sort(),
    [projects],
  );

  /* === Navegação interna === */
  /* ----- Contexto de navegação ----- */
  const navigation = instance?.navigationRequestId ?? 0;

  const [selection, setSelection] = useState({
    request: navigation,
    id: instance?.params?.projectId ?? null,
  });

  const selectedId =
    selection.request === navigation ? selection.id : (instance?.params?.projectId ?? null);

  /* ----- Seleção de projeto ----- */
  function setSelectedId(id) {
    setSelection({
      request: navigation,
      id,
    });
  }

  /* ----- Retorno ao catálogo ----- */
  useAppBack(instance?.id, () => {
    if (!selectedId) return false;

    setSelectedId(null);
    return true;
  });

  /* ----- Projeto selecionado ----- */
  const selected = projects.find((item) => item.id === selectedId);

  /* === Link público e cópia === */
  const shareInputRef = useRef(null);
  const [copyResult, setCopyResult] = useState({ id: null, message: '' });
  const shareUrl = selected
    ? createProjectShareUrl(
        selected.id,
        new URL(import.meta.env.BASE_URL, window.location.origin).href,
      )
    : null;
  async function copyProjectLink() {
    if (!shareUrl || !selected) return;
    const id = selected.id;
    try {
      if (typeof navigator.clipboard?.writeText !== 'function')
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareUrl);
      setCopyResult({ id, message: 'Operação concluída.' });
    } catch {
      setCopyResult({ id, message: 'Não foi possível concluir a operação.' });
      if (shareInputRef.current?.value === shareUrl) {
        shareInputRef.current.focus();
        shareInputRef.current.select();
      }
    }
  }

  /* === Ações de projetos === */
  /* ----- Abertura de demonstrações ----- */
  function openDemo(demoId) {
    if (!selected || !instance?.id) return;

    run(openApp, 'demo-viewer', {
      origin: 'projects',
      originInstanceId: instance.id,
      params: {
        projectId: selected.id,
        demoId,
      },
    });
  }

  /* === Renderização === */
  return (
    <article className="desktop-window__content ws-app ws-projects">
      {/* === Apresentação === */}
      <header>
        <h2>{t('Projetos')}</h2>
        <p>{t('Projetos selecionados e repositórios públicos do GitHub.')}</p>
      </header>

      {/* === Barra de ferramentas === */}
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

      {/* === Estado dos dados remotos === */}
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

      {/* === Conteúdo principal === */}
      {selectedId ? (
        selected ? (
          <section>
            {/* ----- Informações do projeto ----- */}
            <h3>{contentText(selected.name, locale)}</h3>
            <p>{contentText(selected.description, locale)}</p>

            {publicAssetUrl(selected.image) && (
              <img
                key={selected.id}
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

            {/* ----- URL selecionável e cópia; não altera a navegação atual ----- */}
            {shareUrl && (
              <div className="ws-projects__share">
                <label>
                  {t('Projetos')} · URL
                  <input
                    ref={shareInputRef}
                    type="url"
                    readOnly
                    value={shareUrl}
                    aria-label={t('Projetos') + ' URL'}
                    onFocus={(event) => event.target.select()}
                  />
                </label>
                <button
                  type="button"
                  aria-label={'Ctrl+C: ' + t('Projetos')}
                  onClick={copyProjectLink}
                >
                  Ctrl+C
                </button>
                {copyResult.id === selected.id && <p role="status">{t(copyResult.message)}</p>}
              </div>
            )}

            {/* ----- Links e demonstrações ----- */}
            <div className="ws-app__toolbar">
              {safeExternalUrl(selected.repository) && (
                <a
                  href={safeExternalUrl(selected.repository)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('Repositório externo')}
                </a>
              )}

              {safeExternalUrl(selected.homepage) && (
                <a
                  href={safeExternalUrl(selected.homepage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('Site externo')}
                </a>
              )}

              {selected.demos.map((demo) => (
                <button key={demo.id} type="button" onClick={() => openDemo(demo.id)}>
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
          {/* ----- Pesquisa e filtros ----- */}
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

                {technologies.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
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

          {/* ----- Contagem de resultados ----- */}
          <p role="status">
            {t('Resultados')}: {visible.length}
          </p>

          {/* ----- Listagem de projetos ----- */}
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

          {/* ----- Estado vazio ----- */}
          {visible.length === 0 && remote.status !== 'loading' && (
            <p>{t('Nenhum projeto encontrado. Ajuste os filtros ou cadastre projetos.')}</p>
          )}
        </>
      )}
    </article>
  );
}

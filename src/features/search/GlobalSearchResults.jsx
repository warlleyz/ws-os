import { useEffect, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { executeSystemAction } from '../../services/actionService';
import { subscribePublicData } from '../../services/publicDataService';
import { fetchGithubPortfolio } from '../../services/githubService';
import { fetchNotes, normalizeNotes } from '../../services/notesService';
import { searchContent } from './searchService';

/* === RESULTADOS DA BUSCA GLOBAL === */
export default function GlobalSearchResults({ query, onOpen }) {
  const locale = useLocale();
  const [remote, setRemote] = useState({
    query: '',
    projects: [],
    posts: [],
    failed: false,
    warnings: [],
  });
  const term = query.trim();

  /* ----- CONSULTA DAS FONTES REMOTAS ----- */
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    let generation = 0;
    const load = () => {
      const request = ++generation;
      Promise.allSettled([
        portfolio.githubUser
          ? fetchGithubPortfolio(portfolio.githubUser, { signal: controller.signal })
          : Promise.resolve({ data: { repositories: [] } }),
        fetchNotes({ signal: controller.signal }),
      ]).then(([github, notes]) => {
        if (controller.signal.aborted || request !== generation) return;
        setRemote({
          query: term,
          projects: github.status === 'fulfilled' ? github.value.data.repositories : [],
          posts:
            notes.status === 'fulfilled' ? notes.value.data : normalizeNotes(portfolio.posts ?? []),
          failed: github.status === 'rejected' || notes.status === 'rejected',
          warnings: [
            github.status === 'fulfilled' && github.value.warning,
            notes.status === 'fulfilled' && notes.value.warning,
          ].filter(Boolean),
        });
      });
    };
    const timer = setTimeout(load, 300);
    const unsubscribe = subscribePublicData(({ prefix }) => {
      if (prefix.startsWith('/api/posts')) load();
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  /* ----- CONSOLIDAÇÃO DOS RESULTADOS ----- */
  const results = searchContent(term, {
    portfolio,
    projects: remote.query === term ? remote.projects : [],
    posts: remote.query === term ? remote.posts : normalizeNotes(portfolio.posts ?? []),
    locale,
    text: (value) => contentText(value, locale),
    translate: t,
  });
  if (term.length < 2) return null;

  /* === INTERFACE DOS RESULTADOS === */
  return (
    <section className="ws-global-search" aria-label={t('Conteúdo e configurações')}>
      <h3>
        <Search size={14} />
        {t('Conteúdo e configurações')}
      </h3>
      {remote.query !== term && <p role="status">{t('Carregando')}</p>}
      {remote.query === term && remote.failed && (
        <p role="status">
          {t('Não foi possível atualizar a busca remota. Resultados locais continuam disponíveis.')}
        </p>
      )}
      {remote.query === term &&
        remote.warnings.map((warning) => (
          <p role="status" key={warning}>
            {t(warning)}
          </p>
        ))}
      {results.map((item) => (
        <button
          type="button"
          key={item.key}
          onClick={() => {
            void executeSystemAction(
              { id: 'app.open', params: { appId: item.appId, params: item.params } },
              { context: 'search', onOpen },
            );
          }}
        >
          <span>
            <strong>{item.label}</strong>
            <small>
              {t(
                item.kind === 'project'
                  ? 'Projetos'
                  : item.kind === 'post'
                    ? 'Notas'
                    : item.kind === 'setting'
                      ? 'Configurações'
                      : item.kind === 'certificate'
                        ? 'Certificados'
                        : 'Sobre Mim',
              )}
            </small>
          </span>
          <ArrowUpRight size={16} />
        </button>
      ))}
      {remote.query === term && !results.length && (
        <p role="status">{t('Nenhum conteúdo encontrado.')}</p>
      )}
    </section>
  );
}

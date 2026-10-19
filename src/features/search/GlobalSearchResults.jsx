import { subscribePublicData } from '../../services/publicDataService';
import { useEffect, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { fetchGithubPortfolio } from '../../services/githubService';
import { fetchNotes, normalizeNotes } from '../../services/notesService';
import { searchContent } from './searchService';

export default function GlobalSearchResults({ query, onOpen }) {
  const locale = useLocale(),
    [remote, setRemote] = useState({ query: '', projects: [], posts: [] });
  const term = query.trim();
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    let generation = 0;
    const load = () => {
      const request = ++generation;
      Promise.allSettled([
        fetchGithubPortfolio(portfolio.githubUser, { signal: controller.signal }),
        fetchNotes({ signal: controller.signal }),
      ]).then(([github, notes]) => {
        if (controller.signal.aborted || request !== generation) return;
        setRemote({
          query: term,
          projects: github.status === 'fulfilled' ? github.value.data.repositories : [],
          posts: notes.status === 'fulfilled' ? notes.value.data : [],
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
  const results = searchContent(term, {
    portfolio,
    projects: remote.query === term ? remote.projects : [],
    posts: remote.query === term ? remote.posts : normalizeNotes(portfolio.posts ?? []),
    locale,
    text: (value) => contentText(value, locale),
    translate: t,
  });
  if (term.length < 2) return null;
  return (
    <section className="ws-global-search" aria-label={t('Conteúdo e configurações')}>
      <h3>
        <Search size={14} />
        {t('Conteúdo e configurações')}
      </h3>
      {results.map((item) => (
        <button type="button" key={item.key} onClick={() => onOpen(item.appId, item.params)}>
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
      {!results.length && <p role="status">{t('Nenhum conteúdo encontrado.')}</p>}
    </section>
  );
}

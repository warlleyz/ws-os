import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CalendarDays, FileText, NotebookPen, RefreshCw, Search } from 'lucide-react';

import { invalidatePublicData } from '../../services/publicDataService';
import { contentText } from '../../content/portfolioContent';
import { fetchNotes } from '../../services/notesService';
import { isAdminAuthenticated, subscribeAdminSession } from '../../services/authService';
import usePublicResource from '../../shared/hooks/usePublicResource';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import PostLikes from './PostLikes';
import PostAttachments from './PostAttachments';
import NotesAdmin from './NotesAdmin';

import '../../styles/apps.css';
import './Notes.css';

/* === PESQUISA E DATAS === */
function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDate(value, locale) {
  if (!value || Number.isNaN(Date.parse(value))) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

/* === FEED DE NOTAS === */
export default function Notes({ instance }) {
  /* ----- Idioma e recursos ----- */
  const locale = useLocale();
  const resource = usePublicResource(fetchNotes, 'notes', true, {
    invalidateOn: ['/api/posts'],
  });

  /* ----- Navegação e pesquisa ----- */
  const navigation = instance?.navigationRequestId ?? 0;
  const [search, setSearch] = useState({ navigation, value: '' });
  const query = search.navigation === navigation ? search.value : '';
  const targetId = instance?.params?.postId;
  const targetRef = useRef(null);
  const focusedNavigationRef = useRef(null);

  /* ----- Autenticação e publicações ----- */
  const isAdmin = useSyncExternalStore(
    subscribeAdminSession,
    isAdminAuthenticated,
    () => false,
  );

  const posts = resource.data ?? [];
  const visible = posts.filter((post) =>
    normalizeText(
      [
        contentText(post.title, locale),
        contentText(post.summary, locale),
        contentText(post.body, locale),
        ...(post.tags ?? []),
      ].join(' '),
    ).includes(normalizeText(query)),
  );

  const loading = resource.status === 'loading';

  /* ----- Destinos da busca e links compartilhados ----- */
  useEffect(() => {
    const destination = `${navigation}:${targetId}`;

    if (
      !targetId ||
      resource.status !== 'ready' ||
      !targetRef.current ||
      focusedNavigationRef.current === destination
    )
      return;

    focusedNavigationRef.current = destination;
    targetRef.current?.scrollIntoView?.({ block: 'nearest' });
    targetRef.current?.focus({ preventScroll: true });
  }, [targetId, navigation, resource.status]);

  /* ----- Interface ----- */
  return (
    <article className="desktop-window__content ws-app notes-app">
      {/* ----- Identidade V2.1 ----- */}
      <header className="notes-app__hero">
        <div className="notes-app__hero-copy">
          <span className="notes-app__eyebrow">WS OS / NOTES</span>
          <h2>{t('Notas')}</h2>
          <p>{t('Publicações, estudos e registros públicos.')}</p>
        </div>
        <NotebookPen
          className="notes-app__hero-icon"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </header>

      {/* ----- Pesquisa e ações ----- */}
      <div className="notes-app__toolbar" role="group" aria-label={t('Publicações')}>
        <label className="notes-app__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setSearch({ navigation, value: event.target.value })}
            placeholder={t('Buscar publicações')}
            aria-label={t('Buscar publicações')}
          />
        </label>
        <button
          className="notes-app__refresh"
          type="button"
          onClick={resource.refresh}
          disabled={loading}
          title={t('Atualizar publicações')}
          aria-label={t('Atualizar publicações')}
        >
          <RefreshCw size={18} aria-hidden="true" />
        </button>
        <NotesAdmin
          instanceId={instance?.id}
          isAdmin={isAdmin}
          refreshPublicPosts={() => invalidatePublicData('/api/posts')}
        />
      </div>

      {/* ----- Estados da consulta ----- */}
      {loading && (
        <p className="notes-app__notice" role="status">
          {t('Carregando')}
        </p>
      )}

      {resource.status === 'error' && (
        <p className="notes-app__notice notes-app__notice--error" role="alert">
          {t(resource.error)}
        </p>
      )}

      {resource.warning && (
        <p className="notes-app__notice" role="status">
          {t(resource.warning)}
        </p>
      )}

      {resource.status === 'ready' &&
        targetId &&
        !posts.some((post) => post.id === targetId) && (
          <p className="notes-app__notice" role="status">
            {t('Esta publicação não está disponível.')}
          </p>
        )}

      {resource.status === 'ready' && visible.length === 0 && (
        <section className="notes-app__empty" role="status">
          <FileText size={30} strokeWidth={1.5} aria-hidden="true" />
          <p>
            {t(
              posts.length
                ? 'Nenhuma publicação encontrada.'
                : 'Nenhuma publicação disponível. O conteúdo será adicionado pelo autor.',
            )}
          </p>
        </section>
      )}

      {/* ----- Notas completas ----- */}
      <div className="notes-app__feed" aria-busy={loading}>
        {visible.map((post) => (
          <article
            key={post.id}
            className="notes-app__card"
            tabIndex={-1}
            ref={post.id === targetId ? targetRef : undefined}
            aria-label={contentText(post.title, locale)}
          >
            {/* ----- Cabeçalho da publicação ----- */}
            <header className="notes-app__card-header">
              <div className="notes-app__card-meta">
                <span>
                  <FileText size={14} aria-hidden="true" />
                  {t('Publicação')}
                </span>
                {formatDate(post.publishedAt, locale) && (
                  <time dateTime={post.publishedAt}>
                    <CalendarDays size={14} aria-hidden="true" />
                    {formatDate(post.publishedAt, locale)}
                  </time>
                )}
              </div>

              <h3>{contentText(post.title, locale)}</h3>

              {contentText(post.summary, locale) && (
                <p className="notes-app__summary">
                  {contentText(post.summary, locale)}
                </p>
              )}

              {(post.tags ?? []).length > 0 && (
                <div className="notes-app__tags">
                  {post.tags.map((tag) => (
                    <span className="notes-app__tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* ----- Conteúdo da publicação ----- */}
            <div className="notes-app__body">
              {contentText(post.body, locale)}
            </div>

            {/* ----- Anexos e curtidas ----- */}
            <footer className="notes-app__card-footer">
              <PostAttachments postId={post.id} instanceId={instance?.id} />
              <PostLikes postId={post.id} />
            </footer>
          </article>
        ))}
      </div>
    </article>
  );
}

import { useState, useSyncExternalStore } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  NotebookPen,
  RefreshCw,
  Search,
} from 'lucide-react';

import { invalidatePublicData } from '../../services/publicDataService';
import { contentText } from '../../content/portfolioContent';
import { fetchNotes } from '../../services/notesService';
import {
  isAdminAuthenticated,
  subscribeAdminSession,
} from '../../services/authService';
import usePublicResource from '../../shared/hooks/usePublicResource';
import useAppBack from '../../shared/hooks/useAppBack';
import Select from '../../shared/components/Select';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import PostLikes from './PostLikes';
import PostAttachments from './PostAttachments';
import NotesAdmin from './NotesAdmin';

import '../../styles/apps.css';
import './Notes.css';

/* === UTILITÁRIOS === */
function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatDate(value, locale) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/* === APLICATIVO NOTAS === */
export default function Notes({ instance }) {
  const locale = useLocale();

  /* === DADOS PÚBLICOS === */
  const resource = usePublicResource(
    fetchNotes,
    'notes',
    true,
    { invalidateOn: ['/api/posts'] },
  );

  /* === PESQUISA E FILTROS === */
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');

  /* === NAVEGAÇÃO === */
  const navigation = instance?.navigationRequestId ?? 0;

  const [selection, setSelection] = useState({
    request: navigation,
    id: instance?.params?.postId ?? null,
  });

  const selectedId =
    selection.request === navigation
      ? selection.id
      : (instance?.params?.postId ?? null);

  function setSelectedId(value) {
    setSelection((current) => ({
      request: navigation,
      id: typeof value === 'function'
        ? value(current.id)
        : value,
    }));
  }

  useAppBack(instance?.id, () => {
    if (!selectedId) return false;
    setSelectedId(null);
    return true;
  });

  /* === ADMINISTRAÇÃO === */
  const isAdmin = useSyncExternalStore(
    subscribeAdminSession,
    isAdminAuthenticated,
    () => false,
  );

  /* === PUBLICAÇÕES === */
  const posts = resource.data ?? [];
  const selected = posts.find((post) => post.id === selectedId);

  const tags = [
    ...new Set(posts.flatMap((post) => post.tags ?? [])),
  ].sort((a, b) => a.localeCompare(b, locale));

  const visible = posts.filter((post) => {
    const postTags = post.tags ?? [];
    if (tag && !postTags.includes(tag)) return false;

    const searchable = [
      contentText(post.title, locale),
      contentText(post.summary, locale),
      contentText(post.body, locale),
      ...postTags,
    ].join(' ');

    return normalizeText(searchable).includes(normalizeText(query));
  });

  const isLoading = resource.status === 'loading';

  /* === INTERFACE === */
  return (
    <article className="desktop-window__content ws-app notes-app">
      {/* === CABEÇALHO PADRÃO V2 === */}
      <header className="notes-app__hero">
        <div className="notes-app__hero-copy">
          <span className="notes-app__eyebrow">
            WS OS / NOTES
          </span>

          <h2>{t('Notas')}</h2>

          <p>
            {t('Publicações, estudos e registros públicos.')}
          </p>
        </div>

        <NotebookPen
          className="notes-app__hero-icon"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </header>

      {/* === ADMINISTRAÇÃO === */}
      <NotesAdmin
        instanceId={instance.id}
        isAdmin={isAdmin}
        refreshPublicPosts={() => {
          invalidatePublicData('/api/posts');
        }}
        onDeletePublicPost={(id) => {
          setSelectedId((current) =>
            current === id ? null : current
          );
        }}
      />

      {/* === ESTADOS DO SERVIÇO === */}
      {isLoading && (
        <p className="notes-app__notice" role="status">
          {t('Carregando')}
        </p>
      )}

      {resource.status === 'error' && (
        <p
          className="notes-app__notice notes-app__notice--error"
          role="alert"
        >
          {t(resource.error)}
        </p>
      )}

      {resource.warning && (
        <p className="notes-app__notice" role="status">
          {t(resource.warning)}
        </p>
      )}

      {/* === VISUALIZAÇÃO DA PUBLICAÇÃO === */}
      {selected ? (
        <section
          className="notes-app__article"
          aria-label={t('Publicação')}
        >
          {/* ----- NAVEGAÇÃO ----- */}
          <div className="notes-app__article-toolbar">
            <button
              className="notes-app__back"
              type="button"
              onClick={() => setSelectedId(null)}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              {t('Voltar para publicações')}
            </button>
          </div>

          {/* === PUBLICAÇÃO COMPLETA === */}
          <article className="notes-app__reading-card">
            {/* ----- CABEÇALHO DO CARD ----- */}
            <header className="notes-app__reading-header">
              <div className="notes-app__reading-meta">
                <span className="notes-app__reading-type">
                  <FileText size={15} aria-hidden="true" />
                  {t('Publicação')}
                </span>

                {selected.publishedAt && (
                  <time dateTime={selected.publishedAt}>
                    <CalendarDays size={15} aria-hidden="true" />
                    {formatDate(selected.publishedAt, locale)}
                  </time>
                )}
              </div>

              <h3>{contentText(selected.title, locale)}</h3>

              {contentText(selected.summary, locale) && (
                <p className="notes-app__reading-summary">
                  {contentText(selected.summary, locale)}
                </p>
              )}

              {(selected.tags ?? []).length > 0 && (
                <div className="notes-app__tags">
                  {selected.tags.map((value) => (
                    <span className="notes-app__tag" key={value}>
                      {value}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* ----- CORPO DA NOTA ----- */}
            <div className="notes-app__reading-content">
              <div className="notes-app__body">
                {contentText(selected.body, locale)}
              </div>
            </div>

            {/* ----- ANEXOS E INTERAÇÃO ----- */}
            <footer className="notes-app__reading-footer">
              <PostAttachments
                key={selected.id}
                postId={selected.id}
                instanceId={instance.id}
              />

              <PostLikes
                key={selected.id}
                postId={selected.id}
              />
            </footer>
          </article>
        </section>
      ) : selectedId ? (
        /* === PUBLICAÇÃO INDISPONÍVEL === */
        <section className="notes-app__empty">
          <FileText
            size={28}
            strokeWidth={1.5}
            aria-hidden="true"
          />

          {resource.status === 'ready' && (
            <p role="status">
              {t('Esta publicação não está disponível.')}
            </p>
          )}

          <button
            type="button"
            className="notes-app__back"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t('Voltar para publicações')}
          </button>
        </section>
      ) : (
        /* === BIBLIOTECA === */
        <section className="notes-app__library">
          {/* ----- BARRA DE FERRAMENTAS ----- */}
          <div className="notes-app__toolbar">
            <label className="notes-app__search">
              <Search size={18} aria-hidden="true" />

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('Buscar publicações')}
                aria-label={t('Buscar publicações')}
              />
            </label>

            <div className="notes-app__filter">
              <Select
                label={t('Assunto')}
                value={tag}
                options={[
                  { value: '', label: t('Todos') },
                  ...tags.map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
                onChange={setTag}
                className="notes-app__subject-select"
              />
            </div>

            <button
              className="notes-app__refresh"
              type="button"
              onClick={resource.refresh}
              disabled={isLoading}
              title={t('Atualizar publicações')}
              aria-label={t('Atualizar publicações')}
            >
              <RefreshCw size={17} aria-hidden="true" />
            </button>
          </div>

          {/* ----- CONTAGEM ----- */}
          {posts.length > 0 && (
            <div className="notes-app__library-heading">
              <span>{t('Publicações')}</span>

              <span className="notes-app__result-count">
                {visible.length}
              </span>
            </div>
          )}

          {/* ----- BIBLIOTECA VAZIA ----- */}
          {resource.status === 'ready' && posts.length === 0 && (
            <div className="notes-app__empty" role="status">
              <FileText size={28} aria-hidden="true" />

              <p>
                {t(
                  'Nenhuma publicação disponível. O conteúdo será adicionado pelo autor.',
                )}
              </p>
            </div>
          )}

          {/* ----- SEM RESULTADOS ----- */}
          {posts.length > 0 && visible.length === 0 && (
            <div className="notes-app__empty" role="status">
              <Search size={28} aria-hidden="true" />
              <p>{t('Nenhuma publicação encontrada.')}</p>
            </div>
          )}

          {/* ----- CARDS DE PUBLICAÇÕES ----- */}
          <div className="notes-app__grid">
            {visible.map((post) => (
              <article
                key={post.id}
                className="notes-app__card"
              >
                <div className="notes-app__card-meta">
                  <span className="notes-app__card-type">
                    <FileText size={14} aria-hidden="true" />
                    {t('Publicação')}
                  </span>

                  {post.publishedAt && (
                    <time dateTime={post.publishedAt}>
                      {formatDate(post.publishedAt, locale)}
                    </time>
                  )}
                </div>

                <h3>{contentText(post.title, locale)}</h3>

                <p className="notes-app__card-summary">
                  {contentText(post.summary, locale)}
                </p>

                {(post.tags ?? []).length > 0 && (
                  <div className="notes-app__tags">
                    {post.tags.map((value) => (
                      <span
                        key={value}
                        className="notes-app__tag"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="notes-app__card-action"
                  onClick={() => setSelectedId(post.id)}
                  aria-label={`${t('Ler publicação')}: ${contentText(post.title, locale)}`}
                >
                  <span>{t('Ler publicação')}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

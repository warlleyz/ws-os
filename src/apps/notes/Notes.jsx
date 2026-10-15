import { useState } from 'react';
import { contentText } from '../../content/portfolioContent';
import { fetchNotes } from '../../services/notesService';
import usePublicResource from '../../shared/hooks/usePublicResource';
import useAppBack from '../../shared/hooks/useAppBack';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import '../../styles/apps.css';
import './Notes.css';

const searchText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export default function Notes({ instance }) {
  const locale = useLocale();
  const resource = usePublicResource(fetchNotes, 'notes');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  useAppBack(instance.id, selectedId ? () => setSelectedId(null) : null);
  const posts = resource.data ?? [];
  const selected = posts.find((post) => post.id === selectedId);
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) =>
    a.localeCompare(b, locale),
  );
  const visible = posts.filter(
    (post) =>
      (!tag || post.tags.includes(tag)) &&
      searchText(
        [
          contentText(post.title, locale),
          contentText(post.summary, locale),
          contentText(post.body, locale),
          ...post.tags,
        ].join(' '),
      ).includes(searchText(query)),
  );
  return (
    <article className="desktop-window__content ws-app notes-app">
      <h2>{t('Notas')}</h2>
      <p>{t('Publicações, estudos e registros públicos.')}</p>
      {resource.status === 'loading' && <p role="status">{t('Carregando')}</p>}
      {resource.status === 'error' && <p role="alert">{t(resource.error)}</p>}
      {resource.warning && <p role="status">{t(resource.warning)}</p>}
      <button type="button" onClick={resource.refresh} disabled={resource.status === 'loading'}>
        {t('Atualizar publicações')}
      </button>
      {selected ? (
        <section aria-label={t('Publicação')}>
          <button type="button" onClick={() => setSelectedId(null)}>
            {t('Voltar para publicações')}
          </button>
          <h3>{contentText(selected.title, locale)}</h3>
          <time dateTime={selected.publishedAt}>
            {new Date(selected.publishedAt).toLocaleDateString(locale)}
          </time>
          <p>{selected.tags.join(' · ')}</p>
          <div className="notes-app__body">{contentText(selected.body, locale)}</div>
        </section>
      ) : (
        <>
          <div className="ws-app__filters">
            <label>
              {t('Buscar publicações')}
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              {t('Assunto')}
              <select value={tag} onChange={(event) => setTag(event.target.value)}>
                <option value="">{t('Todos')}</option>
                {tags.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {resource.status === 'ready' && !posts.length && (
            <p role="status">
              {t('Nenhuma publicação disponível. O conteúdo será adicionado pelo autor.')}
            </p>
          )}
          {!!posts.length && !visible.length && (
            <p role="status">{t('Nenhuma publicação encontrada.')}</p>
          )}
          <div className="ws-app__grid">
            {visible.map((post) => (
              <section className="ws-app__card" key={post.id}>
                <h3>{contentText(post.title, locale)}</h3>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(locale)}
                </time>
                <p>{contentText(post.summary, locale)}</p>
                <p>{post.tags.join(' · ')}</p>
                <button type="button" onClick={() => setSelectedId(post.id)}>
                  {t('Ler publicação')}: {contentText(post.title, locale)}
                </button>
              </section>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

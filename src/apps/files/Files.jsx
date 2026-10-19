import { useEffect, useRef, useState } from 'react';
import {
  House,
  FolderOpen,
  ShieldCheck,
  Trash2,
  LayoutGrid,
  List,
  Folder,
  FileText,
  FileImage,
  FileCode2,
  Search,
  MoreHorizontal,
  Info,
  Upload,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { publicAssetUrl } from '../../shared/utils/urls';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import useAppBack from '../../shared/hooks/useAppBack';
import useLocalFiles from '../../shared/hooks/useLocalFiles';
import {
  changeLocalFile,
  changeLocalFiles,
  createLocalFolder,
  createLocalText,
  uploadLocalFile,
} from '../../services/storage/localFilesStorage';
import { fileKind } from '../../services/storage/fileModel';
import '../../styles/apps.css';
import './Files.css';

function preference(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Uso da sessão preservado. */
  }
}
function iconFor(item) {
  return item.kind === 'folder'
    ? Folder
    : fileKind(item.name) === 'image'
      ? FileImage
      : /\.(js|css|html|json)$/i.test(item.name)
        ? FileCode2
        : FileText;
}
function normalized(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function Files({ instance }) {
  const locale = useLocale(),
    { run } = useSystem(),
    store = useLocalFiles();
  const [space, setSpace] = useState(() => {
    const saved = preference('ws-os:files-location', {});
    return ['home', 'personal', 'official', 'trash'].includes(saved.space) ? saved.space : 'home';
  });
  const [folderId, setFolderId] = useState(
    () => preference('ws-os:files-location', {}).folderId ?? null,
  );
  const [viewMode, setViewMode] = useState(() => {
    try {
      const raw = localStorage.getItem('ws-os:files-view');
      return raw === 'list' || raw === '"list"' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const [sort, setSort] = useState(() =>
    ['name', 'updated', 'size'].includes(preference('ws-os:files-sort', 'name'))
      ? preference('ws-os:files-sort', 'name')
      : 'name',
  );
  const [query, setQuery] = useState(''),
    [globalSearch, setGlobalSearch] = useState(false),
    [selected, setSelected] = useState([]);
  const [details, setDetails] = useState(false),
    [context, setContext] = useState(null),
    [action, setAction] = useState(null);
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const inputRef = useRef(null),
    busyRef = useRef(false),
    contextRef = useRef(null);
  const folder = store.entries.find(
    (item) => item.id === folderId && item.kind === 'folder' && !item.trashed,
  );
  const unavailableFolder = space === 'personal' && folderId !== null && !folder && !store.loading;
  const parentId = folder?.id ?? null;
  const officialFiles = portfolio.officialFiles.filter((item) => publicAssetUrl(item.url));
  const currentSelection = store.entries.filter(
    (item) => selected.includes(item.id) && (space === 'trash' ? item.trashed : !item.trashed),
  );
  const current = currentSelection.length === 1 ? currentSelection[0] : null;
  const breadcrumbs = [];
  for (
    let current = folder;
    current;
    current = store.entries.find((item) => item.id === current.parentId && !item.trashed)
  )
    breadcrumbs.unshift(current);

  function navigate(nextSpace, id = null) {
    if (busyRef.current) return;
    setSpace(nextSpace);
    setFolderId(id);
    setSelected([]);
    setAction(null);
    setContext(null);
    setQuery('');
    persist('ws-os:files-location', { space: nextSpace, folderId: id });
  }
  useAppBack(instance?.id, () => {
    if (busyRef.current) return true;
    if (context) {
      setContext(null);
      return true;
    }
    if (action) {
      setAction(null);
      return true;
    }
    if (space === 'personal' && (parentId || unavailableFolder)) {
      navigate('personal', folder?.parentId ?? null);
      return true;
    }
    if (space !== 'home') {
      navigate('home');
      return true;
    }
    return false;
  });
  useEffect(() => {
    if (!context) return;
    contextRef.current?.querySelector('button')?.focus();
    function close(event) {
      if (!contextRef.current?.contains(event.target)) setContext(null);
    }
    function key(event) {
      if (event.key === 'Escape') setContext(null);
    }
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', key);
    };
  }, [context]);

  async function perform(operation) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await operation();
      setAction(null);
      setSelected([]);
      setContext(null);
      setMessage('Operação concluída.');
      return result;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function open(item, edit = false) {
    if (item.kind === 'folder') {
      navigate('personal', item.id);
      return;
    }
    run(openApp, edit ? 'file-editor' : 'file-viewer', {
      origin: 'files',
      params: { fileId: item.id },
    });
  }
  function select(event, item) {
    if (busy) return;
    setSelected((previous) =>
      event.ctrlKey || event.metaKey
        ? previous.includes(item.id)
          ? previous.filter((id) => id !== item.id)
          : [...previous, item.id]
        : [item.id],
    );
    setContext(null);
  }
  const term = normalized(query.trim());
  const visible = store.entries
    .filter((item) => {
      const inSpace =
        space === 'trash'
          ? item.trashed && !store.entries.find((parent) => parent.id === item.parentId)?.trashed
          : !unavailableFolder &&
            !item.trashed &&
            (globalSearch && term ? true : item.parentId === parentId);
      return inSpace && (!term || normalized(item.name).includes(term));
    })
    .sort((a, b) =>
      a.kind !== b.kind
        ? a.kind === 'folder'
          ? -1
          : 1
        : sort === 'updated'
          ? b.updatedAt - a.updatedAt
          : sort === 'size'
            ? (b.blob?.size ?? 0) - (a.blob?.size ?? 0)
            : a.name.localeCompare(b.name, locale),
    );
  async function batch(type) {
    if (!currentSelection.length) return;
    if (type === 'purge') {
      setAction({ type: 'purge', ids: currentSelection.map((item) => item.id) });
      return;
    }
    await perform(() => changeLocalFiles(currentSelection.map((item) => ({ type, id: item.id }))));
  }
  async function submitAction(event) {
    event.preventDefault();
    if (!action) return;
    if (action.type.startsWith('create-') && unavailableFolder) {
      setMessage('Pasta de destino indisponível.');
      return;
    }
    await perform(async () => {
      if (action.type === 'create-folder') return createLocalFolder(action.name, parentId);
      if (action.type === 'create-file') {
        const file = await createLocalText(action.name, parentId);
        open(file, true);
        return file;
      }
      if (action.type === 'rename')
        return changeLocalFile({ type: 'rename', id: action.id, name: action.name });
      return changeLocalFiles(
        action.ids.map((id) => ({ type: action.type, id, parentId: action.parentId ?? null })),
      );
    });
  }
  const selectionTools = (ids = currentSelection.map((item) => item.id), item = current) => (
    <>
      {space === 'trash' ? (
        <>
          <button type="button" disabled={busy || !ids.length} onClick={() => batch('restore')}>
            {t('Restaurar')}
          </button>
          <button type="button" disabled={busy || !ids.length} onClick={() => batch('purge')}>
            {t('Excluir definitivamente')}
          </button>
        </>
      ) : (
        <>
          <button type="button" disabled={busy || !item} onClick={() => open(item)}>
            {t('Abrir')}
          </button>
          {item?.kind === 'file' && fileKind(item.name) === 'text' && (
            <button type="button" disabled={busy} onClick={() => open(item, true)}>
              {t('Editar')}
            </button>
          )}
          <button
            type="button"
            disabled={busy || !item}
            onClick={() => {
              setAction({ type: 'rename', id: item.id, name: item.name });
              setContext(null);
            }}
          >
            {t('Renomear')}
          </button>
          <button
            type="button"
            disabled={busy || !ids.length}
            onClick={() => {
              setAction({ type: 'move', ids, parentId: null });
              setContext(null);
            }}
          >
            {t('Mover item')}
          </button>
          <button type="button" disabled={busy || !ids.length} onClick={() => batch('trash')}>
            {t('Mover para lixeira')}
          </button>
        </>
      )}
    </>
  );

  return (
    <article className="desktop-window__content ws-app ws-files">
      <div className="ws-files__layout">
        <aside className="ws-files__sidebar" aria-label={t('Locais')}>
          <nav className="ws-files__navigation">
            {[
              ['home', 'Início', House],
              ['personal', 'Meus arquivos', FolderOpen],
              ['official', 'Arquivos oficiais', ShieldCheck],
              ['trash', 'Lixeira', Trash2],
            ].map(([id, label, Icon]) => (
              <button
                type="button"
                key={id}
                disabled={busy}
                aria-pressed={space === id}
                onClick={() => navigate(id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{t(label)}</span>
              </button>
            ))}
            <p className="ws-app__muted">{t('Arquivos pessoais ficam neste navegador.')}</p>
          </nav>
        </aside>
        <main className="ws-files__main">
          <nav className="ws-files__breadcrumbs" aria-label={t('Caminho da pasta')}>
            <button
              type="button"
              aria-label={t('Início')}
              onClick={() => navigate('home')}
              disabled={busy}
            >
              <House size={16} />
            </button>
            {space !== 'home' && (
              <button type="button" onClick={() => navigate(space)} disabled={busy}>
                {t(
                  space === 'personal'
                    ? 'Meus arquivos'
                    : space === 'official'
                      ? 'Arquivos oficiais'
                      : 'Lixeira',
                )}
              </button>
            )}
            {breadcrumbs.map((item) => (
              <button
                type="button"
                key={item.id}
                disabled={busy}
                onClick={() => navigate('personal', item.id)}
              >
                {item.name}
              </button>
            ))}
          </nav>
          {space === 'home' ? (
            <section className="ws-files__home">
              <header>
                <p className="ws-app__eyebrow">WS OS / {t('Arquivos')}</p>
                <h2>{t('Seu espaço, organizado.')}</h2>
                <p>{t('Acesse seus arquivos e documentos em um só lugar.')}</p>
              </header>
              <div className="ws-files__home-grid">
                {[
                  ['personal', 'Meus arquivos', FolderOpen],
                  ['official', 'Arquivos oficiais', ShieldCheck],
                  ['trash', 'Lixeira', Trash2],
                ].map(([id, label, Icon]) => (
                  <button
                    type="button"
                    className="ws-files__home-card"
                    key={id}
                    onClick={() => navigate(id)}
                  >
                    <Icon size={28} />
                    <strong>{t(label)}</strong>
                    <span>
                      {id === 'official'
                        ? officialFiles.length
                        : store.entries.filter((item) =>
                            id === 'trash' ? item.trashed : !item.trashed,
                          ).length}{' '}
                      {t('itens')}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              <div className="ws-files__commandbar">
                <label className="ws-files__search">
                  <Search size={16} />
                  <input
                    type="search"
                    aria-label={t('Pesquisar arquivos')}
                    placeholder={t('Pesquisar arquivos')}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelected([]);
                    }}
                  />
                </label>
                {space === 'personal' && (
                  <label className="ws-files__check">
                    <input
                      type="checkbox"
                      checked={globalSearch}
                      onChange={(event) => setGlobalSearch(event.target.checked)}
                    />
                    {t('Todas as pastas')}
                  </label>
                )}
                <label>
                  {t('Ordenar')}
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      persist('ws-os:files-sort', event.target.value);
                    }}
                  >
                    <option value="name">{t('Nome')}</option>
                    <option value="updated">{t('Atualização')}</option>
                    <option value="size">{t('Tamanho')}</option>
                  </select>
                </label>
                <div className="ws-files__view-controls">
                  <button
                    type="button"
                    aria-label={t('Visualização em grade')}
                    aria-pressed={viewMode === 'grid'}
                    onClick={() => {
                      setViewMode('grid');
                      persist('ws-os:files-view', 'grid');
                    }}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('Visualização em lista')}
                    aria-pressed={viewMode === 'list'}
                    onClick={() => {
                      setViewMode('list');
                      persist('ws-os:files-view', 'list');
                    }}
                  >
                    <List size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={t('Detalhes')}
                  aria-pressed={details}
                  onClick={() => setDetails((value) => !value)}
                >
                  <Info size={18} />
                </button>
              </div>
              {space === 'personal' && (
                <div className="ws-app__toolbar ws-files__create">
                  {(parentId || unavailableFolder) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => navigate('personal', folder?.parentId ?? null)}
                    >
                      <ArrowLeft size={16} />
                      {t('Pasta anterior')}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || store.loading || unavailableFolder}
                    onClick={() => setAction({ type: 'create-folder', name: '' })}
                  >
                    <Plus size={16} />
                    {t('Criar pasta')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || store.loading || unavailableFolder}
                    onClick={() => setAction({ type: 'create-file', name: '' })}
                  >
                    {t('Criar arquivo de texto')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || store.loading || unavailableFolder}
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload size={16} />
                    {t('Importar arquivo')}
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    hidden
                    accept=".txt,.md,.json,.csv,.log,.js,.css,.html,.png,.jpg,.jpeg,.webp,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file && !unavailableFolder)
                        perform(() => uploadLocalFile(file, parentId));
                    }}
                  />
                </div>
              )}
              {space !== 'official' && (
                <div className="ws-app__toolbar ws-files__selection">
                  <label className="ws-files__check">
                    <input
                      type="checkbox"
                      aria-label={t('Selecionar todos')}
                      checked={
                        visible.length > 0 && visible.every((item) => selected.includes(item.id))
                      }
                      onChange={(event) =>
                        setSelected(event.target.checked ? visible.map((item) => item.id) : [])
                      }
                    />
                    {currentSelection.length} {t('selecionados')}
                  </label>
                  {selectionTools()}
                </div>
              )}
              {store.loading && <p role="status">{t('Carregando')}</p>}
              {store.error && <p role="alert">{t(store.error)}</p>}
              {unavailableFolder && <p role="status">{t('Pasta de destino indisponível.')}</p>}
              <p role="status">{t(message)}</p>
              {action && (
                <form className="ws-app__card ws-files__dialog" onSubmit={submitAction}>
                  <h3>
                    {t(
                      action.type === 'rename'
                        ? 'Renomear'
                        : action.type === 'move'
                          ? 'Mover item'
                          : action.type === 'purge'
                            ? 'Excluir definitivamente'
                            : action.type === 'create-folder'
                              ? 'Criar pasta'
                              : 'Criar arquivo de texto',
                    )}
                  </h3>
                  {['rename', 'create-folder', 'create-file'].includes(action.type) && (
                    <label>
                      {t('Nome')}
                      <input
                        aria-label={t('Nome do novo item')}
                        autoFocus
                        value={action.name}
                        maxLength={120}
                        required
                        disabled={busy}
                        onChange={(event) => setAction({ ...action, name: event.target.value })}
                      />
                    </label>
                  )}
                  {action.type === 'move' && (
                    <label>
                      {t('Pasta de destino')}
                      <select
                        value={action.parentId ?? ''}
                        disabled={busy}
                        onChange={(event) =>
                          setAction({ ...action, parentId: event.target.value || null })
                        }
                      >
                        <option value="">{t('Meus arquivos')}</option>
                        {store.entries
                          .filter(
                            (item) =>
                              item.kind === 'folder' &&
                              !item.trashed &&
                              !action.ids.includes(item.id),
                          )
                          .map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {action.type === 'purge' && (
                    <p>
                      {t(
                        'Esta exclusão é permanente e inclui o conteúdo da pasta. Confirme somente se não precisar recuperá-lo.',
                      )}
                    </p>
                  )}
                  <div className="ws-app__toolbar">
                    <button disabled={busy} type="submit">
                      {t('Confirmar')}
                    </button>
                    <button disabled={busy} type="button" onClick={() => setAction(null)}>
                      {t('Cancelar')}
                    </button>
                  </div>
                </form>
              )}
              {space === 'official' ? (
                <div className="ws-app__grid">
                  {officialFiles
                    .filter(
                      (item) => !term || normalized(contentText(item.name, locale)).includes(term),
                    )
                    .map((item) => (
                      <section className="ws-app__card" key={item.id}>
                        <ShieldCheck size={24} />
                        <h3>{contentText(item.name, locale)}</h3>
                        <p>{contentText(item.description, locale)}</p>
                        <button
                          type="button"
                          onClick={() =>
                            run(openApp, 'file-viewer', {
                              origin: 'files',
                              params: {
                                url: publicAssetUrl(item.url),
                                name: contentText(item.name, locale),
                              },
                            })
                          }
                        >
                          {t('Visualizar')}
                        </button>
                      </section>
                    ))}
                  {!officialFiles.length && <p>{t('Nenhum arquivo oficial cadastrado.')}</p>}
                </div>
              ) : (
                <div className={`ws-files__workspace ${details ? 'has-details' : ''}`}>
                  <ul
                    className={`ws-files__list ${viewMode === 'grid' ? 'ws-files__list--grid' : 'ws-files__list--details'}`}
                    aria-label={t('Arquivos')}
                  >
                    {visible.map((item) => {
                      const Icon = iconFor(item);
                      return (
                        <li
                          key={item.id}
                          className="ws-app__card ws-files__entry"
                          data-selected={selected.includes(item.id)}
                          tabIndex={0}
                          aria-label={item.name}
                          onClick={(event) => {
                            select(event, item);
                            if (event.nativeEvent?.pointerType === 'touch' && space !== 'trash')
                              open(item);
                          }}
                          onDoubleClick={() => {
                            if (space !== 'trash') open(item);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && space !== 'trash') {
                              event.preventDefault();
                              open(item);
                            }
                            if (event.key === ' ') {
                              event.preventDefault();
                              select(event, item);
                            }
                            if (
                              event.key === 'ContextMenu' ||
                              (event.shiftKey && event.key === 'F10')
                            ) {
                              event.preventDefault();
                              setSelected([item.id]);
                              setContext({ id: item.id });
                            }
                          }}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            if (!selected.includes(item.id)) setSelected([item.id]);
                            setContext({ id: item.id });
                          }}
                        >
                          <label
                            className="ws-files__entry-select"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              aria-label={t('Selecionar') + ' ' + item.name}
                              checked={selected.includes(item.id)}
                              onChange={(event) =>
                                setSelected((ids) =>
                                  event.target.checked
                                    ? [...new Set([...ids, item.id])]
                                    : ids.filter((id) => id !== item.id),
                                )
                              }
                            />
                          </label>
                          <Icon size={viewMode === 'grid' ? 38 : 22} aria-hidden="true" />
                          <strong title={item.name}>{item.name}</strong>
                          <small>
                            {item.kind === 'folder'
                              ? t('Pasta')
                              : (item.blob.size / 1024).toLocaleString(locale, {
                                  maximumFractionDigits: 1,
                                }) + ' KB'}
                          </small>
                          <button
                            type="button"
                            className="ws-files__more"
                            aria-label={t('Ações') + ' ' + item.name}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelected([item.id]);
                              setContext({ id: item.id });
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </li>
                      );
                    })}
                    {!visible.length && (
                      <li className="ws-files__empty">
                        {t(term ? 'Nenhum arquivo encontrado.' : 'Esta pasta está vazia.')}
                      </li>
                    )}
                  </ul>
                  {details && (
                    <aside className="ws-files__details">
                      <Info size={24} />
                      <h3>{t('Detalhes')}</h3>
                      {current ? (
                        <dl>
                          <dt>{t('Nome')}</dt>
                          <dd>{current.name}</dd>
                          <dt>{t('Tipo')}</dt>
                          <dd>{t(current.kind === 'folder' ? 'Pasta' : 'Arquivo')}</dd>
                          <dt>{t('Tamanho')}</dt>
                          <dd>{current.blob?.size ?? 0} bytes</dd>
                          <dt>{t('Atualização')}</dt>
                          <dd>{new Date(current.updatedAt).toLocaleString(locale)}</dd>
                          <dt>{t('Revisão')}</dt>
                          <dd>{current.revision}</dd>
                        </dl>
                      ) : (
                        <p>{t('Selecione um item para ver os detalhes.')}</p>
                      )}
                    </aside>
                  )}
                </div>
              )}
              {context && (
                <section
                  ref={contextRef}
                  className="ws-files__context"
                  role="dialog"
                  aria-label={t('Ações do arquivo')}
                >
                  <div className="ws-app__toolbar">{selectionTools()}</div>
                  <button type="button" onClick={() => setContext(null)}>
                    {t('Fechar')}
                  </button>
                </section>
              )}
              <footer className="ws-files__status">
                <span>
                  {space === 'official' ? officialFiles.length : visible.length} {t('itens')}
                </span>
                <button type="button" onClick={store.refresh}>
                  {t('Atualizar')}
                </button>
                <span>{t('Somente neste navegador')}</span>
              </footer>
            </>
          )}
        </main>
      </div>
    </article>
  );
}

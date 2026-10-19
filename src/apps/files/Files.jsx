import { useRef, useState } from 'react';
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
  FileJson,
  FileSpreadsheet,
  FileType,
  File,
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
  createLocalFolder,
  createLocalText,
  uploadLocalFile,
} from '../../services/storage/localFilesStorage';
import { fileKind } from '../../services/storage/fileModel';
import '../../styles/apps.css';
import './Files.css';
function getFileIcon(item) {
  if (item.kind === 'folder') return Folder;

  const extension = item.name.split('.').pop().toLowerCase();

  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return FileImage;
  if (['js', 'css', 'html'].includes(extension)) return FileCode2;
  if (extension === 'json') return FileJson;
  if (extension === 'csv') return FileSpreadsheet;
  if (extension === 'pdf') return FileType;
  if (['txt', 'md', 'log'].includes(extension)) return FileText;

  return File;
}
export default function Files({ instance }) {
  const locale = useLocale(),
    { run } = useSystem(),
    store = useLocalFiles();
  const [space, setSpace] = useState('home'),
    [folderId, setFolderId] = useState(null),
    [name, setName] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState(null),
    [viewMode, setViewMode] = useState(() => {
      try {
        return localStorage.getItem('ws-os:files-view') === 'list' ? 'list' : 'grid';
      } catch {
        return 'grid';
      }
    });
  const inputRef = useRef(null),
    busyRef = useRef(false);
  const folder = store.entries.find((item) => item.id === folderId && !item.trashed);
  const parentId = folder?.id ?? null;
  const unavailableFolder = folderId !== null && !folder && !store.loading;
  const officialFiles = portfolio.officialFiles.filter((item) => publicAssetUrl(item.url));
  function changeViewMode(mode) {
    setViewMode(mode);

    try {
      localStorage.setItem('ws-os:files-view', mode);
    } catch {
      // A visualização continua funcionando sem persistência.
    }
  }
  const breadcrumbs = [];

  if (space === 'personal') {
    let current = folder;
    const visited = new Set();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      breadcrumbs.unshift(current);
      current = store.entries.find(
        (item) => item.id === current.parentId && item.kind === 'folder' && !item.trashed,
      );
    }
  }
  useAppBack(instance?.id, () => {
    if (busyRef.current) return true;
    if (action) {
      setAction(null);
      return true;
    }
    if (parentId || unavailableFolder) {
      setFolderId(folder?.parentId ?? null);
      return true;
    }
    if (space !== 'personal') {
      setSpace('personal');
      return true;
    }
    return false;
  });
  async function perform(operation) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await operation();
      setAction(null);
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
      setFolderId(item.id);
      return;
    }
    run(openApp, edit ? 'file-editor' : 'file-viewer', {
      origin: 'files',
      params: { fileId: item.id },
    });
  }
  const visible = store.entries
    .filter((item) =>
      space === 'trash'
        ? item.trashed && !store.entries.find((parent) => parent.id === item.parentId)?.trashed
        : !unavailableFolder && !item.trashed && item.parentId === parentId,
    )
    .sort((a, b) =>
      a.kind === b.kind ? a.name.localeCompare(b.name, locale) : a.kind === 'folder' ? -1 : 1,
    );
  async function create(kind) {
    if (unavailableFolder) {
      setMessage('Pasta de destino indisponível.');
      return;
    }
    await perform(async () => {
      const entry = await (kind === 'folder'
        ? createLocalFolder(name, parentId)
        : createLocalText(name, parentId));
      setName('');
      if (kind === 'file') open(entry, true);
      return entry;
    });
  }
  return (
    <article className="desktop-window__content ws-app">
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
                key={id}
                type="button"
                aria-pressed={space === id}
                disabled={busy}
                onClick={() => {
                  setSpace(id);
                  setFolderId(null);
                  setAction(null);
                }}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{t(label)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="ws-files__main">
          <nav className="ws-files__breadcrumbs" aria-label={t('Caminho da pasta')}>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSpace('home');
                setFolderId(null);
                setAction(null);
              }}
            >
              <House size={16} aria-hidden="true" />
            </button>

            {space !== 'home' && (
              <>
                <span aria-hidden="true">/</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setFolderId(null);
                    setAction(null);
                  }}
                >
                  {t(
                    space === 'personal'
                      ? 'Meus arquivos'
                      : space === 'official'
                        ? 'Arquivos oficiais'
                        : 'Lixeira',
                  )}
                </button>
              </>
            )}

            {space === 'personal' &&
              breadcrumbs.map((item) => (
                <span className="ws-files__breadcrumb-segment" key={item.id}>
                  <span aria-hidden="true">/</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setFolderId(item.id);
                      setAction(null);
                    }}
                  >
                    {item.name}
                  </button>
                </span>
              ))}
          </nav>

          <div className="ws-app__toolbar">
            <button type="button" onClick={store.refresh}>
              {t('Atualizar')}
            </button>
            <div
              className="ws-files__view-controls"
              role="group"
              aria-label={t('Modo de visualização')}
            >
              <button
                type="button"
                className="ws-files__view-button"
                aria-label={t('Visualização em grade')}
                aria-pressed={viewMode === 'grid'}
                onClick={() => changeViewMode('grid')}
              >
                <LayoutGrid size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="ws-files__view-button"
                aria-label={t('Visualização em lista')}
                aria-pressed={viewMode === 'list'}
                onClick={() => changeViewMode('list')}
              >
                <List size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          {store.loading && <p role="status">{t('Carregando')}</p>}
          {store.error && <p role="alert">{t(store.error)}</p>}
          <p role="status">{t(message)}</p>
          {space === 'home' ? (
            <section className="ws-files__home">
              <header className="ws-files__home-header">
                <h3>{t('Início')}</h3>
                <p className="ws-app__muted">
                  {t('Acesse seus arquivos e documentos em um só lugar.')}
                </p>
              </header>

              <div className="ws-files__home-grid">
                {[
                  {
                    id: 'personal',
                    label: 'Meus arquivos',
                    description: 'Arquivos e pastas salvos neste navegador.',
                    Icon: FolderOpen,
                  },
                  {
                    id: 'official',
                    label: 'Arquivos oficiais',
                    description: 'Documentos públicos do portfólio.',
                    Icon: ShieldCheck,
                  },
                  {
                    id: 'trash',
                    label: 'Lixeira',
                    description: 'Itens excluídos que podem ser recuperados.',
                    Icon: Trash2,
                  },
                ].map(({ id, label, description, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className="ws-files__home-card"
                    disabled={busy}
                    onClick={() => {
                      setSpace(id);
                      setFolderId(null);
                      setAction(null);
                    }}
                  >
                    <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
                    <strong>{t(label)}</strong>
                    <span>{t(description)}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : space === 'official' ? (
            <div className="ws-app__grid">
              {officialFiles.map((item) => (
                <section key={item.id} className="ws-app__card">
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
            <>
              {space === 'personal' && (
                <>
                  <h3>{folder?.name ?? t('Meus arquivos')}</h3>
                  {unavailableFolder && <p role="status">{t('Pasta de destino indisponível.')}</p>}
                  {(parentId || unavailableFolder) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setFolderId(folder?.parentId ?? null)}
                    >
                      {t('Pasta anterior')}
                    </button>
                  )}
                  <div className="ws-app__toolbar">
                    <label>
                      {t('Nome do novo item')}
                      <input
                        value={name}
                        maxLength={120}
                        disabled={busy}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy || store.loading || unavailableFolder || !name.trim()}
                      onClick={() => create('folder')}
                    >
                      {t('Criar pasta')}
                    </button>
                    <button
                      type="button"
                      disabled={busy || store.loading || unavailableFolder || !name.trim()}
                      onClick={() => create('file')}
                    >
                      {t('Criar arquivo de texto')}
                    </button>
                    <button
                      type="button"
                      disabled={busy || store.loading || unavailableFolder}
                      onClick={() => inputRef.current?.click()}
                    >
                      {t('Importar arquivo')}
                    </button>
                    <input
                      ref={inputRef}
                      type="file"
                      hidden
                      accept=".txt,.md,.json,.csv,.log,.js,.css,.html,.png,.jpg,.jpeg,.webp,.pdf"
                      onChange={(event) => {
                        const input = event.currentTarget,
                          file = input.files?.[0];
                        input.value = '';
                        if (file && !unavailableFolder)
                          perform(() => uploadLocalFile(file, parentId));
                      }}
                    />
                  </div>
                </>
              )}
              {action && (
                <section className="ws-app__card">
                  <h3>
                    {t(
                      action.type === 'rename'
                        ? 'Renomear'
                        : action.type === 'move'
                          ? 'Mover item'
                          : 'Excluir definitivamente',
                    )}
                  </h3>
                  {action.type === 'rename' && (
                    <label>
                      {t('Novo nome')}
                      <input
                        disabled={busy}
                        value={action.name}
                        onChange={(event) =>
                          setAction((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                  )}
                  {action.type === 'move' && (
                    <label>
                      {t('Pasta de destino')}
                      <select
                        disabled={busy}
                        value={action.parentId ?? ''}
                        onChange={(event) =>
                          setAction((current) => ({
                            ...current,
                            parentId: event.target.value || null,
                          }))
                        }
                      >
                        <option value="">{t('Meus arquivos')}</option>
                        {store.entries
                          .filter(
                            (item) =>
                              item.kind === 'folder' && !item.trashed && item.id !== action.id,
                          )
                          .map((item) => (
                            <option key={item.id} value={item.id}>
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
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => perform(() => changeLocalFile(action))}
                    >
                      {t('Confirmar')}
                    </button>
                    <button type="button" disabled={busy} onClick={() => setAction(null)}>
                      {t('Cancelar')}
                    </button>
                  </div>
                </section>
              )}
              <ul
                className={`ws-files__list ${
                  viewMode === 'grid' ? 'ws-files__list--grid' : 'ws-files__list--details'
                }`}
              >
                {visible.map((item) => {
                  const Icon = getFileIcon(item);
                  return (
                    <li key={item.id} className="ws-app__card">
                      <div className="ws-files__item-heading">
                        <Icon
                          size={viewMode === 'grid' ? 34 : 23}
                          strokeWidth={1.6}
                          aria-hidden="true"
                        />
                        <strong title={item.name}>{item.name}</strong>
                      </div>
                      <p className="ws-app__muted">
                        {t(item.kind === 'folder' ? 'Pasta' : 'Arquivo')} · {item.blob?.size ?? 0}{' '}
                        bytes
                      </p>
                      <div className="ws-app__toolbar">
                        {space === 'trash' ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                perform(() => changeLocalFile({ type: 'restore', id: item.id }))
                              }
                            >
                              {t('Restaurar')}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setAction({ type: 'purge', id: item.id })}
                            >
                              {t('Excluir definitivamente')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" disabled={busy} onClick={() => open(item)}>
                              {t('Abrir')}
                            </button>
                            {item.kind === 'file' && fileKind(item.name) === 'text' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => open(item, true)}
                              >
                                {t('Editar')}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setAction({ type: 'rename', id: item.id, name: item.name })
                              }
                            >
                              {t('Renomear')}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setAction({ type: 'move', id: item.id, parentId: item.parentId })
                              }
                            >
                              {t('Mover item')}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                perform(() => changeLocalFile({ type: 'trash', id: item.id }))
                              }
                            >
                              {t('Mover para lixeira')}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!visible.length && <p>{t('Esta pasta está vazia.')}</p>}
              <p className="ws-app__muted">
                {t(
                  'Limites locais: 10 MB por arquivo, 50 MB e 500 itens no total, incluindo a lixeira. O editor aceita textos de até 1 MB.',
                )}
              </p>
            </>
          )}
        </main>
      </div>
    </article>
  );
}

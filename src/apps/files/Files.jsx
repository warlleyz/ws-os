import { useRef, useState } from 'react';
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
export default function Files({ instance }) {
  const locale = useLocale(),
    { run } = useSystem(),
    store = useLocalFiles();
  const [space, setSpace] = useState('personal'),
    [folderId, setFolderId] = useState(null),
    [name, setName] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState(null);
  const inputRef = useRef(null),
    busyRef = useRef(false);
  const folder = store.entries.find((item) => item.id === folderId && !item.trashed);
  const parentId = folder?.id ?? null;
  const unavailableFolder = folderId !== null && !folder && !store.loading;
  const officialFiles = portfolio.officialFiles.filter((item) => publicAssetUrl(item.url));
  useAppBack(instance?.id, () => {
    if (busyRef.current) return true;
    if (action) {
      setAction(null);
      return true;
    }
    if (parentId) {
      setFolderId(folder.parentId);
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
      <h2>{t('Arquivos')}</h2>
      <p>
        {t(
          'Arquivos oficiais são somente leitura. Arquivos pessoais ficam exclusivamente neste navegador.',
        )}
      </p>
      <div className="ws-app__toolbar">
        {[
          ['personal', 'Meus arquivos'],
          ['official', 'Arquivos oficiais'],
          ['trash', 'Lixeira'],
        ].map(([id, label]) => (
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
            {t(label)}
          </button>
        ))}
        <button type="button" onClick={store.refresh}>
          {t('Atualizar')}
        </button>
      </div>
      {store.loading && <p role="status">{t('Carregando')}</p>}
      {store.error && <p role="alert">{t(store.error)}</p>}
      <p role="status">{t(message)}</p>
      {space === 'official' ? (
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
                    if (file && !unavailableFolder) perform(() => uploadLocalFile(file, parentId));
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
                      setAction((current) => ({ ...current, parentId: event.target.value || null }))
                    }
                  >
                    <option value="">{t('Meus arquivos')}</option>
                    {store.entries
                      .filter(
                        (item) => item.kind === 'folder' && !item.trashed && item.id !== action.id,
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
          <ul className="ws-files__list">
            {visible.map((item) => (
              <li key={item.id} className="ws-app__card">
                <strong>{item.name}</strong>
                <p className="ws-app__muted">
                  {t(item.kind === 'folder' ? 'Pasta' : 'Arquivo')} · {item.blob?.size ?? 0} bytes
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
                        <button type="button" disabled={busy} onClick={() => open(item, true)}>
                          {t('Editar')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAction({ type: 'rename', id: item.id, name: item.name })}
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
            ))}
          </ul>
          {!visible.length && <p>{t('Esta pasta está vazia.')}</p>}
          <p className="ws-app__muted">
            {t(
              'Limites locais: 10 MB por arquivo, 50 MB e 500 itens no total, incluindo a lixeira. O editor aceita textos de até 1 MB.',
            )}
          </p>
        </>
      )}
    </article>
  );
}

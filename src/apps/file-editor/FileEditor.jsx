import { useEffect, useRef, useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import {
  readLocalFile,
  saveLocalText,
  createLocalText,
} from '../../services/storage/localFilesStorage';
import { fileKind, TEXT_LIMIT } from '../../services/storage/fileModel';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import '../../styles/apps.css';
export default function FileEditor({ instance }) {
  useLocale();
  const fileId = instance?.params?.fileId;
  const [file, setFile] = useState(null),
    [text, setText] = useState(''),
    [baseline, setBaseline] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [copyName, setCopyName] = useState(''),
    [reloadConfirm, setReloadConfirm] = useState(false);
  const saving = useRef(false);
  const dirty = text !== baseline;
  useUnsavedChanges(instance?.id, dirty);
  useEffect(() => {
    let active = true;
    if (typeof fileId !== 'string') return;
    readLocalFile(fileId)
      .then(async (item) => {
        if (fileKind(item.name) !== 'text' || item.blob.size > TEXT_LIMIT)
          throw new Error('O editor aceita textos de até 1 MB.');
        const value = await item.blob.text();
        if (active) {
          setFile(item);
          setText(value);
          setBaseline(value);
          setCopyName(item.name.replace(/(\.[^.]+)$/, '-copia$1'));
        }
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, [fileId]);
  async function save(copy = false) {
    if (!file || saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      if (copy) {
        await createLocalText(copyName, file.parentId, text);
        setMessage('Cópia salva. O rascunho original foi preservado.');
      } else {
        const updated = await saveLocalText(file.id, text, file.revision);
        setFile(updated);
        setBaseline(text);
        setMessage('Arquivo salvo neste navegador.');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function reload() {
    try {
      const item = await readLocalFile(fileId);
      if (item.blob.size > TEXT_LIMIT) throw new Error('O editor aceita textos de até 1 MB.');
      const value = await item.blob.text();
      setFile(item);
      setText(value);
      setBaseline(value);
      setMessage('Arquivo recarregado.');
      setReloadConfirm(false);
    } catch (error) {
      setMessage(error.message);
    }
  }
  return (
    <article className="desktop-window__content ws-app">
      <h2>{t('Editor de Arquivos')}</h2>
      {!file ? (
        <p role="status">{t(message || 'Selecione um arquivo de texto em Meus arquivos.')}</p>
      ) : (
        <>
          <h3>
            {file.name}
            {dirty ? ' *' : ''}
          </h3>
          <p>{t(dirty ? 'Alterações não salvas' : 'Sem alterações pendentes')}</p>
          <label>
            {t('Conteúdo do arquivo')}
            <textarea
              className="ws-editor__text"
              rows={14}
              value={text}
              disabled={busy}
              spellCheck={false}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                  event.preventDefault();
                  save();
                }
              }}
            />
          </label>
          <div className="ws-app__toolbar">
            <button type="button" disabled={busy || !dirty} onClick={() => save()}>
              {t('Salvar')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => (dirty ? setReloadConfirm(true) : reload())}
            >
              {t('Recarregar arquivo')}
            </button>
          </div>
          {reloadConfirm && (
            <section className="ws-app__card">
              <p>{t('Descartar o rascunho e recarregar o arquivo salvo?')}</p>
              <button type="button" onClick={reload}>
                {t('Descartar rascunho e recarregar')}
              </button>
              <button type="button" onClick={() => setReloadConfirm(false)}>
                {t('Cancelar')}
              </button>
            </section>
          )}
          <label>
            {t('Nome da cópia')}
            <input
              value={copyName}
              maxLength={120}
              onChange={(event) => setCopyName(event.target.value)}
            />
          </label>
          <button type="button" disabled={busy || !copyName.trim()} onClick={() => save(true)}>
            {t('Salvar cópia')}
          </button>
          <p className="ws-app__muted">
            {t(
              'Ctrl+S salva localmente. Alterações feitas em outra janela são detectadas antes de sobrescrever.',
            )}
          </p>
          <p role="status">{t(message)}</p>
        </>
      )}
    </article>
  );
}

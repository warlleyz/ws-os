import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import {
  readLocalFile,
  saveLocalText,
  createLocalText,
  listLocalFiles,
  subscribeLocalFiles,
  localFilesRevision,
} from '../../services/storage/localFilesStorage';
import { fileKind, TEXT_LIMIT } from '../../services/storage/fileModel';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import '../../styles/apps.css';
import { findText, replaceText, tokenizeText } from './textTools';
import './FileEditor.css';
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
  const textRef = useRef(null),
    syntaxRef = useRef(null);
  const [find, setFind] = useState(''),
    [replacement, setReplacement] = useState(''),
    [searchPosition, setSearchPosition] = useState(0);
  const [wrap, setWrap] = useState(true),
    [fontSize, setFontSize] = useState(14),
    [highlight, setHighlight] = useState(false);
  const saving = useRef(false);
  const mounted = useRef(false);
  const fileRef = useRef(null);
  const [externalMessage, setExternalMessage] = useState('');
  const revision = useSyncExternalStore(subscribeLocalFiles, localFilesRevision, () => 0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const dirty = text !== baseline;
  useUnsavedChanges(instance?.id, dirty || busy);
  useEffect(() => {
    let active = true;
    if (typeof fileId !== 'string') return;
    readLocalFile(fileId)
      .then(async (item) => {
        if (fileKind(item.name) !== 'text' || item.blob.size > TEXT_LIMIT)
          throw new Error('O editor aceita textos de até 1 MB.');
        const value = await item.blob.text();
        if (active) {
          fileRef.current = item;
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
  useEffect(() => {
    if (typeof fileId !== 'string') return;
    let active = true;
    readLocalFile(fileId)
      .then((current) => {
        if (!active || !fileRef.current) return;
        setExternalMessage(
          current.revision === fileRef.current.revision
            ? ''
            : 'O arquivo foi alterado em outra janela. Recarregue ou salve uma cópia.',
        );
      })
      .catch((error) => {
        if (active) setExternalMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, [fileId, revision, file?.revision]);

  function findNext() {
    const index = findText(text, find, searchPosition);
    if (index < 0) {
      setMessage('Texto não encontrado.');
      return;
    }
    textRef.current?.focus();
    textRef.current?.setSelectionRange(index, index + find.length);
    setSearchPosition(index + find.length);
  }
  function replace(all) {
    if (busy) return;
    const next = replaceText(text, find, replacement, all);
    setText(next);
    setSearchPosition(0);
    if (next === text) setMessage('Texto não encontrado.');
  }
  async function save(copy = false) {
    if (!file || saving.current) return;
    saving.current = true;
    setBusy(true);
    setMessage('');
    const content = text;
    try {
      if (copy) {
        const entries = await listLocalFiles();
        const latest = entries.find((entry) => entry.id === file.id && !entry.trashed);
        const parentId = latest ? latest.parentId : file.parentId;
        const available =
          parentId === null ||
          entries.some(
            (entry) => entry.id === parentId && entry.kind === 'folder' && !entry.trashed,
          );
        await createLocalText(copyName, available ? parentId : null, content);
        if (mounted.current) setMessage('Cópia salva. O rascunho original foi preservado.');
      } else {
        const updated = await saveLocalText(file.id, content, file.revision);
        if (!mounted.current) return;
        fileRef.current = updated;
        setFile(updated);
        setBaseline(content);
        setExternalMessage('');
        setMessage('Arquivo salvo neste navegador.');
      }
    } catch (error) {
      if (mounted.current) setMessage(error.message);
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function reload() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      const item = await readLocalFile(fileId);
      if (fileKind(item.name) !== 'text' || item.blob.size > TEXT_LIMIT)
        throw new Error('O editor aceita textos de até 1 MB.');
      const value = await item.blob.text();
      if (!mounted.current) return;
      fileRef.current = item;
      setFile(item);
      setText(value);
      setBaseline(value);
      setExternalMessage('');
      setMessage('Arquivo recarregado.');
      setReloadConfirm(false);
    } catch (error) {
      if (mounted.current) setMessage(error.message);
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <article className="desktop-window__content ws-app ws-editor">
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
          <div className="ws-editor__tools">
            <label>
              {t('Localizar')}
              <input
                type="search"
                value={find}
                onChange={(event) => {
                  setFind(event.target.value);
                  setSearchPosition(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    findNext();
                  }
                }}
              />
            </label>
            <button type="button" disabled={!find || busy} onClick={findNext}>
              {t('Próximo')}
            </button>
            <label>
              {t('Substituir')}
              <input value={replacement} onChange={(event) => setReplacement(event.target.value)} />
            </label>
            <button type="button" disabled={!find || busy} onClick={() => replace(false)}>
              {t('Substituir')}
            </button>
            <button type="button" disabled={!find || busy} onClick={() => replace(true)}>
              {t('Substituir tudo')}
            </button>
            <button type="button" aria-pressed={wrap} onClick={() => setWrap((value) => !value)}>
              {t('Quebra de linha')}
            </button>
            <button
              type="button"
              aria-pressed={highlight}
              onClick={() => setHighlight((value) => !value)}
            >
              {t('Destaque de sintaxe')}
            </button>
            <button
              type="button"
              aria-label={t('Reduzir texto')}
              onClick={() => setFontSize((size) => Math.max(11, size - 1))}
            >
              A−
            </button>
            <button
              type="button"
              aria-label={t('Ampliar texto')}
              onClick={() => setFontSize((size) => Math.min(24, size + 1))}
            >
              A+
            </button>
          </div>
          <label>
            {t('Conteúdo do arquivo')}
            <div
              className="ws-editor__surface"
              style={{ fontSize, fontFamily: 'var(--font-mono, monospace)' }}
            >
              {highlight && (
                <pre
                  ref={syntaxRef}
                  aria-hidden="true"
                  className="ws-editor__syntax"
                  style={{ whiteSpace: wrap ? 'pre-wrap' : 'pre' }}
                >
                  {tokenizeText(text).map((part, index) => (
                    <span key={index} className={'token-' + part.type}>
                      {part.text}
                    </span>
                  ))}
                  {'\n'}
                </pre>
              )}
              <textarea
                ref={textRef}
                wrap={wrap ? 'soft' : 'off'}
                className="ws-editor__text"
                style={{
                  color: highlight ? 'transparent' : undefined,
                  background: highlight ? 'transparent' : undefined,
                  caretColor: 'var(--text-primary)',
                  fontSize: 'inherit',
                  whiteSpace: wrap ? 'pre-wrap' : 'pre',
                }}
                onScroll={(event) => {
                  if (syntaxRef.current) {
                    syntaxRef.current.scrollTop = event.target.scrollTop;
                    syntaxRef.current.scrollLeft = event.target.scrollLeft;
                  }
                }}
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
            </div>
          </label>
          <footer className="ws-editor__status">
            <span>
              {text.split('\n').length} {t('linhas')}
            </span>
            <span>{new Blob([text]).size} bytes · UTF-8</span>
            <span>{fontSize}px</span>
          </footer>
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
              <button type="button" disabled={busy} onClick={reload}>
                {t('Descartar rascunho e recarregar')}
              </button>
              <button type="button" disabled={busy} onClick={() => setReloadConfirm(false)}>
                {t('Cancelar')}
              </button>
            </section>
          )}
          <label>
            {t('Nome da cópia')}
            <input
              disabled={busy}
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
          {externalMessage && <p role="alert">{t(externalMessage)}</p>}
          <p role="status">{t(message)}</p>
        </>
      )}
    </article>
  );
}

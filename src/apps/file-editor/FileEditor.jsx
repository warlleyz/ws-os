import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Copy,
  Search,
  Replace,
  X,
} from 'lucide-react';
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
  /* ----- Controle da janela de salvamento de cópia ----- */
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const textRef = useRef(null),
    syntaxRef = useRef(null);
  const [find, setFind] = useState(''),
    [replacement, setReplacement] = useState(''),
    [searchPosition, setSearchPosition] = useState(0);
  /* ----- Visibilidade das ferramentas de pesquisa ----- */
  const [searchMode, setSearchMode] = useState(null);
  const [wrap, setWrap] = useState(true),
    [fontSize, setFontSize] = useState(14),
    [highlight, setHighlight] = useState(false);
  /* ----- Posição atual do cursor ----- */
  const [cursorPosition, setCursorPosition] = useState(0);
  /* === Controle de acessibilidade dos modais === */
  /* ----- Elementos do diálogo e origem do foco ----- */
  const modalRef = useRef(null);
  const modalTriggerRef = useRef(null);

  /* ----- Abertura dos diálogos ----- */
  function openModal(type) {
    modalTriggerRef.current = document.activeElement;

    if (type === 'copy') {
      setCopyDialogOpen(true);
    } else {
      setReloadConfirm(true);
    }
  }
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
  /* === Acessibilidade dos diálogos === */
  /* ----- Foco restrito ao modal ativo ----- */
  useEffect(() => {
    if (!copyDialogOpen && !reloadConfirm) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = [
      'button:not(:disabled)',
      'input:not(:disabled)',
      'select:not(:disabled)',
      'textarea:not(:disabled)',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusable = () =>
      [...modal.querySelectorAll(focusableSelector)];

    const originalFocus = modalTriggerRef.current;

    focusable()[0]?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        if (saving.current) return;

        setCopyDialogOpen(false);
        setReloadConfirm(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = focusable();
      if (!elements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      } else if (!modal.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);

      if (originalFocus?.isConnected) {
        originalFocus.focus();
      }
    };
  }, [copyDialogOpen, reloadConfirm]);
  const dirty = text !== baseline;
  /* ----- Informações da posição atual ----- */
  const cursor = cursorLocation(text, cursorPosition);
  const lineCount = text.split('\n').length;
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

  /* === Indicadores de edição === */
  /* ----- Localização do cursor no documento ----- */
  function cursorLocation(content, position) {
    const beforeCursor = content.slice(0, position);
    const lines = beforeCursor.split('\n');

    return {
      line: lines.length,
      column: lines.at(-1).length + 1,
    };
  }

  /* ----- Atualização da posição do cursor ----- */
  /* ----- Atualização segura da posição do cursor ----- */
  function updateCursorPosition(event) {
    const position = event.currentTarget?.selectionStart
      ?? event.target?.selectionStart;

    if (Number.isInteger(position)) {
      setCursorPosition(position);
    }
  }

  function findNext() {
    const index = findText(text, find, searchPosition);
    if (index < 0) {
      setMessage('Texto não encontrado.');
      return;
    }
    textRef.current?.focus();
    textRef.current?.setSelectionRange(index, index + find.length);
    setCursorPosition(index);
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
        if (mounted.current) {
          setMessage('Cópia salva. O rascunho original foi preservado.');
          setCopyDialogOpen(false);
        }
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

    <article
      className="desktop-window__content ws-app ws-editor"
      onKeyDown={(event) => {
        /* ----- Atalhos de teclado do Editor ----- */
        const shortcut = event.ctrlKey || event.metaKey;
        const key = event.key.toLowerCase();

        if (shortcut && key === 's') {
          event.preventDefault();
          if (!busy && dirty && !externalMessage && !reloadConfirm && !copyDialogOpen) {
            save();
          }
          return;
        }

        if (shortcut && key === 'f') {
          event.preventDefault();
          if (!reloadConfirm && !copyDialogOpen) setSearchMode('find');
          return;
        }

        if (shortcut && key === 'h') {
          event.preventDefault();
          if (!reloadConfirm && !copyDialogOpen) setSearchMode('replace');
          return;
        }

        if (event.key === 'Escape') {
          if (busy) return;

          if (copyDialogOpen) {
            event.preventDefault();
            setCopyDialogOpen(false);
          } else if (reloadConfirm) {
            event.preventDefault();
            setReloadConfirm(false);
          } else if (searchMode) {
            event.preventDefault();
            setSearchMode(null);
            textRef.current?.focus();
          }
        }
      }}
    >

      {/* === Cabeçalho do editor === */}
      <header className="ws-editor__header">
        <div className="ws-editor__identity">
          <span className="ws-editor__file-icon">
            <FileText size={22} aria-hidden="true" />
          </span>

          <div className="ws-editor__identity-content">
            <span className="ws-editor__eyebrow">
              {t('Editor de Arquivos')}
            </span>

            <h2 title={file?.name}>
              {file?.name ?? t('Nenhum arquivo selecionado')}
              {dirty && <span className="ws-editor__dirty-mark"> ●</span>}
            </h2>

            <p>
              {t('Arquivo pessoal')} ·{' '}
              {t(dirty ? 'Alterações não salvas' : 'Todas as alterações salvas')}
            </p>
          </div>
        </div>

        {file && (
          <div className="ws-editor__header-actions">
            <button
              type="button"
              disabled={busy || !dirty || Boolean(externalMessage)}
              onClick={() => save()}
              className="ws-editor__save-button"
            >
              <Save size={16} aria-hidden="true" />
              {t('Salvar')}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => (dirty ? setReloadConfirm(true) : reload())}
            >
              <RotateCcw size={16} aria-hidden="true" />
              {t('Recarregar arquivo')}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => openModal('copy')}
            >
              <Copy size={16} aria-hidden="true" />
              {t('Salvar cópia')}
            </button>
          </div>
        )}
      </header>

      {!file ? (
        <p role="status">{t(message || 'Selecione um arquivo de texto em Meus arquivos.')}</p>
      ) : (
        <>

            {/* === Ferramentas de edição === */}
            <div className="ws-editor__toolbar">
              {/* ----- Pesquisa e substituição ----- */}
              <div className="ws-editor__toolbar-group">
                <button
                  type="button"
                  aria-expanded={searchMode === 'find'}
                  aria-controls="ws-editor-search-panel"
                  onClick={() =>
                    setSearchMode((mode) => (mode === 'find' ? null : 'find'))
                  }
                >
                  <Search size={16} aria-hidden="true" />
                  {t('Localizar')}
                </button>

                <button
                  type="button"
                  aria-expanded={searchMode === 'replace'}
                  aria-controls="ws-editor-search-panel"
                  onClick={() =>
                    setSearchMode((mode) => (mode === 'replace' ? null : 'replace'))
                  }
                >
                  <Replace size={16} aria-hidden="true" />
                  {t('Substituir')}
                </button>
              </div>

              {/* ----- Preferências de edição ----- */}
              <div className="ws-editor__toolbar-group">
                <button
                  type="button"
                  aria-pressed={wrap}
                  onClick={() => setWrap((value) => !value)}
                >
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

                <span className="ws-editor__font-indicator">
                  {fontSize}px
                </span>

                <button
                  type="button"
                  aria-label={t('Ampliar texto')}
                  onClick={() => setFontSize((size) => Math.min(24, size + 1))}
                >
                  A+
                </button>
              </div>
            </div>

            {/* === Painel recolhível de pesquisa === */}
            {searchMode && (
              <section
                id="ws-editor-search-panel"
                className="ws-editor__search-panel"
                aria-label={t('Localizar e substituir')}
              >
                <div className="ws-editor__search-fields">
                  <label>
                    {t('Localizar')}
                    <input
                      type="search"
                      value={find}
                      autoFocus
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

                  <button
                    type="button"
                    disabled={!find || busy}
                    onClick={findNext}
                  >
                    {t('Próximo')}
                  </button>

                  {searchMode === 'replace' && (
                    <>
                      <label>
                        {t('Substituir por')}
                        <input
                          value={replacement}
                          onChange={(event) => setReplacement(event.target.value)}
                        />
                      </label>

                      <button
                        type="button"
                        disabled={!find || busy}
                        onClick={() => replace(false)}
                      >
                        {t('Substituir')}
                      </button>

                      <button
                        type="button"
                        disabled={!find || busy}
                        onClick={() => replace(true)}
                      >
                        {t('Substituir tudo')}
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="ws-editor__search-close"
                  aria-label={t('Fechar pesquisa')}
                  onClick={() => setSearchMode(null)}
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </section>
            )}
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
                  rows={20}
                  value={text}
                  disabled={busy}
                  spellCheck={false}
                  onChange={(event) => {
                    setText(event.target.value);
                    updateCursorPosition(event);
                  }}
                  onClick={updateCursorPosition}
                  onKeyUp={updateCursorPosition}
                  onSelect={updateCursorPosition}
              />
            </div>
          </label>
            {/* === Barra de status do editor === */}
            <footer className="ws-editor__status">
              <div className="ws-editor__status-group">
                <span>
                  {t('Linha')} {cursor.line}, {t('Coluna')} {cursor.column}
                </span>

                <span>
                  {lineCount} {t('linhas')}
                </span>
              </div>

              <div className="ws-editor__status-group">
                <span>
                  {new Blob([text]).size.toLocaleString('pt-BR')} bytes
                </span>

                <span>UTF-8</span>

                <span>{fontSize}px</span>

                <span className={dirty ? 'ws-editor__status-unsaved' : ''}>
                  {dirty ? t('Não salvo') : t('Salvo')}
                </span>
              </div>
            </footer>

            {/* === Confirmação de recarregamento === */}
            {reloadConfirm && (
              <div className="ws-editor__modal-backdrop">
                <section
                  ref={modalRef}
                  tabIndex={-1}
                  className="ws-editor__modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ws-editor-reload-title"
                >
                  <header className="ws-editor__modal-header">
                    <h3 id="ws-editor-reload-title">
                      {t('Recarregar arquivo')}
                    </h3>
                  </header>

                  <div className="ws-editor__modal-content">
                    <p>
                      {t('Descartar o rascunho e recarregar o arquivo salvo?')}
                    </p>
                    <p className="ws-editor__modal-hint">
                      {t('As alterações não salvas serão perdidas.')}
                    </p>
                  </div>

                  <footer className="ws-editor__modal-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setReloadConfirm(false)}
                    >
                      {t('Cancelar')}
                    </button>

                    <button
                      type="button"
                      className="ws-editor__modal-primary"
                      disabled={busy}
                      onClick={reload}
                    >
                      {t('Descartar rascunho e recarregar')}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {/* === Salvamento de cópia === */}
            {copyDialogOpen && (
              <div className="ws-editor__modal-backdrop">
                <form
                  ref={modalRef}
                  tabIndex={-1}
                  className="ws-editor__modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ws-editor-copy-title"
                  onSubmit={(event) => {
                    event.preventDefault();
                    save(true);
                  }}
                >
                  <header className="ws-editor__modal-header">
                    <h3 id="ws-editor-copy-title">
                      {t('Salvar cópia')}
                    </h3>
                  </header>

                  <div className="ws-editor__modal-content">
                    <p>
                      {t('Uma nova cópia será criada em Meus arquivos.')}
                    </p>

                    <label className="ws-editor__modal-field">
                      {t('Nome da cópia')}
                      <input
                        autoFocus
                        required
                        maxLength={120}
                        disabled={busy}
                        value={copyName}
                        onChange={(event) => setCopyName(event.target.value)}
                      />
                    </label>
                  </div>

                  <footer className="ws-editor__modal-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setCopyDialogOpen(false)}
                    >
                      {t('Cancelar')}
                    </button>

                    <button
                      type="submit"
                      className="ws-editor__modal-primary"
                      disabled={busy || !copyName.trim()}
                    >
                      <Copy size={15} aria-hidden="true" />
                      {t('Criar cópia')}
                    </button>
                  </footer>
                </form>
              </div>
            )}
          <p className="ws-app__muted">
            {t(
              'Ctrl+S salva localmente. Alterações feitas em outra janela são detectadas antes de sobrescrever.',
            )}
          </p>

            {/* === Avisos e feedback de operações === */}
            {externalMessage && (
              <section className="ws-editor__notice ws-editor__notice--warning" role="alert">
                <div>
                  <strong>{t('Alteração externa detectada')}</strong>
                  <p>{t(externalMessage)}</p>
                </div>

                <div className="ws-editor__notice-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => (dirty ? openModal('reload') : reload())}
                  >
                    {t('Recarregar')}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('copy')}
                  >
                    {t('Salvar cópia')}
                  </button>
                </div>
              </section>
            )}

            {message && (
              <p className="ws-editor__notice" role="status">
                {t(message)}
              </p>
            )}

        </>
      )}
    </article>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FilePlus2, Paperclip, Send, X } from 'lucide-react';
import {
  getAdminAccessToken,
  getAdminSessionVersion,
  invalidateAdminSession,
  subscribeAdminSession,
} from '../../services/authService';
import { executeJsonRequest } from '../../services/httpRequestContract';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import { translate as t } from '../../shared/i18n/i18n';
import PostAttachmentManager from './PostAttachmentManager';
import './Notes.css';

/* === FORMULÁRIO ADMINISTRATIVO DE NOTAS === */
const EMPTY_NOTE = { title: '', summary: '', body: '', tags: '' };

export default function NotesAdmin({ instanceId, isAdmin, refreshPublicPosts }) {
  /* ----- Estado do editor ----- */
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(EMPTY_NOTE);
  const [savedPost, setSavedPost] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentPending, setAttachmentPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [baseline, setBaseline] = useState(JSON.stringify(EMPTY_NOTE));

  const creationIdRef = useRef(null);
  const activeRef = useRef(null);
  const mountedRef = useRef(false);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const publishRef = useRef(null);
  const afterSaveRef = useRef(false);
  const controlId = `notes-composer-${instanceId ?? 'standalone'}`;

  const dirty = JSON.stringify(fields) !== baseline;
  const busy = saving || publishing || attachmentBusy;
  useUnsavedChanges(instanceId, open && (dirty || busy || attachmentPending));

  /* ----- Controle de sessão e desmontagem ----- */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRef.current?.abort();
    };
  }, []);

  useEffect(
    () =>
      subscribeAdminSession(() => {
        activeRef.current?.abort();
      }),
    [],
  );

  /* ----- Consulta da publicação salva ----- */
  const loadSavedPost = useCallback(async (id, token, sessionVersion, signal) => {
    const { response, payload } = await executeJsonRequest(
      '/api/admin/posts',
      { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } },
      { signal },
    );

    if (response.status === 401 || response.status === 403) {
      invalidateAdminSession(sessionVersion);
      throw new Error('Sessão administrativa encerrada.');
    }

    if (!response.ok || !Array.isArray(payload?.posts)) {
      throw new Error('Não foi possível consultar o rascunho salvo.');
    }

    const post = payload.posts.find((item) => item.id === id);
    if (!post || typeof post.updatedAt !== 'string' || post.status !== 'draft') {
      throw new Error('O rascunho foi salvo, mas não foi possível localizar seus dados.');
    }

    return post;
  }, []);

  /* ----- Abertura e fechamento ----- */
  function startNewNote() {
    if (!isAdmin || busy) return;
    setFields(EMPTY_NOTE);
    setBaseline(JSON.stringify(EMPTY_NOTE));
    creationIdRef.current = null;
    setSavedPost(null);
    setAttachmentPending(false);
    setMessage('');
    setError('');
    setOpen(true);
  }

  function closeEditor() {
    if (busy) return;
    if ((dirty || attachmentPending) && !window.confirm(t('Descartar alterações não salvas?'))) {
      return;
    }
    setOpen(false);
    setError('');
    setMessage('');
  }

  function updateField(name, value) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  /* ----- Foco e navegação do card ----- */
  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    (dialog?.querySelector('input:not(:disabled)') ?? dialog?.querySelector('button'))?.focus();
    return () => trigger?.focus();
  }, [open, isAdmin]);

  useEffect(() => {
    if (!saving && afterSaveRef.current) {
      afterSaveRef.current = false;
      publishRef.current?.focus();
    }
  }, [saving]);

  function handleKeyDown(event) {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      closeEditor();
    }
    if (event.key !== 'Tab') return;
    const controls = [
      ...(dialogRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
      ) ?? []),
    ];
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || !dialogRef.current.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || !dialogRef.current.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ----- Salvamento do rascunho ----- */
  async function saveNote(event) {
    event.preventDefault();
    if (!isAdmin || busy || activeRef.current || (!dirty && savedPost)) return;

    const token = getAdminAccessToken();
    const sessionVersion = getAdminSessionVersion();
    if (!token) {
      setError('Sessão administrativa indisponível.');
      return;
    }
    const tags = fields.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (
      !fields.title.trim() ||
      !fields.body.trim() ||
      tags.length > 12 ||
      tags.some((tag) => tag.length > 40)
    ) {
      setError('Revise o título, o conteúdo e os assuntos da nota.');
      return;
    }

    if (!creationIdRef.current) creationIdRef.current = crypto.randomUUID();
    const id = savedPost?.id ?? creationIdRef.current;
    const controller = new AbortController();
    activeRef.current = controller;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { response, payload } = await executeJsonRequest(
        savedPost ? '/api/admin/posts/update' : '/api/admin/posts/create',
        {
          method: savedPost ? 'PATCH' : 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id,
            ...(savedPost ? { updatedAt: savedPost.updatedAt } : {}),
            title: fields.title,
            summary: fields.summary,
            body: fields.body,
            tags,
          }),
        },
        { operation: 'write', signal: controller.signal },
      );

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }
      if (
        !mountedRef.current ||
        getAdminSessionVersion() !== sessionVersion ||
        controller.signal.aborted
      )
        return;
      if (!response.ok || payload?.success !== true || payload.id !== id) {
        throw new Error(payload?.error || 'Não foi possível salvar o rascunho.');
      }

      const post = await loadSavedPost(id, token, sessionVersion, controller.signal);
      if (
        !mountedRef.current ||
        getAdminSessionVersion() !== sessionVersion ||
        controller.signal.aborted
      )
        return;
      afterSaveRef.current = true;
      setSavedPost(post);
      setBaseline(JSON.stringify(fields));
      setMessage('Rascunho salvo. Agora você pode anexar arquivos ou publicar.');
      refreshPublicPosts();
    } catch (err) {
      if (
        mountedRef.current &&
        !controller.signal.aborted &&
        getAdminSessionVersion() === sessionVersion
      ) {
        setError(err.message);
      }
    } finally {
      if (activeRef.current === controller) activeRef.current = null;
      if (mountedRef.current) setSaving(false);
    }
  }

  /* ----- Publicação ----- */
  async function publishNote() {
    if (!isAdmin || busy || activeRef.current || dirty || attachmentPending || !savedPost) return;
    const token = getAdminAccessToken();
    const sessionVersion = getAdminSessionVersion();
    if (!token) {
      setError('Sessão administrativa indisponível.');
      return;
    }
    const controller = new AbortController();
    activeRef.current = controller;
    setPublishing(true);
    setError('');
    setMessage('');

    try {
      const current = savedPost;
      const { response, payload } = await executeJsonRequest(
        '/api/admin/posts/status',
        {
          method: 'PATCH',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: current.id,
            action: 'publish',
            updatedAt: current.updatedAt,
          }),
        },
        { operation: 'write', signal: controller.signal },
      );
      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }
      if (
        !mountedRef.current ||
        getAdminSessionVersion() !== sessionVersion ||
        controller.signal.aborted
      )
        return;
      if (
        !response.ok ||
        payload?.success !== true ||
        payload.id !== current.id ||
        payload.status !== 'published'
      ) {
        throw new Error(payload?.error || 'Não foi possível publicar a nota.');
      }
      refreshPublicPosts();
      setOpen(false);
      setMessage('');
    } catch (err) {
      if (
        mountedRef.current &&
        !controller.signal.aborted &&
        getAdminSessionVersion() === sessionVersion
      )
        setError(err.message);
    } finally {
      if (activeRef.current === controller) activeRef.current = null;
      if (mountedRef.current) setPublishing(false);
    }
  }

  /* ----- Atualização dos anexos ----- */
  async function refreshSavedPost() {
    const token = getAdminAccessToken();
    const version = getAdminSessionVersion();
    if (!token || !savedPost || activeRef.current) return;
    const controller = new AbortController();
    activeRef.current = controller;
    try {
      const post = await loadSavedPost(savedPost.id, token, version, controller.signal);
      if (
        mountedRef.current &&
        getAdminSessionVersion() === version &&
        !controller.signal.aborted
      ) {
        setSavedPost(post);
        refreshPublicPosts();
        return post;
      }
    } catch (err) {
      if (mountedRef.current && getAdminSessionVersion() === version && !controller.signal.aborted)
        setError(err.message);
      throw err;
    } finally {
      if (activeRef.current === controller) activeRef.current = null;
    }
  }

  /* === INTERFACE ADMINISTRATIVA === */
  return (
    <section className="notes-app__admin">
      {isAdmin && (
        <button
          ref={triggerRef}
          className="notes-app__new-note"
          type="button"
          onClick={startNewNote}
        >
          <FilePlus2 size={17} aria-hidden="true" />
          {t('Nova nota')}
        </button>
      )}

      {open &&
        createPortal(
          <div
            className="notes-app notes-app__composer-overlay"
            onKeyDown={handleKeyDown}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <section
              ref={dialogRef}
              tabIndex={-1}
              className="notes-app__composer"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${controlId}-title`}
            >
              <header className="notes-app__composer-header">
                <div>
                  <span className="notes-app__editor-eyebrow">WS OS / NOTES</span>
                  <h3 id={`${controlId}-title`}>{t('Nova nota')}</h3>
                </div>
                <button
                  type="button"
                  className="notes-app__composer-close"
                  onClick={closeEditor}
                  disabled={busy}
                  aria-label={t('Fechar editor')}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </header>

              {!isAdmin && (
                <p className="notes-app__composer-message" role="alert">
                  {t(
                    'Sessão administrativa encerrada. Entre novamente pelo Terminal para continuar.',
                  )}
                </p>
              )}
              <form
                id={`${controlId}-form`}
                className="notes-app__composer-form"
                onSubmit={saveNote}
              >
                <fieldset disabled={busy || !isAdmin}>
                  <label>
                    {t('Título')}
                    <input
                      required
                      maxLength={160}
                      value={fields.title}
                      onChange={(event) => updateField('title', event.target.value)}
                    />
                  </label>
                  <label>
                    {t('Resumo')}
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={fields.summary}
                      onChange={(event) => updateField('summary', event.target.value)}
                    />
                  </label>
                  <label>
                    {t('Conteúdo')}
                    <textarea
                      required
                      rows={8}
                      maxLength={10000}
                      value={fields.body}
                      onChange={(event) => updateField('body', event.target.value)}
                    />
                  </label>
                  <label>
                    {t('Assuntos (separados por vírgula)')}
                    <input
                      value={fields.tags}
                      onChange={(event) => updateField('tags', event.target.value)}
                      placeholder={t('React, JavaScript, Estudos')}
                    />
                  </label>
                </fieldset>
              </form>

              <section className="notes-app__composer-attachments" aria-label={t('Anexos')}>
                <div className="notes-app__composer-section-heading">
                  <Paperclip size={17} aria-hidden="true" />
                  <strong>{t('Anexos')}</strong>
                </div>
                {savedPost ? (
                  isAdmin && (
                    <PostAttachmentManager
                      key={savedPost.id}
                      post={savedPost}
                      onRefresh={refreshSavedPost}
                      onPending={setAttachmentPending}
                      onBusy={setAttachmentBusy}
                    />
                  )
                ) : (
                  <p>{t('Salve o rascunho para adicionar arquivos.')}</p>
                )}
              </section>

              {message && (
                <p className="notes-app__composer-message" role="status">
                  {t(message)}
                </p>
              )}
              {error && (
                <p className="notes-app__composer-message" role="alert">
                  {t(error)}
                </p>
              )}

              <footer className="notes-app__composer-actions">
                <button type="button" onClick={closeEditor} disabled={busy}>
                  {t('Cancelar')}
                </button>
                <button
                  type="submit"
                  form={`${controlId}-form`}
                  disabled={busy || !isAdmin || (!dirty && Boolean(savedPost))}
                >
                  {saving ? t('Salvando...') : t('Salvar rascunho')}
                </button>
                <button
                  ref={publishRef}
                  type="button"
                  className="notes-app__composer-publish"
                  onClick={publishNote}
                  disabled={
                    !isAdmin ||
                    busy ||
                    dirty ||
                    attachmentPending ||
                    !savedPost ||
                    savedPost.status === 'published'
                  }
                >
                  <Send size={16} aria-hidden="true" />
                  {publishing ? t('Publicando...') : t('Publicar')}
                </button>
              </footer>
            </section>
          </div>,
          document.body,
        )}
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { contentText } from '../../content/portfolioContent';
import {
  getAdminAccessToken,
  getAdminSessionVersion,
  subscribeAdminSession,
  invalidateAdminSession,
} from '../../services/authService';
import { subscribePublicData } from '../../services/publicDataService';
import { executeJsonRequest } from '../../services/httpRequestContract';
import './Notes.css';
import PostAttachmentManager from './PostAttachmentManager';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

export default function NotesAdmin({
  instanceId,
  isAdmin,
  refreshPublicPosts,
  onDeletePublicPost,
}) {
  const locale = useLocale();

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingUpdatedAt, setEditingUpdatedAt] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [editorBaseline, setEditorBaseline] = useState(null);

  const [savingDraft, setSavingDraft] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentPostId, setAttachmentPostId] = useState(null);

  const editorContent = JSON.stringify({
    title: draftTitle,
    summary: draftSummary,
    body: draftBody,
    tags: draftTags,
  });

  const hasUnsavedChanges =
    showEditor && editorBaseline !== null && editorContent !== editorBaseline;

  const [draftMessage, setDraftMessage] = useState('');

  const [adminPosts, setAdminPosts] = useState([]);
  const [loadingAdminPosts, setLoadingAdminPosts] = useState(false);
  const [adminPostsError, setAdminPostsError] = useState('');
  const [showAdminPosts, setShowAdminPosts] = useState(false);

  const [changingStatusId, setChangingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [attachmentPending, setAttachmentPending] = useState(false);
  useUnsavedChanges(
    instanceId,
    hasUnsavedChanges ||
      savingDraft ||
      attachmentBusy ||
      attachmentPending ||
      changingStatusId !== null ||
      deletingId !== null,
  );

  const mutationRef = useRef(false);
  const writeRequestRef = useRef(null);
  const creationIdRef = useRef(null);
  const mountedRef = useRef(false);
  const adminPostsRequestRef = useRef(null);
  const adminPostsRequestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      adminPostsRequestIdRef.current += 1;
      writeRequestRef.current?.abort();
      adminPostsRequestRef.current?.abort();
      adminPostsRequestRef.current = null;
    };
  }, []);

  useEffect(
    () =>
      subscribeAdminSession(() => {
        adminPostsRequestIdRef.current += 1;
        writeRequestRef.current?.abort();
        adminPostsRequestRef.current?.abort();
        adminPostsRequestRef.current = null;
        setLoadingAdminPosts(false);
        setAdminPosts([]);
        setShowAdminPosts(false);
        setAdminPostsError('');
        setDraftMessage('');
      }),
    [],
  );

  const isCurrentSession = useCallback(
    (version) => mountedRef.current && getAdminSessionVersion() === version,
    [],
  );

  async function deletePost(post) {
    const token = getAdminAccessToken();
    const sessionVersion = getAdminSessionVersion();
    if (mutationRef.current) return;

    if (!token) {
      setAdminPostsError('Sessão administrativa indisponível.');
      return;
    }

    const title = contentText(post.title, 'pt-BR');

    const confirmed = window.confirm(
      `Deseja excluir permanentemente "${title}"?\n\n` + 'Esta ação não poderá ser desfeita.',
    );

    if (!confirmed) return;

    mutationRef.current = true;
    writeRequestRef.current = new AbortController();
    setDeletingId(post.id);
    setAdminPostsError('');
    setDraftMessage('');

    try {
      const { response, payload: data } = await executeJsonRequest(
        `/api/admin/posts/delete?id=${encodeURIComponent(post.id)}&updatedAt=${encodeURIComponent(post.updatedAt)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        },
        { operation: 'write', signal: writeRequestRef.current.signal },
      );

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }

      if (!isCurrentSession(sessionVersion)) return;

      if (!response.ok || data.success !== true || data.id !== post.id) {
        throw new Error(data.error || 'Não foi possível excluir a publicação.');
      }

      if (editingId === post.id) {
        resetEditor();
        setShowEditor(false);
      }

      onDeletePublicPost(post.id);

      setDraftMessage('Publicação excluída com sucesso.');

      refreshPublicPosts();
      await loadAdminPosts();
    } catch (error) {
      if (isCurrentSession(sessionVersion)) {
        setAdminPostsError(error.message);
      }
    } finally {
      mutationRef.current = false;
      writeRequestRef.current = null;
      if (mountedRef.current) {
        setDeletingId(null);
      }
    }
  }

  async function changePostStatus(post) {
    const token = getAdminAccessToken();

    const sessionVersion = getAdminSessionVersion();

    if (!token) {
      setAdminPostsError('Sessão administrativa indisponível.');
      return;
    }

    if (editingId === post.id && (hasUnsavedChanges || savingDraft)) {
      setAdminPostsError(
        'Salve ou descarte as alterações desta publicação antes de mudar seu status.',
      );
      return;
    }

    if (mutationRef.current) {
      setAdminPostsError('Aguarde a conclusão da operação anterior.');
      return;
    }

    const publishing = post.status === 'draft';
    const action = publishing ? 'publish' : 'unpublish';

    const confirmed = window.confirm(
      publishing
        ? 'Deseja publicar esta nota para todos os visitantes?'
        : 'Deseja retirar esta nota da área pública?',
    );

    if (!confirmed) return;

    mutationRef.current = true;
    writeRequestRef.current = new AbortController();
    setChangingStatusId(post.id);
    setAdminPostsError('');
    setDraftMessage('');

    try {
      const { response, payload: data } = await executeJsonRequest(
        '/api/admin/posts/status',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          body: JSON.stringify({
            id: post.id,
            action,
            updatedAt: post.updatedAt,
          }),
        },
        { operation: 'write', signal: writeRequestRef.current.signal },
      );

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }

      if (!isCurrentSession(sessionVersion)) return;

      if (
        !response.ok ||
        data.success !== true ||
        data.id !== post.id ||
        data.status !== (publishing ? 'published' : 'draft') ||
        !Number.isFinite(Date.parse(data.updatedAt))
      ) {
        throw new Error(data.error || 'Resposta inválida ao alterar a publicação.');
      }

      if (editingId === post.id) {
        setEditingUpdatedAt(data.updatedAt);
      }

      setAdminPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? {
                ...item,
                status: data.status,
                updatedAt: data.updatedAt,
              }
            : item,
        ),
      );

      setDraftMessage(
        publishing
          ? 'Publicação disponibilizada ao público.'
          : 'Publicação retirada da área pública.',
      );

      if (!publishing) onDeletePublicPost(post.id);
      refreshPublicPosts();
      await loadAdminPosts();
    } catch (error) {
      if (isCurrentSession(sessionVersion)) {
        setAdminPostsError(error.message);
      }
    } finally {
      mutationRef.current = false;
      writeRequestRef.current = null;
      if (mountedRef.current) {
        setChangingStatusId(null);
      }
    }
  }

  function editPost(post) {
    if (mutationRef.current) return;
    if (hasUnsavedChanges && !window.confirm('Descartar alterações não salvas?')) return;
    setEditingId(post.id);
    setEditingUpdatedAt(post.updatedAt);
    setDraftTitle(contentText(post.title, 'pt-BR'));
    setDraftSummary(contentText(post.summary, 'pt-BR'));
    setDraftBody(contentText(post.body, 'pt-BR'));
    setDraftTags((post.tags ?? []).join(', '));
    setEditorBaseline(
      JSON.stringify({
        title: contentText(post.title, 'pt-BR'),
        summary: contentText(post.summary, 'pt-BR'),
        body: contentText(post.body, 'pt-BR'),
        tags: (post.tags ?? []).join(', '),
      }),
    );
    setDraftMessage('');
    setShowEditor(true);
  }

  function resetEditor() {
    creationIdRef.current = null;
    setEditingId(null);
    setEditingUpdatedAt(null);
    setEditorBaseline(null);
    setDraftTitle('');
    setDraftSummary('');
    setDraftBody('');
    setDraftTags('');
    setDraftMessage('');
  }

  const loadAdminPosts = useCallback(async () => {
    adminPostsRequestRef.current?.abort();

    const controller = new AbortController();
    const requestId = ++adminPostsRequestIdRef.current;

    adminPostsRequestRef.current = controller;

    const token = getAdminAccessToken();
    const sessionVersion = getAdminSessionVersion();

    if (!token) {
      adminPostsRequestRef.current = null;
      setAdminPostsError('Sessão administrativa indisponível.');
      setLoadingAdminPosts(false);
      return;
    }

    setLoadingAdminPosts(true);
    setAdminPostsError('');

    try {
      const { response, payload: data } = await executeJsonRequest(
        '/api/admin/posts',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        },
        { signal: controller.signal },
      );

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }

      if (
        controller.signal.aborted ||
        requestId !== adminPostsRequestIdRef.current ||
        !isCurrentSession(sessionVersion)
      ) {
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar publicações.');
      }

      if (!Array.isArray(data.posts)) {
        throw new Error('Resposta inválida do servidor.');
      }

      setAdminPosts(data.posts);
      return data.posts;
    } catch (error) {
      if (
        !controller.signal.aborted &&
        requestId === adminPostsRequestIdRef.current &&
        isCurrentSession(sessionVersion)
      ) {
        setAdminPostsError(error.message);
      }
    } finally {
      if (requestId === adminPostsRequestIdRef.current && isCurrentSession(sessionVersion)) {
        adminPostsRequestRef.current = null;
        setLoadingAdminPosts(false);
      }
    }
  }, [isCurrentSession]);

  useEffect(
    () =>
      subscribePublicData(({ prefix }) => {
        if (
          isAdmin &&
          showAdminPosts &&
          prefix &&
          '/api/posts'.startsWith(prefix) &&
          !mutationRef.current
        )
          void loadAdminPosts();
      }),
    [isAdmin, showAdminPosts, loadAdminPosts],
  );

  async function saveDraft(event) {
    event.preventDefault();

    const token = getAdminAccessToken();
    const sessionVersion = getAdminSessionVersion();
    if (mutationRef.current) return;

    if (!token) {
      setDraftMessage('Sessão administrativa indisponível.');
      return;
    }

    mutationRef.current = true;
    writeRequestRef.current = new AbortController();
    setSavingDraft(true);
    setDraftMessage('');

    try {
      if (!editingId && !creationIdRef.current) creationIdRef.current = crypto.randomUUID();
      const { response, payload: data } = await executeJsonRequest(
        editingId ? '/api/admin/posts/update' : '/api/admin/posts/create',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          body: JSON.stringify({
            ...(editingId
              ? {
                  id: editingId,
                  updatedAt: editingUpdatedAt,
                }
              : { id: creationIdRef.current }),
            title: draftTitle,
            summary: draftSummary,
            body: draftBody,
            tags: draftTags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          }),
        },
        { operation: 'write', signal: writeRequestRef.current.signal },
      );

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }

      if (!isCurrentSession(sessionVersion)) return;

      if (
        !response.ok ||
        data?.success !== true ||
        typeof data.id !== 'string' ||
        !/^[a-z\d_-]{1,80}$/i.test(data.id) ||
        data.id !== (editingId || creationIdRef.current)
      ) {
        throw new Error(data.error || 'Não foi possível salvar o rascunho.');
      }

      const wasEditing = Boolean(editingId);

      resetEditor();
      setShowEditor(false);
      refreshPublicPosts();
      setDraftMessage(
        wasEditing ? 'Publicação atualizada com sucesso.' : 'Rascunho salvo com sucesso.',
      );

      if (showAdminPosts) {
        await loadAdminPosts();
      }
    } catch (error) {
      if (isCurrentSession(sessionVersion)) setDraftMessage(error.message);
    } finally {
      mutationRef.current = false;
      writeRequestRef.current = null;
      if (mountedRef.current) setSavingDraft(false);
    }
  }

  if (!isAdmin) {
    return hasUnsavedChanges ? (
      <p role="status">
        {t(
          'Sessão administrativa encerrada. Suas alterações permanecem nesta janela; entre novamente pelo Terminal para continuar. Se havia uma operação em andamento, confira a lista antes de reenviar.',
        )}
      </p>
    ) : null;
  }

  return (
    <section className="notes-app__admin">
      <button
        type="button"

        onClick={() => {
          if (mutationRef.current) return;

          if (showEditor) {
            if (hasUnsavedChanges && !window.confirm('Descartar alterações não salvas?')) {
              return;
            }

            resetEditor();
            setShowEditor(false);
          } else {
            resetEditor();
            setEditorBaseline(
              JSON.stringify({
                title: '',
                summary: '',
                body: '',
                tags: '',
              }),
            );
            setShowEditor(true);
          }
        }}
      >
        {showEditor ? t('Fechar editor') : t('Criar rascunho')}
      </button>

      {showEditor && (
        <form onSubmit={saveDraft} className="notes-app__editor">
          <fieldset
            disabled={
              savingDraft || changingStatusId !== null || deletingId !== null || attachmentBusy
            }
          >
            <h3>{editingId ? t('Editar publicação') : t('Nova publicação')}</h3>

            <label>
              {t('Título')}
              <input
                type="text"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                maxLength={160}
                required
              />
            </label>

            <label>
              {t('Resumo')}
              <textarea
                value={draftSummary}
                onChange={(event) => setDraftSummary(event.target.value)}
                maxLength={500}
                rows={3}
                required
              />
            </label>

            <label>
              {t('Conteúdo')}
              <textarea
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
                maxLength={10000}
                rows={10}
                required
              />
            </label>

            <label>
              {t('Assuntos (separados por vírgula)')}
              <input
                type="text"
                value={draftTags}
                onChange={(event) => setDraftTags(event.target.value)}
                placeholder={t('React, JavaScript, Estudos')}
              />
            </label>

            <button type="submit" disabled={savingDraft || attachmentBusy}>
              {savingDraft
                ? t('Salvando...')
                : editingId
                  ? t('Salvar alterações')
                  : t('Salvar rascunho')}
            </button>
            {editingId && (
              <button
                type="button"
                disabled={savingDraft || attachmentBusy}
                onClick={() => {
                  if (hasUnsavedChanges && !window.confirm('Descartar alterações não salvas?')) {
                    return;
                  }

                  resetEditor();
                  setShowEditor(false);
                }}
              >
                {t('Cancelar edição')}
              </button>
            )}
          </fieldset>
        </form>
      )}

      {draftMessage && <p role="status">{t(draftMessage)}</p>}

      <button
        type="button"
        disabled={attachmentBusy}
        onClick={() => {
          if (showAdminPosts) {
            if (attachmentPending && !window.confirm('Descartar seleção de anexo pendente?'))
              return;
            setAttachmentPending(false);
            setAttachmentPostId(null);
            setShowAdminPosts(false);
          } else {
            setShowAdminPosts(true);
            void loadAdminPosts();
          }
        }}
      >
        {showAdminPosts ? t('Ocultar minhas publicações') : t('Gerenciar publicações')}
      </button>

      {showAdminPosts && (
        <section className="notes-app__management">
          <h3>{t('Publicações e rascunhos')}</h3>

          <button type="button" onClick={loadAdminPosts} disabled={loadingAdminPosts}>
            {loadingAdminPosts ? t('Carregando...') : t('Atualizar lista')}
          </button>

          {adminPostsError && <p role="alert">{t(adminPostsError)}</p>}

          {(adminPosts.length > 0 || (!loadingAdminPosts && !adminPostsError)) &&
            (adminPosts.length === 0 ? (
              <p>{t('Nenhuma publicação cadastrada.')}</p>
            ) : (
              <ul>
                {adminPosts.map((post) => (
                  <li key={post.id}>
                    <strong>{contentText(post.title, locale)}</strong>
                    {' — '}
                    <span>{post.status === 'published' ? t('Publicado') : t('Rascunho')}</span>{' '}
                    <button
                      type="button"
                      onClick={() => editPost(post)}
                      disabled={
                        changingStatusId !== null ||
                        deletingId !== null ||
                        savingDraft ||
                        attachmentBusy
                      }
                    >
                      {t('Editar')}
                    </button>
                    <button
                      type="button"
                      disabled={
                        changingStatusId !== null ||
                        deletingId !== null ||
                        savingDraft ||
                        attachmentBusy
                      }
                      onClick={() => changePostStatus(post)}
                    >
                      {changingStatusId === post.id
                        ? t('Processando...')
                        : post.status === 'published'
                          ? t('Despublicar')
                          : t('Publicar')}
                    </button>
                    <button
                      type="button"
                      disabled={
                        deletingId !== null ||
                        changingStatusId !== null ||
                        savingDraft ||
                        attachmentBusy
                      }
                      onClick={() => deletePost(post)}
                    >
                      {deletingId === post.id ? t('Excluindo...') : t('Excluir')}
                    </button>
                    <button
                      type="button"
                      disabled={
                        savingDraft ||
                        changingStatusId !== null ||
                        deletingId !== null ||
                        attachmentBusy
                      }
                      onClick={() => {
                        if (
                          attachmentPending &&
                          !window.confirm('Descartar seleção de anexo pendente?')
                        )
                          return;
                        setAttachmentPending(false);
                        setAttachmentPostId((current) => (current === post.id ? null : post.id));
                      }}
                    >
                      {t('Anexos')}
                    </button>
                    {attachmentPostId === post.id && (
                      <PostAttachmentManager
                        key={post.id}
                        post={post}
                        onRefresh={loadAdminPosts}
                        onPending={setAttachmentPending}
                        onBusy={(value) => {
                          mutationRef.current = value;
                          setAttachmentBusy(value);
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </section>
      )}
    </section>
  );
}

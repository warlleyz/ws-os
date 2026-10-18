import { useEffect, useRef, useState } from 'react';
import { contentText } from '../../content/portfolioContent';
import {
  getAdminAccessToken,
  getAdminSessionVersion,
  subscribeAdminSession,
  invalidateAdminSession,
} from '../../services/authService';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import { useLocale } from '../../shared/i18n/i18n';

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

  const editorContent = JSON.stringify({
    title: draftTitle,
    summary: draftSummary,
    body: draftBody,
    tags: draftTags,
  });

  const hasUnsavedChanges =
    showEditor && editorBaseline !== null && editorContent !== editorBaseline;

  useUnsavedChanges(instanceId, hasUnsavedChanges || savingDraft);
  const [draftMessage, setDraftMessage] = useState('');

  const [adminPosts, setAdminPosts] = useState([]);
  const [loadingAdminPosts, setLoadingAdminPosts] = useState(false);
  const [adminPostsError, setAdminPostsError] = useState('');
  const [showAdminPosts, setShowAdminPosts] = useState(false);

  const [changingStatusId, setChangingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const mutationRef = useRef(false);
  const mountedRef = useRef(false);
  const adminPostsRequestRef = useRef(null);
  const adminPostsRequestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      adminPostsRequestIdRef.current += 1;
      adminPostsRequestRef.current?.abort();
      adminPostsRequestRef.current = null;
    };
  }, []);

  useEffect(
    () =>
      subscribeAdminSession(() => {
        adminPostsRequestIdRef.current += 1;
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

  function isCurrentSession(version) {
    return mountedRef.current && getAdminSessionVersion() === version;
  }

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
    setDeletingId(post.id);
    setAdminPostsError('');
    setDraftMessage('');

    try {
      const response = await fetch(`/api/admin/posts/delete?id=${encodeURIComponent(post.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }
      const data = await response.json();

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
    setChangingStatusId(post.id);
    setAdminPostsError('');
    setDraftMessage('');

    try {
      const response = await fetch('/api/admin/posts/status', {
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
      });

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }
      const data = await response.json();

      if (!isCurrentSession(sessionVersion)) return;

      if (
        !response.ok ||
        data.success !== true ||
        data.id !== post.id ||
        data.status !== (publishing ? 'published' : 'draft') ||
        typeof data.updatedAt !== 'string'
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
    setEditingId(null);
    setEditingUpdatedAt(null);
    setEditorBaseline(null);
    setDraftTitle('');
    setDraftSummary('');
    setDraftBody('');
    setDraftTags('');
    setDraftMessage('');
  }

  async function loadAdminPosts() {
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
      const response = await fetch('/api/admin/posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }
      const data = await response.json();

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
  }

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
    setSavingDraft(true);
    setDraftMessage('');

    try {
      const response = await fetch(
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
              : {}),
            title: draftTitle,
            summary: draftSummary,
            body: draftBody,
            tags: draftTags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        invalidateAdminSession(sessionVersion);
        return;
      }
      const data = await response.json();

      if (!isCurrentSession(sessionVersion)) return;

      if (!response.ok || data.success !== true || typeof data.id !== 'string') {
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
      if (mountedRef.current) setSavingDraft(false);
    }
  }

  if (!isAdmin) {
    return hasUnsavedChanges ? (
      <p role="status">
        Sessão administrativa encerrada. Suas alterações permanecem nesta janela; entre novamente
        pelo Terminal para continuar. Se havia uma operação em andamento, confira a lista antes de
        reenviar.
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
        {showEditor ? 'Fechar editor' : 'Criar rascunho'}
      </button>

      {showEditor && (
        <form onSubmit={saveDraft} className="notes-app__editor">
          <fieldset disabled={savingDraft || changingStatusId !== null || deletingId !== null}>
            <h3>{editingId ? 'Editar publicação' : 'Nova publicação'}</h3>

            <label>
              Título
              <input
                type="text"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                maxLength={160}
                required
              />
            </label>

            <label>
              Resumo
              <textarea
                value={draftSummary}
                onChange={(event) => setDraftSummary(event.target.value)}
                maxLength={500}
                rows={3}
                required
              />
            </label>

            <label>
              Conteúdo
              <textarea
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
                maxLength={10000}
                rows={10}
                required
              />
            </label>

            <label>
              Assuntos (separados por vírgula)
              <input
                type="text"
                value={draftTags}
                onChange={(event) => setDraftTags(event.target.value)}
                placeholder="React, JavaScript, Estudos"
              />
            </label>

            <button type="submit" disabled={savingDraft}>
              {savingDraft ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar rascunho'}
            </button>
            {editingId && (
              <button
                type="button"
                disabled={savingDraft}
                onClick={() => {
                  if (hasUnsavedChanges && !window.confirm('Descartar alterações não salvas?')) {
                    return;
                  }

                  resetEditor();
                  setShowEditor(false);
                }}
              >
                Cancelar edição
              </button>
            )}
          </fieldset>
        </form>
      )}

      {draftMessage && <p role="status">{draftMessage}</p>}

      <button
        type="button"
        onClick={() => {
          if (showAdminPosts) {
            setShowAdminPosts(false);
          } else {
            setShowAdminPosts(true);
            void loadAdminPosts();
          }
        }}
      >
        {showAdminPosts ? 'Ocultar minhas publicações' : 'Gerenciar publicações'}
      </button>

      {showAdminPosts && (
        <section className="notes-app__management">
          <h3>Publicações e rascunhos</h3>

          <button type="button" onClick={loadAdminPosts} disabled={loadingAdminPosts}>
            {loadingAdminPosts ? 'Carregando...' : 'Atualizar lista'}
          </button>

          {adminPostsError && <p role="alert">{adminPostsError}</p>}

          {!loadingAdminPosts &&
            !adminPostsError &&
            (adminPosts.length === 0 ? (
              <p>Nenhuma publicação cadastrada.</p>
            ) : (
              <ul>
                {adminPosts.map((post) => (
                  <li key={post.id}>
                    <strong>{contentText(post.title, locale)}</strong>
                    {' — '}
                    <span>{post.status === 'published' ? 'Publicado' : 'Rascunho'}</span>{' '}
                    <button
                      type="button"
                      onClick={() => editPost(post)}
                      disabled={changingStatusId !== null || deletingId !== null || savingDraft}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={changingStatusId !== null || deletingId !== null || savingDraft}
                      onClick={() => changePostStatus(post)}
                    >
                      {changingStatusId === post.id
                        ? 'Processando...'
                        : post.status === 'published'
                          ? 'Despublicar'
                          : 'Publicar'}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId !== null || changingStatusId !== null || savingDraft}
                      onClick={() => deletePost(post)}
                    >
                      {deletingId === post.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </li>
                ))}
              </ul>
            ))}
        </section>
      )}
    </section>
  );
}

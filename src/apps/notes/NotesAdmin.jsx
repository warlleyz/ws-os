import { useState } from 'react';
import { contentText } from '../../content/portfolioContent';
import { getAdminAccessToken } from '../../services/authService';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import { useLocale } from '../../shared/i18n/i18n';

export default function NotesAdmin({
    instanceId,
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
    showEditor &&
    editorBaseline !== null &&
    editorContent !== editorBaseline;

    useUnsavedChanges(
        instanceId,
        hasUnsavedChanges || savingDraft
    );
  const [draftMessage, setDraftMessage] = useState('');


  const [adminPosts, setAdminPosts] = useState([]);
  const [loadingAdminPosts, setLoadingAdminPosts] = useState(false);
  const [adminPostsError, setAdminPostsError] = useState('');
  const [showAdminPosts, setShowAdminPosts] = useState(false)
  

  const [changingStatusId, setChangingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);


  async function deletePost(post) {
    const token = getAdminAccessToken();

    if (!token) {
      setAdminPostsError('Sessão administrativa indisponível.');
      return;
    }

    const title = contentText(post.title, 'pt-BR');

    const confirmed = window.confirm(
      `Deseja excluir permanentemente "${title}"?\n\n` +
      'Esta ação não poderá ser desfeita.'
    );

    if (!confirmed) return;

    setDeletingId(post.id);
    setAdminPostsError('');
    setDraftMessage('');

    try {
      const response = await fetch(
        `/api/admin/posts/delete?id=${encodeURIComponent(post.id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.error || 'Não foi possível excluir a publicação.'
        );
      }

      if (editingId === post.id) {
        resetEditor();
        setShowEditor(false);
      }

      onDeletePublicPost(post.id);

      setDraftMessage('Publicação excluída com sucesso.');

      await loadAdminPosts();
      refreshPublicPosts();
    } catch (error) {
      setAdminPostsError(error.message);
    } finally {
      setDeletingId(null);
    }
  }


  async function changePostStatus(post) {
    const token = getAdminAccessToken();

    if (!token) {
      setAdminPostsError('Sessão administrativa indisponível.');
      return;
    }

    const publishing = post.status === 'draft';
    const action = publishing ? 'publish' : 'unpublish';

    const confirmed = window.confirm(
      publishing
        ? 'Deseja publicar esta nota para todos os visitantes?'
        : 'Deseja retirar esta nota da área pública?'
    );

    if (!confirmed) return;

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Não foi possível alterar a publicação.'
        );
      }

      setDraftMessage(
        publishing
          ? 'Publicação disponibilizada ao público.'
          : 'Publicação retirada da área pública.'
      );

      await loadAdminPosts();
      refreshPublicPosts();
    } catch (error) {
      setAdminPostsError(error.message);
    } finally {
      setChangingStatusId(null);
    }
  }



  function editPost(post) {
    setEditingId(post.id);
    setEditingUpdatedAt(post.updatedAt);
    setDraftTitle(contentText(post.title, 'pt-BR'));
    setDraftSummary(contentText(post.summary, 'pt-BR'));
    setDraftBody(contentText(post.body, 'pt-BR'));
    setDraftTags((post.tags ?? []).join(', '));
    setEditorBaseline(JSON.stringify({
      title: contentText(post.title, 'pt-BR'),
      summary: contentText(post.summary, 'pt-BR'),
      body: contentText(post.body, 'pt-BR'),
      tags: (post.tags ?? []).join(', '),
    }));
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
    const token = getAdminAccessToken();

    if (!token) {
      setAdminPostsError('Sessão administrativa indisponível.');
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar publicações.');
      }

      if (!Array.isArray(data.posts)) {
        throw new Error('Resposta inválida do servidor.');
      }

      setAdminPosts(data.posts);
    } catch (error) {
      setAdminPostsError(error.message);
    } finally {
      setLoadingAdminPosts(false);
    }
  }


  async function saveDraft(event) {
    event.preventDefault();

    const token = getAdminAccessToken();

    if (!token) {
      setDraftMessage('Sessão administrativa indisponível.');
      return;
    }

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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível salvar o rascunho.');
      }

      const wasEditing = Boolean(editingId);

      resetEditor();
      setDraftMessage(
        wasEditing
          ? 'Publicação atualizada com sucesso.'
          : 'Rascunho salvo com sucesso.'
      );

      if (showAdminPosts) {
        await loadAdminPosts();
      }
    } catch (error) {
      setDraftMessage(error.message);
    } finally {
      setSavingDraft(false);
    }
  }


  return (
        <section className="notes-app__admin">
          <button
            type="button"

            onClick={() => {
              if (savingDraft) return;

              if (showEditor) {
                if (
                  hasUnsavedChanges &&
                  !window.confirm('Descartar alterações não salvas?')
                ) {
                  return;
                }

                resetEditor();
                setShowEditor(false);
              } else {
                resetEditor();
                setEditorBaseline(JSON.stringify({
                  title: '',
                  summary: '',
                  body: '',
                  tags: '',
                }));
                setShowEditor(true);
              }
            }}

          >
            {showEditor ? 'Fechar editor' : 'Criar rascunho'}
          </button>

          {showEditor && (
            <form onSubmit={saveDraft} className="notes-app__editor">
              <h3>
                {editingId ? 'Editar publicação' : 'Nova publicação'}
              </h3>

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
                {savingDraft
                  ? 'Salvando...'
                  : editingId
                    ? 'Salvar alterações'
                    : 'Salvar rascunho'}
              </button>
              {editingId && (
                <button
                  type="button"
                  disabled={savingDraft}
                  onClick={() => {
                    if (
                      hasUnsavedChanges &&
                      !window.confirm('Descartar alterações não salvas?')
                    ) {
                      return;
                    }

                    resetEditor();
                    setShowEditor(false);
                  }}
                >
                  Cancelar edição
                </button>
              )}
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

              <button
                type="button"
                onClick={loadAdminPosts}
                disabled={loadingAdminPosts}
              >
                {loadingAdminPosts ? 'Carregando...' : 'Atualizar lista'}
              </button>

              {adminPostsError && (
                <p role="alert">{adminPostsError}</p>
              )}

              {!loadingAdminPosts && !adminPostsError && (
                adminPosts.length === 0 ? (
                  <p>Nenhuma publicação cadastrada.</p>
                ) : (
                  <ul>
                    {adminPosts.map((post) => (
                      <li key={post.id}>
                        <strong>{contentText(post.title, locale)}</strong>
                        {' — '}
                        <span>
                          {post.status === 'published'
                            ? 'Publicado'
                            : 'Rascunho'}
                        </span>
                        {' '}
                        <button
                          type="button"
                          onClick={() => editPost(post)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={changingStatusId !== null}
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
                          disabled={deletingId !== null || changingStatusId !== null}
                          onClick={() => deletePost(post)}
                        >
                          {deletingId === post.id ? 'Excluindo...' : 'Excluir'}
                        </button>


                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          )}

        </section>
  );
}

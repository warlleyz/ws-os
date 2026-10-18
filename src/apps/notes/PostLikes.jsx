import { useEffect, useRef, useState } from 'react';
import { getVisitorId } from '../../services/visitorIdentityService';

export default function PostLikes({ postId }) {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const requestIdRef = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function loadLikes() {
      try {
        const visitorId = getVisitorId();

        const response = await fetch(`/api/posts/likes?id=${encodeURIComponent(postId)}`, {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'X-WS-Visitor-ID': visitorId,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao consultar curtidas.');
        }

        if (
          data.postId !== postId ||
          !Number.isSafeInteger(data.count) ||
          data.count < 0 ||
          typeof data.liked !== 'boolean'
        ) {
          throw new Error('Resposta de curtidas inválida.');
        }
        if (requestId === requestIdRef.current && !controller.signal.aborted) {
          setCount(data.count);
          setLiked(data.liked);
          setError('');
        }
      } catch (err) {
        if (requestId === requestIdRef.current && !controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (requestId === requestIdRef.current && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadLikes();

    return () => {
      controller.abort();
      requestIdRef.current += 1;
    };
  }, [postId, retryCount]);

  function retryLoadLikes() {
    if (loading || submitting || submittingRef.current) return;

    setError('');
    setLoading(true);

    setRetryCount((current) => current + 1);
  }

  async function handleLike() {
    if (submittingRef.current || liked || loading || count === null) return;

    submittingRef.current = true;
    const requestId = requestIdRef.current;
    const currentPostId = postId;

    setSubmitting(true);
    setError('');

    try {
      const visitorId = getVisitorId();

      const response = await fetch(`/api/posts/likes/add?id=${encodeURIComponent(currentPostId)}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'X-WS-Visitor-ID': visitorId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível registrar a curtida.');
      }

      if (
        data.success !== true ||
        data.postId !== currentPostId ||
        (data.count !== null && (!Number.isSafeInteger(data.count) || data.count < 0))
      ) {
        throw new Error('Resposta de curtidas inválida.');
      }

      if (requestId === requestIdRef.current) {
        setLiked(true);
        if (data.count !== null) setCount(data.count);
        else setError('Curtida registrada, mas não foi possível atualizar a contagem.');
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(`${err.message} Verifique o estado da curtida antes de tentar novamente.`);

        setCount(null);
      }
    } finally {
      submittingRef.current = false;

      if (requestId === requestIdRef.current) {
        setSubmitting(false);
      }
    }
  }

  return (
    <section className="notes-app__likes" aria-label="Curtidas da publicação">
      <button
        type="button"
        onClick={handleLike}
        disabled={loading || submitting || liked || count === null}
        aria-pressed={liked}
      >
        {submitting ? 'Registrando...' : liked ? 'Curtido' : 'Curtir'}
      </button>

      <span aria-live="polite">
        {loading && count === null
          ? 'Carregando curtidas...'
          : count === null
            ? 'Curtidas indisponíveis'
            : `${count} ${count === 1 ? 'curtida' : 'curtidas'}`}
      </span>

      {error && <p role="alert">{error}</p>}

      {!loading && error && (
        <button type="button" onClick={retryLoadLikes} disabled={submitting}>
          Tentar novamente
        </button>
      )}
    </section>
  );
}

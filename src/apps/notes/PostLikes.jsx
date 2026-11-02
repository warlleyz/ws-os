import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

import { executeJsonRequest } from '../../services/httpRequestContract';
import { invalidatePublicData, subscribePublicData } from '../../services/publicDataService';
import { getVisitorId } from '../../services/visitorIdentityService';
import { translate as t } from '../../shared/i18n/i18n';

/* === CURTIDAS DA PUBLICAÇÃO === */
export default function PostLikes({ postId }) {
  /* ----- Estados ----- */
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  /* ----- Referências de requisições ----- */
  const requestIdRef = useRef(0);
  const submittingRef = useRef(false);
  const mutationController = useRef(null);

  /* === SINCRONIZAÇÃO DAS CURTIDAS === */
  /* ----- Atualização dos dados públicos ----- */
  useEffect(
    () =>
      subscribePublicData(({ prefix }) => {
        if (!prefix || !'/api/posts/likes'.startsWith(prefix) || submittingRef.current) {
          return;
        }

        setLoading(true);
        setRetryCount((current) => current + 1);
      }),
    [],
  );

  /* ----- Carregamento das curtidas ----- */
  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function loadLikes() {
      try {
        const visitorId = getVisitorId();

        const { response, payload: data } = await executeJsonRequest(
          `/api/posts/likes?id=${encodeURIComponent(postId)}`,
          {
            cache: 'no-store',
            headers: {
              'X-WS-Visitor-ID': visitorId,
            },
          },
          { signal: controller.signal },
        );

        /* ----- Validação da resposta ----- */
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

        /* ----- Atualização dos estados ----- */
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

    /* ----- Cancelamento das requisições ----- */
    return () => {
      controller.abort();
      mutationController.current?.abort();
      requestIdRef.current += 1;
    };
  }, [postId, retryCount]);

  /* === OPERAÇÕES DE CURTIDAS === */
  /* ----- Nova tentativa de carregamento ----- */
  function retryLoadLikes() {
    if (loading || submitting || submittingRef.current) return;

    setError('');
    setLoading(true);
    setRetryCount((current) => current + 1);
  }

  /* ----- Registro de curtida ----- */
  async function handleLike() {
    if (submittingRef.current || liked || loading || count === null) return;

    submittingRef.current = true;

    const controller = new AbortController();
    mutationController.current = controller;

    const requestId = requestIdRef.current;
    const currentPostId = postId;

    setSubmitting(true);
    setError('');

    try {
      const visitorId = getVisitorId();

      const { response, payload: data } = await executeJsonRequest(
        `/api/posts/likes/add?id=${encodeURIComponent(currentPostId)}`,
        {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'X-WS-Visitor-ID': visitorId,
          },
        },
        { operation: 'write', signal: controller.signal },
      );

      /* ----- Validação da resposta ----- */
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

      /* ----- Atualização da curtida ----- */
      if (requestId === requestIdRef.current) {
        invalidatePublicData('/api/posts/likes');
        setLiked(true);

        if (data.count !== null) {
          setCount(data.count);
        } else {
          setError('Curtida registrada, mas não foi possível atualizar a contagem.');
        }
      }
    } catch (err) {
      /* ----- Tratamento de falhas ----- */
      if (requestId === requestIdRef.current) {
        setError(`${err.message} Verifique o estado da curtida antes de tentar novamente.`);
        setCount(null);
      }
    } finally {
      /* ----- Finalização da operação ----- */
      submittingRef.current = false;
      mutationController.current = null;

      if (requestId === requestIdRef.current) {
        setSubmitting(false);
      }
    }
  }

  /* === INTERFACE === */
  return (
    <section className="notes-app__likes" aria-label={t('Curtidas da publicação')}>
      {/* ----- Botão de curtida ----- */}
      <button
        type="button"
        className={`notes-app__like-button${liked ? ' is-liked' : ''}`}
        onClick={handleLike}
        disabled={loading || submitting || liked || count === null}
        aria-pressed={liked}
        aria-label={t(liked ? 'Curtido' : 'Curtir')}
        title={t(liked ? 'Curtido' : 'Curtir')}
      >
        <Heart
          size={17}
          strokeWidth={1.8}
          fill={liked ? 'currentColor' : 'none'}
          aria-hidden="true"
        />

        {/* ----- Contador de curtidas ----- */}
        {count !== null && (
          <span
            className="notes-app__like-count"
            aria-live="polite"
            aria-label={t(count === 1 ? '{0} curtida' : '{0} curtidas').replace(
              '{0}',
              String(count),
            )}
          >
            {count}
          </span>
        )}
      </button>

      {/* ----- Estado de carregamento ----- */}
      {count === null && (
        <span role="status">
          {loading ? t('Carregando curtidas...') : t('Curtidas indisponíveis')}
        </span>
      )}

      {/* ----- Mensagens de erro ----- */}
      {error && <p role="alert">{t(error)}</p>}

      {/* ----- Nova tentativa ----- */}
      {!loading && error && (
        <button type="button" onClick={retryLoadLikes} disabled={submitting}>
          {t('Tentar novamente')}
        </button>
      )}
    </section>
  );
}

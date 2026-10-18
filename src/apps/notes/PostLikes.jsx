
import { useEffect, useRef, useState } from 'react';
import { getVisitorId } from '../../services/visitorIdentityService';

export default function PostLikes({ postId }) {
    const [count, setCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [liked, setLiked] = useState(false);
    const [error, setError] = useState('');

    const requestIdRef = useRef(0);
    const submittingRef = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        const requestId = ++requestIdRef.current;

        async function loadLikes() {
            try {
                const visitorId = getVisitorId();

                const response = await fetch(
                    `/api/posts/likes?id=${encodeURIComponent(postId)}`,
                    {
                        signal: controller.signal,
                        cache: 'no-store',
                        headers: {
                            'X-WS-Visitor-ID': visitorId,
                        },
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao consultar curtidas.');
                }

                if (
                    !Number.isSafeInteger(data.count) ||
                    data.count < 0 ||
                    typeof data.liked !== 'boolean'
                ) {
                    throw new Error('Resposta de curtidas inválida.');
                }

                if (requestId === requestIdRef.current && !controller.signal.aborted) {
                    setCount(data.count);
                    setLiked(data.liked);
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
    }, [postId]);

    async function handleLike() {
        if (submittingRef.current || liked || loading || count === null) return;

        submittingRef.current = true;
        const requestId = requestIdRef.current;

        setSubmitting(true);
        setError('');

        try {
            const visitorId = getVisitorId();

            const response = await fetch(
                `/api/posts/likes/add?id=${encodeURIComponent(postId)}`,
                {
                    method: 'POST',
                    cache: 'no-store',
                    headers: {
                        'X-WS-Visitor-ID': visitorId,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Não foi possível registrar a curtida.');
            }

            if (
                data.success !== true ||
                !Number.isSafeInteger(data.count) ||
                data.count < 0
            ) {
                throw new Error('Resposta de curtidas inválida.');
            }

            if (requestId === requestIdRef.current) {
                setCount(data.count);
                setLiked(true);
            }
        } catch (err) {
            if (requestId === requestIdRef.current) {
                setError(err.message);
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
                {submitting
                    ? 'Registrando...'
                    : liked
                        ? 'Curtido'
                        : 'Curtir'}
            </button>

            <span aria-live="polite">
                {loading
                    ? 'Carregando curtidas...'
                    : count === null
                        ? 'Curtidas indisponíveis'
                        : `${count} ${count === 1 ? 'curtida' : 'curtidas'}`}
            </span>

            {error && <p role="alert">{error}</p>}
        </section>
    );
}

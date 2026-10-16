
import { useEffect, useState } from 'react';
import { getAdminAccessToken } from '../../services/authService';

export default function AdminPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadPosts() {
            const token = getAdminAccessToken();

            if (!token) {
                setError('Sessão administrativa indisponível.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/admin/posts', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                    signal: controller.signal,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao carregar publicações.');
                }

                if (!Array.isArray(data.posts)) {
                    throw new Error('Resposta inválida do servidor.');
                }

                setPosts(data.posts);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadPosts();

        return () => controller.abort();
    }, []);

    if (loading) return <p>Carregando publicações...</p>;
    if (error) return <p role="alert">{error}</p>;

    if (posts.length === 0) {
        return <p>Nenhuma publicação ou rascunho cadastrado.</p>;
    }

    return (
        <div className="ws-administration__posts">
            <p>{posts.length} publicação(ões) encontrada(s).</p>

            <ul>
                {posts.map((post) => (
                    <li key={post.id}>
                        <strong>
                            {typeof post.title === 'string'
                                ? post.title
                                : post.title?.['pt-BR'] ||
                                post.title?.en ||
                                post.id}
                        </strong>

                        <span>
                            {' — '}
                            {post.status === 'published'
                                ? 'Publicado'
                                : 'Rascunho'}
                        </span>

                        {post.publishedAt && (
                            <small>
                                {' — '}
                                {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                            </small>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}


import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, FileQuestion } from 'lucide-react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import './FileViewer.css';

const MIME_TYPES = {
    pdf: 'pdf',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    webp: 'image',
    gif: 'image',
    txt: 'text',
    md: 'text',
    json: 'text',
    csv: 'text',
    log: 'text',
};

function resolveDocument(rawUrl) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;

    try {
        const url = new URL(rawUrl, window.location.href);
        const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;

        if (url.origin !== window.location.origin) return null;
        if (url.username || url.password || url.search || url.hash) return null;
        if (!url.pathname.startsWith(basePath)) return null;

        const extension = url.pathname.split('.').at(-1)?.toLowerCase();
        const type = MIME_TYPES[extension];

        if (!type) return null;

        return {
            url: url.href,
            type,
            extension,
            filename: decodeURIComponent(url.pathname.split('/').at(-1)),
        };
    } catch {
        return null;
    }
}

export default function FileViewer({ instance }) {
    useLocale();

    const params = instance?.params ?? {};
    const documentUrl = typeof params.url === 'string' ? params.url : '';
    const document = useMemo(() => resolveDocument(documentUrl), [documentUrl]);
    const [result, setResult] = useState({
        url: null,
        status: 'idle',
        text: '',
    });

    useEffect(() => {
        if (!document) return;

        const controller = new AbortController();
        const documentUrl = document.url;
        const isText = document.type === 'text';

        async function load() {
            try {
                const response = await fetch(documentUrl, {
                    method: isText ? 'GET' : 'HEAD',
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error('Arquivo indisponível');

                const contentType = (
                    response.headers.get('content-type') ?? ''
                ).toLowerCase();

                const validType =
                    document.type === 'pdf'
                        ? contentType.includes('application/pdf')
                        : document.type === 'image'
                            ? contentType.startsWith('image/')
                            : contentType.startsWith('text/') ||
                            contentType.includes('application/json');

                if (!validType) throw new Error('Formato inválido');

                const text = isText ? await response.text() : '';

                if (!controller.signal.aborted) {
                    setResult({
                        url: documentUrl,
                        status: 'ready',
                        text,
                    });
                }
            } catch {
                if (!controller.signal.aborted) {
                    setResult({
                        url: documentUrl,
                        status: 'error',
                        text: '',
                    });
                }
            }
        }

        load();

        return () => controller.abort();
    }, [document]);

    const status =
        !document
            ? 'invalid'
            : result.url !== document.url
                ? 'loading'
                : result.status;

    const name =
        typeof params.name === 'string' && params.name.trim()
            ? params.name.trim()
            : document?.filename ?? t('Nenhum arquivo selecionado');

    return (
        <section className="desktop-window__content ws-file-viewer">
            <header className="ws-file-viewer__header">
                <div>
                    <h2>{t('Visualizador de Arquivos')}</h2>
                    <p>{name}</p>
                </div>

                {document && status === 'ready' && (
                    <div className="ws-file-viewer__actions">
                        <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink size={16} aria-hidden="true" />
                            {t('Abrir')}
                        </a>

                        <a href={document.url} download={document.filename}>
                            <Download size={16} aria-hidden="true" />
                            {t('Baixar')}
                        </a>
                    </div>
                )}
            </header>

            {status === 'invalid' && (
                <div className="ws-file-viewer__empty" role="status">
                    <FileQuestion size={36} aria-hidden="true" />
                    <h3>{t('Nenhum arquivo selecionado')}</h3>
                    <p>{t('Selecione um arquivo compatível para visualização.')}</p>
                </div>
            )}

            {status === 'loading' && (
                <p role="status">{t('Carregando arquivo...')}</p>
            )}

            {status === 'error' && (
                <div role="alert">
                    <h3>{t('Não foi possível abrir o arquivo')}</h3>
                    <p>{t('Verifique se o documento está disponível e em um formato compatível.')}</p>
                </div>
            )}

            {status === 'ready' && document.type === 'pdf' && (
                <iframe
                    className="ws-file-viewer__preview"
                    src={document.url}
                    title={name}
                />
            )}

            {status === 'ready' && document.type === 'image' && (
                <div className="ws-file-viewer__image-container">
                    <img src={document.url} alt={name} />
                </div>
            )}

            {status === 'ready' && document.type === 'text' && (
                <pre className="ws-file-viewer__text">
                    <code>{result.text}</code>
                </pre>
            )}
        </section>
    );
}

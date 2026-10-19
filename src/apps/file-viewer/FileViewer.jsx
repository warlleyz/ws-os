import LocalFileViewer from './LocalFileViewer';
import { FILE_LIMIT, TEXT_LIMIT } from '../../services/storage/fileModel';

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
  js: 'text',
  css: 'text',
  html: 'text',
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

async function readPreview(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) return null;
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function OfficialFileViewer({ instance }) {
  useLocale();

  const params = instance?.params ?? {};
  const documentUrl = typeof params.url === 'string' ? params.url : '';
  const document = useMemo(() => resolveDocument(documentUrl), [documentUrl]);
  const [zoom, setZoom] = useState(1);
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
    let objectUrl = null;
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function load() {
      try {
        const response = await fetch(documentUrl, {
          method: 'GET',
          redirect: 'error',
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Arquivo indisponível');

        const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

        const validType =
          document.type === 'pdf'
            ? contentType.split(';')[0].trim() === 'application/pdf'
            : document.type === 'image'
              ? ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(
                  contentType.split(';')[0].trim(),
                )
              : (contentType.startsWith('text/') &&
                  (!contentType.includes('text/html') || document.extension === 'html')) ||
                contentType.includes('application/json') ||
                (document.extension === 'js' && contentType.includes('application/javascript'));
        if (!validType) {
          await response.body?.cancel();
          throw new Error('Formato inválido');
        }
        const limit = isText ? TEXT_LIMIT : FILE_LIMIT;
        const declaredSize = Number(response.headers.get('content-length'));
        let bytes = null;
        if (Number.isFinite(declaredSize) && declaredSize > limit) await response.body?.cancel();
        else bytes = await readPreview(response, limit);
        if (controller.signal.aborted) return;
        if (bytes === null) {
          setResult({ url: documentUrl, status: 'download', text: '' });
          return;
        }
        if (document.type === 'pdf' && String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-')
          throw new Error('Formato inválido');
        const text = isText ? new TextDecoder('utf-8', { fatal: true }).decode(bytes) : '';
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: isText ? 'text/plain;charset=utf-8' : contentType }),
        );
        setResult({ url: documentUrl, status: 'ready', text, objectUrl, previewError: false });
      } catch {
        if (active) {
          setResult({
            url: documentUrl,
            status: 'error',
            text: '',
          });
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    load();

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document]);

  const status = !document ? 'invalid' : result.url !== document.url ? 'loading' : result.status;

  const name =
    typeof params.name === 'string' && params.name.trim()
      ? params.name.trim()
      : (document?.filename ?? t('Nenhum arquivo selecionado'));

  return (
    <section className="desktop-window__content ws-file-viewer">
      <header className="ws-file-viewer__header">
        <div>
          <h2>{t('Visualizador de Arquivos')}</h2>
          <p>{name}</p>
        </div>

        {document && ['ready', 'download'].includes(status) && (
          <div className="ws-file-viewer__actions">
            <a href={result.objectUrl ?? document.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} aria-hidden="true" />
              {t('Abrir')}
            </a>

            <a href={result.objectUrl ?? document.url} download={document.filename}>
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

      {status === 'loading' && <p role="status">{t('Carregando arquivo...')}</p>}

      {status === 'error' && (
        <div role="alert">
          <h3>{t('Não foi possível abrir o arquivo')}</h3>
          <p>{t('Verifique se o documento está disponível e em um formato compatível.')}</p>
        </div>
      )}

      {status === 'download' && (
        <p role="status">{t('Arquivo grande demais para prévia. Utilize o download.')}</p>
      )}
      {result.url === document?.url && result.previewError && (
        <p role="alert">{t('Não foi possível abrir o arquivo')}</p>
      )}
      {status === 'ready' && document.type === 'pdf' && (
        <>
          <p>{t('Se a prévia não aparecer, utilize o download do PDF.')}</p>
          <iframe
            className="ws-file-viewer__preview"
            src={result.objectUrl}
            title={name}
            sandbox=""
          />
        </>
      )}

      {status === 'ready' && document.type === 'image' && (
        <div className="ws-file-viewer__image-container">
          <div className="ws-file-viewer__actions">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.25, value - 0.25))}>
              {t('Reduzir')}
            </button>
            <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>
              {t('Ampliar')}
            </button>
            <button type="button" onClick={() => setZoom(1)}>
              {t('Restaurar zoom')}
            </button>
          </div>
          <img
            hidden={result.previewError}
            src={result.objectUrl}
            alt={name}
            style={{ width: zoom * 100 + '%', maxWidth: 'none' }}
            onError={() => {
              setResult((current) => ({ ...current, previewError: true }));
            }}
          />
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

export default function FileViewer({ instance }) {
  return typeof instance?.params?.fileId === 'string' ? (
    <LocalFileViewer fileId={instance.params.fileId} />
  ) : (
    <OfficialFileViewer instance={instance} />
  );
}

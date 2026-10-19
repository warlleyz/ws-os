import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, FileQuestion } from 'lucide-react';
import { FILE_LIMIT, TEXT_LIMIT } from '../../services/storage/fileModel';
import { validateFileResource } from '../../services/storage/fileResourceContract';
import { resolveStaticFile } from '../../services/storage/staticFileCatalog';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import LocalFileViewer from './LocalFileViewer';
import './FileViewer.css';

/* === Configuração dos formatos === */
/* ----- Tipos compatíveis ----- */
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

/* === Resolução de documentos === */
/* ----- Validação de URL local ----- */
function resolveDocument(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return null;
  }

  try {
    const url = new URL(rawUrl, window.location.href);
    const basePath = new URL(
      import.meta.env.BASE_URL,
      window.location.origin,
    ).pathname;

    if (url.origin !== window.location.origin) return null;
    if (url.username || url.password) return null;
    if (url.search || url.hash) return null;
    if (!url.pathname.startsWith(basePath)) return null;

    const extension = url.pathname
      .split('.')
      .at(-1)
      ?.toLowerCase();

    const type = MIME_TYPES[extension];

    if (!type) return null;

    return {
      url: url.href,
      type,
      extension,
      filename: decodeURIComponent(
        url.pathname.split('/').at(-1),
      ),
    };
  } catch {
    return null;
  }
}

/* === Leitura de arquivos === */
/* ----- Leitura limitada da resposta HTTP ----- */
async function readPreview(response, limit) {
  const reader = response.body?.getReader();

  if (!reader) {
    return new Uint8Array();
  }

  const chunks = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      size += value.byteLength;

      if (size > limit) {
        return null;
      }

      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => { });
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

/* ----- Validação do tipo recebido ----- */
function isValidContentType(document, contentType) {
  const mime = contentType.split(';')[0].trim();

  if (document.type === 'pdf') {
    return mime === 'application/pdf';
  }

  if (document.type === 'image') {
    return [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ].includes(mime);
  }

  return (
    (contentType.startsWith('text/') &&
      (mime !== 'text/html' || document.extension === 'html')) ||
    mime === 'application/json' ||
    (document.extension === 'js' &&
      mime === 'application/javascript')
  );
}

/* === Recursos não disponíveis === */
/* ----- Mensagens por origem ----- */
function UnavailableFileResource({ source }) {
  useLocale();

  const message =
    source === 'managed'
      ? 'O acesso a este arquivo depende de autorização do servidor.'
      : source === 'static'
        ? 'Este documento ainda não está disponível no catálogo oficial.'
        : 'O identificador do arquivo é inválido.';

  return (
    <section className="desktop-window__content ws-file-viewer">
      <div className="ws-file-viewer__empty" role="status">
        <FileQuestion size={36} aria-hidden="true" />

        <h2>{t('Visualizador de Arquivos')}</h2>
        <p>{t(message)}</p>
      </div>
    </section>
  );
}

/* === Visualizador de documentos oficiais === */
/* ----- Visualização de recursos por URL ----- */
function OfficialFileViewer({ instance }) {
  useLocale();

  /* ----- Parâmetros do documento ----- */
  const params = instance?.params ?? {};

  const documentUrl =
    typeof params.url === 'string' ? params.url : '';

  const document = useMemo(
    () => resolveDocument(documentUrl),
    [documentUrl],
  );

  /* ----- Estado da visualização ----- */
  const [zoom, setZoom] = useState(1);

  const [result, setResult] = useState({
    url: null,
    status: 'idle',
    text: '',
    objectUrl: null,
    size: 0,
    previewError: false,
  });

  /* ----- Carregamento do documento ----- */
  useEffect(() => {
    if (!document) return;

    const controller = new AbortController();
    const currentUrl = document.url;
    const isText = document.type === 'text';

    let active = true;
    let objectUrl = null;

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    async function load() {
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'error',
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Arquivo indisponível');
        }

        /* ----- Verificação do formato ----- */
        const contentType = (
          response.headers.get('content-type') ?? ''
        ).toLowerCase();

        if (!isValidContentType(document, contentType)) {
          await response.body?.cancel();
          throw new Error('Formato inválido');
        }

        /* ----- Limites de pré-visualização ----- */
        const limit = isText ? TEXT_LIMIT : FILE_LIMIT;

        const rawSize = response.headers.get('content-length');
        const declaredSize =
          rawSize === null ? null : Number(rawSize);

        let bytes = null;

        if (
          declaredSize !== null &&
          Number.isFinite(declaredSize) &&
          declaredSize > limit
        ) {
          await response.body?.cancel();
        } else {
          bytes = await readPreview(response, limit);
        }

        if (!active || controller.signal.aborted) return;

        if (bytes === null) {
          setResult({
            url: currentUrl,
            status: 'download',
            text: '',
            objectUrl: null,
            size: 0,
            previewError: false,
          });

          return;
        }

        /* ----- Verificação do conteúdo PDF ----- */
        if (
          document.type === 'pdf' &&
          String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-'
        ) {
          throw new Error('Formato inválido');
        }

        /* ----- Preparação da pré-visualização ----- */
        const text = isText
          ? new TextDecoder('utf-8', { fatal: true }).decode(bytes)
          : '';

        objectUrl = URL.createObjectURL(
          new Blob([bytes], {
            type: isText
              ? 'text/plain;charset=utf-8'
              : contentType,
          }),
        );

        if (!active || controller.signal.aborted) return;

        setResult({
          url: currentUrl,
          status: 'ready',
          text,
          objectUrl,
          size: bytes.length,
          previewError: false,
        });
      } catch {
        if (active) {
          setResult({
            url: currentUrl,
            status: 'error',
            text: '',
            objectUrl: null,
            size: 0,
            previewError: false,
          });
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    load();

    /* ----- Cancelamento e limpeza ----- */
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document]);

  /* ----- Resolução do estado exibido ----- */
  const status = !document
    ? 'invalid'
    : result.url !== document.url
      ? 'loading'
      : result.status;

  const name =
    typeof params.name === 'string' && params.name.trim()
      ? params.name.trim()
      : (document?.filename ?? t('Nenhum arquivo selecionado'));

  const isReady = status === 'ready';
  const canDownload = ['ready', 'download'].includes(status);

  /* ----- Interface do visualizador ----- */
  return (
    <section className="desktop-window__content ws-file-viewer">
      {/* ----- Cabeçalho e ações ----- */}
      <header className="ws-file-viewer__header">
        <div>
          <h2>{t('Visualizador de Arquivos')}</h2>
          <p>{name}</p>
        </div>

        {document && canDownload && (
          <div className="ws-file-viewer__actions">
            <a
              href={result.objectUrl ?? document.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} aria-hidden="true" />
              {t('Abrir')}
            </a>

            <a
              href={result.objectUrl ?? document.url}
              download={document.filename}
            >
              <Download size={16} aria-hidden="true" />
              {t('Baixar')}
            </a>
          </div>
        )}
      </header>

      {/* ----- Documento não selecionado ----- */}
      {status === 'invalid' && (
        <div className="ws-file-viewer__empty" role="status">
          <FileQuestion size={36} aria-hidden="true" />

          <h3>{t('Nenhum arquivo selecionado')}</h3>
          <p>
            {t('Selecione um arquivo compatível para visualização.')}
          </p>
        </div>
      )}

      {/* ----- Propriedades do documento ----- */}
      {document && isReady && (
        <details>
          <summary>{t('Propriedades do arquivo')}</summary>

          <dl>
            <dt>{t('Nome')}</dt>
            <dd>{document.filename}</dd>

            <dt>{t('Tipo')}</dt>
            <dd>{document.extension.toUpperCase()}</dd>

            <dt>{t('Tamanho')}</dt>
            <dd>{result.size} bytes</dd>

            <dt>{t('Acesso')}</dt>
            <dd>{t('Somente leitura')}</dd>
          </dl>
        </details>
      )}

      {/* ----- Carregamento ----- */}
      {status === 'loading' && (
        <p role="status">{t('Carregando arquivo...')}</p>
      )}

      {/* ----- Falha de carregamento ----- */}
      {status === 'error' && (
        <div role="alert">
          <h3>{t('Não foi possível abrir o arquivo')}</h3>
          <p>
            {t(
              'Verifique se o documento está disponível e em um formato compatível.',
            )}
          </p>
        </div>
      )}

      {/* ----- Arquivo acima do limite de prévia ----- */}
      {status === 'download' && (
        <p role="status">
          {t('Arquivo grande demais para prévia. Utilize o download.')}
        </p>
      )}

      {/* ----- Falha de apresentação ----- */}
      {result.url === document?.url && result.previewError && (
        <p role="alert">{t('Não foi possível abrir o arquivo')}</p>
      )}

      {/* ----- Pré-visualização de PDF ----- */}
      {isReady && document.type === 'pdf' && (
        <>
          <p>
            {t('Se a prévia não aparecer, utilize o download do PDF.')}
          </p>

          <iframe
            className="ws-file-viewer__preview"
            src={result.objectUrl}
            title={name}
            sandbox=""
          />
        </>
      )}

      {/* ----- Pré-visualização de imagem ----- */}
      {isReady && document.type === 'image' && (
        <div className="ws-file-viewer__image-container">
          <div className="ws-file-viewer__actions">
            <button
              type="button"
              onClick={() =>
                setZoom((value) => Math.max(0.25, value - 0.25))
              }
            >
              {t('Reduzir')}
            </button>

            <button
              type="button"
              onClick={() =>
                setZoom((value) => Math.min(3, value + 0.25))
              }
            >
              {t('Ampliar')}
            </button>

            <button
              type="button"
              onClick={() => setZoom(1)}
            >
              {t('Ajustar à janela')}
            </button>
          </div>

          <img
            hidden={result.previewError}
            src={result.objectUrl}
            alt={name}
            style={{
              width: `${zoom * 100}%`,
              maxWidth: 'none',
            }}
            onError={() => {
              setResult((current) =>
                current.url === document.url
                  ? { ...current, previewError: true }
                  : current,
              );
            }}
          />
        </div>
      )}

      {/* ----- Pré-visualização de texto ----- */}
      {isReady && document.type === 'text' && (
        <pre className="ws-file-viewer__text">
          <code>{result.text}</code>
        </pre>
      )}
    </section>
  );
}

/* === Visualizador de Arquivos === */
/* ----- Seleção da origem do recurso ----- */
export default function FileViewer({ instance }) {
  const params = instance?.params ?? {};

  /* ----- Descritores compartilhados ----- */
  if (Object.hasOwn(params, 'resource')) {
    const validation = validateFileResource(params.resource);

    if (!validation.ok) {
      return <UnavailableFileResource source="invalid" />;
    }

    const resource = validation.resource;

    if (resource.source === 'local') {
      return <LocalFileViewer fileId={resource.fileId} />;
    }

    /* ----- Documentos do catálogo oficial ----- */
    if (resource.source === 'static') {
      const resolved = resolveStaticFile(resource.catalogId);

      if (!resolved.ok) {
        return <UnavailableFileResource source="static" />;
      }

      return (
        <OfficialFileViewer
          instance={{
            ...instance,
            params: {
              url: resolved.resource.url,
              name: resolved.resource.name,
            },
          }}
        />
      );
    }

    /* ----- Recursos gerenciados pelo servidor ----- */
    return <UnavailableFileResource source={resource.source} />;
  }

  /* ----- Compatibilidade com arquivos pessoais ----- */
  if (typeof params.fileId === 'string') {
    return <LocalFileViewer fileId={params.fileId} />;
  }

  /* ----- Compatibilidade com documentos oficiais ----- */
  return <OfficialFileViewer instance={instance} />;
}
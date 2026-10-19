import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  readLocalFile,
  subscribeLocalFiles,
  localFilesRevision,
} from '../../services/storage/localFilesStorage';
import { fileKind, TEXT_LIMIT } from '../../services/storage/fileModel';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import '../../styles/apps.css';
import './FileViewer.css';

/* === Estado inicial === */
/* ----- Dados da visualização ----- */
const INITIAL_VIEW_STATE = {
  file: null,
  url: null,
  text: '',
  kind: null,
  error: '',
  previewError: false,
  key: '',
};

/* === Visualizador de arquivos locais === */
export default function LocalFileViewer({ fileId }) {
  useLocale();

  /* ----- Sincronização com IndexedDB ----- */
  const revision = useSyncExternalStore(
    subscribeLocalFiles,
    localFilesRevision,
    () => 0,
  );

  const requestKey = `${fileId}:${revision}`;

  /* ----- Estado da interface ----- */
  const [zoom, setZoom] = useState(1);
  const [state, setState] = useState(INITIAL_VIEW_STATE);

  /* === Carregamento do arquivo === */
  /* ----- Leitura e preparação da prévia ----- */
  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function loadFile() {
      try {
        const file = await readLocalFile(fileId);
        const kind = fileKind(file.name);

        const text =
          kind === 'text' && file.blob.size <= TEXT_LIMIT
            ? await file.blob.text()
            : '';

        if (!active) return;

        objectUrl = URL.createObjectURL(file.blob);

        setState({
          file,
          url: objectUrl,
          text,
          kind,
          error: '',
          previewError: false,
          key: requestKey,
        });
      } catch (error) {
        if (!active) return;

        setState({
          ...INITIAL_VIEW_STATE,
          error:
            typeof error?.message === 'string' && error.message.trim()
              ? error.message
              : 'Não foi possível abrir o arquivo',
          key: requestKey,
        });
      }
    }

    loadFile();

    /* ----- Limpeza dos recursos temporários ----- */
    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId, revision, requestKey]);

  /* === Estado de apresentação === */
  /* ----- Carregamento e disponibilidade ----- */
  const isLoading = state.key !== requestKey || (!state.file && !state.error);
  const isReady = !isLoading && !state.error && Boolean(state.file);

  /* ----- Características da prévia ----- */
  const file = isReady ? state.file : null;
  const canPreviewText = state.kind === 'text' && file?.blob.size <= TEXT_LIMIT;
  const textTooLarge = state.kind === 'text' && file?.blob.size > TEXT_LIMIT;

  /* === Interface do visualizador === */
  return (
    <article className="desktop-window__content ws-app ws-file-viewer">
      {/* ----- Cabeçalho ----- */}
      <h2>{t('Visualizador de Arquivos')}</h2>

      {/* ----- Carregamento ----- */}
      {isLoading && (
        <p role="status">{t('Carregando')}</p>
      )}

      {/* ----- Erro de leitura ----- */}
      {!isLoading && state.error && (
        <p role="alert">{t(state.error)}</p>
      )}

      {/* ----- Conteúdo disponível ----- */}
      {file && (
        <>
          <h3>{file.name}</h3>

          {/* ----- Propriedades do arquivo ----- */}
          <details>
            <summary>{t('Propriedades do arquivo')}</summary>

            <dl>
              <dt>{t('Tipo')}</dt>
              <dd>{file.blob.type || t('Desconhecido')}</dd>

              <dt>{t('Tamanho')}</dt>
              <dd>{file.blob.size} bytes</dd>

              <dt>{t('Modificado')}</dt>
              <dd>
                {new Date(file.updatedAt).toLocaleString()}
              </dd>
            </dl>
          </details>

          {/* ----- Download ----- */}
          <p>
            <a href={state.url} download={file.name}>
              {t('Baixar arquivo')}
            </a>
          </p>

          {/* ----- Arquivos de texto ----- */}
          {canPreviewText && (
            <pre className="ws-file-viewer__text">
              <code>{state.text}</code>
            </pre>
          )}

          {textTooLarge && (
            <p role="status">
              {t('Texto grande demais para prévia. Utilize o download.')}
            </p>
          )}

          {/* ----- Erros de pré-visualização ----- */}
          {state.previewError && (
            <p role="alert">
              {t('Não foi possível abrir o arquivo')}
            </p>
          )}

          {/* ----- Arquivos de imagem ----- */}
          {state.kind === 'image' && (
            <div className="ws-file-viewer__image-container">
              {/* ----- Controles de zoom ----- */}
              <div className="ws-app__toolbar ws-file-viewer__actions">
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

                <span>{Math.round(zoom * 100)}%</span>
              </div>

              {/* ----- Pré-visualização da imagem ----- */}
              <div className="ws-file-viewer__image-viewport">
                <img
                  className="ws-app__cover"
                  src={state.url}
                  alt={file.name}
                  hidden={state.previewError}
                  style={{
                    width: `${zoom * 100}%`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  onError={() => {
                    setState((current) =>
                      current.url === state.url
                        ? { ...current, previewError: true }
                        : current,
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* ----- Arquivos PDF ----- */}
          {state.kind === 'pdf' && (
            <>
              <p>
                {t('Se a prévia não aparecer, utilize o download do PDF.')}
              </p>

              <iframe
                className="ws-app__demo"
                title={file.name}
                src={state.url}
                sandbox=""
              />
            </>
          )}
        </>
      )}
    </article>
  );
}
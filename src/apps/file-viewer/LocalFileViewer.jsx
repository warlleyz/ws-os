import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  readLocalFile,
  subscribeLocalFiles,
  localFilesRevision,
} from '../../services/storage/localFilesStorage';
import { fileKind, TEXT_LIMIT } from '../../services/storage/fileModel';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import '../../styles/apps.css';
export default function LocalFileViewer({ fileId }) {
  useLocale();
  const [zoom, setZoom] = useState(1);
  const revision = useSyncExternalStore(subscribeLocalFiles, localFilesRevision, () => 0);
  const [state, setState] = useState({ file: null, url: null, text: '', error: '' });
  useEffect(() => {
    let active = true,
      url = null;
    readLocalFile(fileId)
      .then(async (file) => {
        const kind = fileKind(file.name);
        url = URL.createObjectURL(file.blob);
        const text = kind === 'text' && file.blob.size <= TEXT_LIMIT ? await file.blob.text() : '';
        if (active) setState({ file, url, text, kind, error: '' });
        else URL.revokeObjectURL(url);
      })
      .catch((error) => {
        if (active) setState({ file: null, url: null, text: '', error: error.message });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileId, revision]);
  return (
    <article className="desktop-window__content ws-app">
      <h2>{t('Visualizador de Arquivos')}</h2>
      {state.error ? (
        <p role="status">{t(state.error)}</p>
      ) : !state.file ? (
        <p role="status">{t('Carregando')}</p>
      ) : (
        <>
          <h3>{state.file.name}</h3>
          <p>{state.file.blob.size} bytes</p>
          <p>
            <a href={state.url} download={state.file.name}>
              {t('Baixar arquivo')}
            </a>
          </p>
          {state.kind === 'text' &&
            (state.file.blob.size > TEXT_LIMIT ? (
              <p>{t('Texto grande demais para prévia. Utilize o download.')}</p>
            ) : (
              <pre>{state.text}</pre>
            ))}
          {state.kind === 'image' && (
            <>
              <div className="ws-app__toolbar">
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.max(0.25, value - 0.25))}
                >
                  {t('Reduzir')}
                </button>
                <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>
                  {t('Ampliar')}
                </button>
                <button type="button" onClick={() => setZoom(1)}>
                  {t('Restaurar zoom')}
                </button>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <div style={{ overflow: 'auto', maxHeight: '60dvh' }}>
                <img
                  className="ws-app__cover"
                  style={{ width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none' }}
                  src={state.url}
                  alt={state.file.name}
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </div>
            </>
          )}
          {state.kind === 'pdf' && (
            <>
              <p>{t('Se a prévia não aparecer, utilize o download do PDF.')}</p>
              <iframe className="ws-app__demo" title={state.file.name} src={state.url} sandbox="" />
            </>
          )}
        </>
      )}
    </article>
  );
}

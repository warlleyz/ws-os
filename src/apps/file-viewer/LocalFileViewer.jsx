import { useEffect, useState, useSyncExternalStore } from 'react';
import { readLocalFile, subscribeLocalFiles, localFilesRevision } from '../../services/storage/localFilesStorage';
import { fileKind, TEXT_LIMIT } from '../../services/storage/fileModel';
import DocumentView from './DocumentView';
import './FileViewer.css';

/* === Arquivos pessoais do IndexedDB === */
/* ----- Leitura, sincronização e descarte seguro de URLs ----- */
export default function LocalFileViewer({ fileId }) {
  const revision = useSyncExternalStore(subscribeLocalFiles, localFilesRevision, () => 0);
  const requestKey = `${fileId}:${revision}`;
  const [state, setState] = useState({ key: '', file: null, url: '', kind: '', text: '', error: '', previewError: false });

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    async function load() {
      try {
        const file = await readLocalFile(fileId);
        if (!active) return;
        const kind = fileKind(file.name);
        const text = kind === 'text' && file.blob.size <= TEXT_LIMIT ? await file.blob.text() : '';
        if (!active) return;
        objectUrl = URL.createObjectURL(file.blob);
        setState({ key: requestKey, file, url: objectUrl, kind, text, error: '', previewError: false });
      } catch (error) {
        if (active) setState({ key: requestKey, file: null, url: '', kind: '', text: '', error: error?.message || 'Não foi possível abrir o arquivo.', previewError: false });
      }
    }
    load();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [fileId, requestKey]);

  const loading = state.key !== requestKey;
  const file = loading ? null : state.file;
  const previewError = state.kind === 'text' && file?.blob.size > TEXT_LIMIT ? 'Texto grande demais para prévia. Utilize o download.' : state.error;
  return (
    <DocumentView
      name={file?.name || ''}
      origin="Arquivo pessoal"
      kind={state.kind}
      blob={file?.blob}
      url={file ? state.url : ''}
      text={state.text}
      size={file?.blob.size}
      mimeType={file?.blob.type}
      updatedAt={file?.updatedAt}
      revision={file?.revision}
      loading={loading}
      error={previewError}
      previewError={state.previewError}
      onImageError={() => setState((current) => current.key === requestKey ? { ...current, previewError: true } : current)}
    />
  );
}

import { useEffect, useMemo, useState } from 'react';
import { FILE_LIMIT, TEXT_LIMIT } from '../../services/storage/fileModel';
import { validateFileResource } from '../../services/storage/fileResourceContract';
import { resolveStaticFile } from '../../services/storage/staticFileCatalog';
import { publicAssetUrl } from '../../shared/utils/urls';
import LocalFileViewer from './LocalFileViewer';
import DocumentView from './DocumentView';
import './FileViewer.css';

/* === Tipos de documentos para pré-visualização === */
const TYPES = {
  pdf: 'pdf', png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', gif: 'image',
  txt: 'text', md: 'text', json: 'text', csv: 'text', log: 'text', js: 'text', css: 'text', html: 'text',
};

/* ----- Resolução de URL restrita ao próprio domínio ----- */
function resolveDocument(rawUrl, suppliedName = '') {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
  try {
    const url = new URL(rawUrl, window.location.href);
    const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
    if (url.origin !== window.location.origin || url.username || url.password || url.hash) return null;
    const managed = url.pathname === '/api/files' && url.searchParams.size === 1 &&
      url.searchParams.has('id') && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$/.test(url.searchParams.get('id') ?? '');
    if (!managed && (url.search || !url.pathname.startsWith(basePath))) return null;
    const filename = managed ? suppliedName : decodeURIComponent(url.pathname.split('/').at(-1));
    const extension = filename.split('.').at(-1)?.toLowerCase();
    const kind = TYPES[extension];
    return kind ? { url: url.href, filename, kind, extension, managed } : null;
  } catch { return null; }
}

/* ----- Tipo de conteúdo esperado pelo arquivo ----- */
function validMime(document, contentType) {
  const mime = contentType.split(';')[0].trim().toLowerCase();
  if (document.kind === 'pdf') return mime === 'application/pdf';
  if (document.kind === 'image') return ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mime);
  return mime === 'application/json' || mime === 'application/javascript' ||
    (mime.startsWith('text/') && (mime !== 'text/html' || document.extension === 'html'));
}

/* ----- Leitura limitada para não carregar arquivos arbitrariamente grandes ----- */
async function readBounded(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Resposta de arquivo sem conteúdo.');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) return null;
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
  return output;
}

/* === Visualizador oficial === */
/* ----- Carregamento por URL pública validada ----- */
function OfficialFileViewer({ instance }) {
  const params = instance?.params ?? {};
  const rawUrl = typeof params.url === 'string' ? params.url : '';
  const document = useMemo(() => resolveDocument(rawUrl, params.name), [rawUrl, params.name]);
  const [result, setResult] = useState({ key: '', blob: null, url: '', text: '', error: '', loading: true, size: null, mime: '', previewError: false });
  const key = document?.url ?? '';

  useEffect(() => {
    if (!document) return undefined;
    const controller = new AbortController();
    let active = true;
    let objectUrl = '';
    const timeout = setTimeout(() => controller.abort(), 15000);
    async function load() {
      try {
        const response = await fetch(document.url, { method: 'GET', redirect: 'error', credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Arquivo não disponível.');
        const mime = response.headers.get('content-type') ?? '';
        if (!validMime(document, mime)) throw new Error('O servidor retornou um formato incompatível.');
        const limit = document.kind === 'text' ? TEXT_LIMIT : FILE_LIMIT;
        const declared = response.headers.get('content-length');
        const declaredSize = declared === null ? null : Number(declared);
        const bytes = declaredSize !== null && Number.isFinite(declaredSize) && declaredSize > limit ? null : await readBounded(response, limit);
        if (!active || controller.signal.aborted) return;
        if (!bytes) {
          setResult({ key, blob: null, url: document.url, text: '', error: 'Arquivo grande demais para pré-visualização. Utilize o download.', loading: false, size: declaredSize, mime, previewError: false });
          return;
        }
        if (document.kind === 'pdf' && String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new Error('Assinatura de PDF inválida.');
        const text = document.kind === 'text' ? new TextDecoder('utf-8', { fatal: true }).decode(bytes) : '';
        const blob = new Blob([bytes], { type: document.kind === 'text' ? 'text/plain;charset=utf-8' : mime });
        objectUrl = URL.createObjectURL(blob);
        if (!active || controller.signal.aborted) return;
        setResult({ key, blob, url: objectUrl, text, error: '', loading: false, size: bytes.length, mime, previewError: false });
      } catch (error) {
        if (active) setResult({ key, blob: null, url: '', text: '', error: controller.signal.aborted ? 'Tempo de carregamento esgotado.' : (error?.message || 'Não foi possível abrir o arquivo.'), loading: false, size: null, mime: '', previewError: false });
      } finally { clearTimeout(timeout); }
    }
    load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [document, key]);

  const loading = Boolean(document && result.key !== key);
  return (
    <DocumentView
      name={document?.filename ?? ''}
      origin="Arquivo oficial"
      kind={document?.kind}
      blob={loading ? null : result.blob}
      url={loading ? '' : result.url}
      text={result.text}
      size={result.size}
      mimeType={result.mime}
      loading={loading}
      error={!document ? 'Nenhum documento compatível foi selecionado.' : result.error}
      previewError={result.previewError}
      onImageError={() => setResult((previous) => previous.key === key ? { ...previous, previewError: true } : previous)}
    />
  );
}

/* === Arquivos públicos gerenciados === */
/* ----- Metadados devem vir exclusivamente do catálogo público ----- */
function ManagedFileViewer({ instance, resourceId }) {
  const [state, setState] = useState({ resourceId: null, name: '', error: '' });
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/files', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!response.ok) throw new Error('Catálogo público indisponível.');
        const payload = await response.json();
        if (!Array.isArray(payload.items)) throw new Error('Catálogo inválido.');
        const file = payload.items.find((item) => item?.resourceId === resourceId && item.visibility === 'public' && item.state === 'available');
        if (!file || typeof file.name !== 'string' || !TYPES[file.name.split('.').at(-1)?.toLowerCase()]) throw new Error('Arquivo indisponível ou incompatível.');
        if (!controller.signal.aborted) setState({ resourceId, name: file.name, error: '' });
      } catch (error) { if (!controller.signal.aborted) setState({ resourceId, name: '', error: error.message }); }
    }
    load();
    return () => controller.abort();
  }, [resourceId]);
  if (state.resourceId !== resourceId) return <DocumentView origin="Arquivo oficial" loading />;
  if (state.error) return <DocumentView origin="Arquivo oficial" error={state.error} />;
  return <OfficialFileViewer instance={{ ...instance, params: { name: state.name, url: `/api/files?id=${encodeURIComponent(resourceId)}` } }} />;
}

/* === Recursos não disponíveis === */
/* ----- Compatibilidade com o contrato de erros ----- */
function UnavailableFileResource({ source }) {
  return <DocumentView origin="Arquivo" error={source === 'static' ? 'Documento não encontrado no catálogo.' : 'Identificador de arquivo inválido.'} />;
}

/* === Roteamento de origens === */
export default function FileViewer({ instance }) {
  const params = instance?.params ?? {};
  if (Object.hasOwn(params, 'resource')) {
    const validation = validateFileResource(params.resource);
    if (!validation.ok) return <UnavailableFileResource source="invalid" />;
    const resource = validation.resource;
    if (resource.source === 'local') return <LocalFileViewer fileId={resource.fileId} />;
    if (resource.source === 'managed') return <ManagedFileViewer instance={instance} resourceId={resource.resourceId} />;
    if (resource.source === 'static') {
      const staticFile = resolveStaticFile(resource.catalogId);
      if (!staticFile.ok) return <UnavailableFileResource source="static" />;
      return <OfficialFileViewer instance={{ ...instance, params: { name: staticFile.resource.name, url: staticFile.resource.url } }} />;
    }
    return <UnavailableFileResource source="invalid" />;
  }
  if (typeof params.fileId === 'string') return <LocalFileViewer fileId={params.fileId} />;
  return <OfficialFileViewer instance={{ ...instance, params: { ...params, url: typeof params.url === 'string' ? publicAssetUrl(params.url) || params.url : '' } }} />;
}

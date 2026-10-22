import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCw, Search } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

/* === Pré-visualização de PDF === */
/* ----- Abertura de documento PDF em memória ----- */
export default function PdfPreview({ blob, name }) {
  useLocale();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [result, setResult] = useState({ blob: null, document: null, error: '' });
  const document = result.blob === blob ? result.document : null;
  const loading = Boolean(blob && result.blob !== blob);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [renderError, setRenderError] = useState(null);
  const error =
    result.blob === blob
      ? result.error ||
        (renderError?.document === document &&
        renderError.pageNumber === pageNumber &&
        renderError.scale === scale &&
        renderError.rotation === rotation
          ? renderError.message
          : '')
      : '';
  const fitRequest = useRef({ version: 0 });
  useEffect(() => {
    const request = fitRequest.current;
    return () => {
      request.version++;
    };
  }, [document, pageNumber, rotation]);

  useEffect(() => {
    if (!blob) return undefined;
    let active = true;
    let task;

    async function load() {
      try {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (!active) return;
        task = pdfjs.getDocument({ data: bytes, isEvalSupported: false });
        const loaded = await task.promise;
        if (active) {
          setPageNumber(1);
          setScale(1);
          setRotation(0);
          setQuery('');
          setMatches([]);
          setResult({ blob, document: loaded, error: '' });
        }
      } catch {
        if (active)
          setResult({ blob, document: null, error: 'Não foi possível interpretar este PDF.' });
      }
    }
    load();
    return () => {
      active = false;
      task?.destroy().catch(() => {});
    };
  }, [blob]);

  /* ----- Renderização e descarte da página ----- */
  useEffect(() => {
    if (!document || !canvasRef.current) return undefined;
    let active = true;
    let renderTask;
    async function render() {
      try {
        const page = await document.getPage(pageNumber);
        if (!active) return;
        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d', { alpha: false });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * pixelRatio);
        canvas.height = Math.ceil(viewport.height * pixelRatio);
        canvas.style.width = `${Math.ceil(viewport.width)}px`;
        canvas.style.height = `${Math.ceil(viewport.height)}px`;
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
      } catch (reason) {
        if (active && reason?.name !== 'RenderingCancelledException') {
          setRenderError({
            document,
            pageNumber,
            scale,
            rotation,
            message: 'Falha ao desenhar a página do PDF.',
          });
        }
      }
    }
    render();
    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, pageNumber, scale, rotation]);

  /* ----- Pesquisa textual por páginas ----- */
  useEffect(() => {
    if (!document || !query.trim()) {
      return undefined;
    }
    let active = true;
    const term = query.trim().toLocaleLowerCase();
    async function search() {
      const found = [];
      for (let pageIndex = 1; active && pageIndex <= document.numPages; pageIndex++) {
        const page = await document.getPage(pageIndex);
        if (!active) return;
        const content = await page.getTextContent();
        if (!active) return;
        if (
          content.items
            .map((item) => item.str || '')
            .join(' ')
            .toLocaleLowerCase()
            .includes(term)
        )
          found.push(pageIndex);
      }
      if (active) setMatches(found);
    }
    search().catch(() => {
      if (active) setMatches([]);
    });
    return () => {
      active = false;
    };
  }, [document, query]);

  function fitWidth() {
    if (!document || !containerRef.current) return;
    const request = ++fitRequest.current.version;
    document
      .getPage(pageNumber)
      .then((page) => {
        if (request !== fitRequest.current.version) return;
        const original = page.getViewport({ scale: 1, rotation });
        const available = containerRef.current?.clientWidth ?? 0;
        if (available > 32)
          setScale(Math.min(3, Math.max(0.25, (available - 32) / original.width)));
      })
      .catch(() => {});
  }

  return (
    <section className="ws-file-viewer__pdf" aria-label={`PDF: ${name}`}>
      <div className="ws-file-viewer__pdf-tools" role="toolbar" aria-label={t('Controles do PDF')}>
        <button
          type="button"
          aria-label={t('Página anterior')}
          title={t('Página anterior')}
          disabled={!document || pageNumber === 1}
          onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
        >
          <ChevronLeft size={17} />
        </button>
        <span className="ws-file-viewer__page-count">
          {pageNumber} / {document?.numPages ?? '—'}
        </span>
        <button
          type="button"
          aria-label={t('Próxima página')}
          title={t('Próxima página')}
          disabled={!document || pageNumber >= document.numPages}
          onClick={() => setPageNumber((page) => Math.min(document.numPages, page + 1))}
        >
          <ChevronRight size={17} />
        </button>
        <span className="ws-file-viewer__tool-divider" aria-hidden="true" />
        <button
          type="button"
          aria-label={t('Reduzir zoom')}
          title={t('Reduzir zoom')}
          disabled={!document || scale <= 0.25}
          onClick={() => setScale((value) => Math.max(0.25, +(value - 0.25).toFixed(2)))}
        >
          <Minus size={17} />
        </button>
        <span className="ws-file-viewer__zoom-value">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          aria-label={t('Aumentar zoom')}
          title={t('Aumentar zoom')}
          disabled={!document || scale >= 3}
          onClick={() => setScale((value) => Math.min(3, +(value + 0.25).toFixed(2)))}
        >
          <Plus size={17} />
        </button>
        <button type="button" disabled={!document} onClick={fitWidth}>
          {t('Ajustar largura')}
        </button>
        <button
          type="button"
          aria-label={t('Girar página')}
          title={t('Girar página')}
          disabled={!document}
          onClick={() => setRotation((value) => (value + 90) % 360)}
        >
          <RotateCw size={17} />
        </button>

        {/* ----- Pesquisa e navegação pelos resultados ----- */}
        <div className="ws-file-viewer__search-group">
          <label className="ws-file-viewer__pdf-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label={t('Pesquisar no PDF')}
              placeholder={t('Buscar no PDF')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setMatches([]);
              }}
            />
          </label>

          {query.trim() && (
            <span className="ws-file-viewer__search-count" role="status">
              {t('{0} pág.').replace('{0}', matches.length)}
            </span>
          )}

          {matches.length > 0 && (
            <button
              type="button"
              className="ws-file-viewer__search-action"
              onClick={() => setPageNumber(matches[0])}
            >
              {t('Ir ao resultado')}
            </button>
          )}
        </div>
      </div>
      <div className="ws-file-viewer__pdf-viewport" ref={containerRef}>
        {loading && <p role="status">{t('Carregando PDF...')}</p>}
        {error && <p role="alert">{t(error)}</p>}
        <canvas
          ref={canvasRef}
          aria-label={t('Página {0} de {1}')
            .replace('{0}', pageNumber)
            .replace('{1}', document?.numPages ?? 0)}
          hidden={!document || Boolean(error)}
        />
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCw, Search } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { PDFLinkService, EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

/* === Utilitários do PDF === */
/* ----- Limites de zoom e normalização da pesquisa ----- */
const MIN_ZOOM = 25;
const MAX_ZOOM = 300;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

function matchesOnPage(content, term, pageNumber) {
  const text = normalizeText(
    content.items.map((item) => `${item.str || ''}${item.hasEOL ? ' ' : ''}`).join(''),
  );
  const found = [];
  let start = 0;

  while (term && start < text.length) {
    const index = text.indexOf(term, start);
    if (index === -1) break;
    found.push({ pageNumber, start: index, length: term.length });
    start = index + Math.max(1, term.length);
  }

  return found;
}

/* === Pré-visualização de PDF === */
export default function PdfPreview({ blob, name }) {
  const locale = useLocale();

  /* ----- Referências do documento e das camadas ----- */
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const textRef = useRef(null);
  const annotationRef = useRef(null);
  const containerRef = useRef(null);
  const linkServiceRef = useRef(null);
  const fitRequestRef = useRef(0);
  const searchRequestRef = useRef(0);
  const currentPageRef = useRef(1);
  const skipZoomBlurRef = useRef(false);

  /* ----- Documento e navegação ----- */
  const [result, setResult] = useState({ blob: null, document: null, error: '' });
  const document = result.blob === blob ? result.document : null;
  const loading = Boolean(blob && result.blob !== blob);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [renderError, setRenderError] = useState(null);

  /* ----- Zoom editável ----- */
  const [zoomInput, setZoomInput] = useState('100');
  const [editingZoom, setEditingZoom] = useState(false);
  const zoomInputRef = useRef(null);

  /* ----- Pesquisa de texto ----- */
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [matchIndex, setMatchIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [renderRevision, setRenderRevision] = useState(0);

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

  /* === Carregamento e descarte do documento === */
  useEffect(() => {
    if (!blob) return undefined;
    let active = true;
    let task;

    async function load() {
      try {
        const data = new Uint8Array(await blob.arrayBuffer());
        if (!active) return;
        task = pdfjs.getDocument({ data, isEvalSupported: false });
        const loaded = await task.promise;
        if (!active) return;

        setPageNumber(1);
        setScale(1);
        setRotation(0);
        setZoomInput('100');
        setEditingZoom(false);
        setQuery('');
        setMatches([]);
        setMatchIndex(-1);
        setRenderError(null);
        setResult({ blob, document: loaded, error: '' });
      } catch {
        if (active) {
          setResult({ blob, document: null, error: 'Não foi possível interpretar este PDF.' });
        }
      }
    }

    load();
    return () => {
      active = false;
      task?.destroy().catch(() => {});
    };
  }, [blob]);

  /* ----- Serviço de navegação dos links internos ----- */
  useEffect(() => {
    if (!document) {
      linkServiceRef.current = null;
      return undefined;
    }

    const service = new PDFLinkService({
      eventBus: new EventBus(),
      externalLinkTarget: 2,
      externalLinkRel: 'noopener noreferrer',
    });
    service.setDocument(document);
    service.setViewer({
      scrollPageIntoView({ pageNumber: target }) {
        if (Number.isInteger(target) && target >= 1 && target <= document.numPages) {
          setPageNumber(target);
        }
      },
      get currentPageNumber() {
        return currentPageRef.current;
      },
      set currentPageNumber(target) {
        if (Number.isInteger(target) && target >= 1 && target <= document.numPages) {
          setPageNumber(target);
        }
      },
      get pagesCount() {
        return document.numPages;
      },
      isPageVisible() {
        return true;
      },
    });
    linkServiceRef.current = service;
    return () => {
      if (linkServiceRef.current === service) linkServiceRef.current = null;
    };
  }, [document]);

  /* ----- Referência atualizada para destinos internos ----- */
  useEffect(() => {
    currentPageRef.current = pageNumber;
  }, [pageNumber]);

  /* === Zoom === */
  /* ----- O indicador usa a escala real quando não está em edição ----- */
  function commitZoom() {
    const value = Number(zoomInput.replace('%', '').replace(',', '.').trim());
    if (zoomInput.trim() && Number.isFinite(value)) {
      const next = clampZoom(value);
      setScale(next / 100);
      setZoomInput(String(next));
    } else {
      setZoomInput(String(Math.round(scale * 100)));
    }
    setEditingZoom(false);
  }

  function cancelZoom() {
    setZoomInput(String(Math.round(scale * 100)));
    setEditingZoom(false);
    skipZoomBlurRef.current = true;
  }

  function fitWidth() {
    if (!document || !containerRef.current) return;
    const request = ++fitRequestRef.current;
    document
      .getPage(pageNumber)
      .then((page) => {
        if (request !== fitRequestRef.current) return;
        const original = page.getViewport({ scale: 1, rotation });
        const available = containerRef.current?.clientWidth ?? 0;
        if (available > 32) setScale(clampZoom(((available - 32) / original.width) * 100) / 100);
      })
      .catch(() => {});
  }

  /* ----- Invalidação do ajuste à largura ao mudar a página ----- */
  useEffect(() => {
    fitRequestRef.current += 1;
  }, [document, pageNumber, rotation]);

  /* === Pesquisa em todas as páginas === */
  useEffect(() => {
    const request = ++searchRequestRef.current;
    const term = normalizeText(query.trim());
    if (!document || !term) return undefined;

    async function search() {
      const found = [];
      for (let number = 1; number <= document.numPages; number += 1) {
        if (request !== searchRequestRef.current) return;
        const page = await document.getPage(number);
        if (request !== searchRequestRef.current) return;
        const content = await page.getTextContent();
        if (request !== searchRequestRef.current) return;
        found.push(...matchesOnPage(content, term, number));
      }
      if (request === searchRequestRef.current) {
        setMatches(found);
        setMatchIndex(found.length ? 0 : -1);
        if (found.length) setPageNumber(found[0].pageNumber);
        setSearching(false);
      }
    }

    search().catch(() => {
      if (request === searchRequestRef.current) {
        setMatches([]);
        setMatchIndex(-1);
        setSearching(false);
      }
    });
    return () => {
      searchRequestRef.current += 1;
    };
  }, [document, query]);

  function changeQuery(value) {
    setQuery(value);
    setMatches([]);
    setMatchIndex(-1);
    setSearching(Boolean(value.trim()));
  }

  function goToMatch(direction) {
    if (!matches.length) return;
    const nextIndex = (matchIndex + direction + matches.length) % matches.length;
    setMatchIndex(nextIndex);
    setPageNumber(matches[nextIndex].pageNumber);
  }

  /* === Renderização sincronizada das três camadas === */
  useEffect(() => {
    if (!document || !canvasRef.current || !pageRef.current) return undefined;
    let active = true;
    let renderTask;
    let textLayer;
    const canvas = canvasRef.current;
    const pageElement = pageRef.current;
    const textContainer = textRef.current;
    const annotationContainer = annotationRef.current;

    async function render() {
      try {
        const page = await document.getPage(pageNumber);
        if (!active) return;
        const viewport = page.getViewport({ scale, rotation });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        pageElement.style.width = `${viewport.width}px`;
        pageElement.style.height = `${viewport.height}px`;
        pageElement.style.setProperty('--scale-factor', String(scale));
        canvas.width = Math.ceil(viewport.width * pixelRatio);
        canvas.height = Math.ceil(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        textContainer.replaceChildren();
        annotationContainer.replaceChildren();
        textContainer.style.setProperty('--scale-factor', String(scale));
        annotationContainer.style.setProperty('--scale-factor', String(scale));

        const context = canvas.getContext('2d', { alpha: false });
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
        if (!active) return;

        /* ----- Camada de texto: falhas não bloqueiam o canvas ----- */
        try {
          const content = await page.getTextContent();
          if (!active) return;
          textLayer = new pdfjs.TextLayer({
            container: textContainer,
            textContentSource: content,
            viewport,
          });
          await textLayer.render();
        } catch (layerError) {
          if (!active) return;
          console.error('[WS Files] Falha na camada de texto do PDF:', layerError);
          textContainer.replaceChildren();
        }

        /* ----- Links posicionados pelas coordenadas reais do PDF ----- */
        try {
          const annotations = await page.getAnnotations();
          if (!active) return;
          const linkService = linkServiceRef.current;

          for (const annotation of annotations) {
            if (annotation.subtype !== 'Link' || !Array.isArray(annotation.rect)) continue;
            /* ----- Coordenadas do link convertidas pela matriz do viewport ----- */
            const [a, b, c, d, e, f] = viewport.transform;
            const [pdfX1, pdfY1, pdfX2, pdfY2] = annotation.rect;
            const x1 = a * pdfX1 + c * pdfY1 + e;
            const y1 = b * pdfX1 + d * pdfY1 + f;
            const x2 = a * pdfX2 + c * pdfY2 + e;
            const y2 = b * pdfX2 + d * pdfY2 + f;
            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);
            if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0)
              continue;

            const anchor = window.document.createElement('a');
            anchor.className = 'ws-file-viewer__annotation-link';
            anchor.style.left = `${left}px`;
            anchor.style.top = `${top}px`;
            anchor.style.width = `${width}px`;
            anchor.style.height = `${height}px`;
            anchor.setAttribute('aria-label', t('Abrir link do PDF'));

            if (annotation.url) {
              let safeUrl;
              try {
                const parsed = new URL(annotation.url);
                if (
                  parsed.protocol === 'https:' ||
                  parsed.protocol === 'http:' ||
                  parsed.protocol === 'mailto:'
                ) {
                  safeUrl = parsed.href;
                }
              } catch {
                /* URL não suportada */
              }
              if (!safeUrl) continue;
              anchor.href = safeUrl;
              anchor.target = '_blank';
              anchor.rel = 'noopener noreferrer';
            } else if (annotation.dest && linkService) {
              anchor.href = '#';
              anchor.addEventListener('click', (event) => {
                event.preventDefault();
                linkService.navigateTo(annotation.dest).catch((reason) => {
                  console.error('[WS Files] Falha na navegação interna do PDF:', reason);
                });
              });
            } else {
              continue;
            }
            annotationContainer.append(anchor);
          }
        } catch (layerError) {
          if (!active) return;
          console.error('[WS Files] Falha na camada de links do PDF:', layerError);
          annotationContainer.replaceChildren();
        }
        if (active) setRenderRevision((revision) => revision + 1);
      } catch (reason) {
        if (active && reason?.name !== 'RenderingCancelledException') {
          console.error('[WS Files] Falha ao desenhar canvas do PDF:', reason);
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
      textLayer?.cancel();
      textContainer.replaceChildren();
      annotationContainer.replaceChildren();
    };
  }, [document, pageNumber, scale, rotation]);

  /* ----- Atualização dos rótulos sem redesenhar a página ----- */
  useEffect(() => {
    const anchors = annotationRef.current?.querySelectorAll?.('a') ?? [];
    for (const anchor of anchors) {
      anchor.setAttribute('aria-label', t('Abrir link do PDF'));
    }
  }, [locale, renderRevision]);

  /* ----- Destaque visual dos fragmentos encontrados ----- */
  useEffect(() => {
    const layer = textRef.current;
    if (!layer) return;
    const spans =
      typeof layer.querySelectorAll === 'function'
        ? Array.from(layer.querySelectorAll('span'))
        : [];
    for (const span of spans) span.classList.remove('ws-file-viewer__pdf-match', 'is-active');
    if (!query.trim() || !matches.length) return;

    const term = normalizeText(query.trim());
    const pageMatches = matches.filter((match) => match.pageNumber === pageNumber);
    if (!pageMatches.length) return;

    let offset = 0;
    const sections = spans.map((span) => {
      const value = normalizeText(span.textContent || '');
      const section = { span, start: offset, end: offset + value.length };
      offset += value.length;
      return section;
    });

    // Marca os fragmentos onde existem ocorrências, sem alterar o DOM do PDF.js.
    // Mantém a seleção de texto funcional mesmo para frases divididas em spans.
    const current = matches[matchIndex];
    for (const match of pageMatches) {
      const end = match.start + term.length;
      for (const section of sections) {
        if (section.start < end && section.end > match.start) {
          section.span.classList.add('ws-file-viewer__pdf-match');
          if (match === current) section.span.classList.add('is-active');
        }
      }
    }
    const selected =
      typeof layer.querySelector === 'function'
        ? layer.querySelector('.ws-file-viewer__pdf-match.is-active')
        : null;
    if (selected) selected.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, [query, matches, matchIndex, pageNumber, renderRevision]);

  return (
    <section className="ws-file-viewer__pdf" aria-label={`PDF: ${name}`}>
      {/* === Ferramentas de navegação e zoom === */}
      <div className="ws-file-viewer__pdf-tools" role="toolbar" aria-label={t('Controles do PDF')}>
        <button
          type="button"
          aria-label={t('Página anterior')}
          title={t('Página anterior')}
          disabled={!document || pageNumber === 1}
          onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
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
          onClick={() => setPageNumber((value) => Math.min(document.numPages, value + 1))}
        >
          <ChevronRight size={17} />
        </button>

        <span className="ws-file-viewer__tool-divider" aria-hidden="true" />
        <button
          type="button"
          aria-label={t('Reduzir zoom')}
          title={t('Reduzir zoom')}
          disabled={!document || scale <= MIN_ZOOM / 100}
          onClick={() => setScale((value) => clampZoom(Math.round(value * 100) - 25) / 100)}
        >
          <Minus size={17} />
        </button>

        {/* ----- Indicador editável ao clicar na porcentagem ----- */}
        <form
          className="ws-file-viewer__zoom-form"
          onSubmit={(event) => {
            event.preventDefault();
            commitZoom();
            zoomInputRef.current?.blur();
          }}
        >
          <input
            ref={zoomInputRef}
            type="text"
            inputMode="decimal"
            aria-label={t('Zoom')}
            title={t('Zoom')}
            disabled={!document}
            value={editingZoom ? zoomInput : String(Math.round(scale * 100))}
            onFocus={(event) => {
              setEditingZoom(true);
              setZoomInput(String(Math.round(scale * 100)));
              event.target.select();
            }}
            onChange={(event) => setZoomInput(event.target.value)}
            onBlur={() => {
              if (skipZoomBlurRef.current) {
                skipZoomBlurRef.current = false;
                return;
              }
              if (editingZoom) commitZoom();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                cancelZoom();
                event.currentTarget.blur();
              }
            }}
          />
          <span aria-hidden="true">%</span>
        </form>
        <button
          type="button"
          aria-label={t('Aumentar zoom')}
          title={t('Aumentar zoom')}
          disabled={!document || scale >= MAX_ZOOM / 100}
          onClick={() => setScale((value) => clampZoom(Math.round(value * 100) + 25) / 100)}
        >
          <Plus size={17} />
        </button>
        <button
          type="button"
          disabled={!document}
          onClick={() => setScale(1)}
          title={t('Restaurar zoom')}
          aria-label={t('Restaurar zoom')}
        >
          100%
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

        {/* === Pesquisa por ocorrências === */}
        <div className="ws-file-viewer__search-group">
          <label className="ws-file-viewer__pdf-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label={t('Pesquisar no PDF')}
              placeholder={t('Buscar no PDF')}
              disabled={!document}
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
            />
          </label>
          {query.trim() && (
            <span className="ws-file-viewer__search-count" role="status">
              {searching ? '…' : `${matches.length} ${t('resultados')}`}
            </span>
          )}
          {matches.length > 0 && (
            <>
              <button
                type="button"
                className="ws-file-viewer__search-action"
                onClick={() => goToMatch(-1)}
                title={t('Resultado anterior')}
                aria-label={t('Resultado anterior')}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="ws-file-viewer__search-count">
                {matchIndex + 1}/{matches.length}
              </span>
              <button
                type="button"
                className="ws-file-viewer__search-action"
                onClick={() => goToMatch(1)}
                title={t('Próximo resultado')}
                aria-label={t('Próximo resultado')}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* === Página, texto selecionável e links === */}
      <div className="ws-file-viewer__pdf-viewport" ref={containerRef}>
        {loading && <p role="status">{t('Carregando PDF...')}</p>}
        {error && <p role="alert">{t(error)}</p>}
        <div
          className="ws-file-viewer__pdf-page"
          ref={pageRef}
          hidden={!document || Boolean(error)}
        >
          <canvas
            ref={canvasRef}
            aria-label={t('Página {0} de {1}')
              .replace('{0}', pageNumber)
              .replace('{1}', document?.numPages ?? 0)}
          />
          <div ref={textRef} className="textLayer ws-file-viewer__text-layer" />
          <div ref={annotationRef} className="annotationLayer ws-file-viewer__annotation-layer" />
        </div>
      </div>
    </section>
  );
}

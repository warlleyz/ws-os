
import { useRef, useState } from 'react';

import { AppIcon } from '../../shared/components/AppIcon';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import MobileDock from './home/MobileDock';

import './home/MobileHome.css';

/* === CONFIGURAÇÃO DA HOME === */
const APPS_PER_PAGE = 8;
const SWIPE_THRESHOLD = 50;
const SWIPE_DIRECTION_RATIO = 1.4;

/* === HOME MOBILE === */
export default function MobileHome({
  apps,
  onOpenApp,
  onOpenCatalog,
}) {
  useLocale();

  /* === ESTADO DAS PÁGINAS === */
  const [currentPage, setCurrentPage] = useState(0);

  /* === REFERÊNCIAS DE INTERAÇÃO === */
  const touchStartRef = useRef(null);
  const suppressClickRef = useRef(false);

  /* === ORGANIZAÇÃO DOS APLICATIVOS === */
  /* ----- Aplicativos disponíveis ----- */
  const homeApps = apps.filter(
    (app) => app.showOnDesktop !== false,
  );

  /* ----- Distribuição entre páginas ----- */
  const pages = [];

  for (let index = 0; index < homeApps.length; index += APPS_PER_PAGE) {
    pages.push(homeApps.slice(index, index + APPS_PER_PAGE));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  /* ----- Página atual ----- */
  const pageIndex = Math.min(currentPage, pages.length - 1);
  const visibleApps = pages[pageIndex];

  /* === NAVEGAÇÃO ENTRE PÁGINAS === */
  /* ----- Selecionar página ----- */
  function selectPage(index) {
    if (index < 0 || index >= pages.length) return;

    setCurrentPage(index);
  }

  /* ----- Início do toque ----- */
  function handleTouchStart(event) {
    suppressClickRef.current = false;

    if (event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  /* ----- Fim do toque ----- */
  function handleTouchEnd(event) {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (
      horizontalDistance < SWIPE_THRESHOLD ||
      horizontalDistance <= verticalDistance * SWIPE_DIRECTION_RATIO
    ) {
      return;
    }

    if (deltaX < 0 && pageIndex < pages.length - 1) {
      suppressClickRef.current = true;
      selectPage(pageIndex + 1);
    } else if (deltaX > 0 && pageIndex > 0) {
      suppressClickRef.current = true;
      selectPage(pageIndex - 1);
    }
  }

  /* ----- Cancelamento do toque ----- */
  function handleTouchCancel() {
    touchStartRef.current = null;
    suppressClickRef.current = false;
  }

  /* ----- Proteção contra abertura acidental ----- */
  function handleClickCapture(event) {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    suppressClickRef.current = false;
  }

  /* === RENDERIZAÇÃO === */
  return (
    <section
      className="ws-mobile__home"
      aria-label={t('Início')}
    >
      {/* === ÁREA PRINCIPAL === */}
      <div className="ws-mobile__home-content">
        {/* ----- Identidade do sistema ----- */}
        <header className="ws-mobile__home-heading">
          <span className="ws-mobile__home-brand">
            WS OS
          </span>
        </header>

        {/* === PÁGINAS DE APLICATIVOS === */}
        <div
          className="ws-mobile__home-pages"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onClickCapture={handleClickCapture}
        >
          <div
            className="ws-mobile__home-grid"
            aria-label={t('Aplicativos')}
          >
            {visibleApps.map((app) => (
              <button
                key={app.id}
                type="button"
                className="ws-mobile__home-app"
                onClick={() => onOpenApp(app.id)}
              >
                <span className="ws-mobile__home-app-icon">
                  <AppIcon app={app} size={28} />
                </span>

                <span className="ws-mobile__home-app-label">
                  {t(app.name)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* === INDICADORES DE PÁGINAS === */}
        {pages.length > 1 && (
          <nav
            className="ws-mobile__home-pagination"
            aria-label={t('Navegação Mobile')}
          >
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                className={
                  index === pageIndex
                    ? 'ws-mobile__home-page-dot ws-mobile__home-page-dot--active'
                    : 'ws-mobile__home-page-dot'
                }
                aria-label={`${t('Página')} ${index + 1}`}
                aria-current={index === pageIndex ? 'page' : undefined}
                onClick={() => selectPage(index)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* === DOCK === */}
      <MobileDock
        apps={apps}
        onOpenApp={onOpenApp}
      />

      {/* === ACESSO AO CATÁLOGO === */}
      <button
        type="button"
        className="ws-mobile__home-all-apps"
        onClick={onOpenCatalog}
      >
        {t('Todos os aplicativos')}
      </button>
    </section>
  );
}
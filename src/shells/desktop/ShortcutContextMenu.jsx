
import { useLayoutEffect, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpToLine,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Layers,
  LayoutGrid,
} from 'lucide-react';

import useMenuNavigation from '../../shared/hooks/useMenuNavigation';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

export default function ShortcutContextMenu({
  shortcutContextRef,
  app,
  shortcutContext,
  runShortcutContextAction,
  hasOpenInstance,
  shortcutOrder,
}) {
  useLocale();

  const [page, setPage] = useState('main');
  const [position, setPosition] = useState({
    left: shortcutContext.x,
    top: shortcutContext.y,
  });

  useMenuNavigation(shortcutContextRef, `${app.id}:${page}`);

  useLayoutEffect(() => {
    const menu = shortcutContextRef.current;
    const workspace = menu?.parentElement;

    if (!menu || !workspace) return;

    function updatePosition() {
      const width = menu.offsetWidth;
      const height = menu.offsetHeight;

      const minLeft = workspace.scrollLeft + 8;
      const minTop = workspace.scrollTop + 8;

      const maxLeft = Math.max(
        minLeft,
        workspace.scrollLeft + workspace.clientWidth - width - 8,
      );

      const maxTop = Math.max(
        minTop,
        workspace.scrollTop + workspace.clientHeight - height - 8,
      );

      const left = Math.max(
        minLeft,
        Math.min(shortcutContext.x, maxLeft),
      );

      const top = Math.max(
        minTop,
        Math.min(shortcutContext.y, maxTop),
      );

      setPosition((current) =>
        current.left === left && current.top === top
          ? current
          : { left, top },
      );
    }

    updatePosition();

    const observer = new ResizeObserver(updatePosition);

    observer.observe(menu);
    observer.observe(workspace);

    return () => observer.disconnect();
  }, [shortcutContext, shortcutContextRef, page]);

  return (
    <div
      ref={shortcutContextRef}
      className="desktop__context desktop__context--modern"
      role="group"
      aria-label={t(`Opções de ${app.name}`)}
      style={position}
    >
      {page === 'main' ? (
        <>
          <div className="desktop__context-header">
            <app.icon size={17} aria-hidden="true" />
            <strong>{t(app.name)}</strong>
          </div>

          <div className="desktop__context-divider" />

          <button
            type="button"
            onClick={() => runShortcutContextAction('open')}
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span>{t('Abrir')}</span>
          </button>

          {app.allowMultipleInstances && (
            <button
              type="button"
              onClick={() => runShortcutContextAction('new-window')}
            >
              <Layers size={16} aria-hidden="true" />
              <span>{t('Nova janela')}</span>
            </button>
          )}

          {hasOpenInstance && (
            <button
              type="button"
              onClick={() => runShortcutContextAction('focus')}
            >
              <ArrowUpToLine size={16} aria-hidden="true" />
              <span>{t('Trazer para frente')}</span>
            </button>
          )}

          <div className="desktop__context-divider" />

          <button
            type="button"
            onClick={() => setPage('info')}
          >
            <Info size={16} aria-hidden="true" />
            <span>{t('Informações')}</span>
            <ChevronRight
              size={15}
              className="desktop__context-arrow"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => setPage('organization')}
          >
            <LayoutGrid size={16} aria-hidden="true" />
            <span>{t('Organização')}</span>
            <ChevronRight
              size={15}
              className="desktop__context-arrow"
              aria-hidden="true"
            />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="desktop__context-back"
            onClick={() => setPage('main')}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span>
              {t(page === 'info' ? 'Informações' : 'Organização')}
            </span>
          </button>

          <div className="desktop__context-divider" />

          {page === 'info' ? (
            <div className="desktop__context-info">
              <span>
                {t('Nome:')} {t(app.name)}
              </span>
              <span>
                {t('Tipo:')}{' '}
                {t(
                  app.category === 'system'
                    ? 'Aplicativo de Sistema'
                    : 'Aplicativo Desktop',
                )}
              </span>
              <span>
                {t('Estado:')}{' '}
                {t(
                  app.implemented
                    ? 'Implementado'
                    : 'Em desenvolvimento',
                )}
              </span>
              <span>
                {t('Múltiplas janelas:')}{' '}
                {t(app.allowMultipleInstances ? 'Sim' : 'Não')}
              </span>
            </div>
          ) : (
            <>
              <button
                type="button"
                aria-pressed={shortcutOrder === 'default'}
                onClick={() =>
                  runShortcutContextAction('sort-default')
                }
              >
                <ArrowDownAZ size={16} aria-hidden="true" />
                <span>{t('Organização padrão')}</span>
                {shortcutOrder === 'default' && (
                  <Check size={16} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                aria-pressed={shortcutOrder === 'name'}
                onClick={() =>
                  runShortcutContextAction('sort-name')
                }
              >
                <ArrowDownAZ size={16} aria-hidden="true" />
                <span>{t('Ordenar por nome')}</span>
                {shortcutOrder === 'name' && (
                  <Check size={16} aria-hidden="true" />
                )}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

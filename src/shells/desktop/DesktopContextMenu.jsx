
import { useLayoutEffect, useState } from 'react';
import {
  ArrowDownAZ,
  Check,
  ChevronLeft,
  ChevronRight,
  Image,
  LayoutGrid,
  Monitor,
  RefreshCw,
} from 'lucide-react';

import useMenuNavigation from '../../shared/hooks/useMenuNavigation';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

export default function DesktopContextMenu({
  desktopContextRef,
  desktopContext,
  runDesktopContextAction,
  shortcutOrder,
}) {
  useLocale();

  const [page, setPage] = useState('main');
  const [position, setPosition] = useState({
    left: desktopContext.x,
    top: desktopContext.y,
  });

  useMenuNavigation(desktopContextRef, page);

  useLayoutEffect(() => {
    const menu = desktopContextRef.current;
    const workspace = menu?.parentElement;

    if (!menu || !workspace) return;

    function updatePosition() {
      const width = menu.offsetWidth;
      const height = menu.offsetHeight;

      const left = Math.max(
        8,
        Math.min(
          desktopContext.x,
          workspace.clientWidth - width - 8,
        ),
      );

      const top = Math.max(
        8,
        Math.min(
          desktopContext.y,
          workspace.clientHeight - height - 8,
        ),
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
  }, [desktopContext, desktopContextRef, page]);

  return (
    <div
      ref={desktopContextRef}
      className="desktop__context desktop__context--modern"
      role="group"
      aria-label={t('Opções da área de trabalho')}
      style={position}
    >
      {page === 'main' ? (
        <>
          <div className="desktop__context-header">
            <Monitor size={17} aria-hidden="true" />
            <strong>{t('Área de trabalho')}</strong>
          </div>

          <div className="desktop__context-divider" />

          <button
            type="button"
            onClick={() => runDesktopContextAction('refresh')}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>{t('Atualizar')}</span>
          </button>

          <button
            type="button"
            onClick={() => setPage('sort')}
          >
            <ArrowDownAZ size={16} aria-hidden="true" />
            <span>{t('Organizar por')}</span>
            <ChevronRight
              size={15}
              className="desktop__context-arrow"
              aria-hidden="true"
            />
          </button>

          <div className="desktop__context-divider" />

          <button
            type="button"
            onClick={() => runDesktopContextAction('personalize')}
          >
            <Image size={16} aria-hidden="true" />
            <span>{t('Personalizar')}</span>
          </button>

          <button
            type="button"
            onClick={() => runDesktopContextAction('personalize-widgets')}
          >
            <LayoutGrid size={16} aria-hidden="true" />
            <span>{t('Personalizar widgets')}</span>
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
            <span>{t('Organizar por')}</span>
          </button>

          <div className="desktop__context-divider" />

          <button
            type="button"
            aria-pressed={shortcutOrder === 'default'}
            onClick={() => runDesktopContextAction('sort-default')}
          >
            <span>{t('Organização padrão')}</span>
            {shortcutOrder === 'default' && (
              <Check size={16} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            aria-pressed={shortcutOrder === 'name'}
            onClick={() => runDesktopContextAction('sort-name')}
          >
            <span>{t('Ordenar por nome')}</span>
            {shortcutOrder === 'name' && (
              <Check size={16} aria-hidden="true" />
            )}
          </button>
        </>
      )}
    </div>
  );
}

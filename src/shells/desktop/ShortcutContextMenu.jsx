import { useState } from 'react';
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

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import useMenuNavigation from '../../shared/hooks/useMenuNavigation';
import useContextMenuPosition from './useContextMenuPosition';

/* === Menu contextual dos atalhos === */
export default function ShortcutContextMenu({
  shortcutContextRef,
  app,
  shortcutContext,
  runShortcutContextAction,
  hasOpenInstance,
  shortcutOrder,
}) {

  /* ----- Idioma e navegação ----- */
  useLocale();
  const [page, setPage] = useState('main');

  /* ----- Posicionamento do menu ----- */
  const position = useContextMenuPosition(
    shortcutContextRef,
    shortcutContext,
  );

  useMenuNavigation(shortcutContextRef, `${app.id}:${page}`);

  /* === Renderização === */
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

          {/* === Cabeçalho do aplicativo === */}
          <div className="desktop__context-header">
            <app.icon size={17} aria-hidden="true" />
            <strong>{t(app.name)}</strong>
          </div>

          <div className="desktop__context-divider" />

          {/* === Abertura e gerenciamento === */}
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

          {/* === Submenus === */}
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

          {/* === Navegação do submenu === */}
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
            <>

              {/* === Informações do aplicativo === */}
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
            </>
          ) : (
            <>

              {/* === Opções de organização === */}
              <button
                type="button"
                aria-pressed={shortcutOrder === 'default'}
                onClick={() => runShortcutContextAction('sort-default')}
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
                onClick={() => runShortcutContextAction('sort-name')}
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
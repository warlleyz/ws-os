import GlobalSearchResults from '../search/GlobalSearchResults';

import { Clock3, Grid2X2, Search, Star, UserRound, X } from 'lucide-react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { openApp } from '../../core/appManager';
import { AppIcon } from '../../shared/components/AppIcon';
import { getAppDefinition } from '../../core/appRegistry';
import Tooltip from '../../shared/components/Tooltip';

import './WSMenu.css';

const VIEWS = [
  { id: 'home', label: 'Favoritos', icon: Star },
  { id: 'recent', label: 'Recentes', icon: Clock3 },
  { id: 'all', label: 'Todos', icon: Grid2X2 },
];

export default function WSMenu({
  shortcutContext,
  setShortcutContext,
  menuSearchRef,
  menuSearch,
  setMenuSearch,
  visibleMenuApps,
  onAppAction,
  closePanels,
  searchTerm,
  menuView,
  setMenuView,
  openShortcutContext,
  favoriteIds,
  MAX_FAVORITES,
  shortcutContextRef,
  runShortcutContextAction,
}) {
  useLocale();

  const searching = Boolean(searchTerm);

  const currentTitle = searching
    ? t('Resultados da pesquisa')
    : menuView === 'recent'
      ? t('Aplicativos recentes')
      : menuView === 'all'
        ? t('Todos os aplicativos')
        : t('Aplicativos favoritos');

  function handleOpenApp(appId, params = {}) {
    onAppAction(openApp, appId, { origin: 'search', params });
    closePanels();
  }

  function handleContextKeyboard(event, app) {
    if (!((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu')) {
      return;
    }

    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();

    openShortcutContext(
      {
        preventDefault: () => {},
        currentTarget: event.currentTarget,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      },
      app,
    );
  }

  return (
    <section
      className="taskbar-launcher taskbar-launcher--redesign ws-menu"
      aria-label="WS Menu"
      onPointerDown={(event) => {
        if (shortcutContext && !event.target.closest('.ws-menu__context')) {
          setShortcutContext(null);
        }
      }}
    >
      {/* Pesquisa superior */}
      <header className="ws-menu__top">
        <div className="ws-menu__search">
          <Search size={17} aria-hidden="true" />

          <input
            ref={menuSearchRef}
            type="search"
            aria-label={t('Pesquisar na WS OS')}
            placeholder={t('Pesquisar na WS OS...')}
            value={menuSearch}
            onChange={(event) => setMenuSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && visibleMenuApps.length > 0) {
                event.preventDefault();
                handleOpenApp(visibleMenuApps[0].id);
              }
            }}
          />

          {menuSearch && (
            <Tooltip content={t('Limpar pesquisa')} delay={350}>
              <button
                type="button"
                className="ws-menu__clear"
                aria-label={t('Limpar pesquisa')}
                onClick={() => {
                  setMenuSearch('');
                  menuSearchRef.current?.focus();
                }}
              >
                <X size={15} />
              </button>
            </Tooltip>
          )}
        </div>

        <span className="ws-menu__top-brand">WS OS</span>
      </header>

      {/* Navegação e aplicativos */}
      <div className="ws-menu__workspace">
        <nav className="ws-menu__sidebar" aria-label={t('Navegação do WS Menu')}>
          <span className="ws-menu__sidebar-label">{t('Explorar')}</span>

          <div className="ws-menu__sidebar-items">
            {VIEWS.map(({ id, label, icon: Icon }) => {
              const selected = menuView === id && !searching;

              return (
                <Tooltip key={id} content={t(label)} delay={450}>
                  <button
                    type="button"
                    className={`ws-menu__nav-button${selected ? ' is-active' : ''}`}
                    aria-current={selected ? 'page' : undefined}
                    disabled={searching}
                    onClick={() => setMenuView(id)}
                  >
                    <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                    <span>{t(label)}</span>
                  </button>
                </Tooltip>
              );
            })}
          </div>

          <div className="ws-menu__sidebar-bottom">
            <span className="ws-menu__sidebar-caption">{t('Seu espaço')}</span>
            <span className="ws-menu__favorite-count">
              <Star size={13} aria-hidden="true" />
              {favoriteIds.length}/{MAX_FAVORITES}
            </span>
          </div>
        </nav>

        <div className="ws-menu__content">
          <div className="ws-menu__content-heading">
            <div className="ws-menu__content-title">
              <span className="ws-menu__eyebrow">{searching ? t('Pesquisa') : t('Navegação')}</span>

              <h2>{currentTitle}</h2>
            </div>

            <span
              className="ws-menu__result-count"
              aria-label={`${visibleMenuApps.length} ${t('Aplicativos')}`}
            >
              {visibleMenuApps.length}
            </span>
          </div>

          <div className="ws-menu__apps" aria-label={t('Aplicativos')}>
            {visibleMenuApps.length === 0 ? (
              <div className="ws-menu__empty">
                <Grid2X2 size={25} aria-hidden="true" />

                <p>
                  {searching
                    ? t('Nenhum aplicativo encontrado.')
                    : menuView === 'home'
                      ? t('Nenhum favorito. Clique em Todos os aplicativos para adicionar.')
                      : menuView === 'recent'
                        ? t('Nenhum aplicativo aberto nesta sessão.')
                        : t('Nenhum aplicativo disponível.')}
                </p>

                {!searching && menuView !== 'all' && (
                  <button
                    type="button"
                    className="ws-menu__empty-action"
                    onClick={() => setMenuView('all')}
                  >
                    {t('Todos os aplicativos')}
                  </button>
                )}
              </div>
            ) : (
              visibleMenuApps.map((app) => (
                <div key={app.id} className="ws-menu__app-item">
                  <Tooltip content={t(app.name)} delay={500}>
                    <button
                      type="button"
                      className="ws-menu__app"
                      onContextMenu={(event) => openShortcutContext(event, app)}
                      onKeyDown={(event) => handleContextKeyboard(event, app)}
                      onClick={() => handleOpenApp(app.id)}
                    >
                      <span className="ws-menu__app-icon">
                        <AppIcon app={app} size={20} />
                      </span>

                      <span className="ws-menu__app-info">
                        <strong>{t(app.name)}</strong>
                        <small>
                          {app.category === 'system'
                            ? t('Aplicativo de Sistema')
                            : t('Aplicativo Desktop')}
                        </small>
                      </span>
                    </button>
                  </Tooltip>
                </div>
              ))
            )}
          </div>
          {searching && <GlobalSearchResults query={menuSearch} onOpen={handleOpenApp} />}
        </div>
      </div>

      {/* Rodapé */}
      <footer className="ws-menu__footer">
        <div className="ws-menu__user">
          <span className="ws-menu__user-avatar" aria-hidden="true">
            <UserRound size={17} />
          </span>

          <span className="ws-menu__user-info">
            <strong>{t('Visitante')}</strong>
            <small>{t('Bem-vindo à WS OS')}</small>
          </span>
        </div>

        <span className="ws-menu__footer-brand">WS OS</span>
      </footer>

      {/* Menu contextual existente */}
      {shortcutContext &&
        (() => {
          const app = getAppDefinition(shortcutContext.appId);

          if (!app) return null;

          const isFavorite = favoriteIds.includes(shortcutContext.appId);

          const canFavorite = isFavorite || favoriteIds.length < MAX_FAVORITES;

          return (
            <div
              ref={shortcutContextRef}
              className="ws-menu__context"
              role="group"
              aria-label={t(`Opções de ${app.name}`)}
              style={{
                left: shortcutContext.x,
                top: shortcutContext.y,
              }}
            >
              <div className="ws-menu__context-header">
                <span className="ws-menu__context-icon">
                  <AppIcon app={app} size={19} />
                </span>

                <strong>{t(app.name)}</strong>
              </div>

              <div className="ws-menu__context-divider" />

              <button type="button" onClick={() => runShortcutContextAction('open')}>
                <span className="ws-menu__context-action-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5l11 7-11 7V5Z" />
                  </svg>
                </span>
                {t('Abrir')}
              </button>

              <button
                type="button"
                disabled={!canFavorite}
                onClick={() => runShortcutContextAction('favorite')}
              >
                <span className="ws-menu__context-action-icon">
                  <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </span>

                {isFavorite ? t('Desafixar do WS Menu') : t('Fixar no WS Menu')}
              </button>

              <div className="ws-menu__context-divider" />

              <button
                type="button"
                aria-expanded={shortcutContext.showInfo}
                onClick={() => runShortcutContextAction('info')}
              >
                <span className="ws-menu__context-action-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v6M12 7h.01" />
                  </svg>
                </span>
                {t('Informações')}
              </button>

              {shortcutContext.showInfo && (
                <div className="ws-menu__context-details">
                  <span>
                    {t('Tipo:')}{' '}
                    {app.category === 'system'
                      ? t('Aplicativo de Sistema')
                      : t('Aplicativo Desktop')}
                  </span>

                  <span>
                    {t('Estado:')} {app.implemented ? t('Implementado') : t('Em desenvolvimento')}
                  </span>
                </div>
              )}
            </div>
          );
        })()}
    </section>
  );
}

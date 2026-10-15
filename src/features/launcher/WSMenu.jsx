import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { SystemIcon } from '../../shared/components/SystemIcon';
import { openApp } from '../../core/appManager';
import { AppIcon } from '../../shared/components/AppIcon';
import { getAppDefinition } from '../../core/appRegistry';

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
  return (
    <section
      className="taskbar-launcher taskbar-launcher--redesign"
      aria-label="WS Menu"
      onPointerDown={(event) => {
        if (shortcutContext && !event.target.closest('.ws-menu__context')) {
          setShortcutContext(null);
        }
      }}
    >
      <header className="ws-menu__identity">
        <div className="ws-menu__avatar" aria-hidden="true">
          <SystemIcon name="wally" size={21} />
        </div>
        <div className="ws-menu__identity-text">
          <strong>{t('Visitante')}</strong>
          <small>{t('Bem-vindo à WS OS')}</small>
        </div>
        <span className="ws-menu__brand">WS OS</span>
      </header>
      <div className="ws-menu__search">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
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
              onAppAction(openApp, visibleMenuApps[0].id);
              closePanels();
            }
          }}
        />
        {menuSearch && (
          <button
            type="button"
            aria-label={t('Limpar pesquisa')}
            title={t('Limpar pesquisa')}
            onClick={() => {
              setMenuSearch('');
              menuSearchRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className="ws-menu__main">
        <div className="ws-menu__section-heading">
          <strong>
            {searchTerm
              ? t('Resultados da pesquisa')
              : menuView === 'all'
                ? t('Todos os aplicativos')
                : menuView === 'recent'
                  ? t('Aplicativos recentes')
                  : t('Aplicativos Favoritos')}
          </strong>
          {!searchTerm && (
            <div className="ws-menu__view-actions">
              <button
                type="button"
                className="ws-menu__view-toggle"
                onClick={() =>
                  setMenuView((current) =>
                    current === 'recent' ? 'home' : 'recent'
                  )
                }
              >
                {menuView === 'recent'
                  ? t('Favoritos')
                  : t('Aplicativos recentes')}
              </button>

              <button
                type="button"
                className="ws-menu__view-toggle"
                onClick={() =>
                  setMenuView((current) =>
                    current === 'all' ? 'home' : 'all'
                  )
                }
              >
                {menuView === 'all'
                  ? t('Voltar')
                  : t('Todos os aplicativos')}
              </button>
            </div>
          )}
        </div>
        <div className="ws-menu__apps" aria-label={t('Aplicativos')}>
          {visibleMenuApps.length === 0 ? (
            <p className="ws-menu__empty">
              {searchTerm
                ? t('Nenhum aplicativo encontrado.')
                : menuView === 'home'
                  ? t('Nenhum favorito. Clique em Todos os aplicativos para adicionar.')
                  : menuView === 'recent'
                    ? t('Nenhum aplicativo aberto nesta sessão.')
                    : t('Nenhum aplicativo disponível.')}
            </p>
          ) : (
            visibleMenuApps.map((app) => {
              return (
                <div className="ws-menu__app-item" key={app.id}>
                  <button
                    type="button"
                    className="ws-menu__app"
                    onContextMenu={(event) => openShortcutContext(event, app)}
                    onKeyDown={(event) => {
                      if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
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
                    }}
                    onClick={() => {
                      onAppAction(openApp, app.id);
                      closePanels();
                    }}
                  >
                    <span className="ws-menu__app-icon">
                      <AppIcon app={app} size={19} />
                    </span>
                    <span className="ws-menu__app-name">{t(app.name)}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      {shortcutContext &&
        (() => {
          const app = getAppDefinition(shortcutContext.appId);
          const isFavorite = favoriteIds.includes(shortcutContext.appId);
          if (!app) return null;
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
                  <AppIcon app={app} size={18} />
                </span>
                <strong title={t(app.name)}>{t(app.name)}</strong>
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
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill={isFavorite ? 'currentColor' : 'none'}
                  >
                    <path d="m12 2 3.1 6.3 7 1-5.1 5 .9 7-5.9-3.2-5.9 3.2.9-7-5.1-5 7-1L12 2Z" />
                  </svg>
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

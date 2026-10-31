import { useSyncExternalStore } from 'react';
import {
  Clock3,
  Grid2X2,
  Search,
  Star,
  UserRound,
  X,
} from 'lucide-react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { AppIcon } from '../../shared/components/AppIcon';
import Tooltip from '../../shared/components/Tooltip';
import { openApp } from '../../core/appManager';
import { getAppDefinition } from '../../core/appRegistry';
import {
  getAdminSessionVersion,
  isAdminAuthenticated,
  subscribeAdminSession,
} from '../../services/authService';

import GlobalSearchResults from '../search/GlobalSearchResults';

import './WSMenu.css';
import '../search/GlobalSearchResults.css';

/* === Configuração do WS Menu === */
/* ----- Seções de navegação ----- */
const VIEWS = [
  { id: 'home', label: 'Favoritos', icon: Star },
  { id: 'recent', label: 'Recentes', icon: Clock3 },
  { id: 'all', label: 'Todos', icon: Grid2X2 },
];

/* === Menu principal do sistema === */
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

  /* === Idioma e autenticação === */
  /* ----- Idioma do sistema ----- */
  useLocale();

  /* ----- Atualização da sessão administrativa ----- */
  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionVersion,
    () => 0,
  );

  const authenticated = isAdminAuthenticated();

  /* === Estado da navegação === */
  /* ----- Pesquisa ativa ----- */
  const searching = Boolean(searchTerm);

  /* ----- Título da seção atual ----- */
  const currentTitle = searching
    ? t('Resultados da pesquisa')
    : menuView === 'recent'
      ? t('Aplicativos recentes')
      : menuView === 'all'
        ? t('Todos os aplicativos')
        : t('Aplicativos favoritos');

  /* === Ações dos aplicativos === */
  /* ----- Abrir aplicativo ----- */
  function handleOpenApp(appId, params = {}) {
    onAppAction(openApp, appId, {
      origin: 'search',
      params,
    });

    closePanels();
  }

  /* ----- Abrir menu contextual pelo teclado ----- */
  function handleContextKeyboard(event, app) {
    if (
      !(
        (event.shiftKey && event.key === 'F10') ||
        event.key === 'ContextMenu'
      )
    ) {
      return;
    }

    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();

    openShortcutContext(
      {
        preventDefault: () => { },
        currentTarget: event.currentTarget,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      },
      app,
    );
  }

  /* === Renderização do WS Menu === */
  return (
    <section
      className="taskbar-launcher taskbar-launcher--redesign ws-menu"
      aria-label="WS Menu"
      onPointerDown={(event) => {
        if (
          shortcutContext &&
          !event.target.closest('.ws-menu__context')
        ) {
          setShortcutContext(null);
        }
      }}
    >

      {/* === Cabeçalho e pesquisa === */}
      <header className="ws-menu__top">

        {/* ----- Campo de pesquisa ----- */}
        <div className="ws-menu__search">
          <Search size={17} aria-hidden="true" />

          <input
            ref={menuSearchRef}
            type="search"
            aria-label={t('Pesquisar na WS OS')}
            placeholder={t('Pesquisar na WS OS...')}
            value={menuSearch}
            onChange={(event) =>
              setMenuSearch(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                visibleMenuApps.length > 0
              ) {
                event.preventDefault();
                handleOpenApp(visibleMenuApps[0].id);
              }
            }}
          />

          {/* ----- Limpar pesquisa ----- */}
          {menuSearch && (
            <Tooltip
              content={t('Limpar pesquisa')}
              delay={350}
            >
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

        {/* ----- Identidade do sistema ----- */}
        <span className="ws-menu__top-brand">
          WS OS
        </span>
      </header>

      {/* === Área de navegação === */}
      <div className="ws-menu__workspace">

        {/* === Barra lateral === */}
        <nav
          className="ws-menu__sidebar"
          aria-label={t('Navegação do WS Menu')}
        >

          {/* ----- Identificação da navegação ----- */}
          <span className="ws-menu__sidebar-label">
            {t('Explorar')}
          </span>

          {/* ----- Seções disponíveis ----- */}
          <div className="ws-menu__sidebar-items">
            {VIEWS.map(({ id, label, icon: Icon }) => {
              const selected =
                menuView === id && !searching;

              return (
                <Tooltip
                  key={id}
                  content={t(label)}
                  delay={450}
                >
                  <button
                    type="button"
                    className={`ws-menu__nav-button${selected ? ' is-active' : ''}`}
                    aria-current={
                      selected ? 'page' : undefined
                    }
                    disabled={searching}
                    onClick={() => setMenuView(id)}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <span>{t(label)}</span>
                  </button>
                </Tooltip>
              );
            })}
          </div>

          {/* ----- Contador de favoritos ----- */}
          <div className="ws-menu__sidebar-bottom">
            <span className="ws-menu__sidebar-caption">
              {t('Seu espaço')}
            </span>

            <span className="ws-menu__favorite-count">
              <Star size={13} aria-hidden="true" />
              {favoriteIds.length}/{MAX_FAVORITES}
            </span>
          </div>
        </nav>

        {/* === Conteúdo principal === */}
        <div className="ws-menu__content">

          {/* ----- Cabeçalho da seção ----- */}
          <div className="ws-menu__content-heading">
            <div className="ws-menu__content-title">
              <span className="ws-menu__eyebrow">
                {searching
                  ? t('Pesquisa')
                  : t('Navegação')}
              </span>

              <h2>{currentTitle}</h2>
            </div>

            {/* ----- Quantidade de aplicativos ----- */}
            <span
              className="ws-menu__result-count"
              aria-label={`${visibleMenuApps.length} ${t('Aplicativos')}`}
            >
              {visibleMenuApps.length}
            </span>
          </div>

          {/* === Resultados e aplicativos === */}
          <div className="ws-menu__results-scroll">
            <div
              className="ws-menu__apps"
              aria-label={t('Aplicativos')}
            >

              {/* ----- Estado vazio ----- */}
              {visibleMenuApps.length === 0 ? (
                <div className="ws-menu__empty">
                  <Grid2X2
                    size={25}
                    aria-hidden="true"
                  />

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

                /* ----- Lista de aplicativos ----- */
                visibleMenuApps.map((app) => (
                  <div
                    key={app.id}
                    className="ws-menu__app-item"
                  >
                    <Tooltip
                      content={t(app.name)}
                      delay={500}
                    >
                      <button
                        type="button"
                        className="ws-menu__app"
                        onContextMenu={(event) =>
                          openShortcutContext(event, app)
                        }
                        onKeyDown={(event) =>
                          handleContextKeyboard(event, app)
                        }
                        onClick={() =>
                          handleOpenApp(app.id)
                        }
                      >

                        {/* ----- Ícone ----- */}
                        <span className="ws-menu__app-icon">
                          <AppIcon app={app} size={20} />
                        </span>

                        {/* ----- Informações ----- */}
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

            {/* ----- Resultados da busca global ----- */}
            {searching && (
              <GlobalSearchResults
                query={menuSearch}
                onOpen={handleOpenApp}
              />
            )}
          </div>
        </div>
      </div>

      {/* === Identificação do usuário === */}
      <footer className="ws-menu__footer">

        {/* ----- Perfil da sessão ----- */}
        <div className="ws-menu__user">
          <span
            className="ws-menu__user-avatar"
            aria-hidden="true"
          >
            <UserRound size={17} />
          </span>

          <span className="ws-menu__user-info">
            <strong>
              {authenticated
                ? 'Warlley'
                : t('Visitante')}
            </strong>

            <small>
              {t('Bem-vindo à WS OS')}
            </small>
          </span>
        </div>

        {/* ----- Identidade visual ----- */}
        <span className="ws-menu__footer-brand">
          WS OS
        </span>
      </footer>

      {/* === Menu contextual dos aplicativos === */}
      {shortcutContext &&
        (() => {

          /* ----- Identificação do aplicativo ----- */
          const app = getAppDefinition(
            shortcutContext.appId,
          );

          if (!app) return null;

          /* ----- Estado dos favoritos ----- */
          const isFavorite = favoriteIds.includes(
            shortcutContext.appId,
          );

          const canFavorite =
            isFavorite ||
            favoriteIds.length < MAX_FAVORITES;

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

              {/* ----- Cabeçalho do menu ----- */}
              <div className="ws-menu__context-header">
                <span className="ws-menu__context-icon">
                  <AppIcon app={app} size={19} />
                </span>

                <strong>{t(app.name)}</strong>
              </div>

              <div className="ws-menu__context-divider" />

              {/* === Ações do aplicativo === */}
              {/* ----- Abrir aplicativo ----- */}
              <button
                type="button"
                onClick={() =>
                  runShortcutContextAction('open')
                }
              >
                <span className="ws-menu__context-action-icon">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8 5l11 7-11 7V5Z" />
                  </svg>
                </span>
                {t('Abrir')}
              </button>

              {/* ----- Fixar ou desafixar favorito ----- */}
              <button
                type="button"
                disabled={!canFavorite}
                onClick={() =>
                  runShortcutContextAction('favorite')
                }
              >
                <span className="ws-menu__context-action-icon">
                  <Star
                    size={16}
                    fill={
                      isFavorite
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                </span>

                {isFavorite
                  ? t('Desafixar do WS Menu')
                  : t('Fixar no WS Menu')}
              </button>

              <div className="ws-menu__context-divider" />

              {/* ----- Exibir informações ----- */}
              <button
                type="button"
                aria-expanded={shortcutContext.showInfo}
                onClick={() =>
                  runShortcutContextAction('info')
                }
              >
                <span className="ws-menu__context-action-icon">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />
                    <path d="M12 11v6M12 7h.01" />
                  </svg>
                </span>
                {t('Informações')}
              </button>

              {/* ----- Detalhes do aplicativo ----- */}
              {shortcutContext.showInfo && (
                <div className="ws-menu__context-details">
                  <span>
                    {t('Tipo:')}{' '}
                    {app.category === 'system'
                      ? t('Aplicativo de Sistema')
                      : t('Aplicativo Desktop')}
                  </span>

                  <span>
                    {t('Estado:')}{' '}
                    {app.implemented
                      ? t('Implementado')
                      : t('Em desenvolvimento')}
                  </span>
                </div>
              )}
            </div>
          );
        })()}
    </section>
  );
}
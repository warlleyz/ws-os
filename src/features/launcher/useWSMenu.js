import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { openApp } from '../../core/appManager';
import { getRegisteredApps } from '../../core/appRegistry';
import {
  subscribeAdminSession,
  getAdminSessionVersion,
  isAdminAuthenticated,
} from '../../services/authService';

import { normalizeSearch } from '../search/searchService';
import useMenuPreferences from './useMenuPreferences';

/* === Gerenciamento do WS Menu === */
export default function useWSMenu({
  onAppAction,
  closePanels,
  menuOpen,
  appState,
}) {

  /* === Idioma e autenticação === */
  /* ----- Idioma do sistema ----- */
  const locale = useLocale();

  /* ----- Sincronização da sessão administrativa ----- */
  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionVersion,
    getAdminSessionVersion,
  );

  const authorized = isAdminAuthenticated();

  /* === Preferências do menu === */
  /* ----- Aplicativos favoritos ----- */
  const {
    favoriteIds,
    toggleFavorite,
    MAX_FAVORITES,
  } = useMenuPreferences();

  /* === Estados do WS Menu === */
  /* ----- Navegação e pesquisa ----- */
  const [menuView, setMenuView] = useState('home');
  const [menuSearch, setMenuSearch] = useState('');

  /* ----- Menu contextual ----- */
  const [shortcutContext, setShortcutContext] = useState(null);

  /* === Referências === */
  /* ----- Campo de pesquisa ----- */
  const menuSearchRef = useRef(null);

  /* ----- Menu contextual e elemento de origem ----- */
  const shortcutContextRef = useRef(null);
  const shortcutTriggerRef = useRef(null);

  /* === Histórico de aplicativos === */
  /* ----- Aplicativos utilizados recentemente ----- */
  const recentIds = [
    ...new Set(
      [...appState.focusHistory]
        .reverse()
        .map(
          (instanceId) =>
            appState.instances.find(
              (instance) => instance.id === instanceId,
            )?.appId,
        )
        .filter(Boolean),
    ),
  ].slice(0, 6);

  /* === Catálogo do WS Menu === */
  /* ----- Aplicativos disponíveis para a sessão ----- */
  const menuApps = getRegisteredApps()
    .filter(
      (app) =>
        (app.public && app.showInMenu !== false) ||
        (authorized && app.id === 'administration'),
    )
    .sort((a, b) =>
      t(a.name).localeCompare(t(b.name), locale),
    );

  /* === Pesquisa de aplicativos === */
  /* ----- Normalizar pesquisa ----- */
  const searchTerm = normalizeSearch(menuSearch.trim());

  /* ----- Filtrar resultados ----- */
  const searchResults = menuApps.filter((app) => {
    if (!searchTerm) return true;

    const searchableFields = [
      t(app.name),
      app.id,
      app.category === 'system'
        ? t('Aplicativo de Sistema')
        : t('Aplicativo Desktop'),
    ];

    return searchableFields.some((field) =>
      normalizeSearch(field).includes(searchTerm),
    );
  });

  /* === Listas de aplicativos === */
  /* ----- Resolver favoritos ----- */
  const favoriteApps = favoriteIds
    .map((id) =>
      menuApps.find((app) => app.id === id),
    )
    .filter(Boolean);

  /* ----- Resolver aplicativos recentes ----- */
  const recentApps = recentIds
    .map((id) =>
      menuApps.find((app) => app.id === id),
    )
    .filter(Boolean);

  /* ----- Selecionar lista visível ----- */
  const visibleMenuApps = searchTerm
    ? searchResults
    : menuView === 'all'
      ? menuApps
      : menuView === 'recent'
        ? recentApps
        : favoriteApps;

  /* === Menu contextual dos aplicativos === */
  /* ----- Abrir menu contextual ----- */
  function openShortcutContext(event, app) {
    event.preventDefault();

    const panel = event.currentTarget.closest(
      '.taskbar-launcher--redesign',
    );

    if (!panel) return;

    shortcutTriggerRef.current = event.currentTarget;

    const rect = panel.getBoundingClientRect();

    const width = 204;
    const estimatedHeight = 210;
    const padding = 8;

    const x = Math.max(
      padding,
      Math.min(
        event.clientX - rect.left,
        rect.width - width - padding,
      ),
    );

    const y = Math.max(
      padding,
      Math.min(
        event.clientY - rect.top,
        rect.height - estimatedHeight - padding,
      ),
    );

    setShortcutContext({
      appId: app.id,
      x,
      y,
      showInfo: false,
    });
  }

  /* ----- Executar ação contextual ----- */
  function runShortcutContextAction(action) {
    if (!shortcutContext) return;

    const appId = shortcutContext.appId;

    if (action === 'open') {
      onAppAction(openApp, appId);
      closePanels();
      return;
    }

    if (action === 'favorite') {
      toggleFavorite(appId);
      setShortcutContext(null);
      shortcutTriggerRef.current?.focus();
      return;
    }

    if (action === 'info') {
      setShortcutContext((current) =>
        current
          ? {
            ...current,
            showInfo: !current.showInfo,
          }
          : null,
      );
    }
  }

  /* === Gerenciamento do foco === */
  /* ----- Focar primeira ação do menu contextual ----- */
  useEffect(() => {
    if (!shortcutContext) return;

    shortcutContextRef.current
      ?.querySelector('button:not(:disabled)')
      ?.focus();
  }, [shortcutContext]);

  /* ----- Focar pesquisa ao abrir o WS Menu ----- */
  useEffect(() => {
    if (menuOpen) {
      menuSearchRef.current?.focus();
    }
  }, [menuOpen]);

  /* === Interface do hook === */
  return {
    favoriteIds,
    MAX_FAVORITES,
    menuView,
    setMenuView,
    menuSearch,
    setMenuSearch,
    shortcutContext,
    setShortcutContext,
    menuSearchRef,
    shortcutContextRef,
    shortcutTriggerRef,
    openShortcutContext,
    runShortcutContextAction,
    searchTerm,
    visibleMenuApps,
  };
}
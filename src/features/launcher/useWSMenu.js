import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { normalizeSearch } from '../search/searchService';
import useMenuPreferences from './useMenuPreferences';
import { useEffect, useRef, useState } from 'react';
import { openApp } from '../../core/appManager';
import { getRegisteredApps } from '../../core/appRegistry';

// Utilitários e preferências persistentes do WS Menu.
export default function useWSMenu({ onAppAction, closePanels, menuOpen }) {
  const locale = useLocale();
  const { favoriteIds, toggleFavorite, MAX_FAVORITES } = useMenuPreferences();
  const [menuView, setMenuView] = useState('home');
  const [menuSearch, setMenuSearch] = useState('');
  const [shortcutContext, setShortcutContext] = useState(null);
  const menuSearchRef = useRef(null);
  const shortcutContextRef = useRef(null);
  const shortcutTriggerRef = useRef(null);
  // Favoritos do WS Menu.

  function openShortcutContext(event, app) {
    event.preventDefault();
    const panel = event.currentTarget.closest('.taskbar-launcher--redesign');
    if (!panel) return;
    shortcutTriggerRef.current = event.currentTarget;
    const rect = panel.getBoundingClientRect();
    const width = 204;
    const estimatedHeight = 210;
    const padding = 8;
    const x = Math.max(padding, Math.min(event.clientX - rect.left, rect.width - width - padding));
    const y = Math.max(
      padding,
      Math.min(event.clientY - rect.top, rect.height - estimatedHeight - padding),
    );
    setShortcutContext({
      appId: app.id,
      x,
      y,
      showInfo: false,
    });
  }
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
  const menuApps = getRegisteredApps()
    .filter((app) => app.public && app.showInMenu !== false)
    .sort((a, b) => t(a.name).localeCompare(t(b.name), locale));
  const searchTerm = normalizeSearch(menuSearch.trim());
  const searchResults = menuApps.filter((app) => normalizeSearch(t(app.name)).includes(searchTerm));
  const favoriteApps = favoriteIds
    .map((id) => menuApps.find((app) => app.id === id))
    .filter(Boolean);
  const visibleMenuApps = searchTerm ? searchResults : menuView === 'all' ? menuApps : favoriteApps;
  useEffect(() => {
    if (!shortcutContext) return;
    shortcutContextRef.current?.querySelector('button:not(:disabled)')?.focus();
  }, [shortcutContext]);
  useEffect(() => {
    if (menuOpen) menuSearchRef.current?.focus();
  }, [menuOpen]);
  // Instâncias agrupadas por aplicativo na Taskbar.
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

import { useEffect, useState } from 'react';
const FAVORITES_STORAGE_KEY = 'ws-os:menu-favorites';
const MAX_FAVORITES = 6;
const DEFAULT_FAVORITES = ['about-me', 'projects', 'dev-insights', 'resume', 'files', 'notes'];
function getInitialFavorites() {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.filter((id) => typeof id === 'string'))].slice(0, MAX_FAVORITES);
      }
    }
  } catch {
    // Usa os favoritos padrão se o armazenamento estiver indisponível.
  }
  return DEFAULT_FAVORITES;
}
export default function useMenuPreferences() {
  const [favoriteIds, setFavoriteIds] = useState(getInitialFavorites);
  // Favoritos do WS Menu.
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // A seleção funciona durante a sessão, mesmo sem persistência.
    }
  }, [favoriteIds]);
  function toggleFavorite(appId) {
    setFavoriteIds((current) => {
      if (current.includes(appId)) {
        return current.filter((id) => id !== appId);
      }
      if (current.length >= MAX_FAVORITES) {
        return current;
      }
      return [...current, appId];
    });
  }
  return { favoriteIds, toggleFavorite, MAX_FAVORITES };
}

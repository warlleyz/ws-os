import { useEffect, useRef, useState } from 'react';
import { useSystem } from '../../core/useSystem';
const FAVORITES_STORAGE_KEY = 'ws-os:menu-favorites';
const MAX_FAVORITES = 6;
const DEFAULT_FAVORITES = ['about-me', 'projects', 'dev-insights', 'resume', 'files', 'notes'];
function getInitialFavorites() {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return [
          ...new Set(parsed.filter((id) => typeof id === 'string' && /^[a-z\d-]{1,80}$/.test(id))),
        ].slice(0, MAX_FAVORITES);
      }
    }
  } catch {
    // Usa os favoritos padrão se o armazenamento estiver indisponível.
  }
  return DEFAULT_FAVORITES;
}
export default function useMenuPreferences() {
  const { notify } = useSystem();
  const incoming = useRef(false);
  const warned = useRef(false);
  const [favoriteIds, setFavoriteIds] = useState(getInitialFavorites);
  /* === Sincronização de preferências públicas entre abas === */
  useEffect(() => {
    function update(event) {
      if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;
      if (event.storageArea && event.storageArea !== localStorage) return;
      incoming.current = true;
      setFavoriteIds(getInitialFavorites());
    }
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);
  useEffect(() => {
    if (incoming.current) {
      incoming.current = false;
      return;
    }
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
      warned.current = false;
    } catch {
      if (!warned.current) {
        warned.current = true;
        notify({
          title: 'Preferência não salva',
          message: 'Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.',
          source: 'Sistema',
          type: 'warning',
        });
      }
    }
  }, [favoriteIds, notify]);
  function toggleFavorite(appId) {
    if (typeof appId !== 'string' || !/^[a-z\d-]{1,80}$/.test(appId)) return;
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

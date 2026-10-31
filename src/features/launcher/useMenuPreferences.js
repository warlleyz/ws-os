import { useEffect, useRef, useState } from 'react';
import { useSystem } from '../../core/useSystem';

/* === Configuração dos favoritos === */
/* ----- Armazenamento e limites ----- */
const FAVORITES_STORAGE_KEY = 'ws-os:menu-favorites';
const MAX_FAVORITES = 6;

/* ----- Favoritos padrão ----- */
const DEFAULT_FAVORITES = [
  'about-me',
  'projects',
  'dev-insights',
  'resume',
  'files',
  'notes',
];

/* === Inicialização das preferências === */
/* ----- Recuperar favoritos armazenados ----- */
function getInitialFavorites() {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (saved !== null) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return [
          ...new Set(
            parsed.filter(
              (id) =>
                typeof id === 'string' &&
                /^[a-z\d-]{1,80}$/.test(id),
            ),
          ),
        ].slice(0, MAX_FAVORITES);
      }
    }
  } catch {
    return DEFAULT_FAVORITES;
  }

  return DEFAULT_FAVORITES;
}

/* === Gerenciamento das preferências do WS Menu === */
export default function useMenuPreferences() {

  /* === Serviços e referências === */
  /* ----- Notificações do sistema ----- */
  const { notify } = useSystem();

  /* ----- Controle da sincronização ----- */
  const incoming = useRef(false);
  const warned = useRef(false);

  /* ----- Estado dos favoritos ----- */
  const [favoriteIds, setFavoriteIds] = useState(
    getInitialFavorites,
  );

  /* === Sincronização entre abas === */
  /* ----- Atualizar favoritos a partir do armazenamento ----- */
  useEffect(() => {
    function update(event) {
      if (
        event.key !== FAVORITES_STORAGE_KEY &&
        event.key !== null
      ) {
        return;
      }

      if (
        event.storageArea &&
        event.storageArea !== localStorage
      ) {
        return;
      }

      incoming.current = true;
      setFavoriteIds(getInitialFavorites());
    }

    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener('storage', update);
    };
  }, []);

  /* === Persistência dos favoritos === */
  /* ----- Salvar alterações no armazenamento ----- */
  useEffect(() => {
    if (incoming.current) {
      incoming.current = false;
      return;
    }

    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds),
      );

      warned.current = false;
    } catch {
      if (!warned.current) {
        warned.current = true;

        notify({
          title: 'Preferência não salva',
          message:
            'Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.',
          source: 'Sistema',
          type: 'warning',
        });
      }
    }
  }, [favoriteIds, notify]);

  /* === Gerenciamento dos favoritos === */
  /* ----- Fixar ou desafixar aplicativo ----- */
  function toggleFavorite(appId) {
    if (
      typeof appId !== 'string' ||
      !/^[a-z\d-]{1,80}$/.test(appId)
    ) {
      return;
    }

    setFavoriteIds((current) => {

      /* ----- Remover aplicativo favorito ----- */
      if (current.includes(appId)) {
        return current.filter((id) => id !== appId);
      }

      /* ----- Respeitar limite de favoritos ----- */
      if (current.length >= MAX_FAVORITES) {
        return current;
      }

      /* ----- Adicionar aplicativo favorito ----- */
      return [...current, appId];
    });
  }

  /* === Interface do hook === */
  return {
    favoriteIds,
    toggleFavorite,
    MAX_FAVORITES,
  };
}
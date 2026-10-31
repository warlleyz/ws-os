import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  listLocalFiles,
  localFilesRevision,
  subscribeLocalFiles,
} from '../../services/storage/localFilesStorage';

/* === ARQUIVOS LOCAIS === */
export default function useLocalFiles() {
  
  /* ----- ESTADO E ASSINATURAS ----- */
  const revision = useSyncExternalStore(
    subscribeLocalFiles,
    localFilesRevision,
    () => 0,
  );

  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState({
    entries: [],
    loading: true,
    error: '',
  });

  /* === CARREGAMENTO DOS ARQUIVOS === */
  /* ----- CONSULTA AO ARMAZENAMENTO ----- */
  useEffect(() => {
    let active = true;

    listLocalFiles()
      .then((entries) => {
        if (active) {
          setState({ entries, loading: false, error: '' });
        }
      })
      .catch((error) => {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error.message,
          }));
        }
      });

    /* ----- CANCELAMENTO DA ATUALIZAÇÃO ----- */
    return () => {
      active = false;
    };
  }, [revision, attempt]);

  /* === RETORNO DO HOOK === */
  return {
    ...state,
    refresh: () => setAttempt((value) => value + 1),
  };
}
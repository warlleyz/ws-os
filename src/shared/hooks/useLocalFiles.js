import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  listLocalFiles,
  localFilesRevision,
  subscribeLocalFiles,
} from '../../services/storage/localFilesStorage';
export default function useLocalFiles() {
  const revision = useSyncExternalStore(subscribeLocalFiles, localFilesRevision, () => 0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ entries: [], loading: true, error: '' });
  useEffect(() => {
    let active = true;
    listLocalFiles()
      .then((entries) => {
        if (active) setState({ entries, loading: false, error: '' });
      })
      .catch((error) => {
        if (active) setState((current) => ({ ...current, loading: false, error: error.message }));
      });
    return () => {
      active = false;
    };
  }, [revision, attempt]);
  return { ...state, refresh: () => setAttempt((value) => value + 1) };
}

import { subscribePublicData } from '../../services/publicDataService';
import { useEffect, useState } from 'react';
import { fetchManagedContent } from '../../services/contentService';
export default function useCalendarEvents() {
  const [result, setResult] = useState({ data: [], error: false, warning: '' });
  useEffect(() => {
    let controller;
    function load() {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      fetchManagedContent('events', { signal: current.signal, force: true })
        .then((value) => {
          if (!current.signal.aborted)
            setResult({ data: value.data, error: false, warning: value.warning ?? '' });
        })
        .catch(() => {
          if (!current.signal.aborted) setResult({ data: [], error: true, warning: '' });
        });
    }
    load();
    const unsubscribe = subscribePublicData(({ prefix }) => {
      if (prefix.startsWith('/api/content')) load();
    });
    return () => {
      controller?.abort();
      unsubscribe();
    };
  }, []);
  return result;
}

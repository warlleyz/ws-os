import { useEffect, useState } from 'react';
import { fetchManagedContent } from '../../services/contentService';
export default function useCalendarEvents() {
  const [result, setResult] = useState({ data: [], error: false });
  useEffect(() => {
    let controller;
    function load() {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      fetchManagedContent('events', { signal: current.signal, force: true })
        .then((value) => {
          if (!current.signal.aborted) setResult({ data: value.data, error: false });
        })
        .catch(() => {
          if (!current.signal.aborted) setResult((previous) => ({ ...previous, error: true }));
        });
    }
    load();
    window.addEventListener('ws-os:content-changed', load);
    return () => {
      controller?.abort();
      window.removeEventListener('ws-os:content-changed', load);
    };
  }, []);
  return result;
}

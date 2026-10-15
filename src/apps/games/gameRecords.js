import { useEffect, useState, useSyncExternalStore } from 'react';
const KEY = 'ws-os:game-records';
const ids = ['snake', 'memory', 'mines', 'flappy', 'solitaire'];
function load() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return Object.fromEntries(
      Object.entries(value ?? {}).filter(
        ([id, score]) => ids.includes(id) && Number.isSafeInteger(score) && score >= 0,
      ),
    );
  } catch {
    return {};
  }
}
let records = load(),
  failed = false;
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export function saveGameRecord(id, score) {
  if (!ids.includes(id) || !Number.isSafeInteger(score) || score < 0) return false;
  const lower = ['memory', 'mines', 'solitaire'].includes(id);
  if (records[id] !== undefined && (lower ? score >= records[id] : score <= records[id]))
    return true;
  records = { ...records, [id]: score };
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
    failed = false;
  } catch {
    failed = true;
  }
  listeners.forEach((listener) => listener());
  return !failed;
}
export function useGameRecord(id, score, finished) {
  const record = useSyncExternalStore(
    subscribe,
    () => records[id] ?? null,
    () => null,
  );
  const error = useSyncExternalStore(
    subscribe,
    () => failed,
    () => false,
  );
  useEffect(() => {
    if (finished) saveGameRecord(id, score);
  }, [id, score, finished]);
  return { record, error };
}
export function useGamePaused(instance) {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return !visible || instance?.executionState === 'paused';
}

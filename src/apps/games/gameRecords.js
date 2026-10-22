import { useEffect, useState, useSyncExternalStore } from 'react';
/* === Recordes locais: maior pontuação ou menor número de jogadas === */
const KEY = 'ws-os:game-records';
const ids = ['snake', 'memory', 'mines', 'flappy', 'solitaire'];
const lowerIsBetter = (id) => ['memory', 'mines', 'solitaire'].includes(id);
const validRecord = (id, score) =>
  ids.includes(id) && Number.isSafeInteger(score) && score >= (lowerIsBetter(id) ? 1 : 0);
function load() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && stored.length > 4096) return {};
    const value = JSON.parse(stored ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value ?? {}).filter(([id, score]) => validRecord(id, score)),
    );
  } catch {
    return {};
  }
}
let records = load(),
  failed = false;
const listeners = new Set();
function mergeRecords(left, right) {
  const next = { ...left };
  for (const [id, score] of Object.entries(right)) {
    const lower = lowerIsBetter(id);
    next[id] =
      next[id] === undefined
        ? score
        : lower
          ? Math.min(next[id], score)
          : Math.max(next[id], score);
  }
  return next;
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
    failed = false;
  } catch {
    failed = true;
  }
  listeners.forEach((listener) => listener());
  return !failed;
}
function synchronize(event) {
  if (event.key !== KEY && event.key !== null) return;
  if (event.storageArea && event.storageArea !== localStorage) return;
  if (event.newValue === null) {
    records = {};
    failed = false;
    listeners.forEach((listener) => listener());
    return;
  }
  const stored = load();
  records = mergeRecords(records, stored);
  /* ----- Recuperação de marcas melhores ou ausentes ----- */
  if (ids.some((id) => records[id] !== stored[id])) persist();
  else {
    failed = false;
    listeners.forEach((listener) => listener());
  }
}
const subscribe = (listener) => {
  if (!listeners.size && typeof window !== 'undefined') {
    /* ----- Retomada após intervalo sem assinantes ----- */
    records = mergeRecords(records, load());
    window.addEventListener('storage', synchronize);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== 'undefined')
      window.removeEventListener('storage', synchronize);
  };
};
export function saveGameRecord(id, score) {
  if (!validRecord(id, score)) return false;
  records = mergeRecords(mergeRecords(records, load()), { [id]: score });
  /* ----- Nova tentativa de persistência conserva a melhor marca da sessão ----- */
  return persist();
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
/* === Pausa automática por visibilidade e ciclo de vida do Core === */
export function useGamePaused(instance) {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return !visible || instance?.executionState === 'paused';
}

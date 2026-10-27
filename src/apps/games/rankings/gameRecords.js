import { useEffect, useSyncExternalStore } from 'react';

import {
  getRankingConfig,
  isBetterRankingScore,
  isValidRankingScore,
} from './rankingConfig';

/* === CONFIGURAÇÃO DO ARMAZENAMENTO === */
const STORAGE_KEY = 'ws-os:game-records';
const STORAGE_LIMIT = 4096;

/* === ESTADO COMPARTILHADO DOS RECORDES === */
const listeners = new Set();

let records = readStoredRecords();
let storageError = false;

/* === VALIDAÇÃO DOS RECORDES ARMAZENADOS === */
function isValidStoredRecord(gameId, score) {
  if (isValidRankingScore(gameId, score)) {
    return true;
  }

  /* ----- COMPATIBILIDADE COM PONTUAÇÕES ZERO DO FORMATO ANTERIOR ----- */
  return (
    (gameId === 'snake' || gameId === 'flappy') &&
    score === 0
  );
}

/* === LEITURA DOS RECORDES LOCAIS === */
function readStoredRecords() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored || stored.length > STORAGE_LIMIT) {
      return {};
    }

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([gameId, score]) =>
        isValidStoredRecord(gameId, score),
      ),
    );
  } catch {
    return {};
  }
}

/* === NOTIFICAÇÃO DOS COMPONENTES === */
function notifyListeners() {
  listeners.forEach((listener) => listener());
}

/* === COMPARAÇÃO E CONSOLIDAÇÃO DOS RECORDES === */
function mergeRecords(current, incoming) {
  const merged = { ...current };

  for (const [gameId, score] of Object.entries(incoming)) {
    if (!isValidStoredRecord(gameId, score)) {
      continue;
    }

    const previous = merged[gameId];

    if (
      previous === undefined ||
      isBetterRankingScore(gameId, score, previous)
    ) {
      merged[gameId] = score;
    }
  }

  return merged;
}

/* === VERIFICAÇÃO DE ALTERAÇÕES === */
function recordsChanged(current, next) {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);

  if (currentKeys.length !== nextKeys.length) {
    return true;
  }

  return nextKeys.some((gameId) => current[gameId] !== next[gameId]);
}

/* === PERSISTÊNCIA DOS RECORDES === */
function persistRecords() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records),
    );

    storageError = false;
  } catch {
    storageError = true;
  }

  notifyListeners();

  return !storageError;
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
function synchronizeRecords(event) {
  if (
    event.key !== STORAGE_KEY &&
    event.key !== null
  ) {
    return;
  }

  if (
    event.storageArea &&
    event.storageArea !== window.localStorage
  ) {
    return;
  }

  if (event.newValue === null) {
    records = {};
    storageError = false;
    notifyListeners();
    return;
  }

  const stored = readStoredRecords();
  const merged = mergeRecords(records, stored);

  records = merged;
  storageError = false;

  if (recordsChanged(stored, merged)) {
    persistRecords();
    return;
  }

  notifyListeners();
}

/* === ASSINATURA DAS ALTERAÇÕES === */
function subscribe(listener) {
  if (listeners.size === 0 && typeof window !== 'undefined') {
    records = mergeRecords(records, readStoredRecords());

    window.addEventListener('storage', synchronizeRecords);
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', synchronizeRecords);
    }
  };
}

/* === CONSULTA DE RECORDES === */
export function getGameRecord(gameId) {
  const config = getRankingConfig(gameId);

  if (!config?.enabled) {
    return null;
  }

  return records[gameId] ?? null;
}

/* === SALVAMENTO DE RECORDES === */
export function saveGameRecord(gameId, score) {
  if (!isValidRankingScore(gameId, score)) {
    return false;
  }

  const stored = readStoredRecords();

  records = mergeRecords(records, stored);

  const previous = records[gameId];

  if (
    previous === undefined ||
    isBetterRankingScore(gameId, score, previous)
  ) {
    records = {
      ...records,
      [gameId]: score,
    };
  }

  return persistRecords();
}

/* === HOOK DE RECORDES === */
export function useGameRecord(gameId, score, finished = false) {
  const record = useSyncExternalStore(
    subscribe,
    () => getGameRecord(gameId),
    () => null,
  );

  const error = useSyncExternalStore(
    subscribe,
    () => storageError,
    () => false,
  );

  useEffect(() => {
    if (finished) {
      saveGameRecord(gameId, score);
    }
  }, [gameId, score, finished]);

  return {
    record,
    error,
  };
}
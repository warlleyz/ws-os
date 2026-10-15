import { useSyncExternalStore } from 'react';
import english from './locales/en.json';

export const LOCALES = ['pt-BR', 'en'];
const STORAGE_KEY = 'ws-os:locale';
function loadLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LOCALES.includes(saved) ? saved : 'pt-BR';
  } catch {
    return 'pt-BR';
  }
}
let currentLocale = loadLocale();
const listeners = new Set();
export function getLocale() {
  return currentLocale;
}
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export function useLocale() {
  return useSyncExternalStore(subscribe, getLocale, () => 'pt-BR');
}
export function setLocale(locale) {
  if (!LOCALES.includes(locale)) return false;
  currentLocale = locale;
  document.documentElement.lang = locale;
  let saved = true;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    saved = false;
  }
  listeners.forEach((listener) => listener());
  return saved;
}
const reverse = new Map(Object.entries(english).map(([source, target]) => [target, source]));
function pattern(text) {
  return new RegExp(
    '^' +
      text
        .split(/(\{\d+\})/)
        .map((part) =>
          /^\{\d+\}$/.test(part) ? '(.*?)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        )
        .join('') +
      '$',
  );
}
const templates = Object.entries(english)
  .filter(([source]) => /\{\d+\}/.test(source))
  .sort((a, b) => b[0].length - a[0].length)
  .map(([source, target]) => ({
    source,
    target,
    sourcePattern: pattern(source),
    targetPattern: pattern(target),
  }));
const cache = new Map();
export function translate(value) {
  if (typeof value !== 'string' || !value) return value;
  const key = currentLocale + ':' + value;
  if (cache.has(key)) return cache.get(key);
  const source = reverse.get(value) ?? value;
  let result =
    currentLocale === 'en' ? (Object.hasOwn(english, source) ? english[source] : value) : source;
  if (result === value && !Object.hasOwn(english, source)) {
    for (const entry of templates) {
      const match = value.match(entry.sourcePattern) ?? value.match(entry.targetPattern);
      if (!match) continue;
      result = (currentLocale === 'en' ? entry.target : entry.source).replace(
        /\{(\d+)\}/g,
        (_token, index) => translate(match[Number(index) + 1] ?? ''),
      );
      break;
    }
  }
  if (cache.size > 1000) cache.clear();
  cache.set(key, result);
  return result;
}

import { useSyncExternalStore } from 'react';
import portuguese from './locales/pt-BR.json';
import english from './locales/en.json';

/* === CONFIGURAÇÃO === */
export const LOCALES = ['pt-BR', 'en'];

const STORAGE_KEY = 'ws-os:locale';
const CACHE_LIMIT = 1000;
const DEFAULT_LOCALE = 'pt-BR';

/* === PERSISTÊNCIA === */
/* ----- LEITURA DO IDIOMA ----- */
function loadLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/* === ESTADO E ASSINATURAS === */
let currentLocale = loadLocale();

const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocale() {
  return currentLocale;
}

export function useLocale() {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}

/* ----- ALTERAÇÃO DO IDIOMA ----- */
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

  notifyListeners();
  return saved;
}

/* === DICIONÁRIO DE TRADUÇÕES === */
/* ----- NORMALIZAÇÃO DAS CATEGORIAS ----- */
function flattenDictionary(dictionary, prefix = '') {
  const entries = [];

  for (const [key, value] of Object.entries(dictionary)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      entries.push([path, value]);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenDictionary(value, path));
    }
  }

  return entries;
}

/* ----- MAPEAMENTO DOS IDIOMAS ----- */
const portugueseEntries = new Map(flattenDictionary(portuguese));
const englishEntries = new Map(flattenDictionary(english));

const translations = new Map();

for (const [path, source] of portugueseEntries) {
  const target = englishEntries.get(path);

  if (typeof target === 'string') {
    translations.set(source, target);
  }
}

/* ----- MAPEAMENTO INVERSO ----- */
const reverse = new Map(
  [...translations].map(([source, target]) => [target, source]),
);

/* ----- TRADUÇÕES POR CHAVE ----- */
const dictionaries = {
  'pt-BR': portugueseEntries,
  en: englishEntries,
};

/* ----- EXPRESSÕES REGULARES ----- */
function pattern(text) {
  return new RegExp(
    '^' +
    text
      .split(/(\{\d+\})/)
      .map((part) =>
        /^\{\d+\}$/.test(part)
          ? '(.*?)'
          : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      )
      .join('') +
    '$',
  );
}

/* ----- TRADUÇÕES COM PARÂMETROS ----- */
const templates = [...translations]
  .filter(([source]) => /\{\d+\}/.test(source))
  .sort((a, b) => b[0].length - a[0].length)
  .map(([source, target]) => ({
    source,
    target,
    sourcePattern: pattern(source),
    targetPattern: pattern(target),
  }));

/* === TRADUÇÃO === */
/* ----- CACHE ----- */
const cache = new Map();

/* ----- RESOLUÇÃO DE TEXTOS ----- */
export function translate(value) {
  if (typeof value !== 'string' || !value) return value;

  const key = `${currentLocale}:${value}`;

  if (cache.has(key)) return cache.get(key);

  const dictionary = dictionaries[currentLocale];

  if (dictionary.has(value)) {
    const result = dictionary.get(value);

    if (cache.size > CACHE_LIMIT) cache.clear();
    cache.set(key, result);

    return result;
  }

  const source = reverse.get(value) ?? value;

  let result =
    currentLocale === 'en'
      ? translations.get(source) ?? value
      : source;

  /* ----- RESOLUÇÃO DE PARÂMETROS ----- */
  if (result === value && !translations.has(source)) {
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

  /* ----- ATUALIZAÇÃO DO CACHE ----- */
  if (cache.size > CACHE_LIMIT) cache.clear();

  cache.set(key, result);
  return result;
}

/* === SINCRONIZAÇÃO ENTRE ABAS === */
/* ----- ALTERAÇÕES NO ARMAZENAMENTO ----- */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;

    currentLocale = loadLocale();
    document.documentElement.lang = currentLocale;

    notifyListeners();
  });
}
// Preferências pequenas: falhas de leitura/escrita nunca impedem o uso da sessão.
export function readPreference(key) {
  try {
    return { value: localStorage.getItem(key), error: null };
  } catch {
    return { value: null, error: 'unavailable' };
  }
}

export function writePreference(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

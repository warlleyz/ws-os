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


/**
 * Grava várias preferências com tentativa de recuperação
 * caso alguma escrita falhe.
 *
 * Não representa uma transação atômica do localStorage.
 */
export function writePreferencesBatch(entries) {
  if (
    !Array.isArray(entries) ||
    entries.length === 0 ||
    entries.some(
      (entry) =>
        !entry ||
        typeof entry.key !== 'string' ||
        !entry.key ||
        typeof entry.value !== 'string',
    )
  ) {
    return {
      ok: false,
      restored: true,
      reason: 'invalid',
    };
  }

  const keys = entries.map((entry) => entry.key);

  if (new Set(keys).size !== keys.length) {
    return {
      ok: false,
      restored: true,
      reason: 'duplicate',
    };
  }

  const previous = new Map();

  try {
    // Obter todos os valores antigos antes de escrever.
    for (const key of keys) {
      previous.set(key, localStorage.getItem(key));
    }
  } catch {
    return {
      ok: false,
      restored: false,
      reason: 'snapshot',
    };
  }

  const written = [];

  try {
    for (const { key, value } of entries) {
      localStorage.setItem(key, value);
      written.push(key);
    }

    return {
      ok: true,
      restored: true,
      reason: null,
    };
  } catch {
    let restored = true;

    // Reverter somente as chaves que foram
    // efetivamente escritas nesta operação.
    for (const key of written.reverse()) {
      try {
        const oldValue = previous.get(key);

        if (oldValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, oldValue);
        }
      } catch {
        restored = false;
      }
    }

    return {
      ok: false,
      restored,
      reason: 'write',
    };
  }
}

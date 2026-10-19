/* === Validações de fronteira dos contratos === */
export function isRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

export function validId(value) {
  return typeof value === 'string' && /^[a-z\d][a-z\d._:-]{0,199}$/i.test(value);
}
export function validText(value, max = 2000, min = 0) {
  return typeof value === 'string' && value.trim().length >= min && value.length <= max;
}
export function validInstant(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    validDate(value.slice(0, 10)) &&
    Number(value.slice(11, 13)) < 24
  );
}
export function validDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d\d-\d\d$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validTimezone(value) {
  if (!validText(value, 100, 1)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function validLocalizedText(value, max = 2000, required = false) {
  if (typeof value === 'string') return validText(value, max, required ? 1 : 0);
  return (
    isRecord(value) &&
    Object.keys(value).length > 0 &&
    Object.keys(value).every(
      (key) => ['pt-BR', 'en'].includes(key) && validText(value[key], max),
    ) &&
    (!required || Object.values(value).some((text) => text.trim()))
  );
}

/* ----- Dados JSON: sem funções, referências cíclicas ou protótipos executáveis ----- */
export function isContractData(value, depth = 0) {
  if (depth > 15) return false;
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value))
    return value.length <= 500 && value.every((item) => isContractData(item, depth + 1));
  return (
    isRecord(value) &&
    Object.keys(value).length <= 500 &&
    Object.entries(value).every(
      ([key, item]) =>
        !['__proto__', 'prototype', 'constructor'].includes(key) && isContractData(item, depth + 1),
    )
  );
}

export function contractError(code) {
  return { ok: false, code };
}

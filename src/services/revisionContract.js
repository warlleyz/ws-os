/* === Códigos de controle de revisão === */
/* ----- Erros estáveis ----- */
export const REVISION_ERRORS = Object.freeze({
  INVALID_REVISION: 'INVALID_REVISION',
  REVISION_CONFLICT: 'REVISION_CONFLICT',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
});

/* === Validação de revisões === */
/* ----- Número de revisão válido ----- */
export function isValidRevision(revision) {
  return Number.isSafeInteger(revision) && revision >= 1;
}

/* ----- Verificação de concorrência ----- */
export function validateRevision(expectedRevision, currentRevision) {
  if (!isValidRevision(expectedRevision) || !isValidRevision(currentRevision)) {
    return {
      ok: false,
      code: REVISION_ERRORS.INVALID_REVISION,
    };
  }

  if (expectedRevision !== currentRevision) {
    return {
      ok: false,
      code: REVISION_ERRORS.REVISION_CONFLICT,
      expectedRevision,
      currentRevision,
    };
  }

  return {
    ok: true,
    revision: currentRevision,
  };
}

/* === Atualização controlada === */
/* ----- Preparação de nova revisão ----- */
export function prepareRevisionUpdate(expectedRevision, currentRevision) {
  const validation = validateRevision(expectedRevision, currentRevision);

  if (!validation.ok) return validation;

  if (!isValidRevision(currentRevision + 1)) {
    return {
      ok: false,
      code: REVISION_ERRORS.INVALID_REVISION,
    };
  }

  return {
    ok: true,
    previousRevision: currentRevision,
    nextRevision: currentRevision + 1,
  };
}

/* === Conflitos de atualização === */
/* ----- Resultado estruturado ----- */
export function createRevisionConflict(expectedRevision, currentRevision) {
  const validation = validateRevision(expectedRevision, currentRevision);

  if (validation.ok) return null;

  return {
    ok: false,
    code: validation.code,
    expectedRevision,
    currentRevision,
  };
}

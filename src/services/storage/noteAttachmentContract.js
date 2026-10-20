import { MANAGED_FILE_LIMIT, MAX_POST_ATTACHMENTS } from './managedFileContract.js';

/* === Formatos permitidos === */
/* ----- Extensões e tipos MIME ----- */
export const NOTE_ATTACHMENT_TYPES = Object.freeze({
  pdf: 'application/pdf',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
});

/* === Códigos de validação === */
/* ----- Erros estáveis ----- */
export const NOTE_ATTACHMENT_ERRORS = Object.freeze({
  INVALID_LIST: 'INVALID_ATTACHMENT_LIST',
  TOO_MANY: 'TOO_MANY_ATTACHMENTS',
  INVALID_ATTACHMENT: 'INVALID_ATTACHMENT',
  INVALID_TYPE: 'INVALID_ATTACHMENT_TYPE',
  TOO_LARGE: 'ATTACHMENT_TOO_LARGE',
  DUPLICATE: 'DUPLICATE_ATTACHMENT',
});

/* === Validação individual === */
/* ----- Referência pública do anexo ----- */
export function validateNoteAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment)) {
    return {
      ok: false,
      code: NOTE_ATTACHMENT_ERRORS.INVALID_ATTACHMENT,
    };
  }

  const { resourceId, name, mimeType, size } = attachment;

  /* ----- Campos permitidos ----- */
  const allowedFields = ['resourceId', 'name', 'mimeType', 'size'];

  if (
    Object.keys(attachment).some((field) => !allowedFields.includes(field)) ||
    typeof resourceId !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$/.test(resourceId) ||
    typeof name !== 'string' ||
    !name.trim() ||
    name.length > 255 ||
    /[\\/]/.test(name) ||
    typeof mimeType !== 'string' ||
    !Number.isSafeInteger(size) ||
    size < 0
  ) {
    return {
      ok: false,
      code: NOTE_ATTACHMENT_ERRORS.INVALID_ATTACHMENT,
    };
  }

  /* ----- Limite individual ----- */
  if (size > MANAGED_FILE_LIMIT) {
    return {
      ok: false,
      code: NOTE_ATTACHMENT_ERRORS.TOO_LARGE,
    };
  }

  /* ----- Compatibilidade de formato ----- */
  const extension = name.split('.').at(-1)?.toLowerCase();
  const expectedMime = NOTE_ATTACHMENT_TYPES[extension];

  if (!expectedMime || mimeType.toLowerCase() !== expectedMime) {
    return {
      ok: false,
      code: NOTE_ATTACHMENT_ERRORS.INVALID_TYPE,
    };
  }

  return {
    ok: true,
    attachment: {
      resourceId,
      name,
      mimeType: expectedMime,
      size,
    },
  };
}

/* === Validação da publicação === */
/* ----- Coleção de anexos ----- */
export function validateNoteAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return {
      ok: false,
      code: NOTE_ATTACHMENT_ERRORS.INVALID_LIST,
    };
  }

  if (attachments.length > MAX_POST_ATTACHMENTS) {
    return {
      ok: false,
      code: NOTE_ATTACHMENT_ERRORS.TOO_MANY,
    };
  }

  const validated = [];
  const identifiers = new Set();

  for (const attachment of attachments) {
    /* ----- Validação individual ----- */
    const result = validateNoteAttachment(attachment);

    if (!result.ok) return result;

    /* ----- Prevenção de referências duplicadas ----- */
    if (identifiers.has(result.attachment.resourceId)) {
      return {
        ok: false,
        code: NOTE_ATTACHMENT_ERRORS.DUPLICATE,
      };
    }

    identifiers.add(result.attachment.resourceId);
    validated.push(result.attachment);
  }

  return {
    ok: true,
    attachments: validated,
  };
}

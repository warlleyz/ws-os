/* === Tipos de recursos === */
export const FILE_RESOURCE_SOURCES = Object.freeze({
    LOCAL: 'local',
    STATIC: 'static',
    MANAGED: 'managed',
});

/* === Validação de identificadores === */
/* ----- Identificador público ----- */
function isValidIdentifier(value) {
    return (
        typeof value === 'string' &&
        value.length <= 200 &&
        /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value)
    );
}

/* === Validação de descritores === */
/* ----- Estrutura do recurso ----- */
export function validateFileResource(resource) {
    if (
        !resource ||
        typeof resource !== 'object' ||
        Array.isArray(resource)
    ) {
        return {
            ok: false,
            code: 'INVALID_FILE_RESOURCE',
        };
    }

    const keys = Object.keys(resource);

    /* ----- Arquivo pessoal ----- */
    if (resource.source === FILE_RESOURCE_SOURCES.LOCAL) {
        const valid =
            keys.length === 2 &&
            keys.includes('source') &&
            keys.includes('fileId') &&
            isValidIdentifier(resource.fileId);

        return valid
            ? { ok: true, resource: { source: 'local', fileId: resource.fileId } }
            : { ok: false, code: 'INVALID_FILE_RESOURCE' };
    }

    /* ----- Documento oficial estático ----- */
    if (resource.source === FILE_RESOURCE_SOURCES.STATIC) {
        const valid =
            keys.length === 2 &&
            keys.includes('source') &&
            keys.includes('catalogId') &&
            isValidIdentifier(resource.catalogId);

        return valid
            ? { ok: true, resource: { source: 'static', catalogId: resource.catalogId } }
            : { ok: false, code: 'INVALID_FILE_RESOURCE' };
    }

    /* ----- Arquivo oficial gerenciado ----- */
    if (resource.source === FILE_RESOURCE_SOURCES.MANAGED) {
        const valid =
            keys.length === 2 &&
            keys.includes('source') &&
            keys.includes('resourceId') &&
            isValidIdentifier(resource.resourceId);

        return valid
            ? { ok: true, resource: { source: 'managed', resourceId: resource.resourceId } }
            : { ok: false, code: 'INVALID_FILE_RESOURCE' };
    }

    return {
        ok: false,
        code: 'INVALID_FILE_RESOURCE_SOURCE',
    };
}

/* === Criação de descritores === */
/* ----- Normalização segura ----- */
export function createFileResource(source, identifier) {
    const field = {
        local: 'fileId',
        static: 'catalogId',
        managed: 'resourceId',
    }[source];

    if (!field) {
        return {
            ok: false,
            code: 'INVALID_FILE_RESOURCE_SOURCE',
        };
    }

    return validateFileResource({
        source,
        [field]: identifier,
    });
}
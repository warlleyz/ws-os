/* === Limites dos arquivos gerenciados === */
/* ----- Restrições de upload ----- */
export const MANAGED_FILE_LIMIT = 10 * 1024 * 1024;
export const MAX_POST_ATTACHMENTS = 5;

/* === Estados de armazenamento === */
/* ----- Ciclo de vida técnico ----- */
export const MANAGED_FILE_STATES = Object.freeze({
    PENDING: 'pending',
    UPLOADING: 'uploading',
    AVAILABLE: 'available',
    FAILED: 'failed',
    DELETING: 'deleting',
    DELETED: 'deleted',
});

/* === Estados editoriais === */
/* ----- Política de publicação ----- */
export const MANAGED_FILE_VISIBILITY = Object.freeze({
    PRIVATE: 'private',
    PUBLIC: 'public',
});

/* === Códigos de resultado === */
/* ----- Erros estáveis de acesso ----- */
export const MANAGED_FILE_ERRORS = Object.freeze({
    INVALID_RESOURCE: 'INVALID_FILE_RESOURCE',
    NOT_FOUND: 'MANAGED_FILE_NOT_FOUND',
    ACCESS_DENIED: 'MANAGED_FILE_ACCESS_DENIED',
    UNAVAILABLE: 'MANAGED_FILE_UNAVAILABLE',
    CONFLICT: 'MANAGED_FILE_CONFLICT',
    TOO_LARGE: 'MANAGED_FILE_TOO_LARGE',
    UNSUPPORTED_TYPE: 'MANAGED_FILE_UNSUPPORTED_TYPE',
});

/* === Validação de metadados === */
/* ----- Estrutura de registro público ----- */
export function validateManagedFileMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return { ok: false, code: 'INVALID_MANAGED_FILE_METADATA' };
    }

    const {
        resourceId,
        name,
        mimeType,
        size,
        state,
        visibility,
    } = metadata;

    const valid =
        typeof resourceId === 'string' &&
        /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$/.test(resourceId) &&
        typeof name === 'string' &&
        name.trim().length > 0 &&
        name.length <= 255 &&
        typeof mimeType === 'string' &&
        mimeType.trim().length > 0 &&
        Number.isSafeInteger(size) &&
        size >= 0 &&
        size <= MANAGED_FILE_LIMIT &&
        Object.values(MANAGED_FILE_STATES).includes(state) &&
        Object.values(MANAGED_FILE_VISIBILITY).includes(visibility) &&
        !Object.hasOwn(metadata, 'storageKey');

    if (!valid) {
        return { ok: false, code: 'INVALID_MANAGED_FILE_METADATA' };
    }

    return {
        ok: true,
        metadata: {
            resourceId,
            name,
            mimeType,
            size,
            state,
            visibility,
        },
    };
}

/* === Política de disponibilidade === */
/* ----- Recursos prontos para acesso ----- */
export function isManagedFileAvailable(metadata) {
    const validation = validateManagedFileMetadata(metadata);

    return validation.ok &&
        validation.metadata.state === MANAGED_FILE_STATES.AVAILABLE;
}

/* ----- Publicação efetiva ----- */
export function isManagedFilePublic(metadata) {
    const validation = validateManagedFileMetadata(metadata);

    return (
        validation.ok &&
        validation.metadata.state === MANAGED_FILE_STATES.AVAILABLE &&
        validation.metadata.visibility === MANAGED_FILE_VISIBILITY.PUBLIC
    );
}


/* === Transições de armazenamento === */
/* ----- Fluxos permitidos ----- */
const MANAGED_FILE_TRANSITIONS = Object.freeze({
    pending: ['uploading', 'failed', 'deleting'],
    uploading: ['available', 'failed', 'deleting'],
    available: ['deleting'],
    failed: ['pending', 'deleting'],
    deleting: ['deleted', 'failed'],
    deleted: [],
});

/* ----- Validação da mudança de estado ----- */
export function canTransitionManagedFile(currentState, nextState) {
    const allowed = MANAGED_FILE_TRANSITIONS[currentState];

    return Array.isArray(allowed) && allowed.includes(nextState);
}

/* ----- Aplicação da transição ----- */
export function transitionManagedFile(metadata, nextState) {
    const validation = validateManagedFileMetadata(metadata);

    if (!validation.ok) {
        return {
            ok: false,
            code: 'INVALID_MANAGED_FILE_METADATA',
        };
    }

    if (!canTransitionManagedFile(metadata.state, nextState)) {
        return {
            ok: false,
            code: 'MANAGED_FILE_INVALID_TRANSITION',
        };
    }

    return {
        ok: true,
        metadata: {
            ...validation.metadata,
            state: nextState,
        },
    };
}

/* === Recuperação de operações === */
/* ----- Estados que exigem reconciliação ----- */
export function requiresManagedFileReconciliation(state) {
    return [
        MANAGED_FILE_STATES.UPLOADING,
        MANAGED_FILE_STATES.FAILED,
        MANAGED_FILE_STATES.DELETING,
    ].includes(state);
}

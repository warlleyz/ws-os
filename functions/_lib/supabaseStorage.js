
/* === Armazenamento privado de arquivos oficiais === */
const STORAGE_BUCKET = 'ws-os-official-files';
const STORAGE_TIMEOUT = 20000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp',
]);

const OBJECT_KEY_PATTERN =
    /^official\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

/* === Configuração do serviço === */
/* ----- Validação das credenciais ----- */
export function isStorageConfigured(env) {
    return (
        /^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(
            env?.SUPABASE_URL ?? '',
        ) &&
        typeof env?.SUPABASE_SERVICE_ROLE_KEY === 'string' &&
        env.SUPABASE_SERVICE_ROLE_KEY.length > 0
    );
}

/* ----- Obtenção da configuração privada ----- */
function getStorageConfig(env) {
    if (!isStorageConfigured(env)) {
        throw Error('FILES_NOT_CONFIGURED');
    }

    return {
        baseUrl: env.SUPABASE_URL,
        serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    };
}

/* === Validação de arquivos === */
/* ----- Validação do caminho do objeto ----- */
function validateObjectKey(objectKey) {
    if (
        typeof objectKey !== 'string' ||
        !OBJECT_KEY_PATTERN.test(objectKey)
    ) {
        throw Error('INVALID_FILE_ID');
    }

    return objectKey;
}

/* ----- Validação do conteúdo de upload ----- */
function validateUpload(bytes, mimeType) {
    if (!(bytes instanceof Uint8Array)) {
        throw Error('INVALID_FILE');
    }

    if (
        bytes.byteLength < 1 ||
        bytes.byteLength > MAX_FILE_SIZE
    ) {
        throw Error('INVALID_FILE_SIZE');
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw Error('INVALID_FILE_TYPE');
    }
}

/* === Comunicação com o Supabase Storage === */
/* ----- Construção dos caminhos da API ----- */
function getStorageUrl(env, endpoint, objectKey) {
    const { baseUrl } = getStorageConfig(env);

    const endpointPath = endpoint ? `${endpoint}/` : '';

    const basePath =
        `/storage/v1/object/${endpointPath}${STORAGE_BUCKET}`;

    if (!objectKey) {
        return new URL(basePath, baseUrl);
    }

    const encodedPath = validateObjectKey(objectKey)
        .split('/')
        .map(encodeURIComponent)
        .join('/');

    return new URL(
        `${basePath}/${encodedPath}`,
        baseUrl,
    );
}

/* ----- Execução autenticada das requisições ----- */
async function requestStorage(
    env,
    url,
    {
        method = 'GET',
        body,
        mimeType,
        headers: additionalHeaders = {},
    } = {},
) {
    const { serviceKey } = getStorageConfig(env);

    const headers = new Headers({
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        ...additionalHeaders,
    });

    if (mimeType) {
        headers.set('Content-Type', mimeType);
    }

    try {
        return await fetch(url, {
            method,
            headers,
            body,
            signal: AbortSignal.timeout(STORAGE_TIMEOUT),
        });
    } catch {
        const uncertain =
            method === 'POST' ||
            method === 'PUT' ||
            method === 'DELETE';

        throw Error(
            uncertain
                ? 'STORAGE_RESULT_UNKNOWN'
                : 'SERVICE_UNAVAILABLE',
        );
    }
}

/* ----- Identificação de conflito no upload ----- */
async function isDuplicateUpload(response) {
    if (response.status === 409) {
        return true;
    }

    if (response.status !== 400) {
        return false;
    }

    try {
        const error = await response.json();

        return (
            error?.code === 'Duplicate' ||
            error?.error === 'Duplicate' ||
            error?.code === 'ResourceAlreadyExists' ||
            error?.error === 'ResourceAlreadyExists'
        );
    } catch {
        return false;
    }
}

/* === Operações de armazenamento === */
/* ----- Envio de arquivo sem sobrescrita ----- */
export async function uploadOfficialFile(
    env,
    { objectKey, bytes, mimeType },
) {
    validateObjectKey(objectKey);
    validateUpload(bytes, mimeType);

    const url = getStorageUrl(
        env,
        '',
        objectKey,
    );

    const response = await requestStorage(
        env,
        url,
        {
            method: 'POST',
            body: bytes,
            mimeType,
            headers: {
                'x-upsert': 'false',
                'cache-control': 'max-age=0',
            },
        },
    );

    if (await isDuplicateUpload(response)) {
        throw Error('CONFLICT');
    }

    if (!response.ok) {
        throw Error('STORAGE_RESULT_UNKNOWN');
    }

    return {
        uploaded: true,
    };
}

/* ----- Download autenticado de arquivo privado ----- */
export async function downloadOfficialFile(
    env,
    objectKey,
) {
    const url = getStorageUrl(
        env,
        'authenticated',
        objectKey,
    );

    const response = await requestStorage(
        env,
        url,
    );

    if (response.status === 404) {
        throw Error('NOT_FOUND');
    }

    if (!response.ok) {
        throw Error('SERVICE_UNAVAILABLE');
    }

    return response;
}

/* ----- Consulta dos metadados do objeto ----- */
export async function inspectOfficialFile(
    env,
    objectKey,
) {
    const url = getStorageUrl(
        env,
        'info',
        objectKey,
    );

    const response = await requestStorage(
        env,
        url,
    );


    /* ----- Identificação de objetos inexistentes ----- */
    if (response.status === 404) {
        return {
            exists: false,
        };
    }

    if (response.status === 400) {
        let error;

        try {
            error = await response.json();
        } catch {
            throw Error('SERVICE_UNAVAILABLE');
        }

        if (
            error?.code === 'NoSuchKey' &&
            String(error?.statusCode) === '404'
        ) {
            return {
                exists: false,
            };
        }
    }

    if (!response.ok) {
        throw Error('SERVICE_UNAVAILABLE');
    }

    let metadata;

    try {
        metadata = await response.json();
    } catch {
        throw Error('SERVICE_UNAVAILABLE');
    }

    const size = metadata?.size;
    const mimeType = metadata?.content_type;

    if (
        !Number.isSafeInteger(size) ||
        size < 1 ||
        size > MAX_FILE_SIZE ||
        !ALLOWED_MIME_TYPES.has(mimeType)
    ) {
        throw Error('SERVICE_UNAVAILABLE');
    }

    return {
        exists: true,
        size,
        mimeType,
    };
}

/* ----- Exclusão de arquivo privado ----- */
export async function deleteOfficialFile(
    env,
    objectKey,
) {
    validateObjectKey(objectKey);

    const url = getStorageUrl(
        env,
        '',
    );

    const response = await requestStorage(
        env,
        url,
        {
            method: 'DELETE',
            body: JSON.stringify({
                prefixes: [objectKey],
            }),
            mimeType: 'application/json',
        },
    );

    if (!response.ok) {
        throw Error('STORAGE_RESULT_UNKNOWN');
    }

    return {
        deleted: true,
    };
}
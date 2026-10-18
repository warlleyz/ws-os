
const STORAGE_KEY = 'ws-os:visitor-id';

let sessionVisitorId = null;

function isValidVisitorId(value) {
    return (
        typeof value === 'string' &&
        /^[a-f0-9]{32}$/.test(value)
    );
}

function generateVisitorId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function getVisitorId() {
    if (sessionVisitorId) {
        return sessionVisitorId;
    }

    try {
        const storedId = localStorage.getItem(STORAGE_KEY);

        if (isValidVisitorId(storedId)) {
            sessionVisitorId = storedId;
            return sessionVisitorId;
        }
    } catch {
        // Armazenamento indisponível.
    }

    sessionVisitorId = generateVisitorId();

    try {
        localStorage.setItem(STORAGE_KEY, sessionVisitorId);
    } catch {
        // Mantém o identificador somente durante a sessão.
    }

    return sessionVisitorId;
}

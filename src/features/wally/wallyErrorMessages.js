
const ERROR_MESSAGES = {
    AI_DISABLED:
        'O Gemini está temporariamente desativado. Resposta local utilizada.',

    RATE_LIMIT_EXCEEDED:
        'Limite de consultas atingido. Resposta local utilizada.',

    VERIFICATION_REQUIRED:
        'A verificação de segurança não foi concluída. Resposta local utilizada.',

    VERIFICATION_FAILED:
        'A verificação de segurança não foi concluída. Resposta local utilizada.',

    VERIFICATION_UNAVAILABLE:
        'A verificação de segurança está indisponível. Resposta local utilizada.',

    PROTECTION_UNAVAILABLE:
        'A proteção de segurança está indisponível. Resposta local utilizada.',

    LIMITER_UNAVAILABLE:
        'O controle de consultas está indisponível. Resposta local utilizada.',

    LIMITER_NOT_CONFIGURED:
        'O controle de consultas não está configurado. Resposta local utilizada.',

    GEMINI_UNAVAILABLE:
        'O Gemini está indisponível. Resposta local utilizada.',

    AI_REQUEST_FAILED:
        'Não foi possível conectar ao Gemini. Resposta local utilizada.',
};

const DEFAULT_ERROR_MESSAGE =
    'Não foi possível usar a IA. Resposta local utilizada.';

export function getWallyErrorMessage(errorCode) {
    if (!errorCode) return null;

    return Object.hasOwn(ERROR_MESSAGES, errorCode)
        ? ERROR_MESSAGES[errorCode]
        : DEFAULT_ERROR_MESSAGE;
}

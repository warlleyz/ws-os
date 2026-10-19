import { portfolio } from '../../content/portfolioContent';
import { publicAssetUrl } from '../../shared/utils/urls';

/* === Catálogo de documentos oficiais === */
/* ----- Documentos autorizados ----- */
const STATIC_DOCUMENTS = Object.freeze({
    curriculo: Object.freeze({
        path: portfolio.resume.url,
        name: 'Currículo profissional',
        type: 'pdf',
    }),
});

/* === Validação do catálogo === */
/* ----- Consulta por identificador ----- */
export function getStaticFileDefinition(catalogId) {
    if (
        typeof catalogId !== 'string' ||
        !Object.hasOwn(STATIC_DOCUMENTS, catalogId)
    ) {
        return null;
    }

    return STATIC_DOCUMENTS[catalogId];
}

/* ----- Resolução do documento público ----- */
export function resolveStaticFile(catalogId) {
    const definition = getStaticFileDefinition(catalogId);

    if (!definition) {
        return {
            ok: false,
            code: 'STATIC_FILE_NOT_FOUND',
        };
    }

    const url = publicAssetUrl(definition.path);

    if (!url) {
        return {
            ok: false,
            code: 'STATIC_FILE_INVALID_PATH',
        };
    }

    return {
        ok: true,
        resource: {
            source: 'static',
            catalogId,
            name: definition.name,
            type: definition.type,
            url,
        },
    };
}
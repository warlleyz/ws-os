const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração === */
/* ----- Caminhos dos módulos ----- */
const root = path.resolve(__dirname, '../..');

const catalogPath = path.join(
    root,
    'src/services/storage/staticFileCatalog.js',
);

/* ----- Carregamento isolado do catálogo ----- */
function loadCatalog({ resumeUrl = 'documents/curriculo-warlley.pdf', resolveUrl } = {}) {
    const source = fs
        .readFileSync(catalogPath, 'utf8')
        .replace(/^import\s+.*?;\s*$/gm, '')
        .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

    const portfolio = {
        resume: { url: resumeUrl },
    };

    const publicAssetUrl =
        resolveUrl ??
        ((value) =>
            typeof value === 'string' &&
                value.startsWith('documents/') &&
                !value.includes('..')
                ? `https://example.test/${value}`
                : null);

    const context = vm.createContext({
        portfolio,
        publicAssetUrl,
    });

    vm.runInContext(
        `${source}
    this.catalog = {
      getStaticFileDefinition,
      resolveStaticFile,
    };`,
        context,
    );

    return context.catalog;
}

/* === Consulta do catálogo === */
/* ----- Documento cadastrado ----- */
test('catálogo reconhece o currículo oficial', () => {
    const catalog = loadCatalog();

    const definition = catalog.getStaticFileDefinition('curriculo');

    assert.ok(definition);
    assert.equal(definition.type, 'pdf');
    assert.equal(definition.name, 'Currículo profissional');
});

/* ----- Identificadores desconhecidos ----- */
test('catálogo rejeita documentos não cadastrados', () => {
    const catalog = loadCatalog();

    assert.equal(catalog.getStaticFileDefinition('desconhecido'), null);
    assert.equal(catalog.getStaticFileDefinition('../curriculo'), null);
    assert.equal(catalog.getStaticFileDefinition(null), null);

    const result = catalog.resolveStaticFile('desconhecido');

    assert.equal(result.ok, false);
    assert.equal(result.code, 'STATIC_FILE_NOT_FOUND');
});

/* === Resolução de documentos === */
/* ----- Recurso oficial válido ----- */
test('catálogo resolve o currículo pelo identificador', () => {
    const catalog = loadCatalog();

    const result = catalog.resolveStaticFile('curriculo');

    assert.equal(result.ok, true);
    assert.equal(result.resource.source, 'static');
    assert.equal(result.resource.catalogId, 'curriculo');
    assert.equal(result.resource.type, 'pdf');
    assert.equal(
        result.resource.url,
        'https://example.test/documents/curriculo-warlley.pdf',
    );
});

/* ----- Caminho não autorizado ----- */
test('catálogo rejeita caminhos inválidos', () => {
    const catalog = loadCatalog({
        resumeUrl: '../private/curriculo.pdf',
    });

    const result = catalog.resolveStaticFile('curriculo');

    assert.equal(result.ok, false);
    assert.equal(result.code, 'STATIC_FILE_INVALID_PATH');
});

/* ----- Falha na resolução ----- */
test('catálogo rejeita recursos sem URL válida', () => {
    const catalog = loadCatalog({
        resolveUrl: () => null,
    });

    const result = catalog.resolveStaticFile('curriculo');

    assert.equal(result.ok, false);
    assert.equal(result.code, 'STATIC_FILE_INVALID_PATH');
});

/* === Integridade dos dados === */
/* ----- Identidade do recurso ----- */
test('catálogo retorna os metadados esperados', () => {
    const catalog = loadCatalog();

    const result = catalog.resolveStaticFile('curriculo');

    assert.equal(result.ok, true);
    assert.equal(result.resource.name, 'Currículo profissional');
    assert.equal(Object.hasOwn(result.resource, 'storageKey'), false);
    assert.equal(Object.hasOwn(result.resource, 'fileId'), false);
    assert.equal(Object.hasOwn(result.resource, 'resourceId'), false);
});
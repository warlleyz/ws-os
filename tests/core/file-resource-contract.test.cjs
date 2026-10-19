const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração dos testes === */
/* ----- Carregamento do contrato ----- */
const contractPath = path.resolve(
    __dirname,
    '../../src/services/storage/fileResourceContract.js',
);

function loadContract() {
    const source = fs
        .readFileSync(contractPath, 'utf8')
        .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

    return vm.runInNewContext(
        `(() => {
      ${source}
      return {
        FILE_RESOURCE_SOURCES,
        validateFileResource,
        createFileResource,
      };
    })()`,
    );
}

/* === Origens de arquivos === */
/* ----- Identificadores das origens ----- */
test('contrato declara as três origens de recursos', () => {
    const { FILE_RESOURCE_SOURCES } = loadContract();

    assert.equal(FILE_RESOURCE_SOURCES.LOCAL, 'local');
    assert.equal(FILE_RESOURCE_SOURCES.STATIC, 'static');
    assert.equal(FILE_RESOURCE_SOURCES.MANAGED, 'managed');
});

/* ----- Arquivos pessoais ----- */
test('arquivo local utiliza exclusivamente fileId', () => {
    const { validateFileResource } = loadContract();

    const result = validateFileResource({
        source: 'local',
        fileId: 'arquivo-123',
    });

    assert.equal(result.ok, true);
    assert.equal(result.resource.source, 'local');
    assert.equal(result.resource.fileId, 'arquivo-123');
});

/* ----- Documentos estáticos ----- */
test('documento estático utiliza identificador de catálogo', () => {
    const { validateFileResource } = loadContract();

    const result = validateFileResource({
        source: 'static',
        catalogId: 'curriculo',
    });

    assert.equal(result.ok, true);
    assert.equal(result.resource.catalogId, 'curriculo');
});

/* ----- Arquivos gerenciados ----- */
test('arquivo gerenciado utiliza identificador público de recurso', () => {
    const { validateFileResource } = loadContract();

    const result = validateFileResource({
        source: 'managed',
        resourceId: 'certificado-456',
    });

    assert.equal(result.ok, true);
    assert.equal(result.resource.resourceId, 'certificado-456');
});

/* === Segurança dos descritores === */
/* ----- Origens desconhecidas ----- */
test('contrato rejeita origens não reconhecidas', () => {
    const { validateFileResource } = loadContract();

    const result = validateFileResource({
        source: 'external',
        url: 'https://example.com/file.pdf',
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, 'INVALID_FILE_RESOURCE_SOURCE');
});

/* ----- Campos adicionais ----- */
test('contrato rejeita campos extras e chaves internas do R2', () => {
    const { validateFileResource } = loadContract();

    const invalidResources = [
        {
            source: 'local',
            fileId: 'arquivo-123',
            url: 'https://example.com',
        },
        {
            source: 'static',
            catalogId: 'curriculo',
            path: '/documento.pdf',
        },
        {
            source: 'managed',
            resourceId: 'certificado-456',
            storageKey: 'private/certificado.pdf',
        },
    ];

    for (const resource of invalidResources) {
        const result = validateFileResource(resource);

        assert.equal(result.ok, false);
        assert.equal(result.code, 'INVALID_FILE_RESOURCE');
    }
});

/* ----- Identificadores inválidos ----- */
test('contrato rejeita identificadores vazios e inseguros', () => {
    const { createFileResource } = loadContract();

    const identifiers = [
        '',
        ' ',
        '../arquivo',
        '/private/file',
        'arquivo?download=true',
        'arquivo#fragment',
        123,
        null,
        'a'.repeat(201),
    ];

    for (const identifier of identifiers) {
        const result = createFileResource('managed', identifier);

        assert.equal(result.ok, false);
        assert.equal(result.code, 'INVALID_FILE_RESOURCE');
    }
});

/* ----- Estruturas inválidas ----- */
test('contrato rejeita valores que não são descritores', () => {
    const { validateFileResource } = loadContract();

    const invalidValues = [
        null,
        undefined,
        false,
        10,
        'local',
        [],
    ];

    for (const value of invalidValues) {
        assert.equal(validateFileResource(value).ok, false);
    }
});

/* === Criação de recursos === */
/* ----- Descritores normalizados ----- */
test('criação utiliza o identificador correto para cada origem', () => {
    const { createFileResource } = loadContract();

    const cases = [
        ['local', 'fileId'],
        ['static', 'catalogId'],
        ['managed', 'resourceId'],
    ];

    for (const [source, field] of cases) {
        const result = createFileResource(source, 'documento-123');

        assert.equal(result.ok, true);
        assert.equal(result.resource.source, source);
        assert.equal(result.resource[field], 'documento-123');
        assert.equal(Object.keys(result.resource).length, 2);
    }
});
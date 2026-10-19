const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração dos testes === */
/* ----- Caminho do contrato ----- */
const contractPath = path.resolve(
    __dirname,
    '../../src/services/storage/noteAttachmentContract.js',
);

/* ----- Carregamento isolado do contrato ----- */
function loadContract() {
    const source = fs
        .readFileSync(contractPath, 'utf8')
        .replace(
            /^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/gm,
            '',
        )
        .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

    return vm.runInNewContext(
        `(() => {
      const MANAGED_FILE_LIMIT = 10 * 1024 * 1024;
      const MAX_POST_ATTACHMENTS = 5;

      ${source}

      return {
        NOTE_ATTACHMENT_TYPES,
        NOTE_ATTACHMENT_ERRORS,
        validateNoteAttachment,
        validateNoteAttachments,
      };
    })()`,
    );
}

/* === Dados de referência === */
/* ----- Anexo válido ----- */
function validAttachment(overrides = {}) {
    return {
        resourceId: 'anexo-123',
        name: 'documento.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        ...overrides,
    };
}

/* === Configuração dos anexos === */
/* ----- Formatos autorizados ----- */
test('declara os formatos permitidos para anexos', () => {
    const { NOTE_ATTACHMENT_TYPES } = loadContract();

    assert.equal(NOTE_ATTACHMENT_TYPES.pdf, 'application/pdf');
    assert.equal(NOTE_ATTACHMENT_TYPES.txt, 'text/plain');
    assert.equal(NOTE_ATTACHMENT_TYPES.png, 'image/png');
    assert.equal(NOTE_ATTACHMENT_TYPES.jpg, 'image/jpeg');
    assert.equal(NOTE_ATTACHMENT_TYPES.jpeg, 'image/jpeg');
    assert.equal(NOTE_ATTACHMENT_TYPES.webp, 'image/webp');
});

/* === Validação individual === */
/* ----- Anexo válido ----- */
test('aceita metadados válidos de um anexo', () => {
    const { validateNoteAttachment } = loadContract();

    const result = validateNoteAttachment(validAttachment());

    assert.equal(result.ok, true);
    assert.equal(result.attachment.resourceId, 'anexo-123');
    assert.equal(result.attachment.name, 'documento.pdf');
    assert.equal(result.attachment.mimeType, 'application/pdf');
    assert.equal(result.attachment.size, 1024);
});

/* ----- Formatos compatíveis ----- */
test('aceita PDF, TXT, PNG, JPEG e WebP', () => {
    const { validateNoteAttachment } = loadContract();

    const formats = [
        ['arquivo.pdf', 'application/pdf'],
        ['arquivo.txt', 'text/plain'],
        ['arquivo.png', 'image/png'],
        ['arquivo.jpg', 'image/jpeg'],
        ['arquivo.jpeg', 'image/jpeg'],
        ['arquivo.webp', 'image/webp'],
    ];

    for (const [name, mimeType] of formats) {
        const result = validateNoteAttachment(
            validAttachment({ name, mimeType }),
        );

        assert.equal(result.ok, true, `Formato rejeitado: ${name}`);
    }
});

/* ----- Formatos inválidos ----- */
test('rejeita extensões não autorizadas', () => {
    const { validateNoteAttachment } = loadContract();

    const invalidNames = [
        'arquivo.exe',
        'arquivo.zip',
        'arquivo.svg',
        'arquivo.gif',
        'arquivo.docx',
        'arquivo',
    ];

    for (const name of invalidNames) {
        const result = validateNoteAttachment(
            validAttachment({ name }),
        );

        assert.equal(result.ok, false);
        assert.equal(result.code, 'INVALID_ATTACHMENT_TYPE');
    }
});

/* ----- MIME incompatível ----- */
test('rejeita incompatibilidade entre extensão e MIME', () => {
    const { validateNoteAttachment } = loadContract();

    const result = validateNoteAttachment(
        validAttachment({
            name: 'imagem.png',
            mimeType: 'image/jpeg',
        }),
    );

    assert.equal(result.ok, false);
    assert.equal(result.code, 'INVALID_ATTACHMENT_TYPE');
});

/* ----- Tamanho individual ----- */
test('aceita arquivos até 10 MB e rejeita arquivos maiores', () => {
    const { validateNoteAttachment } = loadContract();

    const limit = 10 * 1024 * 1024;

    assert.equal(
        validateNoteAttachment(
            validAttachment({ size: limit }),
        ).ok,
        true,
    );

    const result = validateNoteAttachment(
        validAttachment({ size: limit + 1 }),
    );

    assert.equal(result.ok, false);
    assert.equal(result.code, 'ATTACHMENT_TOO_LARGE');
});

/* ----- Tamanhos inválidos ----- */
test('rejeita tamanhos negativos e fracionários', () => {
    const { validateNoteAttachment } = loadContract();

    for (const size of [-1, 1.5, null, '1024']) {
        assert.equal(
            validateNoteAttachment(
                validAttachment({ size }),
            ).ok,
            false,
        );
    }
});

/* ----- Identificadores inválidos ----- */
test('rejeita identificadores inseguros', () => {
    const { validateNoteAttachment } = loadContract();

    const identifiers = [
        '',
        '../anexo',
        '/private/anexo',
        'anexo?download=true',
        'anexo#fragment',
        'a'.repeat(201),
        null,
    ];

    for (const resourceId of identifiers) {
        const result = validateNoteAttachment(
            validAttachment({ resourceId }),
        );

        assert.equal(result.ok, false);
        assert.equal(result.code, 'INVALID_ATTACHMENT');
    }
});

/* ----- Estruturas inválidas ----- */
test('rejeita anexos ausentes ou malformados', () => {
    const { validateNoteAttachment } = loadContract();

    for (const value of [
        null,
        undefined,
        [],
        'anexo',
        123,
        false,
    ]) {
        assert.equal(validateNoteAttachment(value).ok, false);
    }
});

/* ----- Campos proibidos ----- */
test('rejeita chaves internas e conteúdo binário', () => {
    const { validateNoteAttachment } = loadContract();

    const invalidAttachments = [
        validAttachment({
            storageKey: 'private/documento.pdf',
        }),
        validAttachment({
            blob: 'conteudo-binario',
        }),
        validAttachment({
            url: 'https://example.com/documento.pdf',
        }),
    ];

    for (const attachment of invalidAttachments) {
        const result = validateNoteAttachment(attachment);

        assert.equal(result.ok, false);
        assert.equal(result.code, 'INVALID_ATTACHMENT');
    }
});

/* ----- Nome inválido ----- */
test('rejeita nomes vazios ou contendo separadores de caminho', () => {
    const { validateNoteAttachment } = loadContract();

    for (const name of [
        '',
        ' ',
        '../arquivo.pdf',
        'pasta/arquivo.pdf',
        'pasta\\arquivo.pdf',
    ]) {
        assert.equal(
            validateNoteAttachment(
                validAttachment({ name }),
            ).ok,
            false,
        );
    }
});

/* === Validação da publicação === */
/* ----- Lista vazia ----- */
test('aceita publicações sem anexos', () => {
    const { validateNoteAttachments } = loadContract();

    const result = validateNoteAttachments([]);

    assert.equal(result.ok, true);
    assert.equal(result.attachments.length, 0);
});

/* ----- Limite de cinco anexos ----- */
test('aceita até cinco anexos por publicação', () => {
    const { validateNoteAttachments } = loadContract();

    const attachments = Array.from(
        { length: 5 },
        (_, index) =>
            validAttachment({
                resourceId: `anexo-${index + 1}`,
            }),
    );

    const result = validateNoteAttachments(attachments);

    assert.equal(result.ok, true);
    assert.equal(result.attachments.length, 5);
});

/* ----- Excesso de anexos ----- */
test('rejeita publicações com mais de cinco anexos', () => {
    const { validateNoteAttachments } = loadContract();

    const attachments = Array.from(
        { length: 6 },
        (_, index) =>
            validAttachment({
                resourceId: `anexo-${index + 1}`,
            }),
    );

    const result = validateNoteAttachments(attachments);

    assert.equal(result.ok, false);
    assert.equal(result.code, 'TOO_MANY_ATTACHMENTS');
});

/* ----- Referências duplicadas ----- */
test('rejeita anexos com identificadores duplicados', () => {
    const { validateNoteAttachments } = loadContract();

    const result = validateNoteAttachments([
        validAttachment(),
        validAttachment(),
    ]);

    assert.equal(result.ok, false);
    assert.equal(result.code, 'DUPLICATE_ATTACHMENT');
});

/* ----- Lista inválida ----- */
test('rejeita coleções que não são arrays', () => {
    const { validateNoteAttachments } = loadContract();

    for (const value of [
        null,
        undefined,
        {},
        'anexos',
    ]) {
        const result = validateNoteAttachments(value);

        assert.equal(result.ok, false);
        assert.equal(result.code, 'INVALID_ATTACHMENT_LIST');
    }
});

/* ----- Falha individual na coleção ----- */
test('rejeita publicação com qualquer anexo inválido', () => {
    const { validateNoteAttachments } = loadContract();

    const result = validateNoteAttachments([
        validAttachment(),
        validAttachment({
            resourceId: 'anexo-456',
            name: 'script.exe',
        }),
    ]);

    assert.equal(result.ok, false);
    assert.equal(result.code, 'INVALID_ATTACHMENT_TYPE');
});

/* === Integridade dos resultados === */
/* ----- Referências normalizadas ----- */
test('retorna somente os metadados permitidos', () => {
    const { validateNoteAttachments } = loadContract();

    const result = validateNoteAttachments([
        validAttachment(),
    ]);

    assert.equal(result.ok, true);

    const normalized = result.attachments[0];

    assert.deepEqual(
        Object.keys(normalized).sort(),
        ['resourceId', 'name', 'mimeType', 'size'].sort(),
    );

    assert.equal(Object.hasOwn(normalized, 'storageKey'), false);
    assert.equal(Object.hasOwn(normalized, 'blob'), false);
});
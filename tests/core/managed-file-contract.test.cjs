
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

/* === Configuração dos testes === */
/* ----- Carregamento do contrato ----- */
const contractPath = path.resolve(
    __dirname,
    '../../src/services/storage/managedFileContract.js',
);

function loadContract() {
    const source = fs
        .readFileSync(contractPath, 'utf8')
        .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');

    return vm.runInNewContext(
        `(() => {
      ${source}
      return {
        MANAGED_FILE_LIMIT,
        MAX_POST_ATTACHMENTS,
        MANAGED_FILE_STATES,
        MANAGED_FILE_VISIBILITY,
        MANAGED_FILE_ERRORS,
        validateManagedFileMetadata,
        isManagedFileAvailable,
        isManagedFilePublic,
        canTransitionManagedFile,
        transitionManagedFile,
        requiresManagedFileReconciliation,
      };
    })()`,
    );
}

/* === Dados de referência === */
/* ----- Registro de arquivo válido ----- */
function validMetadata(overrides = {}) {
    return {
        resourceId: 'documento-123',
        name: 'documento.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        state: 'available',
        visibility: 'public',
        ...overrides,
    };
}

/* === Limites e configurações === */
/* ----- Uploads e anexos ----- */
test('mantém os limites aprovados para arquivos gerenciados', () => {
    const contract = loadContract();

    assert.equal(contract.MANAGED_FILE_LIMIT, 10 * 1024 * 1024);
    assert.equal(contract.MAX_POST_ATTACHMENTS, 5);
});

/* === Validação de metadados === */
/* ----- Registro válido ----- */
test('aceita metadados válidos', () => {
    const { validateManagedFileMetadata } = loadContract();

    const result = validateManagedFileMetadata(validMetadata());

    assert.equal(result.ok, true);
    assert.equal(result.metadata.resourceId, 'documento-123');
    assert.equal(result.metadata.name, 'documento.pdf');
});

/* ----- Estruturas inválidas ----- */
test('rejeita metadados ausentes ou malformados', () => {
    const { validateManagedFileMetadata } = loadContract();

    for (const metadata of [null, undefined, [], 'arquivo', 10]) {
        assert.equal(validateManagedFileMetadata(metadata).ok, false);
    }
});

/* ----- Identificadores inválidos ----- */
test('rejeita identificadores públicos inválidos', () => {
    const { validateManagedFileMetadata } = loadContract();

    for (const resourceId of [
        '',
        '../arquivo',
        '/private/file.pdf',
        'arquivo?download=1',
        'a'.repeat(201),
    ]) {
        const result = validateManagedFileMetadata(
            validMetadata({ resourceId }),
        );

        assert.equal(result.ok, false);
    }
});

/* ----- Limites de tamanho ----- */
test('aceita o limite de 10 MB e rejeita arquivos maiores', () => {
    const { validateManagedFileMetadata, MANAGED_FILE_LIMIT } =
        loadContract();

    assert.equal(
        validateManagedFileMetadata(
            validMetadata({ size: MANAGED_FILE_LIMIT }),
        ).ok,
        true,
    );

    for (const size of [-1, 1.5, MANAGED_FILE_LIMIT + 1]) {
        assert.equal(
            validateManagedFileMetadata(validMetadata({ size })).ok,
            false,
        );
    }
});

/* ----- Estados desconhecidos ----- */
test('rejeita estados técnicos e editoriais desconhecidos', () => {
    const { validateManagedFileMetadata } = loadContract();

    assert.equal(
        validateManagedFileMetadata(
            validMetadata({ state: 'unknown' }),
        ).ok,
        false,
    );

    assert.equal(
        validateManagedFileMetadata(
            validMetadata({ visibility: 'unknown' }),
        ).ok,
        false,
    );
});

/* ----- Chaves internas ----- */
test('rejeita a exposição da chave interna do R2', () => {
    const { validateManagedFileMetadata } = loadContract();

    const result = validateManagedFileMetadata(
        validMetadata({
            storageKey: 'private/documento.pdf',
        }),
    );

    assert.equal(result.ok, false);
});

/* === Disponibilidade dos recursos === */
/* ----- Estados técnicos ----- */
test('somente arquivos disponíveis podem ser acessados', () => {
    const { isManagedFileAvailable, MANAGED_FILE_STATES } =
        loadContract();

    for (const state of Object.values(MANAGED_FILE_STATES)) {
        const result = isManagedFileAvailable(
            validMetadata({ state }),
        );

        assert.equal(result, state === 'available');
    }
});

/* ----- Publicação ----- */
test('somente arquivos disponíveis e públicos são publicáveis', () => {
    const { isManagedFilePublic } = loadContract();

    assert.equal(isManagedFilePublic(validMetadata()), true);

    assert.equal(
        isManagedFilePublic(
            validMetadata({ visibility: 'private' }),
        ),
        false,
    );

    assert.equal(
        isManagedFilePublic(
            validMetadata({ state: 'pending' }),
        ),
        false,
    );

    assert.equal(
        isManagedFilePublic(
            validMetadata({
                state: 'failed',
                visibility: 'public',
            }),
        ),
        false,
    );
});

/* === Códigos de erro === */
/* ----- Identificadores estáveis ----- */
test('declara os erros esperados pelo serviço', () => {
    const { MANAGED_FILE_ERRORS } = loadContract();

    assert.equal(
        MANAGED_FILE_ERRORS.ACCESS_DENIED,
        'MANAGED_FILE_ACCESS_DENIED',
    );

    assert.equal(
        MANAGED_FILE_ERRORS.NOT_FOUND,
        'MANAGED_FILE_NOT_FOUND',
    );

    assert.equal(
        MANAGED_FILE_ERRORS.UNAVAILABLE,
        'MANAGED_FILE_UNAVAILABLE',
    );
});


/* === Transições de armazenamento === */
/* ----- Fluxos permitidos ----- */
test('aceita transições válidas de upload e exclusão', () => {
    const { canTransitionManagedFile } = loadContract();

    const transitions = [
        ['pending', 'uploading'],
        ['uploading', 'available'],
        ['uploading', 'failed'],
        ['failed', 'pending'],
        ['available', 'deleting'],
        ['deleting', 'deleted'],
        ['deleting', 'failed'],
    ];

    for (const [current, next] of transitions) {
        assert.equal(canTransitionManagedFile(current, next), true);
    }
});

/* ----- Transições proibidas ----- */
test('rejeita transições inválidas e estados finais', () => {
    const { canTransitionManagedFile } = loadContract();

    const transitions = [
        ['pending', 'available'],
        ['available', 'pending'],
        ['failed', 'available'],
        ['deleted', 'pending'],
        ['deleted', 'available'],
        ['unknown', 'available'],
        ['available', 'unknown'],
    ];

    for (const [current, next] of transitions) {
        assert.equal(canTransitionManagedFile(current, next), false);
    }
});

/* ----- Atualização de metadados ----- */
test('aplica uma transição válida sem modificar o registro original', () => {
    const { transitionManagedFile } = loadContract();

    const original = validMetadata({
        state: 'pending',
        visibility: 'private',
    });

    const result = transitionManagedFile(original, 'uploading');

    assert.equal(result.ok, true);
    assert.equal(result.metadata.state, 'uploading');
    assert.equal(result.metadata.visibility, 'private');
    assert.equal(original.state, 'pending');
});

/* ----- Preservação após rejeição ----- */
test('rejeita transições proibidas sem alterar os metadados', () => {
    const { transitionManagedFile } = loadContract();

    const original = validMetadata({ state: 'pending' });

    const result = transitionManagedFile(original, 'available');

    assert.equal(result.ok, false);
    assert.equal(result.code, 'MANAGED_FILE_INVALID_TRANSITION');
    assert.equal(original.state, 'pending');
});

/* === Reconciliação === */
/* ----- Operações pendentes ou interrompidas ----- */
test('identifica estados que exigem reconciliação', () => {
    const { requiresManagedFileReconciliation } = loadContract();

    for (const state of ['uploading', 'failed', 'deleting']) {
        assert.equal(requiresManagedFileReconciliation(state), true);
    }

    for (const state of ['pending', 'available', 'deleted']) {
        assert.equal(requiresManagedFileReconciliation(state), false);
    }
});


# WS OS V2 — Etapa 01 · Parte 01.2

**Status:** Contratos implementados e testados; integrações futuras identificadas.
**Escopo:** Arquivos, documentos oficiais e anexos.
**Referências:** TEC-014 a TEC-021.

## 1. Contratos implementados

- `fileResourceContract.js`: identificação e validação das três origens.
- `staticFileCatalog.js`: catálogo de documentos estáticos autorizados.
- `managedFileContract.js`: metadados, limites, estados e transições dos recursos gerenciados.
- `noteAttachmentContract.js`: formatos, identificadores e limites dos anexos.

## 2. Integrações realizadas

- Core aceita descritores de recursos.
- FileViewer reconhece as três origens.
- Arquivos locais continuam utilizando IndexedDB.
- Currículo utiliza o catálogo estático.
- Visualizador e Currículo tiveram seus componentes e estilos organizados.
- Parâmetros legados foram preservados para compatibilidade.

## 3. Validações

- ESLint: aprovado pelo responsável.
- Build: aprovado pelo responsável.
- Suíte automatizada: aprovada pelo responsável.
- Testes específicos dos contratos: aprovados pelo responsável.

## 4. Pendências atribuídas a outras etapas

### Etapa 03 — Backend

- Autorização real dos recursos gerenciados.
- Upload administrativo para R2 privado.
- Verificação do tipo real dos arquivos.
- Persistência de metadados e vínculos editoriais.
- Tratamento de falhas parciais e objetos órfãos.
- Reconciliação e exclusão idempotente.

### Etapa 05 — Arquivos, Visualizador e Editor

- Integração funcional de recursos gerenciados.
- Revisão dos caminhos legados por URL.
- Migração dos consumidores oficiais para identificadores de catálogo.
- Validação funcional completa de Visualizador e Editor.

### Etapa 08 — Notas

- Interface para seleção e gerenciamento dos anexos.
- Associação de anexos às publicações.
- Integração com o backend autorizado.

## 5. Compatibilidade

Não remover parâmetros legados sem identificar e migrar seus consumidores.

Alterações posteriores dos contratos compartilhados exigem testes de regressão.

## 6. Continuidade

Próxima parte: **01.3 — APIs, erros e atualização de dados**.

Os arquivos de tradução PT-BR/EN permanecem reservados para consolidação na revisão final.

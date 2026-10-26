<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === BLOCO 6 / FASE A5 — BASE TÉCNICA DE ARQUIVOS === -->

# Bloco 6 / Fase A5 — base técnica de Arquivos

Referência: mestre v0.16.0, DEC-104, DEC-115/116, DEC-393–397, DEC-407 e DEC-539.

<!-- === ESCOPO CONCLUÍDO === -->

## Escopo concluído

- Gerenciador: criar, navegar, renomear, mover, importar, enviar à lixeira, restaurar e excluir definitivamente. Itens na lixeira não aceitam edição/renomeação/movimento. Pasta removida durante a navegação não redireciona gravações silenciosamente à raiz.
- Integridade: nomes normalizados, duplicidade, ciclos, pais inválidos, revisão de escrita, limites por arquivo/coleção e validação de dados persistidos. As regras são aplicadas no modelo e na transação, não apenas nos controles.
- Persistência: IndexedDB existente, sem migração e sem envio de arquivos pessoais. Commit confirmado somente em oncomplete; falhas de quota/abort preservam a transação anterior. Falhas de consumidores ou BroadcastChannel não são apresentadas como falha de gravação já concluída. Foco/storage permitem reconciliar abas sem BroadcastChannel.
- Importação: UTF-8 para texto; assinatura PDF; assinatura, decodificação e até 32 MP para PNG/JPEG/WebP. Textos importados de até 10 MiB podem ser baixados; editor/prévia textual limitados a 1 MiB. Limite total de 50 MiB/500 itens inclui a lixeira.
- Editor: Ctrl+S, revisão transacional, aviso de alteração externa, rascunho preservado em conflitos/exclusão, confirmação para recarregar, proteção no fechamento/reload e durante operações. Salvar cópia usa o destino atual quando disponível; se a pasta não existe ou está na lixeira, usa a raiz pessoal. A cópia não limpa o rascunho original.
- Visualizador pessoal: texto escapado, imagens com zoom, PDF isolado, download, erros de imagem e liberação de URLs em atualização/desmontagem.
- Documentos oficiais: contrato url/name mantido, leitura de mesma origem sem credenciais na URL, query ou fragmento; redirects recusados. GET com timeout e leitura limitada por stream, MIME e assinatura PDF verificados, prévia isolada, download alternativo e zoom de imagens. Nenhuma API de escrita oficial foi adicionada.

<!-- === ARQUIVOS DE IMPLEMENTAÇÃO E TESTES === -->

## Arquivos de implementação e testes

- src/apps/files/Files.jsx
- src/services/storage/fileModel.js
- src/services/storage/localFilesStorage.js
- src/apps/file-editor/FileEditor.jsx
- src/apps/file-viewer/LocalFileViewer.jsx
- src/apps/file-viewer/FileViewer.jsx
- src/shared/i18n/locales/pt-BR.json e en.json (mensagem de limite da prévia)
- tests/core/files.test.cjs
- tests/core/files-storage.test.cjs
- tests/core/files-ui.test.cjs

Core, close guards, useLocalFiles, Currículo e Certificados foram inspecionados e preservados. Os contratos existentes continuam sendo fileId para pessoal e url/name para documento público. Certificados pode manter links de navegador como já implementado.

<!-- === EVIDÊNCIAS === -->

## Evidências

Testes automatizados exercitam modelo, handlers dos componentes e serviço com IndexedDB simulado: concorrência, rollback/quota, notificações, importação, limites, conflitos, recuperação, recursos e integrações.

Ensaio adicional com Edge headless, perfil novo e origem localhost isolada, usando o serviço real e IndexedDB real: criação; leitura por segundo contexto; BroadcastChannel; gravações e nomes duplicados concorrentes; renomear/mover/ciclos; PNG produzido por canvas e decodificado; PDF/arquivo inválido; lixeira/restauração/purga; persistência ao recarregar contexto. Oito cenários aprovados. Nenhuma origem habitual ou produção foi acessada.

A validação final usa npm run lint, npm run build e npm run test. Lint e build aprovados; 185 testes aprovados, zero falhas (24 testes adicionais neste bloco). Não houve instalação de dependências.

<!-- === LIMITES E PRÓXIMA ETAPA === -->

## Limites e próxima etapa

Sem redesign, novos modos de gerenciamento, reorganização do projeto ou alterações de produção. Revisão visual/UX, acessibilidade assistiva em dispositivos físicos, arrastar/soltar, busca, seleção múltipla, navegação entre coleções, exportação completa e formatos adicionais permanecem para avaliação posterior, sem inclusão automática no escopo.

A renderização nativa de PDF depende do navegador; o download permanece disponível. Quota física esgotada foi simulada, não provocada no disco do usuário. Importação textual aceita UTF-8; conversão de outras codificações pode ser considerada depois. Mudança de origem ou limpeza do navegador continua podendo remover o acesso aos arquivos locais.

Commits são locais e organizados por bloco; nenhum push foi realizado.

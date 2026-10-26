<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === ETAPA 08 — NOTAS E GERENCIAMENTO EDITORIAL === -->

# Etapa 08 — Notas e gerenciamento editorial

<!-- === ESTADO: IMPLEMENTADA E VALIDADA LOCALMENTE; ACEITE EXTERNO PENDENTE === -->

## Estado: implementada e validada localmente; aceite externo pendente

Decisões preservadas: DEC-103/109/110 e DEC-390/391. Notas continua um blog público com edição administrativa autenticada; a Administração reutiliza NotesAdmin. Nenhuma operação externa, migração, credencial, commit ou push foi realizada. Etapa 09 não iniciada.

<!-- === ENTREGAS TÉCNICAS === -->

## Entregas técnicas

- Listagem, pesquisa por conteúdo/assunto e leitura existentes preservadas. Entradas compartilhadas indisponíveis exibem estado próprio e retorno ao catálogo, sem alterar a URL do navegador.
- Consultas e mutações de Notas/curtidas usam o transporte compartilhado com timeout; cancelamento de leituras e escritas no encerramento da instância, e descarte de confirmações de sessões antigas.
- Editor só descarta o texto após confirmação referente à publicação correta. Backend também valida identidade/status da edição.
- Criação utiliza identidade estável por rascunho. Reenvio após perda de confirmação encontra a criação anterior pela restrição única existente, confere conteúdo e evita duplicação. Conteúdo divergente ou publicação já alterada retorna conflito e preserva o texto. Compatibilidade com clientes anteriores mantida.
- Limite do corpo editorial de 80 KiB acomoda a codificação JSON/Unicode dos 10.000 caracteres autorizados; limites individuais continuam ativos.
- Exclusão do editor envia a revisão observada e recusa uma publicação modificada por outra janela. Cliente legado sem revisão mantém o contrato anterior.
- Invalidações públicas revalidam listas administrativas e contagens de curtidas entre instâncias/abas pelo transporte existente, sem transmitir conteúdo privado ou identidade do visitante.
- Anexos públicos são lidos pelo endpoint autorizado, validados integralmente e abertos pelo contrato existente do Visualizador, com origem exata e sem credenciais em URLs. Bytes continuam protegidos no backend.
- Gerenciamento permite selecionar/enviar/vincular anexos e remover vínculos. Limites: cinco anexos por publicação, 10 MiB por arquivo e formatos PDF/TXT/PNG/JPEG/WebP. Validação de assinatura e concorrência permanece no servidor.
- Cada arquivo selecionado mantém identidade estável; retomada consulta seus metadados antes de repetir upload ou vínculo. Falha de confirmação preserva a seleção e orienta atualizar a lista. Remover vínculo não apaga o arquivo oficial.
- Guardas de fechamento contemplam texto, seleção de anexo e operações em andamento. Atualizar a lista preserva o gerenciador montado. Textos do editor permanecem em memória após expiração da sessão.
- CSS editorial passa a ser carregado pelo módulo compartilhado, inclusive na Administração. Internacionalização preservada; traduções novas registradas abaixo para a fase final.

<!-- === VALIDAÇÃO REALIZADA === -->

## Validação realizada

- npm run lint: aprovado, sem avisos.
- npm run build: aprovado.
- npm run test: 431 testes aprovados, zero falhas.
- git diff --check: aprovado.
- Novas regressões: confirmação de edição de outra publicação (UI/backend); identidade estável após falha de rede; criação idempotente/conteúdo divergente; corpo Unicode dentro do limite; descritor de abertura e origem exata; rejeição de metadados privados; recuperação de upload sem duplicação; limite de cinco anexos; revalidação de curtidas.
- O ciclo do Worker de login/criação/edição/publicação/curtida/despublicação/exclusão/logout passou com dependências externas controladas. Isso não equivale a homologação do banco real.

<!-- === ARQUIVOS DA ETAPA === -->

## Arquivos da etapa

- src/apps/notes/Notes.jsx
- src/apps/notes/NotesAdmin.jsx
- src/apps/notes/PostLikes.jsx
- src/apps/notes/PostAttachments.jsx (novo)
- src/apps/notes/PostAttachmentManager.jsx (novo)
- functions/api/adminPosts.js
- tests/core/notes-ui.test.cjs
- tests/core/notes-api.test.cjs
- tests/core/adminPostsUpdate.test.cjs
- tests/core/i18n-coverage.test.cjs: exige tradução ou pendência nominativa registrada, limitada aos arquivos de Notas; rejeita registros sem correspondência. Tradução adiada não é declarada concluída.
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md
- docs/backend/CONFIGURACAO.md
- docs/finalizacao/ETAPA-08-ANDAMENTO.md

Notes.css foi formatado, sem alteração semântica. Demais alterações locais das etapas anteriores preservadas.

<!-- === CONFIGURAÇÃO E ACEITE EXTERNO === -->

## Configuração e aceite externo

Nenhuma migração nova necessária. Conferir no ambiente autorizado as migrações existentes 001–004 (auth/publicações/curtidas), 008–010 (arquivos/vínculos/integridade/índice), RLS, Storage privado, políticas e segredos previstos no guia backend. Anexos dependem de MANAGED_FILES_ENABLED=true e da configuração de Storage existente. Não foram ativados serviços nem aplicadas migrações nesta tarefa.

Permanecem pendentes: ciclo real em homologação, upload/download real de anexos e prova de acesso negado após despublicação; sincronização entre abas reais com backend habilitado; aceite visual/de toque nos dois shells; traduções na fase final. Nenhuma publicação/curtida/upload real foi produzida para testar.

Anexos enviados mas não vinculados após cancelamento/conflito continuam como arquivos privados identificáveis; não há exclusão automática que possa apagar dados. Gestão/limpeza geral desses recursos permanece na Administração, sem ampliar esta etapa.

<!-- === CONTINUIDADE === -->

## Continuidade

Próxima etapa: 09 — Calculadora, após autorização de avanço. Preservar alterações locais, não executar novamente scripts temporários de edição e não repetir validações sem mudança que justifique. Nenhum commit/push foi feito. Sugestão após revisão: feat: finaliza notas anexos e gerenciamento editorial

<!-- === TRADUÇÕES ADIADAS POR INSTRUÇÃO DO USUÁRIO === -->

## Traduções adiadas por instrução do usuário

Os JSONs permanecem intactos. As chaves literais abaixo continuam em português até a fase final; o teste exige tradução ou este registro explícito por arquivo.

- PENDENTE_I18N src/apps/notes/Notes.jsx :: Esta publicação não está disponível.
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Sessão administrativa encerrada. Suas alterações permanecem nesta janela; entre novamente pelo Terminal para continuar. Se havia uma operação em andamento, confira a lista antes de reenviar.
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Fechar editor
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Criar rascunho
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Editar publicação
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Nova publicação
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Resumo
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Conteúdo
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Assuntos (separados por vírgula)
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Salvando...
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Salvar alterações
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Salvar rascunho
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Cancelar edição
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Ocultar minhas publicações
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Gerenciar publicações
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Publicações e rascunhos
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Carregando...
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Nenhuma publicação cadastrada.
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Processando...
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Excluindo...
- PENDENTE_I18N src/apps/notes/NotesAdmin.jsx :: Anexos
- PENDENTE_I18N src/apps/notes/PostLikes.jsx :: Curtidas da publicação
- PENDENTE_I18N src/apps/notes/PostLikes.jsx :: Registrando...
- PENDENTE_I18N src/apps/notes/PostLikes.jsx :: Curtido
- PENDENTE_I18N src/apps/notes/PostLikes.jsx :: Curtir
- PENDENTE_I18N src/apps/notes/PostLikes.jsx :: Carregando curtidas...
- PENDENTE_I18N src/apps/notes/PostLikes.jsx :: Curtidas indisponíveis
- PENDENTE_I18N src/apps/notes/PostAttachments.jsx :: Carregando anexos...
- PENDENTE_I18N src/apps/notes/PostAttachments.jsx :: Anexos
- PENDENTE_I18N src/apps/notes/PostAttachments.jsx :: Não foi possível carregar os anexos desta publicação.
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Limite de cinco anexos por publicação.
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Anexos atualizados.
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Operação não confirmada. Atualize a lista antes de tentar novamente; o arquivo selecionado foi preservado.
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Gerenciar anexos
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Até cinco anexos de 10 MB: PDF, texto, PNG, JPEG ou WebP. Anexos só ficam públicos com a publicação.
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Lista de anexos inválida. Atualize a lista.
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Remover vínculo
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Selecionar anexo
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Arquivo inválido, formato não permitido ou maior que 10 MB.
- PENDENTE_I18N src/apps/notes/PostAttachmentManager.jsx :: Enviar e vincular anexo

Também traduzir mensagens dinâmicas de erro/sucesso de NotesAdmin/PostLikes e os plurais de curtidas; confirmar os templates na revisão final.

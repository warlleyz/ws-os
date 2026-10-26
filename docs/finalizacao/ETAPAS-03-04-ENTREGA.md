<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === WS OS V2 — ENTREGA DAS ETAPAS 03 E 04 === -->

# WS OS V2 — entrega das Etapas 03 e 04

Data: 20/10/2026. Base: `d7167db`. Alterações locais para revisão, sem commit ou push. Nenhuma migração, credencial, binding remoto, flag de produção ou serviço externo foi alterado.


<!-- === ATUALIZAÇÃO POSTERIOR — MIGRAÇÃO PARA SUPABASE STORAGE === -->

## Atualização posterior — Migração para Supabase Storage

Em 20/10/2026, foi aprovada a substituição do Cloudflare R2 pelo Supabase Storage para os arquivos oficiais.

O projeto Supabase `ws-os-dev` recebeu o bucket privado `ws-os-official-files`, limitado a 10 MB por objeto e aos formatos PDF, TXT, PNG, JPEG e WebP.

A implementação local foi adaptada para utilizar a API do Supabase Storage, mantendo o Worker como intermediário e o PostgreSQL como fonte dos metadados e estados.

Foram atualizados os testes simulados de armazenamento. Durante a validação, foram corrigidas uma atribuição desnecessária identificada pelo ESLint e a construção da URL do bucket. O usuário informou que os testes passaram após essas correções.

**Homologação ainda pendente:**

- Validar operações reais no Supabase Storage.
- Confirmar leitura de metadados e tratamento de erros do provedor.
- Testar permissões com sessões reais.
- Verificar concorrência e recuperação de operações interrompidas.
- Executar os testes de RLS e confirmar a configuração do Worker no ambiente autorizado.

As referências a R2 nas seções históricas seguintes descrevem a implementação original e não representam a arquitetura vigente.

**Situação da Etapa 03:** em execução; não homologada integralmente.

<!-- === ESTADO VERDADEIRO === -->

## Estado verdadeiro

| Etapa | Estado |
|---|---|
| 03 — Backend, políticas e serviços | Implementação local preparada e testada; **bloqueada externamente para aceite integral** por aplicação/homologação PostgreSQL/RLS, bindings R2/D1, runtime Cloudflare e provedores reais. |
| 04 — Core, janelas e preferências | Correções funcionais e validação local concluídas, prontas para revisão. Aceite do proprietário e matriz de dispositivos/monitores físicos permanecem pendentes. |

Não equivale a certificar produção nem a afirmar que todos os aplicativos estão finalizados. Não foram iniciadas as interfaces das Etapas 05 em diante. A Etapa 05 receberá os serviços preparados; as telas de Contato, Notas e Administração serão integradas nas etapas proprietárias.

Referências: plano por etapas; mestre v0.16.0, especialmente DEC-065–070, 134–155, 302–354, 435–442, 453–458, 474, 481, 485 e 600; decisões DEC-FIN-001–022; contratos TEC-014–043.

<!-- === ETAPA 03 — ENTREGAS === -->

## Etapa 03 — entregas

<!-- ----- CORREÇÃO PENDENTE DE CONTEÚDO GERENCIADO ----- -->

### Correção pendente de conteúdo gerenciado

`managedContent.js` preserva `expectedId` a partir do corpo validado e exige exatamente uma linha com esse ID em POST, PATCH e DELETE. A query não participa da confirmação. Resposta vazia, ID diferente ou múltiplas linhas resultam em conflito, sem falso sucesso. DELETE não tenta reconstruir o ID de um corpo upstream inexistente.

Mantidos autorização por operação, revisão `updatedAt`, limite do corpo, leitura pública de publicados e projeção de colunas. Eventos agora preservam `allDay`, `startsAt`, `endsAt` e `timezone`, com validação de instantes/fuso e rejeição de campos privados. A data local continua disponível para o Calendário legado. Catálogo aceita referência `resourceId` mutuamente exclusiva com URL estática; a listagem legada continua filtrando os estáticos até a integração da Etapa 05.

<!-- ----- SOLICITAÇÕES PRIVADAS E NOTIFICAÇÃO ----- -->

### Solicitações privadas e notificação

- `/api/requests`: POST protegido por validação, consentimento, honeypot, Turnstile e limite D1. Recebe `type` (`message`/`schedule`), nome, e-mail, mensagem, chave idempotente e, para agendamento, instante e fuso. Nunca confirma reunião ou publica evento.
- Criação por RPC com trava transacional por chave, fingerprint do conteúdo e vínculo ao identificador protegido do visitante. Chave reaproveitada para outro conteúdo/visitante conflita. Reenvio válido retorna o mesmo ID. O identificador derivado do IP não garante unicidade de pessoa e uma mudança de rede pode exigir reconciliação.
- `/api/admin/requests`: GET paginado por `offset` (100 itens), PATCH por ID/revisão/estado e DELETE por ID/revisão/`confirm:true`. JWT administrativo, RLS e atualização condicional; nenhuma listagem pública.
- Seis estados e retenção terminal de 180 dias, sem prorrogar ao arquivar um pedido concluído. Histórico mínimo no banco registra revisão, ator, transição e instante; não duplica nome/e-mail/mensagem.
- EmailJS opcional no servidor, com resultado independente da persistência. Reclamação única antes do envio evita duplicação no retry. Estados `sending`/`unknown` exigem reconciliação, sem reenvio automático. Erro/timeout não vira confirmação de e-mail ou de reunião.
- Rotina `purge_expired_private_requests` preparada; ativação agendada é opt-in, não foi configurada. Exclusão remove também o histórico associado.

<!-- ----- R2, CATÁLOGO E ANEXOS ----- -->

### R2, catálogo e anexos

- Bucket privado por binding `OFFICIAL_FILES`; nenhum arquivo pessoal é enviado ao servidor.
- Metadados administrativos, finalidade `catalog`/`attachment`, visibilidade, estados e revisão. Nome/tipo/tamanho validados com os contratos existentes; até 10 MB, formatos PDF/TXT/PNG/JPEG/WebP. Validação de assinatura é defesa de formato, não antivírus ou parser completo de documentos.
- Criação de metadados, upload binário, consulta, publicação/privatização e exclusão pelo Worker. Chave de objeto gerada no servidor, não devolvida nas projeções.
- Upload verifica tamanho real, MIME/assinatura, SHA-256 e gravação condicional; não sobrescreve objeto existente. Após interrupção, consultar metadados e repetir os mesmos bytes com a revisão atual reconcilia o estado `uploading`.
- Exclusão passa por `deleting`; somente confirma `deleted` depois de o R2 confirmar a remoção. Resposta incerta exige consultar o estado. Exclusão de um upload ativo é recusada para impedir corrida com uma gravação em curso; reconciliar primeiro. Uma interrupção entre banco/R2 é visível e não é tratada como transação distribuída concluída.
- `/api/files` lista catálogo público (máximo 200); com `id`, entrega somente recurso disponível e efetivamente público, ou anexo de publicação já publicada e com data válida. Não há URL pública direta do bucket. Resposta sem cache público, com MIME, tamanho, download e proteção contra interpretação indevida.
- `/api/admin/files` permite listagem paginada, consulta individual e download autenticado (`id` e `download=1`). PUT/PATCH/DELETE exigem `If-Match` numérico; DELETE exige `X-Confirm-Delete:true`.
- `/api/admin/attachments`: POST/DELETE vinculam/desvinculam recurso disponível com revisão da publicação. RPC serializa por publicação e limita a cinco anexos; `/api/posts/attachments?postId=...` só projeta anexos publicáveis. Exclusão de publicação remove vínculos; exclusão de arquivo retira referências e atualiza as publicações afetadas.
- Substituir documento oficial significa criar novo recurso e atualizar a referência na etapa do aplicativo; o objeto disponível é imutável. Reconciliação operacional e limpeza de resíduos após interrupções devem ser verificadas no R2 real antes da ativação.

<!-- ----- RANKINGS, SERVIÇOS E INTEGRAÇÕES ----- -->

### Rankings, serviços e integrações

- Mantidos melhores resultados atômicos por jogo/visitante, validação de apelidos e limites Snake/Flappy, proteção de escrita e projeção pública mínima. Resposta pública também valida os resultados recebidos.
- `/api/admin/rankings`: listagem administrativa limitada e remoção confirmada por jogo/hash do visitante; exige autorização no servidor. Hash nunca entra na projeção pública. Pontuação originada no navegador não é prova antifraude absoluta.
- `backendDomainService.js` disponibiliza chamadas de solicitações, arquivos e vínculos, usando sessão em memória, cancelamento por versão, timeout e classificação de resultado incerto. Mutações invalidam cache público pertinente; sinalização de `/api/files` entra na allowlist entre abas. Dados privados não são transmitidos nesses sinais.
- GitHub/paginação, WakaTime, curtidas e APIs editoriais existentes foram preservados e passaram pela regressão. Não foi substituído o fluxo dos aplicativos posteriores.
- Clima valida coordenadas antes da rede. Geocodificação agora usa timeout/cancelamento também durante a leitura do JSON. Cache de clima no consumidor existente foi preservado.
- Gemini continua desligado na configuração existente; testes comprovam bloqueio antes de rede/cotas. Não houve chamada autenticada ou ativação de fornecedor.
- Manutenção D1 remove somente registros vencidos das quatro tabelas conhecidas. Migração 004 prepara a tabela de limites Wally ausente do histórico. Hook `scheduled` preparado; não foi criado cron remoto.

<!-- === MIGRAÇÕES E HOMOLOGAÇÃO OBRIGATÓRIA === -->

## Migrações e homologação obrigatória

As migrações 001–006 foram preservadas. Novas migrações, ainda **não aplicadas**:

1. `database/migrations/007_private_requests.sql`: pedidos, histórico, retenção, notificação e RPCs restritos.
2. `database/migrations/008_official_files.sql`: metadados, anexos, acesso público mediado e limite transacional de vínculos.
3. `database/migrations/009_integrity_policies.sql`: identidade/revisão no banco, limpeza de vínculos e catálogo público.
4. `database/d1/migrations/004_wally_limits.sql`: base e índice de expiração Wally.

Não reescrever migrações antigas já aplicadas. Em ambiente de teste separado, aplicar as dependências em ordem, conferir grants/políticas preexistentes e executar `database/tests/etapa03_rls.sql` como operador autorizado, fornecendo UUID de administrador de teste existente. O roteiro contém transação e ROLLBACK; **não foi executado aqui**. Não substitui testes com JWTs reais, concorrência entre transações, planos de execução e validação de políticas adicionais no projeto Supabase.

Os testes locais executaram as migrações D1 em SQLite em memória e verificaram limpeza preservando registros não vencidos. Isso não homologa o binding D1 Cloudflare. Não havia PostgreSQL/psql ou Wrangler disponível nesta execução; nenhum pacote foi instalado para contornar essa ausência.

Para homologação real: ambiente Supabase separado, R2 privado de teste, D1 isolado, runtime Worker e credenciais autorizadas dos provedores. Ver [configuração atual](../backend/CONFIGURACAO.md). Não marcar esta etapa como integralmente concluída antes dessas evidências.

<!-- === ETAPA 04 — ENTREGAS E COMPATIBILIDADE === -->

## Etapa 04 — entregas e compatibilidade

- Instâncias, abertura contextual, foco, retorno, permissões e URL estável preservados e cobertos pela regressão. Aberturas contextuais múltiplas continuam seguindo o Registry; não foi imposta instância única a Projetos.
- Arraste/resize atualizam geometria local via `requestAnimationFrame`; 200 movimentos consecutivos produzem um trabalho pendente no teste, sem render global. Pointerup aplica a posição final mesmo antes do próximo frame.
- Escape cancela frame/captura, recupera geometria e modo anteriores, inclusive vindo de snap/maximizado. Desmontagem e minimização liberam trabalho pendente e prévia.
- Arraste admite saída parcial mantendo faixa do título recuperável. Resize respeita limites do espaço disponível; viewports extremos reduzem o mínimo para caber, sem dimensões negativas.
- Dimensões iniciais por tarefa no Registry; mínimos declarados, geometria transitória na sessão. Nada reabre janelas ao recarregar.
- Movimento por setas na área de arraste, passo maior com Shift; resize por teclado preservado. Sem novos botões ou redesign.
- Troca Desktop/Mobile usa a confirmação central para todos os rascunhos protegidos. Cancelar preserva o shell/rascunho; confirmar permite desmontar e trocar. Retornar ao shell já ativo não pede descarte; destino é revalidado após confirmação. Cancelada a troca, a próxima tentativa ocorre ao atravessar novamente o breakpoint.
- Cursor incluído no inventário e no reset de aparência. “Não perturbe” ganhou sincronização entre abas e reset específico. Reset continua por allowlist, preservando arquivos pessoais e dados fora do escopo.
- Preferências legadas, falha/quota de armazenamento, defaults, IndexedDB de wallpapers, URLs temporárias, hidratação tardia e reset parcial foram cobertos pelos testes existentes, sem reimplementar os mecanismos que já funcionavam.

<!-- ----- LIMITES DO ACEITE DO CORE ----- -->

### Limites do aceite do Core

ErrorBoundary existente continua isolando falhas para que outros aplicativos e seus rascunhos não sejam derrubados. Não há promessa de recuperar automaticamente todo estado volátil interno de um componente que tenha sofrido exceção fatal; essa recuperação depende do domínio e deverá ser verificada ao fechar seus editores/formulários. Não foi criada persistência silenciosa de dados privados para simular essa garantia.

Sessão expirada/logout e cancelamento de navegação têm regressões. Não foi feito login administrativo real nesta execução. Dispositivos físicos, múltiplos monitores e mudanças de escala do sistema operacional não foram homologados; os limites locais abaixo não certificam essa matriz.

<!-- === EVIDÊNCIAS DE VALIDAÇÃO === -->

## Evidências de validação

- `npm run lint`, `npm run build` e `npm run test` executados após conjuntos relevantes; validação final: **397 testes aprovados, zero falhas/cancelamentos/ignorados**.
- Testes específicos: identidade de mutações, autorização, idempotência, EmailJS incerto, uploads/remoção/reconciliação R2, D1 real em memória, roteamento do Worker real importado no Node, guards, geometria, frames, teclado, breakpoint do App e preferências.
- APIs novas usaram transporte/bucket controlados em testes; nenhum retorno simulado é evidência de sucesso em provedor real. Worker foi testado pelo entrypoint real, mas não no workerd/Cloudflare.
- Edge isolado com bundle compilado: arraste e resize com entrada de ponteiro; maximizar/restaurar preservando geometria; snap à esquerda; Escape recuperando maximização; múltiplas janelas/instâncias; minimizar e restaurar pela Taskbar preservando modo; viewport 1440×1000 e 1920×1080.
- Mobile emulado 390×844: rascunho de Contato, cancelar a troca, retornar ao Desktop sem nova confirmação indevida, tentar novamente e confirmar a transição. URL permaneceu `/`.
- Coleta de tarefas longas na amostra de arraste/resize/maximização inicial: nenhuma acima de 50 ms. Não é benchmark em hardware/dispositivos variados. A prévia foi recarregada após builds para repetir os fluxos no bundle vigente.
- Coleta de exceções espontâneas da aplicação nos fluxos finais: vazia. Falhas de seletor do script de inspeção foram corrigidas e não foram classificadas como defeitos do produto.

<!-- === TRADUÇÕES, COMMITS E CONTINUIDADE === -->

## Traduções, commits e continuidade

`pt-BR.json` e `en.json` permanecem byte a byte iguais à base. Reutilizado o rótulo traduzido da área de arraste; nenhuma chave de interface foi criada. Códigos dos novos serviços (por exemplo REQUESTS_NOT_CONFIGURED, FILES_NOT_CONFIGURED, INVALID_PRIVATE_REQUEST, INVALID_FILE_METADATA e CONFLICT) precisarão de apresentação por `t()` quando as interfaces proprietárias os consumirem; códigos técnicos não devem ser traduzidos no protocolo.

Sem commit, push ou arquivos temporários no repositório. Mudanças estão disponíveis no working tree para revisão. A Etapa 05 pode iniciar sua implementação local sobre estes contratos; não deve habilitar os recursos remotos em produção enquanto a Etapa 03 estiver bloqueada por homologação. Aceite físico/visual do proprietário permanece necessário.

<!-- === ARQUIVOS DA ENTREGA === -->

## Arquivos da entrega

Inventário do working tree relativo a `d7167db`, incluindo arquivos novos ainda não rastreados.

- database/d1/migrations/004_wally_limits.sql
- database/migrations/007_private_requests.sql
- database/migrations/008_official_files.sql
- database/migrations/009_integrity_policies.sql
- database/tests/etapa03_rls.sql
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md
- docs/backend/CONFIGURACAO.md
- docs/backend/WORKER.md
- docs/contracts.md
- docs/finalizacao/ETAPAS-03-04-ENTREGA.md
- functions/_lib/backend.js
- functions/_lib/maintenance.js
- functions/_lib/publicWriteProtection.js
- functions/_lib/requestNotification.js
- functions/api/attachments.js
- functions/api/managedContent.js
- functions/api/managedFiles.js
- functions/api/rankings.js
- functions/api/requests.js
- src/App.jsx
- src/core/appCloseGuards.js
- src/core/appRegistry.js
- src/core/notificationPreferences.js
- src/core/preferenceContract.js
- src/core/preferencesManager.js
- src/features/windows/Window.jsx
- src/features/windows/useWindowInteraction.js
- src/features/windows/windowGeometry.js
- src/services/backendDomainService.js
- src/services/contentService.js
- src/services/publicDataService.js
- src/services/storage/noteAttachmentContract.js
- src/services/weatherService.js
- tests/core/backend-domains.test.cjs
- tests/core/managed-content.test.cjs
- tests/core/settings.test.cjs
- tests/core/windows-interaction.test.cjs
- tests/core/worker.test.cjs
- tests/helpers/contract-loader.cjs
- worker/index.js


<!-- === ATUALIZAÇÃO DE HOMOLOGAÇÃO — 20/10/2026 === -->

## Atualização de homologação — 20/10/2026

<!-- ----- ESTADO DA ETAPA 03 ----- -->

### Estado da Etapa 03

**Implementação local concluída e testes principais aprovados. Homologação integral para produção ainda pendente.**

<!-- ----- HOMOLOGAÇÕES APROVADAS ----- -->

### Homologações aprovadas

- `npm run lint`, `npm run build` e `npm run test` aprovados.
- Supabase PostgreSQL com migrações 005–009 aplicadas no projeto `ws-os-dev`.
- Auditoria de RLS, privilégios de tabelas e execução de funções RPC.
- Autenticação administrativa real pelo Worker.
- Supabase Storage privado substituindo Cloudflare R2 como armazenamento oficial.
- Criação de metadados, upload, verificação SHA-256 e download administrativo de arquivo real.
- Recuperação de upload interrompido e exclusão interrompida.
- Exclusão física confirmada no Storage e estado `deleted` confirmado no PostgreSQL.
- Arquivos privados protegidos contra acesso público.
- Rankings Snake e Flappy consultados pelo Worker com HTTP 200.
- Validação negativa de jogo inválido, administração sem autenticação e arquivo excluído.
- Quatro tabelas de limitadores presentes no D1 local.
- Migrações D1 003 e 004 aplicadas localmente.

<!-- ----- AJUSTES REALIZADOS DURANTE A HOMOLOGAÇÃO ----- -->

### Ajustes realizados durante a homologação

- Substituição do adaptador R2 pelo adaptador Supabase Storage.
- Adequação à resposta real de metadados do Supabase Storage.
- Tratamento de HTTP 400 com código `NoSuchKey` e status interno 404.
- Correção da leitura pública de rankings para utilizar `service_role` exclusivamente no Worker.
- Atualização dos testes de regressão relacionados ao Storage.

<!-- ----- PENDÊNCIAS EXTERNAS E OPERACIONAIS ----- -->

### Pendências externas e operacionais

- Homologação completa de RLS com identidades reais de visitante, usuário comum e administrador.
- Validação do D1 remoto e da execução agendada de limpeza dos limitadores.
- Homologação de escrita real nos rankings com Turnstile e limitação de requisições.
- Homologação dos serviços externos que permanecem desabilitados ou indisponíveis.
- Aplicação e validação da migração incremental 010 para o índice `post_attachments(resource_id)`.
- Rotação de credenciais expostas e revogação das sessões administrativas comprometidas.
- Revisão das configurações e autorização formal antes de qualquer publicação em produção.

<!-- ----- CRITÉRIO DE CONTINUIDADE ----- -->

### Critério de continuidade

Os contratos de backend podem ser utilizados pelas próximas etapas de implementação local.

Nenhuma pendência externa deverá ser considerada aprovada sem evidência. As flags e integrações ainda não homologadas devem permanecer desabilitadas fora do ambiente de teste.

Esta atualização substitui as referências históricas ao R2 como armazenamento vigente, preservando-as apenas como registro da implementação anterior.

# Etapa 11 — Terminal, Wally e Administração

## Estado: implementação técnica validada localmente; homologação e acabamento final condicionados

Nenhum commit/push, migração, envio real, login remoto ou alteração de credenciais/configuração. WALLY_AI_ENABLED=false preservado. Alterações das etapas anteriores mantidas. Etapa 12 não iniciada.

## Bloco Terminal

- Argumentos de login não aparecem no log/histórico, inclusive variações com espaços/aspas ou argumentos inválidos. O formulário seguro continua sendo o único caminho de autenticação; comandos não executam shell.
- Fechar a instância cancela seu login pendente. loginAdmin aceita signal opcional, preservando consumidores anteriores e impedindo uma resposta tardia de criar sessão após cancelamento.
- Retorno de autorização não abre Administração se a instância já fechou. Aplicativos abertos pelo Terminal conservam originInstanceId exato.
- Ajuda, catálogo, autocomplete, histórico de sessão, logout com aviso de alterações pendentes e expiração existentes preservados. Composição de texto não dispara atalhos de edição prematuramente.

## Bloco Wally

- Painel e aplicativo continuam consumindo a conversa compartilhada, respostas locais e ações públicas autorizadas pelo actionService. Nenhum prompt/flag libera acesso administrativo.
- Finalizar uma resposta não apaga uma nova pergunta digitada durante a espera, nos dois consumidores.
- Abertura contextual pelo app completo conserva origem exata; composição de texto protegida.
- Resposta remota maior que o limite de 4000 caracteres ou finalizada após abort não é apresentada como resposta válida. Cancelamento, limites e fallback locais existentes preservados.
- IA remota não foi reativada nem homologada. Nenhuma chamada Gemini/Turnstile real foi produzida pelo agente.

## Bloco Administração

- Publicações continuam usando o mesmo NotesAdmin da Etapa 08, sem outro editor editorial.
- Solicitações privadas substituem o texto antigo de entrega somente por EmailJS: consulta paginada, leitura privada, alteração explícita de status com revisão e exclusão confirmada. Status não cria reunião/evento nem envia resposta automática ao solicitante. Dados privados são ocultados/limpos da listagem ao encerrar sessão, preservando seleção/formulário em memória.
- Arquivos oficiais: listagem paginada, upload privado com identificador estável, retomada por metadados após confirmação perdida, publicação/privatização do catálogo e exclusão confirmada com revisão. Não acessa arquivos pessoais de visitantes. Cancelar seleção não apaga automaticamente eventual arquivo privado já persistido; ele pode ser localizado na listagem pelo identificador exibido.
- Catálogo de documentos já existente permanece acessível em seção própria, utilizando AdminContent; eventos continuam nesse mesmo módulo de conteúdo gerenciado.
- Conteúdo gerenciado usa transporte com timeout e cancelamento, confirma identidade da mutação e conserva o formulário quando a resposta é inválida. Criação mantém o mesmo ID enquanto o formulário não for descartado; conflito após resultado incerto requer atualizar a lista/conferir o registro, sem gerar nova identidade silenciosamente.
- Moderação usa a API administrativa existente de rankings e exige confirmação. A pontuação observada é enviada na exclusão; backend filtra/verifica esse valor para recusar registro modificado entre consulta e ação. Compatibilidade de clientes anteriores mantida.
- Hook administrativo compartilhado limita o ciclo de dados privados: paginação, operação única, confirmação de versão da sessão, cancelamento, mensagens e proteção de alterações pendentes. Serviços do domínio invalidam somente a sessão correspondente em 401/403.
- Sistema continua informativo sobre os limites reais do painel; não foi criado gerenciamento de infraestrutura/produção.

## Validação realizada

- npm run lint: aprovado, sem avisos.
- npm run build: aprovado.
- npm run test: 462 testes aprovados, zero falhas.
- git diff --check: aprovado.
- Doze regressões novas: login sanitizado/log/histórico, origem do Terminal, login cancelado sem sessão tardia, cancelamento e limpeza de dados privados, revisão da solicitação, retomada de arquivo sem segundo upload, confirmação de moderação, rejeição backend de pontuação alterada, preservação de nova pergunta Wally, limite remoto e formulário editorial diante de identidade incorreta.
- DOM/hooks, relógios, rede e serviços externos foram controlados pelos testes; não houve homologação de escrita remota ou aceite visual físico. Testes anteriores de autorização, ações, RLS preparada, notas e Wally continuam passando.

## Arquivos da etapa

- src/apps/terminal/Terminal.jsx
- src/apps/terminal/terminalCommands.js
- src/services/authService.js
- src/apps/wally-extended/WallyExtended.jsx
- src/features/wally/WallyPanel.jsx
- src/services/wallyRemoteService.js
- src/apps/administration/Administration.jsx
- src/apps/administration/Administration.css
- src/apps/administration/AdminContent.jsx
- src/apps/administration/AdminPosts.jsx (formatação; composição preservada)
- src/apps/administration/AdminRequests.jsx (novo)
- src/apps/administration/AdminFiles.jsx (novo)
- src/apps/administration/AdminRankings.jsx (novo)
- src/apps/administration/useAdministrativeResource.js (novo)
- src/services/backendDomainService.js
- functions/api/rankings.js
- tests/core/management-ui.test.cjs (novo)
- tests/core/notes-auth.test.cjs
- tests/core/backend-domains.test.cjs
- tests/core/i18n-coverage.test.cjs (registros nominativos também da Etapa 11)
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md
- docs/backend/CONFIGURACAO.md
- docs/finalizacao/ETAPA-11-ANDAMENTO.md

## Pendências legítimas e aplicação manual

- Sem migração nova. Homologar com migrações existentes 001–010, papéis/RLS e variáveis já descritas no guia backend: auth, conteúdo, solicitações privadas, Storage e rankings. Nenhuma configuração foi ativada nesta tarefa.
- Validar em ambiente autorizado login/logout, expiração, CRUD de eventos/documentos, upload/publicação/exclusão oficial, paginação de solicitações e moderação real de ranking. Conferir efeitos de retenção sem alegar que a UI implementa limpeza automática.
- Wally permanece local com remoto desativado por instrução anterior. Homologação Gemini e orçamento real só se houver autorização para reativar/configurar, com os limites já existentes.
- Conferir PT/EN final, foco, navegação e toque nos dois shells. Traduções não foram concluídas; os JSONs continuam intactos.
- Não foram revistos/redesenhados os shells ou aplicativos fora das necessidades desta etapa. Etapa 12 permanece o próximo bloco de composição do Desktop.

## Traduções adiadas

- PENDENTE_I18N src/apps/terminal/Terminal.jsx :: Autenticação administrativa
- PENDENTE_I18N src/apps/terminal/Terminal.jsx :: Senha
- PENDENTE_I18N src/apps/administration/AdminFiles.jsx :: Selecionar arquivo oficial
- PENDENTE_I18N src/apps/administration/AdminFiles.jsx :: Enviar arquivo oficial
- PENDENTE_I18N src/apps/administration/AdminFiles.jsx :: Descartar seleção de arquivo pendente?
- PENDENTE_I18N src/apps/administration/AdminFiles.jsx :: Próxima página
- PENDENTE_I18N src/apps/administration/AdminFiles.jsx :: Página anterior
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Excluir esta solicitação e seus dados pessoais definitivamente?
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Confirmar alteração do status desta solicitação?
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Solicitações privadas
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Alterar o status não confirma reunião e não cria evento público.
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Próxima página
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Página anterior
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Retenção até
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Status
- PENDENTE_I18N src/apps/administration/AdminRequests.jsx :: Sessão encerrada. O formulário foi preservado nesta janela.
- PENDENTE_I18N src/apps/administration/AdminRankings.jsx :: Excluir esta pontuação pública definitivamente?
- PENDENTE_I18N src/apps/administration/AdminRankings.jsx :: Moderação de rankings
- PENDENTE_I18N src/apps/administration/AdminRankings.jsx :: Pontuações do navegador não comprovam uma partida legítima.

Também revisar na fase final os estados dinâmicos Nova/Em análise/Aguardando resposta/Respondida/Concluída/Arquivada, títulos das seções e mensagens de confirmação de exclusão/visibilidade/status. Os JSONs não foram editados.

## Continuidade

Próxima: Etapa 12 — Desktop, Taskbar, menu, painéis e widgets, após autorização de avanço, em blocos independentes. Preservar estado Git e documentos; não reexecutar scripts temporários de edição. Não fazer commit/push sem autorização. Sugestões após revisão: fix: protege autenticacao e historico do terminal; fix: preserva rascunhos e cancelamento do wally; feat: integra gerenciamento administrativo aos servicos existentes

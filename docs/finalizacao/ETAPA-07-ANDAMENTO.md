# Etapa 07 — Contato e solicitações

Atualizado em 21/10/2026. **Estado: implementação técnica local concluída e validada; envio real e aceite integral dependem da configuração/homologação externa abaixo.** Não declara e-mail recebido, pedido real persistido ou produção aprovada nesta execução.

## Fluxo entregue

- Contato utiliza exclusivamente submitPrivateRequest e /api/requests. O envio direto do navegador ao EmailJS foi removido de contactService; não há dois caminhos de notificação.
- Canais profissionais seguros continuam disponíveis, mesmo sem configuração do formulário.
- Nome, e-mail, mensagem, consentimento, honeypot, tipo e tempo mínimo de preenchimento validados. Mensagem permanece limitada a 5000 caracteres; agendamento a uma data futura dentro de um ano.
- Data local convertida para instante ISO com fuso IANA do dispositivo. Horários locais inexistentes/normalizados silenciosamente e datas impossíveis são rejeitados. O fuso usado fica visível junto ao campo.
- Turnstile existente reutilizado com action public-write, independentemente da IA Wally estar desligada. Token é renovado após cada tentativa, nunca persistido.
- Pedido original normalizado e chave idempotente criados uma vez, guardados somente na memória da instância. Nenhum nome/e-mail/mensagem/chave vai ao localStorage, IndexedDB ou BroadcastChannel.
- Resultado incerto preserva pedido, chave e texto. Retry explícito reutiliza o mesmo conteúdo e troca somente o desafio. Uma recusa de uma tentativa posterior não prova que a tentativa anterior deixou de persistir: a chave continua protegida.
- Durante incerteza, texto permanece somente leitura e selecionável para cópia; tipo/consentimento não podem alterar o pedido original. Durante gravação, controles e envio ficam bloqueados. Nova submissão concorrente é recusada.
- Somente persisted=true com requestId e estado de entrega válidos limpa o formulário. Recibo apresenta ID do pedido; confirmação de e-mail é independente. Falha/timeout não vira sucesso e persistência não confirma reunião nem cria evento público.
- Rascunho, agendamento preenchido, operação em andamento e resultado incerto acionam o guard existente de fechamento/reload. Desmontagem cancela a espera sem prometer desfazer uma escrita já enviada.
- Serviço mantém limite local entre novos pedidos, além das proteções reais no Worker. Validação/antispam do navegador não substituem Turnstile, limitação D1 e RLS.

## Compatibilidade e organização

- Backend, modelos de solicitações e APIs administrativas anteriores preservados. A Administração da Etapa 11 reutilizará /api/admin/requests e backendDomainService; não foi criado um segundo CRUD nem uma tela fora do escopo.
- Limite HTTP do POST público passou de 16 KiB para 40 KiB: texto de 5000 caracteres Unicode, campos e token podem exceder 16 KiB. Limites de conteúdo não foram aumentados; corpo maior continua rejeitado antes do banco.
- Textos existentes reutilizados via t(); nenhum JSON de tradução alterado. Informativo antigo que prometia envio direto por e-mail retirado.
- CSS restrito ao Contato: organização de campos, legibilidade do recibo, redimensionamento do texto e controles responsivos.
- Helper de componentes extraído para tests/helpers/app-ui.cjs para compartilhar a infraestrutura dos testes de Contato e aplicativos profissionais, sem duplicá-la.
- Não foram alteradas credenciais, flags de solicitações, migrações, dependências, configuração remota ou o estado desligado do Wally.

## Validação

- npm run lint: aprovado, sem avisos.
- npm run build: aprovado.
- npm run test: **422 aprovados; zero falhas/cancelamentos/ignorados**.
- Regressões de serviço atualizadas para a API privada: validação, configuração ausente, confirmação só após resposta, e-mail independente, limitação entre pedidos e reenvio com chave estável.
- Regressões da interface: resultado incerto seguido de rate limit e retry; campos protegidos/rascunho preservado; envio duplo bloqueado; cancelamento ao desmontar; agendamento isolado protegido; canais disponíveis sem configuração.
- Handler real com dependências controladas: mensagem Unicode no limite aceita até a proteção, sem ultrapassar o limite HTTP; corpo excedente rejeitado. Nenhum transporte de banco/e-mail real nessa regressão.
- Regressões anteriores de backend, idempotência, notificação e privacidade continuam aprovadas.
- git diff --check: aprovado. Não foram repetidos ensaios de navegador/IndexedDB das etapas anteriores.

Não foram enviados formulários/e-mails reais nem homologados Turnstile, entrega EmailJS, teclado virtual ou dispositivos físicos nesta execução. Testes controlados não comprovam esses aceites.

## Configuração e homologação manual

1. Frontend precisa de VITE_TURNSTILE_SITE_KEY público válido para o hostname autorizado. A presença da chave só habilita o desafio; não comprova que o Worker/banco estejam disponíveis.
2. Worker precisa de REQUESTS_ENABLED=true, configuração Supabase existente, migração 007 e dependências já preparadas, D1/limitadores, PUBLIC_WRITE_HASH_SALT e TURNSTILE_SECRET_KEY. Conferir o histórico real; não reaplicar migrações indiscriminadamente.
3. Turnstile deve aceitar o hostname de teste e action public-write. Não substituir por token/chave fictícios nem relaxar a validação do servidor.
4. E-mail é opcional à persistência e acontece somente no servidor: EMAILJS_NOTIFICATIONS_ENABLED=true, serviço/template/chaves autorizados. Os IDs legados em portfolio.contact não são usados pelo novo transporte. Homologar template e recebimento antes de habilitar notificações reais.
5. Em ambiente autorizado: mensagem/agendamento reais de teste; consentimento inválido; usuário comum/anon sem leitura de pedidos; perda de resposta e retry da mesma chave; desafio novo por tentativa; limite; e-mail ausente/falho/incerto; retenção/estados administrativos conforme Etapa 03.
6. Uma mudança de rede pode mudar o identificador do visitante e exigir reconciliação operacional. Se um agendamento vencer enquanto o resultado for incerto, a API pode recusar o retry; preservar chave/texto e verificar o pedido pelos canais autorizados, sem criar outro automaticamente.
7. Sobre o Sistema ainda possui descrição histórica de solicitações entregues somente por EmailJS; atualizar essa apresentação na Etapa 14 junto da revisão de conteúdo/tradução. Não confundir esse texto com o transporte atual.

Estas ações não foram executadas automaticamente. A etapa está pronta localmente, mas a habilitação/homologação real continua condição explícita para aceite integral.

## Arquivos da Etapa 07

- src/apps/contact/Contact.jsx
- src/apps/contact/Contact.css
- src/services/contactService.js
- functions/api/requests.js
- tests/core/contact-ui.test.cjs
- tests/core/utilities.test.cjs
- tests/core/backend-domains.test.cjs
- tests/core/portfolio-ui.test.cjs (consumo do helper compartilhado)
- tests/helpers/app-ui.cjs
- docs/backend/CONFIGURACAO.md
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md
- docs/finalizacao/ETAPA-07-ANDAMENTO.md

## Continuidade

Próxima implementação: Etapa 08 — Notas e gerenciamento editorial. Ler o plano e git status/diff, preservando todas as alterações locais das Etapas 05/06/07. Não reexecutar os scripts temporários de edição; não repetir testes sem alterações relevantes. Não fazer commit/push sem autorização.

Nenhum commit ou push realizado pelo agente. Sugestão após revisão: feat: integra contato com solicitacoes privadas

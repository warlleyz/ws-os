# Configuração do backend — Etapa 03

Atualizado em 20/10/2026. Estado: código local preparado; homologação externa pendente. [Entrega e limites](../finalizacao/ETAPAS-03-04-ENTREGA.md). Nenhuma instrução deste guia autoriza produção.

## Ambiente isolado

Usar projeto Supabase autorizado para homologação, com bucket privado `ws-os-official-files`, D1 de teste e origem de prévia autorizada. O armazenamento utiliza Supabase Storage por HTTPS, sem binding R2. Manter o acesso administrativo e as operações de arquivos mediados pelo Worker. `npm run dev`/`preview` executam somente o frontend. Testar também `worker/index.js` no runtime Cloudflare/Worker autorizado; não confundir os testes Node do entrypoint com workerd ou deploy real.

O `wrangler.jsonc` existente não foi alterado. Não reaproveitar seu binding remoto para experimentar migrações. Preparar configuração própria de homologação, fora de commits de configurações locais/segredos. Manter o bucket do Supabase Storage privado, sem políticas de leitura pública e sem disponibilizar URLs públicas ou assinadas diretamente aos visitantes. O acesso aos arquivos oficiais deve permanecer mediado pelo Worker.

## Variáveis e bindings

| Nome | Uso |
|---|---|
| SUPABASE_URL | Origem HTTPS do projeto de homologação no formato aceito pelo código. |
| SUPABASE_ANON_KEY | Chave pública legada compatível com PostgREST/Auth; RLS continua obrigatória. |
| SUPABASE_SERVICE_ROLE_KEY | **Segredo exclusivamente no Worker** para RPCs restritos, submissões protegidas e moderação; nunca VITE_ ou bundle. |
| WALLY_LIMITS_DB | Binding D1 isolado dos quatro limitadores. |
| ADMIN_LOGIN_RATE_LIMIT_SALT | Segredo do limitador de login. |
| POST_LIKES_HASH_SALT | Segredo do identificador de curtidas conforme handler existente. |
| PUBLIC_WRITE_HASH_SALT | Segredo estável para solicitações/rankings; trocar altera o vínculo de idempotência por visitante. |
| TURNSTILE_SECRET_KEY | Verificação no backend; hostname da prévia e action `public-write` para solicitações/rankings. |
| REQUESTS_ENABLED | Literal `true` somente após migração/RLS e testes de solicitações. Ausente mantém indisponível. |
| MANAGED_FILES_ENABLED | Literal `true` somente após migrações e homologação de arquivos. |
| Supabase Storage | Bucket privado `ws-os-official-files`, acessado pelo Worker usando `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Não utiliza binding R2 nem armazena arquivos pessoais dos visitantes. |
| RANKINGS_ENABLED | Literal `true` somente após homologar migração 006, RPC, proteção e moderação. |
| EMAILJS_NOTIFICATIONS_ENABLED | Literal `true` habilita notificação independente após persistência; ausente não envia. |
| EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID | Serviço/template dedicado ao aviso administrativo; não aceitar destino/template vindos do formulário. |
| EMAILJS_PUBLIC_KEY / EMAILJS_PRIVATE_KEY | Configuração apenas no Worker para o envio preparado. Homologar suporte ao envio servidor no plano/conta autorizados. |
| REQUEST_RETENTION_ENABLED | Opt-in da rotina de exclusão após validar retenção, migrações e cron de homologação. |
| WAKATIME_API_KEY | Segredo exclusivamente no Worker, para agregados públicos permitidos. |
| WALLY_AI_ENABLED / GEMINI_MODEL / GEMINI_API_KEY / WALLY_RATE_LIMIT_SALT | Manter IA desligada até autorização/homologação; respeitar configuração e proteção existentes do handler. |

As flags novas não foram inseridas na configuração de produção. Não há valores de credenciais neste guia. Chaves publishable diferentes do formato suportado exigem validar compatibilidade, não substituir anon/service-role cegamente.

## Banco e políticas

1. Revisar/aplicar 001–006 conforme o histórico **do projeto de teste**. Não reaplicar migrações antigas para esconder divergência de schema.
2. As migrações 005–009 foram aplicadas ao projeto Supabase `ws-os-dev` em 20/10/2026, preservando os registros existentes. As estruturas anteriores 001–004 já estavam presentes, sem histórico de migração equivalente. Isso não comprova a homologação de RLS, concorrência ou integração com o Worker. Não reaplicar migrações sem verificar o estado do banco.
3. Conferir políticas permissivas preexistentes, grants de tabelas/colunas, execução de RPCs e papel administrativo. Testar acesso direto como anon, usuário comum e administrador, não só pelos botões.
4. Executar o roteiro `database/tests/etapa03_rls.sql` com `ON_ERROR_STOP` e UUID de usuário administrador de teste existente. Ele termina com ROLLBACK; confirmar que o alvo é descartável antes de executar.
5. Homologar concorrência real: criação simultânea da mesma chave, chave com outro payload, revisão antiga, sexto anexo concorrente, exclusão durante acesso e transições de retenção.
6. Aplicar as migrações D1 001–004 no D1 isolado e conferir índices. Nenhuma migração D1 remota foi executada aqui.

## Fluxos de homologação

- Auth: login incorreto/correto, usuário comum, cadastro administrativo, expiração, logout e operação já iniciada; confirmar a semântica efetiva de revogação dos JWTs no Supabase e o prazo de validade. Frontend guarda sessão só em memória.
- Notas/curtidas: ciclo editorial completo, revisão antiga, anexo privado, publicação futura, acesso direto negado, limites e indisponibilidade do D1. Nada disso foi escrito em conta real nesta entrega.
- Solicitações: enviar mensagem/agendamento com consentimento e desafio, perder resposta, reenviar **a mesma chave/conteúdo**, confirmar um único ID; outro conteúdo deve conflitar. Nunca confirmar reunião por haver persistência ou e-mail entregue.
- EmailJS: conferir template/destino fixos, recebimento real, falha e timeout. O resultado técnico é `persisted` e `email` independentes. Não reutilizar o envio direto antigo do formulário junto ao novo fluxo, para não duplicar notificações; migração da UI pertence à Etapa 07.
- Arquivos: criar metadados no PostgreSQL e enviar bytes ao bucket privado `ws-os-official-files` pelo Worker. Exigir `If-Match`, validar MIME, assinatura, tamanho e SHA-256. Testar arquivo inválido, corpo maior/menor, resposta perdida, repetição com bytes iguais/diferentes e uploads concorrentes. Conferir o objeto no Supabase Storage antes de confirmar o estado `available`. A exclusão exige revisão atual, confirmação explícita e verificação da remoção física antes do estado `deleted`. Testar reconciliação dos estados `uploading` e `deleting`, inclusive falhas do provedor. Visitantes não recebem credenciais nem acesso direto ao bucket.
- Anexos: vincular cinco recursos, recusar o sexto inclusive com concorrência; rascunho/futuro não pode entregar bytes. Despublicar deve retirar o acesso imediatamente em novas requisições. Excluir publicação retira vínculos; excluir recurso retira referências pela migração 009.
- Catálogo: recursos `catalog` privados/incompletos não entram na listagem; estáticos antigos continuam funcionando. Integração visual/Editor/Visualizador pertence às Etapas 05/06/08.
- Rankings: manter melhor pontuação, não expor hash publicamente, testar limite de cada jogo, desafio, quota e remoção administrativa. Registrar a confiança limitada em pontuações vindas do navegador.
- GitHub/WakaTime/clima/Gemini: conferir respostas reais, limites, atualização, cache identificado e falhas/cancelamento; não ativar Gemini durante testes genéricos do portfólio.

## Agendamento e recuperação

Hook `scheduled` chama a limpeza D1; a retenção de pedidos só roda com opt-in. Configurar cron **somente em homologação autorizada** e observar duração/cotas/resultados antes de produção. Não é rotina artificial para impedir pausa do Supabase, cuja adoção continua condicionada ao planejamento.

`sending`/`unknown` em e-mail não voltam automaticamente para `not_sent`: conferir provedor e pedido antes de qualquer reenvio operacional. No Supabase Storage, `uploading`/`deleting` indicam reconciliação, não sucesso final. Preservar dados/objetos até verificar qual lado confirmou a operação; não aplicar limpeza em massa ou apagar objetos pela idade sem revisar vínculos/estado.

Os procedimentos operacionais de backup/restauração, limites reais, alertas e autorização de publicação continuam obrigatórios antes de ativar serviços remotos.

## Referência técnica consultada

As operações de upload, download autenticado, consulta de metadados e exclusão utilizam a [API do Supabase Storage](https://supabase.com/docs/guides/storage). O bucket permanece privado e o Worker controla as permissões. A integridade SHA-256 e as revisões continuam gerenciadas pela aplicação e pelo PostgreSQL. Testes simulados não substituem a homologação real do armazenamento.

<!-- === RUNTIME E ROTAS DO BACKEND === -->

# Runtime e rotas do backend

Atualizado na Etapa 01 em 26/10/2026. Referência vigente: [documento mestre](../WS-OS-V2-MESTRE.md). O backend usa Worker com assets, `wrangler.jsonc` e `worker/index.js`. Os módulos em `functions/api/` são handlers reutilizados pelo entrypoint. Não há segundo backend ativado pela existência dessa pasta.

<!-- === ROTAS HTTP === -->

## Rotas HTTP

| Rota                          | Métodos                       | Proteção/configuração                                                                                            |
| ----------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| /api/posts                    | GET                           | Supabase anon + RLS de publicados passados.                                                                      |
| /api/posts/likes              | GET                           | Projeção pública existente.                                                                                      |
| /api/posts/likes/add          | POST                          | Validação e limitador/proteção existentes.                                                                       |
| /api/auth/login               | POST                          | Supabase Auth, D1 e limitador de login.                                                                          |
| /api/auth/me                  | GET                           | Revalidação de usuário e administração.                                                                          |
| /api/auth/logout              | POST                          | Encerramento remoto, limpeza local independente.                                                                 |
| /api/admin/status             | GET                           | Administrador.                                                                                                   |
| /api/admin/posts              | GET                           | Administrador/RLS.                                                                                               |
| /api/admin/posts/create       | POST                          | Administrador/RLS.                                                                                               |
| /api/admin/posts/update       | PATCH                         | Administrador/revisão/RLS.                                                                                       |
| /api/admin/posts/status       | PATCH                         | Administrador/revisão/RLS.                                                                                       |
| /api/admin/posts/delete       | DELETE                        | Administrador/revisão/RLS.                                                                                       |
| /api/content                  | GET                           | kind events/files; somente publicados.                                                                           |
| /api/admin/content            | GET, POST, PATCH, DELETE      | Administrador/revisão; confirmação exata do ID retornado.                                                        |
| /api/requests                 | POST                          | Opt-in, Turnstile, D1, idempotência e service-role restrito ao Worker.                                           |
| /api/admin/requests           | GET, PATCH, DELETE            | Administrador/RLS; revisão e confirmação em exclusão.                                                            |
| /api/files                    | GET                           | Opt-in e RPC público mediado; bucket privado. Sem id lista catálogo; com id entrega bytes autorizados.           |
| /api/admin/files              | GET, POST, PUT, PATCH, DELETE | Administrador/RLS/Supabase Storage privado; revisão nas mutações, integridade SHA-256 e confirmação em exclusão. |
| /api/posts/attachments        | GET                           | postId; somente metadados de anexos efetivamente públicos.                                                       |
| /api/admin/attachments        | POST, DELETE                  | Administrador e RPC transacional, revisão da publicação.                                                         |
| /api/rankings                 | GET, POST                     | Opt-in, projeção mínima e escrita protegida/RPC.                                                                 |
| /api/admin/rankings           | GET, DELETE                   | Administrador; moderação/remoção confirmada.                                                                     |
| /api/project-highlights       | GET                           | Somente repositoryIds; permissões da migração 014 e RLS.                                                         |
| /api/admin/project-highlights | GET, PUT                      | Autenticação/autorização administrativa; somente IDs de destaques, sem demos ou ordem editorial manual.          |
| /api/wakatime                 | GET                           | Chave somente no Worker, agregados públicos.                                                                     |
| /api/wally                    | POST                          | Remoto desligado pela configuração existente; proteção/cotas quando autorizado.                                  |

Rotas desconhecidas sob `/api/` retornam JSON 404; métodos incompatíveis retornam 405 com Allow. Todas as rotas, inclusive as de múltiplos métodos, passam pela sanitização de erros do entrypoint. Demais requisições são entregues a ASSETS. Não enviar stacks, chaves ou corpos privados para logs/respostas de erro.

`scheduled` chama manutenção D1 e, somente com opt-in, retenção. Nenhum cron ou binding remoto foi criado nesta entrega.

<!-- === ASSETS ATUAIS === -->

## Assets atuais

DOOM/UZDoom e o tratamento específico de seus recursos foram removidos. Não há montagem de uzdoom.data nem contrato operacional de worker/doomAssets.js no runtime atual. Preservar somente APIs e assets ainda utilizados; registros antigos não criam obrigação de reintrodução.

<!-- === AMBIENTE E EVIDÊNCIAS === -->

## Ambiente e evidências

Vite dev/preview servem somente o frontend. Testes Node exercitam o entrypoint real com Request/Response e dependências controladas; não substituem workerd/Cloudflare, RLS ou fornecedores reais. Flags existentes não comprovam publicação/homologação.

Arquivos oficiais utilizam o bucket privado ws-os-official-files, acessado pelo Worker. Ver [configuração](CONFIGURACAO.md) e o [registro histórico de homologação](../finalizacao/ETAPAS-03-04-ENTREGA.md). Nenhuma operação remota foi executada na Etapa 01.

<!-- === CABEÇALHOS DOS ASSETS — R14 === -->

## Cabeçalhos dos assets — R14

O candidato local adiciona X-Content-Type-Options: nosniff e Referrer-Policy: strict-origin-when-cross-origin aos assets, preservando corpo, status, ETag e cache. Respostas text/html recebem X-Frame-Options: SAMEORIGIN e Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'self'. Essa CSP limita base, objetos e incorporação; não é uma allowlist restritiva de scripts/conexões. Não foi alterado o HSTS da borda. APIs conservam suas próprias políticas.

Validado em testes Node e Wrangler local em 30/10/2026, incluindo resposta 304 sem corpo. O domínio público consultado ainda não possuía esses cabeçalhos: nenhuma publicação foi executada. Backup, restore e rollback operacional continuam descritos no checklist único do mestre.

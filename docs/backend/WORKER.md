# Runtime e rotas do backend

Atualizado em 20/10/2026. O backend usa Worker com assets, `wrangler.jsonc` e `worker/index.js`. Os módulos em `functions/api/` são handlers reutilizados pelo entrypoint. Não há segundo backend ativado pela existência dessa pasta.

| Rota | Métodos | Proteção/configuração |
|---|---|---|
| /api/posts | GET | Supabase anon + RLS de publicados passados. |
| /api/posts/likes | GET | Projeção pública existente. |
| /api/posts/likes/add | POST | Validação e limitador/proteção existentes. |
| /api/auth/login | POST | Supabase Auth, D1 e limitador de login. |
| /api/auth/me | GET | Revalidação de usuário e administração. |
| /api/auth/logout | POST | Encerramento remoto, limpeza local independente. |
| /api/admin/status | GET | Administrador. |
| /api/admin/posts | GET | Administrador/RLS. |
| /api/admin/posts/create | POST | Administrador/RLS. |
| /api/admin/posts/update | PATCH | Administrador/revisão/RLS. |
| /api/admin/posts/status | PATCH | Administrador/revisão/RLS. |
| /api/admin/posts/delete | DELETE | Administrador/revisão/RLS. |
| /api/content | GET | kind events/files; somente publicados. |
| /api/admin/content | GET, POST, PATCH, DELETE | Administrador/revisão; confirmação exata do ID retornado. |
| /api/requests | POST | Opt-in, Turnstile, D1, idempotência e service-role restrito ao Worker. |
| /api/admin/requests | GET, PATCH, DELETE | Administrador/RLS; revisão e confirmação em exclusão. |
| /api/files | GET | Opt-in e RPC público mediado; bucket privado. Sem id lista catálogo; com id entrega bytes autorizados. |
| /api/admin/files | GET, POST, PUT, PATCH, DELETE | Administrador/RLS/R2; revisão nas mutações e confirmação em exclusão. |
| /api/posts/attachments | GET | postId; somente metadados de anexos efetivamente públicos. |
| /api/admin/attachments | POST, DELETE | Administrador e RPC transacional, revisão da publicação. |
| /api/rankings | GET, POST | Opt-in, projeção mínima e escrita protegida/RPC. |
| /api/admin/rankings | GET, DELETE | Administrador; moderação/remoção confirmada. |
| /api/wakatime | GET | Chave somente no Worker, agregados públicos. |
| /api/wally | POST | Remoto desligado pela configuração existente; proteção/cotas quando autorizado. |

Rotas desconhecidas sob `/api/` retornam JSON 404; métodos incompatíveis retornam 405 com Allow. Todas as rotas, inclusive as de múltiplos métodos, passam pela sanitização de erros do entrypoint. Demais requisições são entregues a ASSETS. Não enviar stacks, chaves ou corpos privados para logs/respostas de erro.

`scheduled` chama manutenção D1 e, somente com opt-in, retenção. Nenhum cron ou binding remoto foi criado nesta entrega.

`npm run dev`/`preview` servem frontend. Os testes Node executam o entrypoint real com Requests/Responses e dependências controladas; não são homologação workerd/Cloudflare, R2, RLS ou fornecedor real. Ver [configuração](CONFIGURACAO.md) e [evidências/limites](../finalizacao/ETAPAS-03-04-ENTREGA.md).

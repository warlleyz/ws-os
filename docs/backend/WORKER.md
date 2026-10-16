# Runtime e rotas do backend

A configuração atual do repositório usa **Cloudflare Worker com assets** (`wrangler.jsonc` e `worker/index.js`), evolução posterior à primeira preparação com Pages Functions. Os módulos em `functions/api/` são handlers reutilizados pelo Worker; não há um segundo backend ativado automaticamente por sua existência.

| Rota            | Método | Configuração                                                                 |
| --------------- | ------ | ---------------------------------------------------------------------------- |
| `/api/posts`    | GET    | SUPABASE_URL + SUPABASE_ANON_KEY; RLS de publicações                         |
| `/api/wakatime` | GET    | WAKATIME_API_KEY apenas no servidor                                          |
| `/api/wally`    | POST   | Remoto **desligado** por WALLY_AI_ENABLED=false; não alterar sem autorização |

URLs desconhecidas sob `/api/` retornam JSON 404, métodos incompatíveis 405. As demais requisições vão ao binding ASSETS. Erros inesperados de handler são sanitizados; não enviar stacks/segredos ao visitante.

`npm run dev`/`preview` executam apenas o frontend. As integrações precisam do runtime Worker em ambiente de teste ou mocks locais. Não há proxy silencioso para produção. Os testes Node importam o Worker real e verificam roteamento, métodos, ausência de configuração e IA bloqueada antes de consumir rede/cotas.

Não foi feito deploy nem alterado D1, variáveis de produção ou credenciais. O binding existente de limites Wally foi preservado. Guias anteriores de Pages precisam ser interpretados à luz deste runtime; antes de publicar, testar os bindings no ambiente Cloudflare escolhido.

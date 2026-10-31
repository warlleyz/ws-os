# Configuração de ambiente — WS OS V2.1

## Referência
`package.json`, `wrangler.jsonc` e referências a variáveis do código do commit `c7af7834e3774ab29a631b0798d70e8cc59999ad`. Não incluir valores reais de chaves nos documentos.

## Frontend local
```bash
npm ci
npm run dev
npm run lint
npm run test
npm run build
npm run preview
```
O Vite local não inicia automaticamente o Cloudflare Worker nem simula as permissões reais do banco.

## Variáveis de frontend (Vite)
| Nome | Uso |
|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Chave pública de apresentação do Turnstile |
| `VITE_RANKINGS_ENABLED` | Habilitação da experiência de rankings no frontend |
| `VITE_WALLY_REMOTE_ENABLED` | Controle da integração remota do assistente |

Variáveis `VITE_*` podem ser incorporadas ao bundle público: **nunca inserir segredos nelas**.

## Worker e integrações
| Nome | Uso |
|---|---|
| `SUPABASE_URL` | Endpoint do Supabase |
| `SUPABASE_ANON_KEY` | Chave pública de acesso sujeita a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Segredo de servidor; nunca distribuir ao frontend |
| `TURNSTILE_SECRET_KEY` | Segredo para validação do Turnstile no Worker |
| `REQUESTS_ENABLED` | Habilitação de solicitações |
| `MANAGED_FILES_ENABLED` | Habilitação de arquivos oficiais gerenciados |
| `RANKINGS_ENABLED` | Habilitação de rankings |
| `REQUEST_RETENTION_ENABLED` | Rotina de retenção de solicitações |
| `WAKATIME_API_KEY` | Token da integração WakaTime |
| `WALLY_AI_ENABLED` | Habilitação da IA remota, desabilitada na base |
| `GEMINI_MODEL` / `GEMINI_API_KEY` | Modelo e segredo de IA remota |
| `EMAILJS_NOTIFICATIONS_ENABLED` | Controle da notificação por e-mail |
| `EMAILJS_SERVICE_ID` / `EMAILJS_TEMPLATE_ID` | Configuração do serviço de notificação |
| `EMAILJS_PUBLIC_KEY` / `EMAILJS_PRIVATE_KEY` | Credenciais de notificação, mantidas no Worker |
| `ADMIN_LOGIN_RATE_LIMIT_SALT` / `POST_LIKES_HASH_SALT` / `PUBLIC_WRITE_HASH_SALT` / `WALLY_RATE_LIMIT_SALT` | Sais de proteção de requisições |

O binding D1 `WALLY_LIMITS_DB` está configurado no `wrangler.jsonc`; `ASSETS` referencia `./dist`. O cron versionado é `0 3 * * *`. Os valores versionados das flags não provam que o serviço remoto correspondente foi homologado.

## Configuração segura
- Guardar segredos como variáveis secretas do provedor, não em `wrangler.jsonc`, README ou repositório.
- Usar valores distintos para ambientes de desenvolvimento, homologação e produção.
- Aplicar migrações e RLS antes de habilitar rotas persistentes.
- Não executar migrações ou alterações de produção sem autorização e plano de reversão.
- A Etapa 27 validará banco, Storage, permissões e retenção.

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
| `WAKATIME_ACCESS_TOKEN` | Token OAuth de servidor, com leitura de estatísticas; nunca VITE_* |
| `WAKATIME_PUBLIC_PROJECTS` | Lista opcional de nomes de projetos autorizados publicamente, separados por vírgula; padrão não expõe projetos |
| `WALLY_AI_ENABLED` | Habilitação da IA remota; configuração local habilitada na Etapa 20, independente do deploy ativo |
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

## Desenvolvimento com backend

Copiar .dev.vars.example para .dev.vars e preencher segredos apenas no arquivo local ignorado pelo Git.
Executar npm run build e npm run dev:worker. Depois de alterar .dev.vars, reiniciar o Worker para carregar os valores.
O token pessoal de leitura do WakaTime é obtido em https://wakatime.com/oauth. Chaves de plugin não autorizam estatísticas.
A configuração do ambiente publicado é independente e exige alteração no provedor pelo proprietário.

## Wally — Etapa 20

- Ativação remota exige `VITE_WALLY_REMOTE_ENABLED=true` no frontend, `WALLY_AI_ENABLED=true` no Worker, `GEMINI_API_KEY`, `TURNSTILE_SECRET_KEY`, `WALLY_RATE_LIMIT_SALT` e binding D1 com a tabela de limites existente. Não criar migração ou alterar produção para validar a interface local.
- `GEMINI_MODEL` preserva o modelo escolhido pelo proprietário. Disponibilidade, faturamento e cotas dependem da conta do provedor; esta etapa não homologa o modelo em produção nem garante gratuidade.
- Limites atuais: cinco consultas por visitante/minuto, 30 globais/minuto e 100 globais/dia; até 400 tokens de saída por chamada. São limites de consumo, não teto monetário. Configurar orçamento/alertas da conta separadamente antes de publicar.
- Cada pergunta tem até 1000 caracteres; o contexto contém até cinco pares completos de mensagens, com até 1000 caracteres por mensagem. O corpo HTTP é limitado a 56.000 bytes para acomodar Unicode e o token Turnstile.
- Verificação do Turnstile: até 12 segundos; Gemini: até 25 segundos; transporte do cliente: até 45 segundos. Cancelar ou limpar a conversa descarta respostas atrasadas no cliente, mas não garante reversão do consumo já iniciado no provedor.
- O histórico permanece somente na memória da aplicação até limpar ou recarregar. Pergunta, histórico limitado e contexto profissional público são enviados ao Google Gemini quando o modo remoto está ativo e há verificação. A política de tratamento/retenção do provedor é independente da memória do navegador. O Turnstile recebe os dados de verificação necessários, incluindo IP no servidor; D1 utiliza identificador derivado de hash com sal para limitar consultas.
- O contexto do Gemini é uma seleção do conteúdo público versionado, não inclui arquivos pessoais, segredos, sessão administrativa ou rascunhos. Não consulta automaticamente o catálogo dinâmico do GitHub nem dados privados. O visitante é orientado a não enviar dados sensíveis.
- O Gemini é o único provedor de respostas conversacionais. Sem configuração, sem verificação ou após falhas remotas, o Wally apresenta o estado de indisponibilidade correspondente, sem fallback local automático. Respostas remotas não concedem privilégios nem executam ações administrativas.
- A configuração e os testes locais não confirmam o SHA publicado, a disponibilidade do modelo, o faturamento ou os segredos da Cloudflare. A homologação remota depende do ambiente do proprietário.

## Jogos e rankings — Etapa 22

- Os cinco jogos e seus recordes locais funcionam sem backend. O ranking público de Snake e Flappy exige `VITE_RANKINGS_ENABLED=true`, `VITE_TURNSTILE_SITE_KEY`, `RANKINGS_ENABLED=true`, configuração Supabase, `TURNSTILE_SECRET_KEY`, `PUBLIC_WRITE_HASH_SALT` e D1 com a tabela `public_write_limits`.
- `npm run dev` executa apenas o frontend, sem encaminhamento das APIs ao Worker. Para testar a integração, executar o build atualizado e o Worker conforme as instruções acima, utilizando o endereço do Worker e credenciais do ambiente de homologação. A execução local do Worker não isola automaticamente o Supabase apontado em `.dev.vars`.
- O cliente envia `visitorId` aleatório de 32 caracteres hexadecimais, mantido em `ws-os:visitor-id`. O Worker valida e deriva um hash salgado para a chave da pontuação. O limite de requisições continua vinculado ao IP, independentemente dessa identidade.
- A confirmação do envio inclui `{ accepted: true, score }`, somente após consulta da pontuação persistida. Pontuação igual reenvia com segurança o mesmo registro; pontuação superior já existente com o mesmo apelido é informada ao visitante. Alteração de apelido sem superar a marca existente retorna `SCORE_NOT_IMPROVED`.
- A reserva de apelidos depende do índice da migração `20261107180000_etapa22_ranking_alias_unico.sql`. Verificar duplicatas e homologar a migração antes da publicação; ela não foi aplicada nesta etapa local.
- Preservar registros históricos por IP. Sua vinculação a navegadores novos não pode ser recuperada automaticamente. Limpar os dados do navegador também elimina a identidade local; isso não remove o registro público.
- Publicar frontend e Worker compatíveis juntos. Testes locais não confirmam migrações, variáveis nem disponibilidade do ambiente publicado.

## Preferências locais — Etapa 23

| Escopo | Preferências |
|---|---|
| Compartilhadas entre Desktop/Mobile neste navegador | Tema, idioma, cursor, efeitos, ocultação do fundo e acessibilidade |
| Independentes por tema | Modo automático/manual e cor de destaque |
| Independentes por plataforma e tema | Seleção do wallpaper e enquadramento |
| Desktop | Auto-ocultação da Taskbar, posições, visibilidade e dimensões dos widgets |
| Mobile | Densidade dos aplicativos e seleção dos tipos de widget visíveis |

As categorias de restauração não correspondem a uma limpeza geral do navegador. Aparência inclui tema, cursor e efeitos; Desktop restaura somente os wallpapers/enquadramentos da plataforma; Mobile inclui densidade, seleção de widgets e seus wallpapers/enquadramentos. Widgets restaura opções, tamanhos e visibilidade do Desktop, preservando instâncias e posições. Taskbar e notificações têm categorias próprias.

Os widgets Mobile reutilizam as opções internas das instâncias padrão, incluindo fuso do relógio e unidades do clima. A seleção de quais tipos aparecem no Mobile é independente da visibilidade e do tamanho das instâncias do Desktop. Restaurar a categoria Widgets também restaura essas opções internas compartilhadas.

Documentos, recordes, identidade do visitante, favoritos e imagens pessoais não são apagados pela restauração. Imagens pessoais só são removidas pelo comando de exclusão específico, após confirmação. As seleções continuam locais; não há sincronização entre dispositivos nem exportação/importação nesta etapa.

> **Estado mais recente — 18/10/2026:** consulte [Pendências e continuidade](../PENDENCIAS-FINALIZACAO.md). O texto abaixo é histórico; não descreve integralmente o estado atual de auth, Notas, Administração, Arquivos, rankings e testes.

# Integrações preparadas — não ativadas

Estas funções usam o roteamento por arquivos do Cloudflare Pages. `npm run dev` e `npm run preview` servem o frontend; **não executam Pages Functions**. A validação atual usa Requests/Responses e fetch simulado em Node, sem contas reais.

## WakaTime

1. No ambiente de teste do Pages, cadastrar o segredo `WAKATIME_API_KEY`. Nunca usar prefixo `VITE_`, arquivo público ou commit de credencial.
2. Revisar a exposição pública: o endpoint retorna somente tempo agregado e linguagens; qualquer visitante poderá consultar essas métricas.
3. Em `src/content/portfolioContent.js`, definir `wakatimeProxy: '/api/wakatime'`.
4. Testar os três períodos, chave inválida, timeout e limite do provedor. O cliente tem cache em sessão; o endpoint anuncia cache HTTP de cinco minutos. Aplicar proteção de tráfego no provedor antes da produção.

## Notas com Supabase

O app funciona sem backend com `posts: []` e `notesEndpoint: ''`. Tudo nesse arquivo entra no bundle público: **não colocar rascunhos privados ali**, mesmo com status `draft`.

1. Revisar `posts.sql` e aplicá-lo em um projeto de teste. Fazer backup de tabelas/políticas prévias; `IF NOT EXISTS` não migra uma tabela incompatível existente.
2. Cadastrar `SUPABASE_URL` (origem `https://<projeto>.supabase.co`) e `SUPABASE_ANON_KEY` (chave anon legada JWT) no Pages. O endpoint NÃO precisa nem deve receber `service_role`. Chaves publishable novas exigem adaptar a autenticação da requisição; não substituí-las cegamente.
3. Testar REST com usuário anon: publicação passada legível; draft e publicação futura invisíveis; insert/update/delete negados. Validar também políticas já existentes: políticas permissivas adicionais podem ampliar acesso.
4. Publicar um registro por SQL administrativo com textos JSON string ou objeto de idiomas, status `published`, data passada e tags.
5. Definir `notesEndpoint: '/api/posts'` no conteúdo. Com endpoint ativado, falha exibe erro/cache identificado; não simula leitura remota com conteúdo local.

O endpoint traz no máximo 200 publicações recentes. Paginação, curtidas anônimas com antiabuso, escrita/admin autenticados, anexos e editor editorial continuam pendentes. A leitura exibe texto simples escapado pelo React; Markdown/HTML não é interpretado.

## Execução e publicação

Se Wrangler já estiver disponível na sua máquina, executar Pages localmente com a pasta `dist` e variáveis locais ignoradas. Nenhuma ferramenta foi instalada nesta etapa. Antes de publicar, validar as Functions no runtime Cloudflare e configurar segredos no ambiente correto. Não houve deploy, escrita no Supabase ou chamada autenticada ao WakaTime.

## Referências oficiais consultadas

- [Roteamento de Pages Functions](https://developers.cloudflare.com/pages/functions/routing/)
- [RLS no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [API WakaTime](https://wakatime.com/developers)

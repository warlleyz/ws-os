# Publicação e operação — WS OS V2.1

## Base publicada
- Site: https://warlleys.dev
- Repositório: https://github.com/warlleyz/ws-os
- Commit de referência V2: `c7af7834e3774ab29a631b0798d70e8cc59999ad`
- O proprietário confirmou que a publicação e a base auditada correspondem ao mesmo commit.
- **V2.1 não publicada:** as alterações da nova versão devem passar por validação e autorização antes do deploy.

## Topologia identificada
- Vite compila o frontend para `dist`.
- Cloudflare Worker usa `worker/index.js` como entrada.
- O binding `ASSETS` serve `./dist`, com fallback SPA.
- `/api/*` é encaminhado às rotas do Worker e dos handlers de `functions/api`.
- D1 oferece o binding `WALLY_LIMITS_DB`.
- Supabase e demais integrações exigem configuração operacional separada.
- Um cron agendado dispara manutenção.

## Checklist de pré-publicação
- [ ] Confirmar branch, SHA, diff e arquivos do inventário.
- [ ] Executar `npm ci`, `npm run lint`, `npm run test`, `npm run build`.
- [ ] Validar fluxos públicos em Desktop, Mobile e teclado.
- [ ] Homologar permissões, autenticação, formulários e integrações privadas em ambiente próprio.
- [ ] Conferir variáveis de ambiente, secrets, banco, migrações e Storage.
- [ ] Conferir configuração de domínio, TLS, cache e resposta da SPA.
- [ ] Obter autorização explícita para publicar.

## Após publicar
- [ ] Confirmar que o deploy ativo aponta para o SHA aprovado.
- [ ] Verificar inicialização do site, assets e roteamento.
- [ ] Conferir erros de aplicação e comportamento das APIs.
- [ ] Executar cenários críticos sem expor dados privados.
- [ ] Registrar data, ambiente, SHA, resultado e eventuais incidentes no acompanhamento.

## Reversão
Antes de um deploy novo, registrar o identificador do deploy anterior e preparar restauração da versão anterior. Mudanças de banco exigem procedimento de recuperação específico; reverter apenas o Worker não necessariamente reverte migrações.

## Limite deste documento
Documentação baseada no código versionado, não em acesso administrativo à Cloudflare. A homologação final e a execução de deploy cabem às Etapas 32 e 33.

<!-- === WS OS === -->

# WS OS

Portfólio profissional de Warlley Silva, com experiências Desktop e Mobile em React, JavaScript e Vite.

<!-- === ESTADO DO PROJETO === -->

## Estado do projeto

17 entradas de aplicativos: 16 públicas e Administração protegida. Currículo encaminha o documento ao Visualizador. O sistema de demonstrações foi removido; destaques são selecionados por ID na Administração e a ordenação restante continua automática. Wally remoto permanece desativado.

O documento mestre mantém 12 etapas de requisitos e um único acompanhamento R01–R14 na seção 15, conforme a auditoria de 28/10/2026. A revisão de 30/10 preserva as entregas existentes e as alterações locais do proprietário. Código e testes locais não representam aceite visual completo ou homologação de produção.

<!-- === EXECUTAR E VALIDAR === -->

## Executar e validar

Node.js 24 e npm, com package-lock.json versionado. Em instalação nova e autorizada:

```bash
npm ci
npm run dev
```

Verificações:

```bash
npm run lint
npm run build
npm run test
npm run preview
```

Dev/preview servem somente o frontend. O backend é o Cloudflare Worker em worker/index.js, com configuração em wrangler.jsonc, assets de dist e handlers em functions/api. Não usar bindings remotos ou segredos de produção em testes. Consultar a [configuração do backend](docs/backend/CONFIGURACAO.md).

<!-- === VALIDAÇÃO ATUAL === -->

## Validação local — 30/10/2026

Base main, HEAD 48b0993d9022b306187bd48d62e766678da5e3f3, com alterações locais não commitadas preservadas. Lint, 552 testes (547 existentes e cinco regressões novas) e build com saída externa aprovados após correções. FileViewer: 620,95 kB, gzip 186,51 kB; entrada principal: aproximadamente 494 kB, gzip 150,07 kB. Tamanho de bundle não comprova fluidez da interface.

O baseline de 28/10 no mesmo commit limpo também tinha 547 testes aprovados; os antigos resultados de cinco falhas pertencem aos registros de 26/10. A aplicação remota da migração incremental e a homologação operacional precisam de confirmação atual, antes da publicação. Nenhuma migração, escrita remota ou rotação de credenciais foi realizada nesta revisão.

<!-- === DOCUMENTAÇÃO === -->

## Documentação

- [Mestre e acompanhamento único](docs/WS-OS-V2-MESTRE.md): escopo, regras, decisões, 12 etapas e critérios de conclusão.
- [Arquitetura atual](docs/architecture.md): responsabilidades e limites verificados.
- [Configuração do backend](docs/backend/CONFIGURACAO.md) e [mapa de rotas](docs/backend/WORKER.md): consulta operacional complementar.
- [Contratos datados](docs/contracts.md): assinaturas e evolução; conferir os trechos históricos com o código atual.
- [Remoção das demonstrações](docs/REMOCAO-DEMONSTRACOES.md): decisão e dependência da migração 014.

O inventário completo e o destino de cada documento estão na seção 20 do mestre. Planning, planos antigos e checkpoints permanecem preservados como histórico, sem disputar a referência vigente. Nenhum documento foi excluído ou movido na Etapa 01.

<!-- === DADOS, SEGURANÇA E PUBLICAÇÃO === -->

## Dados, segurança e publicação

Conteúdo público em src/content/portfolioContent.js. Documentos pessoais permanecem no IndexedDB do visitante; oficiais usam Supabase Storage privado mediado pelo Worker. Nunca adicionar credenciais, dados privados ou rascunhos ao conteúdo público, public/, testes ou documentação. Ambientes locais são ignorados pelo Git.

Boot mantém o processador, favicon acompanha tema/destaque e animações das janelas permanecem no escopo. Reiniciar/Desligar ficam fora desta versão. Jogos contém Snake, Memória, Campo Minado, Flappy Bird e Paciência. DOOM/UZDoom e seus recursos foram removidos e não bloqueiam esta versão.

O workflow [Validação](.github/workflows/validacao.yml) executa lint, build e testes, sem deploy. Sua execução remota não foi conferida nesta etapa. Push, migrações e publicação exigem autorização específica; o commit documental da Etapa 01 não concede essas permissões.

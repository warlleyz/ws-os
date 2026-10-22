# WS OS

Portfólio profissional de Warlley Silva, com experiências Desktop e Mobile em React, JavaScript e Vite.

**Estado atual:** 18 aplicativos registrados (17 públicos e Administração protegida), entregas técnicas locais das etapas 01–14 e preparação da Etapa 15. O projeto está em revisão: testes locais não substituem aceite visual, conteúdo final e homologação de serviços. Wally remoto permanece desativado. Nenhuma publicação é executada pelo workflow de qualidade.

## Executar e validar

Node.js 24 e npm com package-lock.json versionado. Em instalação nova:

```bash
npm ci
npm run dev
```

```bash
npm run lint
npm run build
npm run test
npm run preview
```

Dev/preview servem o frontend, sem emular APIs. O backend vigente é o Cloudflare Worker em worker/index.js com assets de dist e configuração em wrangler.jsonc; functions/api contém os handlers reutilizados. Configurar o runtime local e variáveis apenas conforme [documentação do backend](docs/backend/CONFIGURACAO.md). Não usar chaves de produção em testes.

## Documentação vigente

- [Auditoria e correções finais](docs/finalizacao/AUDITORIA-FINAL.md): requisitos, limpeza recuperável, tradução, dicas e atualização de segurança.

- [Checkpoint final e roteiro de aceite](docs/finalizacao/ETAPA-15-ANDAMENTO.md): matriz dos 18 apps, evidências, bloqueios e publicação manual.
- [Plano por etapas](docs/PLANO-FINALIZACAO-POR-ETAPAS.md) e [mestre aprovado](docs/planning/WS-OS-V2-MESTRE-v0.16.0.md).
- [Checkpoints de desenvolvimento](docs/finalizacao/): estado e pendências das entregas; preservar evidências históricas sem tratá-las como homologação atual.
- [Arquitetura](docs/architecture.md), [contratos](docs/contracts.md), [rotas do Worker](docs/backend/WORKER.md) e [preferências](docs/settings.md).

Conteúdo público em src/content/portfolioContent.js. Arquivos pessoais permanecem no IndexedDB do visitante; arquivos oficiais usam Supabase Storage privado mediado pelo Worker. Nunca adicionar credenciais, rascunhos privados ou dados de visitantes ao conteúdo público, public/, testes ou documentação. .env.local e .dev.vars são ignorados pelo Git.

Catálogos PT-BR/EN atualizados na auditoria autorizada pelo autor; revisão visual e linguística em contexto ainda pendente. DOOM continua condicionado a motor/artefatos licenciados e aceitos. Serviços externos exigem homologação e autorização próprias; não há garantia de produção baseada apenas nos testes.

O workflow [Validação](.github/workflows/validacao.yml) instala pelo lockfile e executa lint, build e testes sem segredos nem deploy. Será executado pelo GitHub somente após envio pelo proprietário; sua execução remota ainda não foi validada.

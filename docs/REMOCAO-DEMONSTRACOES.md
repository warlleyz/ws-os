# Remoção do sistema de demonstrações — 25/10/2026

## Escopo vigente

O WS OS possui 17 aplicativos registrados (16 públicos e Administração protegida).
Projetos permanece como catálogo GitHub com pesquisa, filtros, ordenação, tecnologias,
metadados, README, detalhes e links externos. A Administração seleciona destaques por ID.
O Terminal preserva seus comandos normais e sua instância única.

O fluxo é GitHub → Administração → IDs selecionados → Supabase → Projetos.
Não há executores, análise para execução, receitas, iframes de projetos, prévias,
aprovação/publicação de configurações executáveis ou sessões remotas no código ativo.
As integrações do catálogo compartilhadas com WS Menu, busca, Taskbar e janelas foram mantidas.

## Arquivos excluídos

1. src/apps/demo-viewer/DemoViewer.jsx
2. src/apps/demo-viewer/DemoViewer.css
3. src/apps/demo-viewer/demoModel.js
4. src/apps/demo-viewer/DemoExecution.jsx
5. src/apps/demo-viewer/demoRuntime.js
6. src/apps/administration/DemoConfiguration.jsx
7. src/services/projectDemoService.js
8. src/shared/hooks/useDemoCatalog.js
9. src/shared/utils/projectDemos.js
10. functions/api/projectDemoExecution.js
11. tests/core/project-demo-system.test.cjs
12. tests/core/project-demos.test.cjs
13. tests/browser/project-demos.cjs
14. docs/SISTEMA-DEMONSTRACOES.md

Os diretórios exclusivos que ficaram vazios foram removidos. Nenhum arquivo fora desse
escopo foi descartado. Não houve reset, commit, push ou deploy.

## Arquivos modificados

- src/apps/projects/Projects.jsx, Projects.css e projectModel.js
- src/apps/administration/AdminProjects.jsx e AdminProjects.css
- src/apps/terminal/Terminal.jsx
- src/services/projectHighlightService.js, githubService.js e publicContentContract.js
- src/shared/utils/contractValidation.js
- src/shared/i18n/locales/pt-BR.json e en.json
- src/core/appRegistry.js e appManager.js
- src/content/portfolioContent.js
- src/styles/apps.css
- functions/api/projectHighlights.js e worker/index.js
- package.json (retirada do comando exclusivo de testes de navegador do sistema removido)
- tests/core/app-contracts.test.cjs, portfolio.test.cjs, portfolio-ui.test.cjs,
  refactor.test.cjs e shared-models.test.cjs
- tests/helpers/app-ui.cjs
- README.md, docs/architecture.md, docs/contracts.md,
  docs/PLANO-FINALIZACAO-POR-ETAPAS.md e docs/finalizacao/ETAPA-15-ANDAMENTO.md

Criados: database/migrations/014_project_highlights_only.sql,
tests/core/project-highlights.test.cjs e este registro.

O componente Select, cache público, autenticação, controles de sessão administrativa,
proteção de alterações não salvas, visualizadores de documentos e todos os recursos
compartilhados com outros aplicativos foram preservados. Nenhuma dependência de pacote
exclusiva havia sido adicionada; as dependências compartilhadas permanecem intactas.

## Persistência e banco de dados

- APIs pública e administrativa consultam diretamente project_highlights, selecionando
  apenas repository_ids. Não dependem da view project_highlights_public.
- Gravação envia somente id e repository_ids. Dados de outras colunas existentes são
  preservados; não há limpeza ou sobrescrita dessas colunas.
- Publicações retornam somente repositoryIds. Escrita continua exigindo autenticação
  e autorização administrativa; permanecem os limites de IDs, unicidade e tamanho do corpo.
- A migração 014 revoga a leitura integral para anon e concede SELECT somente de id e
  repository_ids. Reaproveita a política RLS pública da migração 011.
- Se a migração 013 já foi aplicada, é necessário aplicar/homologar a 014 para restaurar
  a leitura pública direta da tabela. Sem a permissão, a API informa indisponibilidade e
  Projetos mantém o catálogo GitHub; não tenta contornar o controle de acesso.
- Migrações 011, 012 e 013 foram preservadas como histórico versionado. Nenhuma foi
  reescrita ou executada nesta tarefa.
- Coluna demos, sua constraint e view project_highlights_public podem ser avaliadas para
  remoção futura, após backup e decisão explícita. Permanecem no banco e não são usadas
  pela aplicação. Esta entrega não contém nem executa exclusão de dados ou estruturas.

Não houve conexão ou alteração no Supabase remoto. O teste de migração verifica seu
conteúdo, não sua execução no Postgres. Homologar permissões/RLS em banco de teste antes
de aplicar em produção. A autenticação administrativa e os IDs cadastrados devem ser
conferidos nesse ambiente.

## Validação efetivamente executada

- Testes relacionados a destaques, catálogo, contratos, navegação e segurança: 68 aprovados.
- npm run lint: aprovado.
- npm run build: aprovado; permanece o aviso de chunk FileViewer acima de 500 kB.
- npm run test: 501 testes, 501 aprovados, zero falhas.
- Navegador Edge headless/Playwright, aplicação local real com respostas HTTP controladas:
  catálogo, destaque, pesquisa, detalhes/README, links externos, WS Menu e comando echo do
  Terminal normal aprovados; 17 registros e zero erros de página. Os dados eram fixtures
  isoladas do teste, sem gravação no catálogo ou em serviços reais.
- Busca no código ativo: nenhuma importação, rota, estilo ou configuração exclusiva
  do sistema removido. A suíte conserva cobertura de Menu, Taskbar, janelas e Terminal.
- Traduções exclusivas foram removidas de ambos os idiomas. Mensagens compartilhadas
  e traduções de outras funcionalidades foram mantidas.

## Homologação restante

1. Revisar/aplicar a migração 014 em homologação, preservando IDs e colunas antigas.
2. Confirmar que a API pública recebe apenas repositoryIds, com acesso de leitura mínimo.
3. Administração → Projetos: marcar/desmarcar, salvar e reabrir para conferir persistência.
4. Conferir o destaque no catálogo, pesquisa, filtros, README e links reais em Desktop/Mobile.
5. Aplicar eventual limpeza física futura somente com autorização específica e backup.

Não foram encontradas regressões nos testes executados. Não há declaração de homologação
remota. A edição administrativa concorrente mantém a limitação anterior de não possuir
controle otimista de revisão.

Commit sugerido, sem executá-lo: refactor: remove demonstrações e preserva destaques dos projetos

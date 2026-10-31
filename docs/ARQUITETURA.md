# Arquitetura — WS OS V2.1

## Referência
Base de diagnóstico: commit `c7af7834e3774ab29a631b0798d70e8cc59999ad`. Este documento descreve a organização identificada no código versionado; não representa aprovação funcional de todas as integrações.

## Fluxo geral
`index.html` → `src/main.jsx` → `src/App.jsx` → shells Desktop/Mobile → núcleo, aplicativos e funcionalidades → `src/services` → rotas HTTP do Cloudflare Worker (`worker/index.js` → `functions/api`).

O Worker também entrega os assets gerados pelo Vite por meio do binding `ASSETS` e executa a rotina agendada definida em `functions/_lib/maintenance.js`.

## Responsabilidades
| Diretório | Responsabilidade |
|---|---|
| `src/core` | Registro dos aplicativos, janelas/instâncias, navegação, estado, permissões e preferências |
| `src/shells` | Composição das experiências Desktop e Mobile |
| `src/apps` | Aplicativos públicos e Administração |
| `src/features` | Recursos integrados do sistema (janelas, busca, widgets, painéis e Wally) |
| `src/services` | Acesso a dados, transporte, integrações, cache e armazenamento |
| `src/shared` | Componentes, utilitários, contratos e internacionalização |
| `src/styles` | Tokens, temas, estilos globais e visuais |
| `src/content` | Conteúdo profissional versionado |
| `functions/api` | Handlers de APIs |
| `functions/_lib` | Infraestrutura compartilhada do backend |
| `worker` | Entrada HTTP, distribuição de rotas, assets e agendamento |
| `database` | Migrações PostgreSQL e D1; validação de banco |
| `tests` | Testes automatizados |

## Aplicativos e ciclo de execução
O registro central está em `src/core/appRegistry.js`. Existem 17 entradas catalogadas: 16 públicas e Administração protegida; algumas são acessadas contextualmente. Editor e Visualizador de Arquivos admitem múltiplas instâncias. Currículo encaminha ao Visualizador. O comportamento em Desktop e Mobile é composto pelos shells próprios.

## Dados e persistência
Preferências, rascunhos e arquivos pessoais compatíveis utilizam recursos locais do navegador. Recursos administrativos e públicos podem depender de Supabase, Cloudflare D1, APIs e Storage. A política real de acesso pertence ao servidor/banco; ocultar uma opção na interface não concede segurança.

## Regras de evolução
- Preservar separação entre shell, core, app e serviço.
- Revisar consumidores antes de mover ou remover arquivos.
- Não inferir desuso apenas por ausência de importação estática.
- Atualizar `docs/INVENTARIO.csv` sempre que arquivos forem alterados ou criados.
- Alterações de contratos devem ser validadas nos consumidores e testes.

## Evidências
`src/main.jsx`, `src/App.jsx`, `src/core/appRegistry.js`, `worker/index.js`, `wrangler.jsonc`, `package.json`. Revisões aprofundadas cabem às etapas 03–30.

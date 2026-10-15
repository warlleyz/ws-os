# Verificação da reorganização

Data: 14/10/2026. Execução sobre a cópia organizada e repetição no destino antes do commit.

- Lint: aprovado, sem erros/avisos.
- Build: aprovado com dependências existentes, Vite 8.3.4.
- Testes Node: 7 aprovados, 0 falhas.
- Formatação de src, docs de execução, testes e README: aprovada.
- 79 imports relativos resolvidos.
- 111 arquivos de fonte; 37 reservas explícitas.
- Registry, appManager, notificações, widgets e temas: AST preservada, exceto formatação.
- CSS extraído: 299 combinações seletor/contexto com declarações preservadas.
- Navegador: boot, boas-vindas, abrir, maximizar, restaurar, minimizar, restaurar pela barra, pesquisa, tema claro, calendário, Escape, mostrar Desktop e reload.
- Aviso de key introduzido na extração do widget corrigido; sem novos erros observados após correção/reload.

Limites: sem benchmarks, WCAG completa, backend, dispositivos físicos, localização real, testes E2E automatizados ou validação integral do plano. Sete testes Node não equivalem a cobertura dos 18 apps ou dos hooks React. Nenhuma instalação/atualização de dependências, push ou deploy.

## R1 — revisão complementar de Taskbar e painéis — 14/10/2026

Esta revisão completa os pontos restantes da R1 sobre a implementação do commit
e09b8dc. A escolha de instâncias por histórico e o clique repetido para minimizar
já existiam e foram preservados.

Alterações desta revisão:
- ArrowUp/ArrowDown no grupo abre as prévias e leva o foco para seus controles.
- Escape dentro das prévias fecha a seção e devolve o foco ao grupo de origem.
- O fechamento atrasado respeita foco do teclado e hover.
- Mudanças no histórico de foco dos apps fecham painéis, menus e prévias, inclusive
  quando a ativação ocorre pelo teclado sem um pointerdown externo.
- Timers pendentes e destaque de janelas são limpos ao mudar o foco dos apps ou
  desmontar a Taskbar.
- Seis testes novos cobrem foco, timers, cleanup e seleção da última instância usada.

Verificações executadas no navegador local, com mouse e teclado:
- Duas instâncias de Projetos e Sobre Mim ativo; grupo retorna à última instância
  usada mesmo quando ela foi criada antes da outra.
- Clique repetido minimiza; com uma ou todas minimizadas, grupo/prévias restauram.
- Prévia ativa outra instância; fechar uma preserva a outra; fechar todas remove
  o grupo e mantém o outro app ativo.
- Calendário fecha ao ativar app pelo teclado e ao abrir prévias.
- Calendário, WS Menu, Notificações, Controle Rápido, Wally e Clima: exclusividade,
  Escape e clique externo verificados individualmente.
- Prévia centralizada acima da barra: centro aproximadamente 640 px em viewport
  de 1280 px; limite inferior acima do topo da Taskbar. CSS não foi alterado.
- Sem mensagens de erro ou warning da aplicação no console durante esses fluxos.

Checks: lint e build passaram. A árvore local, incluindo as correções de performance
anteriores, passou em 29 testes. O commit isolado da R1 também é verificado sem
essas correções: 27 testes, lint e build.

Escopo do checkpoint: somente R1. As alterações de performance anteriores continuam
locais e fora deste commit; seu diagnóstico permanece parcial para o travamento nas
bordas do monitor. O stash WIP R3.3 e o arquivo local diagnostico-codex.patch foram
preservados. R2 só será revisada após autorização para avançar.


## R2 — revisão complementar de contratos e recuperação — 14/10/2026

- Mantidos os 18 apps, 12 atalhos e apenas Sobre o Sistema implementado.
- Entrada lazy explícita no Registry; arquivos vazios de outros apps não são
  mais descobertos como entradas pelo AppHost.
- requestAppOpen retorna state e result com instanceId/status ou erro tipado.
  openApp continua retornando estado para os consumidores existentes.
- Validação estrutural rejeita options/params inválidos e origin vazia sem mudar
  a sessão. SystemProvider informa falha sem notificação falsa de sucesso.
- Recuperação cria novo lazy no clique em Tentar novamente e atualiza o cache para
  novas aberturas. Renderizações normais preservam identidade e estado do app.
- Sete testes novos de contratos: sucesso/ID, erros, entradas inválidas, instância
  única/múltipla, close/reopen, sessão inicial e pausa seletiva.

Navegador, diagnóstico isolado (instrumentação fora do produto):
- Loader rejeitado uma vez: fallback isolado, outro app permanece interativo;
  Tentar novamente invoca o loader outra vez e recupera a instância.
- Erro de renderização: fallback e recuperação sem reiniciar os demais apps.
- Após recuperar, fechar/reabrir usa o componente recuperado e cria estado novo.
- Componente de teste consumidor de executionState: minimizar preserva contador;
  activeTimers passa de 1 para 0 na pausa; restaurar preserva o estado; fechar
  executa cleanup e deixa activeTimers em 0. Isso valida o contrato com um consumidor
  de teste, não afirma que todo app futuro já possui cleanup ou pausa implementados.
- Entrada inválida pelo SystemProvider: zero instâncias e aviso de erro; solicitação
  válida seguinte: uma instância e aviso de abertura.

Preview real sem instrumentação:
- Sobre o Sistema carrega conteúdo real; minimizar/restaurar preserva instanceId;
  fechar/reabrir cria instanceId diferente; reload retorna ao Desktop sem janelas.
- Console sem erros/warnings nesses fluxos.

Checks: lint/build e 36 testes passaram na árvore local. Cópia exata do conteúdo
preparado para o commit isolado: lint/build e 34 testes. Os dois testes adicionais
da árvore local pertencem à correção de performance anterior, fora do commit R2.

Limites: validação de dados de domínio, API de confirmação de abertura na sessão
React, backend/autorização, cancelamento de serviços e confirmação de descarte de
documentos serão integrados quando esses consumidores existirem. ErrorBoundary não
captura automaticamente erros de handlers e tarefas assíncronas internas. Retry
não garante corrigir erro persistente de rede ou invalidar cache nativo de módulos.

Nenhuma alteração em localStorage, CSS, dependências ou na R3.3. Correções locais
anteriores de performance preservadas e excluídas deste commit. Sem push.


## R3 — grade, organização e persistência — 14/10/2026

Entregue: aplicação de posições persistidas, drag individual/de grupo, seleção por
Ctrl/Shift, retângulo e Ctrl+A, alternativas por teclado, ordenação persistente,
grade com rolagem em áreas pequenas, capacidade compartilhada com widget, feedback
de falta de espaço e tratamento de armazenamento inválido/bloqueado/sem quota.

O WIP R3.3 foi lido e reaproveitado como base de intenção, chaves e formatos. Foi
corrigida sua lacuna de não consumir as posições salvas no layout. O stash original
não foi aplicado/destruído: SHA fde807596bafaad6878da5721445b428c4ea468b preservado.

Validação automatizada: nove testes novos, incluindo matriz de 96 combinações de
viewport/widget; todos os 12 atalhos recebem células válidas sem colisões. Cobertos
retorno de posições após resize, colisões, movimento de grupo, seleção por área,
compatibilidade com chaves R3.3, dados corrompidos, quota e tamanhos discretos.
Lint/build e 45 testes passaram na árvore local; commit isolado: lint/build e 43.

Navegador com teclado e cliques reais: seleção Ctrl/Shift, Ctrl+A e Escape; movimento
de dois atalhos mantendo deslocamento relativo; posições e ordem alfabética após
reload; relógio movido por setas e redimensionado; tamanho sem espaço rejeitado;
inclusão em grade cheia bloqueada com aviso. Área 320×300 manteve os 12 atalhos e
rolagem, com relógio temporariamente indisponível e aviso; ampliar retornou às
preferências anteriores. Área 600×450 rejeitou 3×3 preservando 2×2 e os atalhos.

Diagnóstico de armazenamento em origem de teste: dados corrompidos e leitura
bloqueada produziram fallback, dois avisos (Desktop/widgets) e zero tentativas de
gravação na inicialização. Com escrita bloqueada, movimento por teclado continuou
funcionando na sessão e houve feedback. Dados reais não foram corrompidos para testar.
Contador de observer do workspace permaneceu estável sem resize (um callback inicial);
resize/rolagem não produziram ciclo contínuo observado.

Handlers de drag/seleção por área/cancelamento também foram exercitados no navegador
com eventos pointer simulados e captura substituída apenas na instrumentação externa.
Cancelamento manteve a posição e limpou translate. Isso não equivale a validar captura
nativa com mouse real, touch ou o resize junto às bordas do monitor: esses gates
continuam na R5. Não declarar o problema original de performance resolvido nesta R3.

Instrumentação ficou fora do produto. Alterações locais anteriores de performance
foram preservadas e excluídas do commit R3. Não houve instalação, migração destrutiva,
commit do stash original ou push. Próxima etapa, mediante autorização: R4.

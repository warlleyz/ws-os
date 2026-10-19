> **Atualização de 15/10/2026:** consulte primeiro [Entrega e continuidade](ENTREGA-E-CONTINUIDADE-2026-10-15.md) e [Estado atual](implementation-status.md). O texto abaixo preserva descrições/evidências de etapas anteriores; afirmações sobre apps reservados, Mobile ausente ou apenas um app implementado foram superadas pelos commits atuais.

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

## R4 — fundação visual, acessibilidade e idioma — 14/10/2026

Implementado: pt-BR/en persistente na interface atual, datas/pesquisa/ordenação
localizadas, lang e marca WS OS, preferências de movimento/transparência/baixo custo,
tokens complementares para superfícies claras/escuras e semântica, foco visível,
foco modal e navegação/retorno dos painéis e menus contextuais.

Oito testes novos: paridade dos catálogos; persistência/assinaturas/lang; templates,
nomes e fallback seguro; armazenamento bloqueado; preferências de efeitos e falhas;
contrastes dos dois temas. Para cada tema, 21 pares texto/superfície foram medidos
numericamente (mínimo exigido 4,5:1), além de ação/badge (4,5:1) e borda de controle
contra superfície primária (3:1). Pares cobertos: texto primário/secundário, link,
acento secundário e success/warning/error sobre canvas/primary/secondary.

Checks: lint, build e 53 testes passaram na árvore local. Cópia exata do commit
isolado: lint/build e 51 testes. As duas verificações extras locais pertencem ao
diagnóstico de performance anterior e ficam fora do commit R4.

Navegador:

- Idioma trocado para inglês com Sobre o Sistema aberto: mesmo instanceId preservado;
  rótulos, conteúdo estático, menus, atalhos e datas traduzidos. Pesquisa Projects
  encontra o app pelo nome apresentado. Volta para pt-BR sem recriar a sessão.
- Light/dark conferidos. Modal claro computado: fundo rgb(255,255,255), texto
  rgb(23,35,52). Corrigida regra legada do modal/boot que sobrepunha os tokens.
- Flags persistentes após reload; modo de baixo custo produziu wallpaper sem
  gradiente e transição computada 0s. As preferências mantêm fallback quando salvar
  falha, conforme testes de contrato.
- Modal forçado só por instrumentação externa de leitura, sem apagar welcome-seen:
  atributo inert presente no fundo, Tab e Shift+Tab permaneceram no botão, Escape
  removeu o modal e devolveu foco ao WS Menu. Tema/idioma persistidos aplicados.
- Shift+F10 no atalho abriu ações; setas moveram foco e Escape retornou ao atalho.
  Foi corrigido o retorno em StrictMode, preservando a origem entre efeitos iniciais.
- Painel fechado por Escape retornou ao acionador. Link de salto focou ws-desktop
  e manteve a URL. Reflow em aproximadamente 640×360: conteúdo dos controles com
  scrollHeight 405/clientHeight 179; opções finais permaneceram operáveis por teclado.
- Console sem erros/warnings nos fluxos de idioma, temas e controles testados.

Não executado: leitor de tela real, zoom nativo, toque físico e ensaio de todas as
combinações/estados. Inspeção da árvore acessível e reflow não substituem esses ensaios.
Nenhuma afirmação de WCAG AA completa. Esses gates manuais ficam explícitos na
validação integrada; a R5 também precisa retomar o resize nativo junto às bordas.

Nenhuma biblioteca instalada, nenhum dado existente apagado. Stash R3.3 preservado;
correções locais de performance mantidas fora do commit. Sem push. Próxima etapa,
mediante autorização: R5, com gates manuais ainda pendentes conforme descrito acima.

## R5.1 — Revisão das correções locais de performance

Data: 2026-10-14

### Escopo

- Revisão das oito alterações locais de performance.
- Preservação dos contratos e comportamentos existentes.
- Sem alterações nas chaves de localStorage ou dependências.
- Sem reaplicação de patches ou do stash R3.3.

### Validações

- git diff --check: aprovado.
- npm.cmd run lint: aprovado.
- npm.cmd run build: aprovado (Vite 8.3.4).
- node --test tests/core/*.test.cjs: 53/53 aprovados.

### Limitações

- O travamento no resize nativo permanece aberto.
- Testes físicos de mouse, touch e zoom não executados.
- WCAG AA não comprovada.
- Não há comprovação de ganho de performance em preview.

### Resultado

Correções locais revisadas e aprovadas nos gates estáticos.
Integração condicionada a commit isolado.

### Próximo passo

R5.2 — Ciclo de vida de janelas, Desktop e recursos.

## R5.2 — Ciclo de vida de janelas e Desktop

Data: 14/10/2026

### Alterações

- Cleanup explícito de pointer capture na desmontagem de janelas.
- Preservados os listeners, observers e timers existentes.
- Nenhuma alteração em geometria, contratos ou persistência.
- Nenhuma reorganização de diretórios ou dependência nova.

### Validações

- npm.cmd run lint: aprovado.
- npm.cmd run build: aprovado.
- node --test tests/core/*.test.cjs: aprovado.
- Abertura, minimização, restauração, maximização e fechamento: aprovados manualmente.
- Arraste e cancelamento com Escape: aprovados manualmente.
- Dez ciclos de abertura e fechamento: aprovados manualmente, sem problemas relatados.

### Limitações

- Testes manuais realizados pelo desenvolvedor.
- Ausência de medição instrumental de memória e listeners.
- Resize nativo junto às bordas físicas ainda não validado.
- WCAG AA não comprovada.

### Resultado

Correção de cleanup integrada ao escopo da R5.2.
Testes automatizados e manuais aprovados.

### Próximo passo

R5.3 — Diagnóstico e validação do resize nativo.

## Configurações — 15/10/2026

Implementação e evidências detalhadas em docs/settings.md. Inclui upload real, IndexedDB real, recuperação, restauração, widgets, auto-ocultação, PT-BR/EN, temas e reflow Desktop/Mobile. Leitor de tela real, toque físico, zoom nativo e resize nas bordas do monitor continuam como validação humana explícita; não equivalem aos ensaios automatizados.

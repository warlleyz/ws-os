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

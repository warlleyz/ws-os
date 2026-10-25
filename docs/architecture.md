> **Referência vigente da revisão final:** [Etapa 15](finalizacao/ETAPA-15-ANDAMENTO.md), [plano](PLANO-FINALIZACAO-POR-ETAPAS.md) e checkpoints 03–14. Os trechos datados abaixo são históricos. Hoje há dois shells funcionais, 17 aplicativos registrados com carregamento sob demanda e autenticação administrativa; arquivos pessoais permanecem no IndexedDB, oficiais no Supabase Storage privado via Worker. Não interpretar descrições antigas de recursos reservados como estado atual, nem testes controlados como homologação externa.

> **Atualização de 15/10/2026:** consulte primeiro [Entrega e continuidade](ENTREGA-E-CONTINUIDADE-2026-10-15.md) e [Estado atual](implementation-status.md). O texto abaixo preserva descrições/evidências de etapas anteriores; afirmações sobre apps reservados, Mobile ausente ou apenas um app implementado foram superadas pelos commits atuais.

# Arquitetura de implementação

Data: 14/10/2026. Referência: mestre v0.16.0, especialmente B04, B05 e B11. Este documento descreve a reorganização, sem substituir decisões de produto.

## Fronteiras

| Camada         | Responsabilidade                                              | Limite                                             |
| -------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| App            | Orquestrar boot, tema, apresentação e sessão                  | Não implementar conteúdo de apps ou geometria      |
| core           | Registry, instâncias, notificações, widgets, temas e contexto | Não incorporar regras internas dos apps            |
| shells/desktop | Compor área de trabalho, atalhos, menus e Taskbar             | Consumir Core; não realizar consultas HTTP         |
| shells/mobile  | Destino da experiência Mobile própria                         | Reservado, sem implementação atual                 |
| features       | Capacidades sistêmicas por responsabilidade                   | Não transformar funcionalidades em apps adicionais |
| apps           | Módulo de cada um dos 17 apps                                 | Reservados e não importados                        |
| services       | Provedores e armazenamento                                    | Somente clima ativo                                |
| shared         | Ícones comuns, destinos de i18n e isolamento de falha         | Reutilização comprovada                            |
| styles         | Fundamentos, temas e ordem da cascata                         | Tokens sem duplicação                              |

## Inicialização e estado

`main.jsx` importa `styles/global.css` e monta React em StrictMode. App lê tema e flag de boas-vindas. Boot dura aproximadamente 1,5 segundo: é uma apresentação temporizada, não prova de disponibilidade de serviços. Após boot, SystemProvider monta a sessão com Desktop; WelcomeDialog apresenta as boas-vindas.

SystemProvider contém appState, notificationState, visibleToasts e as operações antes declaradas dentro do Desktop. useSystem fornece a mesma sessão a Desktop e Taskbar. Ainda não há todos os contratos futuros, autenticação ou navegação Mobile.

Seleção, menus contextuais, pesquisa, painel ativo, prévias e rolagem continuam locais. Tema permanece em App, transmitido aos controles. Widget possui hook próprio. Geometria, captura de ponteiro e snap permanecem locais a cada janela; movimentos não são enviados ao contexto global.

## Desktop

- Desktop.jsx: composição, seleção e coordenação de menus existentes.
- DesktopShortcuts.jsx: área de atalhos e widgets, com classes/eventos preservados.
- DesktopContextMenu.jsx e ShortcutContextMenu.jsx: apresentações dos menus.
- desktopLayout.js: cálculo puro da grade compartilhada e área reservada.
- useDesktopLayout.js: ResizeObserver da área disponível.
- useDesktopWidgets.js: persistência, tamanho e arraste do widget existente.
- WidgetHost.jsx: moldura/controles; clock/ClockWidget.jsx: conteúdo do relógio.

O algoritmo ainda pode ocultar atalhos em área insuficiente. A organização não conclui as regras da grade.

## Taskbar e painéis

- Taskbar.jsx: composição, grupos, ações dos botões, painel ativo e coordenação.
- TaskbarApps.jsx: apps abertos e navegação horizontal.
- TaskbarPreview.jsx: prévias por instância, ainda com conteúdo visual provisório.
- TaskbarContextMenu.jsx: menu das instâncias.
- useTaskbarPreviews.js: temporizadores e destaque de janela.
- useTaskbarScroll.js: observação e controle de overflow.
- PanelLayer.jsx: container flutuante com filhos; não recebe os dados de todos os painéis.
- WSMenu.jsx/useWSMenu.js: apresentação, busca atual e menus dos apps.
- useMenuPreferences.js: favoritos no formato persistido existente.
- searchService.js: normalização textual, sem pesquisa contextual completa.
- Notificações, Controles, Wally, Clima e Calendário têm apresentações próprias.
- useGlobalShortcuts.js: listener de teclado extraído da Taskbar.

panelManager.js contém o resolvedor existente. Não é um gerenciador universal de overlays. As pendências de calendário e grupos foram preservadas.

## Janelas

WindowLayer.jsx apresenta instâncias com ID, foco e z-index. Window.jsx contém moldura, controles e handles. useWindowInteraction.js contém refs, efeitos, ponteiro, teclado, maximização, restauração e snap. windowGeometry.js contém cálculos puros.

AppHost.jsx contém o placeholder anteriormente embutido em Window. Não faz lazy loading ou seleção de componentes reais. Isso exigirá entrada do registry, isolamento de erro e parâmetros de abertura.

executionState não pausa atividades sozinho. Apps futuros precisam consumir o lifecycle. Minimizar conserva o componente; fechar remove a instância imediatamente, sem transição de fechamento.

## Serviços e dados

useWeather administra estado/geolocalização; weatherService faz HTTP e valida temperatura. Preserva condições atuais, sem acrescentar cache, retries ou timeout HTTP.

As chaves de localStorage são preservadas. Armazenamento compartilhado, GitHub, WakaTime, Contato, calendário, auth e Wally têm serviços reservados. Não há Supabase/RLS/funções protegidas/credenciais configurados. Arquivos pessoais futuros permanecem locais.

## CSS

global.css importa fontes, tokens, temas, efeitos e system.css, depois os fundamentos globais. system.css declara explicitamente a sequência dos estilos dos módulos, evitando dependência da ordem incidental de importação dos componentes.

CSS de Desktop, janelas, Taskbar, prévias, menus, notificações e painéis fica próximo dos módulos. Boot e Welcome importam seus próprios estilos. Foram comparadas 299 combinações de seletor/contexto, com a mesma sequência de declarações por seletor. Isso não substitui auditoria visual de todos os breakpoints.

O tema claro ainda contém superfícies escuras fixas em partes da interface. A duplicação de tokens foi retirada; App.css e index.css antigos foram removidos. Não houve redesenho da paleta.

## Convenções

JavaScript/React; componentes PascalCase; hooks com use; funções de domínio nomeadas por ação. Interfaces pequenas, sem barrel obrigatório. Submódulos de apps surgem conforme implementação. Arquivo reservado tem comentário e não é importado. JSON de idioma `{}` não significa tradução entregue. Sem bibliotecas novas por consequência desta organização.

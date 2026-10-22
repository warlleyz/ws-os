# Etapa 12 — Desktop, Taskbar, menu, painéis e widgets

## Estado: blocos técnicos validados localmente; aceite visual e integrações reais pendentes

Planejamento preservado, incluindo DEC-054/057/236 (prévias e ações por instância), exclusividade dos painéis e DEC-FIN-007 (indicadores discretos de eventos no widget Calendário). Nenhum commit/push, migração ou alteração de credencial/configuração. Wally remoto continua desativado. Alterações anteriores preservadas. Etapa 13 não iniciada.

## Blocos examinados e corrigidos

| Bloco | Entrega local |
| --- | --- |
| Desktop/grade | Organização compartilhada, arraste, cancelamento, atalhos e persistência existentes examinados; testes anteriores de colisão, resize, grade virtual e recuperação continuam passando. Nenhuma reorganização do Core ou redesign. |
| Taskbar | Agrupamento, estados e ações existentes preservados. Rótulo de ativação da prévia passa pela tradução. Miniatura estática local do conteúdo profissional público visível; ações de ativar/fechar continuam usando a instância correta e as guardas do Core. |
| Menu | Favoritos sincronizados entre abas, inclusive limpeza da preferência; falha de persistência informa que a seleção só permanece na sessão. Catálogo/favoritos/recentes e filtragem administrativa existentes preservados. |
| Busca | Carregamento e falha remota não são apresentados como simples ausência de resultados. Conteúdo local permanece disponível; avisos de dados obsoletos são exibidos. GitHub não é consultado sem usuário configurado. Destinos contextuais continuam no actionService. |
| Painéis/atalhos | Escape/foco existentes preservados; não se restaura foco em elemento removido. Atalhos globais respeitam defaultPrevented e composição de texto, sem consumir Escape já tratado pelo aplicativo. |
| Calendário público | Evento com horário recebe data no fuso publicado, inclusive ao atravessar meia-noite em UTC. Projeção explícita conserva apenas campos públicos; fim anterior ao início é rejeitado. Falha dos eventos limpa indicadores não confirmados; fallback em cache informa obsolescência. |
| Clima | Erro síncrono de geolocalização encerra carregamento com mensagem de permissão; cidade escolhida, cancelamento e cache existentes mantidos. |

## Quatro widgets

- Host passa a própria instância ao componente, mantendo fallback para chamadas antigas e as preferências existentes.
- Relógio: respeita o fuso da instância, interrompe o timer quando o documento fica oculto, atualiza ao retornar e limpa listeners/timer ao desmontar. Fuso inválido herdado do armazenamento usa o local sem derrubar o Desktop nem apagar a preferência.
- Calendário: indicadores discretos dos eventos públicos remotos/locais, nomes na descrição acessível e título, navegação de meses/retorno ao dia atual preservados. Exibe erro/obsolescência dos eventos. O painel mantém a fonte de feriados existente; nenhuma solicitação privada foi incorporada ao calendário.
- Clima: usa unidades/opções da instância; data inválida de previsão não gera erro de renderização; mensagens e atualização existentes mantidas.
- Dev Insights: contagem de linguagens usa Map; dados antigos de WakaTime não viram fonte principal quando a opção foi desabilitada; avisos de cache do WakaTime são mostrados quando habilitado. Dados continuam reais ou indisponíveis, sem números fictícios.

## Miniaturas e privacidade

TaskbarThumbnail é efêmero, sem persistência, upload, canvas de captura, dependência nova ou polling. Clona somente o conteúdo visível de Sobre Mim, Projetos, Dev Insights, Currículo, Certificados e Sobre o Sistema. Formulários, campos, conteúdo editável, imagens e recursos incorporados são removidos; identificadores e referências navegáveis/eventos são retirados; controles restantes viram texto estático; SVG fica inacessível/interativamente inerte e é removido ao fechar a prévia.

Para Administração, Terminal, Notas, Contato, Arquivos/Editor/Visualizador, Wally, janelas minimizadas e conteúdo indisponível, mantém-se o ícone com título/estado/ações. Não há promessa de snapshot contínuo ou reprodução pixel a pixel; a conferência real de renderização/compatibilidade faz parte do aceite visual pendente. Não se introduziu captura de dados pessoais para miniaturas.

## Validação realizada

- npm run lint: aprovado, sem avisos.
- npm run build: aprovado.
- npm run test: 475 testes aprovados, zero falhas.
- git diff --check: aprovado.
- Treze regressões novas: evento no fuso correto/projeção pública; indicador/navegação do calendário; fuso e timer do relógio; fuso salvo inválido; unidades/data inválida do clima; WakaTime desabilitado e nomes especiais; sincronização/quota de favoritos; erro síncrono de localização; Escape/composição; falha remota com resultado local; restauração/limpeza de foco; bloqueio de miniatura protegida e remoção de snapshot público.
- Testes de grade/atalhos, multiwidget, Taskbar, serviços e contratos anteriores continuam passando. O helper de UI ganhou suporte às funções encapsuladas em memo e useLayoutEffect; o componente interno real é executado sem alterar a implementação para os testes.
- DOM/hooks, recursos e rede controlados. Não houve acesso a provedores remotos, permissão real de localização ou inspeção visual em navegador/dispositivo físico nesta entrega.

## Arquivos da etapa

- src/services/contentService.js
- src/features/calendar/useCalendarEvents.js
- src/features/calendar/CalendarPanel.jsx
- src/features/widgets/WidgetHost.jsx
- src/features/widgets/calendar/CalendarWidget.jsx
- src/features/widgets/calendar/CalendarWidget.css
- src/features/widgets/clock/ClockWidget.jsx
- src/features/widgets/weather/WeatherWidget.jsx
- src/features/widgets/dev-insights/DevInsightsWidget.jsx
- src/features/weather/useWeather.js
- src/features/launcher/useMenuPreferences.js
- src/features/search/GlobalSearchResults.jsx
- src/features/panels/PanelLayer.jsx
- src/features/shortcuts/useGlobalShortcuts.js
- src/shells/desktop/taskbar/TaskbarPreview.jsx
- src/shells/desktop/taskbar/TaskbarPreview.css
- src/shells/desktop/taskbar/TaskbarThumbnail.jsx (novo)
- tests/core/desktop-shell-ui.test.cjs (novo)
- tests/helpers/app-ui.cjs
- tests/core/i18n-coverage.test.cjs
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md
- docs/finalizacao/ETAPA-12-ANDAMENTO.md

## Pendências de aceite integral

1. Conferência visual real do Desktop nos dois temas/idiomas, densidade, rolagem, menus contextuais, prévias SVG, overlays, foco e combinações de janelas/tamanhos. Teste controlado não foi apresentado como essa homologação.
2. Homologar eventos publicados/despublicados e obsolescência com backend autorizado; confirmar fonte de feriados conforme o escopo territorial aprovado. Nenhuma alteração de banco é necessária para estes consumidores.
3. Validar Open-Meteo/cidades/localização em navegador, com permissão negada, indisponibilidade e retorno de conexão. Nenhuma coordenada real foi consultada pelo agente.
4. Conferir GitHub/WakaTime reais quando configurados, fontes/cache e falhas de cota, sem inventar respostas.
5. Revisão linguística final; JSONs pt-BR/en não foram editados. Etapa 12 não é declarada 100% aceita enquanto faltar esse aceite.

## Traduções adiadas

- PENDENTE_I18N src/features/search/GlobalSearchResults.jsx :: Não foi possível atualizar a busca remota. Resultados locais continuam disponíveis.

## Continuidade

Próxima implementação: Etapa 13 — Mobile e tablets, após autorização de avanço. Preservar todo o estado Git e não reexecutar scripts temporários. Testes só devem ser repetidos quando uma mudança/falha justificar. Nenhum commit/push foi feito. Sugestões após revisão: fix: integra eventos e preferencias dos widgets; fix: reforca busca favoritos e foco dos paineis; feat: adiciona miniaturas locais protegidas na taskbar

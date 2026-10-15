# Contratos atuais e evolução necessária

Referência: DEC-411–449. O que está marcado como futuro não é implementação existente.

## Registry

getRegisteredApps retorna cópia do array com os mesmos objetos; getAppDefinition(appId) retorna definição ou null. Campos atuais: id, name, icon, category, menuCategory, desktopShortcut, implemented, loadComponent (quando implementado), allowMultipleInstances, pauseWhenMinimized, public e showInMenu.

Há 12 Desktop e 6 Sistema. category é classificação arquitetural; menuCategory não deve virar categoria visual do menu. Apenas Sobre o Sistema possui implemented:true e está integrado ao AppHost, ainda com conteúdo parcial. Os outros 17 aplicativos permanecem com implemented:false. Essa flag indica que existe um componente funcional conectado, não que o aplicativo está 100% concluído.

A entrada lazy é explícita no Registry: loadComponent retorna a promessa do módulo com export default. Apenas Sobre o Sistema possui essa entrada. AppHost não descobre componentes a partir de arquivos vazios. Futuro: elegibilidade por shell, capacidades e regras específicas de acesso e parâmetros, preservando os IDs existentes.

## Instâncias

Estado atual: `{ instances, activeInstanceId, focusHistory }`. Instância: `{ id, appId, minimized, executionState, origin, params }`. ID da instância usa crypto.randomUUID; não equivale ao appId ou a ID de recurso externo.

| Operação    | Entrada           | Resultado atual                                    |
| ----------- | ----------------- | -------------------------------------------------- |
| openApp | state, appId, options? | Abre ou restaura uma instância pública; aceita origin e params opcionais |
| activateApp | state, instanceId | Ativa instância visível e atualiza histórico       |
| minimizeApp | state, instanceId | Oculta e seleciona foco disponível                 |
| restoreApp  | state, instanceId | Visível, running e ativa                           |
| closeApp    | state, instanceId | Remove e ajusta foco                               |

Entradas inexistentes devolvem estado sem alteração. openApp aceita um terceiro argumento opcional, options, com origin (string) e params (objeto). A origem padrão é system; options e params, quando fornecidos, precisam ser objetos simples (incluindo protótipo nulo). origin, quando fornecida, precisa ser string não vazia. Entradas inválidas são rejeitadas sem alterar a sessão; não são mais silenciosamente convertidas em parâmetros vazios. Os parâmetros são copiados superficialmente e permanecem na instância durante a sessão.

Aplicativos de instância única restauram a instância existente sem atualizar seus parâmetros. O Core bloqueia aplicativos não públicos, incluindo Administração. openApp mantém o retorno de estado para compatibilidade. requestAppOpen fornece o resultado explícito descrito abaixo. A validação dos campos de domínio permanece específica de cada aplicativo futuro. origin e params não representam autorização. Hoje não há operações administrativas reais. Corrigir antes de conectar dados protegidos.

### Solicitação com resultado

requestAppOpen(state, appId, options?) retorna { state, result }:
- Sucesso: result = { ok: true, instanceId, status: 'opened' | 'restored' }.
- Falha: result = { ok: false, error: { code, message } }; state é a mesma referência recebida.
- Códigos atuais: APP_NOT_FOUND, APP_ACCESS_DENIED e INVALID_OPEN_OPTIONS.
- validateAppOpen(appId, options?) compartilha a validação com o SystemProvider, antes de avisar que um app foi aberto.

Esse é o contrato da operação de estado do Core, não uma promessa de retorno síncrono de atualizações React. run continua sem resultado de abertura; consumidores que precisem de confirmação de uma ação de UI deverão ter uma API de sessão apropriada. Não executar notificações ou efeitos dentro de um updater de estado React para obter esse retorno.

Exemplo no Core:

```js
const { state: nextState, result } = requestAppOpen(state, 'projects', {
  origin: 'app',
  params: { projectId: 'project-01' },
});
```

Instância única conserva origin e params originais ao ser restaurada. Nova instância recebe cópia superficial de params. Isso não representa validação de um projectId real, autorização ou persistência de dados.

## Sessão

useSystem exige SystemProvider acima. Superfície: appState, notificationState, visibleToasts, run, minimizeAllApps, handleNotificationAction, dismissToast e handleNotificationOpen.

run(operation,id,options?) aplica a função de estado. Para openApp primeiro valida a solicitação: falhas geram aviso de erro sem criar instância ou aviso falso de sucesso. Abertura válida produz o aviso existente, inclusive ao restaurar app único. Não oferece transação, autorização ou isolamento de erro. minimizeAllApps preserva a redução de minimização usada antes pelo Desktop; não é desligamento/reinício completo.

## Painéis

resolvePanel(value,current,panel) recebe booleano ou função. Abrir substitui o ativo; fechar painel diferente preserva o atual. Taskbar usa o painel ativo para garantir exclusividade, incluindo calendário. Clique externo, Escape, abertura de outro painel/prévia e mudança de foco dos apps fecham os elementos transitórios. A revisão complementar da R1 adicionou prévias por teclado e limpeza dos timers.

PanelLayer recebe referência/filhos e não administra autenticação ou navegação.

## Janelas

Window recebe instância, app, ativo, zIndex, offset e callbacks de ativar/minimizar/fechar. Geometria local; minimizar conserva modo/tamanho na sessão; fechar e reabrir cria outra instância; reload não restaura janelas.

useWindowInteraction retorna refs, modo, nome e handlers existentes. windowGeometry preserva mínimos 300×220 quando cabem, margem 8 e distância de snap 24 px. São parâmetros herdados, não requisitos imutáveis.

AppHost recebe nome e instância, consulta o Registry e apresenta placeholder para aplicativos não implementados. Aplicativos habilitados são carregados sob demanda pela entrada loadComponent do Registry, usando React.lazy e Suspense, com AppErrorBoundary por instância. AppHost também recusa definições inexistentes ou não públicas.

Sobre o Sistema é o primeiro componente integrado. Tentar novamente cria um novo lazy somente na ação explícita de recuperação, reinicia o boundary daquela instância e atualiza a entrada usada em novas aberturas. Renderizações normais mantêm a identidade do componente e seu estado. Recuperação reinicia o estado local do app que falhou; as outras instâncias permanecem independentes.

O boundary cobre erros de renderização e rejeição do carregamento lazy. Erros de handlers, timers e operações assíncronas internas devem ser tratados pelo app/serviço. A tentativa não garante recuperação de falhas persistentes de rede nem limpa o cache de módulos do navegador.

Lifecycle atual: minimizar mantém AppHost montado e transmite instance.executionState; apps que admitem pausa precisam consumir esse campo para suspender trabalho e retomá-lo. Não há suspensão mágica de qualquer efeito React. Fechar remove a instância e desmonta o conteúdo, executando os cleanups dos efeitos. Cada app deve cancelar seus próprios recursos. Reabrir cria novo estado local; reload não restaura janelas. Apps atuais não possuem documentos editáveis com alterações pendentes; a confirmação de descarte será exigida quando esses fluxos forem implementados.

## Notificações

Campos: id/title/message/source/type/createdAt/read/action. Tipos info/success/warning/error; ação atual open-app com appId. Histórico até 100, até 3 toasts, duração-base 5 s com pausas existentes por interação/foco. Sem persistência após reload.

Abertura por notificação verifica app público e procura instância existente. UI permite ler/ler todas/remover/limpar. Operações protegidas futuras sempre precisarão de autorização própria.

## Persistência

| Chave                 | Conteúdo                      |
| --------------------- | ----------------------------- |
| ws-os:theme           | dark/light                    |
| ws-os:welcome-seen    | string true após apresentação |
| ws-os:desktop-widgets | Widget serializado            |
| ws-os:desktop-shortcut-order | default/name |
| ws-os:desktop-shortcut-positions | Mapa appId → {column,row} |
| ws-os:menu-favorites  | IDs favoritos; máximo atual 6 |

Widget ativo clock-default: visible, position `{column,row}`, size `{columns,rows}`. UI oferece 2×2, 3×2, 3×3. Validação de formato usa fallback. Falhas de leitura/salvamento são avisadas; preferências inválidas não são sobrescritas automaticamente na inicialização. Não apagar chaves ou converter formatos sem migração. IndexedDB de arquivos ainda não existe.

## Clima

fetchCurrentWeather(latitude,longitude) consulta Open-Meteo, verifica resposta HTTP/temperatura e retorna data.current ou erro. useWeather mantém loading/error/data e pede localização somente por ação. Timeout de geolocalização 10 s; HTTP ainda sem timeout.

Futuro: previsão, validação completa, cancelamento, resultados obsoletos, cache e atualização visível. Sem segredos no cliente.

## Contratos futuros

1. Abertura com origem/parâmetros/resultado e histórico Mobile sem alterar URL comum.
2. Lifecycle com pausa seletiva, cancelamento e fechamento de alterações pendentes.
3. Modelos de projetos, publicações, arquivos, documentos, eventos, solicitações e pontuações.
4. Fronteira local/oficial e capacidades de edição.
5. Auth e matriz recurso/operação/papel com autorização backend.
6. Serviços com falhas categorizadas, limites, cache/frescor e cancelamento.
7. Ferramentas Wally permitidas com validação, permissão e confirmação quando sensível.
8. Testes negativos, limpeza, compatibilidade de shells e recuperação.

## Registro da primeira passagem da R2 — 14/10/2026 (histórico)

A base de contratos e isolamento foi integrada e validada
com 15 testes automatizados e verificações manuais.

Implementado:
- Registry com flags correspondentes aos componentes existentes.
- Bloqueio de abertura pública de aplicativos restritos.
- Carregamento lazy de aplicativos implementados.
- Isolamento de erro de renderização por aplicativo.
- Abertura com origin e params opcionais.
- Lifecycle básico de instâncias e histórico de foco.

Limitações preservadas:
- Sem resultado ou erro tipado na abertura.
- Sem validação específica de parâmetros por aplicativo.
- Pausa seletiva representada no estado, sem suspensão
  automática das tarefas internas.
- Sem confirmação de descarte de alterações pendentes.
- Sem garantia de recuperação de todos os tipos de falha.
- Sem autorização administrativa real.

O teste manual de erro confirmou que uma falha de
renderização não derruba o Desktop.

Os contratos adicionais serão implementados conforme
as necessidades dos aplicativos, sem reabrir a fundação
desnecessariamente.

## Revisão complementar da R2 — 14/10/2026

A primeira passagem acima descreve o estado anterior. Nesta revisão foram acrescentados resultado tipado no Core, validação estrutural de entrada, feedback de rejeição, entrada lazy explícita no Registry e recuperação de carregamento/renderização por app. Os contratos atuais estão nas seções anteriores.

Permanecem para as etapas dos aplicativos: schemas de domínio, autenticação/autorização backend, confirmação de descarte de documentos, cancelamento de serviços específicos e API de confirmação de abertura na sessão React quando houver consumidor real. Não foram implementados apps novos ou habilitada Administração.


## R3 — organização do Desktop, widgets e armazenamento

desktopPreferences preserva as chaves/formato iniciados na R3.3 guardada. O stash
original permanece intacto como referência; sua funcionalidade foi incorporada e
completada nesta R3. Não aplicar novamente o stash como se fosse trabalho pendente.

useDesktopOrganization administra ordem, posições preferidas e seleção. Ordem padrão
e alfabética são persistidas; escolher uma organização limpa posições manuais mesmo
quando essa ordem já estava ativa. IDs de atalhos permanecem os mesmos.

getDesktopLayout recebe posições preferidas em ordem dos atalhos. Projeta preferências
na área atual, realoca conflitos deterministicamente e não grava durante resize.
Widgets não removem capacidade dos 12 atalhos. Se o viewport não comporta os atalhos,
a grade ganha altura de rolagem; largura menor que uma célula admite rolagem horizontal.
Um relógio habilitado que não cabe fica temporariamente fora da grade, com aviso;
sua preferência volta a ser aplicada quando houver espaço. Mostrar ou ampliar um
widget sem capacidade é bloqueado com feedback.

O observer mede o workspace de tamanho estável, não a altura virtual da grade. Isso
evita realimentar a medição a partir da própria área de rolagem que o layout cria.

Mouse: seleção individual, Ctrl para alternar seleção, Shift para intervalo, arraste
de uma seleção e seleção por retângulo no fundo da grade. Touch no fundo preserva
rolagem; drag de atalhos/widget usa pointer capture. Movimento é confirmado somente
em pointerup válido. pointercancel, perda de captura, Escape, rolagem ou resize limpam
a translação temporária e não gravam posições de um drop cancelado.

Teclado: Espaço seleciona, Ctrl+A seleciona todos, Alt+setas move a seleção para a
próxima posição livre na direção indicada, Enter abre o atalho em foco e Escape
cancela/limpa seleção. No botão Arrastar relógio, setas movem o widget. Tamanhos
permitidos: 2×2, 3×2 e 3×3. Gerenciamento adicional em Configurações segue para A6.

Posições e tamanhos são validados. Leitura inválida/bloqueada usa fallback na sessão
e informa o usuário, sem substituir automaticamente o valor original. Escrita pode
falhar por quota/bloqueio: o uso continua na sessão com aviso. O salvamento continua
em chaves separadas, sem transação entre elas ou migração de formato. Tema, favoritos
e demais chaves existentes não são removidos por esta etapa.


## R4 — idioma, efeitos e acessibilidade da interface

- shared/i18n fornece useLocale, getLocale, setLocale e translate. Idiomas pt-BR/en;
  chave nova ws-os:locale; fallback pt-BR para valor inválido ou leitura bloqueada.
  setLocale sinaliza falha de gravação, mas mantém o idioma da sessão. Atualiza lang,
  rótulos, datas, nomes apresentados, pesquisa e ordenação sem recriar instâncias.
- IDs de apps, chaves, contratos e nomes internos em appRegistry continuam estáveis.
  Os catálogos usam o texto fonte pt-BR como chave; catálogos possuem paridade de
  chaves. Templates traduzem parâmetros de apresentação; texto externo desconhecido
  permanece na origem. A interface atual e Sobre o Sistema são o escopo desta etapa;
  conteúdo futuro e integrações devem acrescentar suas entradas, sem tradução de dados
  privados, URLs, identificadores, comandos ou entrada livre do visitante.
- effectsManager fornece preferências motion/transparency/lowEffects, persistidas
  em ws-os:accessibility. Falha mantém a sessão e gera aviso pelos controles. CSS
  respeita também prefers-reduced-motion/transparency; desmarcar uma opção da UI não
  força efeitos contra a preferência do sistema. Modo de baixo custo reduz gradientes,
  sombras, blur e animações; não é garantia de resolver o resize nas bordas do monitor.
- Tema mantém ws-os:theme e dark/light. Aplicação do tema fica no App; salvamento e
  feedback da ação ficam no Controle Rápido. Nenhuma migração de dados foi realizada.
- Boas-vindas possui fundo inert/aria-hidden, foco inicial, ciclo de Tab/Shift+Tab,
  Escape e retorno de foco. O link de salto move o foco ao Desktop sem mudar a URL.
- Painéis não modais levam foco ao conteúdo e devolvem ao acionador ao fechar por
  Escape/botão. Tab para fora fecha o painel, sem prender o foco. Menus contextuais
  do Desktop/atalhos abrem por Shift+F10/ContextMenu e admitem setas, Home/End, Escape
  e retorno à origem. Navegação dos grupos permanece com semântica de botões.
- foundation.css complementa os tokens para superfícies, estados semânticos, links,
  foco e controles. Boot/boas-vindas usam tokens diretamente. Alvos mínimos de 24 px,
  com regra de 44 px para ponteiro coarse; isso não substitui ensaio físico de toque.

Limites de aceite: testes de contraste verificam pares opacos representativos, não
todas as composições, imagens e estados possíveis. Não existe declaração de conformidade
WCAG AA. Leitor de tela real, zoom nativo e toque físico ainda dependem de validação
manual. Wallpapers personalizados e seu tratamento de arquivos permanecem futuros;
nenhum upload remoto ou mudança de persistência de imagens foi introduzido.

## Configurações — 15/10/2026

Contratos de wallpapers, preferências compartilhadas, widgets, restauração e preferências particulares de apps: consulte docs/settings.md. A restauração usa allowlist e preserva arquivos, imagem pessoal e organização. Desktop/Mobile têm seleções próprias; preferências de acessibilidade prevalecem sobre os efeitos.

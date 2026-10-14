# Contratos atuais e evolução necessária

Referência: DEC-411–449. O que está marcado como futuro não é implementação existente.

## Registry

getRegisteredApps retorna cópia do array com os mesmos objetos; getAppDefinition(appId) retorna definição ou null. Campos atuais: id, name, icon, category, menuCategory, desktopShortcut, implemented, allowMultipleInstances, pauseWhenMinimized, public e showInMenu.

Há 12 Desktop e 6 Sistema. category é classificação arquitetural; menuCategory não deve virar categoria visual do menu. implemented:true em Sobre Mim/Projetos é legado inconsistente com o placeholder atual. Não usar essa flag como prova de conclusão.

Futuro: entrada lazy, elegibilidade por shell, capacidades, parâmetros e política de acesso, preservando os IDs existentes.

## Instâncias

Estado atual: `{ instances, activeInstanceId, focusHistory }`. Instância: `{ id, appId, minimized, executionState }`. ID da instância usa crypto.randomUUID; não equivale ao appId ou a ID de recurso externo.

| Operação    | Entrada           | Resultado atual                                    |
| ----------- | ----------------- | -------------------------------------------------- |
| openApp     | state, appId      | Novo estado; restaura existente se instância única |
| activateApp | state, instanceId | Ativa instância visível e atualiza histórico       |
| minimizeApp | state, instanceId | Oculta e seleciona foco disponível                 |
| restoreApp  | state, instanceId | Visível, running e ativa                           |
| closeApp    | state, instanceId | Remove e ajusta foco                               |

Entradas inexistentes geralmente devolvem estado sem alteração. A API não recebe origem/parâmetros ou retorna erro tipado. openApp não verifica public; menu oculta Administração, mas o Core ainda não nega abertura. Hoje não há operações administrativas reais. Corrigir antes de conectar dados protegidos.

## Sessão

useSystem exige SystemProvider acima. Superfície: appState, notificationState, visibleToasts, run, minimizeAllApps, handleNotificationAction, dismissToast e handleNotificationOpen.

run(operation,id) aplica a função de estado. Para openApp também produz o aviso de abertura existente, inclusive ao restaurar app único. Não oferece transação, autorização ou isolamento de erro. minimizeAllApps preserva a redução de minimização usada antes pelo Desktop; não é desligamento/reinício completo.

## Painéis

resolvePanel(value,current,panel) recebe booleano ou função. Abrir substitui o ativo; fechar painel diferente preserva o atual. Por isso, uma rotina que tenta fechar tudo por setters individuais pode omitir calendário. O clique externo já corrigido foi preservado; outras rotinas continuam pendentes.

PanelLayer recebe referência/filhos e não administra autenticação ou navegação.

## Janelas

Window recebe instância, app, ativo, zIndex, offset e callbacks de ativar/minimizar/fechar. Geometria local; minimizar conserva modo/tamanho na sessão; fechar e reabrir cria outra instância; reload não restaura janelas.

useWindowInteraction retorna refs, modo, nome e handlers existentes. windowGeometry preserva mínimos 300×220 quando cabem, margem 8 e distância de snap 24 px. São parâmetros herdados, não requisitos imutáveis.

AppHost recebe nome/instância e mostra placeholder. Futuro: resolver app, validar parâmetros, carregar sob demanda e isolar falha.

## Notificações

Campos: id/title/message/source/type/createdAt/read/action. Tipos info/success/warning/error; ação atual open-app com appId. Histórico até 100, até 3 toasts, duração-base 5 s com pausas existentes por interação/foco. Sem persistência após reload.

Abertura por notificação verifica app público e procura instância existente. UI permite ler/ler todas/remover/limpar. Operações protegidas futuras sempre precisarão de autorização própria.

## Persistência

| Chave                 | Conteúdo                      |
| --------------------- | ----------------------------- |
| ws-os:theme           | dark/light                    |
| ws-os:welcome-seen    | string true após apresentação |
| ws-os:desktop-widgets | Widget serializado            |
| ws-os:menu-favorites  | IDs favoritos; máximo atual 6 |

Widget ativo clock-default: visible, position `{column,row}`, size `{columns,rows}`. UI oferece 2×2, 3×2, 3×3. Validação de formato usa fallback. Falha de salvamento ainda pode ser silenciosa. Não apagar chaves ou converter formatos sem migração. IndexedDB de arquivos ainda não existe.

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

> **Referência vigente da revisão final:** [Etapa 15](finalizacao/ETAPA-15-ANDAMENTO.md), [plano](PLANO-FINALIZACAO-POR-ETAPAS.md) e checkpoints 03–14. Os trechos datados abaixo são históricos. Hoje há dois shells funcionais, 17 aplicativos registrados com carregamento sob demanda e autenticação administrativa; arquivos pessoais permanecem no IndexedDB, oficiais no Supabase Storage privado via Worker. Não interpretar descrições antigas de recursos reservados como estado atual, nem testes controlados como homologação externa.


> **Atualização de 20/10/2026 — Etapas 03/04 e revisão do armazenamento:** os contratos/backend, formatos HTTP, migrações e limites estão na [entrega consolidada](finalizacao/ETAPAS-03-04-ENTREGA.md) e no [mapa de rotas](backend/WORKER.md). O armazenamento de arquivos oficiais foi alterado de Cloudflare R2 para Supabase Storage privado, conforme revisão posterior da DEC-FIN-003, DEC-FIN-011 e DEC-FIN-017. Solicitações, arquivos oficiais, vínculos e moderação possuem implementação local em revisão; homologação real continua pendente. O texto da Etapa 01 abaixo é uma referência histórica, não uma descrição integral do backend atual. Preferências incluem cursor e Não perturbe no reset/sincronização.

# Contratos compartilhados — estado atual da Etapa 01

Atualizado em 19/10/2026. Fonte de decisões: [Etapa 01](finalizacao/ETAPA-01-DECISOES-TECNICAS.md). Evidências e limites: [conclusão técnica](finalizacao/ETAPA-01-PARTE-01.6-CONCLUSAO.md).


## Revisão vigente — Armazenamento de arquivos oficiais

A implementação da Etapa 03 substitui Cloudflare R2 por Supabase Storage, preservando os contratos compartilhados entre Core, aplicativos e serviços.

- **Provedor:** Supabase Storage, bucket privado `ws-os-official-files`.
- **Backend:** Cloudflare Worker, responsável por autenticação, autorização, validação, upload, download e exclusão.
- **Persistência:** PostgreSQL, com tabela `official_files`, revisões, estados, visibilidade, finalidade e integridade SHA-256.
- **Tipos aceitos:** PDF, TXT, PNG, JPEG e WebP, com limite de 10 MB por arquivo.
- **Arquivos pessoais:** permanecem exclusivamente no IndexedDB do visitante.
- **Arquivos estáticos:** continuam disponíveis sem migração automática para o Storage.
- **Controle de acesso:** visitantes não recebem credenciais, URLs administrativas ou acesso direto ao bucket.
- **Publicação:** somente recursos autorizados, disponíveis e efetivamente publicáveis podem ser entregues pela API.
- **Integridade:** operações incertas não são consideradas concluídas sem reconciliação entre PostgreSQL e Storage.

### Contratos HTTP preservados

| Rota | Responsabilidade |
|---|---|
| `GET /api/files` | Listar recursos públicos disponíveis |
| `GET /api/files?id=...` | Entregar arquivo autorizado |
| `GET /api/admin/files` | Listar recursos administrativos |
| `POST /api/admin/files` | Criar metadados |
| `GET /api/admin/files?id=...` | Consultar recurso |
| `GET /api/admin/files?id=...&download=1` | Download administrativo |
| `PUT /api/admin/files?id=...` | Enviar conteúdo binário |
| `PATCH /api/admin/files?id=...` | Alterar visibilidade |
| `DELETE /api/admin/files?id=...` | Excluir recurso com confirmação |

As mutações que exigem revisão continuam utilizando `If-Match`. A exclusão continua exigindo `X-Confirm-Delete: true`.

A mudança de provedor não autoriza alterações nos modelos públicos, nos identificadores de recursos nem nos contratos de navegação dos aplicativos.

**Estado:** testes locais informados como aprovados; integração real com Supabase Storage ainda não homologada. As seções históricas abaixo permanecem preservadas para rastreabilidade.


## Responsabilidades e compatibilidade

Core coordena instâncias e navegação; aplicativos mantêm seus fluxos; serviços validam e adaptam dados; Workers autorizam operações remotas; banco garante persistência e integridade. Os contratos desta etapa não equivalem à implementação de todos os domínios futuros. Não há backend R2 novo, migração aplicada ou armazenamento remoto de arquivos pessoais nesta entrega.

Os módulos de contrato exportam validadores e resultados estruturados. Consumidores devem verificar a propriedade ok ou o resultado específico do módulo, sem inferir sucesso de um status HTTP isolado. Falhas de validação não autorizam gravar valores corrigidos silenciosamente. Erros preservam códigos estáveis e mensagens seguras; dados brutos do servidor não são apresentados como mensagens confiáveis.

## Navegação, instâncias e proteção

- Fonte: src/core/appRegistry.js, appManager.js, navigationManager.js e appCloseGuards.js.
- Registry declara parâmetros, política de instâncias, contextos e capacidade necessária. Administração exige administration.access e sessão válida; isso não substitui autorização do servidor.
- requestAppOpen(state, appId, options?) retorna {state,result}. Sucesso: {ok:true,instanceId,status}, com status opened, restored ou navigated. Falha: {ok:false,error:{code,message}}, preservando o estado. openApp mantém o retorno legado de estado.
- Estado: {instances,activeInstanceId,focusHistory}; instância preserva id, appId, origin, params e contexto de retorno. IDs de recurso não são IDs de instância.
- Parâmetros são dados JSON validados e copiados profundamente. Campos contextuais declarados são atualizados em instância reutilizada; conteúdo executável, ciclos e descritores inválidos são rejeitados. Parâmetros legados simples de apps sem campos contextuais continuam aceitos.
- Origem e retorno são contexto, nunca credenciais. Retorno usa instância/origem pública segura ou Home; não recria formulários privados. Navegação pendente revalida sessão, parâmetros e existência após confirmação.
- Alterações não salvas usam guard por instância e confirmação central. Cancelar preserva rascunho; confirmar executa uma vez; desmontagem libera o guard. Desktop e Mobile usam o mesmo Core. Navegação interna não modifica a URL; compartilhamento continua restrito aos recursos públicos aprovados.
- Consumidores: shells, Busca, Wally, Currículo, Certificados, Projetos, Notas, Arquivos e visualizadores.

## Arquivos, documentos e anexos

Fontes: src/services/storage/fileResourceContract.js, managedFileContract.js, noteAttachmentContract.js, fileModel.js e localFilesStorage.js.

- Descritor identifica origem local, static ou managed, com identificador e metadados próprios. URL arbitrária não concede acesso a um recurso gerenciado. Manter os formatos exatos dos validadores ao construir descritores.
- Arquivos pessoais ficam no IndexedDB do navegador: limite existente de 10 MB por arquivo, 50 MB no total e 500 entradas; integridade, ciclos, nomes, quota, concorrência e revisão são tratados na camada de armazenamento.
- Recursos estáticos aprovados são somente leitura. Recursos managed possuem contrato de estado, revisão, visibilidade e integridade; seu provedor remoto permanece indisponível de forma explícita até a etapa de backend.
- Anexos: no máximo cinco por publicação, com limite de 10 MB por arquivo, IDs estáveis, validação de tipo/metadados e acesso coerente com o estado editorial. O contrato não realiza upload remoto.
- Visualizador recebe descritor ou entradas legadas compatíveis (fileId/url permitida). Encaminha arquivos locais ao leitor local, estáticos ao fluxo público e managed ao estado seguro de indisponibilidade. Editor permanece restrito a texto local compatível, com revisão e proteção de alterações. URLs temporárias pertencem ao consumidor e precisam ser liberadas.
- Erros de recurso inválido, inexistente, acesso negado, quota, conflito e leitura são distintos; falha não deve ser apresentada como salvamento bem-sucedido.

## APIs, revisões e idempotência

Fontes: apiContract.js, apiResponseAdapter.js, revisionContract.js, idempotencyContract.js e httpRequestContract.js em src/services.

- Envelope padrão: sucesso {ok:true,data,meta?}; erro {ok:false,error:{code,message},requestId?}. Validadores rejeitam formatos contraditórios e dados que se perderiam na serialização JSON. Adaptadores mantêm respostas legadas usadas pelos serviços atuais e verificam status e payload.
- Revisão é inteiro seguro não negativo; atualização exige revisão conhecida, conflito é explícito e próxima revisão não ultrapassa o limite seguro. Endpoints existentes que usam updatedAt continuam compatíveis: adoção de colunas numéricas será feita pelo proprietário do domínio com migração.
- Idempotência vincula chave, operação, escopo e fingerprint SHA-256 canônico do pedido. Registro concluído reutiliza o resultado; chave reaproveitada com outro pedido conflita; resultado incerto exige reconciliação. Ausência de registro exige reserva atômica no servidor, não autorização para repetir cegamente. O contrato não oferece armazenamento de registros nem transação de banco.
- executeJsonRequest limita o tempo da requisição e leitura do JSON, propaga cancelamento e retorna {response,payload}. Leitura pode ser repetida conforme política; escrita enviada cuja resposta não chegou é HTTP_RESULT_UNKNOWN, sem reenvio automático. O serviço consumidor deve conferir status e adaptar a resposta.
- Consumidores atuais: autenticação, conteúdo público, Notas e serviços de consulta. Aplicações futuras devem reutilizar os contratos, mantendo autorização real no Worker.

## Cache público e sincronização

Fontes: publicCacheContract.js, publicDataService.js e usePublicResource.js.

- Cache em memória, no máximo 32 entradas por contexto; chave inclui URL e query. TTL de 5 minutos (padrão/conteúdo/projetos/estatísticas) e 10 minutos (clima).
- Requisições simultâneas para o mesmo recurso são deduplicadas. Cancelar um consumidor não cancela os demais. Revalidação forçada ignora a entrada fresca.
- Em indisponibilidade de rede, último dado válido pode ser usado por menos de 24 horas, identificado como obsoleto e exigindo revalidação. Cancelamento do consumidor ou invalidação não entregam esse fallback.
- invalidatePublicData invalida o cache e impede entrega/repopulação por tarefas antigas. Consumidores inscritos atualizam seletivamente os recursos afetados.
- subscribePublicData usa BroadcastChannel, sinalização storage e revalidação por foco, com limpeza dos listeners e deduplicação limitada de sinais. Transporte entre abas aceita apenas sinais públicos conhecidos de /api/posts e /api/content; não transmite conteúdo, tokens, parâmetros privados ou localização. Outros recursos públicos têm a política temporal normal.
- Resultado legado preservado: {data,updatedAt,source,warning?}; cacheStatus e requiresRevalidation acrescentam informação. Notas, conteúdo administrativo, Busca, Arquivos e Calendário participam da invalidação pertinente.

## Modelos de domínio

Fontes: privateRequestContract.js e publicContentContract.js.

- Solicitação privada: valida identificação, contato, mensagem, tipo, estado, timestamps, revisão e chave de idempotência. Estados new, in_review, awaiting_response, responded, completed e archived; transições exigem revisão e preservam histórico mínimo sem duplicar dados pessoais.
- Retenção: 180 dias após término; arquivar um pedido concluído não prorroga a retenção. Reabertura é explícita. Existe cálculo/validação; não há rotina automática de exclusão implantada.
- Agendamento exige instante futuro e fuso, sem confirmar reunião ou publicar evento. Entrega EmailJS é independente de persistência; falha ou resultado desconhecido não vira confirmação.
- Evento público separa data, horário, fuso e dia inteiro, estado, revisão e timestamps. Adaptador legado de dia inteiro não inventa revisão. Projeção rejeita campos privados.
- Projeto valida destaque/ordem, tecnologias e links HTTPS para repositórios e aplicações externas.
- Publicação preserva ciclo editorial e anexos; projeção pública exclui rascunhos. Ranking aplica limites por jogo (Snake 222; Flappy 100000) e só projeta campos públicos, sem tokens ou hashes privados.
- Estes contratos são a base dos domínios das etapas proprietárias. Não constituem novas telas administrativas, schemas de banco ou integração remota homologada.

## Preferências

Fontes: preferenceContract.js e preferencesManager.js.

Versão lógica 1, inventário explícito das chaves existentes e adaptação dos formatos raw/json/boolean/json-or-raw. Leitura de formato inválido ou versão futura não regrava dados. Valores são estruturais; gerenciadores existentes conservam a normalização específica e as chaves legadas. Reset aceita somente ações/categorias da allowlist e tenta as operações existentes, relatando falhas parciais. Não apaga arquivos pessoais, conteúdo de apps, sessão, posições ou imagem persistida fora de seu escopo aprovado. Migrações físicas futuras pertencem às etapas 04/14.

## Permissões, sessão e catálogo de ações

Fontes: authorizationContract.js, actionContract.js, actionService.js e authService.js.

- Capacidades públicas, locais e administrativas são distintas. Escrita local requer contexto do navegador; papel administrativo não autoriza acessar arquivos pessoais remotamente. Operações remotas protegidas sempre exigem autorização do servidor.
- Sessão mantém token somente em memória, valida expiração, isola falha de assinantes e invalida respostas de versões antigas. Logout/expiração cancelam escopos administrativos pendentes. createAdminRequestScope oferece signal/isCurrent/dispose e é usado pelo editor de conteúdo; o rascunho permanece no consumidor quando a sessão termina.
- Catálogo declara id, descrição, esquema de parâmetros, capacidade, contextos, confirmação e nome de executor confiável. Ações: app.open, content.search, appearance.set-theme, personal-files.create-folder, personal-files.rename, personal-files.trash, preferences.reset e administration.open.
- executeRegisteredAction rejeita parâmetros extras/código, copia argumentos aprovados e revalida autorização após confirmação. Executor vem de mapa local, nunca do pedido/IA. Sem adaptador disponível, retorna ACTION_UNAVAILABLE.
- Busca e Wally usam o catálogo para abrir apps públicos. Adaptador legado do Wally aceita somente sugestão explícita open-app. Isso não habilita ferramentas privilegiadas ou novas interfaces de automação; integrações completas pertencem às etapas 11/12.

## Validação e evolução

Testes de contrato usam tests/helpers/contract-loader.cjs para resolver as dependências reais dos módulos puros; harnesses de Core/UI fornecem somente as dependências de ambiente necessárias. Testes de API simulam transporte para verificar regras negativas e não homologam provedores. A conclusão 01.6 registra os testes manuais, resultados e dependências externas.

Mudanças incompatíveis exigem versão/adaptador, identificação dos consumidores e teste de regressão. Traduções serão feitas na fase final; os dois JSON de idioma permanecem intactos. Não iniciar a Etapa 02 a partir desta documentação.

---

## Histórico anterior à consolidação da Etapa 01

O conteúdo abaixo é preservado para rastreabilidade. Descreve momentos anteriores do projeto; afirmações como ausência de autenticação, IndexedDB ou atualização contextual não representam o contrato atual. Em divergência, prevalecem as seções atuais acima e os validadores executáveis.

### Contratos atuais e evolução necessária

Referência: DEC-411–449. O que está marcado como futuro não é implementação existente.

#### Registry

getRegisteredApps retorna cópia do array com os mesmos objetos; getAppDefinition(appId) retorna definição ou null. Campos atuais: id, name, icon, category, menuCategory, desktopShortcut, implemented, loadComponent (quando implementado), allowMultipleInstances, pauseWhenMinimized, public e showInMenu.

Há 12 Desktop e 6 Sistema. category é classificação arquitetural; menuCategory não deve virar categoria visual do menu. Em 15/10/2026, 17 componentes possuem implemented:true e entrada lazy explícita. Administração permanece implemented:false e public:false. O escopo e as pendências de cada app estão na entrega consolidada. Essa flag indica que existe um componente funcional conectado, não que o aplicativo está 100% concluído.

A entrada lazy é explícita no Registry: loadComponent retorna a promessa do módulo com export default. Cada app implementado possui sua entrada. AppHost não descobre componentes a partir de arquivos vazios. Futuro: elegibilidade por shell, capacidades e regras específicas de acesso e parâmetros, preservando os IDs existentes.

#### Instâncias

Estado atual: `{ instances, activeInstanceId, focusHistory }`. Instância: `{ id, appId, minimized, executionState, origin, params }`. ID da instância usa crypto.randomUUID; não equivale ao appId ou a ID de recurso externo.

| Operação    | Entrada                | Resultado atual                                                          |
| ----------- | ---------------------- | ------------------------------------------------------------------------ |
| openApp     | state, appId, options? | Abre ou restaura uma instância pública; aceita origin e params opcionais |
| activateApp | state, instanceId      | Ativa instância visível e atualiza histórico                             |
| minimizeApp | state, instanceId      | Oculta e seleciona foco disponível                                       |
| restoreApp  | state, instanceId      | Visível, running e ativa                                                 |
| closeApp    | state, instanceId      | Remove e ajusta foco                                                     |

Entradas inexistentes devolvem estado sem alteração. openApp aceita um terceiro argumento opcional, options, com origin (string) e params (objeto). A origem padrão é system; options e params, quando fornecidos, precisam ser objetos simples (incluindo protótipo nulo). origin, quando fornecida, precisa ser string não vazia. Entradas inválidas são rejeitadas sem alterar a sessão; não são mais silenciosamente convertidas em parâmetros vazios. Os parâmetros são copiados superficialmente e permanecem na instância durante a sessão.

Aplicativos de instância única restauram a instância existente sem atualizar seus parâmetros. O Core bloqueia aplicativos não públicos, incluindo Administração. openApp mantém o retorno de estado para compatibilidade. requestAppOpen fornece o resultado explícito descrito abaixo. A validação dos campos de domínio permanece específica de cada aplicativo futuro. origin e params não representam autorização. Hoje não há operações administrativas reais. Corrigir antes de conectar dados protegidos.

##### Solicitação com resultado

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

#### Sessão

useSystem exige SystemProvider acima. Superfície: appState, notificationState, visibleToasts, run, minimizeAllApps, handleNotificationAction, dismissToast e handleNotificationOpen.

run(operation,id,options?) aplica a função de estado. Para openApp primeiro valida a solicitação: falhas geram aviso de erro sem criar instância ou aviso falso de sucesso. Abertura válida produz o aviso existente, inclusive ao restaurar app único. Não oferece transação, autorização ou isolamento de erro. minimizeAllApps preserva a redução de minimização usada antes pelo Desktop; não é desligamento/reinício completo.

#### Painéis

resolvePanel(value,current,panel) recebe booleano ou função. Abrir substitui o ativo; fechar painel diferente preserva o atual. Taskbar usa o painel ativo para garantir exclusividade, incluindo calendário. Clique externo, Escape, abertura de outro painel/prévia e mudança de foco dos apps fecham os elementos transitórios. A revisão complementar da R1 adicionou prévias por teclado e limpeza dos timers.

PanelLayer recebe referência/filhos e não administra autenticação ou navegação.

#### Janelas

Window recebe instância, app, ativo, zIndex, offset e callbacks de ativar/minimizar/fechar. Geometria local; minimizar conserva modo/tamanho na sessão; fechar e reabrir cria outra instância; reload não restaura janelas.

useWindowInteraction retorna refs, modo, nome e handlers existentes. windowGeometry preserva mínimos 300×220 quando cabem, margem 8 e distância de snap 24 px. São parâmetros herdados, não requisitos imutáveis.

AppHost recebe nome e instância, consulta o Registry e apresenta placeholder para aplicativos não implementados. Aplicativos habilitados são carregados sob demanda pela entrada loadComponent do Registry, usando React.lazy e Suspense, com AppErrorBoundary por instância. AppHost também recusa definições inexistentes ou não públicas.

Sobre o Sistema é o primeiro componente integrado. Tentar novamente cria um novo lazy somente na ação explícita de recuperação, reinicia o boundary daquela instância e atualiza a entrada usada em novas aberturas. Renderizações normais mantêm a identidade do componente e seu estado. Recuperação reinicia o estado local do app que falhou; as outras instâncias permanecem independentes.

O boundary cobre erros de renderização e rejeição do carregamento lazy. Erros de handlers, timers e operações assíncronas internas devem ser tratados pelo app/serviço. A tentativa não garante recuperação de falhas persistentes de rede nem limpa o cache de módulos do navegador.

Lifecycle atual: minimizar mantém AppHost montado e transmite instance.executionState; apps que admitem pausa precisam consumir esse campo para suspender trabalho e retomá-lo. Não há suspensão mágica de qualquer efeito React. Fechar remove a instância e desmonta o conteúdo, executando os cleanups dos efeitos. Cada app deve cancelar seus próprios recursos. Reabrir cria novo estado local; reload não restaura janelas. Editor e Contato agora registram guards de alterações pendentes. run(closeApp, instanceId) retorna false enquanto a confirmação está pendente; cancelar mantém a instância, confirmar aplica o fechamento. O diálogo central contém foco e fundo inert. Reload usa beforeunload; a aplicação não persiste o rascunho após reload.

#### Notificações

Campos: id/title/message/source/type/createdAt/read/action. Tipos info/success/warning/error; ação atual open-app com appId. Histórico até 100, até 3 toasts, duração-base 5 s com pausas existentes por interação/foco. Sem persistência após reload.

Abertura por notificação verifica app público e procura instância existente. UI permite ler/ler todas/remover/limpar. Operações protegidas futuras sempre precisarão de autorização própria.

#### Persistência

| Chave                            | Conteúdo                      |
| -------------------------------- | ----------------------------- |
| ws-os:theme                      | dark/light                    |
| ws-os:welcome-seen               | string true após apresentação |
| ws-os:desktop-widgets            | Widget serializado            |
| ws-os:desktop-shortcut-order     | default/name                  |
| ws-os:desktop-shortcut-positions | Mapa appId → {column,row}     |
| ws-os:menu-favorites             | IDs favoritos; máximo atual 6 |

Widget ativo clock-default: visible, position `{column,row}`, size `{columns,rows}`. UI oferece 2×2, 3×2, 3×3. Validação de formato usa fallback. Falhas de leitura/salvamento são avisadas; preferências inválidas não são sobrescritas automaticamente na inicialização. Não apagar chaves ou converter formatos sem migração. IndexedDB de arquivos ainda não existe.

#### Clima

fetchCurrentWeather(latitude,longitude) consulta Open-Meteo, verifica resposta HTTP/temperatura e retorna data.current ou erro. useWeather mantém loading/error/data e pede localização somente por ação. Timeout de geolocalização 10 s; HTTP ainda sem timeout.

Futuro: previsão, validação completa, cancelamento, resultados obsoletos, cache e atualização visível. Sem segredos no cliente.

#### Contratos futuros

1. Abertura com origem/parâmetros/resultado e histórico Mobile sem alterar URL comum.
2. Lifecycle com pausa seletiva, cancelamento e fechamento de alterações pendentes.
3. Modelos de projetos, publicações, arquivos, documentos, eventos, solicitações e pontuações.
4. Fronteira local/oficial e capacidades de edição.
5. Auth e matriz recurso/operação/papel com autorização backend.
6. Serviços com falhas categorizadas, limites, cache/frescor e cancelamento.
7. Ferramentas Wally permitidas com validação, permissão e confirmação quando sensível.
8. Testes negativos, limpeza, compatibilidade de shells e recuperação.

#### Registro da primeira passagem da R2 — 14/10/2026 (histórico)

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

#### Revisão complementar da R2 — 14/10/2026

A primeira passagem acima descreve o estado anterior. Nesta revisão foram acrescentados resultado tipado no Core, validação estrutural de entrada, feedback de rejeição, entrada lazy explícita no Registry e recuperação de carregamento/renderização por app. Os contratos atuais estão nas seções anteriores.

Permanecem para as etapas dos aplicativos: schemas de domínio, autenticação/autorização backend, confirmação de descarte de documentos, cancelamento de serviços específicos e API de confirmação de abertura na sessão React quando houver consumidor real. Não foram implementados apps novos ou habilitada Administração.

#### R3 — organização do Desktop, widgets e armazenamento

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

#### R4 — idioma, efeitos e acessibilidade da interface

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

#### Configurações — 15/10/2026

Contratos de wallpapers, preferências compartilhadas, widgets, restauração e preferências particulares de apps: consulte docs/settings.md. A restauração usa allowlist e preserva arquivos, imagem pessoal e organização. Desktop/Mobile têm seleções próprias; preferências de acessibilidade prevalecem sobre os efeitos.

#### Etapa 01.3 — contrato vigente de APIs e cache

As descrições antigas deste documento que dizem que cache ou APIs não têm contratos foram superadas. Envelopes, adaptação legada, revisão, idempotência e cancelamento estão em src/services/*Contract.js e apiResponseAdapter.js. requestPublicJson mantém data/source/updatedAt, acrescenta cacheStatus e requiresRevalidation; subscribePublicData recebe sinais públicos e retorna unsubscribe. invalidatePublicData cancela dados em trânsito antigos e sinaliza reconsulta. Detalhes, consumidores e limites: [conclusão 01.3](finalizacao/ETAPA-01-PARTE-01.3-CONCLUSAO.md). Nenhum desses contratos implementa por si só uma escrita idempotente no banco.

#### Etapa 01.4 — modelos vigentes

Contratos puros: privateRequestContract (estados privados/revisão/retenção e resultado de envio), publicContentContract (eventos, projetos, publicações/anexos e ranking), preferenceContract (versão lógica e formato legado). restoreSystemPreferences aceita categorias opcionais validadas; sem argumentos mantém o reset existente. Ver [conclusão 01.4](finalizacao/ETAPA-01-PARTE-01.4-CONCLUSAO.md). Rotinas de banco/R2 e interfaces completas continuam nas etapas proprietárias.

#### Etapa 01.5 — sessão e ações

Catálogo e capacidades em core/actionContract e authorizationContract; adaptadores confiáveis em services/actionService. Busca e Wally consomem o catálogo para navegação. createAdminRequestScope cancela operações na mudança de versão da sessão e requer dispose; o token permanece em memória. Nenhuma pré-checagem local confere autorização ao Worker. Ver [conclusão 01.5](finalizacao/ETAPA-01-PARTE-01.5-CONCLUSAO.md).

## Projetos em destaque — escopo vigente em 25/10/2026

O catálogo possui 17 aplicativos. Projetos consulta o GitHub e aplica somente a seleção de
identificadores persistida pela Administração. As APIs de destaques retornam e gravam
apenas repositoryIds; colunas históricas não são lidas ou sobrescritas. Consultar
[remoção e permissões](REMOCAO-DEMONSTRACOES.md) para o inventário, validações e migração 014.

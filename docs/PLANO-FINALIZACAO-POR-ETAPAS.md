# WS OS V2 — plano de conclusão por partes encerráveis

Referência de execução: **Execução em 20/10/2026:** implementação local consolidada, testes automatizados aprovados e homologação real dos arquivos oficiais concluída com Supabase Storage. Rankings públicos e D1 local validados. Permanecem pendências de homologação externa, segurança operacional e produção. Consultar [Entregas, migrações, testes e homologação](finalizacao/ETAPAS-03-04-ENTREGA.md).


## 1. Objetivo e regra de execução

Finalizar uma parte com funcionalidade, aparência, responsividade, idiomas, segurança, testes e organização dos seus arquivos no mesmo ciclo. Evitar etapas globais tardias de redesign, tradução ou refatoração que obriguem a reabrir todos os aplicativos.

Este documento é planejamento, não uma declaração de implementação ou nova autorização para produção. Não modifica o escopo aprovado, não escolhe novos provedores sem necessidade e não transforma sugestões opcionais em requisitos obrigatórios.

Não é possível garantir ausência absoluta de retornos: integrações podem revelar regressões. A meta é evitar retornos previsíveis por dependências incompletas. Ao final, a integração geral deve corrigir defeitos, não terminar funcionalidades deixadas para trás.

### O que significa uma parte encerrada

1. Todos os requisitos aplicáveis do mestre estão relacionados à entrega.
2. Nenhum botão provisório, fluxo sem saída ou funcionalidade aprovada esquecida.
3. Estados normal, vazio, carregando, erro, indisponível e não autorizado tratados, conforme aplicável.
4. Desktop e Mobile, Dark e Light, PT-BR e EN revisados na própria etapa.
5. Dados e permissões validados na camada apropriada; sessão expirada, conflitos e falhas de armazenamento tratados quando aplicável.
6. Arquivos organizados, imports corretos, CSS no local apropriado e código obsoleto analisado.
7. Testes pertinentes e verificações manuais executados com evidências. Lint, build e suite completa passam antes de concluir o bloco.
8. Documentação de contratos/pendências atualizada e commit local descritivo em português, sem escopo.

### Estados permitidos no acompanhamento

- **A fazer:** nenhum aceite concluído.
- **Em execução:** existem alterações ainda em validação.
- **Implementado, bloqueado externamente:** código pronto, mas falta configuração, serviço ou homologação. Não chamar de 100%.
- **Concluído:** implementação e critérios de aceite comprovados.
- **Condicionado:** requisito depende de decisão, licença ou autorização documentada. Não ocultar como concluído nem implementar uma alternativa inventada.

## 2. Como evitar reorganização repetida

- Trabalhar no checkout existente e verificar alterações locais antes de cada etapa. Não descartar arquivos nem reintroduzir decisões removidas.
- Manter a estrutura atual `core`, `shells`, `features`, `apps`, `services`, `shared`, `styles`.
- Organizar cada pasta na etapa em que ela é dona da funcionalidade, uma única vez. Não abrir um projeto separado de refatoração depois de finalizar os aplicativos.
- Criar arquivo/componente novo somente por responsabilidade concreta, reutilização real ou teste independente útil. Não impor um arquivo por função nem CSS individual vazio a todos os apps.
- CSS global define tokens e primitivas; CSS da pasta do aplicativo define sua composição. Aplicativos não devem depender de seletores privados de outro app.
- Compartilhar o gerenciamento editorial já existente em vez de criar outro CRUD de Notas na Administração.
- Definir modelos de preferências antes de fechar widgets/shells; a interface de Configurações vem depois dos consumidores.
- Fechar Visualizador/Editor antes de Currículo, Certificados e anexos de Notas.
- Acrescentar migrações novas; não reescrever silenciosamente migrações já aplicadas.
- Arquivos legitimamente incrementais: catálogos de tradução, testes, documentação de andamento e registro de rotas. Alteração aditiva nesses arquivos não significa reabrir sua arquitetura.
- Mudança de contrato compartilhado após seu aceite exige registrar consumidores afetados e executar a regressão deles. Não ajustar contrato implicitamente dentro de um app.

### Checklist de organização usado dentro de cada etapa

- [ ] Listar os arquivos realmente alterados e seus consumidores.
- [ ] Manter responsabilidades claras sem fragmentação excessiva.
- [ ] Remover imports/código/comentários obsoletos apenas após comprovar que não têm consumidor.
- [ ] Corrigir arquivos reservados quando houver necessidade concreta; caso contrário, registrar sua situação sem criar implementação artificial.
- [ ] Conferir CSS, nomes, imports, formatação e traduções antes do commit.
- [ ] Não misturar arquivos temporários, configurações locais, segredos e assets sem uso.
- [ ] Registrar teste executado, resultado e limite da evidência.

## 3. Ordem obrigatória por dependências

| Etapa | Parte a encerrar | Dependências principais |
|---|---|---|
| 00 | Escopo, decisões e conteúdo necessários | Estado atual e mestre |
| 01 | Contratos compartilhados e modelos | 00 |
| 02 | Design System e componentes compartilhados | 00–01 |
| 03 | Backend, segurança e serviços de dados | 01 |
| 04 | Core, janelas e mecanismos de preferências | 01–02 |
| 05 | Arquivos + Visualizador + Editor | 02–04 |
| 06 | Aplicativos profissionais + Demos | 02–05 |
| 07 | Contato e solicitações | 02–04; backend de solicitações pronto |
| 08 | Notas e gerenciamento editorial | 02–05; anexos definidos em 01/03 |
| 09 | Calculadora | 02 e 04 |
| 10 | Jogos e rankings | 02–04 |
| 11 | Terminal, Wally e Administração | 03–10, reutilizando módulos existentes |
| 12 | Desktop, Taskbar, busca, painéis e widgets | 02–11 |
| 13 | Shell Mobile e tablets | Apps finalizados e contratos de navegação estáveis |
| 14 | Configurações, boot, boas-vindas e Sobre o Sistema | Consumidores de preferências e conteúdo finalizados |
| 15 | Integração final e preparação de publicação | Todos os aceites anteriores |

A ordem é de fechamento. Usar o Desktop e o Mobile existentes durante os testes de cada app, sem esperar as etapas 12/13. Se um defeito compartilhado impedir o aceite de um app, corrigir a base antes de continuar; não acumular uma lista de apps falsamente concluídos.

## Etapa 00 — Fechar decisões, escopo e insumos

**Arquivos:** `docs/planning/WS-OS-V2-MESTRE-v0.16.0.md` como referência; `docs/PENDENCIAS-FINALIZACAO.md`; `docs/contracts.md`; `src/content/portfolioContent.js`; assets públicos fornecidos.

**Trabalho:**

- [ ] Relacionar cada decisão aplicável do mestre à etapa responsável; registrar dúvidas e conflitos com decisões posteriores.
- [ ] Confirmar necessidades ainda condicionadas: upload oficial, anexos, ferramentas do Wally, ações da busca, indicação de eventos no widget e DOOM/licença.
- [ ] Definir o fluxo de solicitações: recebimento, estados administrativos, retenção, exclusão e confirmação técnica. Não confirmar reuniões nem publicar pedidos privados automaticamente.
- [ ] Separar requisitos obrigatórios, condicionados e melhorias opcionais. Não usar “opcional” para dispensar recurso aprovado.
- [ ] Separar o conteúdo profissional que o autor precisa fornecer: destaques, descrições, demos e revisão dos documentos existentes.
- [ ] Escolher um ambiente de homologação autorizado e preparar acesso/configuração antes das etapas remotas.

**Aceite:** não restam decisões de produto essenciais sendo empurradas para dentro da implementação de outro bloco. Dependência externa sem solução fica identificada com responsável/condição, não com uma data fictícia.

**Commit sugerido:** `docs: consolida escopo e criterios de finalizacao`

## Etapa 01 — Estabilizar contratos e modelos compartilhados

**Arquivos principais:** `docs/contracts.md`; `src/core/appRegistry.js`, `appManager.js`, `navigationManager.js`, `appCloseGuards.js`; modelos de dados e serviços existentes; `worker/index.js` para mapa de rotas. Esta etapa define contratos; a implementação dos mecanismos fica nas etapas 03/04.

**Trabalho:**

- [ ] Documentar abertura de app, instância, origem, parâmetros, foco, retorno e reabertura contextual.
- [ ] Definir `fileId` local, documento oficial, anexos e demos sem misturar permissões.
- [ ] Definir respostas de API, IDs, limites, revisão de concorrência, cancelamento, idempotência e códigos de erro.
- [ ] Especificar atualização de dados públicos entre instâncias/abas, invalidação de cache e sinalização de dados antigos.
- [ ] Definir modelos de eventos, solicitações, anexos, catálogo oficial e rankings; minimizar dados pessoais.
- [ ] Definir comandos/ações permitidos da busca e Wally, com confirmação e autorização quando aplicável.
- [ ] Fechar esquema e defaults das preferências Desktop/Mobile, widgets e Taskbar; migração de valores antigos e reset.
- [ ] Definir política de sessão, expiração, logout e preservação de rascunhos.

**Aceite:** consumidores e limites de cada contrato listados, sem precisar inventar formatos nas etapas de UI. Testes de contrato previstos e exemplos de abertura/resposta registrados.

**Congelar:** nomes públicos dos contratos, formatos e responsabilidades. Alterações posteriores devem ser compatíveis ou explicitamente migradas.

**Commit sugerido:** `docs: estabiliza contratos entre aplicativos e servicos`

## Etapa 02 — Encerrar Design System e primitivas compartilhadas

**Arquivos:** `src/styles/global.css`, `system.css`, `apps.css`, `themes/*`; componentes realmente compartilhados em `src/shared/components/`; `tests/core/accessibility.test.cjs` e cobertura pertinente.

**Trabalho:**

- [ ] Consolidar os tokens aprovados de tema, destaque, superfícies, vidro/blur, texto, borda e elevação.
- [ ] Fechar tipografia, escala de espaçamento, tamanhos de controle, scrollbars e estados interativos.
- [ ] Padronizar botões, campos, seletores, mensagens, cards, diálogos e tooltips sem criar uma biblioteca desnecessária.
- [ ] Garantir foco visível, controles por teclado, contraste representativo e movimento reduzido.
- [ ] Definir padrões responsivos que os apps usarão: toolbar, lista/grid, formulário, master/detail e área de leitura.
- [ ] Revisar Dark/Light e intensidade de efeitos antes de aplicar o acabamento por app.
- [ ] Separar CSS global de composição específica, documentando as regras para não acumular estilos de apps em `apps.css`.

**Aceite:** conferir os padrões em uma seleção real de telas: formulário, cards, editor, diálogo e painel. Não criar um aplicativo novo só para demonstrar componentes.

**Congelar:** tokens, padrões e API dos componentes compartilhados. Ajustes visuais posteriores devem ser locais ao app sempre que possível.

**Commit sugerido:** `style: finaliza fundamentos visuais e controles compartilhados`

## Etapa 03 — Encerrar backend, políticas e serviços

**Execução em 20/10/2026:** implementação local preparada; bloqueada externamente para aceite integral. [Entregas, migrações, testes e homologação](finalizacao/ETAPAS-03-04-ENTREGA.md).

**Arquivos:** `functions/api/*`; `functions/_lib/*`; `worker/index.js`; `database/migrations/*`; `database/d1/migrations/*`; `src/services/*` correspondentes; `src/shared/hooks/usePublicResource.js`; `docs/backend/WORKER.md`, `CONFIGURACAO.md`; testes de APIs/serviços.

**Trabalho, em subblocos validados:**

1. Autenticação e autorização: todas as operações privilegiadas, expiração, logout, ausência de configuração e limitação de login.
2. Conteúdo: publicações, curtidas, eventos, catálogo oficial, concorrência e invalidação de cache entre consumidores.
3. Solicitações privadas: armazenamento/API, estados, antiabuso, idempotência, retenção e RLS. Atualmente não há caixa de solicitações persistida.
4. Anexos: implementar o armazenamento/acesso escolhido na etapa 00; formato/tamanho, validação, ciclo de exclusão e integração documental.
5. Rankings: rever validação por jogo, proteção, persistência do melhor resultado, exposição pública mínima e moderação/remoção operacional.
6. Integrações: GitHub, WakaTime, clima, EmailJS e Gemini; cancelar/timeouts, limites, cache, fonte/atualização e falhas recuperáveis.

- [ ] Revisar 001–006 e preparar novas migrações incrementais necessárias, sem aplicar produção.
- [ ] Revisar D1 e limpeza de registros expirados dos limitadores.
- [ ] Garantir que service role e demais segredos nunca sejam enviados ao frontend.
- [ ] Homologar RLS como anon, usuário comum e administrador, inclusive acesso direto às tabelas e funções.
- [ ] Testar o entrypoint Worker real, não apenas a SPA ou funções isoladas em Node.
- [ ] Atualizar documentação de configuração e exemplos sem valores secretos.

**Aceite:** caminhos de sucesso e falha comprovados em ambiente autorizado. Quando depender de um serviço inacessível, marcar “implementado, bloqueado externamente”; não considerar o backend integralmente concluído.

**Congelar:** modelos, APIs e política de erro/cache que os apps consumirão. Não exigir redesenho de formulários por mudança tardia no schema.

**Commits sugeridos por subbloco:** `fix: consolida autorizacao e contratos das apis`; `feat: implementa solicitacoes privadas e anexos`; `test: homologa servicos e politicas de acesso`. Usar somente os correspondentes ao trabalho efetivamente realizado.

## Etapa 04 — Encerrar Core, janelas e mecanismos de preferências

**Execução em 20/10/2026:** correções e validação local concluídas para revisão; aceite físico/visual e limitações descritos na [entrega](finalizacao/ETAPAS-03-04-ENTREGA.md).

**Arquivos:** `src/core/*`; `src/features/windows/*`; `src/shared/hooks/useAppBack.js`, `useUnsavedChanges.js`; `src/shared/components/AppCloseDialog*`, `AppErrorBoundary.jsx`; armazenamento de preferências/wallpapers; testes de contratos, janelas, Desktop e configurações.

**Trabalho:**

- [ ] Validar criação/reuso de instâncias, aberturas contextuais, restrições, foco e retorno à origem.
- [ ] Finalizar minimizar/maximizar/restaurar, drag, resize, snap, limites e mudanças de viewport.
- [ ] Testar várias janelas, tamanhos extremos, escalas e monitores; travamento crítico bloqueia a etapa.
- [ ] Fechar o fluxo de confirmar/cancelar fechamento e a continuidade da navegação após a confirmação.
- [ ] Garantir preservação de rascunhos em mudanças de sessão e falhas do app.
- [ ] Consolidar persistência/reset/sincronização das preferências, defaults e valores antigos.
- [ ] Validar IndexedDB de wallpapers/preferências, recursos temporários e armazenamento indisponível.
- [ ] Definir dimensões iniciais e mínimas por tipo de tarefa, sem exigir que apps alterem o gerenciador.

**Aceite:** fluxos exercitados no Desktop/Mobile existentes, com medição/evidência de interação e nenhuma falha crítica conhecida. Não adiar o teste de desempenho para depois dos aplicativos.

**Congelar:** Core, geometria, contrato de fechamento e mecanismos das preferências. A interface de Configurações será fechada na etapa 14.

**Commit sugerido:** `fix: estabiliza core janelas e persistencia de preferencias`

## Etapa 05 — Encerrar Arquivos, Visualizador e Editor juntos

**Execução em 21/10/2026:** fechamento técnico local concluído, 411 testes aprovados. Proprietário autorizou avançar à Etapa 06, mantendo revisão visual/física, traduções finais e homologação remota registradas para seus ciclos próprios. [Checkpoint e retomada exata](finalizacao/ETAPA-05-ANDAMENTO.md).

**Arquivos:** `src/apps/files/*`, `file-viewer/*`, `file-editor/*`; `src/services/storage/fileModel.js`, `localFilesStorage.js`; `src/shared/hooks/useLocalFiles.js`; serviço de catálogo; `tests/core/files*.test.cjs`; `docs/ARQUIVOS-A5-FINALIZACAO.md`.

**Trabalho:**

- [ ] Concluir acabamento de navegação, grid/lista, pesquisa, seleção, lotes, contexto, detalhes e localização persistida.
- [ ] Validar toque real e teclado, nomes duplicados/longos, ciclos, pasta removida e restauração com conflito.
- [ ] Exercitar quota, importação inválida, falha de leitura, gravações concorrentes e recuperação sem perda silenciosa.
- [ ] Validar isolamento pessoal/local e catálogo oficial somente leitura; nenhuma operação administrativa sobre dados privados de visitantes.
- [ ] Fechar visualização de textos/imagens/PDFs, propriedades, download, zoom/ajuste e fallback Mobile.
- [ ] Fechar editor: ferramentas, busca/substituição, sintaxe, zoom/quebra, salvar/cópia, alterações externas e proteção de rascunhos.
- [ ] Conferir liberação de URLs/recursos e atualizações entre janelas/abas.
- [ ] Organizar os três apps e a camada de dados nesta etapa, sem uma reorganização posterior exclusiva.

**Aceite:** matriz completa de operações reais entre duas janelas e duas abas; Desktop/Mobile, Dark/Light e PT/EN. Os testes já existentes são base, não motivo para reimplementar o que funciona.

**Congelar:** contratos dos consumidores Currículo, Certificados e anexos; UI e organização interna dos três apps.

**Commit sugerido:** `feat: finaliza experiencia e integridade dos arquivos`

## Etapa 06 — Encerrar aplicativos profissionais e Demos

**Execução em 21/10/2026:** implementação técnica local concluída e validada, 417 testes aprovados. Compartilhamento e integrações finalizados; conteúdo editorial/demos ainda não fornecidos, traduções finais e homologações reais permanecem explicitamente condicionados. [Entrega, limites e retomada na Etapa 07](finalizacao/ETAPA-06-ANDAMENTO.md).

**Arquivos:** `src/apps/about-me/*`, `projects/*`, `dev-insights/*`, `resume/*`, `certificates/*`, `demo-viewer/*`; conteúdo/assets fornecidos; serviços GitHub/WakaTime apenas para defeitos de contrato identificados.

**Trabalho por app, encerrando um antes de passar ao próximo:**

- **Sobre Mim:** conteúdo aprovado, hierarquia, links, trajetória/habilidades e composição responsiva.
- **Projetos:** seleção de destaques, filtros/ordenação, detalhes, múltiplas janelas, GitHub, dados locais/cache identificados e links de entrada.
- **Demos:** catálogo aprovado, resolução do projeto/demo, origens permitidas, sandbox, falhas e abertura externa apropriada.
- **Dev Insights:** períodos, indicadores/gráficos aprovados, origem dos dados, atualização e indisponibilidade sem métricas inventadas.
- **Currículo:** documento existente, abertura via Visualizador, download e alternativa quando PDF não puder ser embutido.
- **Certificados:** categorias/busca, metadados reais, documentos e abertura integrada.
- [x] Incluir cópia/compartilhamento conforme contrato aprovado, validando entradas inexistentes e BASE_URL.
- [ ] Completar estilo específico, textos, estados, acessibilidade e arquivos do app antes de encerrá-lo.

**Aceite:** cada app funciona com dados reais autorizados e falhas simuladas, com revisão visual nos dois shells/temas/idiomas. Conteúdo ausente do autor é pendência explícita, não placeholder considerado pronto.

**Congelar:** pastas de cada app e formato público do conteúdo. Metadados incrementais podem ser atualizados depois sem reabrir a arquitetura.

**Commits:** um por app ou conjunto pequeno inseparável, por exemplo `feat: finaliza projetos e demonstracoes`.

## Etapa 07 — Encerrar Contato e solicitações

**Execução em 21/10/2026:** implementação local concluída e validada, 422 testes aprovados. Persistência privada, Turnstile, idempotência e guard do formulário integrados; entrega real/ambiente externo ainda condicionado. [Entrega, configuração manual e retomada](finalizacao/ETAPA-07-ANDAMENTO.md).

**Arquivos:** `src/apps/contact/*`; contrato e serviço de contato/solicitações da etapa 03; traduções e testes pertinentes. O módulo de atendimento que Administração reutilizará deve ter responsabilidade definida aqui, sem duplicar o fluxo.

- [x] Finalizar formulário, canais, consentimento, horários/fuso, validação e proteção contra perda de texto.
- [x] Implementar na UI os contratos já fechados para solicitações e envio técnico.
- [x] Tratar resposta incerta/reenvio sem duplicação nem mensagem falsa de sucesso.
- [ ] Validar entrega EmailJS autorizada e persistência privada quando aplicável ao fluxo aprovado.
- [x] Conferir claramente que solicitação não é reunião confirmada nem evento público.
- [ ] Revisar formulário com teclado virtual, textos longos e tecnologias assistivas.

**Aceite:** sucesso real autorizado, validações negativas, timeout e reenvio comprovados; dados privados inacessíveis ao público.

**Congelar:** formulário e fluxo. Administração consumirá a mesma API, sem exigir mudanças na captura dos dados.

**Commit sugerido:** `feat: finaliza contato e solicitacoes de agendamento`

## Etapa 08 — Encerrar Notas e gerenciamento editorial

**Checkpoint:** implementação local e validação técnica concluídas (431 testes). Aceite de homologação real, toque/visual e traduções finais permanecem pendentes; detalhes em `docs/finalizacao/ETAPA-08-ANDAMENTO.md`. Nenhum commit/push ou operação remota realizado.

**Arquivos:** `src/apps/notes/*`; integração de anexos/serviços definida anteriormente; `src/apps/administration/AdminPosts.jsx` apenas como composição/reuso; testes de Notas/curtidas/auth.

- [ ] Finalizar listagem, busca/assuntos, leitura e entradas compartilhadas.
- [ ] Integrar anexos e Visualizador, com falhas/limites/permissões.
- [ ] Validar criar, editar, publicar, despublicar, excluir e curtir com backend de homologação.
- [ ] Testar conflito, sessão expirada, perda de rede e preservação do texto antes/durante operações.
- [ ] Resolver atualização de listagens e contagens entre instâncias/abas conforme contrato.
- [ ] Concluir traduções de NotesAdmin/PostLikes e acabamento do editor/gerenciamento.
- [ ] Deixar o gerenciamento reutilizável na Administração, sem outra implementação editorial.

**Aceite:** ciclo editorial completo e leitura pública separados; rascunhos/anexos privados não expostos; UX final nos dois shells.

**Congelar:** pasta Notas e módulo editorial. Administração passa a ser consumidora, não dona de uma segunda versão do editor.

**Commit sugerido:** `feat: finaliza notas anexos e gerenciamento editorial`

## Etapa 09 — Encerrar Calculadora

**Checkpoint:** implementação técnica validada localmente; lint/build aprovados e 438 testes passando. Aceite visual/de toque nos dois shells permanece pendente. Detalhes em `docs/finalizacao/ETAPA-09-ANDAMENTO.md`. Etapa 10 não iniciada; nenhum commit/push realizado.

**Arquivos:** `src/apps/calculator/*`; testes do motor e UI pertinentes.

- [ ] Validar operações/modos previstos, precedência, decimal, percentuais, sinais e erros de domínio.
- [ ] Conferir teclado, limpeza/correção, textos longos e dimensões mínimas.
- [ ] Fechar layout de toque, foco, tradução e estados visuais.
- [ ] Organizar motor e apresentação sem reescrever o motor já testado sem necessidade.

**Aceite:** operações representativas e inválidas corretas e uso real em Desktop/Mobile.

**Commit sugerido:** `fix: finaliza calculadora e controles responsivos`

## Etapa 10 — Encerrar Jogos e rankings

**Checkpoint:** cinco jogos e integração local corrigidos, com lint/build aprovados e 450 testes passando. Aceite real dos rankings, toque/dispositivos, traduções finais e DOOM licenciado continuam condicionados. Ver `docs/finalizacao/ETAPA-10-ANDAMENTO.md`. Etapa 11 não iniciada; nenhum commit/push ou operação remota.

**Arquivos:** `src/apps/games/*`; contrato dos rankings e testes de modelos/UI. Backend já deve estar fechado na etapa 03.

- [ ] Finalizar um jogo por vez: Snake, Memória, Campo Minado, Flappy Bird e Paciência.
- [ ] Validar controles por toque/teclado, pausa/retorno, término, reinício e estados vazios/erros.
- [ ] Corrigir sincronização dos recordes entre abas e falha de persistência.
- [ ] Homologar rankings adequados, envio voluntário, apelidos, limites, verificação, timeout e repetição.
- [ ] Documentar confiança limitada em pontuação originada no navegador e operação de moderação.
- [ ] Resolver DOOM conforme a etapa 00: licença/artefatos autorizados ou condição explicitamente pendente. Não distribuir conteúdo sem direitos.
- [ ] Revisar desempenho/recursos quando minimizado, oculto ou com mudança de shell.

**Aceite:** cinco jogos exercitados individualmente, recordes recuperáveis e ranking real homologado quando habilitado. Não confundir testes do modelo com todos os controles testados.

**Commits:** por jogo quando houver trabalho relevante; um específico para integração final dos rankings.

## Etapa 11 — Encerrar Terminal, Wally e Administração

**Checkpoint:** implementação técnica local validada; lint/build aprovados e 462 testes passando. Homologação real, aceite visual e traduções finais pendentes. Wally remoto permanece desativado. Ver `docs/finalizacao/ETAPA-11-ANDAMENTO.md`. Etapa 12 não iniciada; nenhum commit/push ou operação remota.

**Arquivos:** `src/apps/terminal/*`, `wally-extended/*`, `administration/*`; `src/features/wally/*`; consumidores dos serviços já estabilizados.

**Terminal:** comandos permitidos, ajuda, autocomplete/histórico, login/logout/expiração, erros, traduções e ausência de credenciais em histórico/logs.

**Wally:** conhecimento público selecionado, respostas locais/remotas, ferramentas aprovadas, confirmação/permissões, histórico/cancelamento/fallback, orçamento/limites e revisão do painel e app completo.

**Administração:** acesso/disponibilidade por sessão, visão geral, composição dos módulos editoriais, arquivos oficiais, eventos, solicitações privadas e informações de sistema que tenham ação real aprovada.

- [ ] Não inventar um painel de infraestrutura ou gestão de produção que o mestre não exige.
- [ ] Não permitir acesso a arquivos pessoais dos visitantes.
- [ ] Validar sessão encerrada durante um formulário e confirmação de ações críticas.
- [ ] Garantir que um prompt, comando ou flag visual não confira permissão privilegiada.
- [ ] Homologar Gemini antes de marcar a integração concluída; caso indisponível, registrar bloqueio externo.

**Aceite:** os três apps e o painel Wally usam os contratos anteriores, sem CRUD duplicado; fluxos positivos/negativos e UI PT/EN completos.

**Congelar:** pastas desses apps e features do Wally, restando apenas a composição dos shells.

**Commits:** separar Terminal, Wally e Administração quando forem entregas independentes.

## Etapa 12 — Encerrar Desktop, Taskbar, menu, painéis e widgets

**Checkpoint:** blocos técnicos locais validados, lint/build aprovados e 475 testes passando. Conferência visual real, provedores externos e traduções finais continuam pendentes; limites das miniaturas registrados em `docs/finalizacao/ETAPA-12-ANDAMENTO.md`. Etapa 13 não iniciada; nenhum commit/push ou operação remota.

**Arquivos:** `src/shells/desktop/*`; `src/features/launcher/*`, `search/*`, `calendar/*`, `notifications/*`, `quick-controls/*`, `weather/*`, `panels/*`, `widgets/*`, `shortcuts/*`. Wally e janelas já encerrados entram como consumidores, sem redesign tardio.

- [ ] Fechar grade compartilhada, atalhos, seleção/movimentação, contexto e persistência.
- [ ] Finalizar Taskbar: grupos, prévias, estados, foco/fechamento, rolagem e ocultação.
- [ ] Finalizar menu: catálogo, ordem, favoritos/recentes, busca/ações, teclado e visibilidade administrativa.
- [ ] Validar busca de conteúdo e configurações com destino contextual e falhas remotas.
- [ ] Fechar painéis: exclusividade, Escape/clique fora, foco e notificações da sessão.
- [ ] Homologar calendário/feriados/eventos e clima/previsão/negação de localização.
- [ ] Finalizar os quatro widgets individualmente: visual, configurações, tamanhos, posição, estados e persistência.
- [ ] Implementar indicação de eventos no widget somente conforme decisão fechada na etapa 00.
- [ ] Rever densidade e organização com várias janelas e resoluções, sem mudar contratos do Core.

**Aceite:** Desktop completo nos dois temas/idiomas, atalhos e painéis funcionais por teclado, sem sobreposições/travamentos críticos.

**Commits:** separar Desktop, Taskbar/menu e painéis/widgets em subblocos verificáveis.

## Etapa 13 — Encerrar shell Mobile e tablets

**Checkpoint local:** ver [ETAPA-13-ANDAMENTO.md](finalizacao/ETAPA-13-ANDAMENTO.md). Correções de integração validadas; aceite visual e em dispositivos reais pendente.

**Arquivos:** `src/shells/mobile/*`; integração em `src/App.jsx` quando necessária. Aplicativos já devem ter passado pela revisão Mobile nas suas etapas.

- [ ] Fechar Home profissional, catálogo, busca, navegação inferior e disposição em tablet.
- [ ] Validar app ativo em tela cheia, retorno à origem e encerramento de visualização.
- [ ] Conferir confirmar/cancelar saída de formulários e editores, inclusive após expiração.
- [ ] Validar painéis sobrepostos e Wally somente como app no Mobile.
- [ ] Testar teclado virtual, orientação horizontal, áreas de toque e alturas dinâmicas.
- [ ] Validar transição de shell com dados persistentes, URL estável e entradas compartilhadas.
- [ ] Conferir preferências Mobile independentes, sem introduzir rearranjo da Home contrariando o mestre.

**Aceite:** fluxos reais em celular e tablet, além da emulação. Corrigir apenas problemas de integração; um app não pode chegar aqui com seu layout Mobile inteiro pendente.

**Commit sugerido:** `feat: finaliza navegacao mobile e experiencia em tablets`

## Etapa 14 — Encerrar Configurações e apresentação do sistema

**Checkpoint local:** ver [ETAPA-14-ANDAMENTO.md](finalizacao/ETAPA-14-ANDAMENTO.md). Correções técnicas validadas; walkthrough visual e aceite editorial pendentes.

**Arquivos:** `src/apps/settings/*`, `about-system/*`; `src/features/boot/*`, `welcome/*`; conteúdo final de versão/créditos. Mecanismos de preferências são da etapa 04, consumidores das etapas anteriores.

- [ ] Conferir cada controle de Configurações alterando o consumidor real correspondente.
- [ ] Fechar tema, destaque, efeitos, wallpapers, animações, idioma e acessibilidade.
- [ ] Fechar seções Desktop/Mobile, Taskbar/widgets e restauração de padrões com confirmação apropriada.
- [ ] Testar reset parcial/falha de armazenamento sem apagar dados pessoais indevidamente.
- [ ] Concluir boot/boas-vindas, primeira visita, dispensar e orientação não coercitiva.
- [ ] Atualizar Sobre o Sistema com versão/status honestos, tecnologias, créditos/licenças aplicáveis e evolução do projeto.
- [ ] Revisar tradução, teclado, foco e estados dessas telas.

**Aceite:** walkthrough de todos os controles, persistência após reload, consumidor reagindo e reset seguro. Não mudar a paleta global ou o schema de preferências nesta etapa por escolha estética tardia.

**Commits:** um para Configurações; outro para apresentação/informações do sistema se houver mudanças relevantes independentes.

## Etapa 15 — Integração final e preparação de publicação

**Checkpoint local:** ver [ETAPA-15-ANDAMENTO.md](finalizacao/ETAPA-15-ANDAMENTO.md). Preparação/validação local efetuadas; matriz de aceite manual, homologação, traduções finais e publicação continuam abertas.

**Arquivos:** documentação de estado/contratos/validação; scripts/configuração existentes; `index.html`; workflow em `.github/workflows/` a criar somente para CI, se adotado; testes de integração.

- [ ] Conferir matriz dos 18 apps, contratos e requisitos DEC; nenhum aprovado pode ficar sem aceite ou condição explícita.
- [ ] Validar integração completa nos dois shells/temas/idiomas, resoluções intermediárias e dispositivos reais.
- [ ] Rodar segurança negativa, armazenamento falho, concorrência, navegação com rascunho e indisponibilidade de serviços.
- [ ] Executar revisão de teclado/leitor de tela/contraste/zoom 200%/movimento reduzido, corrigindo regressões sem adiar a acessibilidade de todos os apps para cá.
- [ ] Rodar lint/build/test, conferir console, recursos, desempenho, bundle e serviços de prévia.
- [ ] Preparar CI, metadados/SEO/compartilhamento e ambiente reproduzível.
- [ ] Revisar CSP/cabeçalhos/cache, dependências/licenças e ausência de segredos.
- [ ] Atualizar arquitetura/contratos/inventário/roadmap/backend para o estado final, distinguindo documentos históricos.
- [ ] Preparar domínio/HTTPS, monitoramento, orçamento, backup/restauração e rollback, sem executar produção sem autorização.
- [ ] Obter aceite de conteúdo e design/UX do autor; publicar somente mediante autorização separada.

**Aceite:** nenhum defeito crítico conhecido; todos os requisitos obrigatórios comprovados; integrações necessárias homologadas; limitações opcionais/condicionadas explicitamente aceitas. Preparado para revisão/publicação não significa já publicado.

**Commit sugerido:** `test: consolida validacao final e preparacao de publicacao`

## 4. Matriz de revisão utilizada em cada parte

| Eixo | Verificação mínima |
|---|---|
| Ambiente | Desktop, Mobile e largura intermediária aplicável |
| Aparência | Dark/Light e efeitos configuráveis pertinentes |
| Idioma | PT-BR/EN; datas/números/textos extensos |
| Interação | Mouse, teclado e toque onde aplicável |
| Estado | Normal, vazio, carregando, erro, offline/indisponível |
| Permissões | Visitante, admin e sessão expirada quando houver operações restritas |
| Persistência | Reload, duas janelas/abas e armazenamento indisponível quando aplicável |
| Integração | Entrada, retorno à origem, fechamento e dados compartilhados |
| Evidência | Testes executados, captura/checagem visual e limitações registradas |

Não é necessário testar toda combinação cartesiana em cada edição. Cobrir os fluxos de maior risco, as combinações visuais relevantes e os cenários que mudaram; repetir quando houver mudança ou regressão.

## 5. Modelo de registro ao encerrar uma etapa

Copiar este modelo para o acompanhamento, sem criar dezenas de documentos separados:

```text
Etapa:
Requisitos/decisões atendidos:
Entregas verificadas:
Arquivos alterados e organização concluída:
Contratos/consumidores afetados:
Testes automatizados e resultado:
Verificações manuais e ambientes:
Configurações/migrações e onde foram aplicadas:
Dependências externas restantes:
Estado: concluído | implementado, bloqueado externamente | condicionado
Commit(s):
Motivo previsto para reabrir: somente defeito/regressão ou mudança de escopo aprovada
```

## 6. Critério de 100% do projeto

Não usar percentual calculado por número de arquivos, componentes ou testes. Considerar conclusão integral somente quando as etapas obrigatórias tiverem aceite, o conteúdo necessário estiver fornecido, as integrações obrigatórias estiverem homologadas e não houver lacunas funcionais/visuais conhecidas no escopo aprovado.

Os 202 testes do estado de referência são uma base de regressão, não um certificado de conclusão. Recursos condicionados como DOOM precisam de resolução explícita; dependências externas não podem desaparecer do relatório só porque o código está preparado.

**Primeira ação prática:** executar as etapas 00 e 01 antes de reorganizar mais arquivos. Depois fechar o Design System e os serviços compartilhados, e só então encerrar cada pasta de aplicativo na sequência definida.


## Auditoria posterior autorizada

Ver [AUDITORIA-FINAL.md](finalizacao/AUDITORIA-FINAL.md). A orientação mais recente libera traduções/limpeza; JSONs atualizados, PDF.js corrigido e dicas revisadas. Registros de traduções adiadas nos checkpoints são históricos. Aceites visuais e externos continuam explícitos; nenhum percentual de conclusão foi inferido pelos testes.

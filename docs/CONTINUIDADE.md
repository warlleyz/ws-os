> **Atualização de 15/10/2026:** consulte primeiro [Entrega e continuidade](ENTREGA-E-CONTINUIDADE-2026-10-15.md) e [Estado atual](implementation-status.md). O texto abaixo preserva descrições/evidências de etapas anteriores; afirmações sobre apps reservados, Mobile ausente ou apenas um app implementado foram superadas pelos commits atuais.

# WS OS — Documento de continuidade e recuperação

**Data:** 14/10/2026. **Planejamento de referência:** WS-OS-V2-MESTRE-REPLANEJAMENTO v0.16.0, consolidado em 13/10/2026. **Repositório:** https://github.com/warlleyz/ws-os. **Branch de trabalho:** main.

Este documento permite continuar o projeto em outra conversa sem reiniciar, sem deduzir implementação a partir de arquivos vazios e sem repetir a auditoria inicial. É acompanhado por architecture, contracts, implementation-status, roadmap e file-inventory, todos em docs.

## 1. Resultado desta entrega

O código existente foi organizado nas responsabilidades aprovadas: Core, shells, features, apps, services, shared e styles. Não foram adicionados aplicativos funcionais, conteúdo profissional, funcionalidades de produto, serviços pagos, backend, autenticação ou deploy.

O projeto continua sendo um protótipo Desktop. Tem gerenciamento básico de instâncias/janelas, Taskbar, WS Menu, painéis, notificações, relógio, temas e consulta simples de clima. Os 18 apps estão registrados e abrem placeholders. Mobile permanece reservado.

Foram preservadas as alterações locais ainda não commitadas pelo usuário. O ponto de partida remoto era 745ada6 (extração de CSS do boot/boas-vindas). A organização é entregue em um único commit; o SHA final é informado na resposta da entrega e pode ser conferido por git log. Não inserir um hash inventado ou exigir que o documento contenha seu próprio hash.

## 2. Autorizações e método

O usuário inicialmente pediu edição manual com trechos exatos e arquivos completos. Depois autorizou edição direta exclusivamente para concluir a organização, sem novas funcionalidades e com um único commit. Essa exceção não constitui permissão permanente para toda implementação futura.

No chat normal, confirmar o modo de trabalho do próximo incremento. Se manual: pequenas mudanças em Altere/Por/Depois de/Adicione/Remova; mudanças grandes com conteúdo completo. Ao concluir incremento funcional, apresentar verificações e commit segundo o padrão do repositório. Após confirmação de commit/push, conferir arquivos/diff antes de avançar. Não criar um novo projeto do zero.

## 3. Planejamento vigente

Mestre com B01–B16 e DEC-001–609. Fonte canônica de produto em docs/planning. Este relatório é um registro de execução/estado, não uma nova votação de requisitos ou substituição do mestre.

- Marca pública WS OS; V2 apenas em informação de versão.
- React + JavaScript + Vite; ESLint/Prettier; sem migração implícita para TypeScript.
- Desktop e Mobile próprios, compartilhando núcleo/dados autorizados.
- 12 atalhos fixos em composição, reorganizáveis; apps Desktop e Sistema são classes distintas.
- WS Menu alfabético sem categorias, com recentes/favoritos complementares e busca contextual.
- Taskbar flutuante inferior: menu, apps abertos, notificações/controle/Wally, clima e data/hora.
- Painéis acima da Taskbar e centralizados horizontalmente em relação a ela.
- Minimização conserva estado e pausa seletivamente atividades; fechar encerra; reload não reabre janelas.
- Preferências simples em localStorage; arquivos pessoais locais em IndexedDB quando implementado.
- Dark padrão e light, Nunito Sans/JetBrains Mono, tokens, estados, efeitos controlados e acessibilidade.
- Calendário somente eventos cadastrados e feriados; Notas é blog público, não editor livre do visitante.
- Administração somente após login pelo Terminal e autorização efetiva nas operações backend.
- Wally com base pública autorizada, fallback local e IA opcional protegida.
- Navegação comum entre apps mantém URL visível; domínio planejado warlley.dev.

## 4. Mudanças de organização

### 4.1 Caminhos antigos retirados

| Antigo                       | Destino                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| src/shells/Desktop.jsx       | src/shells/desktop/Desktop.jsx e submódulos                 |
| src/shells/Taskbar.jsx       | src/shells/desktop/taskbar/Taskbar.jsx, componentes e hooks |
| src/shells/Window.jsx        | src/features/windows/Window.jsx, hook, geometria e AppHost  |
| src/widgets/ClockWidget.jsx  | src/features/widgets/clock/ClockWidget.jsx                  |
| src/index.css                | src/styles/global.css                                       |
| src/App.css                  | CSS dos módulos, coordenado por src/styles/system.css       |
| src/styles/desktop.css vazio | src/shells/desktop/Desktop.css                              |

As apresentações de boot/boas-vindas, já extraídas antes, permanecem nos módulos preparados. Não há cópias antigas ativas dos componentes.

### 4.2 Estado e lógica

SystemProvider passa a possuir sessão/instâncias/notificações/toasts; Desktop e Taskbar usam useSystem. O método de mostrar Desktop foi transferido como operação compartilhada, preservando a minimização existente. Não foram implementados desligamento/reinício ou auth.

Funções geométricas foram extraídas para windowGeometry; efeitos/interações para useWindowInteraction. O conteúdo provisório passou a AppHost. Grade foi para desktopLayout; ResizeObserver para useDesktopLayout; widget para useDesktopWidgets/WidgetHost. Notificações possuem Toast, Toaster e Center separados.

Taskbar recebeu subcomponentes para apps, prévias e menus; WS Menu/favoritos/pesquisa, painéis e atalhos globais foram separados. HTTP meteorológico foi retirado da apresentação e colocado em weatherService; estado/geolocalização em useWeather. Não foram adicionados retries, cache ou previsão.

### 4.3 Preservação

IDs dos apps/instâncias, catálogo, textos, classes CSS, dados salvos, chaves de armazenamento, política de instâncias e interações observadas foram mantidos. Ajustes de imports, dependências de efeitos e identificação React de itens servem à extração, sem acrescentar funcionalidade.

CSS foi distribuído em módulos com sequência de importação explícita. Comparação estática confirmou 299 combinações seletor/contexto com declarações preservadas. Isso não é prova de contraste, performance ou equivalência visual em todos os dispositivos.

## 5. O que existe e o que não existe

Consultar implementation-status para a matriz por funcionalidade e por app. Um arquivo reservado contém comentário de reserva; não deve ser importado como componente pronto. i18n tem apenas JSONs `{}`. O inventário lista caminhos ativos/reservados.

Nenhum dos 18 apps tem conteúdo funcional conectado ao AppHost. Não confundir registro, ícone, atalho ou placeholder com app entregue. Flags implemented de dois apps ainda são inconsistentes e foram mantidas para evitar misturar correção funcional na reorganização.

Não há shell Mobile real, backend, Supabase/RLS, Gemini, EmailJS, métricas GitHub/WakaTime, arquivos pessoais em IndexedDB, jogos funcionais, CI ou deploy nesta entrega. As media queries existentes continuam adaptando Desktop, sem substituir F5.

## 6. Riscos e pendências prioritárias

1. Taskbar com múltiplas instâncias abre prévias em vez de focar a última ativa; fallback de alvo usa ordem de criação.
2. Calendário continua omitido em algumas rotinas de fechamento. Clique externo já corrigido pelo usuário foi preservado.
3. Grade pequena pode ocultar atalhos ao reservar espaço do widget; precisa validar capacidade/realocação e acesso.
4. Core não nega openApp administrativo pela flag public. Atualmente só existe placeholder; não foi demonstrado acesso backend indevido.
5. Modal de boas-vindas sem contenção/retorno de foco/fundo inert; atalhos podem conflitar.
6. Preferências podem falhar sem comunicação visível; não mudar suas chaves para corrigir isso.
7. Tema claro parcial, cores semânticas e contraste sem auditoria completa.
8. Janelas confinadas integralmente, lifecycle incompleto e sem comprovação de performance sob carga.
9. WS Menu sem recentes/busca contextual; prévias fictícias; controles incompletos.
10. Clima atual sem previsão/cache/timeout HTTP; calendário sem eventos/feriados; Wally somente estático.

Essas pendências não justificam restart. Priorizar os gates de estabilidade, contratos e acessibilidade antes de expandir funcionalidades.

## 7. Verificação desta entrega

Ferramentas existentes reutilizadas de C:/Projetos/ws-os/node_modules. Nenhuma dependência instalada/atualizada. Node observado v24.19.0, npm 11.17.0; build reportou Vite 8.3.4. As versões do manifesto/lock não foram alteradas.

- Lint executado na cópia organizada e sem erros/avisos na validação final.
- Build executado na cópia organizada; validação repetida na aplicação final conforme relatório da entrega.
- Sete testes Node de catálogo, instância única, múltiplas instâncias/foco, app inexistente, geometria/snap, grade ampla e resolução de painéis.
- Os testes carregam os módulos puros via VM e substituem apenas ícones visuais; não são uma suíte React/E2E, não validam backend ou lifecycle de recursos.
- Smoke de navegador: boot, boas-vindas, abertura pelo Desktop/menu, maximizar/restaurar/minimizar/restaurar pela Taskbar, tema claro, busca por nome, calendário, Escape e mostrar Desktop.
- Foi corrigido um aviso de key introduzido pela extração do WidgetHost. Não confundir esse ajuste de regressão com entrega de novas regras de widgets.
- Não foram executados benchmarks, auditoria WCAG, teste completo de leitor de tela, dispositivos físicos, segurança backend ou consultas meteorológicas com localização do usuário.

Os cenários observados não significam que todas as interações planejadas passaram. A próxima etapa deve ampliar os testes justamente nos pontos de divergência.

## 8. Sequência recomendada

Ler roadmap para arquivos, dependências e aceite: R0 baseline → R1 Taskbar/painéis → R2 contratos/isolamento → R3 grade/persistência → R4 visual/acessibilidade → R5 gate de janelas/Desktop → F5 Mobile → A1–A8 apps → consolidação/publicação.

Começar pelo menor incremento verificável: comportamento dos grupos e fechamento completo dos painéis. Não iniciar todos os apps ou toda a infraestrutura ao mesmo tempo. Não substituir a arquitetura por outra stack sem decisão.

## 9. Dados e dependências a obter

- Conteúdo profissional real, cronologia, competências, contatos autorizados.
- Catálogo de projetos, imagens, links e tipos de demonstração.
- Currículo/PDF, certificados/comprovantes e direitos de publicação.
- Fontes públicas WakaTime e estratégia de credenciais protegidas se necessária.
- Provedores de contato/agendamento, políticas de privacidade e antiabuso.
- Requisitos Supabase/RLS e ambientes; licença/código da rotina do professor.
- Base pública de conhecimento Wally, catálogo de ferramentas e orçamento de IA.
- Materiais/licenças de jogos, especialmente DOOM e marcas/assets de terceiros.
- Domínio, DNS/HTTPS, limites/custos de hospedagem e rollback antes de produção.

Não inventar dados reais, percentuais de competências, métricas, respostas de serviços ou aprovação de fornecedores.

## 10. Checklist para continuar no chat normal

- [ ] Anexar este documento completo e o mestre v0.16.0, ou fornecer acesso ao repo com docs.
- [ ] Informar hash atual, branch e existência de alterações locais.
- [ ] Pedir leitura efetiva dos arquivos; não confiar só no histórico da conversa.
- [ ] Confirmar modo manual/direto e incremento autorizado.
- [ ] Reproduzir primeiro os bugs de Taskbar/painéis.
- [ ] Definir arquivos, verificação e commit do próximo incremento.
- [ ] Preservar dados locais, histórico e arquitetura reorganizada.
- [ ] Atualizar implementation-status/contratos com o que realmente for entregue.

Texto de contexto sugerido: “Continue o WS OS a partir do commit de reorganização, lendo docs/CONTINUIDADE.md e o mestre v0.16.0. Não reinicie o projeto. Os apps e Mobile ainda são reservas. Primeiro delimite a correção de grupos da Taskbar e fechamento dos painéis; preserve dados, contratos e o modo de edição que eu confirmar.”

## 11. Limites de entrega

Esta organização não declara F1–F4 integralmente aceitos nem produção pronta. Os marcos precisam de critérios e evidências do mestre. Commit não implica push/deploy. A documentação registra o estado observado e limitações concretas, para que a continuidade avance sem reinterpretação silenciosa do planejamento.

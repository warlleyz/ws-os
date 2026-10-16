# Missão de conclusão — auditoria e execução

## Baseline e autorização

Auditoria iniciada em 15/10/2026 sobre `dc962b7` (main), Git limpo. Stash R3.3 preservado, objeto `fde807596bafaad6878da5721445b428c4ea468b`. O usuário autorizou implementação contínua e commits locais por bloco; **push proibido**. Não ativar IA, custos, produção ou políticas remotas. Mestre v0.16.0 lido integralmente, incluindo DEC-001–609; sua proibição histórica de iniciar foi superada pela missão explícita atual. Não alterar retroativamente o mestre.

Inventário automatizado de 210 arquivos técnicos/documentais versionados, revisão do histórico posterior à entrega anterior e dos contratos/consumidores relevantes. V1 local de referência em `c2e51be`, sem executar seu código ou copiar credenciais. V2 evoluiu em 31 commits desde a entrega anterior: quatro widgets, grade adaptativa, refinamentos de painéis, Wally compartilhado e Worker/D1. Esses avanços são preservados; documentos anteriores que os chamam de ausentes estão desatualizados.

Baseline executado: build aprovado; lint reprovado com 22 erros/2 warnings; testes 94 aprovados/9 falhas de 103. O total exato de diagnósticos deve ser conferido na saída final: vários são variáveis sem uso, efeitos com setState, refs em render e símbolo inexistente.

## Matriz inicial de requisitos e riscos

| Bloco / decisões                        | Estado observado                                                  | Divergência e evidência                                                                                                                 | Prioridade / dependência                                 |
| --------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Core/instâncias, DEC-128–155/411–423    | Abrir/focar/minimizar/restaurar/fechar e guards integrados        | Acesso administrativo ainda sempre negado; sem restart/close animado                                                                    | P0 regressões; P2 auth/lifecycle                         |
| Grade/Desktop, DEC-025–036/059–064      | Grade adaptativa e quatro widgets integrados                      | Overflow virtual não encontra células sob a reserva inferior em viewports mínimas; `desktopLayout.js`; testes assumem passo fixo antigo | P0: corrigir algoritmo e atualizar contratos de teste    |
| Widgets, DEC-030/035/062                | Relógio/calendário/clima/Insights; preferências e colisão         | Remoção de tamanho legado 3×3 do relógio invalida preferência antiga; `widgetManager.js`; fixtures antigas de apenas um widget          | P0: compatibilidade e testes multiwidget                 |
| Taskbar/painéis, DEC-047–058/232–266    | Refinados recentemente, notificações/DND/calendário/clima         | `Taskbar.jsx` usa CloudSun sem import; DND limpa toasts por efeito redundante                                                           | P0: restaurar render/validação                           |
| Temas/efeitos, DEC-180–225              | Dois temas, tokens, destaques, vidro, efeitos e baixo custo       | CSS recentes contêm superfícies/cor fixas; falta matriz visual de estados e tokens consumidos                                           | P1: verificar e ajustar sem redesenhar painéis aprovados |
| Mobile, DEC-267–301                     | Shell próprio, catálogo, busca, histórico e painéis               | Home ainda genérica; revisar origem de aberturas e acessibilidade de áreas pequenas                                                     | P1/P3: após estabilidade                                 |
| Institucionais, DEC-361–382             | Componentes ligados ao conteúdo público versionado                | Sobre o Sistema carece metadados derivados, créditos/evolução; conteúdo pessoal será fornecido                                          | P1 independente de contas                                |
| Projetos/Demos/Insights, DEC-383–387    | GitHub/cache/filtros/demos e períodos                             | Métricas sem gráficos; conferir contratos de retorno/demos e Worker não roteia WakaTime existente                                       | P1/P2                                                    |
| Contato, DEC-388–389                    | Validações/EmailJS/solicitação privada preparada                  | Configuração real e entrega não testadas; infraestrutura de solicitações administrativas ausente                                        | P2 com backend preparado                                 |
| Notas, DEC-390–391                      | Leitura/busca local ou Supabase preparada                         | Sem anexos/curtidas/paginação; Worker atual devolve 404 para `/api/posts`                                                               | P1 roteamento; P2 dados protegidos                       |
| Arquivos, DEC-393–397                   | IndexedDB e revisão transacional, visualizador/editor             | Falta exportação/recuperação geral e navegação de coleções; revisar área oficial e limites                                              | P3 após backend                                          |
| Jogos, DEC-400–401                      | Cinco jogos locais, pausa e recordes                              | Ranking global ausente; DOOM condicionado a direitos, sem artefatos autorizados                                                         | P2 ranking preparado; externo DOOM                       |
| Terminal/Admin, DEC-402–403/406/435–439 | Terminal restrito; auth/Admin reservados                          | Nenhum fluxo administrativo funcional                                                                                                   | P2: auth gerenciada + permissões backend/RLS antes de UI |
| Wally, DEC-404–405/433                  | Conversa compartilhada/cancelável, Gemini/Turnstile/D1 preparados | Remoto deliberadamente desligado: manter `WALLY_AI_ENABLED=false`; testar negativa e fallback                                           | P0/P2 segurança, sem ativação remota                     |
| Operação/qualidade, DEC-450–518         | Lint/build/testes existentes, Worker configurado                  | Sem CI/release completo; docs antigas contraditórias; gates físicos não comprovados                                                     | P0–P4, sem publicar                                      |

## Sequência executável

1. **M0:** estabilizar lint, regressão de grade, compatibilidade de widgets e testes dos consumidores. Não reduzir funcionalidade para fazer testes passarem.
2. **M1:** completar temas/tokens/estados e acabamento compartilhado, medindo a UI atual antes de alterar; preservar composição recente.
3. **M2:** corrigir roteamento Worker e completar infraestrutura independente de contas para auth/Admin, Notas, eventos, curtidas/rankings; manter desligada até configuração. Nenhum SQL executado no remoto.
4. **M3:** fechar lacunas dos apps, conteúdo institucional/metadados, arquivos, visualizações, navegação e Mobile.
5. **M4:** segurança negativa, regressão transversal, CI/checklist e documentação de configuração. Bloqueios externos individualizados, sem alegação de conclusão integral enquanto houver implementação pendente.

Cada bloco terá diff revisado, lint/build/testes pertinentes, commit local e registro de evidências. Riscos críticos de segurança/perda de dados/resize impedem alegação de pronto para produção. Benchmark físico, leitor de tela/toque e contas reais serão distinguidos de testes simulados.

## Comparação com a V1

A V1 oferece janela de vidro, painéis refinados, catálogo de projetos/demos, currículo/certificados, estatísticas e Snake com ranking Supabase. Sua organização concentra responsabilidades no Desktop e tem dependências distintas. A V2 mantém camadas Core/shells/features/apps, política de dados locais e autorização especificadas pelo mestre. Não portar acesso direto permissivo a rankings nem configuração cliente privilegiada. Transparência/blur são referências já adaptadas; evitar transições de geometria e blur duplicado que ampliem custo de resize.

## Evidências de execução

Registro incrementado após cada entrega validada. Nenhum sucesso de integração externa será inferido de mocks ou ausência de chaves.

### M0 — estabilização

Corrigidos símbolo ausente na Taskbar, efeito redundante de DND, navegação de Configurações por pedido explícito, referências de callbacks após commit e composição acessível do Tooltip. Ícones meteorológicos preservados sem definir componentes instáveis em render. Removidos somente bindings duplicados/sem uso, sem controles ou recursos funcionais removidos.

Grade virtual separa reserva física da Taskbar das linhas roláveis. Testes antigos passaram a comparar coordenadas de células com passo adaptativo, sem fixar 90 px. Tamanho legado 3×3 do relógio restaurado, fixtures atualizadas para quatro widgets e novo teste de colisões/recuperação em múltiplas larguras. Traduções ausentes dos recursos recentes foram acrescentadas.

Medição sintética do algoritmo multiwidget (Node/VM, 25 distribuições por dimensão, não benchmark do navegador): média 1,5 ms em 768×500, 1,5 ms em 1280×720, 3,0 ms em 1920×1080 e 18,6 ms em 3840×2160, p95 de 23,5 ms em 4K. O custo de layout em 4K merece otimização medida; não declarar resize físico corrigido com esse ensaio.

### M0.1 — custo da grade

Distribuicao sob demanda substitui enumeracao/ordenacao completas no caminho comum, preservando ordem de prioridade e desempate. Layout do hook memoizado por entradas reais para nao recalcular em atualizacoes sem relacao com a grade. Comparacao deterministica: 120 cenarios identicos antes/depois. Mesmo ensaio Node/VM: 4K media 0,95 ms/p95 1,63 ms (antes 18,6/23,5 ms); Full HD media 0,30 ms (antes 3,00 ms). Em 768x500, media 1,91 ms contra 1,51 ms: a melhora nao e uniforme em espacos congestionados. Nao equivale a medicao de FPS no navegador.

Navegador: Desktop e tres widgets padrao renderizados, Taskbar funcional, Configuracoes abriu pelo teclado e listou os quatro widgets e tamanhos legados. Nenhum dado da origem habitual foi alterado. A consulta de localizacao retornou erro de permissao com feedback; nao foi concedida permissao de geolocalizacao.

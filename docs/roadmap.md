# Roadmap de recuperação e continuidade

Este é um plano operacional de continuidade, subordinado ao mestre v0.16.0. Cada etapa futura requer delimitação e autorização. A autorização da reorganização não libera implementação de funcionalidades, instalação, credenciais, push ou deploy futuros.

## Etapa concluída nesta entrega: organização

Distribuir código existente por responsabilidade, centralizar sessão, extrair apresentações/hooks/cálculos, separar HTTP de clima, distribuir CSS, preservar chaves/dados/classes e retirar caminhos antigos. Preparar documentação e um único commit, sem implementar apps ou backend.

## R0 — confirmar baseline e validação local

- Conferir hash do commit de reorganização, branch main, status limpo e comandos do README.
- Reexecutar lint/build e sete testes Node na máquina do usuário.
- Conferir primeiro acesso, boot, tema, janelas, menus, widgets e notificações.
- Registrar resultados antes de mudar código. As verificações desta entrega estão em CONTINUIDADE.

Aceite: app inicia sem erro de módulo, imports antigos ausentes e sessão preserva comportamento observado. Não exigir infraestrutura externa para este passo.

## R1 — corrigir Taskbar e painéis

Arquivos: Taskbar, useTaskbarPreviews, panelManager e contratos de foco pertinentes.

- Resolver última instância ativa pelo histórico de foco, não criação.
- Clique no grupo foca/restaura; clique repetido na ativa minimiza; prévias selecionam outras instâncias.
- Uniformizar fechamento do calendário e demais painéis ao clicar fora, Escape, abrir outro painel e ativar app.
- Manter centralização acima da barra e grupos de apps abertos.

Aceite: duas instâncias de Projetos, outro app ativo, uma/todas minimizadas, fechamento de uma/todas, calendário → app/preview/clique externo. Testes com mouse e teclado. Não redesenhar junto.

## R2 — contratos mínimos e isolamento

Arquivos: appRegistry, appManager, AppHost, AppErrorBoundary e docs/contracts.

- Reconciliar implemented com realidade; definir entrada de componente e carregamento sob demanda.
- Definir origem/parâmetros/resultado de abertura e acesso público/restrito.
- Erros tratáveis sem derrubar o sistema; recuperação por app.
- Lifecycle: minimizar conserva estado e pausa seletivamente; fechar libera recursos; alterações pendentes futuras têm confirmação apropriada.

Aceite: app desconhecido/restrito, instância única/múltipla, entrada inválida, erro de app isolado, close/reopen e reload. Não habilitar Administração funcional apenas por esconder botão.

## R3 — grade, widgets e persistência

Arquivos: desktopLayout, useDesktopWidgets, DesktopShortcuts, serviços de armazenamento.

- Capacidade conjunta de 12 atalhos e widget; realocar quando possível, bloquear inclusão quando não houver espaço.
- Resize/orientação sem desaparecimento silencioso de acesso essencial.
- Arraste de ícones, posições persistentes, multisseleção/seleção por área e ordenação coerente.
- Widget com tamanhos discretos, alternativas por teclado e gestão futura em Configurações.
- Feedback de quota/armazenamento, validação e migração somente se formato mudar.

Aceite: áreas amplas/estreitas/baixas, widget maior e cheio, dados corrompidos, localStorage bloqueado, reload e cancelamento de arraste. Preservar as chaves existentes.

## R4 — completar fundação visual e acessibilidade

- Temas nos componentes representativos, estados semânticos e contrastes medidos.
- Foco/Tab/retorno de foco, modal correto, menus contextuais e alternativas de arraste.
- Movimento/transparência reduzidos e opções de efeito de baixo custo.
- Revisar rótulos/idioma HTML, marca WS OS, alvos, zoom e leitor de tela.
- Implementar i18n pt-BR/en com persistência e escopo claro.

Aceite: dois temas, zoom, teclado, toque e tecnologias assistivas; não declarar WCAG AA apenas por inspeção visual. Wallpapers personalizados permanecem locais e validados.

## R5 — gate de janelas e Desktop F3/F4

- Testar repetidamente drag/resize/maximizar/restaurar/snap e viewport.
- Verificar memória, observers, listeners e timers após fechar/reabrir.
- Medir em dispositivos/referências definidos; registrar método e resultados.
- Completar Taskbar auto-ocultação/prévias/data, WS Menu recentes/busca, controles, calendário e clima conforme dependências.

Aceite: nenhum travamento crítico; toda regressão bloqueadora resolvida. Não confundir um smoke test com benchmark. Busca contextual depende de fontes de conteúdo/ações reais.

## F5 — Mobile próprio

Compartilhar Core/serviços, não comprimir Desktop. Home profissional fixa, apps principais, catálogo/busca, barra inferior, um app principal visível, cabeçalho contextual e histórico de origem. Wally só como app. Painéis podem sobrepor sem encerrar app. Preferências visuais/organização independentes dos shells, dados autorizados compartilhados.

Aceite: voltar interno antes de origem, abrir app a partir de outro, teclado virtual, áreas seguras, rotação, largura útil, temas e URL estável. Sair da visualização não implica necessariamente destruir instância: observar DEC-299 posterior.

## A1–A8 — aplicativos

| Marco | Escopo                                                                   | Dependências e aceite                                                                                            |
| ----- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| A1    | Sobre Mim, Sobre o Sistema, Currículo, Certificados, visualizador mínimo | Conteúdo real versionado e documentos autorizados; teclado, leitura, links e falhas                              |
| A2    | Projetos, Demos, Dev Insights                                            | GitHub/WakaTime por serviço, cache/fontes/períodos, detalhes por projeto, demos seguras claramente identificadas |
| A3    | Calculadora, Contato, solicitações                                       | Operações locais validadas; EmailJS/antiabuso; pedido privado não confirma reunião                               |
| A4    | Notas e curtidas                                                         | Supabase/RLS, rascunhos privados, edição autenticada, leitura pública e antiabuso                                |
| A5    | Arquivos, Editor, Visualizador                                           | IndexedDB local, conteúdo oficial separado, capacidades e proteção contra perda                                  |
| A6    | Configurações                                                            | Preferências coerentes nos shells, acessibilidade, widgets e restauração                                         |
| A7    | Jogos                                                                    | Controles/toque/ciclo de vida, recordes, backend apenas quando pertinente e licença DOOM verificada              |
| A8    | Terminal, Wally Estendido, Administração                                 | Auth e autorização por ação, comandos/ferramentas limitados, Gemini protegido/cotas/fallback                     |

Não implementar todos simultaneamente. Para cada app: modelos/contratos → estados → integração mínima → fluxo Desktop/Mobile → casos negativos → verificação → checkpoint.

## Integrações e infraestrutura

Somente configurar quando o incremento precisar. Rever condições atuais dos provedores, limites/custos/licenças e ambientes. Supabase é a opção principal condicionada a validação; Cloudflare Pages é a hospedagem preferencial condicionada; warlley.dev é o domínio planejado. Não presumir DNS, plano ou titularidade conferidos.

Chaves privilegiadas ficam no backend. Gemini por função protegida, ferramentas em lista permitida e orçamento. EmailJS exige confirmação real do envio e antiabuso. Rotina do professor para Supabase requer código/licença/segurança/confiabilidade antes de adoção; não garantir prevenção de pausa do banco.

## R1/R2 do mestre — consolidação e publicação

Após apps: regressão dos 18, ambos shells, performance, acessibilidade, privacidade, segurança e recuperação. Depois: prévia, custos, DNS/HTTPS, redirects, rollback e aprovação explícita de produção. Abrir/fechar apps comuns não deve alterar a URL visível.

## Formato de trabalho no chat normal

1. Ler CONTINUIDADE e o mestre, confirmar estado real do Git.
2. Delimitar uma etapa, arquivos, decisões, riscos e aceite.
3. Se o usuário mantiver edição manual: alterações pequenas em Altere/Por/Depois de/Adicione/Remova com trechos exatos; grandes com arquivo completo.
4. Distinguir teste sugerido de executado e resultado observado de hipótese.
5. Após confirmação de commit/push, conferir arquivos e diff antes do próximo incremento.
6. Se houver autorização para edição direta, respeitar o escopo e a estratégia de commit combinada naquele momento.

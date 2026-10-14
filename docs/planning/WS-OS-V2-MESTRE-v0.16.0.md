# WS OS V2 — Documento Mestre de Planejamento (reinício)

> **Versão:** 0.16.0  
> **Data de consolidação:** 13/10/2026  
> **Estado:** Planejamento — Blocos 01 a 16 concluídos; implementação não autorizada  
> **Decisões vigentes deste ciclo:** DEC-001 a DEC-609  
> **Próxima etapa:** F0 — diagnóstico do repositório, somente após autorização expressa; implementação não autorizada  
> **Repositório V1 de referência:** https://github.com/warlleyz/portfolio-warlley  
> **Este documento:** reinício independente dos planejamentos anteriores encontrados na Biblioteca; nada de versões anteriores é automaticamente aprovado neste ciclo.

---

## 1. Finalidade e princípios de interpretação

Este é o registro canônico **deste ciclo de replanejamento** da WS OS V2. Reúne decisões aprovadas, limites, dependências, tópicos pendentes, organização das discussões, etapas previstas e, futuramente, a estratégia exata de implementação e commits.

**Regra de precedência:** decisão explícita do usuário neste ciclo > esclarecimento explícito posterior > proposta pendente. Documentos históricos e a V1 são referências, não autorização de escopo. Nada descrito como proposta, exemplo ou assunto futuro constitui aprovação.

**Estados:** `APROVADA`, `PENDENTE`, `EM DISCUSSÃO`, `SUBSTITUÍDA`, `CANCELADA`; implementação terá controle próprio (`NÃO INICIADA`, `EM EXECUÇÃO`, `VALIDADA`). Decisões aprovadas não equivalem a recursos construídos.

**Rotina pactuada:** discutir por blocos; apresentar perguntas objetivas e diretas (várias por rodada são permitidas); exigir aprovação explícita; revisar coerência e dependências; editar o mestre **somente no encerramento de cada bloco**; não escrever código até que toda a especificação, etapas, validações e estratégia de commits sejam definidas.

---

## 2. Diagnóstico de referência da V1

A V1 é um portfólio em React/JavaScript/Vite que simula um desktop no navegador. O repositório público documenta Desktop, Taskbar, WS Menu, janelas móveis/redimensionáveis, notificações, controles rápidos, terminal, projetos, currículo, certificados, estatísticas, Snake, temas e integrações (GitHub, WakaTime, Open-Meteo, Supabase). A inspeção estática dos arquivos `src/App.jsx`, `src/components/Desktop/Desktop.jsx`, `src/data/appsData.js`, `src/data/searchData.js`, `package.json` e README evidenciou concentração de diversas responsabilidades no Desktop. **Não houve auditoria de execução ou benchmarking; avaliações de performance são hipóteses a validar.**

**Decisão de relação com a V1:** referência conceitual, sem obrigação de reaproveitar código. Inventário detalhado, comparação funcional e eventual migração serão especificados nos blocos competentes.

---

## 3. Bloco 01 — Visão, identidade e princípios do produto

**Status:** CONCLUÍDO em 12/10/2026 após confirmação da DEC-018 e revisão de consistência.  
**Escopo:** objetivo da V2, relação com V1, stack-base, posicionamento profissional, públicos, identidade geral, idiomas, primeira experiência em nível conceitual, exploração, princípios de qualidade, evolução e método de planejamento.  
**Fora do escopo:** arquitetura detalhada, paleta, tipografia, Wally, telas, janelas, Catálogo de apps, persistência, localização de mensagens, métricas, limites de performance, estrutura do repositório e commits específicos.

### 3.1 Registro de decisões aprovadas

| ID | Alternativa | Definição aprovada | Limites e dependências |
|---|---|---|---|
| DEC-001 | C | Reconstruir a V2 do zero; a V1 será referência. | Não pressupõe reaproveitamento de código. |
| DEC-002 | A | Portfólio profissional com aparência e experiência de sistema operacional. | Não exige emular um SO real. |
| DEC-003 | B | Experiências distintas de desktop e mobile no mesmo ecossistema. | Layouts e interações a detalhar. |
| DEC-004 | A | React, JavaScript e Vite como base. | Bibliotecas auxiliares e decisões arquiteturais pendentes. |
| DEC-005 | B | Reavaliar todos os aplicativos; manter, alterar, remover ou acrescentar conforme decisão posterior. | Nenhum catálogo está automaticamente aprovado. |
| DEC-006 | B | Planejar por blocos; aprovar explicitamente; consolidar o documento ao final de cada bloco. | Todo o planejamento, etapas e commits definidos antes de programar. |
| DEC-007 | B | Identidade visual original e tecnológica. | Sem aprovação de cores, tipografia ou efeitos específicos. |
| DEC-008 | B | Equilíbrio entre apresentação profissional e demonstração técnica do WS OS. | Organização detalhada do conteúdo pendente. |
| DEC-009 | B | Igual prioridade para recrutadores, empresas e desenvolvedores. | Requisitos concretos de navegação a detalhar. |
| DEC-010 | B + observação | Inicialização curta e entrada automática; no primeiro acesso, abrir janela de boas-vindas com assistente Wally, apresentando resumo do sistema. | Comportamento, desenho, acessibilidade, detecção de primeiro acesso e persistência serão definidos no bloco correspondente. |
| DEC-011 | C | Equilíbrio entre elegância profissional e elementos futuristas. | Não define grau específico de animações, brilho ou componentes. |
| DEC-012 | B | Português brasileiro e inglês com possibilidade de alternar idioma. | Traduções, idioma inicial e armazenamento da preferência pendentes. |
| DEC-013 | B | Nome público: **WS OS**; indicador V2 somente em informações de versão. | Nomes técnicos de pacotes e arquivos pendentes. |
| DEC-014 | A | Navegação livre pelos aplicativos. | Wally pode orientar sem obrigar roteiro ou bloquear o acesso livre. |
| DEC-015 | B | Equilíbrio entre conteúdo profissional, experiência visual e funcionalidades. | Critérios práticos e compromissos a definir. |
| DEC-016 | B | Combinar recursos profissionais, interativos e experimentais. | Recursos específicos dependem de revisão individual. |
| DEC-017 | B | Versão inicial completa, com possibilidade de expansões futuras. | Critérios de completude, releases e roadmap pendentes. |
| DEC-018 | B + observação | Equilíbrio entre qualidade técnica e riqueza visual, com requisitos mínimos obrigatórios; buscar uma mistura de estabilidade, acessibilidade, desempenho, fidelidade visual e experiência. | Nenhum requisito é dispensável automaticamente; limites mensuráveis e políticas de trade-off serão definidos mais tarde. |

### 3.2 Interpretação consolidada

A WS OS V2 será um **portfólio profissional original**, com identidade tecnológica e navegação inspirada em sistema operacional. Demonstrará a capacidade técnica por meio da própria experiência, ao mesmo tempo em que facilitará o acesso ao conteúdo para públicos igualmente importantes: recrutadores, empresas e desenvolvedores. A experiência para celular será desenhada de forma distinta do desktop, com funcionalidades e identidade compartilhadas. Haverá boot breve e, na primeira visita, apresentação resumida não coercitiva feita pelo assistente Wally. O produto será bilíngue (pt-BR/inglês), combinando utilidade com interatividade. A primeira versão deverá ser completa em relação ao escopo que vier a ser aprovado, sem impedir expansões.

### 3.3 Revisão de consistência e resolução de ambiguidades

- **DEC-002 × DEC-016:** não há conflito: elementos experimentais são permitidos, mas o posicionamento central continua sendo portfólio profissional.
- **DEC-008, 009 e 015:** complementares; equilíbrio funcional e visual com igual consideração pelos três públicos, sem inventar uma ordem de prioridade.
- **DEC-010 × DEC-014:** compatíveis; a janela de boas-vindas apresenta o sistema, sem impor um fluxo guiado obrigatório.
- **DEC-011 × DEC-018:** estética e qualidade técnica precisam coexistir; trade-offs quantitativos e critérios de aceite ainda não foram aprovados.
- **DEC-001 × DEC-004:** reconstruir do zero é compatível com usar a mesma stack-base da V1.
- **DEC-017 × proibição de implementação antecipada:** completude da versão inicial será definida antes de executar qualquer etapa prática; expansões futuras não podem servir de justificativa para omissões no escopo aprovado.
- **DEC-013:** `WS OS V2` pode designar internamente a iniciativa/documentação, mas a marca exibida ao visitante será `WS OS`.
- **DEC-012:** compromisso com dois idiomas, sem deduzir implementação de i18n específica.

**Resultado da revisão:** zero contradições materiais nas 18 decisões; complementos do usuário incorporados em DEC-010, DEC-018 e metodologia da DEC-006. Nenhuma nova decisão proposta foi promovida a aprovada.

### 3.4 Critérios de encerramento do Bloco 01

- [x] Relação com a V1 e posicionamento definidos.
- [x] Público-alvo, objetivo e direção visual definidos.
- [x] Identidade nominal e suporte conceitual a idiomas definidos.
- [x] Diretriz de primeira visita e livre navegação definidas.
- [x] Princípios gerais de funcionalidades, evolução e qualidade definidos.
- [x] Revisão de consistência concluída.
- [x] Decisões registradas com dependências sem inventar detalhamentos.

**Conclusão:** Bloco 01 encerrado. Detalhamento de pontos dependentes ocorrerá nos blocos temáticos, sem reabrir B01 salvo mudança explícita de decisão.

---

## 3.5 Bloco 02 — Estrutura e experiência do sistema

**Estado:** CONCLUÍDO em 12/10/2026 após DEC-088, revisão das decisões e delegação explícita dos critérios técnicos de responsividade.
**Escopo:** Desktop, atalhos, grade compartilhada, widgets, WS Menu, Taskbar, janelas, painéis, navegação e experiência Mobile.
**Nota de governança:** diretrizes de comportamento aprovadas não substituem especificações futuras de Design System, Core, autenticação, catálogo de apps, Wally e implementação.

### 3.5.1 Registro integral das decisões

| ID | Definição aprovada |
|---|---|
| DEC-019 | B — Desktop moderno com ícones, janelas, Taskbar, widgets e áreas personalizáveis |
| DEC-020 | B — Mobile próprio com tela inicial, aplicativos e navegação contextual |
| DEC-021 | B — Janelas avançadas com organização, encaixe e gerenciamento de múltiplas janelas |
| DEC-022 | B — Personalização intermediária de temas, wallpapers e aparência, sem comprometer funcionalidades |
| DEC-023 | C — Acesso por Desktop, WS Menu, busca integrada ao WS Menu e atalhos entre aplicativos |
| DEC-024 | B — Aplicativos compartilhados, com adaptações de interação e funcionalidades por plataforma |
| DEC-025 | B — Ícones reorganizáveis com alinhamento em grade |
| DEC-026 | B — Abrir atalhos do Desktop com duplo clique |
| DEC-027 | B — Seleção individual, múltipla e por área de seleção |
| DEC-028 | B — Menu contextual no Desktop e nos ícones |
| DEC-029 | A — Um único Desktop, com ícones e widgets |
| DEC-030 | C — Widgets reposicionáveis, redimensionáveis e configuráveis |
| DEC-031 | B — Persistência das posições dos ícones no navegador |
| DEC-032 | B — Organização manual com opção de ordenação automática |
| DEC-033 | B — Menus contextuais com ações por elemento |
| DEC-034 | B — Apenas aplicativos selecionados possuem atalhos padrão; demais no WS Menu quando aplicável |
| DEC-035 | B — Configuração no widget e gestão central em Configurações |
| DEC-036 | A — Ícones e widgets ocupam o mesmo espaço e a mesma grade |
| DEC-037 | Seleção personalizada — 12 atalhos padrão: Sobre Mim, Projetos, Dev Insights, Currículo, Certificados, Contato, Notas, Arquivos, Jogos, Terminal, Configurações e Sobre o Sistema; ordem não definida |
| DEC-038 | A — Distinguir Aplicativos Desktop, Aplicativos de Sistema e Funcionalidades |
| DEC-039 | B — Apps de sistema acessíveis pelo WS Menu quando apropriado, ou somente por ações específicas |
| DEC-040 | A — O visitante pode reorganizar os 12 atalhos, mas não adicionar nem remover |
| DEC-041 | A — WS Menu com lista única alfabética |
| DEC-042 | A com ressalva explícita — Não separar nem exibir categorias no WS Menu (observação posterior prevalece sobre alternativa) |
| DEC-043 | C — Busca contextual por apps, projetos, conteúdo, configurações e ações |
| DEC-044 | B com complemento — Administração oculta de visitantes; recursos administrativos aparecem após login no Terminal, com controle efetivo de autorização |
| DEC-045 | A — Clique simples no WS Menu abre app e fecha menu |
| DEC-046 | C — WS Menu exibe recentes e favoritos configuráveis, complementares à lista alfabética |
| DEC-047 | C — Taskbar flutuante, aparência adaptável |
| DEC-048 | A — Área de apps da Taskbar mostra somente apps abertos |
| DEC-049 | B — Múltiplas janelas do app agrupadas em um botão |
| DEC-050 | A — Clique foca/restaura; novo clique na janela já ativa minimiza |
| DEC-051 | B com especificação — Taskbar: [WS MENU] | [APPS ABERTOS] | [NOTIFICAÇÕES] [CONTROLE] [WALLY] | [CLIMA] [DATA/HORA] |
| DEC-052 | B — Taskbar visível por padrão, ocultação automática opcional |
| DEC-053 | A — Taskbar flutuante ancorada na borda inferior em posição fixa |
| DEC-054 | B — Clique usa última janela ativa; prévias selecionam outras instâncias |
| DEC-055 | C — Rolagem horizontal apenas na região de apps abertos |
| DEC-056 | B — Indicadores distintos de aberto, ativo e minimizado |
| DEC-057 | C — Prévias com miniaturas e ações rápidas, incluindo fechar |
| DEC-058 | A — Somente um painel da Taskbar aberto por vez |
| DEC-059 | A — Ícone usa uma célula, widget pode usar múltiplas células contíguas |
| DEC-060 | C — Realocar automaticamente quando possível; bloquear sem espaço |
| DEC-061 | A — Widgets redimensionados entre tamanhos predefinidos (ex. P/M/G) |
| DEC-062 | B — Persistir posição, tamanho, visibilidade e preferências dos widgets |
| DEC-063 | B — Organização automática cobre ícones e widgets |
| DEC-064 | A — Bloquear inclusão de elemento se grade estiver cheia |
| DEC-065 | B — Política de instância única ou múltipla configurável por aplicativo |
| DEC-066 | B — Encaixe em metades, quadrantes e layouts predefinidos |
| DEC-067 | B — Permitir janela parcialmente fora da tela, mantendo título acessível |
| DEC-068 | B com observação — Maximizada ocupa toda a tela, pode sobrepor Taskbar, respeitando borda definida |
| DEC-069 | A com observação — Minimizar preserva estado, posição e dimensões; fechar encerra instância sem preservar geometria |
| DEC-070 | A — Recarregar não restaura janelas, apenas preferências e dados persistentes |
| DEC-071 | A — Notificações recentes, visualizar e dispensar |
| DEC-072 | A — Notificações somente durante a sessão atual |
| DEC-073 | B — Painel de controle com aparência, som, efeitos e preferências relevantes |
| DEC-074 | C — Wally no Desktop via painel rápido e aplicativo completo |
| DEC-075 | C — Clima resumido na Taskbar e painel de previsão detalhada |
| DEC-076 | A — Painéis fecham ao clicar fora, Escape ou abrir outro |
| DEC-077 | C — Mobile inicia com informações profissionais em destaque e acesso aos aplicativos |
| DEC-078 | B — Apps Mobile em tela cheia, exceto painéis e ações rápidas |
| DEC-079 | A — Barra de navegação inferior de início e aplicativos |
| DEC-080 | A — Um aplicativo Mobile visível ativo por vez; sair encerra visualização |
| DEC-081 | C — Preferências visuais e organização independentes Desktop/Mobile |
| DEC-082 | A — Wally no Mobile somente como aplicativo |
| DEC-083 | A — Alternância de interface pela área disponível, preservando dados persistentes |
| DEC-084 | A — Tela inicial Mobile profissional fixa, sem rearranjo |
| DEC-085 | B — Apps principais na tela inicial e catálogo completo pela navegação |
| DEC-086 | A — Painéis Mobile sobrepostos ao app, sem encerrá-lo |
| DEC-087 | B — Persistir preferências visuais, organização aplicável e dados autorizados de apps |
| DEC-088 | B — Ao sair de app Mobile, retornar à origem (início ou catálogo) |

### 3.5.2 Revisão de consistência e precedência

- **DEC-041/042/046:** menu sem categorias visuais, com lista principal alfabética e zonas complementares de recentes/favoritos. A classificação interna DEC-038 não impõe agrupamento no menu.
- **DEC-034/037/040:** 12 atalhos fixos em composição, reorganizáveis em posições; seleção não implica que funcionalidades individuais dos aplicativos estejam aprovadas.
- **DEC-030/036/059/060/061/063/064:** grade única, widgets com múltiplas células contíguas e tamanhos discretos; realocação sujeita a disponibilidade e prevenção de colisões.
- **DEC-047/052/053/068:** Taskbar flutuante e inferior, visível por padrão (auto-ocultar opcional), podendo ser sobreposta por janela maximizada, respeitada a borda de maximização a especificar.
- **DEC-049/050/054/057/065:** agrupamento por aplicativo com múltiplas instâncias conforme política individual; clique foca/restaura a última janela ativa, prévias selecionam as demais e novo clique minimiza a janela ativa.
- **DEC-069/070:** minimizar preserva estado/posição/tamanho na sessão; fechar descarta geometria da instância; recarregar não reabre janelas.
- **DEC-071/072/076:** notificações são temporárias na sessão; painéis são mutuamente exclusivos e dispensáveis.
- **DEC-074/082:** Wally no Desktop tem painel + aplicativo; no Mobile somente aplicativo. Boas-vindas no primeiro acesso (DEC-010) permanece requisito próprio, não confundir com atalho persistente.
- **DEC-080/086:** sobreposições Mobile não contam como um segundo aplicativo ativo.
- **DEC-081/084/087:** preferências visuais entre dispositivos independentes; tela inicial Mobile fixa. “Persistir organização” aplica-se exclusivamente onde a organização for configurável, não cria permissão para rearranjar a tela inicial.
- **DEC-083 e DEC-069/070:** ao cruzar tamanhos de interface, manter dados autorizados; transição não constitui restauração obrigatória de janelas Desktop nem exige preservar visualização Mobile.

### 3.5.3 Diretrizes técnicas de responsividade delegadas

O usuário delegou a seleção técnica de responsividade e adaptação Mobile, **não mudanças de escopo funcional**. Ficam estabelecidas para orientar a engenharia:

1. Adaptação pela largura **útil do container e viewport**, com `CSS Grid`, Flexbox, media/container queries quando adequadas e unidades fluidas; evitar inferir dispositivo exclusivamente por user-agent.
2. Definir pontos de quebra **pelas necessidades reais do conteúdo**, aferidos em protótipos e testes; valores numéricos não são requisitos imutáveis neste momento.
3. Preservar a experiência Mobile própria e Desktop própria aprovadas; tablet e janelas estreitas recebem a experiência que couber sem rolagem horizontal global.
4. Mudanças de tamanho e orientação não podem ocultar controles essenciais, causar colisões permanentes ou descartar dados persistentes. A grade Desktop precisa reacomodar elementos de forma determinística e reversível quando o espaço variar.
5. Suportar ponteiro, toque e teclado conforme contexto, sem depender de hover para ações essenciais; respeitar zoom, foco visível, áreas de toque adequadas e preferência de movimento reduzido.
6. Testar telas pequenas, intermediárias e grandes, orientação vertical/horizontal, teclado virtual, zoom e redimensionamento contínuo; transições não devem produzir travamentos perceptíveis.
7. Regras exatas de transição de estado em mudança de modo, dimensionamento da grade, métricas e testes automatizados serão detalhadas nos blocos técnicos, sem reabrir decisões de produto.

### 3.5.4 Pendências encaminhadas para blocos específicos

- Catálogo completo e comportamento de todos os aplicativos, inclusive Administração, Sistema e Wally; existência de atalhos não define escopo funcional.
- Contratos de autenticação administrativa, autorização de API, login no Terminal e segurança.
- Visual final, dimensões da borda, espaçamento de grade, tamanhos concretos de widgets, ícones, painéis e acessibilidade visual.
- Persistência técnica, política de armazenamento, dados temporários e sincronização Desktop/Mobile.
- Máquina de estados do gerenciador de janelas, encaixes, instâncias, snapshots de prévia e tratamento de alterações de viewport.
- Critérios quantitativos de desempenho/responsividade, testes, estratégia de implementação e commits — todos obrigatórios antes de programar.

**Conclusão de B02:** decisões de produto e UX estrutural concluídas, sem conflitos materiais. Pendências são especificações subordinadas a blocos próprios, não autorizações tácitas. Nenhum trabalho de implementação está autorizado.

---

## 3.6 Bloco 03 — Catálogo e responsabilidades

**Estado:** CONCLUÍDO após DEC-127 e esclarecimento explícito da DEC-125.
**Escopo:** inventário, classes exclusivas, finalidades, relações, permissões conceituais e dependências.
**Limites:** decisões não especificam layouts, fornecedores definitivos, credenciais, esquemas de dados, contratos técnicos ou arquivos de implementação.

### 3.6.1 Catálogo canônico

**Aplicativos Desktop (12; atalhos fixados, ordem configurável):** Sobre Mim; Projetos; Dev Insights; Currículo; Certificados; Contato; Notas; Arquivos; Jogos; Terminal; Configurações; Sobre o Sistema.

**Aplicativos de Sistema (6):** Visualizador de Arquivos; Editor de Arquivos; Calculadora; Visualizador de Demos; Wally Estendido; Administração.

**Funcionalidades (inventário aberto):** gerenciador de janelas, Taskbar, WS Menu e busca global, central de notificações, painel de controle rápido, clima, inicialização e boas-vindas, sistema de widgets, temas, idiomas, atalhos de teclado, menus contextuais, persistência local, sons, autenticação/permissões, blur, transparência, animações e calendário da Taskbar. Não são necessariamente apps nem janelas independentes.

**Critério de classificação:** exclusividade por função principal, não pela possibilidade de abrir janela. Um app Desktop pode oferecer operações que dependam de um app de Sistema; sua classificação não muda por isso. Um app de Sistema pode constar no WS Menu conforme política individual. Novos itens só entram no catálogo por decisão explícita.

### 3.6.2 Registro integral de decisões

| Decisão | Conteúdo aprovado e observações prevalentes |
|---|---|
| DEC-089 | B — Cada aplicativo pertence a uma única classe segundo sua função; os 12 aplicativos principais são Desktop e os auxiliares que atendem outros são de Sistema. |
| DEC-090 | C — Catálogo Desktop constituído pelos 12 aplicativos escolhidos; não importar automaticamente apps da V1. |
| DEC-091 | B — Apps de Sistema úteis são elegíveis mesmo sem vínculo direto com o portfólio. |
| DEC-092 | A + observação — Neste bloco definir finalidade, classe e recursos principais; detalhes visuais serão tratados posteriormente na prática, respeitando requisitos técnicos pré-implementação. |
| DEC-093 | B — Catálogo compartilhado entre Desktop e Mobile, com exceções justificadas. |
| DEC-094 | B — Implementação por dependências e etapas verificáveis, após planejamento integral. |
| DEC-095 | Personalizada — Sistema: Visualizador de Arquivos, Editor de Arquivos, Calculadora, Visualizador de Demos, Wally Estendido e Administração; futuras inclusões exigem aprovação. |
| DEC-096 | Personalizada — Funcionalidades evolutivas: janelas, Taskbar, WS Menu/busca, notificações, controles, clima, boot/boas-vindas, widgets, temas, idiomas, atalhos, menus de contexto, persistência, sons, autenticação/permissões, blur, transparência e animações; novidades futuras sob controle de decisões. |
| DEC-097 | B — Sobre Mim: apresentação pessoal e profissional com trajetória, habilidades, interesses e informações. |
| DEC-098 | C + observação — Projetos: catálogo avançado, GitHub, filtros, detalhes e demos; cada projeto abre sua própria janela, liga ao repositório e destaques devem ter demonstração adequada dentro da WS OS. |
| DEC-099 | C + observação — Dev Insights: tecnologias, histórico, atividades, indicadores e gráficos; integrar GitHub e WakaTime. |
| DEC-100 | A — Currículo: visualização em PDF e download. |
| DEC-101 | C — Certificados: formação complementar, certificados, cursos, conquistas, filtros e documentos. |
| DEC-102 | C + observação — Contato: formulário, canais LinkedIn/GitHub/Discord/WhatsApp, EmailJS e solicitações/agendamentos; calendário da Taskbar vinculado a eventos públicos. |
| DEC-103 | A com observação prevalente — Notas é plataforma de publicações tipo blog, com anexos opcionais; visitantes leem e podem curtir, administração gerencia. |
| DEC-104 | C com restrição — Arquivos: sistema virtual integrado; visitante pode manipular apenas sua pasta pessoal, ficando em leitura nas pastas oficiais. |
| DEC-105 | C com catálogo — Jogos: Snake, Paciência, Jogo da Memória, Flappy Bird, Campo Minado e DOOM; tema tecnológico quando viável; pontuações/rankings. |
| DEC-106 | C — Terminal extensível, integrado a apps e comandos privilegiados sujeitos à autorização. |
| DEC-107 | C — Configurações centraliza preferências, personalização e ferramentas de gerenciamento permitidas. |
| DEC-108 | C — Sobre o Sistema: versão, arquitetura resumida, créditos, histórico e dados técnicos. |
| DEC-109 | A — Notas publicadas são públicas; rascunhos não publicados não são conteúdo público. |
| DEC-110 | A — Todas as publicações permitem curtidas. |
| DEC-111 | A — Pasta pessoal do visitante armazenada somente em seu navegador. |
| DEC-112 | B — Administrador gerencia arquivos oficiais e a própria área administrativa; não tem acesso automático aos arquivos locais dos visitantes. |
| DEC-113 | B — Jogos compatíveis têm recordes locais e ranking global; banco simples online (Supabase/Firebase) é preferência, não fornecedor aprovado. |
| DEC-114 | A com correção — Calendário na Taskbar mostra apenas eventos cadastrados e feriados, NÃO rotina pessoal; agendamento pelo Contato a detalhar. |
| DEC-115 | B — Visualizador universal: formatos compatíveis, navegação, zoom, informações e download. |
| DEC-116 | B — Editor: textos e outros formatos compatíveis, ferramentas específicas por formato. |
| DEC-117 | B — Calculadora: modo básico e científico. |
| DEC-118 | B — Demos: estratégias de demonstração adequadas à tecnologia; aspirar ampla cobertura sem prometer executar nativamente todo projeto no navegador. |
| DEC-119 | C + observação — Wally é mascote e assistente avançado, conhece conteúdo público autorizado sobre o autor e pode realizar ações permitidas; Gemini é candidato. |
| DEC-120 | C — Administração gerencia aplicativos, conteúdos, configurações e operações administrativas permitidas. |
| DEC-121 | B — Visualizador de Demos híbrido: execução no navegador, serviços externos e simulações explicitamente identificadas. |
| DEC-122 | B — Wally híbrido: conhecimento local, API de IA opcional e fallback sem IA. |
| DEC-123 | B — Comunicação entre aplicativos por serviços e contratos definidos. |
| DEC-124 | B — Cada app de Sistema determina acesso pelo WS Menu ou somente por fluxos de outros apps. |
| DEC-125 | A (esclarecimento posterior) — Todos os apps, exceto Administração, têm abertura pública; operações privilegiadas em qualquer app exigem autorização real. |
| DEC-126 | B — Novas inclusões mediante aprovação e atualização de dependências. |
| DEC-127 | B — Falhas de serviços externos não devem paralisar funcionalidades independentes; apresentar alternativas quando possível. |

### 3.6.3 Dependências conceituais

| Origem | Serviços e/ou aplicativos relacionados |
|---|---|
| Projetos | catálogo GitHub, janelas de detalhes, Visualizador de Demos; arquivos quando aplicável |
| Dev Insights | GitHub, WakaTime, gráficos e dados verificáveis |
| Currículo e Certificados | Visualizador universal e documentos autorizados |
| Contato e Calendário | EmailJS e solicitação/agendamento; calendário apenas de eventos cadastrados e feriados |
| Notas | publicações, anexos, curtidas e operações editoriais autenticadas |
| Arquivos | pasta pessoal local isolada, arquivos oficiais somente leitura, Editor e Visualizador |
| Jogos | pontuações locais e rankings remotos opcionais por jogo; provedor ainda não escolhido |
| Terminal | registro de comandos, serviços, autorização para comandos privilegiados |
| Wally | base pública sobre autor/WS OS, ferramentas de ações permitidas, API de IA opcional com fallback |
| Administração | autenticação e autorização efetivas, serviços administrativos de conteúdo e sistema |

### 3.6.4 Revisão de consistência

- **DEC-089 vs DEC-037:** Configurações e Sobre o Sistema permanecem na classe Desktop porque são parte dos 12 aplicativos principais; o fato de terem caráter sistêmico não implica dupla classificação.
- **DEC-090 vs histórico V1:** escopo do novo catálogo definido neste ciclo; jogos e apps antigos só existem se incluídos nominalmente aqui.
- **DEC-092 vs DEC-006:** detalhamento visual/disposição poderá ser decidido durante implementação, conforme manifestação posterior do usuário, **mas** arquitetura, requisitos essenciais, dependências, testes, estágios e commits continuam obrigatórios antes da prática. Não tratar liberdade de refinamento visual como autorização para começar a implementar.
- **DEC-103 vs alternativa A originalmente descrita:** a observação do usuário prevalece; Notas é blog de publicações, não editor livre de anotações para visitantes.
- **DEC-104/111/112/125:** área pessoal é local ao navegador e manipulável pelo visitante; arquivos oficiais são protegidos. Administração não obtém acesso aos arquivos privados locais de terceiros.
- **DEC-109/110:** toda nota efetivamente publicada é pública e curtível, sem implicar publicação automática de rascunhos.
- **DEC-114:** correção posterior revoga referência a rotina pessoal; apenas feriados e eventos cadastrados podem aparecer no calendário.
- **DEC-118/121:** experiência universal de demonstrações, mas mecanismos distintos por tecnologia, e simulações claramente rotuladas. Não há garantia física de executar qualquer executável de forma nativa no browser.
- **DEC-119/122:** Gemini é opção de avaliação, não provedor contratado; funcionamento essencial não pode depender exclusivamente da IA.
- **DEC-125 esclarecida:** abertura livre de apps (exceto Administração) não significa autorização irrestrita de modificar dados oficiais nem executar comandos privilegiados. Backend e operações sensíveis exigem validação de permissão, independentemente da UI.
- **DEC-124/044:** a visibilidade administrativa é condicionada ao login no Terminal, mas a real autorização não se reduz à visibilidade do menu.
- **DEC-127:** dados simulados não podem ser apresentados como reais em falhas de provedores externos.

**Resultado:** nenhum conflito material remanescente dentro do escopo de B03. Especificações dependentes foram encaminhadas sem aprovação tácita.

### 3.6.5 Pendências direcionadas a blocos futuros

1. Selecionar serviços e arquitetura de armazenamento/publicação, rankings, contatos/agendamentos, eventos, anexos e curtidas; custos e políticas antiabuso.
2. Definir formatos do Visualizador universal e Editor, limites de arquivos e isolamento local.
3. Especificar autenticação pelo Terminal, sessões, autorização de operações administrativas, proteção das APIs e ações do Wally.
4. Especificar execução segura de demos, compatibilidade de runtimes, hospedagem e rótulo de simulação.
5. Avaliar licença e abordagem de jogos com nomes/marcas existentes, especialmente DOOM e Flappy Bird, sem pressupor uso de material protegido.
6. Fixar visibilidade individual dos 6 aplicativos de Sistema no WS Menu e exceções justificadas no Mobile.
7. Detalhar os contratos técnicos de serviços entre apps, sem permitir acesso indiscriminado.
8. Registrar critérios de UX, desempenho, testes, roadmap de implementação e commits antes de iniciar código.

**Critérios de conclusão B03:** 12+6 aplicativos inventariados; finalidade de todos os apps descrita; funcionalidades evolutivas registradas; permissões harmonizadas; dependências mapeadas; pendências encaminhadas. **Bloco encerrado.**

---

## 3.7 Bloco 04 — Arquitetura e núcleo do sistema

**Estado:** CONCLUÍDO — DEC-128 a DEC-155 aprovadas, incluindo revisão explícita da DEC-135.
**Escopo:** Core, estado, registro de apps, serviços, ciclo de vida, persistência, autorização, desempenho, falhas e testabilidade.

### 3.7.1 Registro de decisões

| ID | Definição aprovada |
|---|---|
| DEC-128 | B — Core modular com gerenciadores especializados e contratos definidos. |
| DEC-129 | B — Estado híbrido: React para estados locais e solução centralizada para estados globais. |
| DEC-130 | B — Registro central de apps com metadados, permissões, capacidades e configurações. |
| DEC-131 | B — Comunicação entre apps por serviços e ações com contratos definidos. |
| DEC-132 | B — Carregamento sob demanda; somente recursos essenciais na inicialização. |
| DEC-133 | B — Isolamento de falhas por aplicativo e tratamento global complementar. |
| DEC-134 | B — Gerenciador próprio de janelas com atualizações seletivas e isolamento dos apps. |
| DEC-135 | B (REVISADA; C substituída) — Aplicativos minimizados preservam estado e tarefas necessárias, com pausa seletiva de atividades custosas. |
| DEC-136 | B — Animação de fechamento e, depois, desmontagem e limpeza dos recursos da instância. |
| DEC-137 | B — Serviços de persistência compartilhados com separação por aplicativo. |
| DEC-138 | B — Core define contratos de ciclo de vida; cada app gerencia recursos específicos. |
| DEC-139 | B — Reiniciar app com falha sem reiniciar todo o WS OS. |
| DEC-140 | B — Ações por contratos definidos, serviços intermediários e eventos apenas quando necessários. |
| DEC-141 | B — localStorage para preferências simples e IndexedDB para dados estruturados/arquivos. |
| DEC-142 | B — Configurações globais do sistema e particulares por aplicativo. |
| DEC-143 | B — Serviços por provedor, cache, tratamento de erros e deduplicação de requisições. |
| DEC-144 | B — Interfaces estáveis e versionamento de mudanças incompatíveis quando necessário. |
| DEC-145 | B — Autorização centralizada, com verificação efetiva em operações protegidas. |
| DEC-146 | B — Isolamento lógico de estados e recursos; comunicação por interfaces autorizadas. |
| DEC-147 | B — Atualizações locais eficientes durante interações, com sincronização seletiva. |
| DEC-148 | B — Inicializar serviços essenciais; demais conforme demanda. |
| DEC-149 | B — Logs técnicos controlados sem dados sensíveis. |
| DEC-150 | B — Arquitetura testável com testes automatizados e de integração. |
| DEC-151 | B — ID único por instância associado ao aplicativo. |
| DEC-152 | B — Gerenciador compartilhado coordena painéis e exclusividade. |
| DEC-153 | B — Wally utiliza ações/serviços sujeitos às mesmas autorizações dos demais apps. |
| DEC-154 | B — Se houver falha de persistência, preservar operação viável e comunicar limitações. |
| DEC-155 | B — Desligar/reiniciar sob controle do Core, liberar recursos e preservar apenas dados persistentes. |

### 3.7.2 Revisão de consistência e implicações

- **Core modular sem fragmentação excessiva (DEC-128, 130, 138):** separar responsabilidades efetivas, não criar arquivos/camadas artificiais. Registro central declara capacidades e políticas dos aplicativos; regras de negócio continuam nos módulos correspondentes.
- **Estado eficiente e gerenciamento de janelas (DEC-129, 134, 147, 151):** manter estados locais quando possível. Arraste/redimensionamento não deve rerenderizar todo o Desktop a cada movimento. Cada instância recebe ID próprio e o agrupamento na Taskbar continua por aplicativo, conforme B02.
- **Ciclo de vida (DEC-135, 136, 138, B02 DEC-069/070):** minimizar conserva posição, dimensões e estado; atividades dispensáveis podem ser pausadas seletivamente, enquanto operações necessárias continuam. Fechar desmonta após transição e limpa recursos; reiniciar não restaura janelas automaticamente.
- **Histórico da DEC-135:** escolha original C (suspensão automática) foi explicitamente **SUBSTITUÍDA** pela B (pausa seletiva), mediante confirmação posterior. Não se deve tratar C como ainda vigente.
- **Persistência (DEC-137, 141, 142, 154):** serviço compartilhado delimita espaços por app e atende preferências simples com localStorage e dados/arquivos com IndexedDB. Falhas ou limites de cota devem ser tratados e comunicados. Nenhum dado privado dos visitantes é implicitamente enviado ao servidor.
- **Serviços e contratos (DEC-131, 140, 143, 144):** evitar dependências diretas entre estados internos dos apps; serviços por provedor controlam cache, requisições concorrentes e erros. Contratos conceituais em JavaScript não obrigam migrar para TypeScript; a verificação de payloads sensíveis e fronteiras é requisito técnico futuro.
- **Autorização (DEC-145, 146, 153; B03 DEC-125):** abertura dos apps públicos não equivale a permissão para operações privilegiadas; autorização deve ser validada na operação protegida e, quando aplicável, em servidor seguro. Wally não contorna autorização nem possui privilégios automáticos.
- **Inicialização (DEC-132/148):** boot carrega apenas os serviços essenciais e abre os restantes sob demanda, respeitando a experiência de boas-vindas do Wally aprovada no B01.
- **Painéis e falhas (DEC-133, 139, 152):** gerenciador de painéis aplica exclusividade DEC-058/076; app em falha pode ser reiniciado isoladamente, sem derrubar o restante do sistema.
- **Diagnóstico e qualidade (DEC-149/150):** evitar conteúdo sensível em logs e projetar contratos/serviços testáveis. Critérios quantitativos de desempenho e plano de testes serão definidos antes da implementação.
- **Restart controlado (DEC-155):** estado volátil é eliminado e recursos liberados; somente dados classificados como persistentes sobrevivem. A execução efetiva do fluxo deve ser especificada e testada.

**Conclusão da revisão:** nenhuma contradição material identificada com DEC-001 a DEC-127; DEC-135 corrigida formalmente. Nenhuma nova decisão foi inferida.

### 3.7.3 Pendências para especificações técnicas posteriores

1. Escolher bibliotecas de gerenciamento de estado, testes e validação, sem contrariar a stack React/JavaScript/Vite.
2. Especificar contratos e esquemas de cada gerenciador, serviços, instâncias e barramentos de eventos quando necessários.
3. Definir limites e versões do armazenamento, migrações, cotas, autenticação administrativa e proteção efetiva dos provedores externos.
4. Detalhar limiares de desempenho, critérios de qualidade, testes automatizados e integração, recuperação e logs.
5. Especificar regras de reinício, isolamento de falhas, suspensão seletiva por app e integração do Wally a ações autorizadas.
6. Planejar estrutura física dos arquivos, etapas e commits antes da prática, conforme regra dos blocos anteriores.

**Critério de encerramento B04:** fundamentos e responsabilidades arquiteturais definidos; 28 decisões registradas; decisão substituída rastreada; compatibilidade com UX, catálogo e segurança revisada. Bloco encerrado.

---

## 3.8 Bloco 05 — Estrutura técnica e organização do projeto

**Estado:** CONCLUÍDO — DEC-156 a DEC-179 aprovadas explicitamente.
**Escopo:** organização modular do código, Desktop/Mobile, componentes, estilos, recursos, convenções, documentação, dependências, configurações de ambiente e governança da estrutura.

### 3.8.1 Registro integral de decisões

| Decisão | Definição aprovada |
|---|---|
| DEC-156 | B — Organização híbrida: Core e infraestrutura compartilhados, aplicativos agrupados por funcionalidade. |
| DEC-157 | B — Cada aplicativo em módulo próprio, com divisões internas apenas quando necessárias. |
| DEC-158 | B — Shells distintos para Desktop e Mobile, reutilizando Core, serviços e lógica dos aplicativos. |
| DEC-159 | B — Extrair componentes por responsabilidade, reutilização ou complexidade justificável. |
| DEC-160 | B — Estilos globais para fundamentos visuais; estilos específicos próximos aos módulos. |
| DEC-161 | B — Adotar bibliotecas consolidadas mediante benefício claro e análise de compatibilidade e custo. |
| DEC-162 | B — JavaScript com ESLint, Prettier e convenções documentadas. |
| DEC-163 | B — Nomenclatura consistente para componentes, hooks, funções, constantes, diretórios e arquivos. |
| DEC-164 | B — Interfaces públicas quando necessárias; evitar importar arquivos internos de outros módulos. |
| DEC-165 | B — Hooks específicos junto aos módulos; compartilhar somente os reutilizáveis. |
| DEC-166 | B — Serviços compartilhados separados daqueles específicos de cada aplicativo. |
| DEC-167 | B — Documentar contratos, decisões e fluxos relevantes, sem redundância. |
| DEC-168 | B — Divisão por responsabilidade e complexidade, sem limite arbitrário de linhas por arquivo. |
| DEC-169 | B — Componentes visuais próprios; bibliotecas específicas apenas quando justificadas. |
| DEC-170 | B — Tokens visuais e temas centralizados com variações controladas. |
| DEC-171 | B — Combinar recursos próprios e bibliotecas de ícones consistentes quando necessário. |
| DEC-172 | B — Recursos globais e específicos por app separados de forma proporcional ao uso. |
| DEC-173 | B — Configurações por ambiente, com validação e proteção de informações sensíveis. |
| DEC-174 | B — Estrutura proposta aprovada como base; criar diretórios somente por necessidade real. |
| DEC-175 | B — Core abriga regras e gerenciadores; features abriga funcionalidades específicas do sistema. |
| DEC-176 | B — Promover para shared apenas reutilização consolidada e responsabilidades realmente comuns. |
| DEC-177 | B — Core conhece contratos e metadados; implementação interna dos apps permanece encapsulada. |
| DEC-178 | B — Refatorações justificadas são permitidas, preservando contratos, testes e decisões aprovadas. |
| DEC-179 | B — Avaliar necessidade, manutenção, licença, compatibilidade, peso e segurança das dependências. |

### 3.8.2 Estrutura-base aprovada (não é lista obrigatória de pastas)

```text
ws-os/
├── public/          # Arquivos estáticos que precisem de URL pública
├── src/
│   ├── core/        # Núcleo: regras, registro, contratos e gerenciadores
│   ├── shells/      # Experiências Desktop e Mobile
│   ├── apps/        # Módulos dos 12 aplicativos Desktop e 6 de Sistema
│   ├── features/    # Funcionalidades específicas do sistema fora do Core
│   ├── services/    # Integrações/serviços compartilhados
│   ├── shared/      # Componentes, hooks e utilitários de uso comum comprovado
│   ├── styles/      # Tokens, temas e estilos globais
│   └── assets/      # Recursos importados pela aplicação
└── docs/            # Documentação técnica relevante
```

**Regra vinculante da DEC-174:** esta árvore é uma *base de referência*, não autorização ou exigência de criar antecipadamente todos os diretórios e arquivos. Novas pastas surgem quando a complexidade justificar. Cada app mantém estrutura proporcional ao seu escopo (DEC-157); não padronizar subpastas vazias. Nomes definitivos dos caminhos poderão ser refinados na preparação da implementação sem mudar limites arquiteturais aprovados.

### 3.8.3 Limites e políticas de organização

- **Core × shells × apps × features (DEC-156, 158, 175, 177):** Core define contratos, registro, ciclo de vida, regras e gerenciadores; shells entregam UX distinta para Desktop e Mobile; apps encapsulam implementação; features agregam capacidades sistêmicas específicas. A mesma lógica compartilhada não deve ser duplicada nas experiências.
- **Módulos e interfaces (DEC-164, 176):** não importar livremente arquivos privados de outros módulos. Expor superfície pública quando a integração justificar, sem obrigar arquivo `index.js` em todo diretório. `shared` não é destino automático de qualquer código usado duas vezes; promover apenas abstrações comuns consolidadas.
- **Componentes, hooks e serviços (DEC-157, 159, 165, 166, 168):** separar quando a responsabilidade, reutilização, testes, rendimento ou compreensão justificarem. Não impor limite arbitrário de linhas nem um arquivo por detalhe visual.
- **Padrão JavaScript (DEC-004, 162, 163):** React + JavaScript + Vite permanecem fixos. ESLint, Prettier e convenções de nomenclatura serão configurados na implementação; não há aprovação de migração para TypeScript.
- **Visual (DEC-160, 169–172):** identidade própria, tokens e temas centralizados, módulos com estilos locais, biblioteca visual auxiliar somente quando justificada. Separar recursos globais e recursos dos aplicativos e evitar cópias desnecessárias.
- **Dependências (DEC-161, 179):** adicionar bibliotecas apenas após analisar ganho funcional, manutenção, licença, compatibilidade, tamanho, segurança e custos. Nenhuma biblioteca além das explicitamente aprovadas tornou-se autorizada automaticamente.
- **Ambientes (DEC-173):** separar desenvolvimento e produção e validar configurações. Variáveis incluídas no bundle Vite são públicas ao navegador; chaves privadas e autorização real exigem serviços protegidos. A decisão não cria infraestrutura backend por si só.
- **Documentação (DEC-167):** manter contratos, decisões arquiteturais e fluxos importantes claros, sem duplicar explicações óbvias no código.
- **Evolução (DEC-178):** reorganizar código apenas com justificativa e verificação de impacto; preservar contratos, testes e decisões anteriores.

### 3.8.4 Revisão de consistência e pendências

**Conflitos impeditivos:** nenhum identificado.

1. **DEC-174 × DEC-156:** a árvore exemplifica a organização híbrida; não impõe pastas vazias nem contradiz modularidade proporcional.
2. **DEC-175 × DEC-128:** `core/` concentra regras e gerenciadores; `features/` concentra comportamentos sistêmicos específicos, evitando um Core monolítico.
3. **DEC-176 × DEC-123/131/164:** reutilização via contratos e interfaces claras, sem acesso indiscriminado a módulos ou dados internos.
4. **DEC-177 × DEC-130:** registro central descreve apps; não assume responsabilidade por implementar UI ou regras internas deles.
5. **DEC-178 × DEC-144:** refatorações e mudanças compatíveis são permitidas; quebras contratuais precisam ser verificadas e versionadas quando necessário.
6. **DEC-179 × DEC-161:** processo de avaliação de bibliotecas reforça adoção seletiva, sem aprovação implícita de ferramentas adicionais.
7. **DEC-173 × DEC-145:** configurações por ambiente não substituem autenticação/autorização de operações privilegiadas.
8. **DEC-158 × DEC-003/024:** Desktop/Mobile independentes na experiência e compartilhados no núcleo e dados autorizados; exceções justificadas permanecem válidas.

**Pendências reservadas para antes da implementação:** configuração exata de lint/format, regras de nome por categoria, seleção concreta de bibliotecas, estratégias de testes e CI, contratos específicos, distribuição real de arquivos, tratamento de segredos/serviços, critérios de aceitação e roadmap detalhado com commits. Não criar código ou instalar pacotes neste momento.

**Critério de encerramento:** estrutura-base, responsabilidades, diretrizes de organização e evolução explicitamente aprovadas (24 decisões) e compatíveis com os blocos anteriores. **Bloco 05 encerrado.**

---

## 3.9 Bloco 06 — Design System e identidade visual

**Estado:** CONCLUÍDO — DEC-180 a DEC-225 aprovadas explicitamente.
**Escopo:** direção estética, tipografia, iconografia, temas e paleta, tokens, componentes, animações, adaptação de desempenho, acessibilidade e critérios de validação visual.

### 3.9.1 Registro das decisões

| ID | Conteúdo aprovado |
|---|---|
| DEC-180 | B — Visual moderno e profissional, com detalhes futuristas e identidade própria. |
| DEC-181 | B — Paleta principal consistente, cores de destaque e variações entre temas. |
| DEC-182 | B — Tema escuro padrão e tema claro disponível. |
| DEC-183 | B — Equilíbrio entre superfícies sólidas, transparência e blur. |
| DEC-184 | B — Cantos moderadamente arredondados e geometria consistente. |
| DEC-185 | B — Identidade visual compartilhada entre Desktop e Mobile, com composições específicas. |
| DEC-186 | B + observação — Nunito Sans na interface; JetBrains Mono em Terminal e conteúdo técnico; preferência inicial por Thin, refinada na DEC-192. |
| DEC-187 | B — Escala consistente de tamanhos, pesos e espaçamentos adaptados a Desktop e Mobile. |
| DEC-188 | B — Ícones funcionais consistentes e identidade própria de cada app. |
| DEC-189 | B — Tokens de espaçamento e dimensões, com exceções justificadas. |
| DEC-190 | B — Profundidade moderada com sombras, bordas e sobreposição. |
| DEC-191 | B — Estados de hover, foco, pressionado, selecionado, desabilitado e carregamento. |
| DEC-192 | B — JetBrains Mono Thin em elementos decorativos; pesos mais legíveis para comandos e informação técnica. |
| DEC-193 | B — Animações fluidas e expressivas em momentos importantes, sem exageros. |
| DEC-194 | B — Níveis de efeitos controlados por contexto e desempenho. |
| DEC-195 | B — Contraste, navegação por teclado, foco visível e redução de efeitos. |
| DEC-196 | B — Adaptar efeitos custosos a capacidades, preferências e condições do dispositivo. |
| DEC-197 | B — Personalizar tema, destaque e intensidade de efeitos dentro de opções controladas. |
| DEC-198 | B — Azul com nuances de ciano como identidade principal; permitir outras cores de destaque. |
| DEC-199 | B — Tema escuro com grafite e escuros azulados, sem preto absoluto predominante. |
| DEC-200 | B — Tema claro com brancos suaves, cinzas frios e superfícies diferenciadas. |
| DEC-201 | B — Cores semânticas consistentes para sucesso, alerta, erro e informação, adequadas a cada tema. |
| DEC-202 | B — Tokens semânticos para texto, superfícies, bordas, destaques e estados, com escalas reutilizáveis. |
| DEC-203 | B — Paleta curada de cores alternativas, preservando contraste e consistência automaticamente. |
| DEC-204 | B — Densidade equilibrada; variantes compactas onde necessárias. |
| DEC-205 | B — Componentes recorrentes padronizados, permitindo componentes específicos por aplicativo. |
| DEC-206 | B — Identidade global consistente, com particularidades visuais por aplicativo. |
| DEC-207 | B — Níveis visuais de Desktop, janelas, painéis, menus, diálogos e sobreposições. |
| DEC-208 | B — Padrões de animação por tipo de interação, coerentes e eficientes. |
| DEC-209 | B — Contraste, foco, teclado, movimento reduzido e legibilidade desde a definição dos componentes. |
| DEC-210 | B — Paleta HEX inicial sujeita à validação visual e ajustes controlados durante prototipação. |
| DEC-211 | B — Escalas-base reutilizáveis, com medidas específicas ajustadas conforme componentes forem detalhados. |
| DEC-212 | B — Níveis semânticos de elevação, blur e opacidade com alternativas de baixo custo. |
| DEC-213 | B — Escala tipográfica responsiva com variantes por função e ajustes justificados. |
| DEC-214 | B — Densidade padrão e compacta quando fizer sentido, respeitando alvos e acessibilidade. |
| DEC-215 | B — Validar paleta e componentes representativos visualmente antes da implementação. |
| DEC-216 | B — Aprovar os HEX apresentados como paleta *inicial*, sujeitos à validação e ajustes controlados. |
| DEC-217 | B — Azul como destaque funcional; ciano como acento tecnológico secundário. |
| DEC-218 | B — Escalas de sucesso, alerta, erro e informação por tema, testadas quanto ao contraste. |
| DEC-219 | B — Escalas-base para espaçamento, raio, tipografia e elevação, com variantes contextuais. |
| DEC-220 | B — Validar ambos os temas em componentes representativos, tamanhos de tela e estados de interação. |
| DEC-221 | B — Referências de espaçamento: 4, 8, 12, 16, 24 e 32 px; exceções justificadas. |
| DEC-222 | B — Raios-base aproximados: 6, 12 e 18 px, ajustáveis conforme o componente. |
| DEC-223 | B — Escala tipográfica apresentada como referência inicial, com validação de legibilidade/responsividade. |
| DEC-224 | B — Níveis semânticos de profundidade por superfícies, bordas, sombras e sobreposições. |
| DEC-225 | B — Validar contraste, teclado, estados, responsividade, movimento reduzido e desempenho em componentes representativos. |

### 3.9.2 Identidade visual e tipografia

- **Princípio:** visual moderno, profissional e tecnológico equilibrado, com identidade própria; não copiar integralmente um SO existente.
- **Tipografia:** Nunito Sans como família principal; JetBrains Mono para Terminal e conteúdo técnico. Peso Thin autorizado em ornamentação, mas comandos, saída e texto técnico legível utilizam pesos mais adequados. Estilos de fonte devem apoiar a hierarquia visual e responsividade.
- **Iconografia:** linguagem consistente e funcional, permitindo identificação própria de aplicativos sem comprometer a coesão.
- **Superfícies:** mistura ponderada de planos sólidos, translúcidos e blur. Cantos moderadamente arredondados. Hierarquia de camadas do Desktop, janelas, painéis, menus, diálogos e sobreposições articulada com o gerenciamento de janelas do Bloco 02.

### 3.9.3 Paleta HEX inicial aprovada — candidatos controlados, não valores finais imutáveis

| Token semântico inicial | Escuro (padrão) | Claro |
|---|---|---|
| `surface.canvas` | `#111925` | `#F3F6FA` |
| `surface.primary` | `#1B2736` | `#FFFFFF` |
| `surface.secondary` | `#26384A` | `#E7EFF7` |
| `text.primary` | `#EBF2FB` | `#172638` |
| `text.secondary` | `#ACBDCD` | `#50647A` |
| `border.default` | `#35465B` | `#D8E2EC` |
| `accent.primary` (azul) | `#378CE4` | `#216CBD` |
| `accent.secondary` (ciano) | `#65CDE1` | `#087E9A` |

**Status correto dos HEX:** aprovados como **paleta inicial sujeita a contraste, testes visuais e ajustes controlados**, não como valores imutáveis nem resultado de uma auditoria de acessibilidade concluída. Azul identifica ações principais e seleção; ciano é acento tecnológico secundário. Paleta alternativa de destaques será curada e validada nos dois temas.

**Cores semânticas ainda a especificar:** sucesso, alerta, erro, informação, variantes de superfície/estado e contraste de cada combinação — a decisão aprovou a política e a obrigação de validação, **não** HEX específicos desses estados.

### 3.9.4 Escalas-base iniciais aprovadas

| Sistema | Referências iniciais aprovadas | Natureza |
|---|---|---|
| Espaçamento | `4`, `8`, `12`, `16`, `24`, `32` px | Escala-base; exceções justificadas |
| Arredondamento | Aproximadamente `6`, `12`, `18` px | Raios-base ajustáveis por função |
| Texto auxiliar | `12–13` px | Referência inicial, requer avaliação de legibilidade |
| Texto principal | `14–16` px | Referência inicial, responsiva |
| Subtítulos | `18–20` px | Referência inicial |
| Títulos | `24–28` px | Referência inicial |
| Destaques especiais | `32` px ou mais | Somente quando houver contexto |
| Profundidade | base, elevado, flutuante, modal | Níveis conceituais; sem valores CSS fixados |
| Densidade | padrão; compacta onde adequada | Nunca sacrificar foco, toque ou leitura |
| Efeitos | níveis semânticos de elevação, blur e opacidade | Intensidades e alternativas leves ainda a calibrar |

Não inferir a aprovação de `line-height`, intervalos de sombra, durações de animações, valores de blur, paleta semântica ou dimensões de cada componente: esses parâmetros precisarão ser prototipados e validados.

### 3.9.5 Aplicação, acessibilidade e desempenho

- Componentes recorrentes são padronizados; componentes específicos de apps podem existir se respeitarem tokens, identidade e contratos. Evitar tanto UI monolítica quanto criação de um arquivo por detalhe.
- Desktop e Mobile compartilham fundamentos, porém adotam composição, densidade e variantes específicas quando adequado.
- Animações seguem padrões por interação, especialmente na abertura/fechamento de janelas e painéis. Respeitar a preferência de movimento reduzido; usar caminhos de renderização eficientes. Não tratar `transform` e `opacity` como garantia automática de desempenho.
- Efeitos custosos, como blur, devem ter alternativas de baixo custo e degradação progressiva quando o dispositivo ou as preferências exigirem.
- Estados de hover, foco, pressionado, seleção, desabilitado e carregamento devem ser perceptíveis. Informação semântica não pode depender apenas de cor.
- Critérios de validação: contraste efetivo, teclado, foco visível, estados, densidade/áreas de toque, leitura, responsividade, movimento reduzido e performance em componentes representativos nos **dois temas**.
- Tema escuro padrão com versão clara; preferências de cor e intensidade controladas. Persistência e adaptações Desktop/Mobile seguem os Blocos 02 e 04.

### 3.9.6 Verificação de consistência e limites

**Resultado:** sem conflitos impeditivos nas DEC-180 a DEC-225 ou com os Blocos 01–05.

1. DEC-180/185 com DEC-003/007/158: identidade global própria, experiências Desktop e Mobile distintas.
2. DEC-183/194/196/208/212 com DEC-134/147: camadas e efeitos ricos, mas seletivos e conscientes dos custos de renderização.
3. DEC-186/192: preferência inicial por Mono Thin **qualificada** por pesos legíveis em conteúdos técnicos; não há obrigação de Thin em todos os textos.
4. DEC-195/209/214/225 com DEC-018: acessibilidade é requisito de projeto e critério de aceite, incluindo variantes compactas.
5. DEC-197/203/216: personalização curada e paleta inicial revisável; não se promete contraste automático sem implementar e testar variantes.
6. DEC-205/206 com DEC-157/159/176: biblioteca de componentes consistente, sem abstrações arbitrárias ou duplicação desnecessária.
7. DEC-210/215/220: aprovações conceituais e referências HEX não dispensam **prototipação e validação visual antes de implementar**; a prototipação é pendência futura, não tarefa já executada.
8. DEC-221–224: escalas-base são ponto de partida, e não dimensões obrigatórias em toda a interface.

**Pendências legítimas para planejamento/prototipação futura:** completar cores semânticas e seus estados, medir contrastes reais, definir conjuntos finais de fontes/pesos com disponibilização apropriada, desenhar componentes representativos, ajustar tokens, coordenar hierarquia de sobreposição, validar temas e Mobile/teclado/movimento reduzido, medir performance, especificar e testar a implementação sem iniciar código antes do planejamento global.

**Conclusão:** 46 decisões explicitamente aprovadas, dependências e ressalvas incorporadas, nenhum conflito impeditivo. **Bloco 06 encerrado.**

---

## 3.10 Bloco 07 — Desktop e componentes estruturais

**Estado:** CONCLUÍDO — DEC-226 a DEC-266 aprovadas explicitamente, inclusive esclarecimento posterior da DEC-251.
**Escopo:** identidade e composição visual do Desktop, Taskbar, WS Menu, janelas, painéis, menus contextuais, feedback, responsividade e acessibilidade, sem reabrir regras funcionais do Bloco 02.

### 3.10.1 Registro das decisões

| ID | Decisão vigente |
|---|---|
| DEC-226 | B — Equilíbrio entre wallpaper, atalhos e widgets, com hierarquia clara. |
| DEC-227 | B — Wallpaper autoral, com formas e iluminação sutis, identidade azul/ciano. |
| DEC-228 | B — Wallpapers predefinidos e opção de imagem personalizada armazenada localmente. |
| DEC-229 | B — Ícones próprios dos apps, rótulos legíveis e realces discretos. |
| DEC-230 | B — Widgets em cartões com superfícies e transparência controladas, respeitando grade e tamanhos. |
| DEC-231 | B — Áreas úteis reservadas; atalhos e widgets na mesma grade. |
| DEC-232 | B — Taskbar flutuante, arredondada, de largura adaptável. |
| DEC-233 | B — Superfície semitransparente, blur moderado, borda sutil e alternativa econômica. |
| DEC-234 | B — Ícones com indicadores de atividade e número de instâncias quando necessário. |
| DEC-235 | B — Destaque sutil do aplicativo ativo com indicador e estados consistentes. |
| DEC-236 | B — Prévias compactas com miniatura, título, estado e ação de fechar. |
| DEC-237 | B — Dimensões legíveis e rolagem horizontal apenas na região dos apps. |
| DEC-238 | B — WS Menu como painel flutuante estruturado e adaptável. |
| DEC-239 | B — Visual do WS Menu coerente com a Taskbar e efeitos controlados. |
| DEC-240 | B — Catálogo único alfabético, com ícones, nomes e indicadores contextuais. |
| DEC-241 | B — Recentes/favoritos compactos e complementares, sem substituir catálogo. |
| DEC-242 | B — Resultados de pesquisa agrupados por tipo, com identificação e ações contextuais. |
| DEC-243 | B — Mouse e teclado, foco visível, seleção clara, fechamento segundo regras dos painéis. |
| DEC-244 | B — Janelas modernas, cantos moderados, profundidade discreta, superfícies temáticas. |
| DEC-245 | B — Barra de título com ícone, título, controles e eventuais ações contextuais. |
| DEC-246 | B — Controles discretos com estados claros e destaque de ações destrutivas. |
| DEC-247 | B — Foco de janela por borda, sombra e intensidade dos elementos. |
| DEC-248 | B — Indicadores/prévias discretas de arraste, redimensionamento e snap, atualizações eficientes. |
| DEC-249 | B — Animações curtas e consistentes de janela, respeitando movimento reduzido/desempenho. |
| DEC-250 | B — Painéis flutuantes com identidade compartilhada e dimensões adaptadas ao conteúdo. |
| DEC-251 | B COM ESCLARECIMENTO POSTERIOR (posição A do esclarecimento) — Todos os painéis abrem acima da Taskbar inferior, centralizados horizontalmente em relação à própria Taskbar, independentemente do botão acionado; ajustar para caber na área visível. Substitui interpretação inicial de alinhamento junto ao controle. |
| DEC-252 | B — Notificações em cartões compactos com origem, conteúdo, horário e ações. |
| DEC-253 | B — Controles rápidos, indicadores de estado e acesso a Configurações detalhadas. |
| DEC-254 | B — Interações rápidas no painel Wally e acesso ao Wally Estendido. |
| DEC-255 | B — Transições curtas, foco e estados acessíveis; apenas um painel aberto. |
| DEC-256 | B — Menus contextuais flutuantes integrados ao Design System, agrupamentos e ícones úteis. |
| DEC-257 | B — Menu abre próximo à interação e se ajusta aos limites visíveis. |
| DEC-258 | B — Estados claros de hover, seleção, multisseleção, arraste e indisponibilidade. |
| DEC-259 | B — Feedback contextual discreto e notificações quando apropriado. |
| DEC-260 | B — Prévias de posição, áreas válidas e impedimentos durante arraste, com animações leves. |
| DEC-261 | B — Foco, teclado e alternativas acessíveis a interações dependentes de arraste. |
| DEC-262 | B — Se painel está aberto, manter Taskbar visível mesmo com auto-ocultação ativada; painel centralizado acima dela. |
| DEC-263 | B — Em espaços reduzidos adaptar dimensões/áreas úteis, preservando legibilidade e apenas organizações válidas. |
| DEC-264 | B — Indicar discretamente ações inviáveis e explicar objetivamente quando necessário. |
| DEC-265 | B — Padrões compartilhados para foco, seleção, arraste, transições e ações destrutivas. |
| DEC-266 | B — Validar temas, dimensões de tela, múltiplas janelas, snap, painéis, seleção, teclado e performance. |

### 3.10.2 Regras consolidadas por componente

**Desktop, wallpaper, atalhos e widgets (DEC-226–231).** Equilíbrio visual entre wallpaper autoral azul/ciano, atalhos fixos e widgets. Atalhos têm ícones próprios, rótulos claros e feedback discreto. Widgets são cartões temáticos com transparência controlada. Uma **única grade compartilhada** acomoda atalhos e widgets; limites e áreas reservadas impedem sobreposição inadequada. Wallpapers alternativos e imagens personalizadas permanecem locais, sujeitos a validação de tipo e cotas de armazenamento. O conjunto fixo de 12 atalhos do Bloco 02 permanece inalterado.

**Taskbar (DEC-232–237).** Barra flutuante inferior, arredondada e adaptável, com tratamento visual leve ou blur moderado conforme capacidade. Aplicativos abertos representados por ícones, estados visuais e contagem de instâncias quando útil. Prévia compacta por instância com título, miniatura, estado e ação de fechar. Rolagem horizontal da região dos aplicativos preserva acesso às demais áreas fixas. Ordem funcional aprovada permanece `[WS MENU] | [APPS ABERTOS] | [NOTIFICAÇÕES] [CONTROLE] [WALLY] | [CLIMA] [DATA/HORA]`.

**WS Menu (DEC-238–243).** Painel flutuante adaptável, visual coerente com Taskbar e acessível por teclado e mouse. Catálogo oficial é **lista única alfabética sem categorias**. Recentes e favoritos ficam em áreas secundárias. Resultados **da busca**, diferentemente do catálogo, podem ser agrupados por tipo. Recursos administrativos ocultos aos visitantes e operações privilegiadas exigem autorização real.

**Janelas (DEC-244–249).** Superfícies temáticas, cantos moderados, bordas e sombras discretas. Barra de título com ícone, nome, controles e espaço para ações contextuais, preservando área de arraste. Estados ativo/inativo visuais, estados claros de botões e feedback discreto de redimensionamento e snap. Transições curtas e acessíveis, sem causar renderizações globais dispendiosas. Snap, limites de arraste, minimização, fechamento, maximização e ciclo de vida permanecem regidos pelos Blocos 02 e 04.

**Painéis (DEC-250–255, 262 e DEC-251 esclarecida).** Painéis flutuantes de dimensões adequadas ao conteúdo, mesma linguagem visual e transições rápidas. Notificações em cartões com origem/conteúdo/horário/ações; Painel de Controle com opções rápidas e acesso a Configurações; Wally oferece interação rápida e acesso ao app completo. **Posicionamento definitivo da DEC-251:** todos os painéis abrem **acima da Taskbar inferior e centralizados horizontalmente em relação à Taskbar**, independentemente do botão acionado. Ajustar dimensões/posição aos limites do espaço visível. Se a Taskbar usa auto-ocultação, ela permanece visível enquanto um painel estiver aberto (DEC-262). O gerenciador mantém um painel aberto por vez. Calendário da data/hora observa as mesmas regras visuais sem incorporar rotina pessoal.

**Menus, feedback e interação (DEC-256–261, 263–266).** Menus contextuais flutuantes e posicionados próximos ao ponto de ativação, com ajuste de bordas. Hover, foco, seleção individual/múltipla, arraste, indisponibilidade e ações destrutivas possuem feedback consistente. Prévia de ocupação de grade não pode comunicar como viável posição bloqueada. Feedback contextual e notificação têm papéis distintos; evitar notificações excessivas. Oferecer operações equivalentes por teclado onde o arraste impediria uso acessível. Em espaços reduzidos, adaptar áreas úteis sem sacrificar legibilidade nem violar ocupação válida da grade.

### 3.10.3 Conciliação e revisão de consistência

**Resultado:** sem conflitos impeditivos detectados com os Blocos 01–06.

- **DEC-251 (registro de precedência):** a alternativa B originalmente aprovada incluía a formulação “próximos aos controles correspondentes”; observação posterior do usuário pediu “centralizados sob a Taskbar”, e ele esclareceu explicitamente **opção A: centralizados horizontalmente acima da Taskbar inferior**. Esta última é a regra vigente, superior à descrição inicial; “sob” não significa renderizar abaixo do limite inferior da tela. Preservar o histórico da interpretação substituída.
- **DEC-250/251/255/262 × B02 DEC-053/058/076:** painel centralizado acima da Taskbar inferior; manter Taskbar visível enquanto painel aberto; exclusividade e regras de fechamento preservadas.
- **DEC-231/260/263 × B02 DEC-036/059/060/064:** grade única com widgets multi-célula; sem colisões ou posicionamento em regiões inválidas; evitar segunda grade apenas para widgets.
- **DEC-234/236/237 × B02 DEC-049/055/057:** agrupamento de instâncias e prévias individuais, com rolagem só da região de apps.
- **DEC-240/242 × B02 DEC-041/042/043:** catálogo alfabético sem categorias; agrupamento somente dos resultados contextuais da pesquisa.
- **DEC-244–249 × B02 DEC-066–070 e B04 DEC-134/135/147:** visual das janelas não altera contratos de ciclo de vida, limites/snap; interações de geometria precisam atualizar somente o necessário.
- **DEC-233/239/249/255 × B06 DEC-193–196/208/209:** blur e transições obedecem acessibilidade e redução de efeitos e devem ter alternativas econômicas.
- **DEC-261/265 × B06 DEC-195/209/225:** foco visível, estados claros, alternativas ao arraste e verificação por teclado.
- **DEC-228 × B04 DEC-141/154:** wallpaper pessoal é local e deve lidar com erro/cota; não pressupor upload remoto.
- **DEC-266:** validação visual/funcional obrigatória em temas, várias dimensões, janelas e snap, painéis, seleção, teclado e desempenho; esses testes estão **planejados**, não executados.

**Pendências de especificação/prototipação futura sem impedir conclusão conceitual:** medidas finais e posicionamento pixel-perfect, protótipos validados, comportamentos em breakpoints extremos, implementação de miniaturas eficiente e privacidade, bateria de testes responsivos e de performance, escolha do tratamento de falhas de armazenamento e detalhamento do visual dos apps. Nenhuma dessas pendências aprova código ou bibliotecas.

**Conclusão:** 41 decisões aprovadas, esclarecimento da DEC-251 reconciliado, inventário visual funcionalmente consistente. **Bloco 07 encerrado.**

---

## 3.11 Bloco 08 — Experiência Mobile

**Estado:** CONCLUÍDO — DEC-267 a DEC-301 explicitamente aprovadas.
**Escopo:** Home Mobile, catálogo e busca, barra inferior, navegação contextual, aplicativos em tela cheia, painéis, gestos, responsividade, persistência e critérios de validação. Mantém os contratos do Bloco 02 e o Design System do Bloco 06.

### 3.11.1 Registro integral de decisões

| Decisão | Definição aprovada |
|---|---|
| DEC-267 | B — Home híbrida com apresentação profissional, atalhos e cartões informativos. |
| DEC-268 | B — Identidade de cores e tipografia compartilhada, com composições próprias para Mobile. |
| DEC-269 | B — Grade dos aplicativos principais com rótulos e espaçamento adequado ao toque. |
| DEC-270 | B — Poucos cartões informativos, priorizando projetos e conteúdo profissional. |
| DEC-271 | B — Variações dos wallpapers WS OS adaptadas à composição vertical. |
| DEC-272 | B — Home de layout profissional fixo, com preferências visuais aprovadas. |
| DEC-273 | B — Barra inferior principal: Início, Aplicativos e Busca; Voltar contextual. |
| DEC-274 | B — Barra inferior refinada com ícones, rótulos e superfícies do Design System. |
| DEC-275 | B — Catálogo em grade com pesquisa destacada e apresentação adequada ao toque. |
| DEC-276 | B — Busca global contextual, resultados organizados e UI específica Mobile. |
| DEC-277 | B — Destaque de ícone e rótulo ativos, foco e estados acessíveis. |
| DEC-278 | B — Navegação contextual dentro dos apps, acesso claro à Home e catálogo sem prejudicar espaço útil. |
| DEC-279 | B — Cabeçalho contextual padronizado com Voltar, identidade do app e ações pertinentes. |
| DEC-280 | B — Navegação compacta dentro dos apps; barra principal para Home, catálogo e busca. |
| DEC-281 | B — Voltar prioriza navegação interna; depois retorna à origem de abertura conforme histórico. |
| DEC-282 | B — Transições curtas e coerentes, respeitando desempenho e movimento reduzido. |
| DEC-283 | B — Ações principais visíveis; secundárias em menus contextuais acessíveis. |
| DEC-284 | B — Preservar estado das instâncias conforme apropriado, gerido pelo Core. |
| DEC-285 | B — Painéis Mobile adaptados à função: folhas inferiores ou sobreposições. |
| DEC-286 | B — Acesso rápido pelo shell na Home e, quando apropriado, dentro dos aplicativos. |
| DEC-287 | B — Notificações temporárias e central consultável com cartões compactos e ações. |
| DEC-288 | B — Gestos intuitivos com alternativas visíveis e acessíveis. |
| DEC-289 | B — Fechar painéis por botão, Voltar, Escape quando aplicável e interação externa adequada. |
| DEC-290 | B — Um painel principal aberto por vez, coordenado pelo shell. |
| DEC-291 | B — Layouts fluidos por área disponível preservando hierarquia, legibilidade e toque. |
| DEC-292 | B — Composição adaptável à orientação horizontal. |
| DEC-293 | B — Respeitar áreas seguras, barras do navegador, recortes e indicadores do dispositivo. |
| DEC-294 | B — Ajustar área visível, rolagem e foco durante teclado virtual/formulários. |
| DEC-295 | B — Troca de shells preserva dados persistentes e estados compatíveis; não restaura janelas. |
| DEC-296 | B — Interações responsivas, carregamento seletivo e redução de efeitos custosos quando necessário. |
| DEC-297 | B — Histórico contextual distingue navegação interna, origem do aplicativo e navegação do shell. |
| DEC-298 | B — Preservar gestos nativos; gestos próprios somente onde não conflitam. |
| DEC-299 | B — Sair da visualização não é fechar instância; preservar estado permitido e liberar recursos no fechamento explícito. |
| DEC-300 | B — Alvos de toque, foco, rótulos, alternativas a gestos e compatibilidade assistiva. |
| DEC-301 | B — Validar larguras, orientações, teclado virtual, áreas seguras, temas, navegação, painéis e desempenho. |

### 3.11.2 Síntese e responsabilidades

- **Home (DEC-267–272):** composição profissional híbrida, grade com apps principais e alguns cartões profissionais. Layout fixo com preferências visuais controladas; wallpapers em composições verticais derivadas da identidade WS OS. Catálogo contém os demais apps, conforme visibilidade aplicável.
- **Navegação principal (DEC-273–278):** Início, Aplicativos e Busca na barra inferior; identidade visual com ícones/rótulos e foco visível. Catálogo em grade, busca global contextual. Dentro de apps, navegação mais compacta sem exigir barra principal constantemente visível.
- **Aplicativos e histórico (DEC-279–284, 297, 299):** apps em tela cheia, com cabeçalho contextual contendo Voltar, identidade e ações aplicáveis; um app principal visível por vez. Voltar consome primeiro histórico interno, depois retorna à origem registrada pela navegação do shell. Aberturas entre apps precisam preservar a origem sem loops. Sair da *visualização* não implica necessariamente destruir instância; fechar explicitamente desmonta/limpa recursos. Suspensão seletiva para apps não visíveis, preservando tarefas indispensáveis.
- **Painéis/gestos (DEC-285–290, 298):** painéis Mobile são folhas inferiores ou sobreposições de acordo com o conteúdo, geridos pelo shell com exclusividade de um painel principal. Controles rápidos disponíveis contextualmente, notificações temporárias e central consultável. Fechamento por controle, Voltar, Escape quando aplicável e fora do painel onde fizer sentido. Gestos personalizados não devem sobrepor funcionalidades nativas do navegador; sempre oferecer alternativas acessíveis. Wally é app no Mobile, não painel permanente de Taskbar.
- **Adaptação (DEC-291–296, 300–301):** experiência fluida de acordo com espaço disponível e orientação, respeitando recortes, áreas seguras e barras do navegador. Teclado virtual não deve esconder campos ou ações indispensáveis. Carregamento seletivo, redução de efeitos e áreas de toque adequadas. Validar telas pequenas e maiores, temas, orientação vertical/horizontal, formulários, foco, tecnologias assistivas, interações e desempenho.
- **Troca Desktop/Mobile (DEC-295):** mudança entre shells conserva dados persistentes e apenas estados de app compatíveis; geometria e instâncias de janelas Desktop não são restauradas automaticamente. Não misturar estado visual de janela com estado de conteúdo.

### 3.11.3 Auditoria de consistência

**Resultado:** nenhum conflito impeditivo nas DEC-267 a DEC-301 com os Blocos 01–07.

1. **DEC-267/272 × B02 DEC-077/084:** Home profissional com layout fixo; elementos respondem ao espaço sem habilitar livre rearranjo pelo visitante.
2. **DEC-268/291 × B01 DEC-003 e B05 DEC-158:** shells diferentes, Core e conteúdos compartilhados conforme contratos; breakpoint baseado em espaço, não no rótulo físico do dispositivo.
3. **DEC-273/278/280 × B02 DEC-078/079:** barra inferior principal para Home/catálogo/busca; cabeçalho e navegação contextual de apps ocupando a tela restante. Não exigem barra persistente completa sobre conteúdo de aplicativos.
4. **DEC-281/297 × B02 DEC-088:** histórico contextual preserva retorno à origem do app; não confundir rota interna com a entrada pelo shell ou de outro app.
5. **DEC-284/295/299 × B02 DEC-065/069/070/080/083 e B04 DEC-135/136:** única visualização principal, estados preservados quando compatíveis, pausa seletiva, fechamento explícito destrói instância; nenhuma restauração automática de janela Desktop.
6. **DEC-285–290 × B02 DEC-086 e B04 DEC-152:** painéis sobrepostos não encerram apps; exclusividade por gerenciador compartilhado; a regra Desktop de centralização acima da Taskbar (DEC-251) **não se aplica** à apresentação dos painéis Mobile.
7. **DEC-287 × B02 DEC-071/072:** central de notificações consultável não implica retenção entre sessões; usar persistência apenas se nova decisão autorizar.
8. **DEC-288/298 × B06 DEC-195/209:** gestos opcionais, compatíveis com navegação nativa e acompanhados de alternativas visíveis.
9. **DEC-291–294/296/300/301 × B06 DEC-196/214/225:** responsividade, desempenho, movimento reduzido e acessibilidade são requisitos de validação, não testes já executados.
10. **DEC-276 × B02 DEC-042/043:** busca global pode agrupar tipos de resultado, mas a listagem de apps Desktop no WS Menu segue sem categorias; organização Mobile em grade não altera a política de registro/visibilidade.

**Pendências de implementação futura:** definir componentes e layouts representativos, estratégia técnica de histórico/rotas, comportamento de gestos e barras de navegador por dispositivo, layouts em diferentes orientações, testes de acessibilidade e desempenho, tamanhos/alvos de toque e verificação das regras de ciclo de vida. Não autoriza código nem aprova novas bibliotecas.

**Critério de encerramento:** 35 decisões aprovadas; revisão de navegação, ciclo de vida, panes, gestos e responsividade sem conflitos impeditivos. **Bloco 08 encerrado.**

---

## 3.12 Bloco 09 — Serviços, integrações e infraestrutura de dados

**Estado:** CONCLUÍDO em 13/10/2026 após aprovação explícita da DEC-354 e revisão final.  
**Escopo:** infraestrutura híbrida, provedores, Supabase, autenticação, banco e armazenamento, integrações (GitHub, WakaTime, Gemini/Wally, EmailJS), publicações, rankings, eventos, agendamentos, privacidade, custos, deploy, domínio e recuperação.  
**Fora do escopo deste encerramento:** implementar serviços, selecionar quantitativos finais de cotas, migrar DNS, acessar o repositório do professor sem fornecimento, executar deploy ou decidir detalhes funcionais não aprovados.

### 3.12.1 Registro integral de decisões aprovadas

| ID | Alternativa | Definição aprovada |
|---|---|---|
| DEC-302 | B | Frontend estático com serviços gerenciados e funções protegidas quando necessário. |
| DEC-303 | B | Priorizar uma plataforma de dados compartilhada, com separação de tabelas, permissões e responsabilidades. |
| DEC-304 | B | Priorizar serviços gratuitos ou de baixo custo, revisando segurança, cotas e evolução. |
| DEC-305 | B | Separar integrações públicas e protegidas, com backend para segredos e operações sensíveis. |
| DEC-306 | B | Separar dados locais do visitante dos dados compartilhados do sistema. |
| DEC-307 | B | Preservar recursos independentes, comunicar limitações e recorrer a cache/alternativas quando apropriado. |
| DEC-308 | B | Supabase como plataforma principal de dados, sujeito à validação de requisitos e limites. |
| DEC-309 | B | Comparar Cloudflare Pages, Vercel e Netlify antes da escolha de hospedagem. |
| DEC-310 | B | Preferir funções gerenciadas próximas aos dados, admitindo serviços especializados. |
| DEC-311 | B | Autenticação gerenciada, sessão validada e autorização nas operações protegidas, preservando login via Terminal. |
| DEC-312 | B | Combinar recursos estáticos versionados e armazenamento gerenciado para arquivos editáveis dinamicamente. |
| DEC-313 | B | Separar ambientes e credenciais proporcionalmente a custo e risco. |
| DEC-314 | B | Analisar repositório do professor e, se adequado, adaptar rotina agendada segura e monitorável para atividade do Supabase. |
| DEC-315 | B | Aplicar RLS e políticas por tabela, além de validação nas funções protegidas. |
| DEC-316 | B | Separar entidades por responsabilidade com relações, restrições e políticas de acesso. |
| DEC-317 | B | Migrações de banco versionadas, revisáveis e reproduzíveis. |
| DEC-318 | B | Planejar exportações e recuperação testável para dados importantes conforme custos e limitações do plano. |
| DEC-319 | B | Registrar erros essenciais e acompanhar disponibilidade, cotas e falhas de tarefas agendadas. |
| DEC-320 | B | Publicações no Supabase; rascunhos protegidos e conteúdo publicado disponível ao público. |
| DEC-321 | B | Curtidas sem conta obrigatória com mitigação proporcional de duplicações e abuso. |
| DEC-322 | B | Receber pontuações por operações controladas, validação por jogo e prevenção de abuso. |
| DEC-323 | B | Eventos cadastrados administrativamente no banco, feriados de fonte confiável e visibilidade somente de eventos publicados. |
| DEC-324 | B | Separar arquivos públicos e privados com políticas de armazenamento, tipos, tamanhos e permissões. |
| DEC-325 | B | Manter pastas pessoais apenas no navegador; Supabase somente para conteúdos oficiais e dados compartilhados aprovados. |
| DEC-326 | B | GitHub por serviço compartilhado com cache, paginação, controle de limites e atualização. |
| DEC-327 | B | Priorizar dados publicáveis do WakaTime; autenticação somente por integração protegida. |
| DEC-328 | B | Gemini por função protegida com validação, limites, orçamento e fallback local do Wally. |
| DEC-329 | B | Base de conhecimento estruturada para o Wally, com informações públicas autorizadas e contexto dos apps. |
| DEC-330 | B | Ferramentas do Wally com catálogo explícito, validação de parâmetros, permissões e confirmação de ações sensíveis. |
| DEC-331 | B | EmailJS com validação, proteção contra spam, feedback e limites apropriados. |
| DEC-332 | B | Agendamentos são solicitações sujeitas à análise e confirmação administrativa, nunca confirmações automáticas. |
| DEC-333 | B | Solicitações de agenda privadas e apartadas do calendário público; só eventos autorizados/publicados aparecem publicamente. |
| DEC-334 | B | Formulários com validação, limites de frequência e proteção antiabuso proporcional. |
| DEC-335 | B | Cotas por visitante e período, limites de mensagens, orçamento e fallback do Wally. |
| DEC-336 | B | Minimização de informações enviadas/armazenadas; sem histórico remoto persistente do Wally por padrão. |
| DEC-337 | B | Confirmar envio somente após retorno do serviço; recuperação e nova tentativa seguras. |
| DEC-338 | B | Cloudflare Pages como primeira opção de frontend, condicionada à validação de implantação e compatibilidade. |
| DEC-339 | B | Deploy integrado ao Git, com verificações e reversão. |
| DEC-340 | B | Orçamento operacional, alertas, cotas internas e limites para evitar cobranças inesperadas. |
| DEC-341 | B | Preservar continuidade do portfólio, degradando seletivamente recursos dependentes de serviços limitados. |
| DEC-342 | B | Separar configurações e segredos, princípio do menor privilégio e proteção de produção. |
| DEC-343 | B | Exigir validações de autenticação, permissões, integrações, falhas, desempenho e Mobile/Desktop antes de publicar. |
| DEC-344 | B | Adotar warlley.dev como domínio principal e redirecionar www.warlley.dev ao domínio principal. |
| DEC-345 | B | DNS gerenciado pela Cloudflare e HTTPS válido, após revisar os registros DNS existentes. |
| DEC-346 | B | URLs de prévia separadas, restritas quando sensíveis e isoladas dos dados de produção. |
| DEC-347 | B | Registrar condições do GitHub Student Pack, vencimento, renovação, custos e medidas contra perda do domínio. |
| DEC-348 | B | Monitorar disponibilidade, HTTPS e falhas críticas proporcionalmente ao projeto. |
| DEC-349 | B | Prever rollback de deploy, recuperação de dados e comunicação de indisponibilidade documentados. |
| DEC-350 | B | Manter a URL principal estável ao abrir ou alternar apps comuns, com navegação interna controlada pelo Core. |
| DEC-351 | B | Permitir links compartilháveis para conteúdos específicos, como projetos e publicações, sem transformar apps em sites independentes. |
| DEC-352 | B | Exigir autorização por operação no backend, privilégio mínimo inclusive para Terminal, Wally e Administração. |
| DEC-353 | B | Logs exclusivamente operacionais necessários com minimização, controle de acesso e retenção definida. |
| DEC-354 | B | Alterações críticas com validação prévia, confirmação de ações destrutivas, migrações controladas e recuperação. |

### 3.12.2 Arquitetura consolidada e segurança

- **Frontend e hospedagem:** React/JavaScript/Vite estático; Cloudflare Pages é a primeira opção **condicional à validação** (DEC-302/309/338). A comparação prévia considerou Vercel e Netlify; nenhuma infraestrutura está efetivamente implantada. Deploy integrado ao Git, validações e rollback (DEC-339/343/349).
- **Dados e funções:** Supabase é a plataforma principal **condicional à análise de limites e requisitos** (DEC-303/308); funções gerenciadas para operações sensíveis e segredos, inclusive Gemini, sem impor backend monolítico (DEC-305/310). Separar entidades, RLS, validação de operações protegidas, migrações e ambientes/credenciais (DEC-313/315–317/342/352).
- **Autenticação:** login administrativo via Terminal permanece parte da interface; autenticação gerenciada, autorização independente no backend para *cada ação*, inclusive ações originadas do Wally e da Administração. O cliente não receberá chaves privilegiadas. RLS não substitui verificações das funções de privilégio elevado (DEC-311/315/330/352).
- **Persistência e privacidade:** arquivos pessoais dos visitantes exclusivamente locais (DEC-306/325), sem acesso remoto pela Administração; publicações no banco com rascunhos privados (DEC-320); arquivos oficiais estáticos versionados ou armazenamento gerenciado com acesso público/privado e validações (DEC-312/324).
- **Operações públicas:** curtidas anônimas sujeitas a proteção proporcional, não a garantia de unicidade global (DEC-321); rankings com validação por jogo e limites antiabuso — dados fornecidos por browser não são totalmente verificáveis (DEC-322); eventos administrados no banco, feriados de fonte confiável (DEC-323).
- **Contato e calendário:** EmailJS validado e protegido (DEC-331/334); pedido de reunião não é confirmação da reunião (DEC-332/337). Solicitações e detalhes de agendamento são privados, diferentes de eventos publicados no calendário (DEC-333).
- **Integrações:** GitHub com cache/paginação/limites (DEC-326); WakaTime público quando viável, protegido para dados que exigem segredo (DEC-327); Wally usa Gemini por serviço protegido com orçamento/fallback, base autorizada, ferramentas enumeradas e autorizações explícitas (DEC-328–330/335). Não guardar conversas permanentemente no Supabase por padrão, sem presumir ausência de processamento/retenção pelo fornecedor de IA (DEC-336).
- **Operação e custo:** prioridade para planos gratuitos/baratos, orçamento e proteção contra esgotamento de cotas; degradar apenas recursos dependentes (DEC-304/307/340/341). Logs operacionais mínimos, erros, disponibilidade e agendamentos monitorados, exportação/recuperação testável e processos de produção recuperáveis (DEC-318/319/348/349/353/354).

### 3.12.3 Domínio, URL e interpretação das observações do usuário

**Domínio oficial:** `warlley.dev`, com `www.warlley.dev` redirecionado para o principal (DEC-344); DNS Cloudflare e HTTPS após auditoria de registros existentes (DEC-345). Pré-visualizações usam origens separadas e proteção adequada (DEC-346). Controlar validade do benefício estudantil e custos de renovação (DEC-347).

**Esclarecimento posterior explícito às DEC-350/351 (precedência da seção 1):** o requisito do usuário não é apenas conservar o domínio; **a URL exibida na barra do navegador não deve mudar quando qualquer aplicativo da WS OS é aberto, fechado, minimizado, maximizado ou alternado, no Desktop ou no Mobile.** Abrir Projetos, Sobre Mim, Terminal, Notas etc. não faz `pushState`/rotas por aplicativo; a navegação normal é estado interno do Core/shell e mantém o endereço canônico `https://warlley.dev/`. A mesma regra aplica-se à navegação interna de um app, salvo se o usuário aprovar exceção no futuro. Aplicativos não são sites ou subdomínios independentes.

**Conciliação com links compartilháveis (DEC-351):** é permitido que *um URL de entrada explicitamente compartilhado* codifique um destino (por exemplo, projeto ou publicação), resolva/abra esse destino na WS OS e normalize o endereço exibido à URL canônica via histórico do navegador **sem navegação adicional** após processar a entrada. Dessa forma, interações usuais com apps não alteram a barra; apenas o link externo inicialmente acessado pode conter identificador/rota temporária para inicialização. **Não estabelecer neste bloco** a sintaxe (path/query/hash), indexação, SSR, previews ou regras exatas de normalização. Se houver exigência posterior de que nem o acesso por link compartilhado exiba URL diferente em momento algum, isso demandará nova decisão explícita para conciliar com DEC-351. Não introduzir rotas por aplicativo disfarçadamente.

### 3.12.4 Auditoria final de coerência com Blocos 01–08

1. **B01 DEC-004 × DEC-302/338:** frontend React/Vite estático; backend protegido gerenciado apenas onde necessário.
2. **B02 DEC-065/069/083/088 e B08 DEC-281/297/299 × DEC-350/351:** histórico da sessão e navegação de apps ficam no Core e não implicam mutação da URL. Entrada por link compartilhado deve manter possibilidade de retorno contextual; troca de shell não restaura janelas.
3. **B03 DEC-103/109–114 × DEC-320–325/332/333:** Notas é blog administrado; visitantes curtem sem conta, não editam rascunhos; rankings controlados; calendário só mostra publicados; arquivos pessoais locais, solicitações privadas.
4. **B03 DEC-119–125 × DEC-328–330/352:** Wally, Terminal e Administração compartilham controles de autorização reais; prompts não conferem privilégios.
5. **B04 DEC-135/141/145/152 × DEC-303/305/306/315/326:** persistência seletiva e services modulares; autenticação, RLS, tratamento de falhas e cache compatíveis com gerenciadores do Core.
6. **B05 DEC-156–179 × DEC-317/339:** versões, ambientes e migrações preservam organização modular, sem exigir arquivo por componente/serviço.
7. **B06/B07/B08 × DEC-341/343:** efeitos visuais e integrações são degradados seletivamente se houver falha/cota, sem comprometer acesso Desktop/Mobile, acessibilidade ou a navegação principal.
8. **DEC-314:** o código agendado do professor não foi recebido nem inspecionado; sua adoção é **condicional** à auditoria de licença, segredos, permissões, termos, confiabilidade e custos. Não garantir que chamadas impedirão pausas do plano grátis.
9. **DEC-344–349:** `.dev` requer HTTPS; mudanças de DNS devem preservar registros necessários. Domínio, certificado, serviço de hospedagem e renovação não foram configurados nesta etapa.

**Resultado:** DEC-302 a DEC-354 verificadas; 53 decisões aprovadas; nenhum conflito impeditivo. A especificação de entrada por links foi conciliada com a correção explícita da URL estável, sem presumir novas decisões ou implementação.

### 3.12.5 Pendências de execução e critérios de validação

- Receber, inspecionar e testar o repositório do professor antes de qualquer rotina agendada no Supabase; checar licença, quotas e restrições do provedor.
- Conferir planos, limites e custos atualizados de Supabase, Cloudflare, Gemini, GitHub, WakaTime e EmailJS **na época de implantação**; determinar cotas concretas, faixas de gasto e limites de retenção com dados reais.
- Definir esquema SQL, relações, políticas RLS, estratégias antiabuso, limites de anexos, requisitos de backup e recuperação, sem ampliar visibilidade de informações privadas.
- Desenhar fluxo de entrada por link compartilhável/normalização que respeite **URL estável na navegação interna**, com validação de retorno, refresh, segurança, compartilhamento e fallback; especificação técnica pendente.
- Revisar DNS do domínio, certificados HTTPS, renovação, acesso a prévias, isolamento de ambientes, chaves e deploy/rollback.
- Garantir que quotas, disponibilidade e falhas de integrações não inutilizem o shell; validar políticas do provedor de IA e informação ao visitante.
- Nenhuma implementação, mudança em repositório remoto, domínio ou conta externa foi autorizada por este bloco.

**Critério de encerramento:** aprovações explícitas de DEC-302–354, observações preservadas, revisão transversal concluída sem bloqueios. **Bloco 09 encerrado.**

---

## 3.13 Bloco 10 — Especificação funcional dos aplicativos

**Estado:** CONCLUÍDO em 13/10/2026, mediante aprovação explícita da especificação integral e formalização DEC-373–410.  
**Escopo:** 18 aplicativos existentes, contratos e critérios de aceite funcionais; não se aprovaram novos aplicativos nem implementação.  
**Premissa:** especificação de funcionalidade não congela design final; ajustes visuais podem ocorrer durante implementação sob a DEC-367/410.

### 3.13.1 Estratégia aprovada — DEC-355 a DEC-360

| ID | Estado | Definição aprovada |
|---|---|---|
| DEC-355 | APROVADA (B) | Ordem de especificação segue dependências funcionais, iniciando pelos aplicativos mais simples. |
| DEC-356 | APROVADA (B) | Definir funcionalidades, interface, estados, integrações, permissões e critérios de aceitação antes de implementar. |
| DEC-357 | APROVADA (B) | Compartilhar lógica, mas prever experiência Desktop/Mobile própria conforme necessário. |
| DEC-358 | APROVADA (B) | Reutilizar contratos, serviços e componentes somente com benefício concreto. |
| DEC-359 | APROVADA (B) | Registrar decisões por aplicativo e dependências cruzadas com rastreabilidade no mestre. |
| DEC-360 | APROVADA (B) | Concluir especificação após revisão de fluxos, estados, interfaces, acessibilidade, integrações, segurança e aceitação. |

### 3.13.2 Sobre Mim — DEC-361 a DEC-372

| ID | Estado | Definição aprovada |
|---|---|---|
| DEC-361 | APROVADA (B) | Sobre Mim reúne apresentação, trajetória, competências, interesses e conexões. |
| DEC-362 | APROVADA (B) | Destacar identidade, resumo profissional e mensagem de apresentação, com elementos visuais discretos. |
| DEC-363 | APROVADA (B) | Exibir marcos relevantes cronologicamente com composição adaptável. |
| DEC-364 | APROVADA (B) | Organizar competências por contexto de atuação, sem percentuais arbitrários. |
| DEC-365 | APROVADA (B) | Abrir Projetos, Currículo, Certificados e Contato pelo Core. |
| DEC-366 | APROVADA (B) | Versionar conteúdo institucional, adicionando dinamismo apenas quando justificado. |
| DEC-367 | APROVADA (B) | Permitir ajustes visuais e estruturais justificados, preservando funcionalidades e Design System. |
| DEC-368 | APROVADA (B) | Experiência contínua com navegação contextual quando útil. |
| DEC-369 | APROVADA (B) | Explorar marcos com descrições e referências quando disponíveis, sem animação complexa obrigatória. |
| DEC-370 | APROVADA (B) | Abertura pelo Core respeita instâncias, histórico Mobile e URL estável. |
| DEC-371 | APROVADA (B) | Conteúdo essencial continua acessível quando imagens e referências faltam; falhas recebem feedback. |
| DEC-372 | APROVADA (B) | Validar conteúdo, navegação, legibilidade, teclado, leitor de tela, toque, responsividade, temas e Core. |

**Resultado funcional:** apresentação, trajetória, competências, interesses e conexões com Projetos/Currículo/Certificados/Contato; conteúdo versionado; tratamento de indisponibilidade; navegação e acessibilidade validadas. Sobre Mim especificado, não implementado.

### 3.13.3 Formalização da especificação integral — DEC-373 a DEC-410

**Forma de aprovação:** o usuário aprovou expressamente, em conjunto, a especificação completa dos 18 aplicativos e solicitou formalização DEC-373–410. As descrições abaixo correspondem às funcionalidades apresentadas e não representam uma votação individual de alternativas B.

| ID | Tema | Definição aprovada |
|---|---|---|
| DEC-373 | Sobre o Sistema — finalidade | Apresentar proposta, tecnologias, evolução e dados institucionais da WS OS. |
| DEC-374 | Sobre o Sistema — versão | Exibir versão pública e informações de lançamento derivadas de metadados versionados; não exigir changelog de cada commit. |
| DEC-375 | Sobre o Sistema — arquitetura | Explicar a stack e os principais conceitos arquiteturais de forma acessível sem expor segredos. |
| DEC-376 | Sobre o Sistema — evolução | Apresentar evolução V1→V2 e marcos verificáveis do projeto, sem changelog exaustivo obrigatório. |
| DEC-377 | Sobre o Sistema — créditos | Disponibilizar repositório, créditos, licenças e referências relevantes; identificar links externos. |
| DEC-378 | Sobre o Sistema — funcionamento | Priorizar conteúdo institucional versionado, com adaptação aos shells e fallback independente de API remota. |
| DEC-379 | Currículo — conteúdo | Apresentar currículo estruturado: perfil, formação, experiências e competências quando pertinentes; navegação pública. |
| DEC-380 | Currículo — documento | Permitir visualizar e baixar versão PDF oficial disponibilizada; informar falha ou indisponibilidade. |
| DEC-381 | Certificados — catálogo | Listar certificações/cursos relevantes com instituição, título, data e identificadores disponíveis; busca e filtros. |
| DEC-382 | Certificados — consulta | Abrir comprovantes suportados pelo visualizador ou navegador, com links de validação identificados e permissões respeitadas. |
| DEC-383 | Projetos — catálogo | Exibir projetos com descrição, tecnologias, imagens, estado e referências; detalhes por instância/visualização apropriada. |
| DEC-384 | Projetos — integrações | Complementar dados institucionais com GitHub via serviço compartilhado/cache; falha da API não impede leitura essencial. |
| DEC-385 | Projetos — demonstrações | Indicar claramente execução incorporada, externa, hospedada ou simulada; não prometer execução nativa universal. |
| DEC-386 | Visualizador de Demos | Receber descritor validado pelo Core; respeitar restrições de embed, carregamento, origem, falhas e retorno ao projeto. |
| DEC-387 | Dev Insights | Mostrar métricas verificáveis de GitHub/WakaTime, períodos e fontes, distinguindo atualizado, cache e indisponível. |
| DEC-388 | Contato — comunicação | Disponibilizar formulário com EmailJS, validações, antispam, estados de envio e contatos profissionais. |
| DEC-389 | Contato — agendamentos | Solicitar agendamentos sem confirmação automática; manter pedidos privados separados de eventos públicos e evitar duplicações. |
| DEC-390 | Notas — blog | Leitura pública de publicações do Supabase, pesquisa, anexos e rascunhos protegidos; visitantes não editam. |
| DEC-391 | Notas — curtidas | Permitir curtidas públicas sem exigir conta, com mecanismos proporcionais contra abuso/duplicidade. |
| DEC-392 | Calculadora | Operações aritméticas locais por toque/teclado; erros e expressões inválidas tratados sem backend. |
| DEC-393 | Arquivos — espaços | Separar arquivos oficiais com permissões de arquivos pessoais exclusivamente locais ao navegador do visitante. |
| DEC-394 | Arquivos — operações | Permitir criar, organizar, mover, renomear e excluir arquivos/pastas locais conforme capacidades e limites do navegador. |
| DEC-395 | Visualizador de Arquivos | Abrir formatos suportados (ex. texto, imagem, PDF), respeitando tamanho, permissão, origem e fallback para download permitido. |
| DEC-396 | Editor de Arquivos | Editar arquivos textuais compatíveis e autorizados; indicar alterações pendentes, proteger descarte e validar salvamento. |
| DEC-397 | Arquivos — segurança e falhas | Operações oficiais protegidas por backend; locais não sincronizadas; tratar capacidade esgotada, falha e formato incompatível. |
| DEC-398 | Configurações — preferências | Gerenciar temas, cores, animações, acessibilidade e ajustes próprios do shell, com persistência seletiva. |
| DEC-399 | Configurações — limites | Aplicar preferências consistentemente e permitir restauração apropriada; sem conceder privilégio administrativo. |
| DEC-400 | Jogos — catálogo e execução | Oferecer Snake, Paciência, Memória, Flappy Bird, Campo Minado e DOOM condicionado a licença/distribuição; controles Desktop/Mobile e ciclo de vida. |
| DEC-401 | Jogos — recordes | Manter recordes locais e rankings globais quando apropriado, com submissões controladas e validação por jogo. |
| DEC-402 | Terminal — recursos | Catálogo restrito e documentado de comandos da WS OS, ajuda, histórico, autocompletar, navegação e feedback; sem shell real irrestrito. |
| DEC-403 | Terminal — privilégios | Login administrativo gerenciado e autorização de cada operação no backend, sem confiar no estado da interface. |
| DEC-404 | Wally Estendido — conversação | Experiência ampliada no aplicativo de Sistema, com base autorizada, Gemini via função protegida, cotas e fallback local. |
| DEC-405 | Wally Estendido — ferramentas | Executar somente ações do catálogo explícito com parâmetros/permissões validados e confirmação para operações sensíveis; sem histórico remoto padrão. |
| DEC-406 | Administração | Painel restrito para publicações, arquivos oficiais, eventos e solicitações autorizadas; validar sessão, permissões e ações críticas no backend. |
| DEC-407 | Contratos entre aplicativos | Aberturas e ações mediadas pelo Core; integração declarada para Sobre Mim, Projetos/Demos, Arquivos/visualização/edição, Notas/anexos, Terminal, Wally e Administração. |
| DEC-408 | Estados e aceitação comuns | Cada aplicativo trata estados aplicáveis de carregamento, vazio, erro, offline, permissão e recuperação, com testes de fluxos, conteúdo e integrações. |
| DEC-409 | Experiência e acessibilidade | Regras funcionais compartilhadas com interfaces próprias Desktop/Mobile; responsividade, teclado, toque, tecnologias assistivas, temas e performance. |
| DEC-410 | Refinamento visual e encerramento funcional | Não congelar layout, animações, cartões ou medidas; refinamentos justificados preservam requisitos, Design System, arquitetura e critérios de aceitação. |

### 3.13.4 Inventário e classes canônicas

**12 aplicativos Desktop:** Sobre Mim; Projetos; Dev Insights; Currículo; Certificados; Contato; Notas; Arquivos; Jogos; Terminal; Configurações; Sobre o Sistema. Todos seguem a disponibilidade Mobile aprovada, sem duplicar implementações desnecessariamente.

**6 aplicativos de Sistema:** Visualizador de Arquivos; Editor de Arquivos; Calculadora; Visualizador de Demos; Wally Estendido; Administração. Sua disponibilidade, descoberta e permissões são específicas; Administração continua protegida e oculta até login administrativo via Terminal.

**Não são aplicativos adicionais:** WS Menu, Taskbar, Home Mobile, notificações, controles rápidos, calendário, Wally compacto, busca global, autenticação. Permanecem funcionalidades Core/shell, conforme B02–B04.

### 3.13.5 Contratos funcionais e limites

- **Sobre Mim → Projetos/Currículo/Certificados/Contato:** abertura pelo Core sem navegar para outra URL.
- **Projetos → Visualizador de Demos:** descritor validado do projeto; modalidade incorporada, externa, hospedada ou simulada identificada; respeitar `iframe`/CSP e licenças.
- **Currículo/Certificados/Notas → Visualizador de Arquivos:** leitura de documentos públicos e anexos com permissões e formato verificados.
- **Arquivos → Visualizador/Editor:** abrir ou editar conteúdos suportados; gravação somente com autorização correspondente. Dados pessoais do visitante não são visíveis ao administrador.
- **Configurações → Core/shells:** preferências seletivamente persistidas; nenhuma alteração de privilégios.
- **Terminal/Wally → Core/serviços:** operações por catálogos explícitos e autorização efetiva no backend para ações privilegiadas.
- **Administração → serviços protegidos:** gerir apenas recursos autorizados, com confirmação para exclusões/ações críticas.
- **Contato → EmailJS/solicitações:** sucesso apenas após resposta técnica; solicitação privada não confirma reunião nem cria evento público.
- **Jogos → armazenamento local/serviço de ranking:** somente modos apropriados têm classificação global, com validação proporcional por jogo.
- **Dev Insights → serviços GitHub/WakaTime:** não inventar métricas; diferenciar cache, carregamento, falha e dados atuais.
- **Navegação geral:** abrir/trocar/fechar apps ordinários não altera a URL visível `https://warlley.dev/`; links profundos específicos são pontos de entrada, conforme a conciliação B09; preservar histórico contextual Mobile.

### 3.13.6 Estados, acessibilidade e critérios de aceitação

Critérios transversais obrigatórios quando aplicáveis:

1. **Fluxos e dados:** recursos e textos correspondem ao escopo; ações têm sucesso verificável, validação e feedback, sem falsos positivos.
2. **Estados:** carregando, vazio, indisponível, erro, permissão negada, offline/cache e recuperação; ausência de recurso secundário não derruba conteúdo essencial.
3. **Core e ciclo de vida:** abertura/retorno/fechamento/instâncias, pausa seletiva e limpeza; Desktop janelas e Mobile tela cheia/navegação contextual.
4. **Acessibilidade:** teclado, foco, rótulos, leitores de tela, gestos alternativos, alvos de toque, contraste e movimento reduzido.
5. **Responsividade:** orientar/alterar largura, teclado virtual e áreas seguras; evitar travamentos e perda de dados.
6. **Segurança e privacidade:** acesso por privilégio no serviço, proteção contra abuso, segregação dos arquivos locais, minimização de conversas/logs.
7. **Integrações:** limites, cache, indisponibilidade e fallback explícitos; serviços externos não são representados como disponíveis sem confirmação.
8. **Visual:** Design System e hierarquia aprovados devem ser respeitados, mas medidas, composição, layout, cartões, transições e animações podem ser refinados justificadamente na implementação.

**Critério de encerramento do bloco:** as responsabilidades, comportamentos, estados e critérios gerais dos 18 aplicativos estão aprovados. A definição numérica fina (p.ex. cotas, tamanhos, validação antifraude), detalhes de tecnologia, conteúdo final e aceites executáveis ficam para especificações técnicas e planos de implementação posteriores; não constituem aprovação automática de código.

### 3.13.7 Revisão de consistência com Blocos 01–09

- **B02/B08/B09:** Desktop e Mobile mantêm experiência própria, histórico Mobile e URL estável no uso habitual; rotas de compartilhamento são pontos de entrada, não transformam apps em sites independentes.
- **B03:** 12 aplicativos Desktop + 6 de Sistema, com distinção entre aplicativos e funcionalidades. Notas é blog; Calendário não é aplicativo nem publica solicitações privadas.
- **B04/B05:** contratos pelo Core; arquitetura modular evita arquivo obrigatório para cada função; persistência seletiva não restaura janelas ao recarregar.
- **B06/B07:** Design System é referência obrigatória, não layout imutável; refinamentos visuais não revogam acessibilidade, desempenho ou decisões de interação.
- **B09:** Supabase, Cloudflare, GitHub, WakaTime, Gemini e EmailJS seguem sujeitos às condições e autorizações aprovadas; operações administrativas no backend; registros pessoais de visitantes permanecem locais.
- **Licenças e viabilidade:** DOOM e modos de demos somente se direitos e viabilidade técnica forem validados. Antiabuso dos rankings não implica garantia de ausência de fraude.

**Conclusão da auditoria:** nenhum conflito impeditivo; DEC-355–410 aprovadas, sem inclusão de funcionalidades externas à especificação aceita.

### 3.13.8 Pendências encaminhadas

- Especificar contratos de API e modelos de dados em detalhe, permissões finais, testes automatizados e validações por jogo/formato.
- Validar conteúdo real de trajetória, currículo, projetos, certificados e notas; definir os idiomas completos pt-BR/en.
- Verificar licenciamento de recursos incorporados e DOOM; políticas e limites reais dos serviços contratados.
- Fechar critérios mensuráveis de qualidade, planos de implantação, roteiro técnico, organização de entregas e commits antes da programação.
- A aprovação dos aplicativos **não autoriza codificação, alteração de repositório ou deploy**.

**Bloco 10 encerrado.**

---

## 3.14 Bloco 11 — Contratos técnicos, dados e integrações

**Estado:** CONCLUÍDO em 13/10/2026 por delegação explícita do usuário para tomar todas as decisões do bloco.  
**Escopo:** contratos do Core e dos shells, comunicação entre aplicativos, modelos e persistência de dados, fronteiras de serviços, segurança, falhas e validação.  
**Limites:** define comportamento e responsabilidades, não classes ou arquivos definitivos, tabelas SQL finais, serviços pagos, implantação ou código.  
**Decisões:** DEC-411 a DEC-449 — **APROVADAS por delegação**, mantendo os requisitos pré-existentes e sem reabrir blocos concluídos.

### 3.14.1 Registro de decisões delegadas e consolidadas

#### Fundamentos do Core

| ID | Decisão consolidada | Compatibilidade |
|---|---|---|
| DEC-411 | **Contratos compartilhados:** Operações compartilhadas terão contratos explícitos, pequenos, documentados e verificáveis; não criar interfaces formais para cada função interna. | B04, B05, B10 |
| DEC-412 | **Registro de aplicativos:** Registro canônico com ID estável, classe Desktop/Sistema, metadados, elegibilidade Desktop/Mobile, permissão de descoberta, entrada lazy e política de instâncias. | B02, B03, B04 |
| DEC-413 | **Operações de instâncias:** Core controla abrir, ativar, minimizar/pausar, restaurar e fechar; shells apenas apresentam as operações adequadas a cada modo. | B02, B04, B08 |
| DEC-414 | **Comunicação entre aplicativos:** Usar ações documentadas do Core e serviços compartilhados quando houver interação cruzada; evitar importações cíclicas e barramento obrigatório para chamadas simples. | B04, B05, B10 |
| DEC-415 | **Identificadores:** Distinguir appId estável de instanceId único e IDs de recursos externos; suporte a múltiplas instâncias segue configuração de cada aplicativo. | B02, B04 |
| DEC-416 | **Evolução de contratos:** Evolução compatível e testada; mudanças incompatíveis exigem migração ou adaptação explícita de consumidores, sem congelamento absoluto. | B04, B05 |

#### Navegação, eventos e estado

| ID | Decisão consolidada | Compatibilidade |
|---|---|---|
| DEC-417 | **Solicitação de abertura:** openApp recebe appId, contexto/origem, parâmetros validados e política de foco; retorna resultado com ID da instância ou erro tipado, sem prometer API síncrona universal. | B02, B08, B10 |
| DEC-418 | **Contexto de navegação:** Core distingue navegação interna de aplicativo, retorno à origem e navegação de shell; entrada por deep link inicia contexto sem converter apps em páginas independentes. | B08, B09 |
| DEC-419 | **URL da navegação:** Abrir, alternar ou fechar aplicativos comuns não altera a URL visível; links compartilháveis de conteúdo usam ponto de entrada explicitamente tratado e podem normalizar para https://warlley.dev/ após resolução. | DEC-350/351 |
| DEC-420 | **Eventos compartilhados:** Eventos são usados somente para mudanças desacopladas com consumidores claros; assinatura/cancelamento e limpeza no fechamento; comandos críticos usam chamada contratual e retorno, não evento solto. | B04, B05 |
| DEC-421 | **Estado em três níveis:** Separar estado efêmero de UI, estado de sessão/instância e dados persistentes; persistência é seletiva e janelas não são restauradas ao recarregar. | B02, B04, B08 |
| DEC-422 | **Ciclo de vida e recursos:** Minimização e troca de app admitem pausa seletiva sem descartar estado; fechamento explícito cancela listeners/efeitos, preservando operações pendentes quando seguro e definido por contrato. | DEC-135, DEC-284/299 |
| DEC-423 | **Operações longas e cancelamento:** Definir sinalização de carregamento, cancelamento e prevenção de resultados obsoletos para buscas, mudanças de app e consultas externas. | B04, B08, B10 |

#### Dados e armazenamento

| ID | Decisão consolidada | Compatibilidade |
|---|---|---|
| DEC-424 | **Modelos de domínio:** Modelos de projetos, certificados, currículo, publicações, curtidas, jogos/pontuações, eventos, solicitações, arquivos e configurações terão IDs, atributos e regras essenciais documentados antes de criar tabelas. | B03, B09, B10 |
| DEC-425 | **Separação das fontes:** Conteúdo institucional versionado; informações remotas com origem identificável; dados locais do visitante separados de dados compartilhados e de dados administrativos. | B09, B10 |
| DEC-426 | **Repositórios de dados:** Acesso a persistência por serviços com interface limitada por domínio quando houver benefício real; UI não acopla diretamente regras administrativas a consultas brutas. | B04, B05, B09 |
| DEC-427 | **Armazenamento local:** Preferências pequenas em mecanismo leve e arquivos/pastas locais estruturados em IndexedDB conforme viabilidade; checar quotas, falhas, exportação e perda por limpeza do navegador. | B04, B09 |
| DEC-428 | **Modelo de arquivo:** Todo arquivo possui origem (oficial ou local), ID, nome, tipo, tamanho, metadados e capacidades de leitura/edição; nenhum caminho local expõe arquivo de outro visitante. | B03, B09 |
| DEC-429 | **Sincronização e concorrência:** Não haverá sincronização automática das pastas locais; operações remotas mutáveis usarão controle de concorrência adequado e proteção contra duplicidade/reenvio quando necessário. | B09 |
| DEC-430 | **Evolução e migração de dados:** Mudanças de schema remoto por migração versionada; dados locais com versão de formato e migração/recuperação controlada quando houver mudança incompatível. | DEC-317, B04 |

#### Integrações e API

| ID | Decisão consolidada | Compatibilidade |
|---|---|---|
| DEC-431 | **Envelope de resultado:** Serviços retornarão dados válidos ou falhas categorizadas (validação, permissão, indisponibilidade, limite, conflito), com mensagens seguras para UI; não usar sucesso otimista como confirmação de operação remota. | B04, DEC-337 |
| DEC-432 | **GitHub e WakaTime:** Serviço compartilhado com cache/atualização, controle de cotas e indicação de origem e atualização; segredos do WakaTime nunca são embutidos no cliente. | DEC-326/327 |
| DEC-433 | **Wally e Gemini:** Chamadas Gemini apenas por função protegida com limites e orçamento; conhecimento autorizado; ferramentas em lista permitida com validação/autorização e confirmação de ações críticas. | DEC-328/330/335/336 |
| DEC-434 | **Email e agendamento:** Formulário tem validação e antiabuso, resposta confirmada do provedor, solicitação privada e estado de análise separado da confirmação administrativa da reunião. | DEC-331/332/333/334/337 |
| DEC-435 | **Supabase público e protegido:** Leituras públicas restritas por políticas RLS; mutações privilegiadas passam por autorização backend por operação; credenciais service-role jamais chegam ao frontend. | DEC-311/315/320/324/352 |
| DEC-436 | **Rankings e curtidas:** Escritas públicas possuem validações por jogo/operação, idempotência quando necessária, rate limiting e resistência proporcional a fraudes; não prometer unicidade absoluta de curtida por pessoa. | DEC-321/322 |
| DEC-437 | **Resiliência das integrações:** Timeouts adequados, retries limitados para operações seguras, cache com informação de frescor, fallback explícito e isolamento entre falhas de serviços. | DEC-307/319/341 |

#### Segurança, privacidade e operação

| ID | Decisão consolidada | Compatibilidade |
|---|---|---|
| DEC-438 | **Permissões canônicas:** Definir matriz recurso × operação × papel/condição; checagem efetiva ocorre nos serviços protegidos, independentemente do shell, Terminal ou Wally. | DEC-125/145/315/352 |
| DEC-439 | **Sessões administrativas:** Autenticação gerenciada iniciada pelo Terminal como aprovado; sessão expira/revalida; estado visual jamais é prova isolada de autorização. | DEC-311, B03, B04 |
| DEC-440 | **Dados pessoais e logs:** Minimização por finalidade, acesso restrito, retenção definida e ocultação de segredos; conversas Wally não terão histórico remoto persistente por padrão. | DEC-336/353 |
| DEC-441 | **Segredos e ambientes:** Configuração separada por ambiente e privilégios mínimos; preview não usa segredos nem dados reais de produção desnecessariamente. | DEC-313/342/346 |
| DEC-442 | **Controles antiabuso e cotas:** Aplicar quotas por origem/sessão quando apropriado, controles no backend, alertas de custo e desativação seletiva de recursos dispendiosos sem derrubar o portfólio. | DEC-304/334/335/340/341 |
| DEC-443 | **Domínio, deploy e recuperação:** Produção em warlley.dev com HTTPS; frontend Cloudflare Pages preferencial, Git deploy validado, rollback e recuperação documentados; nenhuma operação técnica neste bloco. | DEC-338–349 |
| DEC-444 | **Rotina Supabase pendente:** Repositório do professor será inspecionado antes de adoção; rotina agendada só se tecnicamente apropriada, segura, licenciada e monitorável; nenhuma garantia de não pausarem o banco. | DEC-308/314/319 |

#### Validação e governança

| ID | Decisão consolidada | Compatibilidade |
|---|---|---|
| DEC-445 | **Testes de contratos:** Validar entradas/saídas, falhas, autorização, limpeza de listeners e compatibilidade entre aplicativos, Core e shells; casos de integração devem incluir services indisponíveis. | B04, DEC-343, B10 |
| DEC-446 | **Critérios de aceitação:** Cada contrato de domínio precisa de responsável, consumidor, pré-condições, erros previsíveis e testes verificáveis; especificação visual permanece flexível. | DEC-356/360/367 |
| DEC-447 | **Revisão de fronteiras:** Evitar dependências circulares, armazenamento indevido e serviços genéricos onipotentes; abstrair apenas quando houver necessidade concreta. | B04, B05 |
| DEC-448 | **Compatibilidade Desktop/Mobile:** Mesmo serviço e modelo de domínio com apresentação específica; nenhum contrato técnico obriga um shell a reproduzir layout do outro. | DEC-357, B08 |
| DEC-449 | **Escopo não autorizado:** Este bloco não aprova bibliotecas novas, tabelas SQL definitivas, código, credenciais, implantação, métricas numéricas, custo pago ou alteração dos 18 aplicativos. | B01, B05, B09, B10 |

### 3.14.2 Contratos de referência (sem impor implementação)

| Operação ou modelo | Entradas mínimas | Saída/efeito contratado | Falhas tratadas |
|---|---|---|---|
| `openApp` | `appId`, origem, parâmetros opcionais validados | `instanceId`/contexto de abertura ou falha | aplicativo inexistente, acesso negado, limite de instâncias |
| `closeApp` | `instanceId` e intenção | liberação de recursos e retorno coerente | instância inexistente, alteração não salva |
| `navigateBack` | contexto/histórico do shell | volta interna, depois origem, mantendo URL normal | contexto inválido, deep link |
| `openResource` | ID, origem, capacidade pretendida | visualização/edição permitida | formato não suportado, permissão, recurso inexistente |
| `readDomainData` | domínio, consulta validada e paginação | dados + origem/frescor | rede, quota, indisponível, sessão expirada |
| `mutateDomainData` | ação, dados validados, sessão, idempotência onde cabível | confirmação efetiva, identificador/estado final | acesso negado, conflito, duplicação, timeout |
| `runWallyTool` | ferramenta permitida, argumentos tipados, contexto | ação autorizada com confirmação quando sensível | ferramenta não permitida, limite, auth, recusa |
| Entidades de domínio | identidade estável, dados, origem, visibilidade | formato documentado e evolutivo | migração, campo ausente, permissões |

Os nomes acima são **exemplos semânticos** do contrato e não determinam assinaturas JavaScript finais, bibliotecas de estado ou divisão de arquivos.

### 3.14.3 Matriz preliminar de confiança e responsabilidade

| Recurso | Fonte/armazenamento | Quem pode ler | Quem pode alterar |
|---|---|---|---|
| Conteúdo institucional e metadados públicos | Projeto versionado ou fonte pública autorizada | Público | Atualização de conteúdo versionado |
| Notas publicadas / rascunhos | Supabase | Público / administração, respectivamente | Operação administrativa protegida |
| Curtidas e rankings globais | Supabase/função controlada | Público para contagens e posições públicas | Visitantes via operações limitadas e validadas |
| Eventos publicados | Supabase e fontes de feriados confiáveis | Público | Administração para cadastro/publicação |
| Solicitações de agendamento | Serviço protegido | Administração autorizada | Solicitação pública validada; gestão administrativa |
| Arquivos oficiais | Estático ou armazenamento gerenciado | Conforme visibilidade | Administração autorizada |
| Pastas pessoais do visitante | IndexedDB do navegador | Próprio navegador | Próprio visitante, localmente |
| Preferências visuais | Armazenamento local | Própria sessão/navegador | Próprio visitante |
| Conversas Wally | Contexto efêmero; sem histórico remoto por padrão | Sessão ativa | Solicitação do usuário e políticas do serviço |
| Credenciais/segredos | Ambientes protegidos | Serviço autorizado | Operação segura fora do frontend |

### 3.14.4 Auditoria de compatibilidade

- **DEC-411–416 versus B04/B05:** registro e gerenciamento centralizados sem obrigatoriedade de uma classe/arquivo por recurso; múltiplas instâncias continuam por aplicativo.
- **B02/B08 versus B09:** ações comuns não mudam URL; histórico contextual Mobile e entradas compartilháveis coexistem, sem transformar cada app em rota permanente.
- **B03/B10 versus contratos de dados:** o catálogo continua em 12 aplicativos Desktop e 6 de Sistema; calendários/painéis seguem funcionalidades e nenhuma interface vira aplicativo novo.
- **Segurança B09:** RLS não substitui autorização em funções privilegiadas; Terminal e Wally não elevam permissões por conta própria; pastas do visitante seguem locais e privadas.
- **Disponibilidade/custos:** Supabase e Cloudflare continuam condicionais às verificações previamente aprovadas; chamadas a IA e escritas públicas são limitadas e monitoradas.
- **Qualidade:** validação de contratos não fixa de antemão framework de testes, estrutura do repositório nem parâmetros de desempenho; estes serão definidos antes de iniciar código.
- **Visual:** nenhuma decisão deste bloco congela composição visual dos aplicativos nem altera o Design System aprovado.

**Conclusão:** nenhuma contradição material ou mudança tácita de escopo identificada. Contratos e modelos ficam aprovados no nível necessário ao planejamento; detalhes executáveis, limites quantitativos, esquemas exatos e estratégia de implementação continuam pendentes.

### 3.14.5 Critérios de conclusão

- [x] Contratos do Core, registry, instâncias, navegação e ciclo de vida.
- [x] Comunicação controlada e gestão de eventos.
- [x] Fronteiras entre estado efêmero, sessão e persistência.
- [x] Modelos conceituais, proveniência, arquivos e evolução.
- [x] Envelopes de sucesso/erro, falhas e disponibilidade de APIs.
- [x] Autenticação, autorização, privacidade, antiabuso e ambientes.
- [x] Validação de contratos e critérios transversais.
- [x] Revisão de consistência sem mudar o escopo dos aplicativos.

**Bloco 11 encerrado; implementação permanece NÃO INICIADA e NÃO AUTORIZADA.**

---

## 3.15 Bloco 12 — Segurança, acessibilidade, desempenho e qualidade

**Estado:** CONCLUÍDO por delegação explícita para definir integralmente o bloco em 13/10/2026.  
**Decisões:** DEC-450 a DEC-487, aprovadas por delegação.  
**Escopo:** critérios verificáveis de segurança, acessibilidade, performance, resiliência, testes e aceite de release.  
**Limites:** não instalar ferramentas, implementar código, comprar planos, definir layouts imutáveis nem alterar o catálogo de 18 aplicativos.

### Critérios gerais de qualidade

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-450 | **Qualidade progressiva.** Exigir critérios verificáveis e testes proporcionais aos riscos em cada etapa; não adiar toda validação para o fim. |
| DEC-451 | **Acessibilidade de referência.** Adotar WCAG 2.2 AA como referência de projeto e validação; registrar desvios concretos, responsáveis e correções, sem afirmar conformidade não auditada. |
| DEC-452 | **Medição de desempenho.** Definir métricas, equipamentos de referência e cenários reprodutíveis; corrigir gargalos identificados por medição, não por suposição. |
| DEC-453 | **Interações de janelas.** Movimentação, redimensionamento, maximização, restauração e snap evitam atualizações globais a cada evento; privilegiar atualizações localizadas, frame scheduling e medição de fluidez. |
| DEC-454 | **Estratégia de testes.** Combinar testes unitários, contratos, integração e ponta a ponta por criticidade; não testar cada detalhe visual isoladamente por obrigação. |
| DEC-455 | **Critério de pronto.** Funcionalidade só se considera pronta com comportamento, tratamento de erros, acessibilidade, integração e testes pertinentes validados. |

### Segurança e privacidade

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-456 | **Modelo de ameaças proporcional.** Enumerar superfícies críticas: Terminal, Wally, Administração, formulários, rankings, curtidas, arquivos, auth e APIs; registrar mitigação e risco residual. |
| DEC-457 | **Autorização e RLS.** Validar autorizações no backend por recurso e operação; RLS e restrições de banco são defesa adicional, não substituem validação ao usar credenciais privilegiadas. |
| DEC-458 | **Sessão administrativa.** Verificar expiração, logout, revalidação após troca de contexto, proteção contra sessão inválida e confirmação de ações destrutivas. |
| DEC-459 | **Entrada e conteúdo não confiável.** Validar dados nas fronteiras, escapar/renderizar conteúdo conforme contexto, sanitizar conteúdo rico quando permitido e não executar comandos vindos de texto externo. |
| DEC-460 | **Proteção antiabuso.** Definir rate limiting em serviço, validação por operação, políticas de quota, tratamento de spam, custos da IA e respostas seguras em limitação. |
| DEC-461 | **Uploads e arquivos.** Validar tipos, tamanho, origem e autorização; impedir execução arbitrária, travessia de caminhos, exposição de arquivos privados e acesso administrativo a dados locais de visitantes. |
| DEC-462 | **Segredos e dependências.** Não incluir segredos em frontend/logs; revisar bibliotecas e licenças, versões e vulnerabilidades antes de adotar; segregar ambientes. |
| DEC-463 | **Privacidade e retenção.** Minimizar coleta, registrar finalidade e período de retenção de solicitações/logs, definir tratamento de exclusão; histórico remoto Wally desligado por padrão. |
| DEC-464 | **Resposta a incidentes.** Prever revogação de credenciais, desativação seletiva de recursos, rollback, comunicação de falha e recuperação documentada. |

### Acessibilidade e experiência

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-465 | **Operação por teclado.** Garantir navegação e foco visível em Desktop, janelas, WS Menu, painéis, menus de contexto e aplicativos; oferecer alternativa a interações apenas por arraste. |
| DEC-466 | **Gestão de foco e diálogos.** Definir foco inicial, ordem lógica, restauração após fechamento e contenção apropriada em diálogos modais; evitar armadilhas de teclado. |
| DEC-467 | **Semântica e leitura assistiva.** Usar elementos semânticos, nomes e estados acessíveis, anúncios necessários e hierarquia coerente; não depender exclusivamente de ícones ou cor. |
| DEC-468 | **Contraste e escala.** Validar legibilidade e contraste em temas claro/escuro, estados interativos, fundos translúcidos, aumento de texto e zoom, utilizando WCAG 2.2 AA como referência. |
| DEC-469 | **Toque e gestos.** Alvos adequados, alternativas visíveis para gestos, respeito a gestos nativos e áreas seguras; considerar teclado virtual e orientação horizontal. |
| DEC-470 | **Movimento e mídia.** Respeitar prefers-reduced-motion; evitar efeitos que bloqueiem leitura ou prejudiquem operação e fornecer controle quando a interação o exigir. |
| DEC-471 | **Internacionalização acessível.** Validar pt-BR e inglês com expansão de texto, rótulos, datas, mensagens de erro e anúncio coerente do idioma. |

### Desempenho e estabilidade

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-472 | **Orçamento de interação.** Adotar meta inicial de feedback perceptível imediato e monitorar tarefas longas; metas numéricas são hipóteses de validação, não garantias universais. |
| DEC-473 | **Meta de fluidez.** Nas plataformas de referência, buscar aproximadamente 60 fps em interações contínuas (intervalo de 16,7 ms), registrar piores casos e admitir ajustes por dispositivo; travamentos perceptíveis bloqueiam aceite. |
| DEC-474 | **Isolamento de renderização.** Geometria transitória de janelas não deve disparar render global de todos os apps; limitar leituras de layout, writes, listeners e trabalho síncrono caro. |
| DEC-475 | **Carregamento e código.** Utilizar carregamento sob demanda de aplicativos/recursos, evitar bibliotecas pesadas sem ganho claro e preservar experiência inicial rápida. |
| DEC-476 | **Memória e ciclo de vida.** Verificar limpeza de listeners, timers, observers, recursos de mídia e instâncias encerradas; pausas seletivas respeitam política de Core. |
| DEC-477 | **Resiliência da rede.** Aplicar cancelamento, timeout, cache, tratamento de respostas obsoletas, retry apenas seguro e degradação por funcionalidade sem travar o sistema. |
| DEC-478 | **Perfis de teste.** Medir navegador Desktop moderno e smartphone representativo, modo claro/escuro, diferentes tamanhos, conexão instável e condições de CPU reduzida quando possível. |

### Testes, observabilidade e aceite

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-479 | **Pirâmide de testes pragmática.** Testar lógica pura e validadores isoladamente; testar contratos Core/serviços e um conjunto de fluxos ponta a ponta de alto valor. |
| DEC-480 | **Matriz de fluxos críticos.** Cobrir boot, Desktop/Taskbar, abrir/minimizar/fechar, resize/maximizar/restaurar, Mobile/back, histórico, Wally, Terminal, Admin, dados locais, agendamentos e modos de falha. |
| DEC-481 | **Testes de segurança.** Testar negativa de acesso direto a APIs/admin, RLS de dados públicos/privados, sessão expirada, upload inválido, abuso e validação de tool calls do Wally. |
| DEC-482 | **Verificação visual e acessível.** Combinar inspeção manual de teclado/leitor de tela/zoom/contraste com checagens automatizadas de acessibilidade, sem assumir que automação substitui avaliação humana. |
| DEC-483 | **CI e validação pré-publicação.** Executar lint/formatação, build e testes relevantes antes do deploy; falhas críticas impedem publicação de produção. |
| DEC-484 | **Telemetria proporcional.** Medir erros críticos, disponibilidade, consumo e sinais de performance com dados minimizados; não coletar conversas, segredos nem conteúdo de formulários para monitoramento. |
| DEC-485 | **Registro de defeitos e regressões.** Para bugs relevantes, preservar cenário de reprodução e teste de regressão antes de marcar como resolvidos, especialmente em gerenciamento de janelas. |
| DEC-486 | **Critérios de bloqueio.** Bloquear entrega diante de falhas de autorização, vazamento de dados, perda indevida de dados locais, travamentos críticos ou navegação essencial inacessível. |
| DEC-487 | **Revisão de fechamento.** Revisar rastreabilidade dos requisitos e evidências dos testes, documentar exceções e não iniciar implementação antes do roadmap e commits aprovados. |

### Matriz de qualidade e evidências necessárias

| Área | Cenários obrigatórios | Evidência esperada |
|---|---|---|
| Gerenciador de janelas | arrastar, redimensionar, maximizar, restaurar, snap e troca de viewport | profiling e teste de regressão sem congelamentos críticos |
| Mobile | home, catálogo, busca, back, transição entre apps, orientação e teclado virtual | checklist por tamanho/orientação e navegação acessível |
| Acessibilidade | teclado, foco, rótulos, contraste, zoom, leitor de tela, movimento reduzido | relatório manual + verificações automáticas, desvios documentados |
| Autenticação e APIs | visitante não autenticado, admin autenticado, sessão vencida, API direta | resultados de testes de permissão e RLS/funções |
| Conteúdo público e dados locais | arquivos privados/oficiais, pastas do visitante, Notas, rankings, curtidas | prova de isolamento e erros recuperáveis |
| Dependências externas | Supabase, GitHub, WakaTime, EmailJS, Gemini indisponíveis ou limitados | degradação seletiva e feedback honesto |
| Release | lint, build, contratos, segurança, integração e smoke tests por shell | resultado verificável em CI e critérios de bloqueio atendidos |

### Metas iniciais de desempenho — sujeitas a aferição

1. **Interação contínua:** almejar 60 fps em equipamento de referência para arrastar/redimensionar janelas, sem declarar meta absoluta para todo equipamento; usar profiling para avaliar quedas e tarefas longas.
2. **Entrada:** resposta visual imediata às ações; medir latência e eventuais tarefas longas durante maximizar/restaurar e em resize contínuo.
3. **Carregamento:** medir inicialização e abertura dos aplicativos em condições representativas, estabelecer valores definitivos apenas após protótipo e hardware de teste definidos.
4. **Memória:** não reter listeners, intervalos ou recursos de instâncias fechadas; testar várias sequências de abertura/fechamento e uso prolongado.
5. **Qualidade de lançamento:** bugs que bloqueiem navegação, corrompam dados, exponham informações privadas ou travem fluxos essenciais impedem aceite.

### Revisão de consistência com B01–B11

- Respeita **React + JavaScript + Vite**, sem impor TypeScript ou framework de testes antes de comparar ferramentas.
- Preserva Desktop/Mobile independentes na apresentação e comuns nos contratos; interfaces finais continuam adaptáveis.
- Não reabre políticas de instâncias, pausa seletiva, persistência ou estabilidade de `https://warlley.dev/`.
- WCAG 2.2 AA é **referência de projeto**; não se afirma certificação ou auditoria já concluída.
- Meta de fluidez é critério de engenharia a validar, não promessa de 60 fps em quaisquer dispositivos.
- Segurança no backend, RLS, proteção de custos/segredos e privacidade respeitam B09/B11.
- A documentação de CI e verificações não constitui implementação, contratação ou deploy.

**Conclusão:** 38 decisões coerentes com B01–B11; Bloco 12 ENCERRADO. Implementação permanece **NÃO INICIADA** e **NÃO AUTORIZADA**.

---

## 3.16 Bloco 13 — Publicação e preparação operacional

**Estado:** CONCLUÍDO em 13/10/2026 por delegação explícita do usuário para decidir integralmente o bloco.  
**Decisões:** DEC-488 a DEC-518 — aprovadas por delegação.  
**Escopo:** branches, ambientes, CI, releases, domínio, DNS, SSL/TLS, disponibilidade, custo, rollback, monitoramento e documentação de operação.  
**Limite:** decisões de planejamento; nenhuma mudança real de contas, DNS, serviços ou código foi executada.

### Fluxo de versionamento e implantação

| Decisão | Regra consolidada |
|---|---|
| **DEC-488** | **Branches e integração:** Branch principal estável com branches de trabalho curtas; integração após revisão e validações; sem exigir Git Flow complexo. |
| **DEC-489** | **Ambientes:** Desenvolvimento local, deploys de prévia e produção; credenciais e dados de produção segregados conforme risco. |
| **DEC-490** | **Uso das prévias:** Alterações incompletas permanecem em prévias; produção recebe apenas versões seguras e aprovadas. |
| **DEC-491** | **Verificações automáticas:** Pipeline progressivo com lint, build, testes relevantes, contratos e verificações de segurança antes de promover produção. |
| **DEC-492** | **Migrações Supabase:** Migrações versionadas, analisadas, recuperáveis quando viável e executadas separadamente de deploys comuns, evitando mudanças destrutivas automáticas. |
| **DEC-493** | **Versionamento público:** Versões de lançamento identificáveis e resumo de mudanças relevantes, sem incrementação obrigatória em cada commit. |
| **DEC-494** | **Implantação Git:** Integrar Cloudflare Pages preferencialmente ao repositório GitHub; recursos específicos de deploy só serão ativados após validação técnica. |
| **DEC-495** | **Condição de publicação:** Deploy aprovado depende de build, checks, comportamento Desktop/Mobile, regras de segurança e diagnóstico de regressões críticas. |

### Domínio, roteamento e ambientes

| Decisão | Regra consolidada |
|---|---|
| **DEC-496** | **Domínio de produção:** Usar https://warlley.dev/ como origem canônica, com www.warlley.dev redirecionado; navegação interna entre apps sem mudar a URL. |
| **DEC-497** | **Deep links de conteúdo:** Links compartilháveis são entradas excepcionais resolvidas pelo Core; normalização da URL após abertura é permitida, sem criar rotas permanentes por aplicativo. |
| **DEC-498** | **DNS e registros:** Migrar DNS para Cloudflare após inventariar registros existentes, verificando propagação e capacidade de reversão; não alterar DNS durante planejamento. |
| **DEC-499** | **HTTPS e segurança de transporte:** Garantir certificado HTTPS válido antes de disponibilizar .dev; revisar redirecionamentos e cabeçalhos adequados, respeitando HSTS. |
| **DEC-500** | **Prévia e indexação:** URLs de preview separadas de produção, sem indexação pública desejada e com controles de acesso quando necessário; jamais supor que URL obscura protege segredos. |
| **DEC-501** | **Configuração por ambiente:** Variáveis Vite públicas são consideradas visíveis ao navegador; segredos permanecem exclusivamente em função/ambiente protegido. |
| **DEC-502** | **Dependência dos provedores:** Cloudflare Pages é primeira opção; Supabase é plataforma principal condicionada a limites, compatibilidade e validação, com alternativas avaliadas apenas se necessário. |

### Custos, confiabilidade e continuidade

| Decisão | Regra consolidada |
|---|---|
| **DEC-503** | **Operação econômica:** Priorizar planos gratuitos ou de baixo custo, sem assumir gratuidade permanente; registrar quotas, restrições, limites de deploy e renovação. |
| **DEC-504** | **Orçamento e alertas:** Definir orçamento operacional e alertas; aplicar cotas e limites backend especialmente em Gemini, uploads, rankings e curtidas. |
| **DEC-505** | **Domínio estudantil:** Conferir registrador, titularidade, elegibilidade do benefício, expiração, preço de renovação e forma de pagamento; planejar renovação antes do vencimento. |
| **DEC-506** | **Falhas parciais:** Falha de Gemini, GitHub, WakaTime, EmailJS ou Supabase não derruba partes independentes; informar erro/cache/fallback com transparência. |
| **DEC-507** | **Rotina anti-inatividade:** Inspecionar repositório do professor, licença, credenciais, agendamento e condições do Supabase antes de decidir se rotina periódica é apropriada; não prometer evitar pausa. |
| **DEC-508** | **Monitoramento:** Verificar disponibilidade do domínio, HTTPS, erros críticos, cotas, funções e agendamentos com telemetria mínima e retenção proporcional. |
| **DEC-509** | **Incidentes e rollback:** Plano para reverter frontend, revogar segredos, conter operações e restaurar dados quando necessário; rollback de frontend não implica reversão automática de schema. |
| **DEC-510** | **Backups e restauração:** Definir exportação e restauração testável dos dados importantes de acordo com o plano contratado, especialmente antes de migrações. |

### Governança, documentação e lançamento

| Decisão | Regra consolidada |
|---|---|
| **DEC-511** | **Checklist de release:** Registrar pré-condições de lançamento: versão, changelog, testes, autorização, privacidade, acessibilidade, desempenho e verificação de links. |
| **DEC-512** | **Smoke tests de produção:** Após publicação, conferir home, navegação estável, abertura de apps, mobile, autenticação protegida e fluxos críticos sem executar mutações destrutivas de teste. |
| **DEC-513** | **Bloqueadores de lançamento:** Impedem publicação: segredos expostos, acesso administrativo indevido, perda indevida de dados, links/navegação críticos quebrados, travamentos críticos ou falhas de privacidade. |
| **DEC-514** | **Política de comunicação:** Mensagens de indisponibilidade e manutenção devem ser claras, sem apresentar sucesso fictício nem divulgar dados internos, e com recuperação quando possível. |
| **DEC-515** | **Documentação operacional:** Registrar instalação, configuração de ambientes, DNS, CI/deploy, migrações, backups, recuperação, credenciais por referência segura e checklist de incidentes. |
| **DEC-516** | **Higiene de produção:** Desabilitar recursos de debug, eliminar dados fictícios como reais e validar permissões, políticas de cache, licenças e arquivos públicos. |
| **DEC-517** | **Responsabilidades e revisões:** Antes de cada release, distinguir aprovação funcional, teste técnico, promoção de ambiente e publicação; commits não são automaticamente releases. |
| **DEC-518** | **Critério de encerramento do bloco:** Este bloco aprova processo e critérios; não executa deploy, altera DNS, cria contas, contrata serviços ou escreve código. Roadmap, marcos e commits ainda serão definidos. |

### Fluxo operacional de referência

1. **Branch de trabalho:** implementar pequena etapa de roadmap com validações locais e teste correspondente.
2. **Integração:** revisar mudanças e executar verificações automáticas (qualidade, contratos, build e segurança aplicável).
3. **Prévia:** publicar em URL isolada, com segredos e dados de prévia protegidos; validar Desktop/Mobile e diferenças visuais.
4. **Promoção:** aprovar versão candidata com critérios de aceite; aplicar migrações compatíveis previamente planejadas, nunca implicitamente por todo commit.
5. **Produção:** publicar no endereço canônico `https://warlley.dev/`, manter `www` como redirecionamento e realizar smoke tests.
6. **Operação:** acompanhar erro crítico, cotas, vencimento do domínio, certificado, backup e incidentes; reverter ou desabilitar seletivamente quando necessário.

### Checklist de lançamento (modelo a preencher na implementação)

- [ ] Mudanças revisadas, lint, build e testes aplicáveis aprovados.
- [ ] Segurança: RLS, backend, credenciais, autenticação e operações privilegiadas verificadas.
- [ ] Fluxos críticos de Desktop/Mobile, acessibilidade e fluidez das janelas verificados em ambiente representativo.
- [ ] Conteúdos, links, currículo, certificados, avisos e licenças revisados.
- [ ] Integrações externas e cotas verificadas; fallback testado.
- [ ] Migração/backup quando aplicáveis, com plano de recuperação.
- [ ] DNS e HTTPS corretos, domínio e renovação sob controle.
- [ ] Informações da release registradas e smoke test pós-publicação executado.

### Auditoria de coerência

- **B02/B08/B09:** domínio e barra de endereço continuam estáveis durante a navegação interna, inclusive quando se abre ou fecha um app; links especiais preservados como pontos de entrada.
- **B04/B05/B11:** nenhuma mudança de arquitetura Core, catálogo, serviços ou divisão obrigatória de arquivos; arquitetura incremental permanece.
- **B09:** Cloudflare Pages permanece preferencial, Supabase condicionado, custos sob controle e credenciais secretas fora do frontend.
- **B12:** testes de acessibilidade, privacidade e desempenho, especialmente resize/maximização/restauração, são critérios de bloqueio quando críticos.
- **Decisão expressa sobre implementação:** a preparação de CI, domínio, backend e deploy é apenas especificação, sem antecipar código ou publicação.

**Pendências externas preservadas:** verificar benefícios e renovação do domínio `.dev`; verificar planos e cotas de cada fornecedor na implementação; inspecionar o código do professor para Supabase; selecionar ferramentas de teste e limites quantitativos em etapa técnica; montar o roadmap de implementação e plano de commits.

**Conclusão:** Bloco 13 ENCERRADO, sem conflitos impeditivos. Implementação permanece **NÃO INICIADA / NÃO AUTORIZADA**.

---

## 3.17 Bloco 14 — Roadmap e metodologia de implementação

**Estado:** CONCLUÍDO em 13/10/2026 por delegação expressa do usuário para decidir integralmente o bloco.  
**Decisões:** DEC-519 a DEC-559 (**APROVADAS por delegação**).  
**Objeto:** ordem, dependências, entregas, verificações, checkpoints, commits e critérios de avanço.  
**Limite:** nenhuma implementação, commit, push, instalação ou deploy é autorizada pela aprovação deste plano.

### Método e controle de entregas

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-519 | **Incrementos verticais.** Construir entregas pequenas ou médias completas, com resultado verificável e dependências documentadas; não implementar toda a UI separadamente da lógica. |
| DEC-520 | **Escopo de cada incremento.** Cada entrega possui objetivo, pré-condições, arquivos previstos (ajustáveis), requisitos cobertos, validação e condição de reversão. |
| DEC-521 | **Estrutura evolutiva.** Partir da estrutura de referência B05 e criar arquivos/módulos conforme necessidade; evitar tanto módulos gigantes quanto um arquivo por função. |
| DEC-522 | **Core mínimo testado.** Construir registry, instâncias e ações fundamentais em conjunto com shell e aplicativo representativo, sem antecipar o Core inteiro. |
| DEC-523 | **Commits por entrega validada.** Realizar commits descritivos somente após testes pertinentes e aprovação do checkpoint; mudanças ainda não testadas não se tornam automaticamente commits. |
| DEC-524 | **Apresentação de alterações.** Nas implementações pontuais, explicar alterações delimitadas e trechos suficientes; em reorganizações entregar arquivos completos afetados para substituição segura. |
| DEC-525 | **Aprovação de avanço.** Encerrar checkpoint não autoriza automaticamente próxima entrega, push, produção ou novas funcionalidades; solicitar aprovação explícita. |
| DEC-526 | **Correções e refatorações.** Bugfix urgente ou refatoração pode gerar incremento próprio, com regressão e explicação; não misturar refatoração ampla com recurso novo sem necessidade. |

### Sequência de fundação e shells

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-527 | **Fase F0: preparo.** Conferir repositório de destino, baseline, scripts, configurações e histórico; iniciar projeto do zero em React/JS/Vite após autorização de implementação. |
| DEC-528 | **Fase F1: fundação.** Instalar apenas dependências justificadas, configurar qualidade básica, Design System inicial, shells mínimos, limites de responsabilidade e smoke test do boot. |
| DEC-529 | **Fase F2: Core essencial.** Implementar catálogo canônico, instâncias, lifecycle, permissões conceituais, eventos mínimos e API de abertura/fechamento. |
| DEC-530 | **Fase F3: Desktop funcional.** Criar Desktop com grade, uma janela representativa e controles funcionais antes de adicionar Taskbar, WS Menu, snap, widgets e painéis. |
| DEC-531 | **Checkpoint de performance inicial.** Testar repetidamente resize do navegador, janela, maximizar/restaurar e múltiplas instâncias antes de proliferar componentes visuais. |
| DEC-532 | **Fase F4: Desktop completo.** Evoluir Taskbar, WS Menu alfabético, busca, widgets, notificações, controles rápidos, Wally compacto e calendário conforme blocos anteriores. |
| DEC-533 | **Fase F5: Mobile.** Implementar shell Mobile próprio com Home, catálogo, busca, navegação de origem e painéis; compartilhar Core sem copiar componentes Desktop integralmente. |
| DEC-534 | **Checkpoint de troca de shell.** Validar mudança de viewport/orientação e retorno sem perda de dados persistentes, preservando estado compatível e URL estável. |

### Sequência de aplicativos

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-535 | **Fase A1: institucionais.** Sobre Mim, Sobre o Sistema, Currículo, Certificados e Visualizador de Arquivos mínimo onde necessário. |
| DEC-536 | **Fase A2: portfólio técnico.** Projetos, Visualizador de Demos e Dev Insights; integrar GitHub/WakaTime progressivamente, com fallback e cache. |
| DEC-537 | **Fase A3: utilitários e contato.** Calculadora e Contato/solicitação de agendamento com validações, erros e confirmação do serviço. |
| DEC-538 | **Fase A4: publicações.** Notas com leitura pública, curtidas controladas e infraestrutura de edição protegida sem liberar Administração completa antes de auth. |
| DEC-539 | **Fase A5: arquivos.** Arquivos, Visualizador e Editor com separação oficial/pessoal, IndexedDB, permissões e proteção contra perda. |
| DEC-540 | **Fase A6: preferências.** Configurações integradas aos shells e aplicativos, persistência seletiva, temas e acessibilidade. |
| DEC-541 | **Fase A7: jogos.** Snake, Paciência, Memória, Flappy Bird e Campo Minado em incrementos separados; avaliar licenciamento do DOOM antes de incluí-lo; rankings apenas nos jogos adequados. |
| DEC-542 | **Fase A8: avançados.** Terminal, Wally Estendido, autenticação e Administração; infraestrutura de autorização pode anteceder UI avançada quando exigida por apps anteriores. |
| DEC-543 | **Ordem dinâmica por dependência.** Sequência proposta pode reordenar subentregas por dependências reais e validação, mantendo os 18 apps e critérios aprovados. |

### Infraestrutura incremental e qualidade

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-544 | **Serviços sob demanda.** Criar fronteiras de API/cache/erros quando o primeiro consumidor surgir; evitar criar todos os serviços antes de uso. |
| DEC-545 | **Banco e segurança antes de escrita.** Configurar Supabase, RLS, migrações, ambientes e validação backend antes de habilitar publicações/curtidas/rankings/agendamentos com escrita remota. |
| DEC-546 | **Wally controlado.** Integrar Gemini por função protegida somente após limites de orçamento, ferramentas autorizadas, confirmação e fallback. |
| DEC-547 | **Testes por incremento.** Executar lint, build e testes unitários/contratos/UI pertinentes a cada entrega, além de revisão manual Desktop/Mobile quando aplicável. |
| DEC-548 | **Regressão transversal.** A cada marco de shell/Core rodar smoke de boot, instâncias, interação das janelas, navegação Mobile e URL estável. |
| DEC-549 | **Performance como gate.** Qualquer travamento crítico ao arrastar, redimensionar, maximizar/restaurar bloqueia progressão da etapa do gerenciador de janelas. |
| DEC-550 | **Critérios de segurança como gate.** Vazamento de segredo, acesso não autorizado, falha RLS e perda indevida de arquivos pessoais bloqueiam merge/publicação. |
| DEC-551 | **Revisão visual flexível.** Ajustes em layout e estética são permitidos dentro dos requisitos funcionais e Design System, documentando alterações relevantes. |

### Git, checkpoints e lançamento

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-552 | **Convenção de commits.** Mensagens curtas, específicas e consistentes, preferencialmente padrão `feat(scope):`, `fix(scope):`, `refactor(scope):`, `test(scope):`, `docs(scope):`; adaptar ao hábito do repositório. |
| DEC-553 | **Delimitação de commits.** Separar mudanças funcionais das correções e refatorações quando possível; não forçar commit por arquivo. |
| DEC-554 | **Push controlado.** Commit local não implica push automático; push é feito após confirmação do usuário e resultados de validação. |
| DEC-555 | **Branches e revisão.** Trabalhar em branch por incremento quando adequado, integração revisada na principal e deploy de prévia conforme B13. |
| DEC-556 | **Checkpoint por fase.** Cada fase fecha com demonstração do comportamento, lista dos arquivos modificados, riscos, testes e próximo incremento recomendado. |
| DEC-557 | **Sem implementação por aprovação de plano.** Aprovação do roadmap não concede autorização para executar comandos, alterar repositório, publicar ou comprar serviços. |
| DEC-558 | **Fase R1: consolidação.** Após apps, executar teste cruzado completo dos 18 aplicativos, UX Desktop/Mobile, privacidade, acessibilidade e recuperação de falhas. |
| DEC-559 | **Fase R2: produção.** Após aprovação expressa, realizar validação de DNS/HTTPS, prévia, segurança, cotas, rollback, backups, domínio warlley.dev e checklist de publicação. |


### Roadmap operacional — entregas e dependências

| Marco | Entrega mínima verificável | Dependência | Critérios de aceite obrigatórios | Exemplo de commit quando aprovado |
|---|---|---|---|---|
| F0 | diagnóstico do repositório, baseline e plano de arquivos | Autorização expressa para iniciar | estado inicial registrado; nenhuma mudança não autorizada | `docs(plan): preparar base da v2` |
| F1 | React/Vite/JS, estilos/tokens e boot mínimo | F0 | build, lint, boot e render base | `chore(core): iniciar estrutura da ws-os` |
| F2 | registry, instâncias, eventos mínimos e app placeholder | F1 | contrato de abrir/ativar/fechar e testes | `feat(core): adicionar registro e instancias` |
| F3a | Desktop, grade e janela básica | F2 | interação mínima e organização visual coerente | `feat(desktop): criar shell e janela base` |
| F3b | janelas completas, resize, minimizar/maximizar/restaurar, snap | F3a | **sem travamentos críticos** e regressão de geometria | `feat(windows): completar ciclo de vida` |
| F4a | Taskbar e WS Menu | F3b | ordem e comportamento aprovados, catálogo alfabético | `feat(desktop): integrar taskbar e menu` |
| F4b | Widgets, painéis, busca, notificações e calendário | F4a | grade, exclusividade dos painéis, foco/teclado | `feat(desktop): integrar paineis e widgets` |
| F5 | Mobile Home, catálogo, busca, apps fullscreen e navegação | F2 + contratos estáveis | retorno à origem, responsividade e URL estável | `feat(mobile): implementar shell mobile` |
| A1 | Sobre Mim, Sobre o Sistema, Currículo, Certificados e visualizador mínimo | F3/F5 conforme UI | fluxo completo nos dois shells, arquivos acessíveis | `feat(apps): adicionar apps institucionais` |
| A2 | Projetos, demos, Dev Insights | A1 + serviços públicos | dados reais/cached distinguíveis e demos seguras | `feat(apps): integrar projetos e insights` |
| A3 | Calculadora, Contato e solicitações | contratos de serviços + segurança de escrita | validação, antiabuso, confirmação real e privacidade | `feat(apps): adicionar contato e calculadora` |
| A4 | Notas + curtidas | Supabase, RLS, auth para operações administrativas | publicação apenas autorizada e escrita pública limitada | `feat(notes): integrar publicacoes e curtidas` |
| A5 | Arquivos + editor/visualizador | IndexedDB, serviços oficiais e permissões | isolamento local/remoto e não perda de dados | `feat(files): integrar gerenciador e editor` |
| A6 | Configurações + preferências compartilhadas | shells e persistência local | tema, acessibilidade, reset e estados coerentes | `feat(settings): integrar preferencias` |
| A7 | Jogos + recordes/rankings pertinentes | Core, ciclo de vida, backend quando necessário | controles, pausa, fraude proporcional; licença do DOOM verificada | `feat(games): integrar jogos e recordes` |
| A8 | Terminal, Wally Estendido, Administração | auth, funções protegidas, ferramentas permitidas | permissões reais, limitação de IA e ações confirmadas | `feat(system): integrar terminal wally e admin` |
| R1 | teste de integração geral + otimizações | todos os apps | critérios B12, segurança, acessibilidade, mobile/desktop | `test(release): cobrir fluxos criticos` |
| R2 | prévia, checklist operacional e lançamento eventual | R1 + aprovação expressa | B13, warlley.dev, HTTPS, rollback, limites | `chore(release): preparar publicacao` |

**Observação:** o roadmap é sequencial nas dependências, mas seus subincrementos podem ser intercalados quando isso reduzir retrabalho. A indicação de mensagem de commit é exemplo, não execução nem ordem irrevogável. Nenhum marco obriga um commit único: dividir entregas quando necessário.

### Protocolo de cada incremento

1. Informar objetivo e decisões cobertas, dependências e arquivos candidatos.
2. Obter autorização para implementar aquele incremento.
3. Aplicar mudanças limitadas ao escopo, usando arquivos completos quando houver reorganização ampla.
4. Executar/solicitar validações aplicáveis e apresentar evidências ou resultados, incluindo problemas conhecidos.
5. Exigir revisão e aprovação para commit; sugerir mensagem e conteúdo exato do commit.
6. Fazer push/deploy somente após autorização correspondente; nunca avançar automaticamente para próximo incremento.

### Auditoria de compatibilidade e bloqueios

- **B01–B05:** React/JavaScript/Vite, arquitetura modular sem proliferação de arquivos; aprovação do roadmap não revoga limite de não implementar sem autorização.
- **B02/B07/B08:** Taskbar/Desktop, app fullscreen Mobile, widgets, painéis e URL estável seguem as decisões originais.
- **B03/B10:** 12 apps Desktop e 6 de Sistema; a ordem do roadmap não cria, exclui nem reclassifica aplicativos.
- **B04/B11:** registry, ciclo de vida e contratos precedem aplicações que deles dependem; serviços técnicos entram progressivamente.
- **B09/B13:** Supabase e Cloudflare são escolhas condicionais; gastos/segredos, prévias e domínio seguem critérios já aprovados.
- **B12:** travamentos críticos em resize/maximizar/restaurar e falhas de segurança são bloqueadores; metas de fluidez só se afirmam após medição.
- **Visual:** ajustes visuais são permitidos sem alterar comportamento, permissões e requisitos confirmados.
- **Pendências deliberadas:** arquivos finais, bibliotecas opcionais, capacidade financeira dos provedores, conteúdo real e números de benchmarks dependem da validação próxima à implementação.

**Resultado:** nenhuma incompatibilidade impeditiva detectada; Bloco 14 **ENCERRADO**, implementação **NÃO INICIADA**. O próximo bloco deve detalhar a governança de execução e a prontidão para o primeiro incremento sem iniciar código.

---

## 3.18 Bloco 15 — Governança de execução e prontidão do primeiro incremento

**Estado:** CONCLUÍDO em 13/10/2026 por delegação expressa do usuário para decidir o próximo bloco.  
**Decisões:** DEC-560 a DEC-584 — APROVADAS por delegação.  
**Objetivo:** converter o roadmap B14 em um protocolo de início, revisão e controle de mudanças, sem iniciar código.  
**Limites:** não autoriza implementação, ferramentas pagas, alterações no repositório, commits, push nem deploy.

### Governança e autorização

| ID | Definição aprovada por delegação |
|---|---|
| DEC-560 | **Início explícito:** Concluir o planejamento não autoriza programação: o primeiro incremento F0 só começa após comando explícito do usuário; cada avanço segue autorização separada. |
| DEC-561 | **Escopo por incremento:** Antes de trabalhar, apresentar objetivo, critérios cobertos, dependências, arquivos candidatos, riscos e testes; executar somente o incremento autorizado. |
| DEC-562 | **Fonte de verdade:** Usar a última versão aprovada do mestre como referência; registrar diferenças encontradas no repositório sem substituir decisões por suposição. |
| DEC-563 | **Pontos de decisão:** Mudanças de escopo, novas dependências relevantes, alteração de contrato, custo ou segurança são submetidas à aprovação antes de execução. |
| DEC-564 | **Limite da autonomia:** Permitir correções locais compatíveis com o incremento, mas não iniciar a etapa seguinte, criar serviço pago, implantar ou alterar produção automaticamente. |

### Preparação do repositório e da etapa F0

| ID | Definição aprovada por delegação |
|---|---|
| DEC-565 | **Inventário inicial:** Inspecionar a branch, arquivos existentes, package.json, scripts, histórico Git, deploys e alterações pendentes antes de modificar o projeto; não presumir repositório vazio. |
| DEC-566 | **Estratégia de reconstrução:** Como a V2 é reconstrução do zero, preservar segurança e histórico Git, evitando sobrescrever trabalho existente sem identificação e autorização. |
| DEC-567 | **Baseline e ambiente:** Registrar ambiente de execução, versões de Node e gerenciador de pacotes disponíveis; selecionar versões e dependências só após checar compatibilidade real. |
| DEC-568 | **Estrutura mínima:** Na fundação, iniciar com arquivos apenas necessários ao projeto React/JavaScript/Vite, Core mínimo e shells progressivos; novas pastas entram por demanda. |
| DEC-569 | **Separação de configuração:** Documentar nomes e finalidades das variáveis de ambiente sem exibir segredos; não conectar produção desnecessariamente nos testes locais. |

### Formato de entrega e revisão

| ID | Definição aprovada por delegação |
|---|---|
| DEC-570 | **Apresentação de modificações:** Explicitar caminhos afetados, motivo e interação com arquitetura; fornecer arquivos completos em reorganizações, e alterações pontuais bem delimitadas nos demais casos. |
| DEC-571 | **Prova de execução:** Distinguir o que foi apenas proposto, escrito, executado, testado e validado pelo usuário; não afirmar build ou push sem evidência. |
| DEC-572 | **Feedback de problemas:** Relatar mensagens de erro, contexto de reprodução, impacto e correção planejada; tratar regressão de resize/maximização como bloqueio. |
| DEC-573 | **Checkpoint verificável:** Em cada entrega, listar funcionalidade pronta, requisitos cobertos, testes rodados, pendências e próxima entrega proposta antes de solicitar commit. |
| DEC-574 | **Commits e push distintos:** Sugerir mensagem clara e conteúdo do commit após validação; exigir autorização própria para commit e para push quando não abrangidos explicitamente. |

### Testes, qualidade e controle de mudanças

| ID | Definição aprovada por delegação |
|---|---|
| DEC-575 | **Testes mínimos da fundação:** Antes de aprovar F1, verificar inicialização, lint, build, boot e ausência de falhas graves; testes complementares entram conforme recursos forem implementados. |
| DEC-576 | **Critérios do Core:** F2 exige registro de apps, ID de instância e abrir/ativar/fechar verificáveis, com tratamento de erros e teste de contratos. |
| DEC-577 | **Performance como condição de avanço:** F3 precisa de testes repetidos de arrastar/redimensionar/maximizar/restaurar, sem travamento crítico, antes da expansão visual de Desktop. |
| DEC-578 | **Experiência em dois shells:** Integração de cada app deve ser checada em Desktop e Mobile conforme maturidade de ambos, preservando URL estável e navegação de origem. |
| DEC-579 | **Segurança e dados:** Não habilitar escrita remota pública ou operação administrativa antes de RLS, validação de autorização, proteção de credenciais e cenários negativos. |

### Checkpoints, riscos e encerramento

| ID | Definição aprovada por delegação |
|---|---|
| DEC-580 | **Matriz de riscos:** Manter riscos prioritários: desempenho das janelas, dados locais de visitantes, limites Supabase/Gemini, segurança e conflitos entre shells. |
| DEC-581 | **Registro de decisões na execução:** Registrar novas decisões somente quando necessárias; pequenos ajustes visuais coerentes com Design System não exigem reabrir o planejamento inteiro. |
| DEC-582 | **Bloqueios externos:** Disponibilidade de warlley.dev, benefícios estudantis, código do professor e limites dos provedores são verificados no momento oportuno, sem presumir conclusão. |
| DEC-583 | **Prontidão da fase F0:** Considerar o roadmap apto para iniciar F0 mediante autorização, sem afirmar que o repositório já foi inspecionado ou que dependências foram instaladas. |
| DEC-584 | **Fechamento do bloco:** Encerrar o Bloco 15 após revisão de compatibilidade, manter implementação NÃO INICIADA e preparar Bloco 16 de checklist final de prontidão se ainda necessário. |

### 3.18.1 Checklist para autorização futura do F0

- [x] Estratégia de governança do primeiro incremento definida.
- [x] Escopo do F0 limitado ao diagnóstico e preparação documental do repositório.
- [x] Regra de preservação de histórico e de alterações existentes documentada.
- [x] Contrato de apresentação do trabalho, testes e checkpoint estabelecido.
- [x] Critérios que bloqueiam avanço (segurança, regressão crítica, perda de dados, desempenho das janelas) preservados.
- [ ] Autorização explícita do usuário para executar F0 — **ainda não concedida**.
- [ ] Inspeção concreta do repositório, Git, dependências e ambiente — **não realizada**.
- [ ] Definição técnica final de ferramentas e versions de execução — **pendente da inspeção**.
- [ ] Preparação de credenciais/serviços externos — **pendente e não autorizada**.

### 3.18.2 Modelo operacional das respostas durante a execução

1. **Incremento:** ID, objetivo, dependências e decisões atendidas.
2. **Mudanças propostas:** caminhos dos arquivos, motivos, riscos e alternativa mínima.
3. **Execução:** código completo dos arquivos reorganizados; mudanças localizadas para ajustes pontuais.
4. **Verificação:** comandos efetivamente rodados, testes e resultados; não confundir teste sugerido com executado.
5. **Checkpoint:** resultado, problemas pendentes, mensagem sugerida de commit e próxima ação, aguardando aprovação.

### 3.18.3 Revisão de consistência

- **B01/B14:** todo o planejamento precede programação; autorização para definir este bloco não implica permissão para iniciar o F0.
- **B04/B05/B11:** Core modular e contratos sem proliferação de arquivos; inventário inicial determina alterações práticas.
- **B07/B12:** travamentos em resize/maximização/restauração bloqueiam a evolução das janelas.
- **B08/B09:** navegação interna não altera URL `warlley.dev`; dados locais permanecem locais; deploy e backend protegidos seguem validação.
- **B13:** branches, revisão, CI, prévia, produção e rollback permanecem como definidos, sem efetivar publicação neste bloco.
- **B10:** os 18 aplicativos continuam especificados; refinamentos visuais posteriores são permitidos sem alterar funcionalidade e identidade aprovada.

**Resultado:** nenhuma incompatibilidade material identificada. **Bloco 15 ENCERRADO.** Planejamento autorizado; implementação **NÃO INICIADA e NÃO AUTORIZADA** até comando expresso.

---

## 3.19 Bloco 16 — Checklist final de prontidão

**Estado:** CONCLUÍDO em 13/10/2026 por delegação explícita do usuário para decidir e finalizar o bloco.  
**Decisões:** DEC-585 a DEC-609, aprovadas por delegação.  
**Natureza:** revisão documental e preparação para autorização de execução; **nenhum código, instalação, análise do repositório, commit ou deploy foi executado**.

### Auditoria do escopo e da documentação

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-585 | **Fonte canônica:** A v0.16.0 passa a consolidar os blocos 01–16 e as decisões deste ciclo; documentos mais antigos e V1 permanecem referências, sem substituir decisões aprovadas. |
| DEC-586 | **Rastreabilidade:** Todos os 18 aplicativos, Core, shells, funcionalidades não-app, dados, segurança e integrações devem ter decisão e etapa de roadmap associada; revisar divergências durante F0. |
| DEC-587 | **Sem expansão automática:** Pendências e recomendações não criam apps, serviços pagos ou recursos novos; qualquer mudança relevante posterior exigirá decisão explícita. |
| DEC-588 | **Design evolutivo:** Conservar Design System e UX estrutural aprovados, com liberdade para ajustes visuais coerentes na execução sem fixar layouts prematuramente. |
| DEC-589 | **Critérios de pronto:** Cada incremento deve informar requisito, resultado, erros, acessibilidade, testes e checkpoint; implementação e publicação são aprovações distintas. |

### Prontidão para F0

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-590 | **Gate de início do F0:** O planejamento pode ser declarado pronto para F0, mas executar qualquer inspeção/ação no repositório dependerá de autorização explícita do usuário. |
| DEC-591 | **Escopo restrito de F0:** F0 cobre inspeção de repositório, branches, status Git, estrutura, dependências, scripts, histórico e ambiente; não substitui arquivos, instala dependências nem cria commits sem aprovação. |
| DEC-592 | **Baseline e trabalho existente:** Não presumir repositório vazio; identificar alterações locais ou remotas, preservar histórico e pedir direção se houver conflito com o planejamento. |
| DEC-593 | **Relatório F0:** Ao concluir F0, apresentar inventário, riscos, compatibilidades, recursos existentes reaproveitáveis apenas quando aprovados e proposta exata para F1. |
| DEC-594 | **Gate do F1:** F1 só inicia após aprovação dos resultados de F0, da estratégia de fundação e do incremento F1; esta delegação não concede tal permissão. |

### Dependências externas e segredos

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-595 | **Bloqueios situacionais:** Domínio, DNS, HTTPS, planos de provedores, benefícios estudantis e código do professor não bloqueiam o diagnóstico F0, mas bloqueiam a operação específica que deles dependa. |
| DEC-596 | **Supabase:** Usar como plataforma principal condicionada a teste de requisitos, segurança, limites e política de inatividade; rotina do professor exige análise de código, licença e confiabilidade antes de adoção. |
| DEC-597 | **Cloudflare e domínio:** Cloudflare Pages é a primeira opção condicional; warlley.dev é o endereço principal, www redireciona; app interno não muda URL; verificar DNS, HTTPS e renovação antes de lançar. |
| DEC-598 | **Credenciais e ambiente:** Segredos não entram no cliente nem no mestre; preview e produção usam isolamento conforme risco; credenciais só serão configuradas na fase necessária e autorizada. |
| DEC-599 | **Custos e indisponibilidade:** Não contratar plano pago sem autorização; cotas, rate limiting, orçamento e fallback seletivo precisam ser conferidos antes de habilitar serviços com consumo variável. |

### Qualidade, segurança e regressões

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-600 | **Prova de performance:** Gerenciador de janelas só avança de fase após testar resize, drag, maximizar, restaurar, snap e alternar viewport; travamentos críticos são bloqueadores. |
| DEC-601 | **Segurança antes de escrita pública:** Nenhuma escrita remota pública, modificação administrativa, upload privado ou ferramenta sensível do Wally será liberada sem políticas, autorização backend e cenários negativos. |
| DEC-602 | **Proteção de dados locais:** Arquivos pessoais do visitante continuam apenas no navegador; falhas de quota/armazenamento devem ter mensagens e comportamento recuperável. |
| DEC-603 | **Acessibilidade transversal:** Validar WCAG 2.2 AA como referência, teclado, foco, zoom, leitor de tela, toque e movimento reduzido ao longo do desenvolvimento. |
| DEC-604 | **Testes e evidências:** Rodar lint, build, testes de contratos/integração e fluxos adequados à maturidade; distinguir teste planejado de teste efetivamente realizado. |

### Controle de entrega e lançamento

| ID | Decisão aprovada por delegação |
|---|---|
| DEC-605 | **Formato de trabalho:** Apresentar escopo, arquivos afetados, justificativa, mudanças, verificações executadas, pendências e checkpoint; reorganização de arquivos exige fornecer o conteúdo completo afetado. |
| DEC-606 | **Commits e push:** Não criar commits, push ou deploy automaticamente; sugerir mensagens descritivas e obter aprovação no momento pertinente, conforme B14–B15. |
| DEC-607 | **Publicação:** Deploy de produção exige gates de qualidade, segurança, DNS/HTTPS, custos, prévia, rollback e aprovação explícita; publicar não é consequência automática da validação técnica. |
| DEC-608 | **Registro de desvios:** Manter changelog do mestre ou registros de decisão para mudanças relevantes na execução; bugs e pequenos ajustes visuais compatíveis não reabrem todos os blocos. |
| DEC-609 | **Encerramento do planejamento:** Com B16 concluído, o desenho-base fica pronto para fase de execução controlada; nada foi testado no repositório nesta etapa e implementação continua NÃO INICIADA. |

### 3.19.1 Checklist de prontidão

| Requisito | Situação | Observação |
|---|---|---|
| Escopo de produto e 18 aplicativos | CONCLUÍDO | B01–B03, B10 |
| Arquitetura, Core e contratos | CONCLUÍDO em especificação | B04–B05, B11; assinatura final a confirmar na execução |
| Design System, Desktop e Mobile | CONCLUÍDO em especificação | B06–B08; refinamento visual permitido |
| Serviços, infraestrutura, domínio e segurança | CONCLUÍDO em arquitetura | B09, B11–B13; fornecedores condicionados à verificação |
| Qualidade, desempenho e testes | CONCLUÍDO em critérios | B12; medições reais não realizadas |
| Roadmap, incrementos e commits | CONCLUÍDO em planejamento | B14 |
| Protocolo de autorização e revisão | CONCLUÍDO | B15 |
| Diagnóstico real do repositório F0 | PENDENTE | Exige comando expresso; não foi realizado |
| Instalação, código e testes de execução | NÃO INICIADOS | Dependem dos incrementos autorizados |
| Credenciais, DNS, Supabase e deploy | NÃO EXECUTADOS | Validar na fase pertinente |

### 3.19.2 Matriz de gates de execução

| Gate | Condição de entrada | Permitido após autorização | Não presumir |
|---|---|---|---|
| G0 — F0 | Solicitação expressa do usuário para iniciar diagnóstico | Inspecionar repositório, ambiente, Git, dependências e produzir relatório | Modificar código, instalar, commit/push/deploy |
| G1 — F1 | Relatório F0 aprovado e incremento F1 delimitado | Construir fundação mínima e testar conforme escopo | Implementação de outros incrementos |
| G2 — Core/Desktop/Mobile | Contratos e base validados, autorização por incremento | Desenvolver/testar shells progressivamente | Avançar apesar de travamento crítico |
| G3 — Dados e integrações | Segurança/credenciais/limites adequados e autorização | Implementar consumo de APIs, escrita e recursos protegidos | Exposição de segredos ou contorno de RLS |
| G4 — Publicação | Checklists de segurança, acessibilidade, qualidade, custos e infraestrutura aprovados | Publicar versão específica autorizada | Push ou produção implícitos por commit |

### 3.19.3 Pendências classificadas

**Antes de F0:** apenas aprovação expressa do usuário para iniciar a inspeção. O planejamento final está suficientemente definido para um diagnóstico inicial sem compromissos de implementação.

**Após inspeção F0 / antes de F1:** reconciliar estado real do Git/repositório, Node, scripts, estruturas preexistentes e dependências; delimitar a fundação mínima e obter autorização.

**Antes dos incrementos relacionados:** conferir acesso/licença do código do professor, política Supabase, limites do Gemini, fontes públicas WakaTime, opções de hospedagem, dados reais e formatos; nenhuma dessas pendências habilita serviços automaticamente.

**Antes da publicação:** domínio warlley.dev, DNS, HTTPS, redirects, ambiente produtivo, custos/alertas, proteção de segredos, prévia, backup/recovery, regressões de janelas, acessibilidade e autorização expressa.

### 3.19.4 Conclusão e compatibilidade

A revisão do B16 confirma consistência com o catálogo de 18 aplicativos, a URL estável, privacidade de pastas locais, autorização backend, experiências Desktop/Mobile distintas, contratos versionáveis, desempenho de janelas como gate, CI e rollbacks planejados. Não houve introdução de funcionalidades adicionais ou troca de fornecedores.

**Conclusão:** encerrados os **16 blocos** e concluído o planejamento-base. DEC-001 a DEC-609 aprovadas neste ciclo. **Pronto para solicitar autorização de F0, mas F0 NÃO AUTORIZADO; implementação NÃO INICIADA.**

---

## 4. Mapa preliminar de blocos — NÃO APROVADO

A organização abaixo é um índice de discussão, não uma estrutura imutável aprovada. Os nomes, limites, dependências e quantidades poderão mudar mediante validação.

| Grupo | Tema candidato | Estado |
|---|---|---|
| B01 | Visão, identidade e princípios | CONCLUÍDO |
| B02 | Estrutura e experiência Desktop/Mobile | CONCLUÍDO |
| B03 | Catálogo de aplicativos e responsabilidades | CONCLUÍDO |
| B04 | Arquitetura e núcleo do sistema | CONCLUÍDO |
| B05 | Estrutura técnica e organização do projeto | CONCLUÍDO |
| B06 | Design System e identidade visual | CONCLUÍDO |
| B07 | Desktop e componentes estruturais | CONCLUÍDO |
| B08 | Experiência Mobile | CONCLUÍDO |
| B09 | Serviços, integrações e infraestrutura de dados | CONCLUÍDO |
| B10 | Especificação funcional dos 18 aplicativos e contratos | CONCLUÍDO |
| B11 | Contratos técnicos, dados e integração | CONCLUÍDO |
| B12 | Segurança, acessibilidade, desempenho e qualidade | CONCLUÍDO |
| B13 | Publicação e preparação operacional | CONCLUÍDO |
| B14 | Roadmap, etapas, testes, commits e checkpoints | CONCLUÍDO |
| B15 | Governança de execução e prontidão do F0 | CONCLUÍDO |
| B16 | Checklist final de prontidão | CONCLUÍDO |

**Regra de planejamento completo:** antes da prática, detalhar os aplicativos individualmente e as interações, interfaces, dados, APIs, acessibilidade, testes, dependências e sequência de implementação. O plano de commits deve conter momentos, escopo e convenções de mensagens; hashes só existirão após execução.

---

## 5. Pendências e pontos de atenção

O planejamento-base dos Blocos 01–16 está concluído. Os itens abaixo são **dependências de execução e validação**, não novos blocos obrigatórios nem autorizações tácitas.

1. **Gate F0:** obter autorização expressa para inspecionar o repositório V2, Git, scripts, ambiente, versões e alterações pendentes.
2. **Gate F1:** após o relatório F0, confirmar fundação mínima e autorizar mudanças, dependências e primeiros testes.
3. **Interface e conteúdo reais:** validar apresentação visual, conteúdo profissional e textos nos incrementos pertinentes, sem reabrir especificação funcional salvo mudança de escopo.
4. **Infraestrutura:** testar limites e condições atuais de Supabase, Cloudflare, GitHub, WakaTime, Gemini e EmailJS; jamais expor segredos.
5. **Rotina do professor:** localizar e revisar código, licença, segurança e adequação antes de propor adoção.
6. **Operação de warlley.dev:** conferir titularidade, benefício estudantil, prazo de renovação, DNS e HTTPS antes de publicar.
7. **Qualidade concreta:** medir desempenho de janelas em dispositivos de referência e executar testes de autorização, armazenamento, acessibilidade e regressão.
8. **Comandos e commits:** registrar execução real, checkpoints e mensagens sugeridas, com consentimento separado para commit, push e deploy.

**Proibido por padrão:** programar, alterar repositório, instalar dependências, provisionar serviço pago, fazer commit/push ou publicar antes da autorização pertinente.

---

## 6. Histórico do documento

| Data | Versão | Alteração |
|---|---|---|
| 13/10/2026 | 0.16.0 | Bloco 16 encerrado por delegação (DEC-585–609): checklist, gates F0–G4, pendências por fase e revisão geral. |
| 13/10/2026 | 0.15.0 | Bloco 15 encerrado por delegação (DEC-560–584): governança, F0, checkpoints, aprovações e bloqueios. |
| 13/10/2026 | 0.14.0 | Bloco 14 encerrado por delegação (DEC-519–559): metodologia incremental, roadmap de entregas, dependências, testes e commits. |
| 13/10/2026 | 0.13.0 | Bloco 13 encerrado por delegação (DEC-488–518): publicação, DNS, ambientes, CI, custos, rollback e operação. |
| 13/10/2026 | 0.12.0 | Bloco 12 encerrado por delegação explícita (DEC-450–487): segurança, acessibilidade, desempenho, testes e critérios de aceite. |
| 13/10/2026 | 0.11.0 | Encerramento do Bloco 11 por delegação explícita (DEC-411–449): contratos de Core, domínio, API, persistência, segurança e validação. |
| 13/10/2026 | 0.10.0 | Encerramento do Bloco 10 (DEC-355–410): estratégia funcional, 18 aplicativos, contratos, critérios de aceitação e refinamento visual permitido. |
| 13/10/2026 | 0.9.0 | Consolidação do Bloco 09 (DEC-302–354), domínio warlley.dev, esclarecimento obrigatório sobre URL inalterada ao abrir apps, custos, privacidade, hospedagem e segurança. |
| 13/10/2026 | 0.8.0 | Consolidação do Bloco 08 (DEC-267–301), revisão do Mobile e compatibilidade com blocos anteriores. |
| 13/10/2026 | 0.7.0 | Consolidação do Bloco 07 (DEC-226–266) e esclarecimento de posicionamento da DEC-251. |
| 13/10/2026 | 0.6.0 | Consolidação do Bloco 06 (DEC-180–225), paleta inicial, escalas e revisão de consistência. |
| 13/10/2026 | 0.5.0 | Consolidação do Bloco 05 (DEC-156–179), estrutura-base e revisão de consistência. |
| 13/10/2026 | 0.4.0 | Consolidação do Bloco 04 (DEC-128–155), revisão da DEC-135 e conferência de consistência. |
| 13/10/2026 | 0.3.0 | Consolidação do Bloco 03 (DEC-089–127), esclarecimento de DEC-125 e revisão de dependências. |
| 12/10/2026 | 0.2.0 | Consolidação do Bloco 02 (DEC-019–088) e diretrizes técnicas de responsividade. |
| 12/10/2026 | 0.1.0 | Início do mestre independente deste ciclo; consolidação das DEC-001–018; verificação de consistência e encerramento do B01. |

## 7. Próxima ação

Aguardar autorização explícita do usuário para o **F0 — Diagnóstico e preparação documental do repositório**. Ao receber a autorização, inspecionar o ambiente e produzir relatório sem alterar arquivos, instalar dependências ou executar commit/push/deploy, exceto mediante autorização específica adicional. Se o F0 for validado, propor o primeiro incremento F1 com escopo e testes exatos.

A navegação interna da WS OS continuará mantendo a URL principal estável, conforme B09.

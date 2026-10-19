# WS OS V2 — Etapa 02: Decisões técnicas e planejamento de implementação

**Arquivo de destino no repositório:** `docs/finalizacao/ETAPA-02-DECISOES-TECNICAS.md`  
**Referências:** `docs/planning/WS-OS-V2-MESTRE-v0.16.0.md`; `docs/PLANO-FINALIZACAO-POR-ETAPAS.md`; Etapa 01 concluída  
**Estado:** planejamento consolidado, **aguardando aprovação expressa** do proprietário  
**Implementação:** não autorizada  
**Registro de decisões:** D02-01 a D02-65 (65 decisões aprovadas individualmente)  
**Regra de tradução:** não modificar `src/shared/i18n/locales/pt-BR.json` nem `en.json` antes da fase final do projeto.

> Este documento registra decisões aprovadas e critérios de execução. Sua entrega não constitui aceite final do planejamento nem autorização para iniciar implementação, fazer commits ou publicar alterações.

---

## 1. Objetivo, escopo e princípios

Consolidar os fundamentos de Design System do WS OS V2: identidade visual profissional e tecnológica, temas Dark/Light, tokens, controles e componentes reutilizáveis, padrões responsivos, acessibilidade, efeitos, wallpapers e cursores. Entregar recursos **funcionais e verificáveis** na Etapa 02, preservando o Core e delegando as interfaces de domínio às respectivas etapas de finalização.

Princípios obrigatórios:

1. **Preservar a base existente:** reaproveitar os gerenciadores e componentes atuais antes de propor substituições.
2. **Responsabilidade clara:** tokens globais e primitivas compartilhadas no Design System; composição específica na pasta do aplicativo.
3. **Compatibilidade:** identificar consumidores de classes, tokens e assinaturas antes de alterá-los; acrescentar transições quando necessário.
4. **Organização sem pulverização:** criar arquivos somente por responsabilidade concreta e reutilização comprovada.
5. **Desktop e Mobile distintos:** compartilhar fundamentos sem impor o mesmo layout ou o mesmo comportamento de shell.
6. **Acessibilidade e desempenho:** contraste, foco, teclado, movimento reduzido e fallback são requisitos, não extras.
7. **Aceite verificável:** componentes e recursos não poderão ser declarados prontos apenas por existirem em um catálogo.
8. **Sem traduções nesta etapa:** preservar o mecanismo `t()` e registrar chaves pendentes, mantendo os arquivos JSON intactos.
9. **Sem novas decisões automáticas:** qualquer alteração de escopo depende de aprovação explícita.

---

## 2. Registro integral das decisões aprovadas

As descrições abaixo consolidam o sentido das alternativas aprovadas. **D02-64 C substitui a decisão anterior D02-64 B**; D02-65 B foi aprovada posteriormente.

### 2.1. Bloco 02-A — Identidade visual e temas

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-01 | B | Identidade moderna e tecnológica, com transparência, profundidade, animações e acabamento profissional refinado. |
| D02-02 | C | Cor de destaque extraída automaticamente do wallpaper, com ajuste manual. |
| D02-03 | B | Transparência e blur intermediários; preservar legibilidade. |
| D02-04 | B | Bordas moderadamente arredondadas e consistentes. |
| D02-05 | A | Três wallpapers oficiais por tema, com escolhas preservadas. |
| D02-06 | B | Cursores personalizados por padrão, com opção de retornar aos nativos. |

### 2.2. Bloco 02-B — Tipografia, espaçamento e controles

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-07 | A | Nunito Sans para a interface e JetBrains Mono para código e Terminal. |
| D02-08 | B | Densidade equilibrada de conteúdo e espaçamento. |
| D02-09 | B | Botões e controles modernos, com profundidade discreta, bordas refinadas e feedback visual. |
| D02-10 | B | Hierarquias de botão: primário, secundário, discreto e destrutivo. |
| D02-11 | B | Scrollbars minimalistas, com destaque ao hover/interação. |
| D02-12 | A | Ícones lineares consistentes em espessura e dimensões. |

### 2.3. Bloco 02-C — Componentes compartilhados

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-13 | B | Componentes React somente quando houver comportamento ou reutilização concreta; completar com CSS padronizado. |
| D02-14 | B | Diálogos por finalidade: informação, confirmação, formulário e ação destrutiva, com foco e teclado. |
| D02-15 | B | Tooltips relevantes, com atraso breve no hover e acesso equivalente por foco. |
| D02-16 | B | Feedback contextual no aplicativo e notificações discretas quando apropriado. |
| D02-17 | B | Cards e containers com hierarquia de superfícies, bordas, elevação e transparência moderada. |
| D02-18 | B | Estados normal, hover, foco, pressionado, selecionado, desabilitado, carregando e erro, conforme aplicável. |
| D02-19 | B | Menus consistentes com teclado, Escape, foco, agrupamento lógico e fechamento contextual. |

### 2.4. Bloco 02-D — Responsividade e layout

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-20 | B | Componentes compartilhados com composição adaptativa para Desktop, tablet e Mobile. |
| D02-21 | B | Toolbars priorizam ações principais e agrupam secundárias em espaços reduzidos. |
| D02-22 | B | Listas e grades conforme conteúdo, com colunas adaptativas e opções pertinentes. |
| D02-23 | B | Formulários em uma ou mais colunas conforme o espaço, mantendo ordem de leitura e ações acessíveis. |
| D02-24 | B | Master/detail lado a lado quando possível; navegação entre lista e detalhes em áreas pequenas. |
| D02-25 | B | Largura de leitura controlada quando útil; editores e documentos aproveitam área disponível. |
| D02-26 | B | Adaptação à área útil e rolagem nas regiões adequadas, evitando overflow horizontal indevido. |
| D02-27 | B | Tabelas adaptativas por contexto: rolagem acessível, priorização de colunas ou apresentação por registro. |

### 2.5. Bloco 02-E — Acessibilidade, animações e desempenho

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-28 | B | Animações equilibradas, fluidas, rápidas e discretas. |
| D02-29 | B | Respeitar `prefers-reduced-motion` e oferecer configuração própria. |
| D02-30 | B | Níveis configuráveis de efeitos com fallback em condições limitadas. |
| D02-31 | B | Navegação por teclado consistente, foco visível, ordem lógica e sem armadilhas. |
| D02-32 | B | Contraste acessível, superfícies de proteção e adaptação de cores quando preciso. |
| D02-33 | B | Skeletons, progresso ou carregamento contextual conforme operação, sem excesso de animações. |
| D02-34 | B | Transições discretas de cor, borda, elevação e opacidade. |
| D02-35 | B | Áreas de toque confortáveis e alternativas às interações dependentes de hover. |

### 2.6. Bloco 02-F — Wallpapers e cursores

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-36 | A | Dark Blue e Light Blue como wallpapers padrão. |
| D02-37 | B | Escolhas de wallpaper independentes por tema, com troca automática ao alternar Dark/Light. |
| D02-38 | B | Permitir upload de wallpapers pessoais, com validação, persistência local e remoção. |
| D02-39 | B | Modos de exibição preencher, ajustar e centralizar, com prévia. |
| D02-40 | B | Paleta compatível com o tema, correção de contraste e destaque substituível manualmente. |
| D02-41 | B | Cursores geométricos modernos, tecnológicos e com detalhes discretos de destaque. |
| D02-42 | B | Variantes essenciais de interação por estilo e fallback nativo para estados especiais quando necessário. **Detalhada/ampliada pela D02-64 C.** |
| D02-43 | B | Cursores personalizados somente quando houver apontador compatível; touch mantém comportamento nativo. |

### 2.7. Bloco 02-G — Arquitetura, testes e entrega

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-44 | B | Separar tokens/primitivas globais, componentes e composição particular de aplicativos. |
| D02-45 | B | Reaproveitar padrões existentes, extrair componentes quando necessário e migrar consumidores com controle. |
| D02-46 | B | Fundamentos visuais agora; persistência completa na Etapa 04; interface final em Configurações na Etapa 14. |
| D02-47 | B | Preservar compatibilidade de CSS e remover duplicações verificadas, documentando migrações. |
| D02-48 | B | Validar telas reais em Dark/Light, tamanhos de janela, Mobile, teclado e estados interativos. |
| D02-49 | B | Lint, build, suíte completa e testes direcionados para contratos, temas, acessibilidade e componentes. |
| D02-50 | B | Um commit por parte 02.1–02.5, em português, sem escopo entre parênteses. |
| D02-51 | B | Documentar tokens, componentes, contratos, consumidores, validações e limitações; congelar base após aceite. |
| D02-52 | B | Não editar JSON de traduções até a fase final; registrar novas chaves pendentes. |

### 2.8. Revisão complementar

| ID | Alternativa | Deliberação |
|---|---|---|
| D02-53 | B | Wallpapers selecionados independentemente por tema **e** plataforma: Desktop Dark/Light e Mobile Dark/Light. |
| D02-54 | A | Cor de destaque escolhida manualmente permanece até redefinição, inclusive ao trocar wallpaper. |
| D02-55 | B | Efeitos reduzidos mantêm wallpaper estático; ocultar a imagem é opção independente. |
| D02-56 | B | Módulos CSS temáticos com responsabilidades exclusivas e precedência documentada. |
| D02-57 | B | Paletas predefinidas para seis wallpapers oficiais; extração controlada para imagens pessoais, contraste e fallback. |
| D02-58 | B | Formatos seguros e definidos; limites de arquivo/resolução, validação e tratamento de falhas de armazenamento. |
| D02-59 | B | Recursos vetoriais SVG para cursores Dark/Light, com fallback nativo. |
| D02-60 | B | Recursos oficiais, fundamentos e contratos na Etapa 02; persistência completa na 04 e interface na 14. |
| D02-61 | B | Coleção **múltipla** de wallpapers pessoais, local, com seleção por tema/plataforma, limites e remoção segura. |
| D02-62 | B | Destaque manual independente por tema e compartilhado entre Desktop/Mobile. No automático, extração contextual conforme wallpaper da plataforma. |
| D02-63 | B | Reorganização estruturada do CSS existente, preservando compatibilidade e criando apenas arquivos necessários. |
| D02-64 | **C** | **Personalização completa dos cursores**: padrão, clique, texto, carregamento, redimensionamento, arraste, indisponível e ajuda, inclusive variantes direcionais necessárias. Substitui D02-64 B. |
| D02-65 | **B** | **Fundamentos funcionais e validados**: temas, seis wallpapers oficiais, cursores completos, destaques e componentes utilizáveis no sistema atual; persistência avançada na 04 e UI final na 14. |

---

## 3. Inventário técnico da base existente

### 3.1. Estilos presentes no repositório

- `src/styles/global.css`: entrada de fontes, imports de temas, regras globais e scrollbars.
- `src/styles/system.css`: agregação explícita de CSS do Desktop, janelas, Taskbar, menu, painéis e widgets.
- `src/styles/apps.css`: estilos gerais `.ws-app`, controles, cards, toolbar, grids e outras regras; necessita separar primitivas reais de composição específica.
- `src/styles/themes/tokens.css`: raios, blur, sombra e tempos de transição.
- `src/styles/themes/dark.css` e `light.css`: superfícies, textos, bordas e destaques básicos.
- `src/styles/themes/effects.css`: sombras, transparência, blur e tratamento de efeitos reduzidos.
- `src/styles/themes/foundation.css`: tokens semânticos, foco, controles e algumas regras específicas de shell/painel.
- `src/styles/themes/customization.css`: overrides de accent/blur/transparência/motion e seletores de componentes.
- `src/styles/themes/glass.css`: superfícies translúcidas, backdrop-filter, exceções por interação e fallback.

**Risco confirmado:** responsabilidade sobreposta entre `effects.css`, `foundation.css`, `customization.css` e `glass.css`. Há definições conflitantes ou repetidas de transparência, blur, fundo de componentes e efeitos reduzidos. A Parte 02.1 deverá mapear cascata e consumidores antes de reorganizar.

### 3.2. Serviços e contratos existentes

- `src/core/themeManager.js`: tema Dark/Light (verificar consumidores e sincronização na execução).
- `src/core/appearanceManager.js`: opções atuais `blue`/`violet`/`green`, motion, blur e transparência.
- `src/core/effectsManager.js`: preferências de movimento/transparência reduzidos e low effects.
- `src/core/wallpaperManager.js`: catálogo atual com wallpapers por gradiente (`original`, `aurora`, `minimal`), seleção por `desktop`/`mobile`, imagem pessoal única, validação de PNG/JPEG/WebP e uso de `wallpaperStorage`.
- `src/core/preferencesManager.js`, `preferenceContract.js`: persistência/reset e validação de chaves legadas.
- `src/services/storage/wallpaperStorage.js`: armazenamento atual das imagens (auditar antes de evoluir).
- `src/shared/components/AppCloseDialog.jsx`, `AppErrorBoundary.jsx`: exemplos existentes de componentes compartilhados que deverão ser preservados ou evoluídos com testes.
- `tests/core/accessibility.test.cjs`: cobertura existente de acessibilidade/i18n; complementar sem falsificar regressões.

**Limites atuais do upload:** até 5 MiB, PNG/JPEG/WebP, até 32 megapixels e 8192 pixels por lado. Manter como referência inicial da validação; coleção pessoal exige definir também quota agregada e estratégia de exclusão em implementação sem inventar limite aprovado.

---

## 4. Identidade, temas e tokens

### 4.1. Direção visual

Estética profissional/tecnológica, não neon generalizado: hierarquia de superfícies, cantos moderados, sombras e vidro equilibrados; efeitos de destaque localizados, contraste e legibilidade prioritários.

Fontes: **Nunito Sans** para UI; **JetBrains Mono** para Terminal/código e conteúdos técnicos. Escalas de tipografia, espaçamento e dimensões consistentes, com densidade equilibrada.

### 4.2. Contratos semânticos de tokens

Organizar responsabilidades de tokens de: canvas e superfícies, texto, acento, links e ações, estados sucesso/aviso/erro, borda, raio, elevação, opacidade, blur, tipografia, spacing, tamanho de controle, foco, scrollbar e duração de transição.

Tokens devem ter significado estável nos dois temas. Nenhum componente deve depender da ordem incidental de duas definições conflitantes. Não alterar nomes públicos de tokens sem compatibilidade/migração comprovada.

### 4.3. Precedência de aparência

Ordem conceitual: **base compartilhada → tema Dark/Light → paleta ou opção manual → personalização de efeito → requisitos de acessibilidade e fallback**. A aplicação técnica (cascade/layers/imports) deverá materializar essa ordem sem adicionar overrides arbitrários.

### 4.4. Níveis de efeito

Aprimorar opções já existentes (`blur`, `transparency`, `motion`, `accessibility`) em vez de criar mecanismos paralelos. Blur de múltiplas camadas e efeitos durante drag/resize devem ser evitados por custo. Modo de pouco efeito reduz blur/sombra/animação, **sem ocultar wallpaper estático** (D02-55). Preferência explícita de ocultar imagem, se disponibilizada, é independente.

---

## 5. Cores dinâmicas, precedência e contraste

1. Seis wallpapers oficiais possuem **paletas predefinidas por wallpaper e tema**, compatíveis com contraste e legibilidade.
2. Imagens pessoais usam extração **controlada**, sem depender de serviço externo; candidatos inválidos ou inadequados levam a fallback seguro.
3. A configuração de acento tem **modo automático ou manual**. Seleção manual não é substituída pela troca de imagem (D02-54).
4. O **modo de seleção é por tema**, compartilhado entre Desktop e Mobile (D02-62). No modo automático, Desktop e Mobile podem exibir acentos resultantes diferentes porque usam wallpapers diferentes. No manual, ambos usam a cor manual definida para o tema.
5. Conservar os destaques legados `blue`, `violet` e `green` e migrar seu significado sem perder preferência.
6. Validar contrastes de texto, foco e ações contra superfícies efetivas; não aplicar cor extraída cegamente a todos os elementos.
7. Falha de leitura/extração nunca deve bloquear interface, troca de tema ou navegação.

---

## 6. Wallpapers oficiais e coleção pessoal

### 6.1. Arquivos oficiais recebidos

| Identificador técnico proposto | Arquivo enviado | Tema | Padrão inicial |
|---|---|---|---|
| `dark-blue` | `dark-blue.jpg` | Dark | **Sim** |
| `dark-green` | `dark-green.jpg` | Dark | Não |
| `dark-violeta` | `dark-violeta.jpg` | Dark | Não |
| `light-blue` | `light-blue.jpg` | Light | **Sim** |
| `light-green` | `light-green.jpg` | Light | Não |
| `light-violeta` | `light-violeta.jpg` | Light | Não |

Esses arquivos foram fornecidos pelo proprietário na conversa. Não substituir por imagens de busca, não redesenhar nem alterar arte sem autorização. Os IDs são sugestão de catalogação a ser validada tecnicamente, não novas opções visuais aprovadas.

### 6.2. Quatro seleções independentes

- `desktop/dark`
- `desktop/light`
- `mobile/dark`
- `mobile/light`

A alternância do tema recupera a escolha daquela combinação sem sobrescrever as demais. `cover` (preencher), `contain` (ajustar) e centralizar, com prévia, são modos aprovados; assegurar fallback caso a imagem esteja ausente.

### 6.3. Coleção pessoal

Coleção local de várias imagens, não um único slot compartilhado (D02-61). Requisitos de contrato:

- Identidade persistente por imagem, metadados mínimos e referência de seleção por contexto.
- Verificação de formato real, dimensões e peso; rejeição segura de arquivos inválidos.
- Limite agregado e resposta explícita para quota/armazenamento indisponível; valor operacional concreto a documentar quando implementado.
- Inclusão e exclusão seguras: imagem selecionada não pode gerar referência órfã silenciosa; imagem anterior preservada quando upload falhar.
- Não enviar imagens pessoais a servidor; não logar conteúdo; gerenciar revogação de URLs temporárias.
- Migração não destrutiva da imagem pessoal única anterior e seleções por plataforma; definir o caso de ambas as plataformas compartilharem a mesma imagem.
- Adoção em etapas: contratos/recursos e integração demonstrável na 02; persistência/sincronização avançada na 04; gestão completa e opções na 14. **Não declarar a coleção pessoal finalizada na Etapa 02 se a persistência avançada ainda estiver pendente.**

### 6.4. Fallback e acessibilidade

Efeitos reduzidos não devem apagar o wallpaper. Se a imagem não puder ser carregada ou renderizada, utilizar cor/superfície legível. Avaliar contraste dos rótulos de atalhos sobre imagens claras e escuras; garantir foco perceptível.

---

## 7. Cursores personalizados

### 7.1. Estética

Estilo geométrico moderno com detalhe tecnológico discreto. Versões **Dark** (alto contraste sobre superfícies escuras) e **Light** (alto contraste sobre superfícies claras). Cursores personalizados habilitados por padrão, com escolha de cursor nativo.

### 7.2. Estados aprovados — D02-64 C

Conjunto **completo**, incluindo:

1. Padrão.
2. Clique/link.
3. Texto (I-beam).
4. Carregamento/ocupado.
5. Redimensionamento — variantes horizontais, verticais e diagonais necessárias, com direção inequívoca.
6. Arraste/movimentação, incluindo estados pertinentes de arrastar/soltar.
7. Indisponível/bloqueado.
8. Ajuda.

Oito categorias **não significam necessariamente oito arquivos por tema**: algumas categorias precisam de múltiplas direções/estados. Não reduzir o escopo a somente quatro variantes; a D02-64 **C prevalece** sobre a seleção anterior B.

### 7.3. Contrato técnico

- Recursos SVG estáticos, com hotspot definido por variante; testar resolução e suporte real nos navegadores alvos.
- Fallback CSS nativo (`auto`, `pointer`, `text`, `wait`, `ew-resize`, etc.) sempre disponível.
- Não substituir globalmente todos os cursores por uma única seta; manter affordance e semântica de ações.
- Aplicação condicionada à presença de apontador adequado; interfaces exclusivamente touch permanecem nativas.
- Não adicionar dependência externa para cursores; evitar cursor DOM acompanhando mouse por JavaScript.
- Respeitar preferências de contraste e capacidade do navegador; ações críticas permanecem usáveis sem os SVGs.
- Controle definitivo em Configurações na Etapa 14; na Etapa 02, demonstrar integração funcional sem criar interface final duplicada.

---

## 8. Componentes compartilhados e estados

### 8.1. Componentização

Priorizar estilos semânticos compartilhados e componentes React apenas para comportamento reutilizável: não obrigar wrappers para todos os elementos HTML. Preservar `AppCloseDialog`, `AppErrorBoundary` e os mecanismos que já atendem aos contratos da Etapa 01.

### 8.2. Controles e hierarquia

Botões primário/secundário/discreto/destrutivo, campos, select, checkbox, textarea, mensagens, cards, badges informativas e estados de carregamento. Estados possíveis: normal, hover, foco, ativo/pressionado, selecionado, desabilitado, carregando e erro; nem todo estado se aplica a todo controle.

### 8.3. Diálogos, menus e tooltips

- Diálogos de informação, confirmação, formulário e operação destrutiva; foco inicial e retorno de foco, Escape quando permitido, sem armadilha involuntária.
- Menus com agrupamento lógico, suporte de teclado e fechamento por contexto.
- Tooltips com atraso breve para mouse e equivalência para foco por teclado; não usados como única fonte de instrução crítica.
- Feedback prioritariamente contextual; notificações discretas para resultados relevantes, sem duplicar ações.
- Cards e superfícies com hierarquia controlada, não vidro intenso em todo elemento.

### 8.4. Migração

Identificar consumidores antes de mover CSS de `apps.css` ou extrair componentes. Manter classes antigas por transição quando necessário. Não converter todos os aplicativos durante esta etapa; acabamento interno dos apps continua nas respectivas etapas.

---

## 9. Padrões responsivos de layout

O componente responde à **área efetiva da janela/container**, não apenas à largura do dispositivo. Desktop e Mobile preservam shells próprios.

| Padrão | Regra |
|---|---|
| Toolbar | Mostrar ações prioritárias e agrupar secundárias com clareza. |
| Grids e listas | Densidade e colunas adaptáveis; preservar escolhas de visualização pertinentes. |
| Formulários | Uma ou mais colunas sem romper a ordem lógica de leitura e Tab. |
| Master/detail | Duas regiões em espaços amplos; fluxo lista → detalhe em espaços pequenos. |
| Leitura | Largura confortável para texto, sem reduzir indevidamente documentos. |
| Editor | Ocupar espaço disponível e manter controles operáveis. |
| Tabelas | Rolagem acessível, priorização sem perda de dados ou representação por cartões quando apropriado. |
| Rolagem | Evitar overflow horizontal indevido; scroll em regiões com responsabilidade clara. |

Validar viewport Mobile, tablets, janelas desktop estreitas, textos longos e zoom. Não antecipar redesign dos shells das Etapas 12/13.

---

## 10. Acessibilidade, movimento e desempenho

### 10.1. Acessibilidade

Foco visível em todos os controles, teclado previsível, ordem lógica, contraste representativo, touch confortável, labels efetivas e erros comunicados claramente. Estados não devem depender apenas de cor, hover ou animação. Tooltips e menus devem ser acessíveis por teclado.

### 10.2. Movimento e transparência

- Respeitar `prefers-reduced-motion` e preferências explícitas do sistema.
- Respeitar `prefers-reduced-transparency` quando suportado; sempre oferecer superfícies sólidas legíveis.
- Desativar animações e filtros custosos no modo de baixa intensidade; preservar imagem de fundo estática (D02-55).
- Evitar backdrop-filter redundante em superfícies aninhadas e durante drag/resize.
- Loading contextual: skeleton, spinner/progresso ou texto de estado conforme operação, respeitando movimento reduzido.

### 10.3. Testes representativos

Testar foco, teclado, modal, tooltip, formulário, estados vazios/carregando/erro, contraste em ambos os temas, rolagem e toque. Reaproveitar telas reais em vez de criar aplicativo de demonstração desnecessário.

---

## 11. Arquitetura CSS e contratos técnicos

### 11.1. Reorganização estruturada — D02-63 B

Auditar os arquivos existentes e redistribuir, sem reconstrução total, as seguintes responsabilidades:

| Responsabilidade | Destino preferencial |
|---|---|
| Tokens primitivos (spacing, raio, duração, escala) | `src/styles/themes/tokens.css` |
| Cores semânticas Dark/Light | `dark.css`, `light.css` |
| Efeitos, sombras, blur e níveis | `effects.css` e módulos específicos, sem duplicidade semântica |
| Opções de aparência e precedência | `customization.css` ou módulo justificado |
| Superfícies de vidro e fallback | `glass.css`, sem reescrever layout dos shells |
| Reset/foco e primitivas gerais | `global.css`/`foundation.css`, consolidando responsabilidades |
| Primitivas CSS comuns a apps | `apps.css` e módulos realmente compartilhados |
| Composição de um app/shell | CSS local da respectiva feature ou aplicativo |

A tabela indica direção de organização, **não aprovação de alteração cega ou obrigação de manter exatamente os mesmos arquivos**. Examinar a cascata final e todos os consumidores antes de mover regras.

### 11.2. Contratos de compatibilidade

- Tokens públicos e classes existentes não serão renomeados sem mapeamento e regressão.
- O gerenciador de wallpaper novo respeita seleções existentes e imagens armazenadas.
- O modo de acento amplia `appearanceManager` sem perder configurações legadas.
- Mudanças de preferência não devem gerar reset de dados de outros aplicativos.
- O sistema de temas e os componentes não podem inserir efeitos custosos no ciclo de redimensionamento de janelas.
- Arquivos de tradução permanecem intocados; textos adicionados terão registro de chaves pendentes.

---

## 12. Fronteiras entre etapas

| Etapa | Responsabilidade aprovada |
|---|---|
| **02** | Design System, tokens, temas, paletas, recursos oficiais de wallpaper, cursores completos SVG, contratos e **integração visual funcional testável**; componentes e layouts compartilhados. |
| **04** | Persistência avançada e sincronização de preferências por contexto, migração de dados legados, mecanismos de estado/seleção e Core relacionado. |
| **05–11** | UI final de aplicativos, consumindo os componentes aprovados. |
| **12–13** | Acabamento dos shells Desktop/Mobile, Taskbar, painéis e widgets. |
| **14** | Interface definitiva de Configurações para seleção/coleção de wallpapers, cursores, acento e efeitos. |
| **15** | Testes integrados, correções finais e preparação de publicação. |
| **Fase final de tradução** | Alterações nos catálogos `pt-BR.json` e `en.json`, após as demais etapas. |

**Interpretação conjunta D02-46, D02-60 e D02-65 B:** a Etapa 02 não se encerra com recursos apenas declarados; os seis wallpapers e cursores devem renderizar e ser demonstráveis no sistema existente. Isso **não** implica implementar agora toda a persistência multi-contexto nem a UI definitiva da coleção pessoal.

---

## 13. Plano de implementação: cinco partes encerráveis

### Parte 02.1 — Temas, tokens, wallpapers e cursores

1. Inventariar CSS e consumidores dos tokens; corrigir sobreposição de responsabilidade.
2. Consolidar Dark/Light, tipografia, acentos e hierarquia de superfície.
3. Definir/validar paletas oficiais, auto/manual e contrastes.
4. Incorporar as **seis imagens fornecidas** no catálogo oficial e garantir renderização real.
5. Preparar contrato de seleção por tema/plataforma e compatibilidade com preferências antigas.
6. Formalizar coleção pessoal e estratégia de migração sem conclusão artificial da persistência da Etapa 04.
7. Criar todas as variantes de cursores aprovadas para Dark/Light, incluindo redimensionamentos direcionais.
8. Integrar cursores de modo testável com fallback e opção nativa sem duplicar Configurações.
9. Conferir low effects, movimento reduzido, performance e contraste.
10. Executar testes e revisão visual, atualizar documentação e solicitar aceite.

**Commit após aceite:** `feat: consolida temas wallpapers e cursores`

### Parte 02.2 — Controles e componentes compartilhados

1. Auditar controles e componentes já existentes.
2. Padronizar botões, campos, selects, checkboxes, cards, estados e mensagens.
3. Revisar diálogos, menus e tooltips quanto a comportamento e acessibilidade.
4. Extrair componentes somente quando a reutilização ou lógica comum justificar.
5. Atualizar consumidores impactados e testar regressões.

**Commit após aceite:** `feat: padroniza componentes compartilhados`

### Parte 02.3 — Padrões responsivos

1. Consolidar toolbar, grid/list, formulários, master/detail, leitura/edição e tabelas.
2. Validar containers e janelas estreitas além de breakpoints de viewport.
3. Verificar rolagem e navegação com teclado, touch, zoom e textos longos.
4. Não concluir visual de aplicativos reservado às etapas posteriores.

**Commit após aceite:** `style: consolida layouts responsivos`

### Parte 02.4 — Acessibilidade e desempenho

1. Validar foco, teclado, contraste, estados e mensagens.
2. Integrar movimento reduzido, transparência reduzida e low effects.
3. Remover custo gráfico desnecessário sem remover wallpaper estático.
4. Validar carregamento contextual e feedback sem animação excessiva.
5. Testar Desktop, Mobile e janelas pequenas, registrando limites.

**Commit após aceite:** `fix: consolida acessibilidade e desempenho visual`

### Parte 02.5 — Auditoria e consolidação

1. Revisar contratos, tokens e consumidores alterados.
2. Executar regressões de temas, wallpapers, cursores, componentes e acessibilidade.
3. Confirmar compatibilidade de armazenamento antigo sem perda de dados.
4. Auditar arquivos, CSS, imports, comentários e duplicações.
5. Documentar evidências, limitações, responsabilidades futuras e traduções pendentes.
6. Solicitar aceite do proprietário antes de declarar Etapa 02 concluída.

**Commit após aceite:** `docs: consolida entrega do design system`

**Política Git:** um commit por parte aceita, em português, sem escopo entre parênteses; não reescrever histórico nem fazer push sem autorização. Commits separados por pequenas correções não substituem os commits das partes.

---

## 14. Verificação, testes e critérios de aceite

### 14.1. Validações automatizadas

Após cada parte relevante:

```bash
npm run lint
npm run build
npm run test
```

Adicionar testes unitários/de integração apenas para os contratos modificados e os comportamentos efetivamente introduzidos. Não alterar testes para mascarar incompatibilidades.

### 14.2. Matriz visual mínima

| Cenário | Verificação |
|---|---|
| Dark e Light | Contraste, componentes, superfícies, ícones e cores. |
| Wallpapers oficiais | Os três por tema disponíveis; padrões Blue; Desktop e Mobile onde aplicável. |
| Destaque automático/manual | Precedência por tema e extração contextual; fallback. |
| Cursores SVG | Estados completos, hotspots, direções e cursor nativo como fallback. |
| Formulário | Foco, erro, disabled, texto longo e toque. |
| Cards/lista/grid | Densidade, seleções, rolagem e largura reduzida. |
| Editor e leitura | Área útil, controles e contraste. |
| Diálogo/painel | Foco inicial/retorno, Escape, teclado e sobreposição. |
| Movimento/efeitos reduzidos | Sem animações supérfluas, sem blur custoso e **wallpaper preservado**. |
| Armazenamento indisponível | Falha explícita, dados prévios preservados, fallback legível. |

### 14.3. Critérios para cada parte

Uma parte só poderá ser apresentada para aceite quando:

1. O código e os recursos da parte estiverem funcionais, não apenas declarados.
2. Seus consumidores pertinentes estiverem integrados e testados.
3. Lint, build e testes aplicáveis estiverem aprovados.
4. A revisão visual apropriada tiver sido realizada com evidências.
5. A acessibilidade básica e o desempenho não tiverem regressões críticas conhecidas.
6. Arquivos e CSS estiverem organizados sem duplicação indevida.
7. Contratos e pendências de outras etapas estiverem documentados.
8. O proprietário tiver oportunidade de testar e **aprovar expressamente**.

**Etapa 02:** requer aceite final explícito após a Parte 02.5. A ausência de serviços externos ou interfaces futuras não autoriza afirmar que elas estão prontas.

---

## 15. Revisão de conflitos, lacunas e decisões técnicas derivadas

### 15.1. Consistência das decisões

- **D02-64 C substitui B**: abrangência de cursores completa, inclusive resize direcional.
- **D02-42 B e D02-64 C**: o fallback nativo continua válido em casos de navegador sem suporte; não serve para eliminar variantes aprovadas da implementação.
- **D02-05/D02-37/D02-53**: três recursos oficiais por tema; seleção mantida separadamente nas quatro combinações de plataforma/tema.
- **D02-38/D02-61**: catálogo pessoal múltiplo, não único; gerenciamento completo em etapa posterior.
- **D02-54/D02-57/D02-62**: modo manual persistente por tema; automático sensível ao wallpaper de cada plataforma.
- **D02-46/D02-60/D02-65**: integração inicial funcional na 02; persistência avançada na 04; UI final na 14.
- **D02-30/D02-55**: otimização de efeito não deve remover imagem de fundo estática.
- **D02-44/D02-56/D02-63**: reorganização estruturada preservando consumidores e evitando reconstrução total.
- **D02-52**: a decisão posterior de adiar traduções prevalece sobre referências genéricas do plano original a traduções por etapa.

**Resultado:** nenhum conflito de produto bloqueante identificado nas 65 deliberações; detalhes técnicos devem ser validados sem modificar o escopo.

### 15.2. Pontos técnicos ainda mensuráveis, sem decisão nova aprovada

- Limiar numérico de contraste/acessibilidade e escala final de tokens: validar na execução contra telas e padrões relevantes, registrando critério adotado.
- Limites agregados da coleção pessoal, política de eviction/remoção e evolução de IndexedDB: definir na etapa responsável pela persistência e registrar risco se afetar recursos da 02.
- Estratégia de extração de cores em imagens pessoais: técnica determinística e controlada, sem transmitir imagens; verificar performance e fallback.
- Hotspots, dimensões e variantes SVG específicas: acertar tecnicamente mediante testes cross-browser; a decisão de produto é o conjunto completo.
- Caminhos definitivos dos assets e nomes dos IDs: manter estáveis após catálogo publicado; evitar renomear sem migração.
- Não declarar serviço externo, upload remoto ou configuração de produção concluídos por testes isolados.

Qualquer alteração que transforme esses detalhes em **nova funcionalidade, limitação de escopo ou custo** exige autorização expressa.

---

## 16. Estado do documento e aprovação

| Item | Estado |
|---|---|
| Blocos 02-A a 02-G | Deliberações aprovadas |
| Revisões D02-53–65 | Deliberações aprovadas, com D02-64 = C |
| Total | **65 decisões** |
| Revisão de consistência | Sem conflito de produto bloqueante identificado |
| Arquivos de tradução | Alteração proibida até fase final |
| Alterações no repositório | **Nenhuma autorizada por este documento** |
| Autorização de implementação | **Pendente** |
| Aprovação final do planejamento | **Pendente de manifestação expressa do proprietário** |

**Próxima ação após aprovação:** iniciar a Parte 02.1, inventariando os arquivos atuais, consumidores de tokens e mecanismos de wallpaper/aparência antes de qualquer alteração.

<!-- === WS OS V2 — DOCUMENTO MESTRE DE REVISÃO E CONCLUSÃO === -->

# WS OS V2 — Documento mestre de revisão e conclusão

- **Versão:** 1.7
- **Data:** 30/10/2026
- **Projeto:** WS OS — Portfólio interativo
- **Repositório:** https://github.com/warlleyz/ws-os
- **Diretório local:** `C:\Projetos\ws-os`

<!-- === 1. OBJETIVO === -->

## 1. Objetivo

Concluir a WS OS V2 mediante uma revisão organizada de todo o projeto, preservando o trabalho existente e evitando retornos desnecessários a áreas já aprovadas.

A revisão deve encerrar, em cada área:

- Funcionalidade e integração.
- Aparência e responsividade.
- Português e inglês.
- Acessibilidade.
- Segurança e privacidade.
- Persistência e recuperação de falhas.
- Organização do código e comentários.
- Testes e evidências pertinentes.

Não deixar traduções, Mobile, estados de erro ou acessibilidade de todos os aplicativos para a última etapa.

Este documento consolida a direção de conclusão. A instrução mais recente de 30/10/2026 autoriza revisar e corrigir o projeto sequencialmente de R01 a R14, uma revisão por vez, seguindo as regras de edição e formatação do proprietário. Uma revisão somente pode ser encerrada com seus critérios verificados e as ações do proprietário resolvidas. Ao depender de algo que o assistente não possa executar, registrar a ação exata, informar o proprietário e aguardar antes de avançar. Não há autorização para commit, push, troca de branch/worktree, instalação de dependências, migração, publicação ou escrita remota indiscriminada.

<!-- === 2. PRECEDÊNCIA E DECISÕES === -->

## 2. Precedência e decisões

Ordem de precedência:

1. Instrução explícita mais recente do proprietário.
2. Decisão posterior expressamente aprovada para o assunto.
3. Este documento mestre.
4. Código atual como evidência de implementação.
5. Documentos e relatos históricos como contexto.

Código existente não comprova aprovação de produto. Planejamento aprovado não comprova implementação.

Quando houver divergência, procurar a decisão mais recente e apresentar somente a dúvida que realmente impedir o trabalho. Não escolher silenciosamente um novo comportamento.

As autorizações antigas não constituem permissão permanente.

<!-- ----- DECISÕES SUPERADAS ----- -->

### Decisões superadas

- O sistema de demonstrações de projetos foi removido. DOOM, UZDoom e seus recursos também foram removidos; engine, SoundFont, saves e distribuição não são bloqueadores desta versão.
- Supabase Storage privado substituiu Cloudflare R2 para arquivos oficiais.
- Contato oferece somente mensagem profissional, por decisão do proprietário em 30/10/2026 na R11. Solicitação de horário não integra o formulário ou o aceite desta versão. Contratos e registros legados de agendamento são preservados; não implementar remoção de dados ou migração por essa decisão.
- A antiga restrição de adiar traduções não orienta esta revisão final: traduções devem ser encerradas na própria área revisada.
- Referências históricas a 18 aplicativos, Administração inexistente ou Mobile reservado não descrevem a base atual.
- Recomendações e autorizações antigas de commits são históricas e não concedem permissão para commits futuros.
- Boot com processador e logos oficiais reservadas ao favicon, por confirmação do proprietário nesta etapa.
- A Administração seleciona os projetos destacados por ID; a ordenação restante continua automática, com os filtros existentes. Não há ordenação editorial manual a implementar.
- Animações das janelas permanecem obrigatórias, respeitando movimento reduzido. Comandos Reiniciar e Desligar ficam fora desta versão.

<!-- === 3. PRODUTO E ESCOPO === -->

## 3. Produto e escopo

A WS OS apresenta um portfólio profissional por meio de uma interface inspirada em sistemas operacionais.

<!-- ----- DIRETRIZES ----- -->

### Diretrizes

- Marca pública: **WS OS**.
- V2 utilizada como informação de versão.
- Desktop e Mobile possuem composições próprias e compartilham contratos e dados autorizados.
- Dados profissionais, documentos e métricas devem ser reais.
- Não inventar conteúdo, percentuais, projetos, resultados de serviços ou evidências.
- Preservar a experiência visual existente, corrigindo problemas e completando requisitos aprovados.
- Nenhuma reconstrução geral ou mudança de stack está prevista.

<!-- ----- APLICATIVOS ----- -->

### Aplicativos

1. Sobre Mim.
2. Projetos.
3. Dev Insights.
4. Currículo.
5. Certificados.
6. Contato.
7. Notas.
8. Arquivos.
9. Editor de Arquivos.
10. Visualizador de Arquivos.
11. Calculadora.
12. Jogos.
13. Terminal.
14. Configurações.
15. Wally Estendido.
16. Sobre o Sistema.
17. Administração.

Currículo funciona como atalho para o Visualizador, preservando confirmação de abertura e navegação.

São 17 entradas registradas: 16 públicas e Administração protegida. No Desktop, Todos apresenta 13 entradas públicas conforme showInMenu; Editor, Visualizador e Wally Estendido usam acessos contextuais. O Mobile também oferece o Wally Estendido no catálogo.

Administração é restrita. A visibilidade no catálogo não substitui autorização.

<!-- ----- FORA DO ESCOPO ----- -->

### Fora do escopo

- Retorno do sistema de demonstrações.
- Retorno de DOOM, UZDoom ou recursos associados.
- Execução automática de repositórios.
- Builds de projetos de terceiros.
- Novos runtimes ou infraestrutura remota.
- Modificação dos repositórios originais dos projetos.
- Expansão arbitrária do Terminal.
- Novos aplicativos ou funcionalidades sem aprovação.
- Ativação automática de IA remota.

<!-- === 4. MODELO DE DESENVOLVIMENTO E AUTORIZAÇÃO === -->

## 4. Modelo de desenvolvimento e autorização

<!-- ----- PADRÃO DE TRABALHO ----- -->

### Padrão de trabalho

O modo vigente é **edição direta dos incrementos locais autorizados**, com inspeção prévia do arquivo completo, preservação das funcionalidades e validação. Quando uma ação depender do proprietário, o assistente entrega instruções exatas e aguarda sua execução antes de avançar.

Se o proprietário autorizar edição direta, executar apenas o incremento autorizado. Não pedir novamente autorização para ações já claramente incluídas nele.

Sem autorização explícita, não:

- Editar arquivos.
- Criar ou trocar branches e worktrees.
- Fazer commits, push ou deploy além da autorização específica concedida.
- Instalar ou atualizar dependências.
- Aplicar migrações ou alterar recursos remotos.
- Apagar dados pessoais, segredos, migrações ou materiais com finalidade ainda não esclarecida.
- Aplicar ou descartar stashes.
- Executar operações que descartem alterações.

A limpeza foi autorizada expressamente pelo proprietário: arquivos comprovadamente desnecessários podem ser removidos na revisão da área responsável, após ler seu conteúdo, conferir referências e registrar a justificativa. A ausência de import, sozinha, não prova que um documento histórico, licença ou script operacional seja dispensável. A autorização não abrange sources/ do projeto ChatGPT, arquivos pessoais ou segredos locais.

Leituras e verificações compatíveis com a autorização podem prosseguir. Informar quando uma verificação produzir arquivos ou alterar dados.

<!-- ----- ANTES DE QUALQUER ALTERAÇÃO ----- -->

### Antes de qualquer alteração

1. Conferir branch, commit, `git status` e diferenças existentes.
2. Ler os arquivos atuais envolvidos.
3. Identificar consumidores e contratos afetados.
4. Reconhecer o que já funciona.
5. Delimitar o incremento e sua validação.
6. Preservar alterações locais, inclusive arquivos não rastreados.

Não presumir que GitHub e diretório local sejam iguais.

<!-- === 5. COMUNICAÇÃO E ENTREGA DE CÓDIGO === -->

## 5. Comunicação e entrega de código

Respostas objetivas, diretas, técnicas e organizadas. Evitar introduções longas, elogios automáticos, repetição de planos e alternativas já decididas.

Formato preferencial:

**Arquivo → localização exata → alteração → validação.**

<!-- ----- MODELO A — ALTERAÇÕES PONTUAIS ----- -->

### Modelo A — Alterações pontuais

Modelo padrão para correções e mudanças localizadas.

- Informar caminho completo.
- Mostrar o trecho original a localizar.
- Mostrar o substituto completo.
- Para adições, indicar o trecho exato anterior ou posterior.
- Para remoções, identificar exatamente o conteúdo.
- Separar arquivos diferentes.
- Não entregar o arquivo inteiro por poucas linhas.

Não utilizar instruções como “perto da função”, “ajuste o CSS correspondente” ou “adicione antes da maximização”.

<!-- ----- MODELO B — ARQUIVO COMPLETO ----- -->

### Modelo B — Arquivo completo

Utilizar quando a alteração extensa justificar a substituição integral.

- Informar caminho completo.
- Entregar todo o conteúdo atualizado.
- Preservar imports, funções e integrações necessárias.
- Não usar omissões como `// restante do código`.
- Não exigir que o proprietário reconstrua o arquivo combinando fragmentos.

Em edição direta autorizada, esses modelos orientam o tamanho da mudança; o relatório final deve apontar arquivos e locais alterados sem repetir desnecessariamente todo o código.

<!-- === 6. ORGANIZAÇÃO, COMENTÁRIOS E CSS === -->

## 6. Organização, comentários e CSS

Preservar arquitetura modular e responsabilidades claras. Antes de modificar, ler o arquivo original completo e identificar consumidores, contratos e comportamento aprovado.

- Reutilizar recursos existentes.
- Extrair módulos quando houver responsabilidade concreta.
- Evitar componentes enormes e fragmentação excessiva.
- Não criar abstrações artificiais.
- Não reorganizar todo o projeto para corrigir um problema isolado.
- Manter arquivos relacionados agrupados por funcionalidade.

<!-- ----- COMENTÁRIOS EM PT-BR ----- -->

### Comentários em PT-BR

Comentários de organização usam dois níveis: seções principais e subseções. Manter títulos claros, nomenclatura consistente e apenas blocos relevantes.

Seção principal:

`/* === CONFIGURAÇÃO === */`

Subseção:

`/* ----- Validação de entrada ----- */`

Explicação:

`// Impede que a cobra inverta a direção no mesmo movimento.`

Em documentos Markdown, usar comentários HTML equivalentes de seção e subseção, mantendo os marcadores === e -----, títulos em português e hierarquia semântica. Não inserir comentários JavaScript como texto visível no documento.

Comentários devem explicar responsabilidades, regras e decisões não evidentes. Atualizar comentários incorretos; remover os obsoletos. Não comentar operações triviais nem aumentar artificialmente os arquivos.

Em JSX, utilizar a sintaxe apropriada de comentário.

<!-- ----- JavaScript e JSX ----- -->

### JavaScript e JSX

- Indentação consistente de dois espaços.
- Imports organizados, sem alterar dependências por conveniência.
- Funções e blocos separados por linhas em branco.
- Expressões longas e propriedades JSX distribuídas de forma legível.
- Hooks, dependências e comportamento React preservados, sem novos avisos de ESLint.
- Lógica separada da apresentação somente quando houver responsabilidade concreta.

<!-- ----- CSS ----- -->

### CSS

- Uma propriedade por linha.
- Comentários padronizados e espaçamento consistente.
- Preferir tokens e variáveis existentes.
- Preservar scrollbars e estados interativos.
- Separar primitivas globais da composição de cada aplicativo.
- Evitar duplicações e dependência incidental da ordem de overrides.
- Validar janelas estreitas, maximização, restauração e Mobile.
- Preservar Dark/Light e preferências de acessibilidade.

Não reformatar arquivos inteiros sem necessidade da etapa.

<!-- === 7. ARQUITETURA E CONTRATOS CENTRAIS === -->

## 7. Arquitetura e contratos centrais

<!-- ----- RESPONSABILIDADES ----- -->

### Responsabilidades

| Área                   | Responsabilidade                                                |
| ---------------------- | --------------------------------------------------------------- |
| `src/core`             | Instâncias, navegação, permissões, preferências e ciclo de vida |
| `src/shells`           | Composição Desktop e Mobile                                     |
| `src/features`         | Janelas, menus, busca, painéis, widgets e apresentação          |
| `src/apps`             | Interface e regras de domínio dos aplicativos                   |
| `src/services`         | Transporte, integrações e armazenamento                         |
| `src/shared`           | Componentes, hooks, utilitários e idiomas compartilhados        |
| `src/styles`           | Fundamentos, tokens e estilos comuns                            |
| `worker` e `functions` | Roteamento e APIs do servidor                                   |
| `database`             | Migrações e verificações de banco                               |
| `tests`                | Verificações automatizadas                                      |

<!-- ----- INSTÂNCIAS E NAVEGAÇÃO ----- -->

### Instâncias e navegação

- Aplicativos abrem outros pelo Core.
- Confirmação de abertura considera o destino efetivamente criado.
- Lazy loading e falhas permanecem isolados por instância.
- Minimizar conserva estado; pausa depende do contrato e do consumidor.
- Fechar libera recursos após a preparação necessária e a animação aplicável. Movimento reduzido pode suprimir a animação, mas nunca a proteção de dados.
- Rascunhos e operações pendentes são protegidos.
- Mudança de shell não pode descartar alterações silenciosamente.
- Reload não deve prometer restauração de janelas ou rascunhos sem implementação.
- A navegação habitual mantém a URL estável.
- Entradas compartilhadas de projeto/publicação devem ser validadas e normalizadas.

<!-- ----- PERSISTÊNCIA E ISOLAMENTO ----- -->

### Persistência e isolamento

- Preferências simples em armazenamento local.
- Documentos pessoais em IndexedDB.
- Arquivos oficiais em Supabase Storage privado, mediados pelo Worker.
- Dados de sessão separados dos persistentes.
- Reset por categorias/allowlist; nunca limpeza indiscriminada.
- Sincronização entre abas sem transmitir segredos ou conteúdo privado desnecessário.
- Falhas de quota ou armazenamento não podem produzir falso sucesso.
- Conflitos de revisão preservam o rascunho.

<!-- ----- SEGURANÇA ----- -->

### Segurança

- Autorizar cada operação restrita no servidor.
- Não confiar em flags do cliente ou conteúdo de prompts.
- Segredos não pertencem ao bundle, URLs, histórico ou logs.
- Chaves administrativas permanecem exclusivamente no servidor.
- Validar entradas, origem, formato, tamanho e revisão.
- Banco e Storage exigem políticas e privilégios homologados.
- Não executar HTML, scripts ou comandos provenientes de conteúdo público.

<!-- === 8. DADOS, ARQUIVOS E INTEGRAÇÕES === -->

## 8. Dados, arquivos e integrações

Os limites abaixo são referências operacionais da base auditada; conferir sua aplicação em todas as camadas antes de alterá-los.

| Domínio                             | Referência                                                   |
| ----------------------------------- | ------------------------------------------------------------ |
| Arquivo pessoal                     | Até 10 MiB por arquivo                                       |
| Armazenamento pessoal               | Até 50 MiB e 500 entradas, considerando as regras da lixeira |
| Editor de texto                     | Limite operacional de 1 MiB                                  |
| Wallpaper                           | Até 5 MiB, 32 megapixels e 8192 pixels por lado              |
| Arquivo oficial                     | Até 10 MiB                                                   |
| Formatos oficiais                   | PDF, TXT, PNG, JPEG e WebP                                   |
| Anexos de publicação                | Até cinco                                                    |
| Retenção de solicitações terminadas | Referência de 180 dias                                       |

Alterar limites exige conferir interface, serviços, API, banco, migrações e testes.

<!-- ----- ARQUIVOS OFICIAIS ----- -->

### Arquivos oficiais

- Bucket privado `ws-os-official-files`.
- Upload administrativo.
- Metadados e revisões no PostgreSQL.
- Validação de MIME, assinatura e SHA-256.
- Publicação e acesso público mediados por autorização apropriada.
- Preservar documentos estáticos existentes durante substituições.
- Tratar uploads e exclusões interrompidos sem perda silenciosa.

<!-- ----- SOLICITAÇÕES ----- -->

### Solicitações

Estados previstos:

`new`, `in_review`, `awaiting_response`, `responded`, `completed`, `archived`.

- Solicitações são privadas.
- Não representam reunião confirmada nem evento público.
- Persistência e notificação têm resultados independentes.
- Repetição não deve duplicar solicitações.
- Resposta incerta não deve ser apresentada como falha definitiva ou sucesso confirmado.
- Retenção exige procedimento efetivo e homologado; uma função de cálculo não comprova limpeza implantada.

<!-- ----- INTEGRAÇÕES ----- -->

### Integrações

- GitHub: dados públicos, cache, limites e indisponibilidade.
- WakaTime: agregados autorizados e segredo somente no servidor.
- Clima: consentimento de localização e fallback.
- Calendário: eventos públicos cadastrados e feriados.
- Contato: persistência privada e notificação configurada.
- Rankings: envio voluntário, validação e antiabuso; pontuação do navegador não é prova antifraude.
- Wally: modo local disponível; remoto desativado até autorização.

Não considerar testes com transporte simulado como homologação do provedor real.

<!-- === 9. IDENTIDADE E PERSONALIZAÇÃO APROVADAS === -->

## 9. Identidade e personalização aprovadas

- Interface moderna e tecnológica, profissional e legível.
- Nunito Sans para interface; JetBrains Mono para código e Terminal.
- Vidro, profundidade, bordas moderadas e animações discretas.
- Dark padrão e Light completo.
- Controles com estados, foco e hierarquia.
- Componentes respondem à área útil da janela, não apenas ao viewport.
- Menus e diálogos com teclado e retorno de foco.
- Toque sem dependência exclusiva de hover.

<!-- ----- WALLPAPERS E DESTAQUE ----- -->

### Wallpapers e destaque

- Seis wallpapers oficiais: azul, verde e violeta em Dark/Light.
- Dark Blue e Light Blue como padrões.
- Seleções independentes em Desktop/Dark, Desktop/Light, Mobile/Dark e Mobile/Light.
- Preencher, ajustar e centralizar com prévia.
- Coleção pessoal múltipla, local, validada e com exclusão segura.
- Migração não destrutiva dos dados legados.
- Paletas oficiais e extração controlada para imagens pessoais.
- Modo automático/manual por tema.
- Escolha manual compartilhada entre shells e preservada até redefinição.
- Modo automático considera o wallpaper da plataforma.
- Efeitos reduzidos mantêm wallpaper estático; ocultá-lo é uma opção distinta.
- Contraste e fallback prevalecem sobre cores extraídas.

<!-- ----- CURSORES ----- -->

### Cursores

SVG Dark/Light, fallback nativo e opção de desativação:

- Padrão e clique.
- Texto e ocupado.
- Redimensionamento direcional.
- Arraste e movimentação.
- Indisponível e ajuda.

Aplicar somente com apontador compatível. Não substituir todos os estados por uma única seta.

<!-- ----- APRESENTAÇÃO ----- -->

### Apresentação

- Favicon oficial acompanha tema e destaque.
- Boas-vindas em duas etapas, sem fechamento por Escape, com foco acessível.
- Boot mantém o símbolo de processador; as seis logos oficiais são utilizadas pelo favicon conforme tema e destaque.
- Sobre o Sistema apresenta versão e créditos honestos.

<!-- === 10. REQUISITOS FUNCIONAIS POR ÁREA === -->

## 10. Requisitos funcionais por área

| Área            | Encerramento necessário                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sobre Mim       | Conteúdo aprovado, trajetória, competências, links e composição responsiva                                                                                         |
| Projetos        | GitHub, busca, filtros, ordenação automática, detalhes, README, links e destaques selecionados por ID na Administração; sem demos e sem ordenação editorial manual |
| Dev Insights    | Indicadores reais, períodos, fontes, atualização e indisponibilidade                                                                                               |
| Currículo       | Abertura integrada, documento real, visualização e download                                                                                                        |
| Certificados    | Pesquisa, categorias, metadados e comprovantes reais                                                                                                               |
| Contato         | Validação, consentimento, proteção do texto, persistência e resultado honesto                                                                                      |
| Notas           | Leitura pública e ciclo editorial restrito, anexos, busca e curtidas                                                                                               |
| Arquivos        | Operações pessoais completas e catálogo oficial separado                                                                                                           |
| Editor          | Edição, busca/substituição, salvamento, cópia, conflito e descarte protegido                                                                                       |
| Visualizador    | Texto, imagem e PDF, metadados, zoom/ajuste, download e fallback                                                                                                   |
| Calculadora     | Modos existentes, operações, erros, histórico, teclado e toque                                                                                                     |
| Jogos           | Snake, Memória, Campo Minado, Flappy Bird e Paciência; recordes e rankings suportados                                                                              |
| Terminal        | Comandos existentes, ajuda, navegação, histórico e login seguro                                                                                                    |
| Wally           | Navegação, pesquisa pública e ações locais autorizadas                                                                                                             |
| Administração   | Conteúdo, destaques, publicações, arquivos, eventos, solicitações e moderação previstos                                                                            |
| Configurações   | Controles com consumidores reais, persistência e reset seguro                                                                                                      |
| Sobre o Sistema | Versão, propósito, tecnologias, créditos e licenças                                                                                                                |

<!-- ----- SHELLS E RECURSOS COMPARTILHADOS ----- -->

### Shells e recursos compartilhados

- Desktop: 12 atalhos principais, organização, seleção, contexto e persistência.
- Taskbar: agrupamento, foco, restauração, prévias e fechamento.
- Menu: catálogo, pesquisa, favoritos e recentes.
- Painéis: exclusividade, teclado, fechamento contextual e retorno de foco.
- Widgets: configuração, tamanho, posição, estado e persistência.
- Widget Calendário: indicação discreta de eventos públicos.
- Mobile: Home, catálogo, busca, navegação, retorno, tablet e altura dinâmica.
- Wally no Mobile como aplicativo.
- Não redesenhar a Home ou expandir funcionalidades sem decisão.

<!-- === 11. FOTOGRAFIA HISTÓRICA DA AUDITORIA === -->

## 11. Fotografia histórica da auditoria

**Referência auditada em 26/10/2026:**

- Branch `main`.
- Commit local/remoto `3e6af7d251ef296ed26d905f590610c3360627cf`.
- Sem alterações rastreadas; diretório não rastreado `doom-source/`.
- Lint aprovado.
- 500 testes: 495 aprovados e cinco falhas.
- Build não executado nessa auditoria de leitura.
- Nenhuma homologação atual de produção ou ensaio visual.

Fotografia histórica: os defeitos e bloqueios abaixo descrevem 26/10, não pendências atuais. DOOM foi removido depois; o baseline de 28/10 e a revisão de 30/10 estão na seção 15.

<!-- ----- DEFEITOS IDENTIFICADOS ----- -->

### Defeitos identificados

1. `useDoomSession` registra preparação assíncrona que `appCloseGuards` ignora.
2. Currículo redireciona para `file-viewer`, mas a confirmação aguarda `resume`.
3. Snake possui limite 397 na interface e 222 em contrato/API/SQL.
4. Dois testes de interface dos jogos não fornecem `FaJava`.
5. Dois testes Snake utilizam a estrutura antiga `food`.
6. Falta cobertura de tradução de “Carga horária”.
7. NOTICE do UZDoom anuncia verificação no build que o script não implementa.

A integridade das seis partes de `uzdoom.data` foi conferida e coincidiu com o manifesto nessa data.

<!-- ----- LACUNAS E DECISÕES A RECONCILIAR ----- -->

### Lacunas e decisões a reconciliar

- Independência dos wallpapers entre temas.
- Destaque automático/manual por tema.
- Enquadramento das imagens.
- Disponibilização das ações aprovadas na busca/Wally.
- Animações das janelas, inclusive fechamento compatível com cleanup e movimento reduzido, a revisar na Etapa 03.
- Divergências sobre Boot, destaques e reinício/desligamento foram resolvidas na Etapa 01; consultar as decisões vigentes da seção 18.
- Possível rolagem global Mobile, a reproduzir antes de corrigir.

<!-- ----- BLOQUEIOS EXTERNOS REGISTRADOS ----- -->

### Bloqueios externos registrados

- Confirmar rotação de credenciais e revogação de sessões citadas no histórico.
- Conferir migrações, especialmente permissões de destaques após remoção das demos.
- Homologar RLS, Storage, D1, Turnstile e operações reais.
- Validar backup, restauração e rollback.
- Confirmar origem/build e licenças do UZDoom e SoundFont.
- Aprovar conteúdo e experiência visual.

Não presumir que essas pendências continuem abertas ou tenham sido resolvidas: verificar evidências.

<!-- === 12. SEQUÊNCIA ÚNICA DE REVISÃO === -->

## 12. Sequência única de revisão

A ordem abaixo substitui a sequência antiga de execução. Os problemas conhecidos entram na etapa responsável, evitando uma correção preliminar seguida de revisão duplicada.

<!-- ----- ETAPA 01 — BASE, ESCOPO E MAPA DE ENCERRAMENTO ----- -->

### Etapa 01 — Base, escopo e mapa de encerramento

- Conferir Git, documentos, scripts e estado real.
- Confirmar decisões divergentes.
- Definir requisitos obrigatórios e recursos condicionados.
- Identificar acessos, conteúdo e licenças necessários.
- Registrar baseline das verificações autorizadas.
- Criar checklist único de acompanhamento.

**Aceite:** escopo delimitado e nenhuma ambiguidade crítica escondida.

<!-- ----- ETAPA 02 — BACKEND, SEGURANÇA E DADOS ----- -->

### Etapa 02 — Backend, segurança e dados

- Auth, autorização, banco, RLS e Storage.
- APIs, revisões, idempotência, limites e falhas.
- Solicitações, conteúdo, arquivos, anexos, curtidas e rankings.
- Contrato único do Snake.
- Credenciais, migrações, limitadores e manutenção.
- Homologação real onde houver autorização.

**Aceite:** contratos estáveis e resultados externos claramente registrados.

<!-- ----- ETAPA 03 — CORE, PERSISTÊNCIA E CICLO DE VIDA ----- -->

### Etapa 03 — Core, persistência e ciclo de vida

- Abertura, confirmação, instâncias e navegação.
- Preservar abertura do Currículo no Visualizador e preparação assíncrona de saída dos consumidores atuais.
- Foco, isolamento de erros, pausa e cleanup.
- Guards, mudança de shell e proteção de rascunhos.
- Sincronização e reset seguro.
- Animações de abertura, minimização, restauração e fechamento conforme o comportamento aplicável, sem prejudicar dados, foco ou recursos. Reiniciar/Desligar não fazem parte do escopo.

**Aceite:** consumidores podem confiar nos contratos compartilhados.

<!-- ----- ETAPA 04 — DESIGN SYSTEM E PERSONALIZAÇÃO ----- -->

### Etapa 04 — Design System e personalização

- Tokens, componentes, estados e cascata CSS.
- Temas, efeitos, contraste e movimento.
- Wallpapers, coleção, independência e enquadramento.
- Destaque automático/manual.
- Cursores e fallback.

**Aceite:** recursos funcionando na interface real, com persistência e testes pertinentes.

<!-- ----- ETAPA 05 — ARQUIVOS, EDITOR E VISUALIZADOR ----- -->

### Etapa 05 — Arquivos, Editor e Visualizador

**Status:** Implementada — validação local concluída, com pendências de homologação.

**Escopo realizado:**

- Revisão do fluxo entre Arquivos, Editor e Visualizador.
- Validação de operações, persistência, quota e conflitos de revisão.
- Correção da lixeira e recuperação de exclusões independentes.
- Validação de texto, imagem, PDF, pré-visualização e download.
- Verificação de múltiplas abas e proteção contra sobrescrita.
- Preservação do isolamento entre arquivos pessoais e oficiais.
- Reorganização do mecanismo de internacionalização e dos catálogos PT-BR/EN.
- Ajustes de tamanho e posição inicial das três janelas.
- Ajustes visuais do aplicativo Arquivos: cards, barra lateral, pesquisa, ferramentas e select.
- Revisão dos testes afetados pelas alterações legítimas de contrato.

**Validação:**

- ESLint: aprovado.
- Build de produção: aprovado, com aviso de tamanho do bundle.
- Testes de armazenamento e recuperação: aprovados.
- Testes manuais de visualização, download e conflitos entre abas: aprovados.
- Suíte completa na R04, em 30/10/2026: 552 testes aprovados, sem falhas.
- Os resultados de 541/546 e as cinco falhas de 26/10 são históricos, não reproduzidos na suíte atual.

**Pendências de homologação:**

- P14: avaliar o bundle do Visualizador, atualmente com aproximadamente 621 kB.
- Validar a integração real dos arquivos oficiais gerenciados pelo backend.
- Homologar em dispositivos físicos e com leitor de tela.
- Confirmar comportamento no ambiente de produção.

**Aceite:** fluxo local entre os três aplicativos validado, com proteção contra perda de documentos, conflitos de revisão e exposição indevida nos cenários verificados. Homologação remota e de produção permanece pendente.

**Encerramento:** implementação local preservada e revalidada na R04 em 30/10/2026. Commit e push continuam sujeitos à autorização explícita; não são critério técnico para aprovar os testes locais.

<!-- ----- ETAPA 06 — APLICATIVOS PROFISSIONAIS ----- -->

### Etapa 06 — Aplicativos profissionais

Encerrar um por vez:

1. Sobre Mim.
2. Projetos.
3. Dev Insights.
4. Currículo.
5. Certificados.

**Aceite:** conteúdo real, integrações, visual, acessibilidade e traduções aprovados.

<!-- ----- ETAPA 07 — CONTATO, NOTAS E ADMINISTRAÇÃO ----- -->

### Etapa 07 — Contato, Notas e Administração

- Fluxos completos de captura, gerenciamento e publicação.
- Sessão expirada, conflitos, repetição e falhas.
- Anexos, solicitações, moderação e atualização pública.
- Reutilizar módulos existentes, sem CRUD duplicado.

**Aceite:** operação administrativa produz o resultado público esperado sem comprometer dados privados.

<!-- ----- ETAPA 08 — CALCULADORA E JOGOS ----- -->

### Etapa 08 — Calculadora e Jogos

- Operações, regras, teclado e toque.
- Cinco jogos, pausa, retorno, reinício, término e recordes.
- Ranking integrado ao contrato encerrado.
- Corrigir testes desatualizados sem enfraquecer verificações.

**Aceite:** fluxos representativos dos cinco jogos e da Calculadora comprovados. DOOM não integra este aceite.

<!-- ----- ETAPA 09 — TERMINAL, WALLY E BUSCA ----- -->

### Etapa 09 — Terminal, Wally e busca

- Comandos atuais, ajuda, histórico e autenticação.
- Pesquisa contextual e catálogo de ações.
- Ferramentas locais, permissões, confirmação e cancelamento.
- Fallback e limites honestos.

**Aceite:** ações aprovadas acessíveis e seguras, sem expansão arbitrária.

<!-- ----- ETAPA 10 — DESKTOP, MOBILE E RECURSOS DO SHELL ----- -->

### Etapa 10 — Desktop, Mobile e recursos do shell

- Desktop, atalhos, janelas, Taskbar e menu.
- Painéis, notificações, calendário, clima e widgets.
- Home, catálogo, navegação e retorno Mobile.
- Tablet, orientação, teclado virtual e alturas.
- Integração com aplicativos já encerrados.

**Aceite:** shells completos; apenas ajustes de composição, sem refazer aplicativos.

<!-- ----- ETAPA 11 — CONFIGURAÇÕES E APRESENTAÇÃO ----- -->

### Etapa 11 — Configurações e apresentação

- Percorrer todos os controles e seus consumidores.
- Boot, boas-vindas e favicon.
- Versão, créditos, licenças e Sobre o Sistema.
- Primeira visita e restauração segura.

**Aceite:** apresentação coerente e cada controle comprovadamente funcional.

<!-- ----- ETAPA 12 — ACEITE INTEGRADO E LANÇAMENTO ----- -->

### Etapa 12 — Aceite integrado e lançamento

- Lint, build, suíte completa e CI.
- Runtime real do Worker.
- Percurso crítico dos aplicativos.
- Dispositivos reais, acessibilidade e desempenho.
- Segurança operacional, metadados, domínio e HTTPS.
- Documentação, backup e rollback.
- Aceite do proprietário.

**Aceite:** candidato sem bloqueadores conhecidos no escopo aprovado. Publicação depende de autorização específica.

<!-- === 13. COMO ENCERRAR SEM RETRABALHO === -->

## 13. Como encerrar sem retrabalho

Em cada etapa:

1. Inspecionar.
2. Apresentar diagnóstico curto.
3. Executar ou orientar o incremento autorizado.
4. Validar o comportamento e os consumidores afetados.
5. Corrigir problemas da própria etapa.
6. Registrar resultado e pendências.
7. Obter aceite conforme o modo combinado.

Estados permitidos:

- **Não iniciada.**
- **Em revisão.**
- **Aguardando aplicação/verificação do proprietário.**
- **Bloqueada externamente.**
- **Concluída tecnicamente, aguardando aceite.**
- **Encerrada e aprovada.**

Não chamar uma etapa bloqueada de integralmente concluída.

Após aprovação, reabrir somente por:

- Defeito comprovado.
- Regressão.
- Dependência que alterou seu contrato.
- Mudança autorizada.

Antes de reabrir, indicar o motivo e limitar a correção ao impacto. Não repetir auditoria geral de módulos estáveis.

No fluxo sequencial vigente, uma pendência obrigatória da revisão atual impede o avanço à próxima revisão. Registrar responsável e ação precisa, concluir o trabalho independente da própria revisão e aguardar o proprietário. Não transferir o bloqueio para uma revisão posterior apenas para declarar 100%.

<!-- === 14. TESTES E EVIDÊNCIAS === -->

## 14. Testes e evidências

Executar primeiro as verificações diretamente relacionadas.

Ao encerrar um incremento funcional, executar, quando autorizado:

`npm run lint && npm run build && npm run test`

No modo manual, o proprietário pode executar e fornecer os resultados.

- Não inventar aprovação.
- Não desativar verificações para esconder erros.
- Não alterar testes apenas para fazê-los passar.
- Atualizar testes quando o contrato aprovado mudar.
- Diferenciar defeito do produto de fixture desatualizada.
- Não tratar bibliotecas geradas como código próprio.
- Não repetir toda a suíte sem mudança ou motivo pertinente.
- Informar limitações e etapas não executadas.

Matriz aplicável:

- Desktop/Mobile e larguras intermediárias.
- Dark/Light.
- PT-BR/EN.
- Mouse, teclado e toque.
- Normal, vazio, carregando, erro e indisponibilidade.
- Visitante, administrador e sessão expirada.
- Reload, duas abas e armazenamento falho.
- Foco, contraste, zoom e movimento reduzido.

Não exigir toda combinação cartesiana em toda alteração. Cobrir riscos e diferenças reais.

<!-- === 15. REGISTRO ÚNICO DE CONTINUIDADE === -->

## 15. Registro único de continuidade

Este é o checklist único vigente. R01–R14 são revisões de finalização da auditoria de 28/10/2026; não renumeram as 12 etapas de requisitos da seção 12. Checkpoints e seções 18 e 22–24 preservam evidências datadas, sem conceder autorizações atuais.

Base da R01: main, HEAD d6c0c2f4051898d8eb5213443511b4cd63d7bed8, inicialmente limpo e sincronizado com o GitHub. A auditoria desse candidato em 30/10 aprovou lint, build externo, 552 testes e CI da execução 41; npm audit não reportou vulnerabilidades conhecidas no lockfile consultado. Essas evidências pertencem ao candidato auditado, não homologam automaticamente as alterações posteriores ou as revisões R02–R14. Os registros anteriores de 26/10 e 28/10 permanecem históricos.

| Revisão                                         | Etapas do mestre | Estado e evidência local                                                                                                    | Pendência / responsável                                                                               |
| ----------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| R01 — Escopo e acompanhamento                   | 01               | Concluída e aceita pelo proprietário em 30/10/2026; baseline d6c0c2f                                                        | Nenhuma pendência desta revisão                                                                       |
| R02 — Segurança e banco                         | 02               | Finalizada por aceite explícito do proprietário em 30/10/2026; testes externos de 29/10 informados como aprovados           | Evidência local e metadados preservados; proteção de senhas desativada conhecida no aceite            |
| R03 — Core e personalização                     | 03/04            | Finalizada por aceite explícito do proprietário em 30/10/2026; 102 testes aprovados e percurso visual registrado            | Matriz física e leitor de tela na revisão transversal                                                 |
| R04 — Arquivos, Editor e Visualizador           | 05               | Finalizada por aceite explícito do proprietário em 30/10/2026; lint, 552 testes e build aprovados                           | Desempenho físico em R13 e arquivos gerenciados em R11                                                |
| R05 — Conteúdo profissional                     | 06               | Finalizada por aceite explícito do proprietário em 30/10/2026; correções, lint/552 testes/build aprovados                   | Matriz física e inspeção visual integral dos comprovantes não certificadas                            |
| R06 — Projetos e destaques                      | 06/07            | Finalizada por aceite explícito do proprietário em 30/10/2026; catálogo/README/permissões reais e 24 testes aprovados       | Concorrência conserva última gravação, sem revisão otimista                                           |
| R07 — Notas, apresentação e Configurações       | 07/11            | Finalizada após exclusão autorizada da nota de teste e continuidade autorizada pelo proprietário                            | CRUD real da interface permanece em R11                                                               |
| R08 — Cinco jogos e Calculadora                 | 08               | Finalizada por aceite do proprietário em 30/10/2026; percursos e testes registrados                                         | Toque físico e rankings reais nas revisões próprias                                                   |
| R09 — Terminal, Wally e busca                   | 09               | Finalizada por aceite do proprietário em 30/10/2026; tema autorizado e lint/553 testes/build aprovados                      | Arquivos somente no app Arquivos conforme decisão vigente                                             |
| R10 — Desktop, Taskbar, menu, painéis e widgets | 10               | Finalizada por aceite do desempenho observado pelo proprietário; lint/553 testes/build aprovados                            | Medição instrumental não realizada, sem certificação de FPS/latência                                  |
| R11 — Serviços administrativos reais            | 02/07            | Validação local aprovada; proprietário corrigiu que não realizou testes reais e autorizou avançar                           | Homologação real não executada; não considerar produção certificada                                   |
| R12 — Mobile e tablets                          | 10               | 22 testes locais aprovados; Home/catálogo/Currículo/retorno e orientação conferidos em emulação                             | Toque físico, teclado virtual e dispositivos reais não testados                                       |
| R13 — Revisão transversal final                 | Todas/12         | Validação local: lint, 553 testes, build e 33 testes dirigidos aprovados; CI do commit base confirmado                      | R11 real e dispositivos/acessibilidade física não homologados; CI não cobre diff local                |
| R14 — Operação e publicação                     | 12               | Candidato local validado: lint/554 testes/build, npm audit sem vulnerabilidades conhecidas, cabeçalhos testados em Wrangler | Sem commit/push/deploy; backup/restore, cotas e alertas não ensaiados; limites de R11/R12 preservados |

<!-- ----- Validação da R02 em 30/10/2026 ----- -->

### R02 — Segurança e banco: encerrada por aceite do proprietário

- **Execução local:** Wrangler 4.156.0 pelo cache existente, sem instalação, deploy ou migração remota. As quatro migrações D1 foram aplicadas somente ao armazenamento descartável em entregas/ws-os-r02-wrangler-state, fora do repositório.
- **Resultado HTTP:** oito rotas administrativas recusaram visitantes com 401 e cabeçalhos no-store/nosniff; API inexistente retornou 404 JSON. Com D1 preparado e IP de teste, JSON inválido e credenciais vazias retornaram 400; a sexta tentativa retornou 429 com Retry-After. A indisponibilidade inicial do login decorreu do D1 local vazio, sem demonstrar defeito de produção.
- **Testes controlados:** 47 testes existentes de backend, autenticação, Worker e proteção Wally aprovados, sem falhas. Não equivalem a login real ou homologação completa de identidades.
- **Banco real, somente leitura:** dez tabelas com RLS, Snake 397, Flappy 100000, view legada com security_invoker/security_barrier e SELECT negado a anon/authenticated; leitura pública dos IDs de destaques preservada; bucket privado de 10 MiB. Não reaplicar a migração incremental já confirmada.
- **Informação do proprietário:** confirmou rotação/revogação e testes externos de RLS com visitante/usuário comum/admin, rankings, Turnstile e retenção realizados em 29/10/2026, com resultado aprovado. Em 30/10/2026 determinou considerar R01 e R02 finalizadas e avançar à R03. Ambiente e relatórios detalhados não foram apresentados; não atribuir esses testes ao assistente.
- **Limites preservados no aceite:** Supabase continua remoto mesmo com Wrangler local; nenhum cron de retenção foi invocado pelo assistente. Proteção contra senhas vazadas permanece desativada no advisor; o aceite não altera essa configuração nem comprova sua correção.
- **Próxima revisão:** R03 autorizada expressamente pelo proprietário.

<!-- ----- Revisão rápida da R03 em 30/10/2026 ----- -->

### R03 — Core, janelas e personalização

- **Base:** main, d6c0c2f, preservadas as alterações documentais e exclusões residuais de R01/R02.
- **Contratos controlados:** 102 testes existentes aprovados, sem falhas, em windows-interaction, navigation-pending, lifecycle, settings, settings-ui, appearance, branding, desktop, desktop-shell-ui e mobile-shell-ui. Cobrem foco/geometria, descarte e troca de shell, movimento por teclado, persistência por tema/shell, destaque automático/manual, cursor, favicon, enquadramento e restauração com preservação de dados.
- **Percurso visual atual:** origem isolada 127.0.0.1:4194, boas-vindas em duas etapas, entrada Mobile e Desktop em 1440×900; Configurações abriu, maximizou, restaurou, minimizou e retornou pela Taskbar. Dark Green foi preservado após selecionar Light Violet e retornar ao tema escuro.
- **Resultado:** nenhum defeito reproduzido nesse conjunto; implementação preservada, sem refatoração ou exclusão adicional. Percursos anteriores de rascunho e troca de shell permanecem registrados abaixo, complementados pelos testes atuais.
- **Limites:** não executados nesta revisão rápida leitor de tela, toque físico ou benchmark. A matriz transversal permanece em R13; os testes controlados não são apresentados como reprodução visual de todos os casos.

<!-- ----- Revisão rápida da R04 em 30/10/2026 ----- -->

### R04 — Arquivos, Editor e Visualizador

- **Base e modo:** main, d6c0c2f, revisão rápida local; preservadas as alterações anteriores. Aceite da R03 recebido pela instrução “r03 finalizada vai pra R04”.
- **Correções:** src/apps/files/Files.jsx traduz os caminhos visuais das áreas do sistema, descrições, contagens, tipos e orientação de pesquisa. Nomes pessoais e caminhos virtuais canônicos foram preservados. src/apps/file-viewer/PdfPreview.jsx traduz os links acessíveis e atualiza seus rótulos após troca de idioma sem redesenhar o canvas. Catálogos PT-BR/EN receberam somente a mensagem correspondente. Formatação dos componentes tocados ajustada pelo Prettier existente.
- **Percurso atual:** em 127.0.0.1:4195, Desktop 1440×900 e idioma EN, criada pasta R04-teste e rascunho.txt; salvo texto de duas linhas no Editor e confirmado conteúdo no Visualizador; renomeado para revisado.txt, enviado à lixeira e restaurado. Descrições e caminho visual traduzidos, nome pessoal preservado. Currículo real renderizado em 1/1 página, zoom 125%, rotação e busca por Software com cinco resultados; links com Open PDF link e noopener noreferrer.
- **Testes controlados:** 73 testes pertinentes passaram antes da alteração; após as correções, lint e suíte completa de 552 testes aprovados, sem falhas. Incluem revisão concorrente, quota, lixeira/exclusão, importação de imagem/PDF, busca/substituição, cópia e proteção de rascunhos. Esses casos automatizados não são apresentados como todos repetidos manualmente em duas abas reais nesta revisão.
- **Build:** saída externa em entregas/ws-os-r04-2026-10-30 aprovada. Chunk FileViewer 621,10 kB, gzip 186,55 kB; anteriormente 620,95 kB, gzip 186,50 kB. Sem alteração do limite de aviso ou refatoração para escondê-lo. Tamanho e abertura local não certificam desempenho físico; P14 permanece para medição representativa na revisão transversal.
- **Limites:** arquivos gerenciados remotos em R11; matriz física/leitor de tela e desempenho representativo em R13. Não executada exclusão permanente via UI nesta origem; contrato coberto pelos testes. Sem remoção adicional de arquivos, migração, commit ou push.
- **Estado:** aceita pelo proprietário em 30/10/2026 pela instrução “Esta aceita vai pra R05”.

<!-- ----- Revisão rápida da R05 em 30/10/2026 ----- -->

### R05 — Conteúdo profissional

- **Base e escopo:** main, d6c0c2f, alterações locais anteriores preservadas. Sobre Mim, Dev Insights, Currículo e Certificados; Projetos pertence à R06 conforme a auditoria.
- **Sobre Mim:** conteúdo PT-BR/EN lido no componente e perfil; percurso EN confirmou apresentação, formação, tecnologias, objetivos, links GitHub/LinkedIn e navegação contextual. Nenhuma experiência inventada ou conteúdo profissional reescrito.
- **Dev Insights:** GitHub real respondeu 200 para perfil e catálogo de 16 repositórios. Worker público respondeu 200 para WakaTime em 7/30/365 dias. A janela de 30 dias retornou 25/09 a 25/10, independente da consulta de 30/10. Corrigida a UI para mostrar o período efetivo de data.start/data.end, reutilizando textos PT-BR/EN existentes; ausência, inversão ou datas inválidas não viram uma janela fictícia. Quatro verificações dirigidas do formatador passaram. Não foi alterado o provedor ou inventado dado para atualizar a janela.
- **Currículo:** PDF versionado lido, uma página, conteúdo profissional e endereço de documento conferidos; atalho, canvas, busca, links e download já conferidos no percurso R04 e preservados. Documento continua em português também no shell EN; não foi criada tradução não aprovada do comprovante.
- **Certificados:** 11 PDFs existentes interpretados por PDF.js. Títulos, datas e cargas presentes conferidos no texto extraído; nenhum documento alterado. GitHub Copilot Dev Days e We Make Software tinham duração apenas nas descrições: preenchido workload de 2 e 4 horas em PT-BR/EN, conforme comprovantes. Categorias Palestras/Outros ganharam tradução. Na UI EN, pesquisa Copilot + Eventos produziu um resultado, detalhes mostraram 12/05/2026 e 2 hours, com ações View/Download. A leitura textual não certifica o layout de todas as páginas nem autenticação junto aos emissores.
- **Arquivos da R05:** src/content/portfolioContent.js (metadados e formatação), src/apps/dev-insights/DevInsights.jsx (período registrado e formatação), catálogos en.json/pt-BR.json (duas categorias) e documentação vigente. Sem exclusão adicional.
- **Validação:** 35 testes pertinentes passaram antes das correções; após mudanças, lint, suíte completa com 552 aprovados e build externo entregas/ws-os-r05-2026-10-30 aprovados. Aviso conhecido FileViewer 621,10 kB preservado.
- **Limites e estado:** revisão técnica rápida entregue para aceite. Testes controlados cobrem cache, falhas e navegação contextual; frontend Vite local sem Worker não homologa WakaTime remoto por si só. Inspeção visual integral de cada comprovante, toque e leitor de tela não foram certificados. Sem commit, push, alteração dos PDFs ou escrita remota.

<!-- ----- Revisão da R06 em 30/10/2026 ----- -->

### R06 — Projetos e destaques por ID

- **Base:** main, d6c0c2f, alterações anteriores preservadas. R05 aceita pelo proprietário com “Pode avancar”.
- **Catálogo e navegação:** prévia isolada 127.0.0.1:4195, Desktop 1440×900, EN. Carregados 16 repositórios reais, pesquisa ws-os produziu um resultado, detalhes exibiram metadados reais, README e links seguros. Voltar preservou a pesquisa. Combinação ws-os/Python produziu vazio explícito pelo filtro operado por teclado. Ordenação existente por atualização/nome preservada, sem ordem editorial manual.
- **Destaques públicos:** Worker real respondeu 200 com repositoryIds contendo github-1369893821. Banco consultado somente em leitura: anon pode ler repository_ids, não demos, nem inserir/atualizar; políticas pública/admin preservadas. A prévia Vite não serve o Worker: seu aviso de destaques indisponíveis não reproduz falha da API pública real.
- **Fluxo administrativo:** proprietário confirmou em 30/10/2026 que testou seleção de projetos em destaque em 29/10/2026 e funcionou. Os testes controlados complementam o relato com selecionar/remover, salvar, recuperar, projeção pública e preservação em erro. Nenhuma gravação remota foi executada pelo assistente nesta revisão.
- **Concorrência:** contrato existente não possui controle otimista de revisão; duas gravações autorizadas podem fazer prevalecer a última seleção. Foi mantido o comportamento documentado, sem adicionar migração, revisão ou ordenação não previstas. Evitar editar a seleção simultaneamente em duas sessões. Confirmação do payload devolvido não elimina essa limitação.
- **Validação:** 24 testes pertinentes aprovados, sem falhas, incluindo APIs, componentes, filtros/contratos, navegação, permissões e tratamento de falhas. Nenhuma regressão reproduzida que justifique reabrir a implementação. Lint/build completos da R05 permanecem a evidência anterior; não foram reexecutados como se houvesse mudança de código na R06.
- **Alterações desta revisão:** apenas README e este acompanhamento. Sem código novo, exclusões adicionais, demos, iframe, migração, commit ou push.
- **Estado:** revisão entregue para aceite; matriz física/Mobile transversal permanece nas revisões próprias.

<!-- ----- Revisão da R07 em 30/10/2026 ----- -->

### R07 — Notas, Sobre o Sistema, Configurações e boas-vindas

- **Base e ambiente:** main, d6c0c2f, alterações anteriores preservadas. R06 aceita com “Pode ir”. Wrangler 4.156.0 local em 127.0.0.1:8787, assets do build externo validado na R05 e D1 local já preparado. Sem deploy, escrita editorial, curtida, login ou cron de retenção.
- **Notas:** API real/local respondeu 200. UI PT-BR: listagem, busca sem resultado, recuperação e abertura da publicação conferidas; EN: busca, assunto, data e ação de leitura traduzidos. Dados editoriais mantidos no idioma publicado, sem tradução inventada. Anexos públicos válidos/privados, erros e navegação cobertos pelos testes controlados; a nota real não forneceu anexo para repetir o percurso completo com provedor. CRUD permanece em R11.
- **Conteúdo de teste:** publicação c091333a-7dbe-4696-9d54-2d343155f205, título gsg, permanece pública na última consulta. Proprietário confirmou ser teste e informou que vai despublicar pela Administração. Não excluída ou modificada pelo assistente. Reconsultar /api/posts após a ação do proprietário; a retirada ainda não foi comprovada.
- **Sobre o Sistema:** versão 2.0.0 conferida na UI EN; identidade, arquitetura, recursos e repositório preservados. Créditos presentes para React Icons, Font Awesome 5, Simple Icons, React/React DOM, Vite, Lucide e PDF.js; links HTTPS com abertura externa segura. Não foi necessário reimplementar créditos já existentes.
- **Configurações:** percorridas as sete seções na UI PT-BR: Aparência, Idioma, Acessibilidade, Área de Trabalho, Widgets, Mobile e Restaurar. Movimento reduzido acionado; ocultar relógio retirou consumidor real. Cancelar reset preservou estado; confirmar aplicou padrões e devolveu relógio. Troca para EN atualizou interface e idioma persistiu após reload. Preferências/dados pessoais permanecem cobertos pelos testes de allowlist e restauração parcial. Não foi apresentada certificação de toda combinação visual por dispositivo.
- **Boot e boas-vindas:** primeira visita na origem isolada apresentou boot e duas etapas; foco inicial no título, Escape não dispensou, conclusão explícita entrou no Desktop. Reload voltou ao Desktop em EN sem repetir boas-vindas.
- **Validação:** 53 testes existentes pertinentes aprovados, zero falhas. Formatação documental e git diff --check aprovados. Sem alteração de implementação, não repetidos lint/build completos já aprovados na R05 como se fossem uma nova execução.
- **Resolução posterior do conteúdo de teste:** em 30/10/2026, o proprietário autorizou explicitamente apagar a nota gsg. Exclusão pelo conector Supabase limitada ao ID c091333a-7dbe-4696-9d54-2d343155f205, título, status e revisão previamente conferidos. Removida uma publicação e suas duas curtidas em cascata; nenhum anexo existia. Consulta posterior confirmou zero registros desse ID e suas curtidas; /api/posts respondeu 200 com lista vazia. Essa ação não é homologação do CRUD pela interface.

- **Alterações e estado anteriores à exclusão autorizada:** somente README e acompanhamento vigente nesta R07. Nenhum arquivo adicional removido. Sem commit ou push. Revisão técnica sem regressão reproduzida; pendência editorial resolvida pela exclusão autorizada registrada acima, liberando a continuidade da R08. Leitor de tela e toque físico permanecem nas revisões transversais próprias.

<!-- ----- Revisão da R08 em 30/10/2026 ----- -->

### R08 — Cinco jogos e Calculadora

- **Base e modo:** main, d6c0c2f, alterações anteriores preservadas; revisão local em 127.0.0.1:4195, Desktop EN. R07 liberada após excluir a nota de teste autorizada e confirmar retirada pública; proprietário autorizou continuar.
- **Snake:** catálogo, início, pausa e reinício conferidos na UI. Modelos/testes cobrem direção, colisão e limite 397.
- **Memória:** início e revelação produziram um par, 1/8, uma tentativa; pausa e reinício conferidos. Modelo real completou oito pares e vitória em verificação controlada, sem modificar recordes da UI.
- **Campo Minado:** primeiro clique seguro abriu área e chegou a 48% na partida observada; pausa e reinício conferidos. Modelo real confirmou derrota gameover ao revelar mina e vitória won ao revelar células seguras. O roteiro temporário inicialmente esperava o nome incorreto lost; corrigido o roteiro para o estado oficial, sem mudança no produto.
- **Flappy Bird:** início, impulso e pausa observados; controle de voo bloqueado em pausa. Colisão, delta e suspensão cobertos pelos testes. A sessão de navegador foi encerrada entre turnos; a verificação retomou em nova aba sem declarar retomada do estado transitório antigo.
- **Paciência:** início, Ás para base, revelação da carta anterior, compra e pausa observados; compra/destinos bloqueados em pausa, reinício acionado. Modelo real confirmou último movimento para quatro bases completas e progresso de 100%, em estado controlado. Não se apresenta esse cenário como partida completa jogada na UI.
- **Calculadora:** UI EN confirmou -2.5+50% = -2, erro de divisão por zero, modo científico e sin(30) = 0.5 em graus, entrada por teclado e histórico. Testes existentes cobrem edição, seleção, unidade graus/radianos, persistência/falha e recuperação do histórico.
- **Validação:** 35 testes de jogos/calculadora/rankings aprovados no início da R08 e 29 adicionais de utilitários, contratos e Mobile aprovados nesta continuação; zero falhas. Verificações dirigidas adicionais dos modelos aprovadas conforme descritas. Não houve mudança de código ou necessidade de refatoração; formatação documental e git diff --check aprovados.
- **Limites:** UI não percorreu todas as vitórias/derrotas ou reload de cada recorde; cenários controlados e cobertura de recordes complementam o percurso rápido. Toque físico, matriz transversal e escrita/moderação de ranking real permanecem nas revisões próprias. DOOM não integra o escopo.
- **Arquivos e estado:** somente README e acompanhamento alterados na R08; nenhum arquivo removido, commit, push ou envio de pontuação. Revisão técnica local entregue para aceite antes de R09.

<!-- ----- Revisão da R09 em 30/10/2026 ----- -->

### R09 — Terminal, Wally local e busca

- **Base e escopo:** main, d6c0c2f, alterações anteriores preservadas. R08 aceita com “Vai”. Proprietário decidiu incluir mudança de tema pelo Wally; operações pessoais permanecem no app Arquivos. Não foi adicionada ferramenta de shell ou ação administrativa.
- **Implementação:** wallyService reconhece pedido explícito PT/EN por tema claro/escuro e retorna sugestão, sem executar. Pedidos negados, ambíguos ou informativos não oferecem mudança. WallyPanel e WallyExtended mostram botão somente em resposta local para light/dark; o clique usa appearance.set-theme com contexto wally. Feedback distingue persistência, sessão apenas e falha. Mensagem remota não recebe o botão de tema.
- **Traduções:** corrigidas Habilidades, ASSISTENTE e expandir/recolher campo; mensagens/botões do novo fluxo presentes em PT-BR/EN. Componentes tocados formatados, sem mudanças de CSS.
- **Percurso visual:** prévia isolada 127.0.0.1:4195, EN. Switch to light theme manteve dark até clicar Enable light theme; clique aplicou light e Theme applied. Histórico compartilhado apareceu no modo estendido; Set dark mode ofereceu Enable dark theme e clique aplicou dark. Terminal exibiu ajuda em inglês e pwd retornou ~. Busca por aplicativos e destinos públicos já exercitada nos percursos anteriores; testes atuais conferem parâmetros, origem e acesso.

| Ação registrada              | Alcance efetivo nesta versão                                 | Confirmação e acesso                                                                               |
| ---------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| app.open                     | Wally, busca e Terminal abrem destinos públicos              | Contrato valida app público e parâmetros; Core preserva guards                                     |
| content.search               | Busca usa consulta pública; Wally orienta e navega para apps | Sem dados privados; executor genérico não é apresentado como ferramenta de pesquisa livre do Wally |
| appearance.set-theme         | Wally local: botão claro/escuro; Terminal: theme existente   | Clique explícito; contexto local; apenas light/dark                                                |
| personal-files.create-folder | Aplicativo Arquivos; executor interno preservado             | Não exposto pelo Wally nesta versão                                                                |
| personal-files.rename        | Aplicativo Arquivos; executor interno preservado             | Contrato exige confirmação; não exposto pelo Wally                                                 |
| personal-files.trash         | Aplicativo Arquivos; executor interno preservado             | Contrato exige confirmação; não exposto pelo Wally                                                 |
| preferences.reset            | Configurações com confirmação                                | Contexto wally é negado pelo catálogo                                                              |
| administration.open          | Terminal/login e entradas protegidas existentes              | Exige sessão administrativa; Worker revalida; Wally não concede privilégio                         |

- **Testes:** 39 pertinentes aprovados antes das alterações. Adicionada regressão de pedidos PT/EN explícitos, negados, ambíguos e informativos. Lint final aprovado; suíte final 553 testes aprovados, zero falhas; build externo entregas/ws-os-r09-final-2026-10-30 aprovado com aviso conhecido do Visualizador. Integração faltante do botão estendido detectada pelo lint durante execução foi corrigida e validada antes da entrega.
- **Fronteiras:** Wally remoto permanece desativado. Testes cobrem sanitização de login/histórico, cancelamento, sessão, respostas tardias e conteúdo seguro. Não houve login real, segredo em histórico, ação de arquivos pelo Wally, instalação, remoção adicional, commit ou push. Matriz física permanece nas revisões próprias.
- **Arquivos:** src/services/wallyService.js; src/features/wally/WallyPanel.jsx; src/apps/wally-extended/WallyExtended.jsx; catálogos en.json/pt-BR.json; tests/core/wally-security.test.cjs; README e este acompanhamento.
- **Estado:** revisão técnica entregue para aceite antes da R10.

<!-- ----- Revisão da R10 em 30/10/2026 ----- -->

### R10 — Composição Desktop

- **Base:** main, d6c0c2f, alterações anteriores preservadas; R09 aceita pelo proprietário com “Vai”. Prévia isolada 127.0.0.1:4195, Desktop EN, 1440×1000.
- **Correção:** src/features/notifications/NotificationToasts.jsx usa tradução parametrizada para a quantidade de notificações aguardando. Mensagem adicionada aos catálogos PT-BR/EN; quantidade/fluxo da fila preservados.
- **Janelas e Taskbar:** Sobre Mim, Projetos e Terminal mantidos montados, com minimização e restauração da instância correta pelo grupo da Taskbar. Não houve perda das instâncias observadas. Previsão, privacidade de miniaturas e grupos cobertos pelos testes pertinentes.
- **Painéis e menu:** sequência Notificações → Controles Rápidos → WS Menu dispensou painel anterior; auto-ocultação ativada, menu permaneceu operável. Todos mostrou 13 apps públicos conforme showInMenu, sem Administração. Escape fechou o menu e devolveu foco ao WS Menu; o mesmo devolveu foco a Quick controls. Auto-ocultação restaurada ao valor original da origem de teste.
- **Atalhos e widgets:** 49 testes pertinentes aprovados: grade em 96 combinações, áreas insuficientes, movimentação de grupo, posições inválidas, persistência, multiwidget, fuso, calendário/eventos, clima/unidades, geolocalização negada e Dev Insights. Consumidor real de visibilidade de relógio já conferido na R07. Não apresentar esses testes como todos repetidos manualmente no dispositivo físico.
- **Validação da correção:** lint aprovado, suíte completa com 553 testes aprovados (zero falhas) e build externo entregas/ws-os-r10-2026-10-30 aprovado. Aviso conhecido FileViewer 621,10 kB preservado. Formatação e git diff --check conferidos. Sem mudança de arquitetura, remoção adicional, migração, commit ou push.
- **Medição pendente:** as ferramentas de navegador utilizadas não forneceram captura de quadros/latência. Não foram certificados FPS, long tasks ou ausência de travamento físico com várias janelas. Tempo de build e os testes de coalescência de movimentos não substituem essa evidência. Para fechar esse critério, registrar no dispositivo alvo uma captura de desempenho durante arraste/resize e troca de foco com várias janelas, efeitos normais e baixo custo, anotando duração, fluidez e travamentos.
- **Estado:** proprietário informou que o desempenho está bom e autorizou avançar à R11. R10 encerrada por esse aceite; tentativa de captura nativa foi interrompida pelo controle do computador por não confirmar a URL com confiança. Sem métricas instrumentais ou certificação de FPS/latência.

<!-- ----- Revisão da R11 em 30/10/2026 ----- -->

### R11 — Homologação administrativa e serviços

- **Base:** main, d6c0c2f; alterações anteriores preservadas. R10 encerrada pelo aceite do desempenho observado pelo proprietário, sem medição instrumental.
- **Leituras reais:** APIs públicas posts/files/events/highlights/rankings responderam 200 JSON; oito rotas auth/admin recusaram visitante com 401, no-store e nosniff. Nenhuma chamada GET retornou HTML como API. Isso não certifica usuário comum ou administrador autenticado.
- **Decisão de Contato:** proprietário determinou manter somente mensagem e atualizar documentação. Formulário já fixava kind=message; retirado texto que prometia solicitação de horário. Backend/contratos de agendamento e registros legados preservados, sem migração.
- **Correções locais:** Contact.jsx traduz canais, descrições, títulos, rótulos acessíveis, placeholders e verificação. Catálogos PT-BR/EN completados; interface EN conferida sem envio. README e guia operacional alinhados ao escopo vigente.
- **Validação:** 86 testes pertinentes aprovados; após correções, lint aprovado, 553 testes completos aprovados e build externo entregas/ws-os-r11-2026-10-30 aprovado, com aviso conhecido FileViewer 621,10 kB. Formatação e git diff --check conferidos. Nenhum dado de contato enviado ou operação administrativa autenticada executada pelo assistente nesta revisão.
- **Advisor:** permanecem os avisos já avaliados em R02: tabela post_likes sem política pública intencional, RPC de contagem pública restrita e proteção contra senhas vazadas desativada. Não foram alterados grants para silenciar alertas; configurações de Auth não modificadas.

| Fluxo real                                                               | Evidência nesta R11                                                                             | Situação                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Visitante nas rotas administrativas                                      | GET real retornou 401                                                                           | Conferido pelo assistente                           |
| Usuário comum, admin, login/logout/expiração com rascunho                | Testes controlados aprovados; proprietário corrigiu posteriormente: testes reais não realizados | Não realizado; avanço autorizado                    |
| Contato mensagem, Turnstile, recibo, idempotência e e-mail independente  | Correções locais e testes aprovados                                                             | Não realizado; avanço autorizado                    |
| Notas: ciclo editorial, curtida, anexo e acesso após despublicação       | Testes controlados; exclusão do teste anterior não certifica CRUD UI                            | Aguardando resultado real do proprietário           |
| Arquivos oficiais: upload, download, publicação, exclusão, reconciliação | Testes controlados aprovados                                                                    | Aguardando resultado real do proprietário           |
| Conteúdo/eventos: revisão, datas/fusos e projeção pública                | API pública e testes controlados                                                                | Não realizado; avanço autorizado                    |
| Destaques                                                                | Proprietário confirmou funcionamento em 29/10 na R06; API real reconferida                      | Evidência anterior preservada                       |
| Rankings: proteção, envio, melhor resultado e moderação                  | Leitura pública e testes controlados                                                            | Aguardando resultado real do proprietário           |
| Retenção/limpeza isolada                                                 | Proprietário confirmou teste em 29/10 na R02                                                    | Evidência anterior preservada; nenhum cron invocado |

- **Limite local do Turnstile:** ao encerrar a prévia, o console registrou 110200 (domínio não autorizado). O teste visual local não certifica o desafio nem o envio; não alterar a allowlist de produção para contornar a verificação. Consultar https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/. Não reproduzido no domínio público nesta revisão.

- **Retomada:** registrar quais fluxos o proprietário testou, data, resultado e eventuais falhas. Não enviar senhas/tokens ao chat. Não considerar o bloco encerrado apenas por testes Node/metadados. Sem commit, push, exclusão adicional ou escrita remota nesta R11.

<!-- ----- Retificação da R11 e revisão local da R12 ----- -->

### R11 — Retificação do proprietário

Em 30/10/2026, o proprietário esclareceu “Nao realizei testes, se voce nao consegue realizer apenas avance”. Essa declaração substitui a indicação anterior de testes reais existentes na R11. Login/logout/expiração, Contato/Turnstile/envio, ciclo editorial/anexos, arquivos oficiais, eventos e rankings não foram homologados em fluxos reais nesta revisão. Testes automatizados e leituras remotas continuam válidos apenas em seus limites. Avanço autorizado à R12 sem certificar esses fluxos. Evidências datadas de R02/R06 não são convertidas em homologação geral da R11.

### R12 — Mobile: revisão nas condições disponíveis

- **Base:** main, d6c0c2f, alterações anteriores preservadas; prévia local 127.0.0.1:4195 em EN.
- **Testes:** 22 testes existentes de mobile-shell-ui, navigation-pending e app-contracts aprovados, sem falhas; cobrem instâncias, pausa de jogos, navegação contextual, guards e retorno.
- **Emulação:** Home e catálogo conferidos em 390×844, Wally disponível como app e Administração ausente para visitante. Currículo abriu o PDF real no Visualizador com 1/1 página, download e links; Back retornou à Home. Documento sem overflow horizontal global na leitura registrada: clientWidth=scrollWidth=380. Catálogo horizontal 844×390: clientWidth=scrollWidth=844.
- **Limites:** emulação não equivale a dispositivo físico. Não testados toque físico, teclado virtual real, barras nativas e áreas seguras em aparelhos. Não há certificação integral de Mobile/tablet nem execução remota autenticada.
- **Alterações:** somente registros documentais; nenhuma regressão reproduzida que exigisse mudar o shell. Sem instalação, exclusão adicional, commit ou push.

<!-- ----- Revisão transversal R13 em 30/10/2026 ----- -->

### R13 — Consolidação e validação transversal

- **Base e autorização:** main, d6c0c2f; diff local preservado. Proprietário autorizou continuar após a revisão local da R12; as limitações anteriores não foram convertidas em homologação integral.
- **Validação atual:** lint aprovado, suíte completa 553/553 aprovada sem falhas/cancelados/ignorados; build externo entregas/ws-os-r13-2026-10-30 aprovado. Índice principal 495,52 kB, gzip 150,52 kB; FileViewer 621,10 kB, gzip 186,55 kB. Aviso não suprimido. 33 testes selecionados de acessibilidade, i18n, app-contracts e public-data-sync aprovados.
- **Acessos e integrações:** consolidados os percursos e contratos das revisões R03–R12. Registro com 17 entradas, Currículo como atalho, Administração protegida; catálogo Desktop público conforme showInMenu. Não se afirma novo percurso manual integral de 17 entradas autenticadas nesta R13.
- **Cobertura transversal:** testes conferem paridade das chaves PT-BR/EN, foco/guards/limites de acesso, normalização, fallback de armazenamento, cache e sincronização. Percursos visuais datados anteriores complementam a suíte. Nenhuma regressão crítica nova reproduzida pelo conjunto executado; testes de cobertura de traduções não garantem toda string dinâmica ou conteúdo externo traduzido.
- **Revisão do diff:** git diff --check aprovado. Inventário de 490 arquivos rastreados não encontrou ambiente local/segredo por nome na seleção consultada; padrões conhecidos de chave privada, GitHub e sb_secret não apareceram nas linhas adicionadas. Varredura limitada, sem impressão de segredos; não é garantia absoluta de ausência de credenciais. Exclusões seguem limitadas aos dois SVGs residuais autorizados na R01.
- **CI:** remoto main continua d6c0c2f; execução 41 de Validação com success em https://github.com/warlleyz/ws-os/actions/runs/41092189534. Isso aprova somente o commit base. Alterações locais ainda não têm CI remoto; não houve commit/push autorizado.
- **Limites preservados:** testes reais da R11 não realizados conforme retificação; toque físico, teclado virtual real, leitor de tela e zoom nativo 200% não homologados. Desempenho aceito pelo proprietário por observação, sem captura instrumental. Turnstile local com domínio não autorizado não equivale a teste de envio em produção.
- **Alterações e continuidade:** somente documentação nesta R13; sem novo código, exclusão, publicação ou escrita remota. Revisão local concluída nos limites descritos; candidato exige consolidar os riscos/pendências operacionais na R14, sem declarar versão 100% homologada.

<!-- ----- Preparação operacional da R14 em 30/10/2026 ----- -->

### R14 — Candidato local e operação

- **Base e autorizações:** main, d6c0c2f; R13 aceita para continuidade com “Pode tambem”. Não houve commit, push, deploy, migração ou alteração de segredo/flag remota. Candidato é o checkout com diff, não uma revisão Git publicada.
- **Dependências e licenças:** npm audit do lockfile com ignore-scripts/package-lock-only, sem instalação, retornou zero vulnerabilidades conhecidas. Créditos dos componentes e conjuntos de ícones conferidos na R07. Varredura/inventário de assets não equivale a parecer de licença individual de todo material; demos/DOOM continuam fora do escopo.
- **Metadados e domínio:** index.html contém título, descrição, viewport, tema e metadados sociais. Origem pública informada pelo proprietário responde HTTPS em ws-os.warlleysilvax.workers.dev. Não configurado domínio personalizado nem inventada URL canônica alternativa.
- **Cabeçalhos corrigidos:** worker/index.js preserva assets/status/cache e aplica nosniff/referrer-policy; HTML recebe SAMEORIGIN e CSP de base-uri/object-src/frame-ancestors. Teste cobre corpo/status/cache/ETag e 304 sem corpo. Wrangler local confirmou HTML 200 com os novos cabeçalhos; produção 200 continua sem esses cabeçalhos, pois a mudança não foi publicada. Não declarar CSP restritiva de scripts/conexões ou HSTS configurado.
- **Flags e manutenção:** wrangler.jsonc conserva requests, managed-files, rankings e retenção true; Wally remoto false; cron 0 3 * * * (03:00 UTC). Nenhuma execução manual de retenção. Binding D1 e Supabase existentes preservados; nomes dev não comprovam isolamento. Cotas/plano, orçamento, destinatário de alertas e backup remoto não foram verificados por painel nesta revisão.
- **Validação final:** lint aprovado; 554/554 testes aprovados, zero falhas; build externo entregas/ws-os-r14-2026-10-30 aprovado. FileViewer 621,10 kB, gzip 186,55 kB, aviso preservado. Formatação e git diff --check aprovados. Sem arquivos staged; somente os dois SVGs residuais removidos na R01.
- **Cópia local do diff:** entregas/ws-os-r14-candidato-2026-10-30.patch, fora do repositório; git apply --reverse --check validou correspondência, sem aplicar ou reverter. Esse patch preserva código/documentação, não contém backup de banco/Storage/D1/segredos.

<!-- ----- Roteiro operacional, sujeito a autorização de publicação ----- -->

#### Roteiro operacional manual

1. **Candidato:** revisar o diff e as limitações de R11/R12; preservar o patch e identificar exatamente os arquivos antes de qualquer staging. Não incluir .env, .dev.vars, node_modules, dist ou entregas.
2. **Dados:** em painéis autorizados, obter backup/exportação do PostgreSQL, manifestos e objetos privados do Storage e exportação D1, com data e ambiente. Armazenar com acesso restrito fora do repositório; segredos não vão ao chat. Nenhum desses backups foi criado pelo assistente.
3. **Restauração:** restaurar as cópias em ambiente isolado e conferir schema, RLS, contagens, referências e integridade dos arquivos antes de usar como garantia operacional. Teste não executado; não apontar restore ao projeto público.
4. **Publicação:** somente após autorização específica, criar commit(s) revisáveis, enviar e aguardar CI do novo SHA. CI da execução 41 aprova apenas a base d6c0c2f. Fazer deploy apenas do candidato identificado, sem reaplicar migrações já existentes.
5. **Pós-publicação:** conferir HTTPS/HTML/cabeçalhos, APIs públicas, recusa do visitante em admin, Wally remoto desligado, arquivos e desafio no hostname correto. Realizar os testes administrativos ainda ausentes ou manter a liberação explicitamente limitada. Conferir cotas/alertas e monitorar erros sem dados privados.
6. **Retorno:** preservar o artefato implantado anterior e usar rollback do Worker autorizado se necessário; verificar compatibilidade com schema e Snake 397. Rollback de código não reverte dados. Não voltar cegamente a versão com limite 222, restaurar banco sobre dados novos ou apagar arquivos para simular recuperação. Ensaiar restauração de dados separadamente com autorização.

- **Resultado:** preparação local entregue. Publicação, restore/rollback real, cotas/alertas e homologações reais/físicas continuam não executados. Não declarar projeto 100% homologado ou publicado. Nenhuma dessas limitações foi ocultada pelo avanço autorizado das revisões.

<!-- ----- Encerramento documental da R01 ----- -->

### R01 — Registro de encerramento documental

- **Escopo congelado:** 17 entradas; Currículo integrado ao Visualizador; cinco jogos; Projetos com catálogo GitHub, filtros, ordenação automática, detalhes/README, links e destaques por ID; demos e DOOM removidos; Wally remoto desativado; traduções na própria área.
- **Baseline:** d6c0c2f, main limpa e sincronizada antes desta intervenção. CI aprovado: [execução 41](https://github.com/warlleyz/ws-os/actions/runs/41092189534).
- **Modo vigente:** R01 → R14, uma revisão por vez. Ações externas não executáveis pelo assistente são entregues ao proprietário antes de qualquer avanço.
- **Arquivos desta R01:** README.md e este mestre; removidos somente src/assets/react.svg e src/assets/vite.svg, logos residuais do template sem referência executável. A menção no inventário histórico não é um consumidor e foi preservada como evidência datada.
- **Limpeza:** nenhuma migração, checkpoint, licença, comprovante, configuração local ou dado pessoal foi removido. hero.png e os logs antigos não foram considerados descartáveis apenas por ausência de import.
- **Validação desta R01:** formatação dos dois documentos e git diff --check aprovados; lint aprovado; 552 testes aprovados, sem falhas; build externo em entregas/ws-os-r01-2026-10-30 aprovado, mantendo o aviso conhecido do Visualizador.
- **Pendências técnicas da R01:** nenhuma identificação de escopo em aberto; não confundir esse resultado com homologação de R02–R14.
- **Aceite do proprietário:** recebido em 30/10/2026 pela instrução “Pode ir para a R02”.
- **Próxima revisão:** R02, iniciada após o aceite.

<!-- ----- Evidências históricas anteriores desta data ----- -->

### Evidências da revisão de 30/10/2026 até o WS Menu

- Ambiente: prévia do build externo em 127.0.0.1:4187, visitante e armazenamento local isolado; sem login administrativo, escrita remota ou mudança de provedores.
- R03/R07: boot, duas etapas de boas-vindas, Desktop, troca Dark Green → Light Violet → Dark com recuperação de Dark Green; confirmação de fechamento do Editor cancelada preservou o texto.
- R04/R05: criação de validacao-r04.txt, edição, salvamento confirmado e Currículo no Visualizador com PDF de uma página e controles de leitura/download. Certificados exibiu os 11 registros; não foi certificada a exatidão de cada comprovante.
- R05/R06/R07: Sobre Mim, Dev Insights, Certificados, Projetos, Notas e Sobre o Sistema abriram. GitHub apresentou 16 projetos; destaques, Notas, eventos e WakaTime sem backend local mostraram indisponibilidade. Isso não comprova defeito de produção nem homologação remota.
- R08: cinco jogos abriram; início/pausa executados nos cinco e reinício nos quatro percursos seguintes; regras/vitória/derrota permanecem cobertas por testes controlados e exigem aceite representativo completo. Identificadas e corrigidas traduções dinâmicas de categorias, descrições, controles, estados e rótulos acessíveis.
- R09: Terminal abriu e executou help; corrigidas ajuda/introdução que permaneciam em português em EN. Wally respondeu localmente em inglês; a Calculadora retornou 14 para 2+3*4 e erro de divisão por zero para 1/0. Wally cliente tem regressão impedindo transmissão com flag ausente/false e exige verificação para opt-in true. Não foram acrescentadas novas ações a P09.
- R10 até WS Menu: contexto da Taskbar e troca para Controles/Menu observados; contexto anterior foi dispensado. Textos novos em EN e retorno ao WS Menu observados. O registro tem 17 entradas; Todos exibe 13 públicas no Desktop conforme showInMenu, enquanto Editor, Visualizador e Wally Estendido usam acessos contextuais e Administração permanece protegida. Revisão posterior de painéis/widgets e matriz física não foram antecipadas como aceites.
- Não homologados nesta execução: identidades/RLS, migrações, retenção/D1/Turnstile reais, CRUD remoto, dispositivo físico, leitor de tela, desempenho medido e CI remoto. Responsáveis e revisões permanecem na tabela acima.

Ao terminar uma etapa, registrar:

- Entregas e requisitos atendidos.
- Arquivos e contratos afetados.
- Verificações efetivamente executadas.
- Pendências externas.
- Decisões novas aprovadas.
- Próximo incremento.

Evitar criar um novo documento de andamento a cada pequena alteração.

<!-- === 16. CRITÉRIO DE CONCLUSÃO INTEGRAL === -->

## 16. Critério de conclusão integral

A WS OS estará concluída quando:

1. Todos os requisitos obrigatórios tiverem implementação e aceite.
2. Não houver bloqueador conhecido.
3. Lint, build e testes passarem no mesmo candidato.
4. Fluxos críticos funcionarem nos dois shells.
5. Integrações obrigatórias tiverem homologação real.
6. Conteúdo, traduções e apresentação estiverem aprovados.
7. Acessibilidade e desempenho tiverem evidências pertinentes.
8. Credenciais, migrações, licenças e recuperação estiverem resolvidas.
9. Limitações opcionais estiverem explicitamente aceitas.
10. O proprietário aprovar o candidato.

Não calcular “100%” pelo número de arquivos, componentes ou testes.

<!-- === 17. SUBSTITUIÇÃO DA DOCUMENTAÇÃO ANTERIOR === -->

## 17. Substituição da documentação anterior

Este documento passa a ser a referência central quando aprovado pelo proprietário.

A substituição documental não autoriza apagar automaticamente arquivos. Antes da limpeza:

- Preservar migrações, testes SQL, licenças e avisos de terceiros.
- Preservar instruções operacionais e detalhes de recuperação ainda necessários.
- Conferir referências em README e demais arquivos.
- Arquivar o planejamento histórico antes de removê-lo.
- Incorporar aqui qualquer requisito obrigatório que ainda não esteja representado.

O mestre consolida as decisões de conclusão; não reproduz literalmente todas as antigas decisões numeradas. Não interpretar essa condensação como autorização para remover funcionalidades.

**Regra central:** entender antes de modificar, trabalhar por etapas encerráveis, preservar o existente, entregar alterações precisas e declarar conclusão somente com evidências.

<!-- === 18. ETAPA 01 — ENTREGA E DECISÕES VIGENTES === -->

## 18. Etapa 01 — Entrega e decisões vigentes

> Registro histórico de 26/10/2026. Decisões de produto preservadas continuam aplicáveis quando não superadas; autorizações de execução/commit e o baseline abaixo não são atuais. O acompanhamento vigente está na seção 15.

<!-- ----- AUTORIZAÇÃO E LIMITES ----- -->

### Autorização e limites

O proprietário autorizou execução direta desta etapa na main, padronização dos arquivos necessários e um único commit final. Não há autorização para push, deploy, migrações, troca de branch ou implementação das etapas 02–12.

A autorização para organizar arquivos examinados não exige reformatação indiscriminada de código estável. Nesta etapa, as alterações ficam restritas a documentação e referências. Fonte, testes, SQL, configuração de runtime, dependências e assets permanecem preservados.

<!-- ----- DECISÕES CONFIRMADAS NESTA EXECUÇÃO ----- -->

### Decisões confirmadas nesta execução

| ID     | Decisão                                                                                                  | Consequência                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| D01-01 | Boot mantém processador; favicon utiliza as logos                                                        | Não substituir o símbolo do Boot                                             |
| D01-02 | Administração seleciona destaques por ID; demais projetos usam ordenação automática e filtros existentes | Não adicionar ordem editorial manual nem restaurar demos                     |
| D01-03 | Animações de janelas obrigatórias, respeitando movimento reduzido                                        | Revisar o ciclo de vida na Etapa 03 e composição na Etapa 10                 |
| D01-04 | Reiniciar e Desligar fora desta versão                                                                   | DEC-155 e exigências equivalentes deixam de ser bloqueadores desta conclusão |
| D01-05 | Um commit ao final da Etapa 01, diretamente na main                                                      | Não estender autorização a commits futuros ou push                           |

Não há decisão crítica de escopo pendente nesta entrega. Conteúdo, homologações e aceite visual continuam necessários nas respectivas etapas; sua ausência não autoriza inventar resultados.

<!-- ----- CHECKLIST EXECUTADO ----- -->

### Checklist executado

- [x] Conferir branch e comparar commit local/remoto por leitura.
- [x] Identificar alterações rastreadas, índice e arquivos não rastreados.
- [x] Examinar mestre, documentação anterior, scripts e pontos dos defeitos conhecidos.
- [x] Registrar contratos, referências operacionais e dependências preservadas.
- [x] Resolver divergências de Boot, destaques, animações e comandos de sessão.
- [x] Definir responsável e critério de aceite para cada pendência.
- [x] Classificar os documentos sem exclusão ou movimentação.
- [x] Padronizar comentários Markdown e corrigir referências relativas quebradas.
- [x] Executar lint, build e suíte como baseline; não ocultar falhas preexistentes.
- [x] Preparar um único conjunto documental para commit, sem arquivos pessoais, segredos ou código de aplicação.

<!-- ----- BASELINE DESTA EXECUÇÃO ----- -->

### Baseline desta execução

| Verificação                        | Resultado                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Código de referência               | 3e6af7d251ef296ed26d905f590610c3360627cf                                                    |
| Branch inicial                     | main, coincidente com o remoto                                                              |
| Alterações iniciais                | Mestre novo e doom-source/ não rastreados; nenhum arquivo rastreado modificado ou preparado |
| Node / npm                         | 24.19.0 / 11.17.0                                                                           |
| Lint                               | Aprovado                                                                                    |
| Build                              | Aprovado; Vite 8.3.4, 2.136 módulos transformados                                           |
| Aviso do build                     | Chunk FileViewer de aproximadamente 620,91 kB; não bloqueou compilação                      |
| Testes                             | 500: 495 aprovados e cinco falhas preexistentes                                             |
| Navegador, dispositivos e produção | Não homologados nesta etapa documental                                                      |

A verificação documental confirmou 99 links relativos válidos, nenhum link relativo quebrado e preservação do corpo dos 38 registros históricos, exceto as correções identificadas de links. A comparação SHA-256 confirmou 437 arquivos rastreados de código, testes, SQL, assets e configuração idênticos à base. docs/backend/posts.sql também permaneceu inalterado. As mudanças abrangem somente README e 42 documentos Markdown, incluindo o mestre antes não rastreado.

As cinco falhas são: duas por FaJava ausente no harness, duas pelo contrato antigo food em Snake e uma pela chave “Carga horária”. Não foram corrigidas aqui, pois pertencem às etapas funcionais. O build atualizou apenas a saída gerada dist/, ignorada pelo Git. Não houve instalação de dependências, modificação de segredos ou execução de serviço remoto.

<!-- === 19. PENDÊNCIAS ÚNICAS E RESPONSÁVEIS === -->

## 19. Pendências únicas e responsáveis

Cada pendência possui responsável primário. Etapas posteriores apenas validam sua integração; não repetem a auditoria completa.

| ID  | Pendência / evidência                                                                     | Etapa responsável   | Critério de encerramento                                                                                 |
| --- | ----------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| P01 | Limite Snake 397 no contrato, API e banco real; migração confirmada na auditoria de 30/10 | R02                 | Falta homologar limites e permissões com identidades e operação reais; não reaplicar a migração          |
| P02 | Currículo confirma file-viewer e Mobile seleciona o destino efetivo                       | 03                  | Encerrado no Core; regressões e PDF real no navegador Desktop/Mobile aprovados; conteúdo permanece na 06 |
| P03 | Preparação assíncrona consumida pelo Core                                                 | 03                  | Contrato geral preservado; homologação de motor DOOM superada pela remoção                               |
| P04 | Metadados reais: dez tabelas com RLS, bucket privado e view legada isolada em 30/10       | R02                 | Executar homologação com identidades, roteiros SQL e D1; metadados não são aceite integral               |
| P05 | Contratos locais de personalização corrigidos na Etapa 04; seção 24                       | 04 / 11             | Implementação local verificada; resta walkthrough integral de Configurações na 11                        |
| P06 | Falhas antigas dos testes Snake                                                           | R08                 | Não reproduzidas na auditoria de 28/10 nem na suíte atual; não tratar como defeito aberto                |
| P07 | Antiga ausência de tradução Carga horária                                                 | R05                 | Não reproduzida na suíte atual; aceite de conteúdo em inglês permanece próprio                           |
| P08 | Integridade/NOTICE de UZDoom                                                              | —                   | Superada pela remoção; não bloqueia a versão atual                                                       |
| P09 | Alcance de ações do Wally/busca delimitado pelo proprietário na R09                       | R09                 | Tema por botão local implementado; arquivos somente no app Arquivos; sem ampliação administrativa        |
| P10 | Risco de rolagem global Mobile e ausência de aceite físico atual                          | 10                  | Reproduzir antes de alterar; navegação, altura dinâmica, orientação e teclado aprovados                  |
| P11 | Licenças e rastreabilidade UZDoom/SoundFont                                               | —                   | Superada pela remoção; licenças dos recursos atuais permanecem em R14                                    |
| P12 | Proprietário informou em 30/10 que não sabe confirmar rotação/revogação                   | R02                 | Proprietário/operador comprovar correção sem divulgar segredos; logout isolado não comprova revogação    |
| P13 | Backup, restauração, rollback e limites operacionais                                      | 12                  | Procedimentos ensaiados em ambiente autorizado e compatibilidade de schema registrada                    |
| P14 | Chunk do Visualizador acima de 500 kB                                                     | 05                  | Medir impacto e registrar solução ou justificativa; não elevar limite para esconder o aviso              |
| P15 | Conteúdo, acessibilidade, visual, CI e integrações externas                               | Por aplicativo e 12 | Evidências efetivas e aceite do proprietário, sem falsa certificação                                     |

<!-- ----- ACESSOS E MATERIAIS A PREPARAR ----- -->

### Acessos e materiais a preparar

- Ambiente Supabase de homologação, identidades de teste e histórico de migrações; não enviar senhas no chat.
- Cloudflare Worker/D1 isolados, origem permitida do Turnstile e autorização para testes remotos.
- Configuração de notificação e WakaTime quando necessários; Wally remoto continua desativado.
- Documentos, conteúdo bilíngue, links e imagens aprovados por aplicativo; verificar o que já existe antes de pedir novamente.
- Origem/licenças dos binários e recursos dos jogos.
- Celular/tablet, leitor de tela e ambiente de preview para aceite visual futuro.

<!-- === 20. INVENTÁRIO E DESTINO DA DOCUMENTAÇÃO === -->

## 20. Inventário e destino da documentação

<!-- ----- POLÍTICA DE PRESERVAÇÃO ----- -->

### Política de preservação

Nenhum documento, SQL, licença ou artefato foi excluído ou movido nesta etapa. O mestre centraliza decisões e acompanhamento. Guias operacionais continuam complementares; checkpoints são registros históricos e não iniciam etapas automaticamente.

“Histórico” não significa perda de valor ou autorização para apagar. A remoção física exige decisão posterior e conferência da informação ainda necessária. O histórico Git não preserva arquivos nunca commitados.

<!-- ----- MAPA POR ARQUIVO ----- -->

### Mapa por arquivo

| Arquivo em docs/                               | Papel após a Etapa 01                            | Destino                                                                                 |
| ---------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| PLANO-FINALIZACAO-POR-ETAPAS.md                | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| REMOCAO-DEMONSTRACOES.md                       | Registro da remoção e permissões da migração 014 | Preservar evidência e dependência de homologação                                        |
| WS-OS-V2-MESTRE.md                             | Mestre vigente e registro único                  | Manter como entrada principal                                                           |
| architecture.md                                | Consulta técnica operacional                     | Manter e atualizar na etapa responsável                                                 |
| backend/CONFIGURACAO.md                        | Consulta técnica operacional                     | Manter e atualizar na etapa responsável                                                 |
| backend/WORKER.md                              | Consulta técnica operacional                     | Manter e atualizar na etapa responsável                                                 |
| backend/posts.sql                              | SQL histórico, não uma migração nova             | Preservar; não executar/reaplicar automaticamente                                       |
| contracts.md                                   | Contratos datados e compatibilidade              | Consultar com o código e mestre; descrições antigas não representam implementação atual |
| finalizacao/AUDITORIA-FINAL.md                 | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-00-ESCOPO-E-DECISOES.md      | Decisões detalhadas anteriores                   | Preservar rastreabilidade; decisões posteriores prevalecem                              |
| finalizacao/ETAPA-01-DECISOES-TECNICAS.md      | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-01-PARTE-01.1-CONCLUSAO.md   | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-01-PARTE-01.2-CONCLUSAO.md   | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-01-PARTE-01.3-CONCLUSAO.md   | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-01-PARTE-01.4-CONCLUSAO.md   | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-01-PARTE-01.5-CONCLUSAO.md   | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-01-PARTE-01.6-CONCLUSAO.md   | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-02-DECISOES-TECNICAS.md      | Decisões detalhadas anteriores                   | Preservar rastreabilidade; decisões posteriores prevalecem                              |
| finalizacao/ETAPA-05-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-06-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-07-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-08-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-09-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-10-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-11-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-12-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-13-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-14-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPA-15-ANDAMENTO.md              | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| finalizacao/ETAPAS-03-04-ENTREGA.md            | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/ARQUIVOS-A5-FINALIZACAO.md           | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/CONTINUIDADE.md                      | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/ENTREGA-E-CONTINUIDADE-2026-10-15.md | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/FINALIZACAO-V2.md                    | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/MISSAO-CONCLUSAO.md                  | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/PENDENCIAS-FINALIZACAO.md            | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/PROGRESSO-CONCLUSAO.md               | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/file-inventory.md                    | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/implementation-status.md             | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/roadmap.md                           | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| historico/validation.md                        | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |
| planning/WS-OS-V2-MESTRE-v0.16.0.md            | Decisões detalhadas anteriores                   | Preservar rastreabilidade; decisões posteriores prevalecem                              |
| settings.md                                    | Planejamento ou checkpoint histórico             | Preservar; roteiro vigente incorporado ao mestre                                        |

<!-- ----- INFORMAÇÃO INCORPORADA E MATERIAL QUE PERMANECE NECESSÁRIO ----- -->

### Informação incorporada e material que permanece necessário

Foram incorporados: arquitetura, catálogo de 17 apps, revisão do provedor de arquivos, limites, ações, segurança, personalização, critérios de revisão e pendências externas. A antiga numeração de etapas e resultados acumulados não orientam o cronograma atual.

Permanecem como consulta: assinaturas detalhadas dos contratos, decisões numeradas originais, configurações do backend, rotas, procedimentos de reconciliação e evidências datadas. SQL canônico de evolução está em database/migrations/ e database/d1/migrations/; docs/backend/posts.sql não substitui essa cadeia.

Não há lista de exclusão automática. Guias técnicos e históricos foram identificados para permitir futura limpeza consciente, sem comprometer o produto.

<!-- === 21. OPERAÇÃO E VERIFICAÇÕES DE CONTINUIDADE === -->

## 21. Operação e verificações de continuidade

<!-- ----- COMANDOS E LIMITES DO AMBIENTE ----- -->

### Comandos e limites do ambiente

A instalação existente foi reutilizada. Em uma máquina nova, instalar pelo lockfile somente com autorização. Os scripts atuais são dev, build, lint, preview e test. Não existem scripts dedicados de navegador, DOOM ou validação de assets no manifesto atual.

npm run dev e npm run preview servem somente o frontend. O backend vigente é worker/index.js, com handlers em functions/api/ e assets em dist/. Build Vite e testes Node não equivalem a homologar workerd/Cloudflare.

wrangler.jsonc já contém binding D1 e flags REQUESTS_ENABLED, MANAGED_FILES_ENABLED, RANKINGS_ENABLED e REQUEST_RETENTION_ENABLED como true; WALLY_AI_ENABLED permanece false. Flags no arquivo não comprovam configuração aplicada ou homologação. Não usar o binding remoto para experimentar, não divulgar credenciais e não executar publicação nesta etapa.

<!-- ----- BANCO, ARQUIVOS E RECUPERAÇÃO ----- -->

### Banco, arquivos e recuperação

- Manter migrações 011–013 como histórico, mesmo após remoção das demos. A migração 014 preserva IDs de destaques e limita leitura pública às colunas permitidas; verificar sua aplicação após a 013.
- Mutação com revisão antiga deve conflitar e preservar o rascunho. Escrita com resposta perdida exige reconciliação; não repetir automaticamente.
- Arquivos em uploading/deleting e e-mails em sending/unknown não são sucesso nem autorização para exclusão/reenvio em massa.
- Excluir um vínculo não equivale a excluir o objeto. Verificar estado, revisão e referências antes de qualquer operação irreversível.
- Retenção e limpeza exigem opt-in e ensaio autorizado. Rollback de código não reverte migração nem recupera dados apagados.
- Não criar rotina artificial para impedir pausa do provedor sem decisão própria.

<!-- ----- CONTINUIDADE IMEDIATA ----- -->

### Continuidade imediata

Seguir o checklist único da seção 15 na ordem R01–R14, conforme a instrução mais recente. R01, R02, R03, R04, R05, R06, R07, R08, R09 e R10 foram consideradas finalizadas pelo proprietário em 30/10/2026; revisão corrente R14; avanço autorizado com a homologação real da R11 não executada. Não avançar revisões com critérios obrigatórios pendentes. Preservar entregas existentes e limitar limpeza e formatação à área revisada.

<!-- === 22. ETAPA 02 — BACKEND, SEGURANÇA E DADOS === -->

## 22. Etapa 02 — Backend, segurança e dados

> Registro histórico de 26/10. Autorizações e próximos passos desta seção e das seções 23–24 não são vigentes; seguir a seção 15. Menções ao motor DOOM preservam evidência histórica e não integram o escopo atual.

<!-- ----- ESCOPO E AUTORIZAÇÃO ----- -->

### Escopo e autorização

Executada na main sobre o commit 0bf511d, por autorização para seguir o mesmo modelo da etapa anterior: edição direta, validação e um único commit final, sem push. Nenhuma migração, escrita de dados, configuração de provedor, publicação ou rotação de credencial foi executada remotamente.

A implementação local foi validada. O aceite integral permanece bloqueado pelas homologações abaixo; não considerar segurança de produção ou conclusão do backend certificadas.

<!-- ----- CORREÇÕES IMPLEMENTADAS ----- -->

### Correções implementadas

| Área             | Correção                                                                              | Preservação                                                                   |
| ---------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Ranking Snake    | Limite 397 no contrato compartilhado, importado pela API e interface                  | Flappy mantém 100000; nenhuma pontuação antiga apagada                        |
| Erros de ranking | Corpo excessivo retorna HTTP 413                                                      | Não enviar ao banco ou verificador um payload já rejeitado                    |
| Destaques        | Leitura limitada compartilhada, MIME JSON, cleanup e confirmação da seleção devolvida | Somente IDs, autorização administrativa e dados históricos preservados        |
| Logs             | Removido corpo bruto de erros do Supabase em destaques                                | Registro mantém apenas status e identificação técnica do recurso              |
| Conteúdo público | Projeção pelos campos permitidos de eventos/arquivos                                  | Campos internos não são copiados e dados privados/inválidos não são entregues |
| Storage          | Downloads e reconciliação interrompem a leitura acima do tamanho esperado             | SHA-256, revisão, acesso mediado e ausência de sobrescrita preservados        |
| Banco            | Migração incremental amplia a constraint Snake e isola a view legada das demos        | Não reescreve 001–014, não remove tabelas, views ou registros                 |

O MIME JSON aceita parâmetros como charset, mas rejeita tipos que só compartilham o prefixo application/json. Resposta de gravação com outra seleção não produz confirmação falsa. Ordenação editorial manual e demos continuam fora do escopo.

<!-- ----- REVISÃO DOS CONTRATOS EXISTENTES ----- -->

### Revisão dos contratos existentes

Auth mantém verificação do usuário no provedor e consulta de autorização administrativa; não usa user_metadata como papel administrativo. Sessão cliente permanece em memória. As verificações locais de visitante, usuário sem papel, falha de autorização e indisponibilidade continuam aprovadas. Não foi realizado login real ou revogação de sessão nesta etapa.

Solicitações preservam validação/consentimento, Turnstile, limite D1, reserva idempotente, revisões e separação entre persistência e e-mail. Notas/anexos mantêm acesso conforme publicação, limite de vínculos e revisão. Storage mantém upload sem sobrescrita, verificação de conteúdo, reconciliação e exclusão confirmada. Curtidas preservam unicidade, leitura de agregados e bloqueio de acesso direto aos hashes. Manutenção continua condicionada às flags e ao ambiente autorizado.

Esses fluxos foram examinados no código e cobertos pelos testes locais existentes; isso não equivale à homologação real de todas as operações.

<!-- ----- INSPEÇÃO REMOTA SOMENTE DE LEITURA ----- -->

### Inspeção remota somente de leitura

Projeto identificado pelo conector Supabase: ws-os-dev. Foram consultados inventário de migrações, advisors e catálogos de estrutura/permissões. Não foram lidos documentos, solicitações, contas privadas, credenciais ou conteúdo de visitantes.

- Histórico registra as migrações equivalentes a 005–014, incluindo índice de anexos e permissões de IDs de destaques. As estruturas anteriores não possuem histórico equivalente confirmado; não reaplicar automaticamente.
- RLS habilitada nas dez tabelas públicas da aplicação.
- Políticas administrativas conferidas nos metadados usam vínculo em admin_users, não apenas o papel authenticated.
- Visitante possui SELECT de id/repository_ids em project_highlights, sem SELECT de demos na tabela.
- Hash do ranking não possui leitura pública; RPCs de submissão, anexos, arquivos e retenção permanecem restritos ao serviço.
- Bucket ws-os-official-files privado, limite 10485760 bytes e formatos PDF/TXT/PNG/JPEG/WebP.
- Banco ainda limita Snake a 222. A migração nova não está aplicada.
- A view project_highlights_public ainda permite leitura anon e usa privilégios do proprietário. A migração nova revoga esse acesso e define security_invoker, preservando o objeto.

O advisor registra também: post_likes com RLS sem política, RPC agregado de contagem executável por papéis públicos e proteção contra senhas vazadas desativada. O primeiro é intencional: anon/authenticated não possuem SELECT/INSERT na tabela. O RPC retorna somente contagem de publicação pública passada e é utilizado pelo fluxo existente; não foi revogado para silenciar o alerta. A configuração de senhas deve ser avaliada pelo proprietário conforme o ambiente e recursos disponíveis.

Metadados não substituem ensaio com identidades reais ou comprovam rotação de segredos. O proprietário informou que ainda não confirmou a correção das credenciais/sessões historicamente comprometidas; P12 permanece aberto.

<!-- ----- MIGRAÇÃO E ORDEM DE HOMOLOGAÇÃO ----- -->

### Migração e ordem de homologação

Arquivo preparado: database/migrations/20261026141305_etapa02_rankings_e_permissoes_legadas.sql. Foi gerado pela CLI Supabase já disponível no cache offline e incorporado ao diretório de migrações existente. Nenhuma dependência do projeto foi instalada e nenhuma configuração Supabase de projeto local foi criada no repositório.

Roteiro preparado: database/tests/etapa02_rankings_permissions.sql. Testa limites 397/398 e 100000/100001, preservação do melhor resultado e permissões mínimas; termina com ROLLBACK. Não foi executado no PostgreSQL nesta entrega e não deve ser descrito como teste SQL aprovado.

Antes de publicar este código:

1. Confirmar ambiente isolado, backup e histórico 001–014; não executar db push indiscriminadamente sobre o esquema existente.
2. Obter autorização explícita e aplicar a migração incremental em homologação.
3. Executar o novo roteiro transacional e o roteiro existente de RLS com identidades autorizadas, sem usar dados pessoais reais como fixtures.
4. Homologar Worker/Turnstile/D1, escrita e moderação de pontuação acima de 222, anexos, upload/exclusão e solicitações.
5. Confirmar que a view legada deixou de ser pública e revisar os advisors novamente.
6. Confirmar rotação/revogação com o proprietário e só então tratar publicação como candidata ao aceite.

Rollback de código não autoriza reduzir o limite do banco ou apagar pontuações. Após existirem resultados acima de 222, uma versão antiga que só aceita 222 não é candidata segura de rollback do ranking. Preservar uma versão compatível e o histórico dos dados.

<!-- ----- VALIDAÇÃO EFETIVA ----- -->

### Validação efetiva

| Verificação                                               | Resultado                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| Testes diretamente relacionados                           | Aprovados                                                          |
| Interface de ranking, filtro de testes por nome           | 3 aprovados                                                        |
| Novas regressões de backend                               | 10 aprovadas na suíte                                              |
| Lint                                                      | Aprovado                                                           |
| Build                                                     | Aprovado; aviso FileViewer de aproximadamente 620,92 kB preservado |
| Suíte completa                                            | 510 testes, 505 aprovados e as mesmas cinco falhas anteriores      |
| SQL incremental e roteiros PostgreSQL                     | Preparados; não aplicados/executados                               |
| Homologação com identidades reais, D1 remoto e publicação | Não realizada                                                      |

Revisão final: formatação dos 16 arquivos aplicáveis aprovada, 100 links relativos válidos e git diff --check sem erros. O conjunto possui 18 arquivos; migrações antigas, dependências, configuração de runtime e assets permanecem inalterados. A conferência estática do SQL não é execução nem homologação PostgreSQL.

As falhas restantes continuam sendo quatro testes Snake antigos e a tradução “Carga horária”, atribuídas às etapas 08 e 06. Nenhum teste foi desativado, removido ou relaxado para escondê-las.

<!-- ----- ARQUIVOS E CONTINUIDADE ----- -->

### Arquivos e continuidade

Alterados: functions/_lib/publicWriteProtection.js; functions/api/rankings.js, projectHighlights.js, managedContent.js e managedFiles.js; src/services/publicContentContract.js; src/apps/games/GameRankings.jsx; testes relacionados; README, configuração do backend e este mestre. Criados: uma migração incremental, um roteiro SQL transacional e tests/core/backend-stage02.test.cjs.

Comentários dos arquivos modificados seguem seções/subseções em PT-BR. Não foram alterados a configuração de produção, as flags, dependências, assets, demais aplicativos ou migrações antigas. doom-source/ permanece preservado e fora do commit.

A autorização posterior permitiu executar a Etapa 03, registrada abaixo. A próxima intervenção específica na Etapa 02 é homologar seus itens externos mediante autorização, sem repetir as correções locais já verificadas.

Referências de segurança consultadas: [RLS e privilégios](https://supabase.com/docs/guides/database/postgres/row-level-security), [avisos de views com privilégios do proprietário](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view) e [segurança de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

<!-- === 23. ETAPA 03 — CORE, PERSISTÊNCIA E CICLO DE VIDA === -->

## 23. Etapa 03 — Core, persistência e ciclo de vida

<!-- ----- ESCOPO E ESTADO ----- -->

### Escopo e estado

Executada na main sobre 0b49058, por autorização para seguir o mesmo modelo: edição direta e um único commit final, sem push. Estado inicial: nenhum arquivo rastreado modificado ou preparado; doom-source/ não rastreado, preservado.

Entrega técnica local concluída, aguardando aceite. Não foram alterados backend, migrações, configuração de produção, dependências ou assets. Permanecem os bloqueios externos da Etapa 02. A Etapa 04 não foi iniciada.

<!-- ----- NAVEGAÇÃO E CONFIRMAÇÃO APLICADA ----- -->

### Navegação e confirmação aplicada

- requestAppOpen informa appId efetivo nos resultados de sucesso, preservando instanceId e os estados opened/restored/navigated.
- Currículo continua um atalho para o documento estático no Visualizador; não cria outro aplicativo ou catálogo.
- SystemProvider confirma a instância realmente aplicada e entrega onOpened com instanceId, appId efetivo, requestedAppId e status.
- Solicitações de abertura no mesmo lote mantêm callbacks próprios. Resultados consumidos são descartados na próxima abertura, sem um setState adicional apenas para limpar a fila em efeito.
- Abertura cancelada, contexto perdido ou acesso revogado não recebe confirmação falsa de sucesso.
- Mobile utiliza o destino confirmado e foca sua navegação. O PDF real abriu no shell de 390 × 844 emulado; não permaneceu na Home.

<!-- ----- SAÍDA PROTEGIDA E PREPARAÇÃO ASSÍNCRONA ----- -->

### Saída protegida e preparação assíncrona

registerCloseGuard preserva o guard síncrono de descarte e passa a consumir a opção beforeClose para preparação assíncrona. Uma preparação precisa retornar true para permitir a ação. false, rejeição, registro substituído ou desmontagem mantêm a operação sem execução tardia.

Durante o salvamento há exclusividade de saída, fundo inert e status localizado. Fechamento repetido não dispara salvamentos duplicados. As proteções aceitas são liberadas antes da animação para uma nova troca de shell não tentar salvar uma instância que já está encerrando.

Troca de shell prepara todas as instâncias antes de desmontar qualquer uma; cancelar um rascunho interrompe a transição inteira. Um guard novo ou substituído exige nova solicitação. A mídia atual ainda é revalidada pelo App antes de aplicar o shell.

O hook do DOOM mantém validação de origem, frame, tipo e requestId, uma solicitação de sincronização por vez e timeout de dez segundos. Falha ou ausência do frame deixa o jogo aberto e apresenta o erro existente. Desmontagem limpa listener, timeout e promise pendente. Fechar abruptamente o navegador continua sem garantia de conclusão assíncrona.

Os testes do hook utilizam o código real com transporte controlado. Não houve partida DOOM nem homologação dos bytes gravados pelo motor/IndexedDB nesta etapa; isso permanece na Etapa 08.

<!-- ----- ANIMAÇÕES, FOCO E LIMPEZA ----- -->

### Animações, foco e limpeza

O reducer closeApp permanece imediato e compatível. O Provider coordena antes a proteção e, quando pertinente, beginAppClose: a instância fica marcada closing, sem interação e pausada, até o encerramento visual. Só então é removida e onClosed é chamado após o estado aplicado.

Abertura, minimização, restauração, mudança de modo e fechamento usam opacidade/transformação. Não foram adicionadas transições de largura, altura, top ou left, preservando a estratégia de geometria e desempenho.

Duração compartilhada: 180 ms normal, 90 ms sutil e zero com movimento desligado/reduzido ou efeitos mínimos. Minimizar preserva montagem; restaurar reutiliza a instância. Fechamentos Mobile e de janelas já minimizadas não recebem espera visual artificial. Relógios, callbacks, captura de ponteiro e frames pendentes são liberados ao desmontar ou encerrar interação.

Instâncias closing não podem ser ativadas, restauradas, minimizadas novamente ou reutilizadas como destino. O foco passa para outra janela disponível ou para o shell. Abertura/restauração foca a moldura; mera ativação não captura o foco de campos. Cancelar o diálogo devolve foco ao acionador registrado, sem focar áreas inert.

Terminal informa “Fechamento solicitado.” em vez de prometer remoção imediata; as traduções PT-BR/EN foram incluídas. Não há comando novo de Terminal, reinício ou desligamento.

<!-- ----- PERSISTÊNCIA E ISOLAMENTO PRESERVADOS ----- -->

### Persistência e isolamento preservados

Foram revistos os contratos de preferências/reset, escrita com recuperação, navegação contextual, AppHost e isolamento por ErrorBoundary. Os testes existentes de falha parcial, allowlist de reset, sincronização entre abas e recuperação continuam aprovados.

Não houve alteração das chaves ou apagamento de arquivos pessoais, wallpapers, recordes ou posições. A revisão completa de IndexedDB/documentos pertence à Etapa 05; personalização avançada permanece na 04. Janelas e novos marcadores de animação são estado volátil, sem restauração automática após reload.

<!-- ----- VALIDAÇÃO EFETIVA ----- -->

### Validação efetiva

| Verificação                                            | Resultado                                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Regressões adicionadas                                 | 18 aprovadas: 17 em lifecycle.test.cjs e uma integração Mobile                                                   |
| Primeira bateria direcionada                           | 59 testes aprovados; a regressão adicional de foco foi incluída na suíte final                                   |
| Lint                                                   | Aprovado, sem desativar regras                                                                                   |
| Build                                                  | Aprovado; 2.138 módulos, aviso FileViewer de aproximadamente 620,92 kB preservado                                |
| Suíte completa                                         | 528 testes: 523 aprovados e as mesmas cinco falhas anteriores                                                    |
| Browser Desktop                                        | Currículo/PDF, minimizar/restaurar mesma instância, maximizar/restaurar e fechar com retorno de foco             |
| Bundle compilado e Mobile emulado                      | Currículo abre em app; foco em Voltar; rascunho preservado ao cancelar troca e descartado somente após confirmar |
| Erros da aplicação no percurso compilado observado     | Nenhum coletado no intervalo consultado                                                                          |
| Dispositivos físicos, leitor de tela e motor DOOM real | Não homologados nesta etapa                                                                                      |

Conferência final: 22 arquivos da etapa formatados, 100 links relativos válidos e git diff --check aprovado. A comparação do Terminal com a base confirmou somente a mensagem de fechamento, o comentário explicativo e a padronização de formatação, sem modificar os demais comandos.

As cinco falhas continuam sendo quatro testes Snake desatualizados e a tradução “Carga horária”, atribuídos às etapas 08 e 06. Não foram removidas verificações para apresentar aprovação da suíte inteira.

A prévia foi isolada em 127.0.0.1:5353. O formulário recebeu somente um rascunho de teste local; nenhum envio de contato ou desafio foi submetido. Dev/preview não executam o Worker; indisponibilidade de eventos e avisos Turnstile locais não foram considerados homologação de backend. A viewport temporária foi restaurada e a aba/serviços de prévia foram encerrados.

<!-- ----- ARQUIVOS E CONTINUIDADE ----- -->

### Arquivos e continuidade

- Core: appCloseGuards.js, appManager.js, SystemProvider.jsx, navigationManager.js e novo windowLifecycle.js.
- Janelas: Window.jsx, Window.css, WindowLayer.jsx, useWindowInteraction.js e novo useWindowMotion.js.
- Consumidores: useDoomSession.js, Mobile.jsx, AppCloseDialog.jsx e mensagem de fechamento do Terminal.jsx.
- Traduções: uma chave acrescentada em cada catálogo PT-BR/EN.
- Testes: novo tests/core/lifecycle.test.cjs, integração em mobile-shell-ui.test.cjs e suporte de argumentos/ambiente no helper app-ui.cjs.
- Documentação: mestre, README e arquitetura atualizados; nenhum documento histórico excluído ou reescrito.

Reabrir estes contratos somente por defeito/regressão ou mudança autorizada. A Etapa 08 valida persistência real do DOOM sem reconstruir o Core; a Etapa 10 valida composição/fluidez nos shells e hardware real. Próxima implementação: Etapa 04, mediante autorização.

<!-- === 24. ETAPA 04 — DESIGN SYSTEM E PERSONALIZAÇÃO === -->

## 24. Etapa 04 — Design System e personalização

<!-- ----- ESCOPO E ESTADO ----- -->

### Escopo e estado

Execução local autorizada pelo proprietário no mesmo modelo das etapas anteriores: main, um commit ao final e sem push. Base ac808a5, em 26/10/2026. A pasta não rastreada doom-source/ permaneceu preservada e fora do commit. Nenhuma alteração remota, dependência instalada ou recurso da Etapa 05 iniciado.

Entrega técnica local concluída, aguardando aceite. A suíte geral continua com cinco falhas preexistentes, detalhadas abaixo. Não declarar o projeto inteiro homologado ou 100% concluído.

<!-- ----- PROBLEMAS CORRIGIDOS ----- -->

### Problemas corrigidos

- A carga e a seleção de wallpapers emparelhavam Dark/Light: agora cada uma das quatro combinações plataforma/tema é independente, sem regravar nem apagar preferências antigas.
- Enquadramento fixo: Preencher, Ajustar e Centralizar possuem persistência própria por contexto e prévia em Configurações. A restauração de preferências também restaura os quatro enquadramentos.
- Destaque global: automático/manual independente por tema. Manual é compartilhado entre shells, conservado ao trocar wallpaper e recuperado ao retornar ao modo manual. O valor legado é migrado para manual nos dois temas sem escrita durante a leitura.
- Automático usa o wallpaper do shell efetivamente aprovado pelo Core. Alterar somente a galeria de outra plataforma não muda a cor da plataforma ativa; cancelar troca de shell também não muda esse contexto.
- Wallpapers oficiais escolhem as paletas existentes. Imagens pessoais usam amostragem local de 32 × 32 pixels; transparência e tons neutros são descartados, com seleção determinística da família azul/verde/violeta mais próxima. Nenhuma cor arbitrária é aplicada aos tokens; contraste e fallback azul prevalecem. Não há upload para análise nem dependência externa. Extrações atrasadas não sobrepõem contexto novo nem escolha manual; cache limitado a 32 entradas.
- Ocultar wallpaper é uma opção explícita, persistente e independente de efeitos. Modo de baixo custo mantém a imagem estática e reduz desfoque. Movimento reduzido do sistema também interrompe animações contínuas, preservando o contrato de fechamento da Etapa 03.
- Coleção pessoal permanece múltipla e local. Uma imagem inválida não impede a recuperação das demais; seleção indisponível fica preservada com fallback e aviso. Migração legada continua utilizável pela cópia original mesmo se a cópia para a coleção falhar.
- Exclusão verifica uso nas quatro seleções e preferências persistidas entre abas, revalidando após leitura assíncrona. Cópia legada continua protegida. Não há limpeza automática de dados.
- O catálogo referenciava três SVGs ausentes: ocupado Dark/Light e ajuda Light foram completados no estilo existente. As 13 variantes têm recursos nos dois temas, hotspots e fallback nativo. Configurações permite cursor personalizado/nativo; as oito alças de resize consomem as variantes direcionais. Personalização de cursor continua restrita a mouse com apontador preciso.
- Favicon continua usando exclusivamente as seis logos oficiais conforme tema e destaque resolvido. Boot permanece com processador; boas-vindas preserva as duas etapas.

<!-- ----- PERSISTÊNCIA E LIMITES ----- -->

### Persistência e limites

- Imagem: PNG/JPEG/WebP, assinatura conferida, até 5 MiB, 32 megapixels e 8192 pixels por lado, com decodificação local.
- Coleção: limite operacional de 100 MiB para os registros pessoais do IndexedDB; verificação e gravação na mesma transação readwrite, serializada entre abas. Limite comporta até 20 arquivos de tamanho máximo; imagens menores podem ser mais numerosas. Não é garantia de espaço disponível no navegador.
- Arquivos existentes acima do limite não são removidos. Nova inclusão que excederia o limite é rejeitada; dados anteriores permanecem. A chave original legada é preservada e não entra no total dos registros pessoais.
- Falhas de quota ou armazenamento não recebem falso sucesso. Preferências simples continuam aplicadas na sessão quando a gravação falha; a interface informa essa condição. O limite agregado é adicional à quota do navegador, que pode ser menor ou sujeita a eviction.
- Novos campos da aparência são normalizados; a escolha manual anterior não se transforma silenciosamente em automática. Seleção e enquadramento não são vinculados ao conteúdo dos arquivos pessoais.

<!-- ----- ARQUIVOS E RESPONSABILIDADES ----- -->

### Arquivos e responsabilidades

| Área          | Arquivos                                                                                              | Alteração                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Aparência     | src/core/appearanceContract.js; src/core/appearanceManager.js; src/App.jsx                            | Normalização, migração, extração limitada, preferências e contexto real |
| Wallpapers    | src/core/wallpaperManager.js; src/core/personalWallpaperCollection.js; src/core/preferencesManager.js | Seleções independentes, fit, recuperação, exclusão e reset              |
| Armazenamento | src/services/storage/wallpaperStorage.js                                                              | Quota agregada transacional e propagação correta de falhas              |
| Interface     | src/apps/settings/SettingsSections.jsx                                                                | Controles e prévia dentro da apresentação existente, rótulos acessíveis |
| Estilos       | src/styles/themes/effects.css; src/styles/themes/cursors.css                                          | Movimento reduzido, visibilidade explícita e cursores nos consumidores  |
| Cursores      | public/assets/cursors/dark-cursor-wait.svg; light-cursor-wait.svg; light-cursor-help.svg              | Recursos faltantes                                                      |
| Idiomas       | src/shared/i18n/locales/en.json; pt-BR.json                                                           | Novos textos com paridade de chaves                                     |
| Regressões    | tests/core/appearance.test.cjs; settings.test.cjs; settings-ui.test.cjs; windows-interaction.test.cjs | Comportamentos reais, recursos, armazenamento e contexto                |
| Documentação  | README.md; docs/architecture.md; docs/WS-OS-V2-MESTRE.md                                              | Estado, contratos e evidências                                          |

A cascata existente foi preservada: tokens estruturais → temas → personalização → efeitos → estrutura → fundamentos/superfícies → controles → cursores → responsividade. Os tokens de cor vêm das paletas; preferências de efeitos alteram seus próprios tokens e regras de acessibilidade possuem precedência explícita. Estilos de cursor usam contexto custom e especificidade superior às alças do componente, mantendo o modo nativo e o toque. Não houve redesenho geral ou reorganização indiscriminada de CSS.

<!-- ----- VERIFICAÇÕES EFETIVAS ----- -->

### Verificações efetivas

| Verificação                   | Resultado                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Testes pertinentes            | 53/53 aprovados: aparência, Settings, branding e integração de janelas                                                              |
| npm run lint                  | Aprovado                                                                                                                            |
| npm run build                 | Aprovado; permanece aviso conhecido de chunk do Visualizador acima de 500 kB                                                        |
| npm run test                  | 544 testes: 539 aprovados e cinco falhas preexistentes; nenhuma regressão adicional                                                 |
| Prévia compilada no navegador | Desktop e Mobile 390 × 844, temas, enquadramento, destaque automático/manual, persistência, imagem local, favicon, efeitos e cursor |

As cinco falhas gerais continuam sendo duas de Snake/UI por FaJava ausente no harness, duas de fixtures antigas de Snake e a tradução Carga horária em Certificados. Permanecem nas Etapas 08 e 06; não foram alteradas fora do escopo para mascarar aprovação.

Navegador: seleção Dark Green mudou o destaque e favicon para verde; escolha manual violeta permaneceu ao alternar temas. Light preservou wallpaper próprio. Reload recuperou cor e enquadramento. Uma cópia do wallpaper oficial dark-green.jpg foi adicionada como imagem pessoal somente na origem local de teste; imagem foi recuperada após reload, permaneceu protegida enquanto em uso e produziu paleta verde no automático. Mobile usou Dark Violet com Centralizar sem alterar o Desktop; ao mudar o shell, o automático passou a violeta. Modo de baixo custo manteve wallpaper com desfoque zero. Ocultar tornou a camada invisível sem apagar sua seleção; reexibir recuperou a mesma imagem. Cursor nativo mostrou ns-resize e personalizado mostrou SVG oficial com fallback na alça. Sem erros de console na consulta final. Viewport restaurado e aba/servidor temporários encerrados.

O teste de quota usa IndexedDB controlado: valida recusa sem gravação, conservação de arquivo anterior e liberação da conexão. Não foi realizada carga real de 100 MiB nem medição em hardware físico. A validação numérica usa as cores efetivas do CSS para contraste de destaque secundário, links e ações nas superfícies testadas, mínimo 4,5:1; não equivale a auditoria completa de todas as telas sobre toda imagem/transparência.

<!-- ----- PENDÊNCIAS E PRÓXIMO PASSO ----- -->

### Pendências e próximo passo

P05 recebeu a correção funcional desta etapa. Walkthrough integral de Configurações permanece na Etapa 11; composição, desempenho e dispositivos físicos na Etapa 10. Os bloqueios externos de segurança/homologação da Etapa 02 continuam registrados, inclusive rotação/revogação não confirmadas e migração ainda não aplicada.

Próxima implementação: Etapa 05 — Arquivos, Editor e Visualizador, somente mediante autorização. Não reconstruir os gerenciadores de personalização encerrados aqui sem defeito demonstrado ou alteração de requisito.

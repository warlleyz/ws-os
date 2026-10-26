<!-- === WS OS V2 — DOCUMENTO MESTRE DE REVISÃO E CONCLUSÃO === -->

# WS OS V2 — Documento mestre de revisão e conclusão

- **Versão:** 1.1
- **Data:** 26/10/2026
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

Este documento consolida a direção de conclusão. A autorização vigente permite executar diretamente a Etapa 01 na main e realizar um único commit ao final, sem push. Não autoriza avançar para outras etapas, mudar de branch, publicar ou alterar infraestrutura.

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

- O sistema de demonstrações de projetos foi removido.
- Supabase Storage privado substituiu Cloudflare R2 para arquivos oficiais.
- A antiga restrição de adiar traduções não orienta esta revisão final: traduções devem ser encerradas na própria área revisada.
- Referências históricas a 18 aplicativos, Administração inexistente ou Mobile reservado não descrevem a base atual.
- Recomendações antigas de commits não concedem permissão permanente. Nesta execução, há autorização expressa para um único commit ao final da Etapa 01.
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

Currículo pode funcionar como atalho para o Visualizador, preservando confirmação de abertura e navegação.

Administração é restrita. A visibilidade no catálogo não substitui autorização.

<!-- ----- FORA DO ESCOPO ----- -->

### Fora do escopo

- Retorno do sistema de demonstrações.
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

O padrão é **desenvolvimento conjunto, manual e orientado**: o assistente examina os arquivos e entrega alterações precisas para o proprietário aplicar.

Se o proprietário autorizar edição direta, executar apenas o incremento autorizado. Não pedir novamente autorização para ações já claramente incluídas nele.

Sem autorização explícita, não:

- Editar arquivos.
- Criar ou trocar branches e worktrees.
- Fazer commits, push ou deploy além da autorização específica concedida.
- Instalar ou atualizar dependências.
- Aplicar migrações ou alterar recursos remotos.
- Apagar documentos, arquivos ou dados.
- Aplicar ou descartar stashes.
- Executar operações que descartem alterações.

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

Preservar arquitetura modular e responsabilidades claras.

- Reutilizar recursos existentes.
- Extrair módulos quando houver responsabilidade concreta.
- Evitar componentes enormes e fragmentação excessiva.
- Não criar abstrações artificiais.
- Não reorganizar todo o projeto para corrigir um problema isolado.
- Manter arquivos relacionados agrupados por funcionalidade.

<!-- ----- COMENTÁRIOS EM PT-BR ----- -->

### Comentários em PT-BR

Seção principal:

`/* === CONFIGURAÇÃO === */`

Subseção:

`/* ----- VALIDAÇÃO DE ENTRADA ----- */`

Explicação:

`// Impede que a cobra inverta a direção no mesmo movimento.`

Em documentos Markdown, usar comentários HTML equivalentes de seção e subseção, mantendo os marcadores === e -----, títulos em português e hierarquia semântica. Não inserir comentários JavaScript como texto visível no documento.

Comentários devem explicar responsabilidades, regras e decisões não evidentes. Atualizar comentários incorretos; remover os obsoletos. Não comentar operações triviais nem aumentar artificialmente os arquivos.

Em JSX, utilizar a sintaxe apropriada de comentário.

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
| Jogos           | Cinco jogos, recordes, rankings e DOOM conforme distribuição autorizada                                                                                            |
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

Esses dados precisam ser atualizados na retomada.

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
- Corrigir Currículo e preparação assíncrona do DOOM.
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

- Revisar o ciclo completo dos três aplicativos.
- Operações, quota, conflitos, lixeira e recuperação.
- Texto, imagem, PDF e download.
- Duas janelas/abas, arquivos oficiais e isolamento pessoal.
- Desktop/Mobile, temas e idiomas.

**Aceite:** documentos circulam entre os aplicativos sem perda ou exposição indevida.

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
- DOOM: carregamento, persistência, erros, integridade e licenças.
- Corrigir testes desatualizados sem enfraquecer verificações.

**Aceite:** fluxos representativos e condições de distribuição comprovados.

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

Pendências externas independentes podem ser acompanhadas sem paralisar outras etapas, mas continuam bloqueando o aceite final quando obrigatórias.

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

Manter neste documento, ou no local único combinado, uma tabela:

| Etapa                            | Estado                     | Evidências                                                            | Pendências                       | Aceite                                                       |
| -------------------------------- | -------------------------- | --------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------ |
| 01 — Base e escopo               | Concluída tecnicamente     | Seções 18–21; Git, links, lint, build, testes e preservação do código | Revisão final do proprietário    | Decisões confirmadas; aceite da entrega ainda não registrado |
| 02 — Backend e dados             | Não iniciada nesta revisão | Sem nova homologação remota                                           | P01, P04 e P12                   | Pendente                                                     |
| 03 — Core e persistência         | Não iniciada nesta revisão | Diagnóstico registrado                                                | P02 e P03                        | Pendente                                                     |
| 04 — Design System               | Não iniciada nesta revisão | Decisões preservadas                                                  | P05                              | Pendente                                                     |
| 05 — Arquivos                    | Não iniciada nesta revisão | Contratos preservados                                                 | Revisão funcional e visual; P14  | Pendente                                                     |
| 06 — Profissionais               | Não iniciada nesta revisão | Catálogo preservado                                                   | P07 e conteúdo                   | Pendente                                                     |
| 07 — Contato/Notas/Administração | Não iniciada nesta revisão | APIs existentes                                                       | Homologação dos fluxos           | Pendente                                                     |
| 08 — Calculadora/Jogos           | Não iniciada nesta revisão | Baseline registrada                                                   | P06, P08 e P11                   | Pendente                                                     |
| 09 — Terminal/Wally/Busca        | Não iniciada nesta revisão | Catálogo existente                                                    | P09                              | Pendente                                                     |
| 10 — Shells                      | Não iniciada nesta revisão | Integração existente                                                  | P10 e dispositivos               | Pendente                                                     |
| 11 — Apresentação                | Não iniciada nesta revisão | Escopo fechado                                                        | Walkthrough e informações finais | Pendente                                                     |
| 12 — Aceite integrado            | Não iniciada               | CI existente; execução remota não conferida                           | P13 e P15                        | Pendente                                                     |

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

| ID  | Pendência / evidência                                                            | Etapa responsável   | Critério de encerramento                                                                                      |
| --- | -------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| P01 | Snake: interface 397 versus contrato/API/SQL 222                                 | 02                  | Limite único, testes de fronteira e migração incremental preparada; aplicação remota autorizada separadamente |
| P02 | Currículo redireciona para file-viewer, mas confirmação compara resume           | 03                  | onOpened confirma a instância efetiva e Mobile abre o documento; verificar novamente na 06                    |
| P03 | beforeClose do DOOM não é consumido pelo Core                                    | 03                  | Preparação aguardada, erro/timeout tratados e cancelamento preservando sessão; verificar novamente na 08      |
| P04 | RLS, grants, migrações PostgreSQL 001–014 e D1 001–004 dependem do ambiente real | 02                  | Conferência do histórico e testes positivos/negativos sem reaplicação indiscriminada                          |
| P05 | Wallpapers emparelhados, destaque global e enquadramento fixo                    | 04                  | Quatro seleções independentes, auto/manual por tema e modos aprovados; walkthrough na 11                      |
| P06 | Quatro testes Snake incompatíveis com a base recuperada                          | 08                  | Harness e fixtures atualizados preservando testes reais de regras, pausa e reinício                           |
| P07 | Tradução “Carga horária” ausente                                                 | 06                  | Catálogos completos e interface bilíngue validada                                                             |
| P08 | NOTICE anuncia validação de hash no build, inexistente no script                 | 08                  | Integridade automatizada e avisos compatíveis com o comportamento efetivo                                     |
| P09 | Busca/Wally expõem principalmente abertura de apps                               | 09                  | Ações locais aprovadas alcançáveis com parâmetros, permissões e confirmação                                   |
| P10 | Risco de rolagem global Mobile e ausência de aceite físico atual                 | 10                  | Reproduzir antes de alterar; navegação, altura dinâmica, orientação e teclado aprovados                       |
| P11 | Licença SoundFont, commit/build do UZDoom e conjunto antigo de assets            | 08                  | Rastreabilidade e direitos verificados; limpeza apenas se autorizada e sem dependências                       |
| P12 | Registro histórico de credenciais/sessões comprometidas                          | 02                  | Proprietário confirma rotação e revogação; não copiar credenciais como evidência                              |
| P13 | Backup, restauração, rollback e limites operacionais                             | 12                  | Procedimentos ensaiados em ambiente autorizado e compatibilidade de schema registrada                         |
| P14 | Chunk do Visualizador acima de 500 kB                                            | 05                  | Medir impacto e registrar solução ou justificativa; não elevar limite para esconder o aviso                   |
| P15 | Conteúdo, acessibilidade, visual, CI e integrações externas                      | Por aplicativo e 12 | Evidências efetivas e aceite do proprietário, sem falsa certificação                                          |

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

O próximo incremento é a Etapa 02, começando pela leitura do histórico de migrações, contratos e permissões, com foco no limite Snake e nas dependências de homologação. Não repetir a organização documental nem corrigir interfaces de aplicativos antes da etapa responsável. Iniciar somente quando autorizado pelo proprietário.

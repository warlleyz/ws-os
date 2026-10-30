<!-- === WS OS V2 — DOCUMENTO MESTRE DE REVISÃO E CONCLUSÃO === -->

# WS OS V2 — Documento mestre de revisão e conclusão

- **Versão:** 1.6
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

Este documento consolida a direção de conclusão. Em 30/10/2026, o proprietário autorizou revisar R01–R09 e R10 até o WS Menu e corrigir erros e pendências locais, preservando suas alterações. Autorizações anteriores de etapas e commits são históricas. Não há autorização para commit, push, troca de branch/worktree, migrações, publicação ou escrita remota.

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
| Jogos           | Snake, Memória, Campo Minado, Flappy Bird e Paciência; recordes e rankings suportados                                                                                            |
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
- Suíte completa: resultado esperado de 541/546 testes, pendente de confirmação do resumo final.
- Falhas preexistentes: quatro relacionadas ao Snake (Etapa 08) e uma à tradução "Carga horária" em Certificados (Etapa 06).

**Pendências de homologação:**
- P14: avaliar o bundle do Visualizador, atualmente com aproximadamente 621 kB.
- Validar a integração real dos arquivos oficiais gerenciados pelo backend.
- Homologar em dispositivos físicos e com leitor de tela.
- Confirmar comportamento no ambiente de produção.

**Aceite:** fluxo local entre os três aplicativos validado, com proteção contra perda de documentos, conflitos de revisão e exposição indevida nos cenários verificados. Homologação remota e de produção permanece pendente.

**Encerramento:** Etapa 05 concluída funcionalmente, sujeita à confirmação final dos testes e ao registro do commit na `main`, sem push.


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

Este é o checklist único vigente. R01–R14 são revisões de finalização da auditoria de 28/10/2026; não renumeram as 12 etapas de requisitos da seção 12. Checkpoints e seções 18 e 22–24 preservam evidências datadas, sem conceder autorizações atuais.

Base: main, HEAD 48b0993d9022b306187bd48d62e766678da5e3f3, com alterações locais do proprietário preservadas. A aprovação histórica de 547 testes no checkout limpo de 28/10 não validava essas alterações. Nesta revisão, lint, build externo e 552 testes (547 existentes e cinco regressões novas) passaram após as correções locais. Percursos sem execução real permanecem não testados.

| Revisão | Etapas do mestre | Estado e evidência local | Pendência / responsável |
| --- | --- | --- | --- |
| R01 — Escopo e acompanhamento | 01 | Reconciliado em 30/10; 17 entradas, Currículo atalho, cinco jogos; sem demos/DOOM | Aceite documental / proprietário |
| R02 — Segurança e banco | 02 | Contratos e testes negativos locais aprovados; sem consulta remota nesta revisão | Rotação/revogação, histórico real, migração incremental, RLS por identidade, D1/Turnstile e retenção / proprietário e operador autorizado |
| R03 — Core e personalização | 03/04 | Testes locais aprovados; removida sobrescrita entre temas; percurso Desktop de troca de wallpaper verificado | Matriz física e leitor de tela / proprietário e revisor |
| R04 — Arquivos, Editor e Visualizador | 05 | Implementação existente e testes de armazenamento/UI aprovados; build FileViewer 620,95 kB, gzip 186,51 kB | Desempenho medido no dispositivo, matriz completa e oficiais remotos / revisor e operador |
| R05 — Conteúdo profissional | 06 | Testes de conteúdo/UI aprovados; 11 caminhos locais de certificados existentes | Conferir conteúdo dos PDFs, dados e provedores reais / proprietário e revisor |
| R06 — Projetos e destaques | 06/07 | Testes locais de catálogo e destaques aprovados; sem demos ou ordem manual | Persistência real e decisão sobre edição concorrente sem revisão otimista / proprietário e operador |
| R07 — Notas, apresentação e Configurações | 07/11 | Testes locais aprovados; boot e boas-vindas em duas etapas observados | Aceite bilíngue completo e backend editorial; créditos React Icons, Font Awesome 5 e Simple Icons corrigidos / proprietário e revisor |
| R08 — Cinco jogos e Calculadora | 08 | Regras e UI com testes aprovados; início/pausa/reinício observados nos cinco jogos; traduções dinâmicas corrigidas | Percurso completo em dispositivo; rankings reais em R11 / revisor e operador |
| R09 — Terminal, Wally e busca | 09 | Testes locais aprovados; flag do Wally e ajuda bilíngue do Terminal corrigidas; remoto continua desativado | P09: mapear aprovação e alcance de cada ação; não ampliar ferramentas arbitrariamente / proprietário e revisor |
| R10 — Desktop e Taskbar até WS Menu | 10 | Revisão local em andamento; traduções e exclusividade do contexto corrigidas | Aceite visual/teclado, auto-hide e continuidade a partir do WS Menu / revisor e proprietário |
| R11 — Serviços administrativos reais | 02/07 | Não executada; depende de R02 | Homologação isolada e autorizada / operador e proprietário |
| R12 — Mobile e tablets | 10 | Não encerrada por testes locais | Dispositivo físico, orientação, teclado e navegação / proprietário e revisor |
| R13 — Revisão transversal final | Todas/12 | Não encerrada; suíte local não equivale ao aceite final | Matriz de integração, acessibilidade e CI / revisor e proprietário |
| R14 — Operação e publicação | 12 | Não executada | Licenças atuais, backup/restauração, rollback, limites e autorização de publicação / operador e proprietário |

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

| ID  | Pendência / evidência                                                                   | Etapa responsável   | Critério de encerramento                                                                                 |
| --- | --------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| P01 | Limite Snake 397 unificado no contrato, API e interface; migração incremental preparada | 02                  | Concluído localmente; aplicar e homologar a migração antes de publicar                                   |
| P02 | Currículo confirma file-viewer e Mobile seleciona o destino efetivo                     | 03                  | Encerrado no Core; regressões e PDF real no navegador Desktop/Mobile aprovados; conteúdo permanece na 06 |
| P03 | Preparação assíncrona consumida pelo Core | 03 | Contrato geral preservado; homologação de motor DOOM superada pela remoção |
| P04 | Metadados de RLS/grants, bucket e histórico 005–014 conferidos no ws-os-dev             | 02                  | Ainda requer identidades reais, execução dos roteiros SQL, migração incremental e D1 remoto              |
| P05 | Contratos locais de personalização corrigidos na Etapa 04; seção 24                     | 04 / 11             | Implementação local verificada; resta walkthrough integral de Configurações na 11                        |
| P06 | Falhas antigas dos testes Snake | R08 | Não reproduzidas na auditoria de 28/10 nem na suíte atual; não tratar como defeito aberto |
| P07 | Antiga ausência de tradução Carga horária | R05 | Não reproduzida na suíte atual; aceite de conteúdo em inglês permanece próprio |
| P08 | Integridade/NOTICE de UZDoom | — | Superada pela remoção; não bloqueia a versão atual |
| P09 | Busca/Wally expõem principalmente abertura de apps                                      | 09                  | Ações locais aprovadas alcançáveis com parâmetros, permissões e confirmação                              |
| P10 | Risco de rolagem global Mobile e ausência de aceite físico atual                        | 10                  | Reproduzir antes de alterar; navegação, altura dinâmica, orientação e teclado aprovados                  |
| P11 | Licenças e rastreabilidade UZDoom/SoundFont | — | Superada pela remoção; licenças dos recursos atuais permanecem em R14 |
| P12 | Proprietário informou em 26/10/2026 que ainda não confirmou rotação/revogação           | 02                  | Bloqueio externo: confirmar correção sem divulgar credenciais ou considerar logout suficiente            |
| P13 | Backup, restauração, rollback e limites operacionais                                    | 12                  | Procedimentos ensaiados em ambiente autorizado e compatibilidade de schema registrada                    |
| P14 | Chunk do Visualizador acima de 500 kB                                                   | 05                  | Medir impacto e registrar solução ou justificativa; não elevar limite para esconder o aviso              |
| P15 | Conteúdo, acessibilidade, visual, CI e integrações externas                             | Por aplicativo e 12 | Evidências efetivas e aceite do proprietário, sem falsa certificação                                     |

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

Seguir o checklist único R01–R14 da seção 15. A revisão autorizada em 30/10 cobre R01–R09 e R10 até o WS Menu, preservando as entregas e alterações locais existentes. Os gates remotos de R02/R11 permanecem pendentes de evidência e acesso autorizado; não reconstruir aplicativos já entregues.

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

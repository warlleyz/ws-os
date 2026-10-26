<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === WS OS — PROGRESSO DA CONCLUSÃO FUNCIONAL === -->

# WS OS — progresso da conclusão funcional

Atualizado em 15/10/2026. Documento de continuidade desta execução, iniciado sobre `7bb8a15`.

<!-- === REGRAS E PRESERVAÇÃO === -->

## Regras e preservação

O usuário autorizou implementar o máximo possível, fazer commits por blocos e registrar o restante. Sem push ou deploy automático. Preservar dados locais, arquitetura e stash R3.3. Os três arquivos inicialmente modificados pelo usuário (Settings.css, Window.css e Window.jsx) serão mantidos fora dos commits desta execução, salvo autorização específica posterior.

Não confundir componente integrado com app completo, nem configuração preparada com serviço validado em produção. Conteúdo pessoal não será inventado.

<!-- === CONTEÚDO EDITÁVEL === -->

## Conteúdo editável

`src/content/portfolioContent.js` centraliza perfil, trajetória, interesses, currículo estruturado, certificados, projetos selecionados, arquivos oficiais e configuração pública das integrações. Os arrays vazios são ausência de conteúdo, não exemplos apresentados como reais. Textos aceitam string ou objeto pt-BR/en. Credenciais privadas jamais entram nesse arquivo.

<!-- === BLOCOS DESTA EXECUÇÃO === -->

## Blocos desta execução

| Bloco          | Estado                                    | Escopo                                   |
| -------------- | ----------------------------------------- | ---------------------------------------- |
| A2             | Integrado; configuração/aceites pendentes | Projetos, Demos e Dev Insights           |
| A3             | Integrado; envio real pendente            | Calculadora e Contato                    |
| A5             | Integrado; ensaios adicionais pendentes   | Arquivos pessoais, editor e visualizador |
| Temas          | Adaptados e conferidos nos dois temas     | Vidro/blur inspirado na v1               |
| Terminal/Wally | Recursos locais integrados                | Sem auth/Gemini remoto                   |
| A7             | Cinco jogos locais integrados             | Sem ranking global/DOOM                  |
| Notas          | Leitura integrada e backend preparado     | Sem curtidas/Admin/anexos                |
| Administração  | Reservada e bloqueada ao público          | Implementação futura                     |

Entrega consolidada, conteúdo e plano restante: [ENTREGA-E-CONTINUIDADE-2026-10-15.md](ENTREGA-E-CONTINUIDADE-2026-10-15.md).

<!-- === DEPENDÊNCIAS EXTERNAS === -->

## Dependências externas

- GitHub público pode funcionar sem chave; rate limit e falhas recebem feedback. Cache é da sessão, com limite de entradas e fallback de até 24 horas; conteúdo institucional não depende do serviço.
- WakaTime exige endpoint próprio configurado. Não expor API key no cliente. A UI distingue não configurado, erro e dados reais.
- EmailJS/Supabase/IA/auth/rankings exigem contas e configuração/validação próprias. Nenhuma submissão real a terceiros será feita nos testes sem necessidade/autorização.
- DOOM depende de licença e distribuição autorizada.

<!-- === ACEITES PENDENTES DO PROJETO === -->

## Aceites pendentes do projeto

Conteúdo definitivo; configurações externas; ensaios físicos de toque/leitor de tela/zoom; reprodução do resize nativo nas bordas do monitor; revisão de segurança e publicação. Esta lista será detalhada ao final com os blocos realmente entregues.

<!-- === A2 — ENTREGA FUNCIONAL === -->

## A2 — entrega funcional

Projetos tem catálogo local + GitHub público paginado (até 1000), pesquisa por texto/tecnologia, ordenação e detalhes. Demos valida IDs cadastrados, modos e origens permitidas, com sandbox restrito e alternativa externa. Dev Insights mostra dados verificados do GitHub e leitor WakaTime dependente de endpoint próprio. Não há dados WakaTime inventados.

Cache compartilhado por URL com cancelamento por consumidor, timeout e fallback identificado. Fechar um app não cancela outro consumidor. Retorno interno Mobile por instância foi acrescentado. Sobre Mim, Currículo e Certificados passam a consumir o conteúdo centralizado.

Validação: lint/build e 75 testes aprovados. Navegador consultou GitHub real: 14 repositórios, 1 estrela e 2 seguidores no momento do ensaio; pesquisa SnakePy/detalhes funcionaram, Insights reutilizou cache; voltar no Mobile retornou ao catálogo interno. Console sem erros/warnings. Esses números são evidência datada, não conteúdo fixo. Embed real e WakaTime precisam de descritores/origens/dados autorizados para validação ponta a ponta.

Referências técnicas consultadas: documentação oficial REST GitHub (repositórios públicos) e WakaTime (Stats). Endpoints/provedores e erros devem ser revalidados ao configurar produção.

<!-- === A3 — CALCULADORA E CONTATO === -->

## A3 — Calculadora e Contato

Calculadora usa parser restrito, sem eval/Function, com precedência, potência associativa à direita, sinais, parênteses, porcentagem, funções científicas e graus/radianos. Tem teclado, erros de domínio/divisão por zero e histórico local limitado a 20 entradas. Precisão de exibição até 14 dígitos; não se destina a contabilidade de precisão decimal arbitrária.

Contato possui formulário, canais editáveis, validações, consentimento, honeypot, intervalo mínimo de preenchimento, limite de repetição em sessão e integração REST EmailJS por chave pública. Sucesso só após resposta técnica; timeout/cancelamento é envio não confirmado. Agendamento é solicitação privada para análise, nunca confirmação de reunião/evento público. Nenhuma mensagem real foi enviada nos testes. Configurar serviço/template/chave pública, remetente/destinatário fixo no provedor, restrição de origens e proteção antiabuso/CAPTCHA no serviço antes de produção. Throttle local não é controle de segurança de backend.

Proteção compartilhada de alterações não salvas: fechar abre diálogo acessível do WS OS, mantendo o fundo inert, foco e Escape/Tab; cancelar mantém dados; descartar fecha a instância. Reload usa proteção nativa do navegador. SystemProvider retorna aceitação/rejeição booleana para fechamento; isso não é API de resultado síncrono de ID na abertura. Mobile respeita rejeição e retorna à Home se um fechamento externo remover a última instância.

Validação: sete testes novos de aritmética, domínio, entrada não executável, contato, agenda, resposta do provedor e guards. Navegador: 2+3*4 resultou 14; 1/0 exibiu erro; Contato não configurado não habilita envio; diálogo preservou nome ao cancelar e fechou após descarte. Suíte completa esperada nesta entrega: 82 testes, além de lint/build.

<!-- === A5 — ARQUIVOS PESSOAIS E EDITOR === -->

## A5 — arquivos pessoais e editor

Banco IndexedDB separado ws-os-personal-files: pastas, textos, importação validada, renomear com extensão preservada, mover sem ciclos, lixeira recuperável, restauração e exclusão permanente confirmada. Limites: 10 MB por arquivo, 50 MB/500 itens incluindo lixeira; editor de texto até 1 MB. HTML/JS importados são armazenados como texto e não executados. Imagens têm assinatura/decodificação/limite de pixels; PDF tem assinatura. A lixeira não é esvaziada automaticamente.

Arquivo oficial é catálogo somente leitura e depende de conteúdo público cadastrado. Arquivo pessoal não é enviado a backend nem acessível pela Administração. A restauração de Configurações não toca neste banco.

Editor usa revisão transacional: uma janela antiga não sobrescreve a mais recente. Rascunho sobrevive ao erro; salvar cópia e recarregar com confirmação permitem recuperação. Ctrl+S, indicador de pendência e guard de fechamento/reload. Visualizador local tem texto escapado, imagem com zoom, PDF sandbox com alternativa de download, metadados e revogação de blob URLs.

Validação: seis testes novos para criação, nomes, duplicação, ciclos, extensão, revisões, lixeira/descendentes, purga, limites e integridade. Navegador com IndexedDB real: criou teste-codex.txt, salvou por Ctrl+S, visualizou conteúdo, moveu à lixeira/restaurou e recuperou após reload. Duas janelas produziram conflito de revisão mantendo o rascunho. Nenhum dado da origem habitual do usuário foi alterado. Prévia PDF, importação de todos os formatos e falhas reais de quota ainda precisam de ensaios complementares; os caminhos de erro/modelos têm cobertura automatizada. Suíte nesta etapa: 88 testes.

<!-- === TEMAS — REFERÊNCIA V1 === -->

## Temas — referência v1

Referência lida: warlleyz/portfolio-warlley, commit c2e51be6106752f671d9469e4eadad27b669b24c. V1 usa vidro na janela inteira (24 px/saturação 135%), barra 24 px e painéis 28–30 px. Adaptação na v2: janela inteira translúcida, conteúdo externo transparente e cartões legíveis; normal 24/28 px, forte 28/30 px, demais níveis preservados. Sem transições de left/top/width/height da v1: não introduzir animação de geometria durante resize.

Uma camada de blur por janela/painel evita empilhamento desnecessário. Durante gesto de janela, o efeito é suspenso e a superfície fica sólida; pointerup/cancelamento/Escape/minimização restauram o estado. Baixo custo/redução de transparência e preferências do SO prevalecem; navegadores sem suporte recebem superfícies sólidas. Opacidade mínima 88% foi mantida pela legibilidade dos destaques, em vez de copiar os 78% da v1 indiscriminadamente. O resultado é uma adaptação visual, não uma cópia pixel a pixel nem prova de desempenho em todos os monitores.

Validação do vidro no navegador: dark/high apresentou rgba(24,34,48,.88), light/high rgba(255,255,255,.88), ambos blur(24px)/saturate(1.35); conteúdo externo transparente e cabeçalho sem blur duplicado. Reduzir transparência produziu superfície sólida e backdrop-filter none. Foi corrigido contraste dos rótulos do Desktop sobre wallpaper escuro no tema claro com fundo escuro legível independente do tema/imagem. Lint/build e 88 testes continuam como gates. O resize físico nas bordas do monitor continua exigindo ensaio no equipamento do usuário.

<!-- === TERMINAL E WALLY — RECURSOS LOCAIS === -->

## Terminal e Wally — recursos locais

Terminal oferece help/apps/open/close/theme/lang/ls/pwd/date/whoami/history/clear/echo/login, parser com aspas, autocompletar por Tab, setas e histórico de sessão limitado. Não há shell real, eval, acesso administrativo ou persistência remota do histórico. Login informa indisponibilidade, sem coletar senha. Close passa pelo guard central de descarte.

Wally compacto e estendido orientam por intenções locais e oferecem botões de abertura pelo Core. O Mobile oferece Wally como app no catálogo. Conversa limitada à sessão, sem envio a serviços e sem execução de ações destrutivas. Gemini, autenticação, cotas e ferramentas remotas continuam pendentes; este fallback não é apresentado como IA generativa conectada.

Dois testes novos verificam parser/completar e catálogo restrito do Wally. Suíte acumulada: 90 testes. Smoke no navegador: help exibiu o catálogo; open calculator abriu a Calculadora; painel Wally respondeu sobre Projetos e abriu Wally Estendido pelo Core. A interação por teclado foi usada para evitar o recorte da área de automação. Nenhuma IA remota ou autenticação real foi testada/conectada.

<!-- === A7 — CINCO JOGOS LOCAIS === -->

## A7 — cinco jogos locais

Snake, Memória, Campo Minado (8×8/10 minas), Flappy Bird em desenho geométrico e Paciência Klondike com compra de uma carta. Controles por botões/teclado; recordes locais por jogo, undo limitado da Paciência e regras sem código executável externo. Campo Minado só aceita bandeiras depois da primeira abertura segura. DOOM não incluído por depender de licença/distribuição. Rankings globais não conectados.

Games declara pausa seletiva. Minimizá-lo ou ocultar a página interrompe intervalos/rAF/timeouts; o Mobile passa estado pausado aos consumidores ocultos que optaram por pausa. Voltar ao catálogo desmonta o jogo e limpa recursos; fechar encerra a partida, sem persistir o tabuleiro. Os recordes são separados das preferências do sistema.

Oito testes novos cobrem shuffle reproduzível, Snake (crescimento/direção/cauda/borda), Campo Minado (segurança/bandeiras/vitória), voo (delta/colisões/pontos) e Paciência (52 cartas/compra/movimentos/bases). Navegador: Snake iniciou/pausou; Memória contou a primeira tentativa; Campo Minado abriu casa segura; Paciência comprou carta e desfez (24→23→24); voo respondeu a salto/pausa. Console sem erros/warnings. Suíte acumulada: 98 testes. Partidas completas de todos os jogos, acessibilidade assistiva e toque físico ainda exigem ensaio humano; smoke não prova ausência de todos os bugs.

<!-- === NOTAS E PREPARAÇÃO DE BACKEND === -->

## Notas e preparação de backend

Notas integrado ao shell: busca sem acentos, filtro por assunto, leitura de texto simples, datas, retorno interno Desktop/Mobile, estados vazio/erro/cache. Fonte pública local ou endpoint explícito; nenhum artigo inventado. Pages Functions para agregados WakaTime e leitura de posts Supabase, com segredos apenas no servidor, timeout e erros sanitizados. SQL com RLS de leitura publicada preparado, não executado. Curtidas, anexos e administração autenticada pendentes. Configuração: [backend/CONFIGURACAO.md](../backend/CONFIGURACAO.md). Testes usam rede simulada; não houve deploy ou integração com contas reais.

<!-- === FECHAMENTO === -->

## Fechamento

103 testes aprovados, lint/build aprovados. Retorno interno de Notas conferido pelo cabeçalho Mobile; publicação temporária de teste removida antes do commit. Foram adicionados comando npm test e regras para ignorar segredos locais. Nenhum push/deploy. Três alterações locais iniciais e stash original preservados. Consulte a entrega consolidada para pendências e limites.

<!-- === CONFERÊNCIA FINAL DO PREVIEW DE PRODUÇÃO === -->

## Conferência final do preview de produção

Build servido por Vite preview na mesma origem isolada 127.0.0.1:5189. Confirmados: Notas sem a fixture temporária e com vazio correto; arquivo teste-codex.txt recuperado do IndexedDB após reload; catálogo dos cinco jogos no Mobile 390×844; troca PT-BR/EN e rótulos/estado vazio de Notas traduzidos; Projetos maximizado com 14 repositórios reais carregados. Sem erros/warnings observados no console. Viewport e idioma da origem de teste restaurados; servidor temporário encerrado após os ensaios. O comando npm test também foi executado com sucesso (103 testes).

Commit de fechamento funcional/documental: efcca78569a6cf48cdd639c07ed96e7dae045074. A conferência não executou Pages Functions e não substitui os gates humanos/externos registrados.

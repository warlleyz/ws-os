<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === WS OS — ENTREGA FUNCIONAL E CONTINUIDADE === -->

# WS OS — entrega funcional e continuidade

**Data:** 15/10/2026. **Repositório:** `warlleyz/ws-os`. **Cópia de trabalho:** `C:\Projetos\ws-os`, branch `main`.

<!-- === 1. SITUAÇÃO REAL === -->

## 1. Situação real

O projeto avançou de uma base com aplicativos incompletos para **17 componentes de aplicativos integrados entre os 18 IDs do catálogo**. Isso significa componente funcional carregado pelo shell, não 17 aplicativos integralmente aceitos em todos os requisitos do mestre. Administração continua reservada e bloqueada ao público. O trabalho não reiniciou o projeto, não instalou bibliotecas e não moveu sua estrutura de diretórios.

Desktop, Taskbar, janelas, Mobile, preferências e seus dados anteriores foram preservados. Projetos, métricas públicas GitHub, Calculadora, arquivos pessoais, editor, cinco jogos, Terminal restrito, Wally local e leitura de Notas agora têm implementações concretas. Os temas receberam vidro e blur inspirados na v1 com prioridades de acessibilidade e suspensão de efeitos durante gestos de janela.

**Ainda não é correto afirmar “só falta preencher os conteúdos”.** Faltam autenticação/Admin, Gemini protegido, curtidas, rankings globais, configuração/ensaio dos serviços externos e validação final humana. As seções abaixo delimitam cada pendência. Não há percentual confiável de conclusão calculado por número de arquivos ou apps.

Nenhum push, deploy ou criação de recursos externos foi executado. Os commits estão na cópia local. Não foi usado crédito/restaurador de limite nem feita promessa sobre duração da cota.

<!-- === 2. REFERÊNCIAS E PRECEDÊNCIA === -->

## 2. Referências e precedência

1. Decisões de produto: `docs/planning/WS-OS-V2-MESTRE-v0.16.0.md`.
2. Estado atual desta entrega: este documento e o código dos commits listados abaixo.
3. Evidências por bloco: `docs/PROGRESSO-CONCLUSAO.md`.
4. Detalhes de Configurações da etapa anterior: `docs/settings.md`; a descrição antiga de superfícies opacas foi superada pela adaptação de vidro desta entrega.
5. Contratos do Core: `docs/contracts.md`, com atualização de fechamento e catálogo.

Documentos antigos com diagnóstico de 14/10 descrevem uma fotografia anterior; não repetir suas pendências como se nenhuma etapa posterior tivesse sido executada. O mestre é especificação, não prova de implementação. A autorização posterior do usuário permitiu as implementações e commits atuais.

<!-- === 3. COMMITS DESTA EXECUÇÃO === -->

## 3. Commits desta execução

Base inicial: `7bb8a15` (`feat: concluir configuracoes wallpapers e preferencias`), que já tinha 67 testes aprovados.

| Commit    | Entrega                                                             | Testes acumulados |
| --------- | ------------------------------------------------------------------- | ----------------: |
| `c5b3e3e` | Projetos, Demos, Dev Insights, conteúdo central e serviços públicos |                75 |
| `c2c6c2c` | Calculadora, Contato e proteção de descarte                         |                82 |
| `bc85c79` | Arquivos locais, editor, visualizador e conflito de revisão         |                88 |
| `1cf6587` | Vidro/blur dos temas inspirado na v1                                |                88 |
| `a890af9` | Terminal e Wally local                                              |                90 |
| `90d6201` | Cinco jogos locais e pausa seletiva                                 |                98 |
| `5928533` | Notas e preparação de leitura pública WakaTime/Supabase             |               103 |

O commit de fechamento contém também a documentação atualizada, retorno interno de Notas no Mobile e regras para ignorar segredos locais. Consultar `git log` para seu hash; não inserir o próprio hash dentro do arquivo que o gera.

<!-- === 4. ARQUITETURA ATUAL === -->

## 4. Arquitetura atual

| Local                             | Responsabilidade atual                                                            |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `src/App.jsx`                     | Inicialização, tema, provider e escolha do shell                                  |
| `src/core/`                       | Registry, instâncias, preferências, painéis, notificações, navegação e guards     |
| `src/shells/`                     | Composição Desktop/Mobile e interação própria de cada shell                       |
| `src/features/windows/`           | Geometria, gestos, janela, AppHost lazy e estado de execução                      |
| `src/features/`                   | Taskbar/painéis/launcher/clima/calendário/widgets e outras capacidades existentes |
| `src/apps/`                       | Componentes dos apps e modelos locais de seus domínios                            |
| `src/content/portfolioContent.js` | Conteúdo público editável e configuração pública de integrações                   |
| `src/services/`                   | Leitura pública, provedores e armazenamento; sem credenciais privadas no cliente  |
| `src/shared/`                     | i18n, hooks e utilitários compartilhados com consumidores concretos               |
| `src/styles/`                     | Fundamentos, tokens, temas, personalização e estilos comuns dos apps              |
| `functions/api/`                  | Duas Pages Functions preparadas, executadas no servidor quando configuradas       |
| `tests/core/`                     | Testes automatizados Node de contratos, modelos e serviços                        |

Apps abrem outros apps pelo Core. Não acessam DOM das janelas para comandar outra instância. Lazy loading e ErrorBoundary continuam por instância. `implemented` significa integração funcional, não certificação de todos os critérios. Administração permanece `public:false` e `implemented:false`; escondê-la no menu não seria autorização de backend.

O Core transmite `executionState`; apenas consumidores que o usam efetivamente param seus timers. Jogos agora consome pausa por minimização/ocultação, e o Mobile respeita a opção de pausa. Fechar desmonta o app e executa cleanups. Reload não restaura janelas ou rascunhos não salvos.

<!-- ----- MÓDULOS AINDA RESERVADOS ----- -->

### Módulos ainda reservados

- `src/apps/administration/Administration.jsx`: administração futura.
- `src/services/authService.js`: autenticação futura.
- `src/services/calendarService.js`: reserva histórica; o calendário ativo usa `src/features/calendar/CalendarService.js`.
- `src/features/wally/wallyKnowledge.js`: reserva histórica; o fallback ativo usa `src/services/wallyService.js`.

Não importar arquivos reservados só para eliminar avisos ou preencher a árvore. Os dois últimos caminhos precisam de decisão de consolidação quando seu domínio for ampliado, sem duplicar implementações ativas.

<!-- === 5. MATRIZ DOS APLICATIVOS E ADERÊNCIA FUNCIONAL === -->

## 5. Matriz dos aplicativos e aderência funcional

| App                   | Entregue e integrado                                                                                                                  | Falta / limite material                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sobre Mim             | Perfil, áreas, trajetória/interesses opcionais, links seguros e atalhos de apps                                                       | Conteúdo pessoal definitivo, imagens e revisão editorial/bilíngue                                                       |
| Projetos              | Catálogo local + GitHub público, busca sem acentos, tecnologias, ordenação, detalhes por instância                                    | Curadoria pessoal, imagens reais, descritores e ensaio de cada demo                                                     |
| Dev Insights          | Dados reais GitHub, fontes, cache, período de atualização; consumidor WakaTime                                                        | Configurar/testar proxy WakaTime; visualizações adicionais se exigidas pelo aceite                                      |
| Currículo             | Seções estruturadas e disponibilidade/visualização/download do PDF                                                                    | Preencher currículo e colocar PDF público real; o arquivo ausente não é simulado                                        |
| Certificados          | Pesquisa, categorias, emissor/data/textos e URLs validadas                                                                            | Preencher certificados e disponibilizar comprovantes reais                                                              |
| Contato               | Campos validados, consentimento, solicitação de agenda, envio REST EmailJS preparado, estado de erro/timeout                          | Serviço/template/origens/antiabuso; teste de entrega real. Pedido de agenda não confirma reunião                        |
| Notas                 | Publicações públicas locais ou endpoint, busca, assunto, leitura, data e retorno interno                                              | Conteúdo, banco/RLS real, anexos, paginação além de 200, curtidas e operações editoriais autenticadas                   |
| Arquivos              | Área pessoal IndexedDB, pastas/textos/importação, mover/renomear/lixeira/restaurar/purga confirmada; catálogo oficial somente leitura | Cadastro de arquivos oficiais; ensaios completos de importação/quota; pasta oficial hierárquica se mantida no aceite    |
| Editor de Arquivos    | Texto, Ctrl+S, revisão transacional, cópia, conflito com rascunho preservado e descarte protegido                                     | Ensaios prolongados entre abas/recuperação de falhas. Não há autosave/recuperação de rascunho após reload               |
| Visualizador          | Arquivo oficial ou pessoal, texto escapado, imagem/zoom, PDF com alternativa de download, metadados                                   | Conferir PDFs reais/navegadores e navegação entre coleções se exigida                                                   |
| Calculadora           | Básico/científico, parser sem eval, teclado, graus/radianos, histórico local                                                          | Revisão de UX/toque completa; não é cálculo financeiro de precisão decimal arbitrária                                   |
| Jogos                 | Snake, Memória, Campo Minado, Flappy Bird geométrico, Paciência; recordes locais e pausa                                              | Partidas completas, rankings globais/antiabuso; DOOM condicionado a licença/distribuição                                |
| Terminal              | Comandos restritos, ajuda, histórico de sessão, Tab/setas, abertura/fechamento pelo Core                                              | Login real integrado à autenticação e comandos administrativos autorizados. Não é shell do computador                   |
| Configurações         | Wallpapers pessoais/predefinidos, shells separados, cores/efeitos, acessibilidade, widgets, idioma, restauração segura                | Aceites humanos finais e eventual contrato de preferências próprias dos futuros apps                                    |
| Visualizador de Demos | Descritor cadastrado, modos identificados, origens permitidas, sandbox, recarga e link externo                                        | Demos reais e validação de CSP/compatibilidade. Sem origem permitida não há embed                                       |
| Wally Estendido       | Conversa local limitada à sessão, intents públicas e ações de abertura pelo Core                                                      | Gemini em função protegida, cotas, política de ferramentas/conteúdo e testes de autorização                             |
| Sobre o Sistema       | Propósito, stack, arquitetura, versão técnica e repositório                                                                           | Créditos/licenças completos e histórico editorial de evolução; versão continua 0.0.0 de desenvolvimento                 |
| Administração         | Descoberta pública e abertura bloqueadas                                                                                              | App inteiro, autenticação, permissões por ação, CRUD público/editorial, solicitações privadas, confirmações e auditoria |

Correspondência principal com o mestre: A2/DEC-383–387, A3/388–389, Notas/390–391, Calculadora/392, Arquivos/393–397, Configurações/398–399, Jogos/400–401, Terminal/402–403, Wally/404–405, Administração/406 e integração/estados/407–410. O restante do mestre continua exigindo critérios de qualidade e operação, não apenas componentes renderizados.

<!-- === 6. SHELLS E DESIGN SYSTEM === -->

## 6. Shells e Design System

- Desktop e Taskbar mantêm os avanços R1–R4: instâncias/foco, prévias, painéis exclusivos, organização e persistência. Não foi feita uma segunda reorganização estrutural.
- Widget implementado: relógio, com tamanhos 2×2, 3×2 e 3×3, grade compartilhada e controle central. Não há outros widgets prontos escondidos.
- Configurações e Controles Rápidos compartilham preferências. Restauração usa allowlist, nunca `localStorage.clear()`.
- Mobile possui Home/catálogo/busca/navegação, densidade e wallpaper próprios. Trocar de shell preserva preferências; não garante manter o estado React de cada app montado.
- Tema claro/escuro, destaques blue/violet/green, blur off/soft/normal/strong, transparência solid/default/high e movimento off/subtle/normal são consumidos por superfícies suportadas.
- Referência v1: `warlleyz/portfolio-warlley`, commit `c2e51be6106752f671d9469e4eadad27b669b24c`. Foi lida, não executada com dependências.
- Janela inteira usa vidro; cabeçalho não duplica blur. Normal: blur médio 24 px/forte 28 px; intenso: médio 28 px/forte 30 px; saturação 135%. Opacidade mínima 88% preserva legibilidade em vez de copiar 78% da v1.
- Redução de transparência, baixo custo e preferências do SO prevalecem. Durante gesto de janela, blur é suspenso. Não foram introduzidas transições de geometria de resize.
- Rótulos do Desktop receberam fundo/contraste independente do wallpaper, incluindo tema claro sobre imagem escura.

**Performance:** smokes de janelas e pausas não comprovam que o travamento antigo nas bordas físicas do monitor foi resolvido. Repetir resize nativo em dev/preview, DevTools fechado, com efeitos normais e baixo custo. Comparar novo trace com o arquivo original `C:\Users\warll\Downloads\Trace-20261014T195941.json.gz` se continuar disponível. Não atribuir a causa ao relógio/atalhos sem medir.

<!-- === 7. COMO PREENCHER O CONTEÚDO SEM ALTERAR A ESTRUTURA === -->

## 7. Como preencher o conteúdo sem alterar a estrutura

Editar `src/content/portfolioContent.js`. Strings são aceitas diretamente; para conteúdo bilíngue usar `{ 'pt-BR': 'texto', en: 'text' }`. Textos institucionais genéricos existentes precisam de sua revisão. A UI traduz seus rótulos, mas não traduz automaticamente conteúdo pessoal novo.

| Campo              | Formato e destino                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `githubUser`       | Login público GitHub; atual `warlleyz`                                                                                |
| `profile`          | `name`, `headline`, `summary`, `areas`, `timeline`, `interests`, `links`                                              |
| `profile.timeline` | `{ id, date, title, description }`                                                                                    |
| `resume`           | `{ url, sections: [{ id, title, items: [{ title, description, period }] }] }`                                         |
| `certificates`     | `{ id, title, issuer, category, date, description, url }`; category `course`, `certification` ou `achievement`        |
| `projects`         | `{ id, name, description, technologies: [], status, repository, image, updatedAt, demos: [] }`                        |
| `projects[].demos` | `{ id, title, mode, url }`; mode `external`, `embedded`, `hosted` ou `simulated`; descritor não cria uma demo sozinho |
| `demoOrigins`      | Origens HTTPS exatas autorizadas, sem caminho; verificar política real do site incorporado                            |
| `officialFiles`    | `{ id, name, url, description }`; assets do próprio site e somente leitura                                            |
| `contact.links`    | Canais públicos com `label` e `url`; validar destino                                                                  |
| `contact`          | IDs públicos `emailService`, `emailTemplate`, `emailPublicKey`; nenhuma private key                                   |
| `posts`            | `{ id, title, summary, body, tags: [], status: 'published', publishedAt: ISO }`; texto simples                        |
| `notesEndpoint`    | Vazio para fonte pública local; `/api/posts` quando backend configurado                                               |
| `wakatimeProxy`    | Vazio até configuração; depois `/api/wakatime`                                                                        |

Colocar currículo/comprovantes/arquivos em `public/` e cadastrar os caminhos. Por exemplo, `resume.url: 'curriculo.pdf'` corresponde a `public/curriculo.pdf`. Todo arquivo em `public/` é público. Nunca colocar documentos privados, rascunhos, senhas ou credenciais ali.

Os itens locais de Projetos podem complementar repositórios: a URL de repositório deve coincidir com a URL normalizada do GitHub para evitar duplicação. Metadados locais prevalecem. IDs devem ser estáveis, únicos e usados pelos descritores das demos.

Uma publicação local marcada como draft pode ser filtrada na interface, mas continua presente no bundle se cadastrada no código. **Rascunho privado pertence ao backend com autorização, nunca ao array local.**

<!-- === 8. DADOS E PERSISTÊNCIA === -->

## 8. Dados e persistência

| Dado                           | Armazenamento / política                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Preferências globais           | Chaves existentes de `localStorage`, normalização e falha de escrita informada                              |
| Wallpapers                     | IndexedDB `ws-os-wallpapers`, store `images`, chave `custom`; PNG/JPEG/WebP até 5 MiB, 32 MP e 8192 px/lado |
| Wallpaper Desktop/Mobile       | `ws-os:wallpaper` e `ws-os:mobile-wallpaper`; imagem pessoal compartilhada, seleção independente            |
| Arquivos pessoais              | IndexedDB `ws-os-personal-files`, store `entries`; sem upload remoto                                        |
| Limites de arquivos            | 10 MiB/arquivo, 50 MiB e 500 itens incluindo lixeira; editor até 1 MiB                                      |
| Lixeira                        | Recuperável até purga explícita; não esvaziada automaticamente                                              |
| Concorrência                   | Revisão esperada em transação; janela antiga não sobrescreve a mais recente                                 |
| Calculadora                    | `ws-os:calculator-history`, últimas 20 entradas                                                             |
| Jogos                          | `ws-os:game-records`, melhores resultados locais; tabuleiro não é salvo                                     |
| Terminal/Wally                 | Memória da sessão; sem histórico remoto                                                                     |
| Cache HTTP público do frontend | Memória da sessão, limite de 32 URLs, frescor 5 min, fallback identificado até 24 h                         |
| Janelas/notificações/rascunhos | Sessão; não restaura após reload                                                                            |

Configurações restaura apenas preferências previstas. Não apaga imagem pessoal, documentos, recordes, histórico da calculadora, favoritos ou posições dos atalhos. Pode restaurar visibilidade/tamanho dos widgets preservando posição. Limpeza de dados do navegador ou mudança de origem pode perder acesso a dados locais; backup/exportação integral ainda não existe.

<!-- === 9. INTEGRAÇÕES, SEGURANÇA E LIMITES === -->

## 9. Integrações, segurança e limites

Guia operacional: `docs/backend/CONFIGURACAO.md`; SQL preparado: `docs/backend/posts.sql`.

| Integração          | Estado real                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| GitHub              | Público, sem chave; consulta real no navegador, paginação/limites/cache e erros tratados                                 |
| Open-Meteo          | Serviço existente de clima com consentimento de localização e tratamento de requisição; não reconfigurado nesta execução |
| EmailJS             | Cliente REST preparado e testado com rede simulada; envio real não realizado                                             |
| WakaTime            | Cliente + Pages Function de agregados preparados; segredo e runtime Cloudflare não configurados/testados com conta real  |
| Supabase Notas      | Endpoint GET e SQL RLS preparados; nenhum SQL executado ou projeto conectado                                             |
| Supabase Auth/Admin | Não implementado; nenhuma sessão administrativa real                                                                     |
| Gemini              | Não implementado; Wally é fallback local explícito                                                                       |
| Rankings/curtidas   | Não implementados globalmente; jogos têm recordes locais                                                                 |

WakaTime usa Basic Auth apenas no servidor, timeout e whitelist de resposta sem projetos/arquivos privados. Supabase usa chave anon JWT e RLS; não requer service_role. Validar políticas reais, incluindo políticas preexistentes, antes da ativação. A ausência de escrita anônima é intencional.

`.env`, `.env.*`, `.dev.vars` e variantes locais são ignorados; `.env.example` pode ser versionado sem valores reais. Segredos de backend não recebem prefixo `VITE_`. Chave pública não substitui controle de autorização. Honeypot/throttle local do Contato não protegem, sozinhos, um endpoint contra abuso.

Demos têm sandbox sem `allow-same-origin`, sem popups e lista explícita de origens. Texto/HTML de arquivos e publicações é exibido como texto escapado, não executado. Administração futura não pode acessar arquivos pessoais do visitante.

<!-- === 10. VALIDAÇÕES REALIZADAS E LIMITES === -->

## 10. Validações realizadas e limites

<!-- ----- AUTOMATIZAÇÃO ----- -->

### Automatização

- ESLint aprovado, build de produção aprovado e **103 testes Node aprovados**, sem falhas, no fechamento funcional.
- 36 testes acrescentados nesta execução sobre os 67 anteriores.
- Cobertura inclui contratos/modelos, cache/cancelamento, parser, envio simulado, guards, revisões/lixeira, regras dos jogos, Notas e respostas dos endpoints.
- Sem dependências novas. Build não compila/executa Pages Functions; os testes exercitam seus handlers com Requests/Responses e fetch simulado.
- Cada commit funcional foi verificado contra o conteúdo da cópia de trabalho, com exclusão explícita das três alterações locais protegidas.

<!-- ----- NAVEGADOR ----- -->

### Navegador

Origem isolada `http://127.0.0.1:5189`, sem limpar dados da origem habitual do usuário:

- GitHub real, pesquisa/detalhes Projetos, cache em Insights e retorno interno Mobile.
- Calculadora: precedência e divisão por zero; Contato bloqueado enquanto não configurado; diálogo de descarte mantém dados ao cancelar.
- IndexedDB real: criar/editar/salvar/visualizar texto, lixeira/restauração, recuperação após reload e conflito entre dois editores.
- Temas claro/escuro, vidro, prioridade de transparência reduzida e contraste de rótulos.
- Terminal e Wally local operados por teclado; abertura de apps pelo Core.
- Cinco jogos: controles iniciais, pausa, tentativa da Memória, primeira casa segura, compra/undo da Paciência e salto do Flappy.
- Notas: fixture temporária local, busca sem acento, texto com `<script>` exibido literalmente, leitura e retorno pelo cabeçalho Mobile; fixture removida antes do commit.
- Console sem erros/warnings nos smokes finais observados.

Os smokes não substituem partidas completas, leitor de tela, toque físico, zoom nativo, todos os formatos de arquivos, quota realmente esgotada, envio real de e-mail, RLS em banco, autenticação ou benchmark de performance. Não declarar WCAG AA/Lighthouse-meta/resize resolvido sem suas evidências.

<!-- === 11. PLANO RESTANTE, EM ORDEM DE EXECUÇÃO === -->

## 11. Plano restante, em ordem de execução

<!-- ----- P0 — REVISÃO LOCAL E REGRESSÕES ANTES DE AMPLIAR ESCOPO ----- -->

### P0 — revisão local e regressões antes de ampliar escopo

1. Revisar commits e as três modificações locais ainda não commitadas. Confirmar se entram em commit próprio; não descartá-las.
2. Reproduzir o travamento de resize nas bordas físicas, comparar efeitos normais/baixo custo e novo trace; corrigir apenas com evidência.
3. Exercitar dados pessoais reais com backup: textos, múltiplas abas, lixeira, upload válido/inválido, reset e reload. Não testar purga em arquivos importantes.
4. Rodar lint/build/testes; conferir Desktop/Mobile em janelas pequenas e teclado virtual. Corrigir bugs observados antes de marcar aceite.

<!-- ----- P1 — CONTEÚDO E SERVIÇOS DE LEITURA/ENVIO ----- -->

### P1 — conteúdo e serviços de leitura/envio

1. Preencher perfil, currículo/PDF, certificados, canais, projetos e arquivos oficiais; revisar PT-BR/EN.
2. Cadastrar e validar demos individuais e seus modos/origens/CSP.
3. Configurar EmailJS em teste: destinatário fixo/template/origens, antiabuso e feedback de entrega. Validar solicitação de agenda privada.
4. Configurar Pages Functions/WakaTime e medir resposta dos três períodos; revisar exposição pública dos agregados.
5. Revisar/aplicar SQL de Notas no ambiente de teste, testar leitura anon positiva/negativa e depois ligar endpoint. Não usar dados privados no frontend.

<!-- ----- P2 — AUTENTICAÇÃO E ADMINISTRAÇÃO ----- -->

### P2 — autenticação e Administração

1. Definir provedor/configuração Supabase Auth e provisionamento de administrador; não criar cadastro público administrativo.
2. Implementar authService com sessão, expiração/logout/erro; autorização no servidor e no banco por ação, nunca só flags do cliente.
3. Criar Administração para conteúdo público, publicações/drafts, eventos, arquivos oficiais e solicitações privadas; confirmação em operações destrutivas.
4. Adicionar testes negativos: visitante, usuário sem papel, sessão expirada, acesso por URL/chamada direta e tentativa de leitura/escrita indevida.
5. Conectar login restrito do Terminal ao fluxo, sem interpretar comandos de sistema ou persistir senha/histórico sensível.

<!-- ----- P3 — DADOS INTERATIVOS E ASSISTENTE REMOTO ----- -->

### P3 — dados interativos e assistente remoto

1. Curtidas anônimas: idempotência no servidor, limite/antiabuso e política de privacidade; não confiar em contador local ou ID manipulável.
2. Rankings: schema por jogo, validação proporcional do resultado, limitação de tráfego e ausência de alegação de antifraude absoluto.
3. Gemini: segredo no backend, limite/cotas, contexto público curado, lista de ferramentas permitidas e validação de parâmetros; fallback local em falha.
4. Administração e IA nunca recebem banco de arquivos pessoais do navegador. Não enviar conversas remotamente sem tornar o comportamento claro ao visitante.
5. Decidir DOOM com artefatos/licença autorizados e fallback; não baixar/distribuir WAD comercial.

<!-- ----- P4 — CRITÉRIOS RESTANTES DO MESTRE E LANÇAMENTO ----- -->

### P4 — critérios restantes do mestre e lançamento

1. Calendário: integrar eventos públicos editoriais, mantendo pedidos de contato/agenda privados; consolidar serviço reservado somente quando houver implementação real.
2. Completar créditos/licenças/evolução em Sobre o Sistema, metadados de versão e notas de release.
3. Revisar visualizações de métricas, anexos de Notas, hierarquia oficial e navegação de coleções conforme os aceites do mestre.
4. Testar partidas completas, acessibilidade assistiva, teclado, foco, contraste, zoom 200%, redução de movimento/transparência e orientação Mobile.
5. Medir performance dev/preview com várias janelas e jogos pausados; acompanhar custo de fontes remotas e comportamento offline.
6. Revisar segurança de produção, cabeçalhos/CSP compatíveis, limites, observabilidade sem dados privados, erros e custos; testar preview das Functions.
7. Configurar pipeline/CI de lint/build/testes e revisão de deploy. Confirmar domínio/HTTPS/roteamento/rollback e conteúdo final. Só então publicar com autorização específica.

<!-- === 12. GIT E PRESERVAÇÃO PARA O PRÓXIMO CHAT === -->

## 12. Git e preservação para o próximo chat

Estas alterações já existiam ao começar e foram mantidas **fora dos commits desta execução**:

| Arquivo                           | Alteração local preservada                  |
| --------------------------------- | ------------------------------------------- |
| `src/apps/settings/Settings.css`  | Scrollbars personalizados                   |
| `src/features/windows/Window.css` | Tamanho especial da janela de Configurações |
| `src/features/windows/Window.jsx` | Atributo `data-app-id`                      |

Seus hashes foram comparados em todos os checkpoints. O stash original foi mantido intacto: `stash@{0}`, objeto `fde807596bafaad6878da5721445b428c4ea468b`, mensagem `On main: WIP R3.3 antes do diagnostico`. Não aplicar/pop automaticamente: parte da intenção já foi incorporada posteriormente e pode conflitar.

O ambiente testado contém essas três alterações; o checkout apenas dos commits pode ter diferenças no tamanho da janela de Configurações e scrollbars. Isso é registrado para não confundir validação do worktree com um checkout limpo.

Não executar reset/clean, apagar IndexedDB/localStorage, aplicar stash, trocar branch ou sobrescrever arquivos locais sem examinar o estado atual. Não há necessidade de reiniciar o projeto.

<!-- === 13. COMANDOS DE CONTINUIDADE === -->

## 13. Comandos de continuidade

Executar em `C:\Projetos\ws-os`:

```powershell
git status --short
git log -10 --oneline
git stash list
npm run lint
npm run build
npm test
npm run dev
```

`npm run preview` testa o frontend produzido pelo build. Vite dev/preview não executa Pages Functions. Configuração e ensaio do backend seguem o guia separado. Dependências já estão instaladas; esta entrega não precisou de reinstalação.

<!-- === 14. PROMPT PARA RETOMAR EM OUTRO CHAT === -->

## 14. Prompt para retomar em outro chat

> Continue o WS OS em C:\Projetos\ws-os. Leia primeiro docs/ENTREGA-E-CONTINUIDADE-2026-10-15.md, docs/PROGRESSO-CONCLUSAO.md e docs/planning/WS-OS-V2-MESTRE-v0.16.0.md. Confira Git, commits e stash antes de editar. Preserve as três modificações locais documentadas e o stash R3.3; não aplique nem descarte automaticamente. Há 17 componentes de apps integrados, mas Administração/auth, Gemini, curtidas, rankings e configurações/aceites externos continuam pendentes. Não refaça o projeto, não invente conteúdo ou métricas e não confunda endpoint preparado com integração de produção. Use o plano P0–P4 deste documento, valide cada bloco com lint/build/testes e evidências pertinentes. Mantenha dados pessoais locais. Antes de começar, informe o próximo bloco concreto e as dependências que de fato exigem minha configuração. Não faça push/deploy sem autorização.

<!-- === CONFERÊNCIA FINAL DO PREVIEW DE PRODUÇÃO === -->

## Conferência final do preview de produção

Build servido por Vite preview na mesma origem isolada 127.0.0.1:5189. Confirmados: Notas sem a fixture temporária e com vazio correto; arquivo teste-codex.txt recuperado do IndexedDB após reload; catálogo dos cinco jogos no Mobile 390×844; troca PT-BR/EN e rótulos/estado vazio de Notas traduzidos; Projetos maximizado com 14 repositórios reais carregados. Sem erros/warnings observados no console. Viewport e idioma da origem de teste restaurados; servidor temporário encerrado após os ensaios. O comando npm test também foi executado com sucesso (103 testes).

Commit de fechamento funcional/documental: efcca78569a6cf48cdd639c07ed96e7dae045074. A conferência não executou Pages Functions e não substitui os gates humanos/externos registrados.

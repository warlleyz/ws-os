# Estado da implementação — 14/10/2026

Base remota anterior à organização: `745ada6`, branch main. Também foram preservados os movimentos e a centralização de estilos ainda não commitados na cópia local. Esta entrega é reorganização, não conclusão de marcos funcionais.

Legenda: **ativo** = conectado à interface; **parcial** = existe base, mas não atende todo o mestre; **reservado** = caminho preparado sem implementação. Passar lint/build não equivale a validar todo o produto.

## Sistema

| Área           | Estado    | Código existente                                                     | Falta para o planejamento                                                                   |
| -------------- | --------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Boot           | parcial   | Tela, temporizador, movimento reduzido da barra                      | Coordenação real de inicialização/falhas; validação de UX                                   |
| Boas-vindas    | parcial   | Apresentação Wally, botão e flag local                               | Contenção/retorno de foco, fundo inerte, coordenação com atalhos                            |
| Registry       | parcial   | 18 IDs, classes, flags, ícones, política de instâncias               | Entradas lazy, elegibilidade shell, parâmetros, flags corretas                              |
| Instâncias     | parcial   | Abrir, ativar, minimizar, restaurar, fechar e histórico              | Erros contratuais, acesso, contexto e lifecycle completo                                    |
| Janelas        | parcial   | Drag, resize, snap metades/quadrantes, maximizar/restaurar           | Saída parcial permitida, animações, isolamento, testes prolongados                          |
| Desktop        | parcial   | 12 atalhos, seleção simples, duplo clique, ordenação                 | Arraste persistente de ícones, multisseleção/área, regras de capacidade                     |
| Taskbar        | parcial   | Flutuante inferior, grupos, indicadores, scroll                      | Clique da última ativa, auto-ocultar, miniaturas, data visível                              |
| WS Menu        | parcial   | Lista alfabética sem categorias, favoritos e pesquisa nominal        | Recentes, catálogo principal persistente, pesquisa contextual                               |
| Painéis        | parcial   | Estado exclusivo, portal centralizado, Escape e clique externo       | Fechamento uniforme, coordenação completa de overlays/foco                                  |
| Notificações   | parcial   | Histórico de sessão, leitura/remoção, ações e toasts                 | Política de emissão e validação completa; evitar aviso a cada abertura quando desnecessário |
| Controles      | parcial   | Seletor dark/light                                                   | Sons, efeitos funcionais e acesso a Configurações                                           |
| Clima          | parcial   | Geolocalização solicitada pelo usuário e condições atuais            | Previsão, cache, cancelamento, timeout HTTP e atualização                                   |
| Calendário     | parcial   | Mês, dias, hoje, navegação                                           | Eventos cadastrados e feriados; nunca rotina pessoal                                        |
| Wally compacto | parcial   | Painel de apresentação estático                                      | Interação útil, fallback local e acesso ao app completo                                     |
| Widgets        | parcial   | Relógio, três tamanhos, arraste e persistência                       | Capacidade, realocação, gestão central e teclado                                            |
| Temas          | parcial   | Escuro padrão, claro, tokens e persistência                          | Todas as superfícies, estados semânticos, destaque curado e efeitos                         |
| Wallpapers     | parcial   | Fundo em gradientes                                                  | Opções predefinidas e imagem pessoal local                                                  |
| Idiomas        | reservado | Dois JSONs vazios e destino de i18n                                  | Traduções pt-BR/en, alternância, idioma do HTML e persistência                              |
| Mobile         | reservado | Arquivos de shell/home/catálogo/navegação                            | Experiência própria inteira, origem, fullscreen e painéis                                   |
| Persistência   | parcial   | Preferências em localStorage                                         | Serviço comum, avisos de falha, versão/migração e IndexedDB                                 |
| Auth/Admin     | reservado | Flag de descoberta oculta                                            | Auth real, autorização backend, sessão e testes negativos                                   |
| Integrações    | parcial   | Apenas Open-Meteo conectado                                          | GitHub, WakaTime, EmailJS, Supabase e Gemini protegido                                      |
| Qualidade      | parcial   | ESLint/Prettier, build e sete testes Node adicionados para regressão | Testes React/E2E, acessibilidade, performance, segurança e CI                               |

## Os 18 aplicativos

Todos têm caminho reservado em apps, nenhum tem componente funcional conectado ao AppHost. Os placeholders que abrem são janelas do sistema, não implementações reais dos aplicativos.

| App / ID                               | Classe  | Requisitos ainda pendentes                                                                                         |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| Sobre Mim / about-me                   | Desktop | Perfil, trajetória, competências contextualizadas, interesses, links para demais apps, conteúdo versionado         |
| Projetos / projects                    | Desktop | Catálogo, filtros, detalhes por projeto/instância, imagens, tecnologias, links GitHub, demos e fallback            |
| Dev Insights / dev-insights            | Desktop | Métricas verificáveis GitHub/WakaTime, períodos, gráficos, fontes/cache/frescor                                    |
| Currículo / resume                     | Desktop | Conteúdo estruturado, PDF oficial, visualização e download, indisponibilidade                                      |
| Certificados / certificates            | Desktop | Instituição/título/data, pesquisa/filtros, comprovantes e validação                                                |
| Contato / contact                      | Desktop | Canais profissionais, EmailJS, validação/antiabuso, solicitações privadas e análise de agendamento                 |
| Notas / notes                          | Desktop | Blog público, pesquisa, anexos, curtidas, rascunhos protegidos e operações editoriais autenticadas                 |
| Arquivos / files                       | Desktop | Pastas oficiais em leitura, área pessoal local, criar/mover/renomear/excluir, cotas e capacidades                  |
| Jogos / games                          | Desktop | Snake, Paciência, Memória, Flappy Bird, Campo Minado e DOOM condicionado a licença/distribuição; recordes/rankings |
| Terminal / terminal                    | Desktop | Comandos documentados, histórico, ajuda, autocompletar, ações via Core e login administrativo gerenciado           |
| Configurações / settings               | Desktop | Temas, cores, efeitos, acessibilidade, widgets, organização, persistência e restauração                            |
| Sobre o Sistema / about-system         | Desktop | Propósito, stack, versão, evolução, créditos/licenças e links                                                      |
| Visualizador de Arquivos / file-viewer | Sistema | Descritor validado, texto/imagem/PDF suportados, zoom/navegação/metadados/download e fallback                      |
| Editor de Arquivos / file-editor       | Sistema | Formatos textuais compatíveis, permissões, alterações pendentes, salvamento e descarte seguro                      |
| Calculadora / calculator               | Sistema | Básico/científico conforme especificação, teclado/toque, validação e erros locais                                  |
| Visualizador de Demos / demo-viewer    | Sistema | Execução incorporada/externa/hospedada/simulada identificada, origens, limites de embed e retorno                  |
| Wally Estendido / wally-extended       | Sistema | Conhecimento autorizado, conversa, ferramentas permitidas, fallback e Gemini por função protegida                  |
| Administração / administration         | Sistema | Conteúdo/eventos/arquivos oficiais/solicitações; sessão, permissão por ação e confirmações                         |

Cada app precisa também de estados aplicáveis de vazio/carregando/erro/offline/permissão/recuperação, acessibilidade, adaptação aos dois shells e testes de fluxo. Não transformar Notas em bloco de notas do visitante ou permitir Administração acessar arquivos pessoais locais de terceiros.

## Divergências conhecidas preservadas nesta organização

| ID  | Prioridade             | Evidência após reorganização                                                       | Decisão         |
| --- | ---------------------- | ---------------------------------------------------------------------------------- | --------------- |
| D01 | alta                   | Taskbar.handleGroupClick abre prévias quando há múltiplas instâncias               | DEC-050/054     |
| D02 | alta                   | getTargetInstance usa ordem de criação para fallback                               | DEC-054         |
| D03 | alta                   | closePanels/handleGroupClick ainda omitem calendário em setters individuais        | DEC-076/152     |
| D04 | alta                   | desktopLayout reserva widget antes de atalhos; DesktopShortcuts oculta sem posição | DEC-060/064/263 |
| D05 | alta antes de backend  | openApp não verifica public                                                        | DEC-125/145/417 |
| D06 | média                  | Registry marca dois apps como implementados apesar do placeholder                  | DEC-412/B10     |
| D07 | alta de acessibilidade | WelcomeDialog sem contenção/retorno de foco e fundo inert                          | DEC-195/603     |
| D08 | média                  | Theme/Widget/Menu salvam sem feedback completo de falha                            | DEC-154/602     |
| D09 | média                  | Tema claro conserva superfícies escuras fixas                                      | DEC-182/220     |
| D10 | média                  | windowGeometry confina janela inteira                                              | DEC-067         |
| D11 | média                  | Marca WS OS V2 no cabeçalho do menu; HTML lang=en                                  | DEC-013/012     |
| D12 | média                  | executionState sem consumidor; fechamento sem transição/isolamento                 | DEC-133/135/136 |

Não há porcentagem confiável de conclusão: catálogo cadastrado não mede funcionalidade entregue. F1–F4 possuem código parcial; F5 e A1–A8 permanecem pendentes de implementação/validação.

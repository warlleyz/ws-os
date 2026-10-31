# Plano completo de revisão e evolução do WS OS

## Como executar o plano

Cada etapa deve passar por cinco momentos:

1. **Diagnóstico:** entender os arquivos, dependências e comportamento atual.
2. **Definição:** decidir o que preservar, corrigir, melhorar, adicionar ou remover.
3. **Implementação:** executar mudanças em partes pequenas e verificáveis.
4. **Validação:** conferir funcionamento, acessibilidade, responsividade e falhas.
5. **Documentação:** registrar decisões, resultados e pendências.

As funcionalidades novas indicadas neste plano são possibilidades para avaliação. Antes de implementá-las, definir sua utilidade, funcionamento, dados necessários e critérios de conclusão.

### Registro obrigatório por etapa

- Arquivos examinados e suas responsabilidades.
- Problemas encontrados e melhorias escolhidas.
- Funcionalidades adicionadas, alteradas ou removidas.
- Testes e verificações realizados.
- Pendências e dependências de outras etapas.
- Documentação atualizada e commit correspondente.

### Controle de todos os arquivos

Manter um inventário com:

| Arquivo | Responsabilidade | Consumidores | Decisão | Etapa | Situação |
| --- | --- | --- | --- | --- | --- |
| Caminho do arquivo | O que ele faz | Quem utiliza | Manter, revisar, dividir, mover ou remover | Número | Pendente, em revisão ou concluído |

A revisão só termina quando todos os arquivos versionados tiverem um destino registrado. Arquivos novos também entram no inventário.

---

## Etapa 01 — Diagnóstico completo e definição da versão

**Objetivo:** estabelecer o ponto de partida e decidir o que a próxima versão deve entregar.

### Revisar

- Estado do repositório, alterações locais e versão publicada.
- Estrutura completa de pastas e arquivos.
- Aplicativos, painéis, widgets e integrações existentes.
- Funcionalidades completas, parciais, desativadas e planejadas.
- Resultados atuais de lint, testes e build.
- Achados da auditoria e problemas já conhecidos.

### Organizar e desenvolver

- Criar o inventário de arquivos.
- Criar uma matriz de funcionalidades por Desktop e Mobile.
- Separar correções necessárias de melhorias e novas funcionalidades.
- Definir público, objetivo profissional e prioridades do portfólio.
- Definir o escopo da próxima versão e o que ficará para depois.
- Estabelecer critérios de qualidade e conclusão.

**Entrega:** diagnóstico inicial, inventário e escopo da versão.

## Etapa 02 — Documentação, decisões e organização do repositório

**Áreas:** `README.md`, `docs`, arquivos da raiz e organização geral.

### Revisar

- Documentação vigente e registros históricos.
- Instruções de instalação, execução, validação e publicação.
- Descrição da arquitetura e serviços utilizados.
- Referências a recursos removidos.
- Convenções de nomes, pastas e comentários.

### Organizar e desenvolver

- Definir um documento principal de acompanhamento.
- Atualizar a documentação ao comportamento atual.
- Separar histórico, instruções operacionais e especificações.
- Documentar decisões arquiteturais relevantes.
- Definir critérios para criar, mover e remover arquivos.
- Criar exemplos de configuração sem segredos.

**Entrega:** documentação coerente e estrutura compreensível para manutenção.

## Etapa 03 — Ferramentas, dependências e qualidade de desenvolvimento

**Áreas:** configuração do projeto, dependências e automação de validação.

### Revisar

- `package.json`, lockfile e versões suportadas.
- Configurações de Vite, ESLint e Prettier.
- Dependências utilizadas, redundantes ou desnecessárias.
- Scripts de desenvolvimento e validação.
- Workflow de integração contínua.

### Organizar e desenvolver

- Resolver atualizações e alertas compatíveis com o projeto.
- Padronizar comandos e ambiente de desenvolvimento.
- Garantir reprodução da instalação pelo lockfile.
- Melhorar a validação automática dos pontos importantes.
- Definir como executar frontend e backend em desenvolvimento.
- Evitar ferramentas que acrescentem complexidade sem benefício claro.

**Entrega:** ambiente reproduzível e verificações confiáveis.

## Etapa 04 — Arquitetura, núcleo e contratos

**Áreas:** `src/core` e contratos utilizados pelo sistema.

### Revisar

- Registro e configuração dos aplicativos.
- Estado global, instâncias e comunicação entre áreas.
- Abertura, ativação, minimização, restauração e fechamento.
- Permissões e capacidades.
- Navegação, parâmetros e retornos.
- Proteção de alterações não salvas.
- Preferências e compatibilidade com dados antigos.

### Organizar e desenvolver

- Eliminar regras duplicadas entre núcleo e aplicativos.
- Tornar contratos e responsabilidades explícitos.
- Melhorar tratamento de operações simultâneas.
- Garantir cancelamento e limpeza de operações pendentes.
- Avaliar navegação por endereço e restauração de contexto.
- Preparar extensões necessárias às funcionalidades aprovadas.

**Entrega:** núcleo consistente para sustentar a evolução dos aplicativos.

## Etapa 05 — Componentes compartilhados, hooks e utilitários

**Áreas:** `src/shared` e recursos reutilizáveis.

### Revisar

- Botões, campos, seletores, diálogos, menus e tooltips.
- Estados de carregamento, vazio, sucesso e erro.
- Hooks, assinaturas, timers e cancelamentos.
- Utilitários de URL, datas, arquivos e validação.
- Duplicações entre aplicativos.

### Organizar e desenvolver

- Padronizar componentes com a mesma função.
- Definir comportamento de foco e teclado.
- Melhorar mensagens e recuperação de erros.
- Criar componentes compartilhados onde houver repetição real.
- Evitar abstrações que tornem casos simples difíceis de entender.

**Entrega:** base de interface reutilizável e previsível.

## Etapa 06 — Identidade visual e sistema de estilos

**Áreas:** estilos, temas, imagens, ícones e recursos públicos.

### Revisar

- Cores, tipografia, espaçamento, bordas e camadas.
- Temas claro e escuro.
- Transparência, desfoque, animações e contraste.
- Wallpapers, cursores, logos, favicon e Wally.
- Imagens de aplicativos e jogos.
- Origem e licença dos recursos.

### Organizar e desenvolver

- Consolidar tokens e padrões visuais.
- Reduzir estilos globais que interferem em aplicativos.
- Otimizar recursos pesados.
- Conferir variantes e dimensões adequadas.
- Melhorar consistência entre Desktop e Mobile.
- Definir regras visuais para novas funcionalidades.

**Entrega:** identidade consistente e recursos organizados e otimizados.

## Etapa 07 — Inicialização, apresentação e entrada do visitante

**Áreas:** aplicativo principal, boot e boas-vindas.

### Revisar

- Sequência de carregamento e duração do boot.
- Apresentação inicial e personalização.
- Primeira visita e visitas seguintes.
- Falhas de armazenamento ou carregamento.
- Acesso inicial ao perfil, projetos e contato.

### Organizar e desenvolver

- Tornar o objetivo profissional claro desde a entrada.
- Avaliar personalização opcional e possibilidade de pular etapas.
- Melhorar carregamento sem criar espera artificial desnecessária.
- Garantir entrada adequada por links compartilhados.
- Avaliar uma apresentação profissional inicial no Desktop.
- Preservar a identidade de sistema operacional.

**Entrega:** primeiro acesso claro, rápido e funcional.

## Etapa 08 — Desktop, atalhos e área de trabalho

**Áreas:** shell Desktop e organização da área de trabalho.

### Revisar

- Atalhos, seleção, organização e menus contextuais.
- Abertura por clique, teclado e menu.
- Espaço disponível, rolagem e diferentes resoluções.
- Persistência da organização.
- Interação com widgets.

### Organizar e desenvolver

- Melhorar descoberta das funcionalidades.
- Corrigir comportamentos inconsistentes de seleção e arraste.
- Avaliar organização por grupos ou pastas, se útil.
- Avaliar opções de ordenação e restauração do layout.
- Preservar ações nativas do navegador onde não houver alternativa necessária.

**Entrega:** área de trabalho organizada e utilizável por mouse e teclado.

## Etapa 09 — Janelas, barra de tarefas e menu principal

**Áreas:** gerenciamento visual de janelas, taskbar e launcher.

### Revisar

- Movimento, redimensionamento, encaixe e maximização.
- Janelas fora da área visível.
- Foco, ordem de sobreposição e múltiplas instâncias.
- Minimização e preservação de estado.
- Prévia, agrupamento e menus da barra de tarefas.
- Aplicativos fixados e pesquisa no menu.

### Organizar e desenvolver

- Melhorar navegação entre janelas.
- Conferir controles e atalhos de teclado.
- Garantir que animações respeitem acessibilidade.
- Avaliar atalhos adicionais e organização dos aplicativos fixados.
- Melhorar recuperação de aplicativos que falham ao carregar.
- Validar fechamento com rascunhos e operações em andamento.

**Entrega:** ciclo completo de janelas e navegação do Desktop validado.

## Etapa 10 — Experiência Mobile e adaptação entre telas

**Áreas:** shell Mobile e comportamento responsivo.

### Revisar

- Home, catálogo, busca e navegação inferior.
- Abertura, retorno e fechamento de aplicativos.
- Rolagem, teclado virtual e áreas de toque.
- Telas estreitas, orientação horizontal e tablets.
- Alternância entre Desktop e Mobile.

### Organizar e desenvolver

- Adaptar tarefas ao celular, além de reduzir dimensões.
- Preservar contexto e alterações ao navegar.
- Melhorar posicionamento de ações e controles.
- Avaliar formas de retornar aos aplicativos em uso.
- Garantir acesso aos recursos essenciais sem depender de hover.
- Conferir limites entre layout Mobile e Desktop.

**Entrega:** experiência mobile completa para as tarefas públicas prioritárias.

## Etapa 11 — Perfil profissional e Sobre Mim

**Áreas:** conteúdo do perfil e aplicativo Sobre Mim.

### Revisar

- Apresentação, formação, objetivos e canais profissionais.
- Tecnologias e competências apresentadas.
- Consistência com currículo, projetos e certificados.
- Clareza e qualidade dos textos nos dois idiomas.
- Globo de tecnologias e alternativa textual.

### Organizar e desenvolver

- Comunicar o tipo de oportunidade buscada.
- Relacionar habilidades a projetos e experiências.
- Avaliar seções de trajetória, experiência ou conquistas.
- Melhorar chamadas para projetos, currículo e contato.
- Evitar listas de tecnologias sem contexto.

**Entrega:** apresentação profissional clara e sustentada por evidências.

## Etapa 12 — Projetos e apresentação dos trabalhos

**Áreas:** catálogo, detalhes, GitHub e conteúdo editorial.

### Revisar

- Origem dos projetos e regras de inclusão.
- Destaques, filtros, ordenação e pesquisa.
- Descrições, tecnologias, imagens e links.
- Leitura e apresentação do README.
- Compartilhamento e navegação entre catálogo e detalhes.

### Organizar e desenvolver

- Selecionar projetos representativos.
- Explicar problema, solução, contribuição pessoal e resultados.
- Reconciliar projetos citados no currículo com o catálogo.
- Melhorar descrição e endereço publicado dos repositórios.
- Avaliar estudos de caso, galeria e links relacionados.
- Diferenciar trabalhos acadêmicos, pessoais e experimentais quando útil.
- Tratar indisponibilidade do GitHub sem perder todo o contexto disponível.

**Entrega:** projetos apresentados como trabalhos profissionais, com contexto e acesso funcional.

## Etapa 13 — Currículo e certificados

**Áreas:** documentos profissionais e catálogo de certificados.

### Revisar

- Conteúdo e atualização do currículo.
- Coerência com as informações do portfólio.
- Documentos, categorias, datas e cargas horárias.
- Pesquisa, filtros, detalhes e visualização.
- Links, downloads e acessibilidade dos documentos.

### Organizar e desenvolver

- Conferir todos os arquivos publicados.
- Melhorar navegação entre certificados e documentos.
- Avaliar links de verificação e filtros adicionais.
- Garantir abertura correta por busca e outros aplicativos.
- Definir processo de atualização e substituição dos documentos.

**Entrega:** documentação profissional atualizada, organizada e acessível.

## Etapa 14 — Dev Insights e visualização de dados

**Áreas:** indicadores de desenvolvimento, contribuições e visualizações.

### Revisar

- GitHub, WakaTime e provedor de contribuições.
- Períodos, cálculos, unidades e atualização.
- Cache, proveniência e disponibilidade.
- Cidade de contribuições e universo de projetos.
- Alternativas textuais às visualizações.

### Organizar e desenvolver

- Conferir se os indicadores são compreensíveis e úteis.
- Separar ausência de dados de falha de consulta.
- Melhorar explicações e exploração dos detalhes.
- Avaliar comparações entre períodos quando os dados permitirem.
- Otimizar visualizações para celular e movimento reduzido.
- Evitar apresentar indicadores como prova automática de produtividade.

**Entrega:** dados confiáveis, contextualizados e acessíveis.

## Etapa 15 — Busca global, navegação e compartilhamento

**Áreas:** indexação, resultados, destinos e URLs.

### Revisar

- Busca por aplicativos, projetos, notas, certificados e configurações.
- Termos parciais, acentos e idiomas.
- Resultados duplicados e priorização.
- Destino e retorno de cada resultado.
- Links compartilhados e entradas inválidas.

### Organizar e desenvolver

- Corrigir abertura de certificados encontrados.
- Preservar termo, filtros e contexto ao retornar.
- Avaliar categorias, sugestões e navegação por teclado.
- Definir quais conteúdos devem ter endereço compartilhável.
- Melhorar estados de carregamento e ausência de resultados.

**Entrega:** busca que encontra e abre o conteúdo correto.

## Etapa 16 — Notas e publicações

**Áreas:** leitura pública e edição de publicações.

### Revisar

- Catálogo, filtros, assuntos e pesquisa.
- Leitura, formatação e navegação.
- Anexos e curtidas.
- Rascunho, publicação, edição e retirada de publicação.
- Revisões e conflitos de alteração.

### Organizar e desenvolver

- Definir a finalidade editorial das notas.
- Melhorar apresentação de artigos e estudos.
- Avaliar prévia, tempo de leitura e conteúdos relacionados.
- Validar comportamento com publicações reais de teste.
- Garantir que rascunhos e anexos privados não sejam expostos.

**Entrega:** ciclo editorial e leitura pública completos.

## Etapa 17 — Arquivos e armazenamento pessoal

**Áreas:** gerenciador de arquivos e persistência local.

### Revisar

- Arquivos locais, documentos estáticos e oficiais remotos.
- Pastas, caminhos, seleção e visualizações.
- Criação, importação, cópia, movimentação e renomeação.
- Lixeira, restauração e exclusão.
- Quotas, conflitos entre abas e armazenamento indisponível.

### Organizar e desenvolver

- Melhorar clareza sobre onde os dados ficam armazenados.
- Avaliar operações em lote e exportação de segurança.
- Revisar pesquisas, filtros e arquivos recentes.
- Medir o comportamento com coleções maiores.
- Separar responsabilidades do componente principal.
- Garantir preservação dos dados em falhas.

**Entrega:** gerenciamento de arquivos previsível e seguro contra perda acidental.

## Etapa 18 — Editor e visualizador de arquivos

**Áreas:** edição de texto, PDF, imagens e propriedades.

### Revisar

- Abertura, edição, salvamento e cópia.
- Alterações não salvas e conflitos externos.
- Busca, substituição e opções de leitura.
- Paginação, zoom, rotação e pesquisa em PDF.
- Links, download e arquivos inválidos.

### Organizar e desenvolver

- Melhorar foco e teclado.
- Avaliar recursos de edição úteis aos formatos suportados.
- Conferir limites de tamanho e mensagens de erro.
- Melhorar experiência de leitura no celular.
- Otimizar carregamento do PDF.
- Garantir que conteúdo de arquivos não seja executado indevidamente.

**Entrega:** edição e leitura completas para os formatos oficialmente suportados.

## Etapa 19 — Contato e solicitações de horário

**Áreas:** canais, formulário, verificação e solicitações privadas.

### Revisar

- Campos, validações, consentimento e mensagens.
- Turnstile e configuração dos ambientes.
- Persistência, duplicidade e resultado incerto.
- Notificação por e-mail.
- Datas, horários e fusos.
- Retenção e tratamento das solicitações.

### Organizar e desenvolver

- Homologar envio em navegador comum e rede móvel.
- Tratar erro e timeout de carregamento da verificação.
- Manter canais alternativos disponíveis.
- Explicar processamento e retenção dos dados.
- Definir tratamento de pedidos antigos.
- Melhorar solicitação de horário sem prometer reunião confirmada.

**Entrega:** contato funcional e comunicação clara sobre o resultado do envio.

## Etapa 20 — Wally e assistência de navegação

**Áreas:** conversa, respostas locais e ações sugeridas.

### Revisar

- Papel do assistente dentro do portfólio.
- Perguntas sugeridas e respostas nos dois idiomas.
- Contexto público utilizado.
- Ações de navegação e preferências.
- Limites, histórico e recuperação de erros.

### Organizar e desenvolver

- Corrigir Habilidades e conferir todos os atalhos.
- Melhorar respostas baseadas no conteúdo do portfólio.
- Avaliar ajuda contextual por aplicativo.
- Tornar capacidades e limitações explícitas.
- Garantir que ações sensíveis tenham os controles adequados.
- Tratar eventual IA remota como escopo separado, com definição de custo, privacidade e segurança.

**Entrega:** assistente útil e coerente com o que oferece.

## Etapa 21 — Terminal e Calculadora

**Áreas:** aplicativos e lógica correspondente.

### Revisar

- Comandos, ajuda, sintaxe e autocompletar.
- Histórico, teclado e mensagens de erro.
- Navegação por comandos e acesso a arquivos.
- Entrada administrativa.
- Expressões, precedência e funções científicas.
- Formatação e histórico de cálculos.

### Organizar e desenvolver

- Alinhar documentação e comportamento dos comandos.
- Melhorar descoberta de comandos e validação de argumentos.
- Avaliar novos comandos úteis ao portfólio.
- Conferir funções matemáticas e domínios inválidos.
- Organizar lógica separadamente da apresentação.
- Preservar credenciais fora do histórico e das saídas.

**Entrega:** ferramentas consistentes com suas funções anunciadas.

## Etapa 22 — Jogos, recordes e rankings

**Áreas:** catálogo e cinco jogos existentes.

### Revisar

- Instruções, controles e acessibilidade.
- Início, pausa, término e reinício.
- Teclado, toque e diferentes telas.
- Visibilidade, minimização e consumo de recursos.
- Recordes locais e ranking público.

### Organizar e desenvolver

- Concluir o ciclo de validação de cada jogo.
- Melhorar controles e feedback de partida.
- Avaliar dificuldade e preferências por jogo.
- Conferir persistência dos recordes.
- Revisar limites e restrições do ranking.
- Adicionar jogos somente após consolidar a qualidade dos existentes.

**Entrega:** cada jogo validado individualmente, com recordes e ranking coerentes.

## Etapa 23 — Configurações e personalização

**Áreas:** preferências globais e por plataforma.

### Revisar

- Aparência, idioma e acessibilidade.
- Wallpaper, enquadramento, cor de destaque e cursor.
- Organização do Desktop e Mobile.
- Persistência, sincronização e valores padrão.
- Restauração das configurações.

### Organizar e desenvolver

- Conferir efeito real de cada controle.
- Melhorar explicações e prévias.
- Definir quais preferências são globais ou específicas.
- Avaliar exportação/importação apenas de preferências.
- Garantir que restauração não apague documentos.
- Conferir migração de preferências antigas.

**Entrega:** personalização consistente e reversível.

## Etapa 24 — Notificações, painéis e widgets

**Áreas:** notificações, controles rápidos, calendário, clima e widgets.

### Revisar

- Origem, prioridade e ciclo das notificações.
- Estados de leitura e Não Perturbe.
- Abertura, fechamento e foco dos painéis.
- Calendário, feriados e eventos públicos.
- Clima e permissão de localização.
- Posicionamento e atualização dos widgets.

### Organizar e desenvolver

- Reduzir notificações sem utilidade.
- Melhorar ações e destinos associados.
- Avaliar seleção manual de cidade como alternativa à localização.
- Conferir organização de widgets em telas diferentes.
- Garantir que eventos públicos não revelem solicitações privadas.
- Revisar timers e consultas periódicas.

**Entrega:** recursos auxiliares úteis e com consumo controlado.

## Etapa 25 — Administração e gerenciamento de conteúdo

**Áreas:** interface administrativa e seus consumidores.

### Revisar

- Acesso, sessão e expiração.
- Publicações, destaques, arquivos e solicitações.
- Filtros, paginação e estados vazios.
- Edição, confirmação, conflitos e exclusões.
- Funcionamento em Desktop e Mobile.

### Organizar e desenvolver

- Melhorar visão geral das tarefas administrativas.
- Facilitar identificação de alterações pendentes.
- Padronizar confirmações e mensagens.
- Avaliar prévia antes da publicação.
- Conferir invalidação dos dados públicos após alterações.
- Garantir autorização no servidor para cada operação.

**Entrega:** gestão de conteúdo funcional e previsível em homologação.

## Etapa 26 — Backend, APIs e serviços privados

**Áreas:** `worker`, `functions` e integrações do servidor.

### Revisar

- Rotas, métodos, parâmetros e códigos de resposta.
- Autenticação e autorização.
- Limites de corpo, origem e frequência.
- Timeouts e falhas dos provedores.
- Respostas públicas e dados privados.
- Cabeçalhos, cache e tarefas agendadas.

### Organizar e desenvolver

- Padronizar contratos de erro e sucesso.
- Melhorar diagnóstico sem expor informações sensíveis.
- Conferir idempotência e operações concorrentes.
- Validar respostas incompletas dos serviços.
- Revisar configuração dos ambientes.
- Preparar verificações de integração em homologação.

**Entrega:** APIs consistentes e resistentes às falhas previstas.

## Etapa 27 — Banco, Storage, migrações e retenção

**Áreas:** PostgreSQL, D1, arquivos remotos e migrações.

### Revisar

- Modelo de dados, índices e restrições.
- RLS, grants, funções e políticas de Storage.
- Migrações e estado efetivamente aplicado.
- Revisões, integridade e vínculos entre registros.
- Arquivos órfãos e falhas parciais.
- Retenção, manutenção, backup e recuperação.

### Organizar e desenvolver

- Executar verificações SQL em ambiente próprio.
- Conferir permissões por perfil e operação.
- Validar upload, publicação, retirada e exclusão.
- Comprovar a execução das rotinas de manutenção.
- Definir procedimento de migração e recuperação.
- Registrar operações que exigem autorização de produção.

**Entrega:** integridade e permissões comprovadas em homologação.

## Etapa 28 — Segurança e transparência de dados

**Objetivo:** revisar a proteção do sistema de ponta a ponta.

### Revisar

- Credenciais, sessões e permissões.
- Validação de URLs, arquivos e conteúdo externo.
- Dependências e recursos de terceiros.
- CSP e demais cabeçalhos.
- Dados enviados por formulários e integrações.
- Logs, retenção e informações públicas.

### Organizar e desenvolver

- Tratar os riscos confirmados.
- Testar CSP progressivamente.
- Melhorar informações de privacidade.
- Conferir ausência de segredos nos arquivos versionados.
- Documentar limites de proteção de rankings e dados locais.
- Criar procedimentos de resposta e recuperação proporcionais ao projeto.

**Entrega:** riscos conhecidos tratados ou registrados com responsável e decisão.

## Etapa 29 — Acessibilidade e internacionalização completas

**Objetivo:** validar o uso real de todos os fluxos.

### Revisar e melhorar

- Operação integral por teclado.
- Ordem, visibilidade e restauração do foco.
- Leitura por tecnologia assistiva.
- Semântica de controles e mensagens dinâmicas.
- Contraste e informações transmitidas por cor.
- Movimento reduzido e transparência.
- Zoom de 200% e 400%.
- Português, inglês, datas e textos longos.
- Alternativas aos conteúdos visuais e interações por arraste.

**Entrega:** fluxos essenciais utilizáveis com as adaptações verificadas e limitações registradas.

## Etapa 30 — Desempenho e confiabilidade

**Objetivo:** medir e melhorar o custo real da experiência.

### Revisar e melhorar

- Carregamento inicial e abertura dos aplicativos.
- Imagens, CSS, JavaScript e PDF.
- Divisão de código por aplicativo e plataforma.
- Renderizações, animações e uso de memória.
- Consultas externas e políticas de cache.
- Coleções locais próximas dos limites.
- Rede lenta, desconexão e retorno da conexão.
- Timers e operações após fechar ou minimizar aplicativos.

**Entrega:** medições antes/depois e melhorias demonstradas, sem depender apenas do tamanho do build.

## Etapa 31 — SEO, compartilhamento e presença profissional

**Áreas:** HTML inicial, metadados e conteúdo público.

### Revisar e desenvolver

- Conteúdo profissional disponível na entrada.
- Título, descrição e URL canônica.
- Imagens e metadados sociais.
- Robots, sitemap e respostas para URLs inexistentes.
- Endereços compartilháveis.
- Dados estruturados adequados.
- Informações do repositório e links profissionais.
- Consistência entre site, currículo e GitHub.

**Entrega:** apresentação profissional bem descoberta e compartilhada.

## Etapa 32 — Testes e homologação integrada

**Objetivo:** comprovar que as partes funcionam juntas.

### Executar e desenvolver

- Revisar testes existentes e suas limitações.
- Cobrir regressões das falhas corrigidas.
- Adicionar testes de navegador para jornadas essenciais.
- Validar integrações e permissões em homologação.
- Conferir navegadores, telas e dispositivos representativos.
- Testar alterações não salvas e operações interrompidas.
- Conferir falhas de rede, armazenamento e serviços externos.
- Executar lint, suíte completa e build.
- Registrar evidências e pendências finais.

**Entrega:** versão candidata validada, com critérios de aceite atendidos.

## Etapa 33 — Organização final, publicação e manutenção

### Revisar e concluir

- Conferir o destino de todos os arquivos do inventário.
- Remover arquivos comprovadamente obsoletos.
- Atualizar documentação, créditos e instruções.
- Revisar alterações de dependências e migrações.
- Identificar versão, commit e configuração da publicação.
- Preparar procedimento de reversão.
- Publicar somente mediante autorização.
- Validar o site após a publicação.
- Associar o deploy ao commit.
- Definir rotina de revisão de links, conteúdo, dependências e serviços.

**Entrega:** versão organizada, documentada e rastreável, com manutenção planejada.

---

## Critério de conclusão do projeto

O projeto está revisado quando:

- Todos os arquivos versionados foram classificados e examinados na etapa correspondente.
- Todas as funcionalidades existentes possuem situação conhecida.
- As funcionalidades novas aprovadas foram implementadas e validadas.
- Os fluxos essenciais funcionam em Desktop, Mobile e teclado.
- Permissões e operações privadas foram verificadas em homologação.
- Problemas restantes estão documentados e foram explicitamente aceitos.
- Documentação, testes e configuração representam o comportamento entregue.
- A versão publicada pode ser associada ao código validado.
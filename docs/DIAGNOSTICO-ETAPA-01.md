# Auditoria do WS OS

Data: 31/10/2026, horário de Brasília. Repositório: https://github.com/warlleyz/ws-os. Produção: https://warlleys.dev/.

## Parecer

O WS OS tem uma base técnica consistente e uma identidade visual própria. A separação entre núcleo, interfaces Desktop/Mobile, aplicativos e serviços é clara. O projeto demonstra competências que vão além de uma página de apresentação: gerenciamento de janelas, persistência local, contratos, autorização no servidor e integração com serviços externos.

Os principais problemas encontrados estão na eficácia como portfólio, no custo de carregamento, em pequenas falhas de navegação e na comprovação operacional. Não encontrei uma vulnerabilidade crítica confirmada no escopo inspecionado. Isso não equivale a certificar a segurança do ambiente de produção ou todos os fluxos administrativos.

Minha recomendação é preservar a arquitetura e a identidade, priorizando a apresentação dos projetos, a entrada do visitante e a redução dos recursos pesados. Não há evidência nesta auditoria que justifique reconstruir o sistema.

Nenhum arquivo versionado foi alterado. Nenhum commit, push, deploy, migração ou escrita remota foi realizado. A instalação e as verificações ocorreram em uma cópia isolada de auditoria. As interações de navegador produziram apenas estados locais de navegação, apresentação, conversa local e cálculo.

## 1. Método e limites

Base examinada: `main`, commit `c7af7834e3774ab29a631b0798d70e8cc59999ad`.

Foram feitas leitura da estrutura, revisão dirigida do código de maior risco, inspeção das configurações e migrações, execução da suíte existente, lint, build, consulta de dependências e navegação no site publicado. Foram inspecionados desktop e uma tela mobile de 390 × 844 px; o tamanho do navegador foi restaurado depois.

O frontend contém 269 arquivos em `src`; existem 61 arquivos na suíte `tests/core`. A revisão foi orientada por arquitetura, funcionalidades e riscos, sem alegar leitura exaustiva de cada linha desses arquivos.

Não foram realizados: autenticação administrativa, alteração de conteúdo, envio de contato, envio de pontuação, uploads, execução de migrações, teste de carga, exploração ofensiva, auditoria do histórico completo do Git ou inspeção das configurações privadas dos provedores. Também não houve ensaio em dispositivos físicos, Safari/Firefox, leitor de tela real ou medição de Core Web Vitals de usuários reais.

O HTML publicado referencia arquivos com hashes diferentes do build local. Variáveis de ambiente e condições de build podem explicar isso; o dado, sozinho, não comprova divergência de código. Não foi possível vincular de forma conclusiva o deploy ao commit auditado. Resultados locais e observações de produção estão diferenciados neste relatório.

## 2. Validações executadas

| Verificação | Resultado atual |
| --- | --- |
| Node/npm | Node 24.19.0 / npm 11.17.0 |
| Instalação | `npm ci --ignore-scripts` concluído com lockfile existente |
| Lint | Aprovado, saída 0 |
| Testes | 554 aprovados; 0 falhas, cancelamentos ou testes ignorados |
| Build | Aprovado, com aviso de chunk acima de 500 kB |
| Estado versionado ao final | Sem alterações |
| GitHub Actions | Execução 42 aprovada no commit auditado |
| Auditoria npm | 6 alertas moderados na cadeia de desenvolvimento; 0 altos/críticos |

A execução remota aprovada está em https://github.com/warlleyz/ws-os/actions/runs/41114138173. O workflow executa instalação, lint, build e testes; não comprova deploy ou homologação dos serviços.

Os 554 testes são uma evidência útil de regressão e contratos. Parte dos testes de interface usa um ambiente próprio de simulação de React e efeitos, conforme `tests/helpers/app-ui.cjs`. Eles não equivalem a 554 testes de navegador, nem medem CSS, renderização real, interação touch ou tecnologia assistiva.

## 3. Estrutura e arquitetura

| Camada | Avaliação |
| --- | --- |
| `src/core` | Centralização coerente de registro, instâncias, navegação, permissões e preferências |
| `src/shells` | Desktop e Mobile separados, compartilhando serviços e contratos |
| `src/features/windows` | Carregamento sob demanda, isolamento de erro por aplicativo e ciclo de vida próprio |
| `src/apps` | Funcionalidades bem identificadas; alguns componentes concentram responsabilidades demais |
| `src/services` | Boa separação de transporte, normalização, cache e contratos |
| `src/services/storage` | Arquivos pessoais em IndexedDB, separados dos oficiais remotos |
| `functions/api` e `worker` | Um backend ativo no Worker, com handlers reutilizados; a pasta `functions` não implica dois servidores ativos |
| `database` | Migrações PostgreSQL e D1 e verificações SQL versionadas |
| `docs` | Material extenso e útil, com inconsistências entre referência atual e registros antigos |

O catálogo possui 17 entradas: 16 públicas e Administração restrita. Currículo é um encaminhamento ao Visualizador. Editor e Visualizador têm natureza contextual e não precisam aparecer como aplicativos independentes no menu.

Pontos positivos concretos:

- Aplicativos são importados sob demanda e possuem `ErrorBoundary` por instância.
- Rotas administrativas verificam usuário e pertencimento a `admin_users` no servidor.
- A sessão administrativa fica em memória, com expiração e invalidação de operações pendentes.
- Há limites de corpo por leitura de stream, validação de origem e Turnstile nas escritas públicas.
- Solicitações privadas usam chave de idempotência e distinguem persistência de notificação por e-mail.
- Revisões condicionais e contratos reduzem conflitos de edição.
- Arquivos oficiais têm limite de tamanho, validação de formato, checksum e transferência mediada.
- Migrações inspecionadas habilitam RLS e restringem funções privilegiadas; o estado aplicado em produção continua não certificado.
- Arquivos pessoais não são enviados ao backend pela arquitetura examinada.
- Há tratamento de armazenamento indisponível, quota, movimento reduzido e preferências de acessibilidade.

## 4. Cobertura funcional no site publicado

| Área | O que foi observado | Limite |
| --- | --- | --- |
| Boot e apresentação | Boot e duas etapas de boas-vindas concluídos | Sem medição de abandono ou velocidade em rede lenta |
| Desktop | Atalhos, abertura de mais de uma janela, fechamento, maximização, minimização e restauração | Arraste e resize extensivos cobertos apenas pela suíte existente e revisão |
| Mobile | Home, catálogo, busca e navegação em 390 px | Sem dispositivo físico ou teste completo de gestos |
| Sobre Mim | Perfil, formação, tecnologias e links internos carregaram | Conteúdo profissional não foi validado contra documentos externos |
| Projetos | 16 resultados, destaque e detalhes do WS OS carregaram | Não foram abertos todos os repositórios externos |
| Dev Insights | GitHub, WakaTime, contribuições e universo de projetos exibidos | Fontes independentes podem ter atualização diferente |
| Currículo | PDF de duas páginas, texto e links presentes; troca de página funcionou | Download e impressão não ensaiados |
| Certificados | 11 certificados e detalhes de um certificado carregaram | Não foi aberto cada um dos 11 PDFs |
| Contato | Canais profissionais e formulário presentes | Turnstile falhou no navegador de auditoria; nenhum envio realizado |
| Arquivos | Home, armazenamento pessoal vazio e 12 documentos oficiais estáticos | Sem criar, editar, mover ou excluir documentos |
| Editor | Código, contratos de texto e suíte inspecionados | Não exercitado com arquivo criado nesta sessão |
| Calculadora | `2+3*4` retornou `14` | Funções científicas verificadas pela suíte, não uma a uma no navegador |
| Jogos | Cinco jogos no catálogo; tela do Snake e ranking carregaram | Não foram concluídas partidas; nenhuma pontuação enviada |
| Notas | Estado vazio adequado, coerente com API | Sem publicação disponível para validar leitura completa, curtida e anexo |
| Terminal | Comando `help` apresentou catálogo e sintaxe | Sem login ou comandos que alterem dados/preferências |
| Wally | Modo local identificado e resposta recebida | Falha do atalho Habilidades, detalhada abaixo; IA remota desativada |
| Configurações | Seções de aparência e acessibilidade inspecionadas | Preferências não foram alteradas para ensaio |
| Sobre o Sistema | Versão, arquitetura, código e créditos presentes | Origem/licenciamento de cada imagem não foi certificado |
| Clima | Mensagem de localização indisponível adequada ao ambiente | Nenhuma permissão de localização concedida |
| Calendário | Mês, dias, feriado e estado sem eventos apresentados | Não foram criados eventos |
| Administração | Leituras sem credenciais recusadas | Fluxos autenticados permanecem fora da validação prática |

### Consultas HTTP em produção

| Recurso | Resposta |
| --- | --- |
| `/` | 200, HTML |
| `/robots.txt` | 200, HTML da aplicação; não um robots.txt |
| `/sitemap.xml` | 200, HTML da aplicação; não um sitemap |
| `/api/posts` | 200, lista vazia |
| `/api/files` | 200, lista remota vazia; os documentos estáticos seguem disponíveis |
| `/api/content?kind=events` | 200, lista vazia |
| `/api/project-highlights` | 200, um ID de destaque |
| `/api/rankings?game=snake` | 200, ranking público |
| `/api/wakatime` | 200, métricas públicas projetadas |
| `/api/admin/status` | 401 |
| `/api/admin/requests`, `/api/admin/files`, `/api/admin/posts`, `/api/admin/content`, `/api/admin/rankings`, `/api/admin/project-highlights` | Todas recusadas com 401; sete rotas administrativas verificadas ao incluir status |

Uma chamada a `/api/content` sem `kind` retornou 400 `INVALID_KIND`, comportamento esperado. Não interpreto listas vazias, IA desativada ou localização negada como defeitos de backend.

## 5. Achados priorizados

Prioridade indica ordem sugerida de atenção, não uma classificação formal de vulnerabilidade. **P1**: alto impacto no objetivo do portfólio. **P2**: correção funcional, confiabilidade ou proteção. **P3**: manutenção e aprimoramento. Há também uma pendência operacional sem diagnóstico geral confirmado.

### A01 — P1: os projetos mais relevantes não recebem apresentação proporcional à qualidade do sistema

**Evidência:** em produção, o destaque é `warlleyz`, repositório de perfil, sem descrição. O WS OS aparece entre os demais projetos com “Sem descrição cadastrada”. Nos detalhes examinados, há link para o repositório, mas não para o site publicado. O catálogo deriva da API do GitHub e `portfolio.projects` está vazio.

**Impacto:** o visitante encontra uma lista de repositórios, com atividades acadêmicas e testes misturados, mas pouco contexto sobre problema, participação pessoal e resultado. O currículo cita Zella e GeoSolar, que não apareceram com esses nomes no catálogo observado. Isso merece reconciliar a apresentação, sem presumir que os repositórios devam ser públicos ou que os projetos não existam.

**Recomendação:** selecionar trabalhos representativos, preencher descrição/homepage no GitHub e complementar os dados editoriais já suportados pelo frontend. Para cada destaque, explicar objetivo, contribuição, decisões técnicas, imagens e resultado. Não é necessário recuperar o sistema de demonstrações removido.

Referências: [conteúdo público](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/content/portfolioContent.js), [serviço GitHub](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/services/githubService.js).

### A02 — P1: entrada do desktop adia a apresentação profissional

**Evidência:** `BOOT_DURATION = 1500`; primeira visita exige duas etapas de apresentação. Ao concluir, o desktop mostra atalhos e wallpaper, sem nome, proposta profissional ou projeto principal em destaque. A home mobile já apresenta o perfil diretamente.

**Impacto:** há trabalho de navegação antes de o recrutador entender quem você é e o que construiu. Trata-se de avaliação de experiência, não de uma taxa de conversão medida.

**Recomendação:** preservar a metáfora de sistema operacional e permitir uma entrada profissional imediata, por exemplo com uma apresentação inicial do perfil ou acesso direto aos projetos. Reavaliar o custo do boot fixo e tornar a personalização opcional em uma futura revisão autorizada.

Referência: [App](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/App.jsx#L34).

### A03 — P1: recursos visuais muito pesados para o papel que exercem

**Evidência local, tamanho bruto:** `snake.jpg` 2,53 MB; wallpapers claros entre 1,81 e 1,85 MB; wallpapers dark verde/violeta entre 1,67 e 1,70 MB. `wally-rosto.svg` tem 1,28 MB e `wally-corpo.svg` 1,27 MB. O rosto SVG contém uma imagem PNG em base64; a extensão SVG não torna esse conteúdo vetorial leve. Outras capas de jogos ficam entre 0,90 e 1,02 MB.

**Impacto:** maior transferência e decodificação, especialmente na primeira visita e em rede móvel. Não afirmo que todos esses arquivos sejam baixados no carregamento inicial.

**Recomendação:** otimizar imagens no tamanho realmente exibido, usar formatos e variantes adequados e remover metadados dispensáveis. Priorizar o mascote usado na apresentação e os recursos que entram no caminho inicial.

### A04 — P2: carga inicial e PDF ainda têm custo elevado

**Evidência do build:** entrada principal 494,79 kB, gzip 150,19 kB; chunk `jsx-runtime` 183,60 kB, gzip 51,04 kB; CSS principal 283,61 kB, gzip 41,89 kB; Visualizador 621,10 kB, gzip 186,55 kB; worker do PDF 1.264,34 kB bruto. O build avisa sobre chunk acima de 500 kB. `App.jsx` importa os dois shells e o CSS global agrega estilos do sistema.

**Impacto:** dispositivos modestos podem pagar mais custo de download, análise e execução. Tamanho de bundle não demonstra travamento, e os arquivos de PDF são carregados sob demanda, o que já é positivo.

**Recomendação:** medir o caminho inicial e a abertura do currículo em aparelho modesto/rede limitada; então avaliar divisão dos shells, CSS por contexto e carregamento do PDF. Evitar mudar limites do aviso apenas para silenciá-lo.

### A05 — P1: conteúdo profissional depende da execução de JavaScript e SEO está incompleto

**Evidência:** HTML inicial tem `#root` vazio, sem conteúdo profissional ou alternativa `noscript`. Metadados básicos existem, mas não há canonical, `og:url`, `og:image`, imagem de Twitter ou dados estruturados. `/robots.txt` e `/sitemap.xml` respondem com HTML 200 devido ao fallback da SPA.

**Impacto:** prévias sociais pobres, ausência de fallback em falha de JavaScript e descoberta de conteúdo menos previsível. Não significa que buscadores sejam incapazes de indexar a página.

**Recomendação:** fornecer apresentação HTML inicial ou pré-renderizada, imagem social e URLs canônicas, além de respostas adequadas para robots e sitemap. Preservar os aplicativos interativos sobre essa entrada.

Referências: [HTML](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/index.html), [Worker](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/worker/index.js).

### A06 — P2: “Habilidades” do Wally não responde ao assunto sugerido

**Reprodução:** abrir Wally Estendido → Habilidades. O próprio aplicativo envia “Quais tecnologias o desenvolvedor utiliza?”. A resposta observada foi a orientação genérica sobre modo local, sem listar tecnologias ou oferecer o destino correspondente.

**Causa no código:** a sugestão existe, mas os padrões de `localWallyAnswer` não contemplam tecnologias/habilidades. O texto “desenvolvedor” também não corresponde ao padrão inglês `developer`.

**Recomendação:** alinhar todas as sugestões visíveis às respostas locais, nos dois idiomas, usando o conteúdo público existente. Adicionar verificação que percorra os atalhos oferecidos ao visitante.

Referências: [atalho](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/apps/wally-extended/WallyExtended.jsx#L33), [respostas locais](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/services/wallyService.js#L50).

### A07 — P2: busca de certificado perde o item selecionado

**Reprodução:** Mobile → Buscar → “Python” → “Aprendendo com Python / Certificados”. O destino observado foi o catálogo inteiro de 11 certificados, sem abrir o certificado e sem aplicar o termo da busca.

**Causa no código:** a indexação de certificados informa apenas o aplicativo; não transmite ID ou filtro, ao contrário dos resultados de projetos e notas.

**Recomendação:** criar o encaminhamento para o certificado selecionado ou aplicar um filtro específico no destino, mantendo retorno à pesquisa.

Referência: [busca](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/features/search/searchService.js#L44).

### A08 — P2: mudanças internas de tela podem perder foco

**Evidência:** ao abrir detalhes de projeto e certificado, a árvore de acessibilidade passou a indicar foco na raiz da página. Ao chegar à última página do PDF, o controle acionado ficou desabilitado e o foco também foi reportado na raiz. A abertura/fechamento das janelas e a minimização mostraram tratamento de foco melhor.

**Impacto:** teclado e leitores de tela podem perder contexto ou precisar reiniciar a navegação. O relato se limita ao comportamento observado; não é uma certificação ou reprovação integral de WCAG.

**Recomendação:** focar título ou região ao substituir catálogo por detalhes e devolver foco ao item de origem no retorno. Tratar paginação quando o controle atual fica indisponível. Validar com teclado e leitor de tela real.

### A09 — P2: contato depende de verificação que falhou neste ambiente

**Evidência observada:** formulário mostrou “Não foi possível concluir a verificação”, ofereceu nova tentativa e manteve Enviar desabilitado. Os canais profissionais alternativos continuaram disponíveis.

**Classificação:** pendência de homologação, não falha universal confirmada. Navegador automatizado, rede e regras do Turnstile podem influenciar o resultado. Nenhum desafio foi contornado ou resolvido e nenhum contato foi enviado.

**Fragilidade estática adicional:** `WallyTurnstile.jsx` espera `window.turnstile` repetindo timer a cada 100 ms. Não há tratamento explícito de erro de download do script nem prazo máximo para essa espera. Se o script for bloqueado antes de criar a API, o componente pode permanecer esperando sem diagnóstico útil.

**Recomendação:** homologar o formulário em navegador comum e rede móvel; conferir hostname/chave e regras do provedor. Acrescentar timeout e erro de carregamento com recuperação e canal alternativo visível.

Referência: [Turnstile](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/features/wally/WallyTurnstile.jsx).

### A10 — P2: transparência sobre dados de contato é insuficiente na interface examinada

**Evidência:** consentimento informa apenas envio para receber resposta. Não foi localizada explicação pública equivalente para retenção, destinatários/processadores, direitos de exclusão e diferença entre arquivos locais e dados remotos. O código estabelece retenção de 180 dias após conclusão/arquivamento; pedidos em outros estados não recebem esse prazo automaticamente.

**Impacto:** visitantes não têm o mesmo contexto que existe na documentação técnica. Solicitações nunca concluídas/arquivadas podem permanecer sem data de expiração por essa regra.

**Recomendação:** explicar finalidade, dados enviados, serviços envolvidos e retenção junto ao formulário; definir tratamento operacional de solicitações antigas ainda abertas. É uma recomendação de transparência e governança; esta auditoria não emite parecer jurídico de conformidade.

Referências: [Contato](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/apps/contact/Contact.jsx), [contrato de solicitações](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/services/privateRequestContract.js), [migração](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/database/migrations/007_private_requests.sql).

### A11 — P2: proteção de conteúdo tem espaço para endurecimento

**Evidência de produção e código:** há `nosniff`, Referrer-Policy e proteção contra incorporação do HTML. A CSP é `base-uri 'self'; object-src 'none'; frame-ancestors 'self'`; ela não restringe origens de scripts ou conexões.

**Impacto:** existe proteção contra algumas classes de abuso, mas menos contenção caso outra falha permita injeção de script. Não foi demonstrado XSS ou bypass de autenticação.

**Recomendação:** mapear recursos externos e testar CSP mais restritiva primeiro em modo de relatório, considerando Turnstile, fontes, GitHub, clima, PDF e o beacon do Cloudflare. Evitar bloquear integrações válidas por tentativa e erro em produção.

Referência: [cabeçalhos do Worker](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/worker/index.js#L123).

### A12 — P2: seis alertas moderados na cadeia de ferramentas

**Evidência:** `npm audit` reportou alerta de amplificação de glob em `minimatch`, propagado por ESLint e seus consumidores. São seis pacotes sinalizados, não seis falhas independentes comprovadas no site. O relatório não trouxe correção automática segura para toda a cadeia.

**Impacto:** exposição principal no ambiente de desenvolvimento/validação; não houve evidência de inclusão dessa ferramenta no bundle público. A consulta não apontou alertas altos ou críticos.

**Recomendação:** acompanhar a correção compatível e atualizar o lockfile em trabalho separado, com regressão do lint e build. Não aplicar downgrade ou `audit fix --force` sem avaliar compatibilidade.

Referência do alerta retornado pelo npm: https://github.com/advisories/GHSA-g3hv-75wg-m249.

### A13 — P2: comprovação de qualidade ainda depende de simulações e verificações manuais

**Evidência:** CI atual cobre lint, build e testes Node. Os testes de UI usam helpers controlados; verificações SQL existem em `database/tests`, mas não são executadas no workflow examinado. Não há etapa de navegador real, orçamento de desempenho ou checagem de acessibilidade nesse workflow.

**Impacto:** fluxos podem passar na suíte e ainda ter falhas de foco, CSS, integração ou configuração em produção. As duas falhas reproduzidas de Wally/busca ilustram uma lacuna funcional, sem desmerecer os testes existentes.

**Recomendação:** poucos ensaios reais, concentrados no primeiro acesso, projeto, currículo, busca de certificado, contato em homologação e fechamento com rascunho. Executar as verificações de banco em ambiente descartável próprio. Não é necessário duplicar toda a suíte em navegador.

Referências: [CI](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/.github/workflows/validacao.yml), [helper de UI](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/tests/helpers/app-ui.cjs).

### A14 — P3: documentação de arquitetura apresenta runtime removido

**Evidência:** `docs/architecture.md`, seção Runtime e assets, ainda afirma que o Worker reúne seis partes de `uzdoom.data` e descreve saves do motor. O Worker atual não contém essa implementação e o README informa a remoção de DOOM/UZDoom. O mesmo documento apresenta baseline histórico de testes sem destacar suficientemente a situação atual em todos os trechos.

**Impacto:** onboarding e manutenção podem partir de premissas erradas, especialmente sobre cabeçalhos e dependências de runtime.

**Recomendação:** manter os checkpoints históricos como históricos e atualizar a referência de arquitetura ao commit vigente, com separação explícita entre evidência antiga e estado atual.

Referência: [arquitetura](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/docs/architecture.md#L67).

### A15 — P3: componentes extensos aumentam o custo de evolução

**Evidência:** `Files.jsx` tem aproximadamente 72 kB; Terminal 33 kB; SettingsSections 30 kB; Projects 28 kB. Arquivos concentram layout, navegação, estados e operações. O domínio local usa `getAll()` em cada transação, inclusive leituras por ID.

**Impacto:** alterações pequenas exigem compreender componentes grandes; coleções locais próximas ao limite de 500 entradas/50 MiB podem tornar operações mais caras. Não foi medido um travamento nesse limite.

**Recomendação:** extrair gradualmente fluxos e componentes por responsabilidade, preservando contratos. Para armazenamento, separar consultas de metadados e conteúdo e medir antes de alterar a estratégia transacional.

Referências: [Arquivos](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/apps/files/Files.jsx), [IndexedDB](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/services/storage/localFilesStorage.js#L80).

### A16 — P3: integrações não usam a mesma política de timeout e cache

**Evidência:** transporte público compartilhado tem timeout de 10 s e cache. Consulta de contribuições e README fazem `fetch` direto com cancelamento de desmontagem, sem prazo máximo próprio. Projetos força revalidação da consulta GitHub a cada montagem, mesmo quando o hook pede cache. Contribuições dependem ainda de um provedor intermediário externo.

**Impacto:** esperas prolongadas e uso desnecessário da quota da API são possíveis; não foi observado esgotamento de quota durante a auditoria.

**Recomendação:** harmonizar timeout, cancelamento, proveniência e revalidação; manter atualização explícita e fallback honesto. Não concentrar todas as fontes em uma falha global.

Referências: [consulta de contribuições](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/services/githubContributionsService.js#L15), [Projetos](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/apps/projects/Projects.jsx#L34).

### A17 — P3: menu contextual nativo é bloqueado em toda a aplicação

**Evidência:** listener de `contextmenu` no documento sempre chama `preventDefault`, sem distinguir links, textos e regiões com menu próprio.

**Impacto:** dificulta ações usuais, como copiar endereço, inspecionar link e usar recursos do navegador. A convenção de desktop beneficia a identidade, mas o bloqueio global alcança áreas que não precisam dele.

**Recomendação:** restringir o bloqueio às regiões que realmente implementam alternativa contextual completa.

Referência: [App](https://github.com/warlleyz/ws-os/blob/c7af7834e3774ab29a631b0798d70e8cc59999ad/src/App.jsx#L127).

## 6. Segurança e dados: conclusões com limites

As leituras administrativas sem token retornaram 401. O código exige verificação de identidade no Supabase e consulta de permissão administrativa; esconder o aplicativo no menu é apenas uma camada adicional. Não encontrei nas partes examinadas uma decisão administrativa baseada em metadado de usuário editável.

As migrações inspecionadas apresentam RLS, privilégios restritos e funções `SECURITY DEFINER` com `search_path` controlado e revogações de execução. Não houve inspeção do catálogo real do banco, dos grants efetivos, das políticas de Storage ou da aplicação completa das migrações. Portanto, a conclusão é sobre o desenho versionado, não sobre a configuração privada efetivamente implantada.

O código usa credenciais de serviço apenas nos handlers examinados, com projeção explícita de dados públicos. URL do projeto, IDs de banco, chave pública do EmailJS e token público de analytics não devem ser classificados automaticamente como segredos. Os campos legados do EmailJS no conteúdo público não tiveram consumidores encontrados no código atual; sua remoção futura seria limpeza, não prova de vazamento de chave privada.

O ranking aceita pontuação produzida pelo cliente, com limite, desafio e limitação de frequência. A própria interface avisa sobre manipulação. Isso é aceitável para entretenimento sem valor competitivo, mas não comprova legitimidade da partida. Além disso, a identidade derivada de IP para o ranking agrupa pessoas na mesma rede e pode mudar quando o IP muda; não equivale a uma conta individual. Nenhum teste de fraude foi executado.

O agendamento de manutenção e a política de retenção estão configurados no código. A execução do cron, o envio real de e-mail, backups, recuperação, expiração/revogação real de sessão e integridade de uploads remotos precisam de ensaio em homologação e evidência operacional.

## 7. Acessibilidade e experiência

Há iniciativas concretas: link para saltar à área principal, rótulos em controles, títulos estruturados em aplicativos, camada de texto no PDF, lista textual alternativa ao globo de tecnologias, opções de reduzir movimento/transparência e isolamento de janelas minimizadas com `inert`. A suíte também verifica contrastes representativos, sem cobrir cada combinação possível de wallpaper e transparência.

Pontos que merecem validação adicional: foco nas transições de detalhes, operação completa de janelas por teclado, controles personalizados anunciados como seleção/checkbox, zoom de 200% e 400%, alto contraste, textos longos em inglês e telas de 320 px. Não foram confirmadas falhas em todos esses itens; são lacunas de homologação.

A versão mobile tem uma vantagem clara: apresenta nome e objetivo profissional antes dos aplicativos. No desktop, o acabamento de sistema operacional ocupa esse espaço. A decisão de produto mais valiosa é aproximar as duas experiências na clareza inicial, sem eliminar a personalidade do WS OS.

## 8. Sequência sugerida para uma futura execução

1. **Apresentação profissional:** corrigir destaque, descrição/homepage dos repositórios e narrativa dos projetos; reconciliar currículo e catálogo.
2. **Entrada e descoberta:** reduzir barreiras de primeiro acesso, garantir HTML inicial útil e metadados sociais; tratar robots/sitemap.
3. **Peso:** otimizar mascote, wallpapers e capas; medir carregamento inicial e currículo em hardware modesto.
4. **Correções reproduzíveis:** Habilidades do Wally, destino de certificados na busca e foco em detalhes/paginação.
5. **Contato e dados:** homologar Turnstile/envio, adicionar recuperação de script e explicar retenção/processamento.
6. **Confiabilidade:** poucos testes reais de navegador, ensaio de banco em ambiente próprio, evidência do cron e rastreabilidade do deploy.
7. **Manutenção:** dependências, CSP gradual, documentação e decomposição dos componentes maiores.

Critérios práticos de conclusão: recrutador identifica perfil e principais projetos sem exploração prolongada; links e detalhes funcionam em desktop/mobile/teclado; contato tem envio comprovado em homologação; erros externos têm recuperação; build e testes continuam aprovados; implantação fica associada a uma versão verificável.

## 9. Feedback final

O projeto já é uma demonstração substancial de engenharia de interface e organização de sistema. A camada técnica está mais desenvolvida que a apresentação editorial do trabalho. Hoje, o maior retorno tende a vir de tornar os projetos, a contribuição pessoal e o contato mais claros e rápidos de alcançar, acompanhado de otimização dos recursos e fechamento das falhas pequenas reproduzidas.

Este relatório registra uma auditoria ampla com evidências atuais e limites explícitos. Não declara homologação integral de produção, segurança absoluta ou ausência de outros defeitos. Nenhuma recomendação foi aplicada ao projeto.

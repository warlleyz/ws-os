<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === WS OS V2 — ETAPA 01: DECISÕES TÉCNICAS E CONTRATOS COMPARTILHADOS === -->

# WS OS V2 — Etapa 01: Decisões técnicas e contratos compartilhados

**Referência:** Documento mestre v0.16.0, Etapa 00 e DEC-FIN-001 a DEC-FIN-029  
**Status:** Contratos da Etapa 01 implementados e validados tecnicamente; aceite do proprietário e homologações externas conforme conclusão 01.6
**Stack existente:** React, JavaScript, Vite, Cloudflare Workers, Supabase, Cloudflare R2 e IndexedDB  
**Método:** Um incremento validado e commitado por parte; execução contínua autorizada pelo proprietário. Traduções exclusivamente na fase final, sem alterações nos JSON nesta etapa.

**Evidências:** [Conclusão e matriz TEC-001–048](ETAPA-01-PARTE-01.6-CONCLUSAO.md). As decisões abaixo mantêm seu texto-alvo; responsabilidades de etapas futuras não significam integração já homologada.

---

<!-- === 1. PRINCÍPIOS ARQUITETURAIS === -->

## 1. Princípios arquiteturais

<!-- ----- TEC-001 — PRESERVAR A ARQUITETURA ATUAL ----- -->

### TEC-001 — Preservar a arquitetura atual

Manter a estrutura:

- `src/core`: estado, registro, ciclo de vida e navegação.
- `src/shells`: Desktop e Mobile.
- `src/features`: funcionalidades compartilhadas da interface.
- `src/apps`: implementação dos aplicativos.
- `src/services`: acesso a dados e integrações.
- `src/shared`: componentes, hooks, utilitários e idiomas.
- `src/styles`: tokens e estilos globais.
- `worker` e `functions`: endpoints e operações protegidas.

Não reconstruir o projeto, migrar para TypeScript ou introduzir bibliotecas apenas por preferência arquitetural.

<!-- ----- TEC-002 — CONTRATOS PÚBLICOS ESTÁVEIS ----- -->

### TEC-002 — Contratos públicos estáveis

Todo contrato compartilhado terá:

- Entradas validadas.
- Saídas previsíveis.
- Identificadores estáveis.
- Erros tipados.
- Responsável pela implementação.
- Consumidores documentados.
- Testes de comportamento e compatibilidade.

Alterações incompatíveis exigirão migração explícita.

<!-- ----- TEC-003 — RESPONSABILIDADES SEPARADAS ----- -->

### TEC-003 — Responsabilidades separadas

O Core não deverá conhecer regras internas de armazenamento, projetos, publicações ou autenticação no banco.

Cada camada terá responsabilidade definida:

- Core: roteamento, instâncias e coordenação.
- Aplicativo: estado editorial e navegação interna.
- Serviço: acesso e transformação de dados.
- Worker: validação, autorização e operações protegidas.
- Banco: integridade, persistência e políticas adicionais.

---

<!-- === 2. PARTE 01.1 — NAVEGAÇÃO E COMUNICAÇÃO ENTRE APLICATIVOS === -->

## 2. Parte 01.1 — Navegação e comunicação entre aplicativos

<!-- ----- TEC-004 — REGISTRO DECLARATIVO DE NAVEGAÇÃO ----- -->

### TEC-004 — Registro declarativo de navegação

O `appRegistry` continuará sendo a fonte de identificação e configuração dos aplicativos.

Adicionar contratos declarativos para:

- Parâmetros aceitos.
- Política de instâncias.
- Capacidade de navegação contextual.
- Comportamento de reutilização.
- Necessidade de autenticação.
- Política de retorno.

Evitar condições específicas como `appId === 'projects'` dentro do gerenciador de instâncias.

<!-- ----- TEC-005 — RESULTADO DE ABERTURA ----- -->

### TEC-005 — Resultado de abertura

Preservar `openApp` para compatibilidade com o código atual.

Consolidar `requestAppOpen` como operação pura que produz:

**Sucesso:**
- `ok: true`
- `instanceId`
- `status`: `opened`, `restored` ou `navigated`, conforme a operação efetiva.

**Falha:**
- `ok: false`
- `error.code`
- `error.message`

Não produzir notificações ou efeitos colaterais dentro de atualizadores de estado React.

<!-- ----- TEC-006 — POLÍTICA DE INSTÂNCIAS ----- -->

### TEC-006 — Política de instâncias

Conforme DEC-FIN-023 B:

- Aplicativos de instância única reutilizam a instância existente.
- Aplicativos multi-instância respeitam a intenção da abertura contextual.
- Uma abertura comum não força novas instâncias quando não necessário.
- A identidade da instância permanece estável durante a navegação interna.

<!-- ----- TEC-007 — VALIDAÇÃO DOS PARÂMETROS ----- -->

### TEC-007 — Validação dos parâmetros

Conforme DEC-FIN-027 B:

- Core valida estrutura, tipos e parâmetros declarados no Registry.
- Aplicativo valida a existência do recurso e suas regras de domínio.
- Worker valida permissões quando houver dados ou operações protegidas.
- Parâmetros desconhecidos são rejeitados nos contratos de navegação contextual.
- Não permitir objetos executáveis, funções ou valores arbitrários como parâmetros de navegação.

<!-- ----- TEC-008 — CONTEXTO DE ORIGEM ----- -->

### TEC-008 — Contexto de origem

Cada solicitação contextual poderá carregar:

- Identificador do aplicativo de origem.
- Identificador opcional da instância de origem.
- Destino e parâmetros validados.
- Identificador da solicitação de navegação.

Origem não é autorização. O contexto não poderá ser usado para conceder permissões administrativas.

Não implementar histórico ilimitado entre aplicativos.

<!-- ----- TEC-009 — RETORNO À ORIGEM ----- -->

### TEC-009 — Retorno à origem

Conforme DEC-FIN-024 A e DEC-FIN-026 B:

1. Se a instância original existir, restaurá-la e focá-la.
2. Se não existir, reabrir o aplicativo público quando apropriado.
3. Não recriar sessões administrativas ou formulários com dados privados automaticamente.
4. Quando o retorno não for seguro, oferecer navegação para uma área pública adequada.
5. No Mobile, preservar o retorno contextual à tela de origem.

<!-- ----- TEC-010 — NAVEGAÇÃO PROTEGIDA ----- -->

### TEC-010 — Navegação protegida

Conforme DEC-FIN-025 B e DEC-FIN-028 B:

Utilizar um contrato compartilhado de proteção para:

- Fechamento.
- Retorno.
- Troca contextual de conteúdo.
- Saída do aplicativo.
- Mudanças que descartem trabalho não salvo.

Fluxo:

1. Solicitar navegação.
2. Consultar proteção da instância.
3. Prosseguir imediatamente quando seguro.
4. Exibir confirmação quando houver alterações pendentes.
5. Cancelamento preserva conteúdo, parâmetros e contexto anteriores.
6. Confirmação executa a ação solicitada uma única vez.

Não salvar automaticamente documentos cuja política aprovada exige salvamento manual.

<!-- ----- TEC-011 — NAVEGAÇÃO INTERNA E RETORNO EXTERNO ----- -->

### TEC-011 — Navegação interna e retorno externo

Manter responsabilidades distintas:

- Navegação interna: responsabilidade do aplicativo e seu handler.
- Retorno externo: responsabilidade da coordenação do Core.

O retorno externo será utilizado quando a navegação interna não consumir a ação ou quando o usuário escolher explicitamente retornar à origem.

<!-- ----- TEC-012 — TRATAMENTO DE ERROS ----- -->

### TEC-012 — Tratamento de erros

Conforme DEC-FIN-029 B:

Utilizar códigos estáveis, incluindo:

- `APP_NOT_FOUND`
- `APP_ACCESS_DENIED`
- `INVALID_OPEN_OPTIONS`
- `INVALID_NAVIGATION_PARAMS`
- `NAVIGATION_TARGET_NOT_FOUND`
- `NAVIGATION_CANCELLED`
- `NAVIGATION_UNAVAILABLE`

Mensagens devem ser traduzíveis.

Falhas não devem destruir a instância atual nem apagar rascunhos.

<!-- ----- TEC-013 — URL E COMPARTILHAMENTO ----- -->

### TEC-013 — URL e compartilhamento

A navegação comum dentro do WS OS não modificará a URL do navegador.

Entradas compartilháveis serão exceções explícitas e validadas, preservando o mecanismo existente de projetos e Notas.

Aplicativos internos não terão URLs independentes obrigatórias.

---

<!-- === 3. PARTE 01.2 — ARQUIVOS, DOCUMENTOS E ANEXOS === -->

## 3. Parte 01.2 — Arquivos, documentos e anexos

<!-- ----- TEC-014 — TRÊS ORIGENS INDEPENDENTES ----- -->

### TEC-014 — Três origens independentes

Definir três classes de recursos:

1. **Arquivo pessoal local:** IndexedDB, pertencente ao navegador do visitante.
2. **Documento oficial estático:** distribuído com o site e identificado por caminho autorizado.
3. **Arquivo oficial gerenciado:** armazenado em bucket privado Cloudflare R2.

Nenhuma dessas classes deverá ser identificada apenas por uma URL genérica.

<!-- ----- TEC-015 — IDENTIFICADORES ----- -->

### TEC-015 — Identificadores

- Arquivos locais mantêm `fileId`.
- Documentos estáticos utilizam identificador de catálogo e caminho autorizado.
- Objetos R2 recebem identificador público de metadados e chave interna de armazenamento.
- Chaves internas do R2 não serão usadas como autorização nem expostas como referência confiável ao cliente.

A interface do Visualizador receberá um descritor validado conforme a origem.

<!-- ----- TEC-016 — ARMAZENAMENTO PESSOAL ----- -->

### TEC-016 — Armazenamento pessoal

Preservar a implementação IndexedDB existente:

- Limite individual atual de 10 MB.
- Limite total local atual de 50 MB.
- Limite atual de 500 itens.
- Controle de revisões.
- Proteção de nomes e operações.
- Persistência local e isolamento do usuário visitante.

Os limites do R2 não alteram automaticamente os limites pessoais.

<!-- ----- TEC-017 — UPLOAD ADMINISTRATIVO ----- -->

### TEC-017 — Upload administrativo

Uploads oficiais exigirão:

- Sessão administrativa validada no servidor.
- Validação de tipo real e extensão.
- Limite de 10 MB por arquivo.
- Identificador gerado pelo servidor.
- Metadados persistidos no banco.
- Armazenamento em R2 privado.
- Status editorial.
- Tratamento de falha parcial.
- Exclusão controlada.

Não confiar em MIME declarado pelo navegador como única verificação.

<!-- ----- TEC-018 — ANEXOS DAS NOTAS ----- -->

### TEC-018 — Anexos das Notas

Tipos inicialmente admitidos:

- PDF.
- TXT e formatos textuais explicitamente suportados.
- PNG.
- JPEG.
- WebP.

Até cinco anexos por publicação e 10 MB por arquivo.

Os anexos serão relacionados à publicação por identificador, sem duplicar binários no banco.

<!-- ----- TEC-019 — PUBLICAÇÃO E ACESSO ----- -->

### TEC-019 — Publicação e acesso

- Rascunhos e anexos não publicados: acesso administrativo.
- Publicações públicas: anexos disponibilizados pelo Worker após validação do estado editorial.
- Arquivos oficiais públicos: acesso autorizado conforme status e política do catálogo.
- Arquivos locais: acesso exclusivo pelo navegador que os possui.

Não disponibilizar bucket R2 público para contornar autenticação.

<!-- ----- TEC-020 — INTEGRIDADE DOS UPLOADS ----- -->

### TEC-020 — Integridade dos uploads

Definir estados técnicos de upload e publicação para impedir referências a objetos inexistentes.

Falhas entre R2 e banco deverão ser detectáveis e recuperáveis.

Objetos órfãos poderão ser removidos por rotina controlada e idempotente.

<!-- ----- TEC-021 — VISUALIZADOR E EDITOR ----- -->

### TEC-021 — Visualizador e Editor

O Visualizador será responsável por leitura e apresentação.

O Editor será responsável por alterações permitidas e persistência.

Documentos oficiais publicados não poderão ser modificados por visitantes.

Não converter o Editor local em uma interface de edição remota sem autorização e contrato específicos.

---

<!-- === 4. PARTE 01.3 — APIS, ERROS E ATUALIZAÇÃO DE DADOS === -->

## 4. Parte 01.3 — APIs, erros e atualização de dados

<!-- ----- TEC-022 — PADRÃO DE RESPOSTAS ----- -->

### TEC-022 — Padrão de respostas

Padronizar respostas novas e evoluções compatíveis dos endpoints existentes.

**Sucesso:**
- `ok`
- `data`
- `meta`, quando necessário.

**Erro:**
- `ok`
- `error.code`
- `error.message`
- `requestId`, quando disponível.

Não alterar imediatamente todos os endpoints legados apenas para uniformizar formato. Adaptadores compatíveis serão utilizados quando necessário.

<!-- ----- TEC-023 — CÓDIGOS DE ERRO COMPARTILHADOS ----- -->

### TEC-023 — Códigos de erro compartilhados

Categorias:

- Validação.
- Autenticação.
- Autorização.
- Recurso inexistente.
- Conflito.
- Limite de requisições.
- Quota.
- Serviço indisponível.
- Timeout.
- Erro interno.

Utilizar códigos estáveis para lógica e tradução; não depender de comparar textos de erro.

<!-- ----- TEC-024 — CONCORRÊNCIA OTIMISTA ----- -->

### TEC-024 — Concorrência otimista

Entidades administrativas editáveis utilizarão revisão ou mecanismo equivalente.

Atualizações apresentarão a revisão conhecida pelo cliente.

Se outra sessão tiver alterado o recurso:

- Rejeitar a gravação conflitante.
- Preservar as alterações locais.
- Informar o conflito.
- Permitir recarregar ou resolver conscientemente.

Evitar sobrescrita silenciosa.

<!-- ----- TEC-025 — IDEMPOTÊNCIA ----- -->

### TEC-025 — Idempotência

Operações com risco de duplicação aceitarão chave idempotente, especialmente:

- Criação de solicitações.
- Processamento de envios.
- Ações sujeitas a repetição por timeout.
- Operações remotas sensíveis apropriadas.

A chave ficará vinculada à operação e ao resultado no servidor.

O cliente não deverá criar um novo identificador para repetir a mesma tentativa incerta.

<!-- ----- TEC-026 — CANCELAMENTO E TIMEOUT ----- -->

### TEC-026 — Cancelamento e timeout

Serviços HTTP utilizarão `AbortController` quando aplicável.

Cada integração terá timeout adequado à sua operação.

Cancelar uma requisição não implica desfazer uma escrita que já tenha sido concluída no servidor.

Por isso, operações de escrita devem permitir consulta e reconciliação do resultado.

<!-- ----- TEC-027 — CACHE PÚBLICO ----- -->

### TEC-027 — Cache público

Adotar mecanismo centralizado para recursos remotos públicos:

- Chaves por recurso e parâmetros.
- Tempo de validade por categoria.
- Deduplicação de consultas simultâneas.
- Revalidação após operações administrativas.
- Estados explícitos para dados antigos.
- Tratamento de indisponibilidade.

<!-- ----- TEC-028 — SINCRONIZAÇÃO ENTRE JANELAS E ABAS ----- -->

### TEC-028 — Sincronização entre janelas e abas

Utilizar notificações locais e `BroadcastChannel` quando disponível.

Mensagens entre abas serão apenas sinais de atualização, sem transportar tokens ou conteúdo privado desnecessário.

Dados remotos serão reconsultados segundo o contrato de cache.

`BroadcastChannel` não substitui autorização nem garante atualização instantânea de todas as sessões.

---

<!-- === 5. PARTE 01.4 — MODELOS COMPARTILHADOS === -->

## 5. Parte 01.4 — Modelos compartilhados

<!-- ----- TEC-029 — SOLICITAÇÕES PRIVADAS ----- -->

### TEC-029 — Solicitações privadas

Modelo mínimo:

- `id`
- `type`
- `name`
- `email`
- `message`
- `requestedAt`, quando aplicável
- `timezone`, quando aplicável
- `status`
- `createdAt`
- `updatedAt`
- `completedAt` ou `archivedAt`, quando aplicável
- `retentionUntil`
- `revision`
- `idempotencyKey` ou referência protegida equivalente

Estados aprovados:

1. `new`
2. `in_review`
3. `awaiting_response`
4. `responded`
5. `completed`
6. `archived`

Histórico mínimo de mudanças administrativas, sem registrar desnecessariamente dados pessoais repetidos.

Reuniões confirmadas e eventos públicos serão entidades distintas.

<!-- ----- TEC-030 — RETENÇÃO ----- -->

### TEC-030 — Retenção

Retenção inicial de 180 dias para solicitações concluídas ou arquivadas.

Registrar o momento que inicia a contagem.

Exclusão antecipada administrativa com confirmação.

Rotina automática para vencimentos, com tratamento de erros e registro operacional mínimo.

Requisitos legais poderão exigir tratamento específico, devidamente documentado.

<!-- ----- TEC-031 — COMUNICAÇÃO EMAILJS ----- -->

### TEC-031 — Comunicação EmailJS

A persistência da solicitação e a notificação por e-mail terão resultados independentes.

O fluxo deverá garantir:

- Não duplicar solicitações em reenvios.
- Não afirmar que um e-mail foi entregue quando a resposta for incerta.
- Não perder solicitações válidas em caso de falha do serviço de e-mail.
- Informar ao visitante o resultado técnico confirmado.

Dados pessoais não devem entrar em logs públicos.

<!-- ----- TEC-032 — EVENTOS PÚBLICOS ----- -->

### TEC-032 — Eventos públicos

Entidade distinta de solicitações e reuniões.

Campos essenciais:

- ID.
- Título.
- Data e horário ou indicação de evento de dia inteiro.
- Fuso aplicável.
- Descrição opcional.
- Status editorial.
- Revisão.
- Datas de criação e atualização.

Somente eventos publicados serão consumidos por painel e widget Calendário.

<!-- ----- TEC-033 — PROJETOS E DEMONSTRAÇÕES ----- -->

### TEC-033 — Projetos e demonstrações

Projeto terá identificador estável, informações públicas, tecnologias, links validados e atributos editoriais de destaque e ordenação.

Demo será um recurso relacionado ao projeto, com modo declarado:

- Integrada.
- Externa.
- Indisponível com alternativa informativa.

Nenhuma origem externa receberá permissões irrestritas automaticamente.

<!-- ----- TEC-034 — PUBLICAÇÕES ----- -->

### TEC-034 — Publicações

Preservar o modelo atual de Notas, acrescentando relacionamento de anexos sem reinventar o CRUD.

Rascunhos, publicações e anexos respeitarão o mesmo ciclo editorial.

Curtidas e contagens públicas deverão tratar atualização concorrente e respostas obsoletas.

<!-- ----- TEC-035 — RANKINGS ----- -->

### TEC-035 — Rankings

Modelo compartilhado para pontuações elegíveis:

- Jogo.
- Identificador de submissão.
- Apelido público validado.
- Pontuação normalizada.
- Data.
- Metadados técnicos mínimos necessários à proteção contra abuso.

O servidor valida limites por jogo.

Turnstile e rate limiting reduzem abuso, mas não tornam confiáveis pontuações calculadas pelo navegador.

Identificadores privados e tokens antiabuso não serão divulgados.

<!-- ----- TEC-036 — PREFERÊNCIAS ----- -->

### TEC-036 — Preferências

Definir modelos versionáveis para:

- Tema e aparência.
- Idioma.
- Acessibilidade.
- Desktop.
- Mobile.
- Widgets.
- Taskbar.
- Preferências específicas dos aplicativos.

Preservar as chaves de armazenamento existentes.

Valores legados deverão ser migrados ou adaptados de maneira explícita e não destrutiva.

Falhas de persistência não poderão apagar arquivos pessoais nem bloquear toda a interface.

<!-- ----- TEC-037 — REDEFINIÇÃO DE PREFERÊNCIAS ----- -->

### TEC-037 — Redefinição de preferências

Reset atuará apenas em chaves permitidas.

Deve preservar:

- Arquivos pessoais.
- Conteúdo salvo pelos aplicativos.
- Credenciais e estado de sessão conforme a política específica.
- Dados que não pertençam ao conjunto de preferências selecionado.

Mostrar confirmação quando houver consequência relevante.

---

<!-- === 6. PARTE 01.5 — SEGURANÇA, SESSÃO E AÇÕES AUTORIZADAS === -->

## 6. Parte 01.5 — Segurança, sessão e ações autorizadas

<!-- ----- TEC-038 — AUTORIZAÇÃO ----- -->

### TEC-038 — Autorização

Autorização administrativa será verificada pelo servidor em toda operação privilegiada.

O frontend poderá ocultar controles, mas nunca será fonte de autorização.

RLS será defesa complementar nos dados armazenados em Supabase.

<!-- ----- TEC-039 — SESSÃO ADMINISTRATIVA ----- -->

### TEC-039 — Sessão administrativa

Preservar a autenticação atual e reforçar:

- Expiração verificável.
- Logout.
- Invalidação de sessões.
- Cancelamento de operações pendentes quando apropriado.
- Proteção de alterações não salvas.
- Ausência de credenciais em logs ou histórico do Terminal.

O token não será persistido indiscriminadamente em armazenamento acessível ao frontend.

<!-- ----- TEC-040 — CATÁLOGO DE AÇÕES ----- -->

### TEC-040 — Catálogo de ações

Criar um contrato extensível de ações utilizado por busca e Wally.

Cada ação declarará:

- ID estável.
- Descrição traduzível.
- Parâmetros validados.
- Capacidade requerida.
- Contextos permitidos.
- Necessidade de confirmação.
- Executor responsável.

O catálogo descreve capacidades. Ele não concede permissões.

<!-- ----- TEC-041 — BUSCA GLOBAL ----- -->

### TEC-041 — Busca global

A busca poderá executar ações registradas, conforme DEC-FIN-006 C.

Ações de navegação serão diferenciadas de alterações de estado.

As operações devem respeitar autenticação e confirmação quando aplicável.

Resultados remotos não poderão produzir comandos executáveis arbitrários.

<!-- ----- TEC-042 — WALLY ----- -->

### TEC-042 — Wally

Conforme DEC-FIN-005 B:

- Navegação pública.
- Pesquisa em conteúdo público autorizado.
- Operações locais reversíveis permitidas.
- Confirmação de ações sensíveis.
- Validação estrutural de argumentos.
- Execução por código confiável, nunca por interpretação direta de texto livre.

Respostas da IA poderão sugerir ações, mas a decisão de executá-las depende do catálogo e da política local.

Não conceder funções administrativas ao Wally por inferência.

<!-- ----- TEC-043 — SEGURANÇA DE DADOS ----- -->

### TEC-043 — Segurança de dados

Aplicar validação de entradas, limites de tamanho, controle de origem, autorização por operação e proteção contra abuso.

Evitar:

- Exposição de objetos privados do R2.
- Traversal de caminhos.
- Uploads executáveis.
- URLs não autorizadas em demos.
- Vazamento de tokens.
- Logs com informações pessoais desnecessárias.
- Execução de comandos vindos de respostas de IA ou dados externos.

---

<!-- === 7. PARTE 01.6 — TESTES, DOCUMENTAÇÃO E CONGELAMENTO === -->

## 7. Parte 01.6 — Testes, documentação e congelamento

<!-- ----- TEC-044 — TESTES DE CONTRATO ----- -->

### TEC-044 — Testes de contrato

Cobrir principalmente:

- Instância única e múltipla.
- Atualização contextual.
- Retorno à origem.
- Navegação cancelada com rascunho.
- Sessão expirada.
- Parâmetros inválidos.
- Acesso administrativo negado.
- Recursos inexistentes.
- Escrita concorrente.
- Reenvio idempotente.
- Dados obsoletos entre abas.
- Limites e permissões dos arquivos.

<!-- ----- TEC-045 — COMPATIBILIDADE ----- -->

### TEC-045 — Compatibilidade

Não modificar indiscriminadamente APIs que já possuem consumidores.

Sempre identificar os consumidores antes de alterar assinatura, formato ou semântica.

Quando necessário, fornecer transição compatível e testes de regressão.

<!-- ----- TEC-046 — DOCUMENTAÇÃO CENTRAL ----- -->

### TEC-046 — Documentação central

`docs/contracts.md` continuará documentando os contratos efetivos.

O presente documento registra as decisões-alvo da Etapa 01.

Após cada implementação:

- Atualizar o contrato correspondente.
- Registrar diferenças entre especificado e implementado.
- Remover afirmações históricas incorretas da seção atual.
- Preservar informações históricas claramente identificadas.

<!-- ----- TEC-047 — ORGANIZAÇÃO ----- -->

### TEC-047 — Organização

Priorizar módulos existentes.

Criar arquivos somente para responsabilidades concretas, como validação de navegação, catálogo de ações ou modelos compartilhados, quando isso reduzir acoplamento ou melhorar testes.

Não criar dezenas de arquivos por convenção.

<!-- ----- TEC-048 — ACEITE ----- -->

### TEC-048 — Aceite

Uma parte estará concluída somente quando:

1. Seus contratos estiverem implementados.
2. Os consumidores relevantes estiverem adaptados.
3. Os testes pertinentes estiverem aprovados.
4. `npm run lint`, `npm run build` e `npm run test` passarem.
5. Os fluxos necessários forem exercitados manualmente.
6. A documentação representar o código existente.
7. O proprietário aprovar o resultado.

A Etapa 01 será encerrada depois de todas as partes concluídas e do commit de consolidação correspondente.

---

<!-- === 8. MATRIZ DE RESPONSABILIDADES POR ETAPA === -->

## 8. Matriz de responsabilidades por etapa

| Decisões | Etapa proprietária da implementação |
|---|---|
| TEC-004 a TEC-013 | Etapas 01 e 04 — Core e navegação |
| TEC-014 a TEC-021 | Etapas 03 e 05 — R2, arquivos e anexos |
| TEC-022 a TEC-028 | Etapa 03 — Backend e serviços |
| TEC-029 a TEC-031 | Etapas 03 e 07 — Solicitações e Contato |
| TEC-032 | Etapas 03 e 12 — Eventos e Calendário |
| TEC-033 | Etapa 06 — Projetos e Demos |
| TEC-034 | Etapa 08 — Notas |
| TEC-035 | Etapa 10 — Jogos |
| TEC-036 e TEC-037 | Etapas 04 e 14 — Preferências |
| TEC-038 e TEC-039 | Etapas 03 e 11 — Autenticação |
| TEC-040 a TEC-042 | Etapas 11 e 12 — Wally e Busca |
| TEC-043 a TEC-048 | Aplicáveis a todas as etapas |

Na Etapa 01, estabilizaremos os formatos, as responsabilidades e os contratos compartilhados. Funcionalidades de domínio e interfaces completas serão encerradas nas respectivas etapas proprietárias, evitando trabalho duplicado.

---

<!-- === 9. DEPENDÊNCIAS EXTERNAS === -->

## 9. Dependências externas

Continuam pendentes de homologação:

- Cloudflare R2.
- Projeto Supabase separado para testes.
- Migrações e políticas RLS.
- Integração real com EmailJS.
- WakaTime.
- Gemini.
- Rankings globais.
- Recursos e licenças do DOOM.

Essas pendências não autorizam simular sucesso de operações reais nem declarar uma integração finalizada.

---

<!-- === 10. ORDEM DE IMPLEMENTAÇÃO MANUAL DA ETAPA 01 === -->

## 10. Ordem de implementação manual da Etapa 01

1. Consolidar Registry e contratos de navegação.
2. Estabilizar abertura contextual, retorno e proteção de rascunhos.
3. Definir descritores de recursos locais, estáticos e R2.
4. Definir contratos de API, erros, concorrência e cache.
5. Estabilizar modelos de solicitações, eventos, rankings e preferências.
6. Definir catálogo de ações, autorização e sessão.
7. Executar testes de contrato e regressão.
8. Atualizar documentação e solicitar aceite.

**Regra final:** nenhuma decisão técnica adicional de rotina exigirá votação. Alterações que modifiquem o escopo, as permissões, a experiência aprovada ou envolvam custos/serviços externos continuarão dependendo de autorização do proprietário.

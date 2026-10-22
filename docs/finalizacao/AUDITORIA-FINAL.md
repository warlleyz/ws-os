# Auditoria — requisitos, organização, traduções e segurança

## Resultado e limites

Auditoria local com correções e validação automatizada concluídas neste bloco. O projeto **não está certificado como 100% concluído**: permanecem requisitos de conteúdo, revisão visual, homologação real e operação. A autorização mais recente do proprietário libera a edição dos JSONs de tradução e a limpeza de arquivos desnecessários, substituindo a proibição anterior de traduzir nesta fase. Nenhum commit, push, deploy, migração ou alteração de credencial foi realizado.

Esta auditoria confronta plano/checkpoints, registro dos 18 apps, textos de interface e resultados dos testes existentes. Não equivale a revisão humana linha a linha de todos os arquivos/decisões DEC, pentest, execução das políticas RLS em banco real ou aceite visual integral. Evidências anteriores permanecem históricas; não foram repetidas para aparentar uma homologação nova.

## Achados corrigidos

| Achado | Correção / evidência |
| --- | --- |
| PDF.js 5.7.284 com alerta alto GHSA-hq66-cqwq-w95j | Atualizado pdfjs-dist para ^6.4.299 e lockfile correspondente. Consulta npm após instalação: zero vulnerabilidades. Motor novo abriu currículo real (uma página, 122 itens textuais) e renderizou canvas 612×792 com a distribuição legacy em Node. Bundle web compilou; isso não substitui validação visual do PDF no navegador. |
| Traduções adiadas aceitas como exceção nos testes | 196 chaves novas em cada catálogo; 1.071 chaves correspondentes em PT-BR/EN. Removida a dispensa nominativa de cobertura, preservados registros históricos. |
| Textos fixos de Arquivos/Visualizador/PDF | Internacionalizados textos JSX, inclusive multilinha, rótulos/placeholder/títulos, origem e erros; datas e tamanhos usam idioma selecionado. Conteúdo pessoal dos documentos não é traduzido. |
| Mensagens dinâmicas fora do catálogo | Incluídas mensagens administrativas, Notas/anexos/likes, autenticação, navegação, armazenamento e serviços. Não foram alterados códigos HTTP ou identificadores dos contratos. |
| Dicas insuficientes em controles de ícone | Treze títulos nativos adicionados a controles do Visualizador/PDF/Mobile, mantendo aria-label e eventos. Outros controles já utilizavam Tooltip/títulos. Dicas nativas são de hover; o nome acessível continua disponível ao teclado/leitor de tela. Não se tornou uma dica a única explicação de ação. |
| Tooltip compartilhado não permitia mover ponteiro até a dica | Dica aceita ponteiro e há intervalo de 150ms ao sair da origem; entrada na dica cancela fechamento. Escape fecha dica antes de propagar ação para app, preservando descrição acessível anterior. Regressão automatizada cobre foco/descrição/Escape. |
| Artefatos sem uso em runtime na raiz | Removidos qq (saída de diff) e diagnostico-codex.patch (patch antigo). Só havia referências históricas/documentais; não eram importados nem usados por build/testes. Cópia recuperável foi preservada fora do repositório, sem apagar evidência única. |
| Organização | Arquivos modificados formatados; não houve redistribuição geral de pastas, dependências novas, alteração de arquitetura ou descarte de alterações existentes. |

Referência primária do alerta: https://github.com/advisories/GHSA-hq66-cqwq-w95j. O alerta depende de configuração de scripting/origem; não foi demonstrada exploração neste portfólio. isEvalSupported=false já existente foi mantido, mas não foi tratado como justificativa para manter versão vulnerável.

## Requisitos: estado após esta auditoria

| Etapa / área | Evidência local | Ainda necessário para aceite integral |
| --- | --- | --- |
| 00 — Escopo | Mestre/plano e decisões preservados | Aceite final do proprietário e resolução de condições abertas |
| 01 — Contratos | Contratos/modelos e testes existentes passam | Homologar consumidores externos nos cenários autorizados; testes não comprovam todos os fornecedores |
| 02 — Design System | Tokens/componentes existentes e lint/build preservados | Matriz visual, contraste/leitor de tela/zoom e movimento reduzido reais |
| 03 — Backend | Worker/APIs, revisões, idempotência, validação negativa e migrações preparadas com testes | RLS por identidades reais, serviços/limitadores remotos, migração 010 conforme histórico real, revogação/rotação documentadas |
| 04 — Core | Registro de 18 apps, instâncias, guardas, janelas e preferências com regressões | Fluidez, ponteiro/toque e transições no navegador/dispositivo real |
| 05 — Arquivos | Dados locais, conflitos/guardas, visualizador/editor, correções de tradução e PDF atualizado | Visualização/duas abas/dispositivos e acesso gerenciado em ambiente autorizado |
| 06 — Profissionais/Demos | Conteúdo versionado, GitHub, desciptores/rotas e fallback | Conteúdo editorial, catálogo/origens de demos reais, GitHub/WakaTime e URLs aprovadas |
| 07 — Contato | Formulário/API privada, consentimento, idempotência e resultado incerto preparados | Turnstile, pedido real, acesso negado a terceiros, retenção e e-mail opcional |
| 08 — Notas | CRUD/status, likes, anexos, autenticação/guardas e mensagens traduzidas | Ciclo real com banco/Storage e prova de acesso negado após despublicação |
| 09 — Calculadora | Regressões de operações, edição/cursor, limites e teclado | Aceite de toque e apresentação |
| 10 — Jogos | Cinco jogos, pausa e recordes, rankings/moderação preparados | Escrita real protegida e DOOM: motor/artefatos licenciados, validação ou decisão explícita de escopo |
| 11 — Terminal/Wally/Admin | Comandos/autenticação/cancelamento e gerenciamento com testes | Sessão/expiração e operações administrativas reais. Wally remoto permanece desligado por decisão do proprietário |
| 12 — Desktop/widgets | Menu, busca, painéis, calendário, clima, quatro widgets e prévias com regressões | Navegador real, privacidade visual das prévias, fontes externas e desempenho medido |
| 13 — Mobile/tablets | Seleção autorizada, guardas, pausa, altura/áreas de toque preparados | Teclado virtual, orientação, safe areas, foco e toque físico |
| 14 — Configurações/Apresentação | Controles, reset/erros, boas-vindas, versão técnica e créditos | Walkthrough com reload/abas, primeira visita e versão/editorial final |
| 15 — Publicação | Workflow sem deploy, metadados, assets e roteiro de homologação | Execução remota do CI, CSP/headers efetivos, domínio/HTTPS/SEO final, backup/restauração, monitoramento/orçamento, rollback e autorização |

As condições acima não foram apagadas nem convertidas em requisitos atendidos pelo número de testes. Checkpoints por etapa continuam sendo a referência detalhada de cada fluxo.

## Traduções: alcance verificável

- Catálogos com as mesmas 1.071 chaves e valores não vazios. Teste verifica tokens posicionais, com uma exceção gramatical documentada: o sufixo plural português de {0} não lida{1} não existe em inglês (unread).
- Teste executa o módulo real de tradução, troca idioma e verifica mensagem de anexo, erro de caminho e página parametrizada. Cobertura de chamadas t() não possui dispensas temporárias.
- Novo teste bloqueia reintrodução de texto JSX simples/multilinha nos três componentes de Arquivos/Visualizador/PDF, com exceção de marca/nome do produto e PDF.
- Conteúdo profissional já usa versões localizadas; marcas, nomes próprios, extensões, atalhos de comandos e texto dos documentos/serviços externos não são traduzidos automaticamente.
- Não afirmar revisão linguística visual completa só porque a cobertura passou: datas, textos longos, mensagens de fornecedor e layout EN precisam do walkthrough do autor.

## Validação final deste bloco

- npm run lint: aprovado.
- npm run build: aprovado.
- npm run test: 490/490 aprovados.
- npm install da versão corrigida consultou o inventário completo: 149 pacotes auditados, zero vulnerabilidades informadas naquele momento. Não é garantia contra falhas desconhecidas, futuras ou de configuração.
- PDF real: abertura, extração e renderização com o motor 6.4.299 aprovadas. Não foi aberto PDF malicioso nem foi executado exploit.
- Prévia HTTP: assets compilados acessíveis sem fallback HTML indevido no ensaio; processo encerrado. A prévia não emula o Worker.
- git diff --check: conferir ao encerrar; nenhuma alteração anterior foi descartada. Segredos/ambientes locais permanecem ignorados; não houve leitura/divulgação de seus valores.

## Arquivos deste ciclo

- Tradução: src/shared/i18n/locales/en.json e pt-BR.json.
- Interface: src/apps/files/Files.jsx; src/apps/file-viewer/DocumentView.jsx e PdfPreview.jsx; src/apps/notes/NotesAdmin.jsx; src/apps/wally-extended/WallyExtended.jsx; src/features/boot/BootScreen.jsx; src/features/widgets/dev-insights/DevInsightsWidget.jsx; src/shells/mobile/Mobile.jsx.
- Dicas: src/shared/components/Tooltip.jsx e Tooltip.css.
- Dependência: package.json e package-lock.json.
- Testes: tests/core/i18n-coverage.test.cjs e tests/core/tooltip-ui.test.cjs (novo).
- Documentação: este relatório, README.md e referência no plano.
- Removidos da raiz: qq e diagnostico-codex.patch. Backup local em C:/Users/warll/.codex/.chatgpt-projects/g-p-6ad22bd42de48191abdaa1311b2ff46f/work/auditoria-backup-artefatos/.

## Continuidade

Priorizar homologação e revisão manual pela ordem do checkpoint 15. Reabrir código quando houver defeito demonstrado; não repetir a reorganização de todo o projeto sem necessidade. Antes do push, revisar o conjunto acumulado de arquivos modificados/não rastreados; esta execução não fez staging nem commits. Sugestão após revisão: fix: corrige seguranca traducoes e acessibilidade das dicas.

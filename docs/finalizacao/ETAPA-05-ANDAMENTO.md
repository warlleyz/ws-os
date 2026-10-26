<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === ETAPA 05 — CHECKPOINT DE EXECUÇÃO === -->

# Etapa 05 — checkpoint de execução

Atualizado em 21/10/2026. Base desta execução: c79fc78.

**Estado: fechamento técnico local concluído; continuidade para a Etapa 06 autorizada pelo proprietário em 21/10/2026.** Este registro permite retomar sem depender do histórico da conversa. As alterações estão salvas no checkout e ainda não foram commitadas.

<!-- === REGRAS PRESERVADAS === -->

## Regras preservadas

- Preservar arquitetura, funcionalidades e armazenamento pessoal em IndexedDB.
- Não alterar produção, executar migrações remotas, contratar/configurar provedores nem fazer commit/push sem autorização.
- Não editar os JSONs de tradução. A tradução completa permanece reservada à fase final por instrução do proprietário; manter t() e registrar as mensagens restantes.
- Não transformar documentos históricos em prova de implementação ou homologação atual.

<!-- === BLOCO 1 — EDITOR: CONCLUÍDO LOCALMENTE === -->

## Bloco 1 — Editor: concluído localmente

- Mensagem da cópia agora reutiliza uma tradução existente e verdadeira: os arquivos pessoais ficam neste navegador. O texto anterior dizia que a cópia seria criada em Meus arquivos, embora a operação preserve a pasta atual quando disponível.
- Identificadores dos painéis e títulos dos diálogos isolados por instância.
- Recarregamento registra o controle de origem antes do diálogo, para restaurar foco ao cancelar.
- Escape do painel de pesquisa não se propaga para outros controles.
- Contagem de bytes usa o idioma ativo.
- Foco inicial na área de texto somente quando sua janela está ativa, sem tomar o foco de outra instância em segundo plano.
- Testes de cópia após movimentação, falha sem perder rascunho, identificação por instância e foco. Contratos de revisão e proteção de alterações não salvas preservados.

<!-- === BLOCO 2 — VISUALIZADOR/PDF: CONCLUÍDO LOCALMENTE === -->

## Bloco 2 — Visualizador/PDF: concluído localmente

- Troca de blob deixa de reutilizar documento/página/erro antigos. PDF válido pode ser aberto após uma tentativa inválida.
- Cancelamento encerra pesquisa antes de solicitar o texto de uma página que já ficou obsoleta.
- Ajuste de largura atrasado é descartado após trocar página/documento/rotação ou desmontar.
- Falha de renderização vinculada à operação correspondente, sem bloquear para sempre operações posteriores.
- Consulta do catálogo gerenciado tem timeout de 15 segundos, incluindo leitura do JSON; limpeza ao desmontar.
- Resposta com tamanho declarado acima do limite tem o corpo cancelado; alternativa de download preservada.
- PDF.js e os contratos fileId, url/name e resource existentes foram preservados.

<!-- === BLOCO 3 — GERENCIADOR E INTEGRAÇÃO: CONCLUÍDO LOCALMENTE === -->

## Bloco 3 — Gerenciador e integração: concluído localmente

- Nome do novo texto validado antes de acrescentar .txt: espaços, ponto, dois pontos e comprimento inválido não geram arquivos artificiais. Extensão .TXT existente não é duplicada.
- Diálogos de operação restringem Tab/Shift+Tab, tratam Escape e devolvem foco à origem; Escape não fecha durante a gravação.
- Retorno de foco não interfere com o Editor aberto pela criação do arquivo.
- Rótulos acessíveis usam traduções existentes e título contextual do diálogo, eliminando as falhas de cobertura sem alterar testes de tradução ou os catálogos.
- Regressões de integridade, lote, conflitos, lixeira, quota, importação, revisão e sincronização existentes continuam aprovadas. Não foi reescrita a camada de dados.

<!-- === VALIDAÇÃO DESTA EXECUÇÃO === -->

## Validação desta execução

- npm run lint: aprovado, sem avisos.
- npm run build: aprovado.
- npm run test: **411 aprovados, zero falhas/cancelamentos/ignorados**; eram 401 na base, com falha de cobertura de tradução.
- git diff --check: aprovado na conferência final.
- Testes específicos: 29 testes de interfaces e 18 de modelo/armazenamento; a suíte completa inclui ambos.
- Edge isolado, bundle compilado, origem localhost e perfil descartável: currículo real renderizado por PDF.js (canvas 612×792, página 1/1), ajuste de largura, rotação e pesquisa com resultado; sem alertas ou exceções nesses fluxos.
- Criação de texto pelo diálogo abriu o Editor com foco na área de texto. Cancelamento de recarregamento por Escape preservou o rascunho e devolveu foco ao botão de origem.
- Oito cenários do serviço real com IndexedDB real e dois contextos: criação/leitura, BroadcastChannel, gravações concorrentes, duplicidade concorrente, renomear/mover/ciclos, importação PNG/PDF e rejeição inválida, lixeira/restauração/purga e persistência após reload. Todos aprovados. Dois contextos da mesma origem não substituem a matriz completa de dispositivos/abas reais.
- Nenhum serviço remoto autenticado, dado pessoal do navegador habitual ou produção foi utilizado. As APIs remotas no servidor isolado respondem indisponível.

<!-- === ARQUIVOS DESTA EXECUÇÃO === -->

## Arquivos desta execução

- src/apps/file-editor/FileEditor.jsx
- src/apps/file-viewer/FileViewer.jsx
- src/apps/file-viewer/PdfPreview.jsx
- src/apps/files/Files.jsx
- tests/core/files-ui.test.cjs
- docs/finalizacao/ETAPA-05-ANDAMENTO.md
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md

Sem alteração nos JSONs, no provedor remoto, nas migrações, nas dependências ou em aplicativos de etapas posteriores. Formatação organizada nos componentes modificados. Scripts e capturas de teste permaneceram fora do repositório.

<!-- === LIMITAÇÕES REGISTRADAS PARA REVISÃO FINAL === -->

## Limitações registradas para revisão final

1. Revisão visual do proprietário: Desktop/Mobile/tablet, Dark/Light, toque físico, leitor de tela e zoom do navegador. Os ensaios desta execução não certificam essa matriz completa.
2. Traduções finais: completar os textos de Files, DocumentView e PdfPreview, incluindo apresentação inicial, caminhos/erros de navegação, histórico/resultados, indicação .txt, rótulos/propriedades do documento e controles/status/erros do PDF. Há textos ainda literais; não chamar PT/EN de integralmente concluído por causa do teste de chamadas t(). Nenhuma chave nova foi adicionada neste bloco.
3. Revalidar o catálogo oficial e download gerenciado no Worker/Supabase autorizado, com indisponibilidade e retirada de acesso. A homologação documentada anteriormente não foi repetida nesta execução. Não aplicar migrações nem ativar flags para contornar esse aceite.
4. Integração de anexos publicados de Notas será exercitada no bloco proprietário (Etapa 08), conforme os contratos; não antecipar seu gerenciamento aqui.

<!-- === RETOMADA EXATA === -->

## Retomada exata

1. Ler este checkpoint e verificar git status/diff, preservando todos os arquivos acima. Não executar novamente os scripts temporários de edição: eles podem acrescentar testes duplicados.
2. Não reabrir os blocos aprovados da Etapa 05 sem defeito demonstrado. O proprietário autorizou encerrar este ciclo e avançar, preservando as limitações acima para revisão final.
3. A Etapa 06 foi iniciada. Consultar ETAPA-06-ANDAMENTO.md. Não confundir o fechamento técnico local da 05 com homologação integral de produção.
4. Não há commit desta execução. Sugestão após revisão/autorização: fix: estabiliza edicao visualizacao e dialogos de arquivos. Push continua com o proprietário.

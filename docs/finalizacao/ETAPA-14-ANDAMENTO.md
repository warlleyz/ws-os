# Etapa 14 — Configurações e apresentação do sistema

## Estado: entrega técnica local validada; walkthrough visual pendente

Planejamento da Etapa 14 e decisões DEC-010/013/107/108/373–378 consultados. Arquitetura e mecanismos de preferências existentes preservados. Não houve commit, push, alteração de tradução, migração ou configuração de produção. Etapa 15 não iniciada.

## Bloco de Configurações

- Conferidos os encaminhamentos existentes de tema, destaque, blur, transparência, intensidade de animações, idioma, acessibilidade, auto-ocultação da Taskbar, densidade Mobile, wallpapers e tamanho/visibilidade/opções de relógio e clima aos respectivos serviços compartilhados.
- Consumidores continuam em App, shells, Taskbar e widgets; não foram criados schemas nem serviços paralelos. Preferências Desktop/Mobile permanecem independentes. As quatro classes de widget já integradas permanecem habilitadas.
- Falha de upload agora informa preservação da imagem anterior; não diz que a imagem rejeitada está ativa na sessão. Falha de exclusão mostra erro de operação. Upload/exclusão não anunciam nem atualizam feedback após a galeria desmontar; a operação de armazenamento autorizada continua sob responsabilidade do serviço.
- Falha de gravação de widget não é apresentada como preferência ativa: esse serviço mantém o estado anterior quando não consegue persistir. Para preferências que efetivamente continuam na sessão, o aviso existente foi preservado.
- Reset permanece com confirmação e cancelamento/Escape, usa a allowlist do contrato e relata falha parcial. Não utiliza clear(), não apaga arquivos pessoais, sessão, conteúdo dos apps, favoritos ou imagens. Testes existentes verificam preservação de posições e falha de armazenamento.
- A implementação de reset informa falhas por categoria; não se introduziu transação global entre preferências. Falha parcial não equivale a rollback de todas as categorias.

## Bloco de apresentação

- Boas-vindas mantém primeiro acesso, botão Começar, Escape e contenção de Tab. Ao desmontar, restaura foco anterior conectado ou procura também o shell Mobile, evitando fallback exclusivo de Desktop.
- Diálogo pode rolar dentro da altura dinâmica disponível em telas baixas/ampliadas; botão principal tem alvo mínimo de 44px.
- Boot preserva duração, status acessível e regras de movimento reduzido existentes. Nome no rodapé usa WS OS; indicador V2 fica na informação de versão, conforme DEC-013.
- Sobre o Sistema conserva versão técnica derivada de package.json (atualmente 0.0.0) e texto de desenvolvimento; não foi inventada versão pública ou lançamento concluído.
- Stack passa a citar React DOM e PDF.js. Créditos oferecem links externos identificados com seta para React/React DOM e Vite (MIT), Lucide (ISC), PDF.js (Apache-2.0); licenças conferidas nos pacotes instalados. Não foi alterada a licença do projeto.
- Evolução/arquitetura e repositório existentes preservados, com organização da formatação do componente. Não se declarou conclusão geral do produto nem homologação das integrações.

## Arquivos deste bloco

- src/apps/settings/SettingsSections.jsx
- src/apps/about-system/AboutSystem.jsx
- src/features/boot/BootScreen.jsx
- src/features/welcome/WelcomeDialog.jsx
- src/features/welcome/WelcomeDialog.css
- tests/core/settings-ui.test.cjs (novo)
- tests/helpers/app-ui.cjs (seleção opcional do componente interno sob teste)
- docs/finalizacao/ETAPA-14-ANDAMENTO.md (novo)
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md (referência ao checkpoint)

## Validação executada

- Testes focados de Configurações: 26/26 aprovados, incluindo sete regressões novas.
- npm run lint: aprovado.
- npm run build: aprovado.
- npm run test: 486/486 aprovados.
- Novas regressões executam componentes reais com hooks/serviços/DOM controlados: confirmação/cancelamento do reset e falha parcial; tema com persistência rejeitada; encaminhamento de idioma/densidade; rejeição de gravação de widget; upload rejeitado e desmontagem; foco/Tab/Escape das boas-vindas; versão e links seguros de créditos.
- JSON de tradução intactos; nenhuma nova mensagem traduzível introduzida. Foram reutilizadas mensagens existentes.

## Revisão posterior pelo autor

- Walkthrough visual de todos os controles nos dois shells/temas, reload e sincronização entre abas; contraste/zoom/leitor de tela e foco em navegador real.
- Boas-vindas em primeira visita e após reload, com armazenamento bloqueado e tela pequena/horizontal. Testes controlados não comprovam geometria, foco nativo nem acessibilidade em aparelho real.
- Conferência editorial da apresentação, versão pública de lançamento e aceitação das licenças/conteúdos antes da publicação. A versão técnica 0.0.0 continua declarada honestamente; não é uma release pública final.
- Pendências reais das etapas anteriores continuam nos respectivos checkpoints. Aceite visual, homologações e publicação pertencem à revisão/Etapa 15; este documento não os declara executados.

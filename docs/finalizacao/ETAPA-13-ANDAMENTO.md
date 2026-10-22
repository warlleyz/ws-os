# Etapa 13 — Mobile e tablets

## Estado: correções de integração validadas localmente; aceite em dispositivos pendente

Decisões DEC-077–088 e DEC-267–301 consultadas. Sem redesign, dependências novas, alterações de tradução, serviços externos, commit ou push. Alterações anteriores preservadas. Wally remoto permanece desativado. Etapa 14 não iniciada.

## Entrega deste bloco

- Seleção e montagem usam a mesma lista de instâncias autorizadas. Administração sem sessão não fornece o cabeçalho nem ocupa a visualização ativa, inclusive em entrada compartilhada/expiração. A autorização efetiva do Core/AppHost permanece responsável pelo acesso; a filtragem do shell não substitui essas proteções.
- Instância removida retorna à Home sem mensagem permanente de carregamento. Carregamento real dos componentes continua no AppHost.
- Aplicativo recebe área limitada pela altura dinâmica, com rolagem interna e cabeçalho/navegação preservados. Cabeçalho aceita títulos longos. Controles principais têm alvo mínimo de 44px; área superior respeita recorte seguro. Grade se adapta ao intervalo de tablet dentro do breakpoint existente, sem rearranjo da Home.
- Abertura, retorno contextual, prioridade do retorno interno e fechamento protegido existentes foram preservados. Navegação principal só muda no callback de fechamento confirmado; cancelamento conserva o aplicativo.
- Instâncias ocultas continuam montadas; jogos ocultos recebem estado pausado. Painéis continuam sobrepostos e exclusivos, sem fechar o aplicativo; Wally continua disponível como aplicativo no Mobile.
- Preferências Mobile permanecem independentes e sincronizadas pelo mecanismo existente. Transição Desktop/Mobile continua usando requestGuardedTransition, sem mudança de URL ou novo mecanismo de persistência.

## Arquivos deste bloco

- src/shells/mobile/Mobile.jsx
- src/shells/mobile/Mobile.css
- tests/core/mobile-shell-ui.test.cjs
- docs/finalizacao/ETAPA-13-ANDAMENTO.md
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md (referência ao checkpoint)

## Validação

- npm run lint: aprovado.
- npm run build: aprovado.
- npm run test: 479/479 aprovados.
- Quatro regressões novas executam o componente real com hooks/Core controlados: instância administrativa inacessível, navegação aguardando confirmação, preservação/pausa das instâncias ocultas e remoção da instância sem carregamento permanente.
- Testes de contratos e transição já existentes continuam passando. Esse ambiente controlado não comprova layout renderizado, toque, teclado virtual ou sessão expirada em serviço real.
- Nenhum novo texto/chave de tradução introduzido.

## Aceite ainda necessário

- Navegador real e celular/tablet: retrato/paisagem, larguras intermediárias, teclado virtual, foco, ações inferiores, safe areas, zoom, temas e leitor de tela. Altura dinâmica é uma correção de CSS, não comprovação de comportamento de todos os teclados móveis.
- Exercitar retorno entre apps, busca, notificações e formulários com confirmar/cancelar; expiração de sessão real sem perder rascunho; transição de shell com conteúdo persistido e URL compartilhada.
- Conferir composição profissional/cartões da Home contra o aceite visual aprovado; não foram adicionados cartões ou redesenhada a apresentação neste bloco.

Não marcar a Etapa 13 como integralmente aceita antes dessas verificações. As etapas anteriores também conservam suas pendências de homologação documentadas.

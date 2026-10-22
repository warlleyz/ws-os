# Etapa 10 — Jogos e rankings

## Estado: blocos técnicos dos cinco jogos e integração local validados; aceite externo condicionado

DEC-105/113, DEC-322, DEC-400/401, DEC-541 e DEC-FIN-008 preservadas. Nenhum commit/push, migração, ativação de serviço ou envio real de pontuação. Etapa 11 não iniciada. Alterações locais das etapas anteriores preservadas.

## Blocos concluídos localmente

| Bloco | Correção e validação |
| --- | --- |
| Recordes | Mescla a melhor marca por jogo, preservando maior pontuação ou menor número de jogadas; eventos de storage sincronizam abas; escuta removida sem assinantes; quota conserva marca em memória e permite nova tentativa; limpeza explícita não é regravada; dados inválidos e zero jogadas de vitória são rejeitados. |
| Snake | Até duas curvas válidas consumidas em passos separados; rejeição de reversão, teclado WASD maiúsculo/minúsculo e toque pelos botões existentes; pausa cancela intervalo; colisão e reinício conferidos. |
| Memória | Terceiro clique bloqueado enquanto resolve um par; pausa cancela a resolução temporizada; retomada e vitória com oito pares exercitadas. |
| Campo Minado | Primeira abertura segura preservada; bandeiras por botão/contexto; controles bloqueados durante pausa/fim; índices inválidos rejeitados no modelo; reinício exercitado. |
| Flappy Bird | Espaço mantido não gera saltos automáticos repetidos; pausa/desmontagem cancelam frame; retomada zera referência de tempo; reinício cancela o ciclo anterior e colisões do modelo continuam verificadas. |
| Paciência | Movimento para base, desfazer e reinício exercitados; ações bloqueadas em pausa; mensagens antigas são limpas em desfazer/reinício; destino inválido informa o erro; movimentos após vitória são impedidos, preservando desfazer. |
| Rankings | Transporte compartilhado com timeout/cancelamento; projeção pública estrita, apelido Unicode e limites compatíveis com a API; clique duplo em envio bloqueado por referência da requisição; confirmação exige accepted=true; sucesso continua visível após atualizar a lista; tentativa incerta mantém apelido/pontuação originais e exige novo Turnstile para reenvio explícito; rejeição posterior não apaga uma incerteza anterior. |

## Ciclo de vida e limites

O registro existente de Jogos usa pauseWhenMinimized=true e o Core transmite executionState=paused. useGamePaused também observa visibilidade do documento; timers/frames são limpos pelos efeitos dos jogos. Nenhum listener global de teclado foi introduzido. Modificadores do sistema não são consumidos pelos tabuleiros de Snake/voo.

Recordes continuam em localStorage, com mesclagem e recuperação entre abas ativas, sem alegar transação distribuída ou sincronização remota. Melhores marcas por menor número de jogadas não aceitam zero como vitória válida.

Rankings continuam restritos a Snake e Flappy e dependem da configuração existente. O banco usa chave por jogo/hash do visitante e só substitui por pontuação maior; reenvios não representam uma fila de eventos. A identidade proporcional baseada no backend não garante unicidade global ou ausência de fraude. O placar produzido pelo browser pode ser adulterado e não foi transformado em resultado confiável por esta tarefa. Moderação permanece no endpoint administrativo existente, com autenticação/seleção da pontuação; o painel correspondente pertence à Etapa 11.

## Validação realizada

- npm run lint: aprovado, sem avisos.
- npm run build: aprovado.
- npm run test: 450 testes aprovados, zero falhas.
- git diff --check: aprovado.
- Doze testes novos: handlers dos cinco jogos, dois cenários de Snake, mesclagem/quota/limpeza de recordes, recorde inválido, validação/retry/cancelamento do ranking e índices inválidos do Campo Minado.
- Teste existente de atualização após envio migrou para o transporte real com apelido válido; preservou as verificações de duas requisições, sinal não cancelado e formulário liberado.
- Testes locais usam efeitos/relógios/DOM/serviços controlados. Não constituem prova de toque físico, renderização em dispositivos reais ou homologação da escrita remota.

## Arquivos da etapa

- src/apps/games/Games.jsx
- src/apps/games/SnakeGame.jsx
- src/apps/games/MemoryGame.jsx
- src/apps/games/MinesGame.jsx
- src/apps/games/FlappyGame.jsx
- src/apps/games/SolitaireGame.jsx
- src/apps/games/gameModels.js
- src/apps/games/gameRecords.js
- src/apps/games/GameRankings.jsx
- tests/core/games-ui.test.cjs (novo)
- tests/core/games.test.cjs
- tests/core/rankings.test.cjs
- tests/core/i18n-coverage.test.cjs (pendências nominativas também para Jogos)
- tests/helpers/app-ui.cjs (suporte controlado à flag de ranking)
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md
- docs/backend/CONFIGURACAO.md
- docs/finalizacao/ETAPA-10-ANDAMENTO.md

## Pendências para aceite integral

1. Homologar leitura/envio/reenvio de ranking com migração existente 006, RLS/RPC, D1, PUBLIC_WRITE_HASH_SALT, TURNSTILE_SECRET_KEY, hostname/action public-write, RANKINGS_ENABLED e VITE_RANKINGS_ENABLED. Nenhuma dessas configurações foi alterada. Não há migração nova.
2. Conferir moderação real autenticada e efeitos do rate limit; testar navegação entre abas reais e falha/recuperação do armazenamento em navegador.
3. Conferir toque, foco, rolagem dos tabuleiros e comportamento ao minimizar/trocar shell nos dois shells em dispositivos reais. As interfaces foram preservadas.
4. DOOM: DEC-FIN-008 determina integração jogável com motor/artefatos de licença compatível, carregamento sob demanda e desempenho validado. Recursos/licenças ainda não fornecidos/validados: DOOM permanece não incluído e a Etapa 10 não é declarada 100% concluída.
5. Traduções abaixo ficam para a fase final. Os dois JSONs permaneceram intactos.

## Traduções adiadas

- PENDENTE_I18N src/apps/games/GameRankings.jsx :: Nenhuma pontuação publicada.
- PENDENTE_I18N src/apps/games/GameRankings.jsx :: Resultado do envio não confirmado. Uma nova tentativa enviará o mesmo apelido e pontuação.

## Continuidade

Próxima implementação: Etapa 11 — Terminal, Wally e Administração, após autorização de avanço. Wally permanece desativado conforme autorização anterior. Não reexecutar scripts temporários, não descartar arquivos locais e não repetir testes sem mudança relevante. Commits só após autorização expressa; sugestão por bloco após revisão: fix: corrige controles e recordes dos jogos; fix: finaliza confirmacao e recuperacao dos rankings

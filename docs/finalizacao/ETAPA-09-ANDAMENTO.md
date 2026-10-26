<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === ETAPA 09 — CALCULADORA === -->

# Etapa 09 — Calculadora

<!-- === ESTADO: IMPLEMENTAÇÃO TÉCNICA VALIDADA LOCALMENTE; ACEITE VISUAL/DE TOQUE PENDENTE === -->

## Estado: implementação técnica validada localmente; aceite visual/de toque pendente

Decisões preservadas: DEC-117 (básica/científica) e DEC-392 (operações locais por toque/teclado, sem backend). Não houve redesign, dependência nova, migração, alteração de tradução ou operação externa. Alterações anteriores preservadas. Nenhum commit/push. Etapa 10 não iniciada.

<!-- === CORREÇÕES REALIZADAS === -->

## Correções realizadas

- Editar, apagar, limpar ou recuperar uma expressão invalida o resultado/erro anterior, evitando exibir uma conta nova com resultado antigo.
- Teclas inserem na posição do cursor e substituem a seleção; apagar remove a seleção ou o caractere anterior, preservando o restante. Limite de 256 caracteres mantido sem truncar o final de uma expressão ao inserir no meio.
- Enter e = calculam. Escape limpa e impede propagação para o shell. Composição de texto é respeitada, sem cálculo prematuro.
- Trocar graus/radianos invalida resultado antigo. Motor rejeita unidade desconhecida, preservando a análise aritmética existente sem eval.
- Histórico ignora entradas vazias e armazenamento excessivo/corrompido. Falha de gravação conserva resultado e histórico da sessão com aviso existente.
- Alvos das teclas têm altura mínima de 44 px; campo e histórico extenso respeitam a largura disponível. Resultado pode ser selecionado para cópia.
- Comentários de seção no padrão aprovado e imports organizados, sem fragmentar o motor.

<!-- === VALIDAÇÃO === -->

## Validação

- npm run lint: aprovado, sem avisos.
- npm run build: aprovado.
- npm run test: 438 testes aprovados, zero falhas.
- Regressões adicionadas: resultado após edição/correção/histórico; posição do cursor/seleção; teclado e composição; graus/radianos; falha/corrupção de histórico; percentuais, símbolos e limites de entrada/unidade.
- Testes aritméticos existentes de precedência, potência associativa, sinais, decimais, funções, divisão por zero e domínio continuam passando.
- Os handlers JSX foram executados com DOM/armazenamento controlados. Isso não equivale à conferência visual e ao toque físico em Desktop/Mobile.

<!-- === ARQUIVOS DESTA ETAPA === -->

## Arquivos desta etapa

- src/apps/calculator/Calculator.jsx
- src/apps/calculator/Calculator.css
- src/apps/calculator/calculatorEngine.js
- tests/core/calculator-ui.test.cjs (novo; sete regressões)
- docs/PLANO-FINALIZACAO-POR-ETAPAS.md
- docs/finalizacao/ETAPA-09-ANDAMENTO.md

<!-- === PENDÊNCIAS LEGÍTIMAS === -->

## Pendências legítimas

- Conferir foco, teclado virtual, zoom de texto, dimensões mínimas e toque nos dois shells em navegador/dispositivo real.
- Traduções existentes foram preservadas e o teste de cobertura passou; nenhuma chave nova foi necessária nesta etapa. Revisão linguística final permanece na fase final do projeto.
- Percentual mantém a regra aprovada e informada na interface: operação pós-fixa que divide por 100 (200+10% = 200,1), sem introduzir regra comercial contextual.
- Histórico continua local, sem serviço remoto nem mudança de contrato de sincronização.

<!-- === CONTINUIDADE === -->

## Continuidade

Próxima: Etapa 10 — Jogos e rankings, um jogo por bloco. Ler o estado Git e o planejamento antes de alterar; preservar todos os arquivos locais. Não reexecutar scripts temporários de edição nem repetir validações sem alterações relevantes. Commit sugerido após revisão: fix: finaliza calculadora e controles responsivos

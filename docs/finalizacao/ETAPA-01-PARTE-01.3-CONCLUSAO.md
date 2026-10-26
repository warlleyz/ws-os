<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === ETAPA 01 — PARTE 01.3: APIS, ERROS E ATUALIZAÇÃO DE DADOS === -->

# Etapa 01 — Parte 01.3: APIs, erros e atualização de dados

Estado: implementada e validada tecnicamente. Referências: TEC-022–028. Trabalho local anterior preservado e completado; nenhuma API remota foi ativada.

<!-- === CONTRATOS E INTEGRAÇÃO === -->

## Contratos e integração

- `apiContract`: envelopes e códigos estáveis; `apiResponseAdapter`: adaptação HTTP/legada sem converter erro em sucesso nem expor detalhes internos.
- `revisionContract`: revisão numérica e conflito sem sobrescrita; endpoints legados continuam usando `updatedAt` como revisão equivalente, sem migração antecipada.
- `idempotencyContract`: mesma chave/operação/escopo, impressão SHA-256 do conteúdo canônico e decisão de reserva atômica/reutilização/reconciliação. Persistência e reserva atômica pertencem ao backend da Etapa 03; o contrato não finge gravá-las no cliente.
- `httpRequestContract`: cancelamento/timeout e execução JSON; escrita enviada com falha é resultado incerto e exige reconciliação, sem retry automático. Cancelar antes de enviar não é escrita incerta.
- `publicCacheContract` e `publicDataService`: limite de 32 entradas, validade por categoria, deduplicação por URL completa (inclui parâmetros), leases por consumidor, revalidação e classificação fresh/stale/expired.
- Invalidação cancela/desassocia a consulta antiga; uma resposta anterior não pode repovoar o cache nem ser entregue como atual.
- BroadcastChannel e fallback storage/foco enviam somente prefixo público permitido e ID de sinal. Nenhum token, formulário ou conteúdo privado atravessa o transporte. Assinaturas e canal são liberados sem consumidores.
- Notas, catálogo de Arquivos, Calendário e busca contextual reconsultam as informações pertinentes; mutações administrativas sinalizam invalidação. GitHub/WakaTime utilizam as categorias apropriadas.
- A superfície existente `{data,source,updatedAt,warning?}` foi preservada e recebe `cacheStatus`/`requiresRevalidation` sem quebrar consumidores.

<!-- === CAUSA E CORREÇÃO DA REGRESSÃO CONHECIDA === -->

## Causa e correção da regressão conhecida

O harness de `portfolio.test.cjs` removia imports ESM, deixando PUBLIC_CACHE_LIMITS e funções dependentes indefinidos. O loader de contratos agora resolve dependências reais em contextos isolados; não houve cópia de constantes para mascarar a falha de produção. Os dois cenários antes falhos passaram.

<!-- === VALIDAÇÃO === -->

## Validação

- Lint e build aprovados; suite completa: 335 testes aprovados, nenhuma falha.
- Regressão específica de cache, envelopes, revisões, idempotência, cancelamento e consumidores executada.
- Edge isolado: dois contextos da mesma origem usando os módulos reais; consulta live, reutilização cache e nova consulta live após BroadcastChannel; um sinal recebido, dado reconsultado e nenhuma exceção JavaScript na coleta. Isto valida o transporte no navegador, não serviços externos.
- APIs usadas nessa checagem eram locais e explicitamente simuladas. Nenhuma escrita de produção ou migração executada.

<!-- === LIMITES E CONTINUIDADE === -->

## Limites e continuidade

Homologação real de endpoints, reserva idempotente persistente e reconciliação de escritas remotas permanecem na etapa proprietária de backend. Não são integrações já concluídas por estes testes de contrato. Próxima parte: modelos compartilhados (01.4).

As traduções JSON não foram modificadas. Mensagens novas de erro/contrato serão relacionadas no relatório consolidado para tradução futura; o mecanismo t() existente permanece.

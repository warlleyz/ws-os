<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.


<!-- === WS OS V2 — ETAPA 01 · PARTE 01.1 === -->

# WS OS V2 — Etapa 01 · Parte 01.1

**Status:** Concluída e validada  
**Escopo:** Navegação e comunicação entre aplicativos

<!-- === IMPLEMENTAÇÕES === -->

## Implementações

- Registry organizado e contratos declarativos de navegação.
- Validação de parâmetros e políticas de reutilização de instâncias.
- Identificação da instância de origem.
- Retorno contextual com fallback seguro.
- Integração da navegação Desktop/Mobile.
- Proteção de alterações não salvas.
- Confirmação de fechamento e navegação.
- Revalidação de operações pendentes.
- Resultados estruturados de abertura.
- Organização dos arquivos modificados e padronização dos comentários.

<!-- === VALIDAÇÕES === -->

## Validações

- ESLint: aprovado.
- Build de produção: aprovado.
- Testes automatizados: aprovados.
- Testes funcionais no navegador: aprovados pelo responsável.

<!-- === PENDÊNCIAS GERAIS === -->

## Pendências gerais

- Atualização consolidada dos catálogos de tradução PT-BR/EN na revisão final.
- Continuação dos contratos compartilhados nas próximas partes da Etapa 01.

<!-- === CONTINUIDADE === -->

## Continuidade

Próxima parte: **01.2 — Contratos de arquivos e recursos**.

Não iniciar a Parte 01.2 antes da retomada do desenvolvimento.


<!-- === AUDITORIA DE CONSOLIDAÇÃO — 19/10/2026 === -->

## Auditoria de consolidação — 19/10/2026

O commit original foi preservado. A Parte 01.6 verificou consumidores e testes de navegação/descritores, corrigiu resultado contextual e cópia profunda de parâmetros, declaratividade da capacidade administrativa e carregadores de testes. Visualizador mantém rotas local/estática e indisponibilidade segura de managed, sem backend R2 antecipado. Evidências, validação completa e limites em [01.6](ETAPA-01-PARTE-01.6-CONCLUSAO.md).

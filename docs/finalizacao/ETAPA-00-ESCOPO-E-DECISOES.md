# WS OS V2 — Etapa 00: Escopo e decisões

**Referência:** Documento mestre v0.16.0  
**Data:** 18/10/2026  
**Situação:** decisões aprovadas; registro documental de encerramento  
**Próxima etapa:** 01 — Contratos e modelos compartilhados

## 1. Objetivo

Consolidar as decisões necessárias à finalização da WS OS V2, preservando o escopo do documento mestre e estabelecendo critérios de conclusão por partes.

Cada etapa deverá ser finalizada funcionalmente, visualmente e tecnicamente, com organização, testes e aceite do proprietário antes do encerramento definitivo.

## 2. Decisões aprovadas

| ID | Alternativa | Decisão |
|---|---|---|
| DEC-FIN-001 | B | Upload administrativo de arquivos oficiais |
| DEC-FIN-002 | B | Anexos de Notas com documentos, textos e imagens |
| DEC-FIN-003 | B | Cloudflare R2 para armazenamento |
| DEC-FIN-004 | B | Solicitações privadas com seis estados, histórico mínimo e exclusão controlada |
| DEC-FIN-005 | B | Wally com navegação, pesquisa pública e ações locais reversíveis autorizadas |
| DEC-FIN-006 | C | Busca global com catálogo extensível de ações e permissões |
| DEC-FIN-007 | B | Widget Calendário com indicadores discretos de eventos públicos |
| DEC-FIN-008 | C — revisão posterior | DOOM jogável integrado ao WS OS, com licença compatível, carregamento sob demanda e desempenho validado |
| DEC-FIN-009 | B | Retenção inicial de solicitações concluídas/arquivadas por 180 dias, observadas as exigências legais |
| DEC-FIN-010 | B | Upload de até 10 MB por arquivo e até cinco anexos por publicação |
| DEC-FIN-011 | B | Bucket R2 privado, com acesso validado pelo Worker |
| DEC-FIN-012 | B | Persistência no banco e notificação EmailJS com resultados independentes e idempotência |
| DEC-FIN-013 | A | Supabase separado para homologação e recursos Cloudflare isolados |
| DEC-FIN-014 | B | Finalização técnica condicionada quando faltar conteúdo profissional |
| DEC-FIN-015 | B | Destaques e ordenação de projetos configuráveis pela Administração |
| DEC-FIN-016 | B | Demos integradas quando viáveis, com alternativa externa |
| DEC-FIN-017 | C | Preservar documentos existentes e permitir substituição administrativa pelo R2 |
| DEC-FIN-018 | B | Aceite funcional e visual obrigatório pelo proprietário |
| DEC-FIN-019 | B | Implementação pronta pode receber commit, mas integração não homologada permanece bloqueada externamente |
| DEC-FIN-020 | A | Migrações executadas manualmente com orientação e autorização |
| DEC-FIN-021 | B | Revisão funcional e visual antes do aceite de cada etapa |
| DEC-FIN-022 | B | Conteúdo profissional fornecido e aprovado por aplicativo |


### Revisão posterior — Supabase Storage (20/10/2026)

**Decisão aprovada:** substituir Cloudflare R2 por Supabase Storage no armazenamento dos arquivos oficiais da WS OS V2.

**Justificativa:** a ativação do Cloudflare R2 exige a configuração de uma forma de pagamento, que não será utilizada neste momento. O Supabase Storage aproveita a infraestrutura já disponível no projeto.

**Decisões revisadas:**

- **DEC-FIN-003:** o provedor de arquivos oficiais passa a ser Supabase Storage.
- **DEC-FIN-011:** utilizar bucket privado `ws-os-official-files`, com autorização e transferência dos arquivos mediadas pelo Cloudflare Worker.
- **DEC-FIN-017:** preservar os documentos estáticos existentes e permitir substituição administrativa por novos recursos armazenados no Supabase Storage.

**Requisitos preservados:**

- Upload administrativo de arquivos oficiais.
- Limite de 10 MB por arquivo.
- Formatos PDF, TXT, PNG, JPEG e WebP.
- Até cinco anexos por publicação.
- Metadados e revisões no PostgreSQL.
- Validação de MIME, assinatura e SHA-256.
- Arquivos pessoais exclusivamente no armazenamento local do navegador.
- Nenhuma exposição da chave de serviço ou acesso público direto ao bucket.

**Infraestrutura confirmada:**

- Projeto Supabase: `ws-os-dev`.
- Bucket: `ws-os-official-files`.
- Bucket privado, com limite de 10 MB e restrição dos cinco tipos MIME.
- Migrações PostgreSQL 005–009 aplicadas anteriormente.

**Estado:** implementação e testes locais em andamento. A homologação real de upload, download, exclusão, permissões e concorrência permanece pendente.

Esta revisão altera exclusivamente o provedor de armazenamento e suas integrações técnicas. Os demais requisitos aprovados permanecem válidos.


## 3. Método de desenvolvimento

- Desenvolvimento manual, orientado passo a passo, sem delegação de implementação ao Codex.
- Codex reservado para auditoria geral ao final do projeto.
- Nenhuma etapa considerada concluída sem verificar todos os requisitos aplicáveis.
- Revisão de funcionalidade, aparência, responsividade, idiomas, acessibilidade e segurança no próprio ciclo.
- Organização de arquivos e CSS durante a implementação.
- Commits por entrega validada.
- Revisão obrigatória pelo proprietário.
- Push realizado pelo proprietário.
- Nenhuma migração remota, publicação ou alteração de produção sem autorização.

## 4. Regras de encerramento

Uma etapa somente poderá receber estado **Concluído** quando seus requisitos aplicáveis estiverem implementados e validados, com evidências dos testes e aceite do proprietário.

Estados admitidos:

- A fazer.
- Em execução.
- Implementado, bloqueado externamente.
- Condicionado.
- Concluído.

Dependências externas não homologadas não serão consideradas concluídas.

## 5. Dependências e insumos

- Supabase de homologação separado: provisionamento e validação pendentes.
- Supabase Storage: bucket privado `ws-os-official-files` configurado; integração e homologação real pelo Worker pendentes.
- EmailJS: entrega real autorizada pendente.
- Gemini/Wally: configuração e homologação pendentes.
- Rankings: banco, limites e proteção contra abuso sujeitos a testes reais.
- Conteúdo profissional: fornecimento e aprovação na etapa de cada aplicativo.
- DOOM: seleção e validação de motor e arquivos redistribuíveis, desempenho e integração jogável pendentes.
- Retenção e privacidade: detalhamento técnico, rotinas de exclusão e tratamento das obrigações legais nas etapas correspondentes.

## 6. Responsabilidade por etapa

| Etapa | Responsabilidade |
|---|---|
| 00 | Escopo, decisões e insumos |
| 01 | Contratos e modelos compartilhados |
| 02 | Design System e componentes compartilhados |
| 03 | Backend, segurança e serviços |
| 04 | Core, janelas e preferências |
| 05 | Arquivos, Visualizador e Editor |
| 06 | Aplicativos profissionais e Demos |
| 07 | Contato e solicitações |
| 08 | Notas e gerenciamento editorial |
| 09 | Calculadora |
| 10 | Jogos e rankings, incluindo DOOM condicionado |
| 11 | Terminal, Wally e Administração |
| 12 | Desktop, Taskbar, busca, painéis e widgets |
| 13 | Mobile e tablets |
| 14 | Configurações e apresentação do sistema |
| 15 | Integração final e preparação de publicação |

A ordem preserva as dependências do plano de conclusão por partes encerráveis.

## 7. Resultado da revisão

As decisões DEC-FIN-001 a DEC-FIN-022 não apresentam conflito direto identificado com o documento mestre v0.16.0.

As novas decisões complementam o planejamento, não substituem requisitos anteriormente aprovados, exceto quando houver revisão explícita posterior.

**Critério de encerramento documental:** arquivo versionado no repositório, commit confirmado e aceite do proprietário.

A Etapa 01 não será iniciada antes desse encerramento.
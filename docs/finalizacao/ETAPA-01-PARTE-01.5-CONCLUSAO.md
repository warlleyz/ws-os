<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === ETAPA 01 — PARTE 01.5: SEGURANÇA, SESSÃO E AÇÕES === -->

# Etapa 01 — Parte 01.5: segurança, sessão e ações

Estado: contratos implementados, consumidores conectados e validação técnica concluída. Referências TEC-038–043.

<!-- === ENTREGAS === -->

## Entregas

- authorizationContract: capacidades e matriz recurso/operação, leitura de rascunhos e solicitações restrita, dados pessoais locais exigindo contexto do próprio navegador, indicação de autorização adicional necessária no servidor.
- actionContract: catálogo extensível com descrição traduzível, esquema, capacidade, contextos, confirmação e executor. Entradas externas não podem fornecer funções ou executores; argumentos confirmados são copiados e capacidade revalidada após confirmação.
- actionService: executores locais confiáveis para navegação, pesquisa pública via callback, tema, ações pessoais reversíveis e reset permitido. Wally não recebe ações administrativas por inferência. O servidor continua revalidando cada operação privilegiada, como antes; papel informado no frontend é somente pré-checagem.
- Busca contextual e sugestões de navegação do painel/app Wally agora passam pelo catálogo. O catálogo não implica que a interface completa de todas as ferramentas futuras do Wally ou ações da busca tenha sido entregue antecipadamente.
- authService: token somente em memória, cancelamento de requisições de autenticação pendentes no logout, timeout/cancelamento do contrato HTTP e compatibilidade com envelopes legados/novos. Um observador com erro não impede expiração ou avisos a outros consumidores.
- createAdminRequestScope vincula operação à versão da sessão e sinal externo; mudança de sessão cancela o escopo. AdminContent utiliza esse mecanismo e descarta respostas de sessão antiga. Rascunhos não são apagados pelo contrato.

<!-- === VALIDAÇÃO === -->

## Validação

Lint/build aprovados; 352 testes aprovados. Cobertura de parâmetros maliciosos, contexto negado, confirmação cancelada, argumentos alterados durante confirmação, revalidação de capacidade, projeção de permissões, expiração/logout/login pendente e acesso negativo às APIs existentes.

Edge isolado: pergunta local ao Wally, acionamento da sugestão Projetos pelo catálogo, abertura confirmada e URL permanecendo /. Nenhuma exceção JavaScript na coleta. Não houve autenticação remota real, escrita em banco, ativação Gemini ou R2.

<!-- === LIMITES DA ETAPA === -->

## Limites da etapa

A implementação integral das ferramentas de domínio e interfaces respectivas pertence às etapas 03/11/12. Supabase/RLS, Turnstile e provedores reais continuam sujeitos à homologação autorizada. Estes contratos não substituem autorização backend nem habilitam serviços.

JSONs de tradução intocados. Descrições do catálogo e mensagens novas serão relacionadas na consolidação 01.6. Próxima parte: auditoria cruzada, documentação e congelamento técnico.

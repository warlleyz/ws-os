# Finalização WS OS V2 — execução controlada

## Referências e precedência

Mestre v0.16.0 e decisões posteriores do pedido de finalização. Nenhuma publicação, push, merge, alteração de produção ou conteúdo profissional inventado é autorizado. Blocos serão commitados localmente após verificações pertinentes. Implementado, configurado e validado externamente são estados diferentes.

Baseline: dbfc24c. Alterações locais recebidas: Files.jsx, Files.css novo e uma linha em apps.css. Preservadas e incorporadas ao bloco do Explorador. Baseline: lint aprovado; 182/185 testes aprovados, três falhas de adaptação à nova interface/traduções.

## Decisões adicionais de Arquivos aprovadas no pedido

- Explorador: Início, Meus arquivos, Oficiais e Lixeira; grade/lista; seleção simples e abertura por duplo clique no Desktop; pesquisa na pasta/global; ordenação persistente; seleção múltipla e operações em lote; contexto, ferramentas e detalhes; última localização válida e composição Mobile.
- Visualizador: ferramentas contextuais, propriedades, zoom/ajuste à janela e leitura Mobile.
- Editor: ferramentas/status, localizar/substituir, zoom/quebra de linha, destaque de sintaxe, salvamento manual e conflitos, Mobile.
- Permanecem: IndexedDB pessoal, escrita oficial protegida, integridade transacional e contratos fileId / url+name.

## Blocos verificáveis

1. Consolidar decisões e incorporar baseline visual do Explorador sem regressões.
2. Completar Explorador/Editor/Visualizador e seus contratos, com testes de integridade.
3. Aplicar Design System nos aplicativos, preservar temas/efeitos e conferir visualmente.
4. Completar busca contextual e entradas compartilháveis em Desktop/Mobile.
5. Completar administração de conteúdo e calendário, preparando políticas/migrações sem aplicá-las.
6. Revisar aplicativos profissionais, conteúdo existente e documentos oficiais; nenhum dado inventado.
7. Completar jogos/rankings e assistência com controles de segurança e configuração explícita.
8. Validar janelas, Taskbar, painéis, widgets, Mobile e Configurações com regressão e navegador.
9. Internacionalização, acessibilidade, testes finais e preparação operacional/CI.

Os registros abaixo serão atualizados com resultados efetivamente obtidos; a lista não é declaração de conclusão.

## Dependências e condições externas

Supabase/RLS e migrações precisam de homologação no banco real autorizado; segredos e bindings não são presumidos válidos por existirem nomes no código. EmailJS exige teste real autorizado de entrega. Gemini não será habilitado automaticamente. DOOM continua condicionado a artefatos/licença autorizados. Não chamar o portfólio completo enquanto houver essas condições ou requisitos implementáveis pendentes.

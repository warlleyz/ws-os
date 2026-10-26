<!-- === REFERÊNCIA HISTÓRICA PRESERVADA === -->

> **Referência vigente:** [Mestre WS OS V2](../WS-OS-V2-MESTRE.md). O conteúdo abaixo preserva decisões e evidências da sua data. A numeração antiga de etapas, autorizações, testes aprovados e descrições de implementação não representam a revisão atual. Decisões posteriores do proprietário prevalecem; não executar instruções antigas automaticamente.

<!-- === ETAPA 15 — INTEGRAÇÃO FINAL E PREPARAÇÃO DE PUBLICAÇÃO === -->

# Etapa 15 — Integração final e preparação de publicação

> Atualização de escopo em 25/10/2026: o catálogo atual tem 17 aplicativos, sem execução de projetos.
> As evidências e contagens abaixo são históricas. Consultar [remoção e validação atual](../REMOCAO-DEMONSTRACOES.md).

<!-- === ESTADO: PREPARAÇÃO LOCAL VALIDADA; REVISÃO E HOMOLOGAÇÃO PENDENTES === -->

## Estado: preparação local validada; revisão e homologação pendentes

Este é o ponto de entrada vigente para retomar o projeto. O mestre e o plano por etapas continuam normativos; os checkpoints anteriores preservam evidências e limitações. Não há certificação de 100%, aceite do proprietário ou publicação. Nenhuma alteração anterior foi descartada. Sem commit/push, migração, DNS, credenciais ou serviços externos nesta execução. Wally remoto permanece desativado.

<!-- === ENTREGAS DESTE BLOCO === -->

## Entregas deste bloco

- README atualizado: 18 registros, runtime Worker com assets, execução reproduzível, separação entre frontend e APIs, documentação existente e limites verdadeiros. Removidos links de entrada para documentos que não existem mais na pasta atual.
- Workflow de qualidade em .github/workflows/validacao.yml: Node 24, npm ci pelo lockfile, lint/build/test; leitura de conteúdo apenas, limite de 15 minutos e cancelamento de execução substituída. Sem deploy, segredos ou permissões de escrita. Execução real do GitHub ainda não homologada e somente ocorrerá depois do push pelo proprietário.
- index.html recebeu título profissional, descrição, tipo/título/descrição Open Graph e cartão summary. Não foi inventado domínio canônico, URL pública de preview ou imagem social; completar após confirmação do domínio e conteúdo.
- Corrigido favicon referenciado mas ausente: public/favicon.svg reproduz os quatro quadrados do SystemIcon/menu existente. Conferência HTTP deixa de receber HTML da SPA no lugar do SVG.
- Arquitetura e contratos recebem aviso de estado vigente; descrições datadas permanecem históricas. Inventário atual e roteiro de continuidade ficam centralizados neste documento para evitar mais documentos concorrentes.

<!-- === EVIDÊNCIAS DESTA EXECUÇÃO === -->

## Evidências desta execução

| Verificação | Resultado / limite |
| --- | --- |
| Runtime local | Node 24.19.0, npm 11.17.0; lockfile preservado, sem dependências novas |
| lint / build / testes | Aprovados; 486/486 testes. Após corrigir apenas o favicon, build e HTTP repetidos, sem rodada desnecessária dos testes inalterados |
| Prévia local compilada | HTTP 200; nove referências locais de JS/CSS/SVG respondem sem HTML indevido; processo encerrado ao finalizar |
| Bundle | Entrada aproximadamente 470,16 kB / 142,96 kB gzip; chunk FileViewer 424,60 kB / 126,64 kB gzip. Medidas de build não são benchmark de fluidez nem Core Web Vitals |
| Segurança negativa | Suíte existente preservada: autorização, métodos/rotas, API sem fallback SPA, revisões, idempotência, armazenamento falho e concorrência, guardas e serviços indisponíveis |
| Segredos | Busca local limitada por padrões comuns de chave privada, GitHub e Google em 384 arquivos rastreados: nenhuma correspondência. .env.local, .dev.vars, .wrangler, dist e node_modules ignorados pelo Git |
| Limite da busca | Não comprova ausência de segredos arbitrários, tokens históricos ou revogação de credenciais; não imprime valores, não acessa arquivos de ambiente nem altera histórico |
| Visual / serviços | Nenhum teste físico, leitor de tela, captura visual, console de navegador real, RLS remota, escrita externa, DNS ou deploy foi executado nesta etapa |

<!-- === MATRIZ DOS 18 APLICATIVOS === -->

## Matriz dos 18 aplicativos

Todos têm implementação registrada. “Local” significa evidência dos checkpoints/testes, não aceite integral visual ou externo. A matriz visual transversal abaixo aplica-se a todos.

| Aplicativo | Evidência / condição para aceite |
| --- | --- |
| Sobre Mim | Etapa 06: conteúdo versionado e ações; revisar texto e links profissionais |
| Projetos | Etapa 06: filtros, catálogo/GitHub; aprovar destaques, descrições e imagens reais |
| Dev Insights | Etapas 06/12: dados/cache/indisponibilidade; homologar GitHub/WakaTime sem métricas fictícias |
| Currículo | Etapas 05/06: documento/Visualizador; aprovar PDF e disponibilidade oficial |
| Certificados | Etapas 05/06: catálogo/descritores/visualização; aprovar conteúdo e links de validação |
| Contato | Etapa 07: solicitações privadas e retry explícito; homologar Turnstile/persistência e e-mail opcional |
| Notas | Etapa 08: CRUD, publicação/likes/anexos; homologar ciclo real e retirada de acesso após despublicação |
| Arquivos | Etapa 05: IndexedDB, operações e proteção; confirmar catálogo oficial e uso físico nos shells |
| Visualizador de Arquivos | Etapa 05: texto/imagem/PDF/download; conferir documentos reais e indisponibilidade gerenciada |
| Editor de Arquivos | Etapa 05: salvar/cópia/conflito/guardas; exercitar duas abas e ações de descarte em navegador real |
| Calculadora | Etapa 09: operações, teclado/cursor e limites; conferir toque e apresentação |
| Jogos | Etapa 10: cinco jogos e pausa/recordes; rankings reais pendentes. DOOM condicionado, não incluído |
| Terminal | Etapa 11: comandos, origem, histórico sem senha, cancelamento; homologar autenticação/expiração real |
| Wally Estendido | Etapa 11: conversa local/cancelamento; remoto intencionalmente desligado, sem promessa de IA ativa |
| Administração | Etapas 08/11: posts, conteúdo, solicitações, oficiais e moderação; homologar CRUD privado com identidades reais |
| Configurações | Etapa 14: serviços consumidores, reset/erros; walkthrough de persistência, sincronização e falhas parciais |
| Sobre o Sistema | Etapa 14: versão técnica/créditos; aprovar versão pública, editorial e licenças |
| Visualizador de Demos | Etapa 06: descritor/origem/limites; catálogo/origens autorizadas ainda vazios, requer demo real fornecida |

<!-- === ROTEIRO DE REVISÃO MANUAL, EM ORDEM === -->

## Roteiro de revisão manual, em ordem

1. **Conteúdo e traduções:** aprovar currículo/certificados/perfil/projetos/demos. Traduções JSON permanecem intocadas conforme instrução do autor; consolidar PENDENTE_I18N dos checkpoints 08/10/11/12 e textos literais de Arquivos/PDF documentados na 05. Executar a fase de tradução separadamente quando autorizada; teste de chamadas t() não comprova PT/EN completos.
2. **Interface:** Desktop/Mobile/tablet, Dark/Light, PT/EN quando traduzidos, retrato/paisagem, largura intermediária e zoom 200%. Abrir cada app, verificar vazio/carregando/erro/offline, tabulação e foco visível, Escape, leitor de tela, contraste e movimento reduzido. Registrar dispositivo/navegador, resultado e defeito concreto no checkpoint proprietário.
3. **Dados locais:** criar/importar/editar/mover/lixeira/restaurar/excluir, quota e duas abas; confirmar/suspender/cancelar fechamento e troca de shell com rascunho. Reload preserva dados autorizados e não restaura janelas. Não limpar o navegador habitual para testar: usar perfil/origem isolados.
4. **Core e shell:** arrastar/resize/snap/maximizar/restaurar e múltiplas instâncias; agrupamento/prévias, menu/busca, overlays/foco e quatro widgets; testar teclado virtual e áreas seguras. Medir fluidez e console no navegador, sem alegar desempenho com base apenas no build.
5. **Backend em homologação autorizada:** login/logout/expiração e visitante/usuário comum/admin; publicações e anexos, pedidos privados, upload/download oficiais, idempotência/revisão, likes, ranking e moderação. Consultar WORKER.md, CONFIGURACAO.md e entrega 03/04; evidências anteriores de homologação não foram repetidas agora.
6. **Produção, somente após aceite:** conferir migrações efetivamente aplicadas, restaurar backup em ambiente isolado, documentar flags/segredos/limites, publicar com autorização e executar smoke/rollback controlados.

<!-- === PORTÕES EXTERNOS E OPERACIONAIS ANTES DE PUBLICAR === -->

## Portões externos e operacionais antes de publicar

- **Migrações:** PostgreSQL 001–010 em database/migrations e D1 001–004 em database/d1/migrations preparados. A entrega 03/04 registra 005–009 no ambiente dev e pendência da 010; confirmar histórico real antes de qualquer aplicação, sem repetir cegamente. Nenhuma aplicada nesta etapa.
- **Credenciais:** a entrega 03/04 registra necessidade de rotação/revogação de credenciais/sessões anteriormente expostas. Essa pendência continua aberta até evidência do responsável; a busca local sem correspondências não a resolve.
- **Serviços:** homologar Storage privado, RLS por identidade, Turnstile/limitadores, pedidos/retentativas, ranking, WakaTime/GitHub conforme configuração; entrega EmailJS é opcional à persistência. Wally remoto não será reativado automaticamente.
- **DOOM:** exige motor/artefatos redistribuíveis e validação ou decisão explícita sobre escopo. Não marcar Jogos como 100% enquanto a condição aprovada estiver sem resolução.
- **Cabeçalhos/CSP/cache:** Worker já separa APIs de assets e erros usam no-store/nosniff; não há política CSP de assets versionada neste checkout. Levantar origens reais de Turnstile, imagens/demos e provedores antes de formular CSP; testar primeiro em homologação/Report-Only. Conferir headers efetivos de HTML/API/arquivos, cache de dados privados e revogação de acesso. Nenhum header/configuração de produção foi alterado para presumir esse aceite.
- **Dependências/licenças:** créditos dos pacotes utilizados foram preparados na 14. Auditoria atual de vulnerabilidades por advisories externos e inventário/licenças transitivas ainda pendentes; não houve consulta a registry nem atualização automática de pacotes nesta execução.
- **Domínio/SEO:** confirmar domínio final e HTTPS, redirects/SPA, canonical/og:url, imagem social e conteúdo público aprovado. Não assumir que o domínio planejado já está configurado.
- **Operação:** definir responsável, alertas de erro, métricas sem conteúdo privado, orçamento/cotas e retenção; testar backup/exportação e restauração. Plano de rollback deve indicar versão de frontend/Worker conhecida, flags e compatibilidade com schema; rollback de código não reverte banco. DNS/segredos/banco exigem autorização separada.
- **Git:** alterações acumuladas seguem modificadas/não rastreadas e precisam de revisão/staging explícito, sem incluir ambientes/temporários. Os arquivos rastreados qq e diagnostico-codex.patch já existiam; revisar pertinência antes do envio, sem remoção automática. Nenhum commit foi feito nesta execução.

<!-- === INVENTÁRIO DESTE BLOCO E CONTINUIDADE === -->

## Inventário deste bloco e continuidade

Criados: .github/workflows/validacao.yml, public/favicon.svg e este checkpoint. Alterados: index.html, README.md, docs/architecture.md, docs/contracts.md e docs/PLANO-FINALIZACAO-POR-ETAPAS.md. Nenhuma alteração de contrato, banco, configuração remota ou tradução.

Não há Etapa 16 prevista: continuar pela revisão manual acima, corrigindo apenas defeitos demonstrados no bloco correspondente e registrando evidências. Não reexecutar scripts temporários de edição. A revisão integral dos requisitos DEC continua aberta: esta matriz não substitui uma auditoria linha a linha de todas as decisões nem comprova os aceites pendentes. Não declarar o projeto 100% ou pronto para produção até cumprir os portões.

Sugestão de commit após revisão/autorização: test: consolida validacao final e preparacao de publicacao. Push e publicação permanecem com autorização do proprietário.

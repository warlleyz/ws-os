# WS OS — progresso da conclusão funcional

Atualizado em 15/10/2026. Documento de continuidade desta execução, iniciado sobre `7bb8a15`.

## Regras e preservação

O usuário autorizou implementar o máximo possível, fazer commits por blocos e registrar o restante. Sem push ou deploy automático. Preservar dados locais, arquitetura e stash R3.3. Os três arquivos inicialmente modificados pelo usuário (Settings.css, Window.css e Window.jsx) serão mantidos fora dos commits desta execução, salvo autorização específica posterior.

Não confundir componente integrado com app completo, nem configuração preparada com serviço validado em produção. Conteúdo pessoal não será inventado.

## Conteúdo editável

`src/content/portfolioContent.js` centraliza perfil, trajetória, interesses, currículo estruturado, certificados, projetos selecionados, arquivos oficiais e configuração pública das integrações. Os arrays vazios são ausência de conteúdo, não exemplos apresentados como reais. Textos aceitam string ou objeto pt-BR/en. Credenciais privadas jamais entram nesse arquivo.

## Blocos desta execução

| Bloco       | Estado                                  | Escopo                                                                 |
| ----------- | --------------------------------------- | ---------------------------------------------------------------------- |
| A2          | Implementado com dependências pendentes | Projetos, Demos, Dev Insights e serviços de leitura/cache/cancelamento |
| A3          | Implementado; envio externo pendente    | Calculadora e Contato                                                  |
| A5          | Não iniciado                            | Arquivos locais, editor e integração ao visualizador                   |
| Demais apps | Não iniciado                            | Conforme capacidade desta execução; registrar entrega e limites        |
| Temas v1    | Referência localizada                   | Comparar e adaptar vidro/blur preservando controles e acessibilidade   |

## Dependências externas

- GitHub público pode funcionar sem chave; rate limit e falhas recebem feedback. Cache é da sessão, com limite de entradas e fallback de até 24 horas; conteúdo institucional não depende do serviço.
- WakaTime exige endpoint próprio configurado. Não expor API key no cliente. A UI distingue não configurado, erro e dados reais.
- EmailJS/Supabase/IA/auth/rankings exigem contas e configuração/validação próprias. Nenhuma submissão real a terceiros será feita nos testes sem necessidade/autorização.
- DOOM depende de licença e distribuição autorizada.

## Aceites pendentes do projeto

Conteúdo definitivo; configurações externas; ensaios físicos de toque/leitor de tela/zoom; reprodução do resize nativo nas bordas do monitor; revisão de segurança e publicação. Esta lista será detalhada ao final com os blocos realmente entregues.

## A2 — entrega funcional

Projetos tem catálogo local + GitHub público paginado (até 1000), pesquisa por texto/tecnologia, ordenação e detalhes. Demos valida IDs cadastrados, modos e origens permitidas, com sandbox restrito e alternativa externa. Dev Insights mostra dados verificados do GitHub e leitor WakaTime dependente de endpoint próprio. Não há dados WakaTime inventados.

Cache compartilhado por URL com cancelamento por consumidor, timeout e fallback identificado. Fechar um app não cancela outro consumidor. Retorno interno Mobile por instância foi acrescentado. Sobre Mim, Currículo e Certificados passam a consumir o conteúdo centralizado.

Validação: lint/build e 75 testes aprovados. Navegador consultou GitHub real: 14 repositórios, 1 estrela e 2 seguidores no momento do ensaio; pesquisa SnakePy/detalhes funcionaram, Insights reutilizou cache; voltar no Mobile retornou ao catálogo interno. Console sem erros/warnings. Esses números são evidência datada, não conteúdo fixo. Embed real e WakaTime precisam de descritores/origens/dados autorizados para validação ponta a ponta.

Referências técnicas consultadas: documentação oficial REST GitHub (repositórios públicos) e WakaTime (Stats). Endpoints/provedores e erros devem ser revalidados ao configurar produção.

## A3 — Calculadora e Contato

Calculadora usa parser restrito, sem eval/Function, com precedência, potência associativa à direita, sinais, parênteses, porcentagem, funções científicas e graus/radianos. Tem teclado, erros de domínio/divisão por zero e histórico local limitado a 20 entradas. Precisão de exibição até 14 dígitos; não se destina a contabilidade de precisão decimal arbitrária.

Contato possui formulário, canais editáveis, validações, consentimento, honeypot, intervalo mínimo de preenchimento, limite de repetição em sessão e integração REST EmailJS por chave pública. Sucesso só após resposta técnica; timeout/cancelamento é envio não confirmado. Agendamento é solicitação privada para análise, nunca confirmação de reunião/evento público. Nenhuma mensagem real foi enviada nos testes. Configurar serviço/template/chave pública, remetente/destinatário fixo no provedor, restrição de origens e proteção antiabuso/CAPTCHA no serviço antes de produção. Throttle local não é controle de segurança de backend.

Proteção compartilhada de alterações não salvas: fechar abre diálogo acessível do WS OS, mantendo o fundo inert, foco e Escape/Tab; cancelar mantém dados; descartar fecha a instância. Reload usa proteção nativa do navegador. SystemProvider retorna aceitação/rejeição booleana para fechamento; isso não é API de resultado síncrono de ID na abertura. Mobile respeita rejeição e retorna à Home se um fechamento externo remover a última instância.

Validação: sete testes novos de aritmética, domínio, entrada não executável, contato, agenda, resposta do provedor e guards. Navegador: 2+3*4 resultou 14; 1/0 exibiu erro; Contato não configurado não habilita envio; diálogo preservou nome ao cancelar e fechou após descarte. Suíte completa esperada nesta entrega: 82 testes, além de lint/build.

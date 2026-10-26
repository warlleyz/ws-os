<!-- === ARQUITETURA DA WS OS === -->

# Arquitetura da WS OS

<!-- === REFERÊNCIA E ESTADO === -->

## Referência e estado

Consulta técnica alinhada ao [mestre vigente](WS-OS-V2-MESTRE.md), atualizada na Etapa 01 em 26/10/2026. Referência de código: 3e6af7d. A organização abaixo descreve responsabilidades existentes; não certifica todos os fluxos como concluídos.

<!-- === CAMADAS E RESPONSABILIDADES === -->

## Camadas e responsabilidades

| Área                            | Responsabilidade                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| src/App.jsx                     | Inicialização, tema, acessibilidade, cursores, favicon e seleção protegida do shell  |
| src/core                        | Registro, instâncias, navegação, permissões, guards e preferências                   |
| src/shells/desktop e mobile     | Composição específica de cada experiência                                            |
| src/features/windows            | AppHost lazy, ErrorBoundary por instância, moldura, interação e geometria            |
| src/features                    | Menu, busca, painéis, notificações, widgets, calendário, clima, Wally e apresentação |
| src/apps                        | Interface e regras dos 17 aplicativos/atalhos registrados                            |
| src/services                    | Contratos, transporte, cache e integrações                                           |
| src/services/storage            | Documentos pessoais locais e seus contratos                                          |
| src/shared                      | Componentes, hooks, utilitários e i18n reutilizados                                  |
| src/styles                      | Tokens, temas, efeitos e estilos compartilhados                                      |
| src/content/portfolioContent.js | Conteúdo público versionado e referências de integrações                             |
| worker/index.js                 | Roteamento HTTP, assets e manutenção agendada                                        |
| functions/api e functions/_lib  | Handlers e dependências do Worker                                                    |
| database                        | Migrações PostgreSQL/D1 e roteiro SQL de verificação                                 |
| tests/core e tests/helpers      | Testes Node e ambientes controlados                                                  |

<!-- === CATÁLOGO E NAVEGAÇÃO === -->

## Catálogo e navegação

Há 17 entradas: 16 públicas e Administração restrita. Currículo encaminha ao Visualizador. Aplicativos utilizam o Core para abrir destinos; parâmetros, origem e retorno são dados validados, não permissões.

Desktop e Mobile compartilham contratos, mas mantêm composição própria. Janelas minimizadas preservam estado; pausa depende do consumidor. Fechar desmonta recursos. Rascunhos são protegidos por instância e a troca de shell utiliza o guard central.

Os defeitos conhecidos de confirmação do Currículo e preparação assíncrona do DOOM estão atribuídos à Etapa 03. Não interpretar o contrato desejado como comportamento já comprovado.

<!-- === DADOS E AUTORIZAÇÃO === -->

## Dados e autorização

Preferências ficam no armazenamento local; arquivos pessoais no IndexedDB. Arquivos oficiais usam Supabase Storage privado com metadados/revisões PostgreSQL e transferência mediada pelo Worker. Administração não tem acesso aos documentos locais de visitantes.

Autenticação usa os serviços existentes e sessão em memória. Operações administrativas exigem verificação no servidor e políticas do banco. Segredos permanecem fora do frontend. Conteúdo público, cache e invalidadores não transportam credenciais ou payloads privados.

Projetos usa GitHub e IDs de destaques persistidos no Supabase. Não há sistema ativo de demonstrações, execução de repositórios ou ordenação editorial manual. Wally remoto permanece desativado.

<!-- === APARÊNCIA, CICLO DE VIDA E APRESENTAÇÃO === -->

## Aparência, ciclo de vida e apresentação

Temas, efeitos, wallpapers e cursores possuem gerenciadores compartilhados. Requisitos ainda incompletos de personalização pertencem à Etapa 04. Configurações encerra o walkthrough dos consumidores na Etapa 11, sem reconstruir mecanismos já aprovados.

Animações das janelas permanecem obrigatórias e respeitam movimento reduzido. Reiniciar/Desligar ficam fora desta versão. Boot mantém processador; favicon usa as seis logos conforme tema/destaque; boas-vindas mantém duas etapas e bloqueio de Escape.

<!-- === RUNTIME E ASSETS === -->

## Runtime e assets

Vite dev/preview não executam as APIs. O backend é o Worker com ASSETS e handlers reutilizados de functions/api. Não há segundo backend ativo por existir essa pasta. Consultar [rotas](backend/WORKER.md) e [configuração](backend/CONFIGURACAO.md).

O Worker reúne seis partes de uzdoom.data e entrega o pacote por streaming. O isolamento COOP/COEP deve ser homologado junto às integrações externas. Hash do manifesto, licenças, rastreabilidade e integração de saves não são certificados pelo build atual.

<!-- === VALIDAÇÃO E PRESERVAÇÃO === -->

## Validação e preservação

Na Etapa 01, lint/build passaram e cinco testes preexistentes falharam. Não foram alterados fonte, testes, banco, configuração de runtime, dependências ou assets. Build atualizado em dist não é uma alteração rastreada da aplicação.

O acompanhamento e os critérios de encerramento estão no mestre. [Contratos anteriores](contracts.md) e checkpoints preservam evidências datadas; não substituem a leitura do código e do estado atual.

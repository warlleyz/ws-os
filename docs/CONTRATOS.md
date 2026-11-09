# Contratos e rotas — WS OS V2.1

## Referência
Rotas listadas conforme `worker/index.js` no commit `c7af7834e3774ab29a631b0798d70e8cc59999ad`. A tabela documenta o roteamento, **não** garante disponibilidade, permissão ou sucesso em produção.

## Contratos estruturais
- Registro de aplicativos: `src/core/appRegistry.js`.
- Gerenciamento de instâncias e navegação: `src/core/`.
- Integrações e clientes de dados: `src/services/`.
- Respostas HTTP: handlers em `functions/api/` invocados pelo entrypoint único `worker/index.js`.
- Rotas `/api/` inexistentes retornam erro JSON 404; métodos não permitidos retornam 405 com `Allow`; falhas inesperadas são tratadas com 503.
- Respostas públicas e privadas, validações e permissões específicas devem ser verificadas no handler de cada rota (Etapas 25–28).

## Rotas HTTP

| Caminho | Método(s) |
|---|---|
| `/api/admin/attachments` | `POST, DELETE` |
| `/api/admin/content` | `GET, POST, PATCH, DELETE` |
| `/api/admin/files` | `GET, POST, PUT, PATCH, DELETE` |
| `/api/admin/posts` | `GET` |
| `/api/admin/posts/create` | `POST` |
| `/api/admin/posts/delete` | `DELETE` |
| `/api/admin/posts/status` | `PATCH` |
| `/api/admin/posts/update` | `PATCH` |
| `/api/admin/project-highlights` | `GET, PUT` |
| `/api/admin/rankings` | `GET, DELETE` |
| `/api/admin/requests` | `GET, PATCH, DELETE` |
| `/api/admin/status` | `GET` |
| `/api/auth/login` | `POST` |
| `/api/auth/logout` | `POST` |
| `/api/auth/me` | `GET` |
| `/api/content` | `GET` |
| `/api/files` | `GET` |
| `/api/posts` | `GET` |
| `/api/posts/attachments` | `GET` |
| `/api/posts/likes` | `GET` |
| `/api/posts/likes/add` | `POST` |
| `/api/project-highlights` | `GET` |
| `/api/rankings` | `GET, POST` |
| `/api/requests` | `POST` |
| `/api/wakatime` | `GET` |
| `/api/wally` | `POST` |

## Regras
1. A proteção administrativa deve ocorrer no backend para cada operação sensível.
2. Mudanças de payload, método, código de erro e cache exigem atualização dos consumidores e dos testes.
3. `requests` contém contratos legados de solicitações de horário, embora a interface de agendamento tenha sido removida: **não reativar sem decisão explícita**.
4. O serviço remoto do Wally está desabilitado na configuração-base.
5. Não expor dados privados, tokens ou mensagens internas de erro em respostas públicas.

## Validação pendente por etapa
Testes de integração e autorização de rotas (26–28); consumidores (04 e 15–25); homologação final (32).

## Atualização de contratos — auditoria 01–16, 02/11/2026

- GET /api/posts e GET /api/admin/posts aceitam offset inteiro de 0 a 1.000.000 e retornam até 200 itens em posts. nextOffset indica a próxima página ou null. Ordenação inclui id para desempate.
- GET /api/admin/posts?id=IDENTIFICADOR retorna somente a nota solicitada, mantendo autenticação e autorização administrativas; o compositor usa essa consulta para recuperar a revisão exata do rascunho.
- GET /api/wakatime exige WAKATIME_ACCESS_TOKEN no servidor e usa OAuth Bearer. A resposta pública contém apenas estatísticas selecionadas; nomes de projetos exigem WAKATIME_PUBLIC_PROJECTS. Erros de configuração/autorização retornam 503 sem credenciais ou detalhes privados do provedor.

## Preferências — Etapa 23

- `preferenceContract.js` preserva a versão 1 e a codificação das chaves existentes. Acrescenta as quatro chaves `ws-os:wallpaper:{desktop|mobile}:{dark|light}` e `ws-os:wallpaper-fit`; não migra nem sobrescreve armazenamento durante a adaptação de leitura.
- Aparência reconhece `hideWallpaper`, `accentMode` e `accents.dark/light` com `mode` e `manual`, além das intensidades e da cor legadas. Mobile admite `widgetIds` opcionais para formatos antigos, únicos e pertencentes ao catálogo.
- `restoreSystemPreferences(categories)` mantém o argumento opcional: sem argumento, executa todas as ações permitidas; com categorias, executa somente as correspondentes. Categorias vazias, desconhecidas e alvos de dados pessoais são rejeitados antes de qualquer ação.
- `uploadCustomWallpaper(file, shell, { signal } = {})` mantém os dois argumentos anteriores. Cancelamento impede aplicação posterior, mas não remove uma imagem já gravada na coleção. Alteração concorrente da seleção preserva a escolha mais recente e informa que o arquivo foi salvo na coleção.

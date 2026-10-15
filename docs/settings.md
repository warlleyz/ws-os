> **Temas atualizados em 15/10/2026:** [glass.css](../src/styles/themes/glass.css) agora aplica vidro à janela inteira e controla empilhamento de blur. As descrições/evidências abaixo sobre conteúdo opaco e blur antigo são da etapa anterior; detalhes atuais em [Entrega e continuidade](ENTREGA-E-CONTINUIDADE-2026-10-15.md). Os contratos de dados/persistência abaixo permanecem válidos.

# Configurações — entrega de 15/10/2026

Escopo: completar o app existente, preservando a arquitetura e as edições locais encontradas sobre `2b4bf86`. Não representa conclusão de todos os aplicativos ou de todo o roadmap.

## Implementação

| Área           | Entrega                                                                                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wallpapers     | PNG/JPEG/WebP, MIME + assinatura + decodificação; máximo 5 MiB, 32 MP e 8192 px por lado. Imagem em IndexedDB; seleção em localStorage. Prévia, substituição, reseleção e recuperação no reload.                                                                                           |
| Shells         | Seleções independentes; composições verticais dos três wallpapers no Mobile. Uma imagem pessoal compartilhada, com seleção independente. Substituí-la atualiza os shells que escolheram Personalizado.                                                                                     |
| Aparência      | Temas, três destaques com seleção visual, transparência sólida/padrão/elevada, quatro níveis de blur e animações desligadas/suaves/normais. Realces anteriormente fixos acompanham os tokens.                                                                                              |
| Superfícies    | Taskbar, painéis, menus/prévias, cabeçalhos de janelas e widget usam os níveis compartilhados. Conteúdo dos apps continua opaco. Transparência elevada tem opacidade mínima de 88% para proteger legibilidade.                                                                             |
| Acessibilidade | Movimento/transparência reduzidos e baixo custo prevalecem; preferências do SO também. Baixo custo oculta temporariamente o wallpaper sem apagar a escolha/imagem. Foco visível e confirmação de restauração por teclado/Escape/retorno de foco.                                           |
| Desktop        | Auto-ocultação usa o mesmo store dos Controles Rápidos; removida a função duplicada que chamava setter inexistente. Mudanças de aparência não alteram posições/ordem dos atalhos.                                                                                                          |
| Widgets        | Seção centralizada para o relógio existente: visibilidade e tamanhos 2×2/3×2/3×3. Um store alimenta Configurações e controles do Desktop; posição preservada; inclusão/tamanho visível sem capacidade é rejeitado pela grade. Widget oculto pode ter tamanho preparado para uso posterior. |
| Mobile         | Densidade própria, wallpaper próprio, acesso à navegação horizontal das seções e conteúdo rolável. Correção da precedência da grade em telas até 360 px.                                                                                                                                   |
| Persistência   | Fallback em dados inválidos/leitura bloqueada; falha de escrita mantém preferência na sessão e informa usuário. IndexedDB bloqueado possui prazo de 8 s para abertura. Falha ao salvar imagem conserva imagem anterior; falha ao salvar seleção informa limitação.                         |
| Sincronização  | Stores compartilhados sincronizam os consumidores na mesma sessão; eventos de storage sincronizam preferências entre abas sem eco de escrita. Substituição da imagem sinaliza recarga do IndexedDB nas outras abas quando localStorage está disponível.                                    |
| Restauração    | Allowlist das preferências apresentadas, com confirmação e relatório de falha parcial; preserva arquivos/dados dos apps, favoritos, imagem pessoal e posições/ordem dos atalhos e posição dos widgets. Restaura tamanho/visibilidade dos widgets e ambas seleções de wallpaper.            |
| Organização    | Quatro arquivos de UI: Settings.jsx, SettingsNavigation.jsx, SettingsSections.jsx, Settings.css. Stores e IndexedDB ficam no Core/serviço de armazenamento. CSS duplicado foi consolidado; container queries respondem à largura da janela, não só à do navegador.                         |

O relógio não possui outras preferências individuais implementadas: idioma e hora seguem a interface/dispositivo. Não foram adicionados widgets inexistentes nem controles sem efeito.

## Contratos de dados

- Mantida a chave legada `ws-os:wallpaper` para Desktop; `ws-os:mobile-wallpaper` para Mobile. Valores `original`, `aurora`, `minimal`, `custom`.
- Banco `ws-os-wallpapers`, versão 1, object store `images`, chave `custom`, valor Blob. Sem upload remoto. Substituição só é aplicada após transação concluída. Conexões são fechadas; URL anterior revogada na troca.
- Imagem ausente, inválida ou inacessível usa fundo original visualmente, mantendo a seleção persistida para não destruir intenção por erro transitório. Configurações mostra aviso; o usuário pode selecionar outra opção.
- `ws-os:wallpaper-image-revision` sinaliza troca entre abas; não armazena a imagem.
- `ws-os:appearance` recebe `motion: off|subtle|normal`; dados antigos assumem normal, mantendo demais campos validados.
- Chaves existentes de tema, acessibilidade, idioma, auto-ocultação, densidade Mobile e widgets mantidas. Posições dos atalhos não são migradas nem apagadas.
- Desktop é o proprietário das restrições de capacidade durante sua montagem. No Mobile, mudanças de widgets são preferências para o próximo Desktop; ao voltar, a projeção da grade evita colisões e informa indisponibilidade temporária quando necessário.

## Preferências particulares de aplicativos

Os aplicativos atuais não expõem schemas próprios editáveis nesta seção. Não se cria persistência arbitrária ou um painel vazio apenas para aparentar suporte.

Para cada consumidor futuro, registrar appId, schemaVersion, defaults, normalização/validação, limites, método de leitura/escrita e quais campos são restauráveis. Usar chave `ws-os:app:<appId>:preferences` para pequenas preferências JSON; documentos e arquivos ficam no armazenamento próprio, nunca nessa chave. Um reset particular deve ser explícito e separado da restauração global; migração não pode apagar dados ao encontrar versão desconhecida. Dados privados/credenciais não são preferências públicas. Publicar somente controles consumidos efetivamente pelo app. O store deve fornecer snapshot estável/assinatura e informar falha de gravação sem inutilizar a sessão.

## Evidências de validação

Antes da alteração, lint falhava em seis pontos: export de metadados com Fast Refresh, imports duplicados de wallpapers, prop de tema sem uso e função duplicada/setter inexistente na Taskbar. Havia também handlers repetidos no arquivo de seções. Os problemas foram corrigidos. O teste do Registry estava desatualizado em relação ao app Settings já implementado e foi ajustado.

Automação final: lint e build aprovados; 67 testes Node aprovados, sem falhas. Há 14 novos testes de Configurações: shells independentes/chave legada, reseleção/substituição/revogação, recuperação, validação de arquivos, quota, localStorage bloqueado, concorrência/hidratação, capacidade/tamanhos/posições de widgets, allowlist/reset parcial, normalização de aparência, storage entre abas, IndexedDB indisponível/bloqueado, cobertura de traduções e contraste dos três destaques.

Navegador em origem isolada `127.0.0.1:5187`, sem limpar ou escrever a origem habitual do usuário:

- PNG, JPEG e WebP decodificados, gravados e lidos do IndexedDB real por fixture externa. Imagem falsa rejeitada sem substituir a anterior.
- Upload PNG pelo seletor de arquivos real de Configurações; sucesso e aplicação imediata. Arquivo falso pelo mesmo seletor: aviso e preservação.
- Reload recuperou imagem WebP; reset/reseleção preservaram imagem, documento sentinela e posições persistidas.
- Tema claro/escuro e três destaques conferidos por UI/estilos computados.
- Cabeçalho em light/high/strong: fundo rgba(255,255,255,.88), blur 20 px; reduzir transparência: fundo sólido e blur 0. Baixo custo: wallpaper sem imagem e janela sem sombra.
- Widget desativado em Configurações desaparece do Desktop; tamanho 3×2 preparado oculto e aplicado ao ativar. Grade/controles usam o mesmo estado.
- Auto-ocultação ativada em Configurações refletiu nos Controles Rápidos; desativada nos Controles refletiu em Configurações.
- Troca de idioma nos Controles traduziu Configurações sem recriar sessão. Verificação de catálogos encontrou/corrigiu Preferências/Cancelar.
- Mobile 390×844, estreito 320×568 e horizontal 667×375: conteúdo sem overflow horizontal involuntário; navegação de seções permite rolagem. Em 320 px, conteúdo 280 px/scrollWidth 280; em horizontal, app 612 px/scrollWidth 612.
- Seleção vertical Aurora e densidade confortável aplicadas ao Mobile; ao voltar, Desktop manteve seleção própria.
- Confirmação de reset focada e operada por Enter; Escape retorna foco a Restaurar padrões.
- Cinco ciclos maximizar/restaurar e resize por teclado: sem erro observado; em janela de 420 px, conteúdo 410 px/scrollWidth 410.
- Sem erros/warnings de aplicação no console nos fluxos normais verificados.

Preview de produção na mesma origem de teste: imagem personalizada recuperada após reload, seleções próprias mantidas, restauração concluída com imagem disponível, Configurações Mobile operável e grade confortável com duas colunas. Sem erros/warnings nesses fluxos. Sincronização real entre duas abas também verificada: idioma EN/PT atualizou a outra aba sem recarregar.

Instrumentação e imagens de teste ficam fora do produto, na pasta de trabalho do agente.

## Limites que exigem validação humana

Não foi executado leitor de tela real, toque físico, zoom nativo do navegador ou ensaio do resize nativo nas bordas físicas do monitor. Layout estreito e árvore acessível não substituem esses testes. Não declarar conformidade WCAG AA, benchmark de performance nem resolução do antigo travamento com base nos smokes desta entrega. Confirmar no computador do usuário antes de marcar esses itens físicos como validados.

Roteiro manual: usar teclado/Tab/Shift+Tab nas sete seções; zoom 200%; leitor de tela nos seletores, uploads, aviso e confirmação; toque vertical/horizontal com teclado virtual; resize nativo com DevTools fechado, efeitos normais/baixo custo e várias janelas; reload e troca de shell com dados pessoais existentes. A imagem não precisa ser enviada a nenhum serviço.

# Etapa 01 — Parte 01.4: modelos compartilhados

Estado: contratos implementados e validados tecnicamente. Referências TEC-029–037. Nenhuma persistência remota nova, tabela de solicitações ou backend R2 foi implementado nesta parte.

## Entregas

- privateRequestContract: entrada privada, seis estados aprovados, revisão otimista, transição explícita, histórico mínimo sem duplicação de PII e retenção de 180 dias. Arquivar uma solicitação concluída não prorroga a retenção inicial; reabertura é explícita. isRequestRetentionExpired fornece a seleção para a rotina futura, sem apagar registros no navegador.
- Persistência e notificação EmailJS têm resultados independentes (confirmado/falhou/incerto); um aviso de e-mail não afirma persistência ou confirmação de reunião.
- publicContentContract: eventos de dia inteiro ou horário/fuso, adaptação explícita dos eventos legados, projetos/demos, publicações/anexos e pontuações elegíveis. Projeções públicas não expõem tokens ou identificadores privados.
- preferenceContract: inventário de chaves existentes, versão lógica, adaptação e codificação legadas sem gravação automática, rejeição de versões futuras e plano seletivo de reset.
- preferencesManager consome o plano permitido; reset não seleciona bancos, conteúdo de apps, sessão, posições ou imagem pessoal. O comportamento sem argumentos preserva as nove ações existentes.
- contentService aplica o adaptador de eventos de dia inteiro antes de entregar dados ao Calendário, sem inventar revisão para os dados legados.
- contractValidation reúne validações de fronteira reaproveitadas por modelos e futuros contratos de ação; datas impossíveis e dados executáveis não são aceitos.

## Validação

Lint/build aprovados; 343 testes passaram. Testes específicos cobrem formatos, datas, fuso, conflitos, retenção, anexos, projeções públicas, preferências antigas e reset existente. Código de transição e de reset exercitado diretamente com dados/armazenamento isolados; não há uma nova interface de solicitações a testar nesta etapa.

## Responsabilidades preservadas

Etapa 03: tabelas/RLS, reserva idempotente, retenção automática com execução/registro operacional, envio separado e anexos R2. Etapas 06/08/10/12: interfaces e persistência dos modelos de domínio. Etapas 04/14: integração completa dos modelos de preferência nos consumidores e UI de seleção do reset. Estes formatos são contratos disponíveis, não prova de que esses produtos futuros já existem.

JSONs de tradução preservados. Próxima parte: 01.5 — segurança, sessão e ações autorizadas.

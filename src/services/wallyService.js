export function localWallyAnswer(question, profileSummary = '') {
  const text =
    typeof question === 'string'
      ? question
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
      : '';
  if (!text || text.length > 1000)
    return { message: 'Faça uma pergunta de até 1000 caracteres.', actions: [] };
  const subjects = [
    [
      /projet|project/,
      'projects',
      'Abra Projetos para consultar o catálogo e os repositórios públicos.',
    ],
    [/curricul|resume/, 'resume', 'O currículo pode ser consultado no aplicativo Currículo.'],
    [/certific/, 'certificates', 'Consulte cursos e certificados no aplicativo Certificados.'],
    [
      /contato|contact|agend|meeting/,
      'contact',
      'Use Contato para mensagens e solicitações de horário.',
    ],
    [
      /arquivo|files|editor/,
      'files',
      'Seus arquivos pessoais ficam somente neste navegador, no aplicativo Arquivos.',
    ],
    [
      /config|settings|tema|theme|blur/,
      'settings',
      'Configurações reúne temas, efeitos, wallpapers, idioma e widgets.',
    ],
    [/jogo|game/, 'games', 'Abra Jogos para consultar os jogos disponíveis.'],
  ];
  for (const [pattern, appId, message] of subjects)
    if (pattern.test(text)) return { message, actions: [{ type: 'open-app', appId }] };
  if (/perfil|sobre|profile|developer/.test(text) && profileSummary)
    return { message: profileSummary, actions: [{ type: 'open-app', appId: 'about-me' }] };
  if (/admin|login|senha|password/.test(text))
    return {
      message:
        'Autenticação administrativa ainda não configurada. Nunca insira senhas neste terminal.',
      actions: [],
    };
  return {
    message:
      'Estou em modo local. Posso orientar sobre projetos, currículo, certificados, contato, arquivos e configurações. Não há IA remota conectada.',
    actions: [],
  };
}

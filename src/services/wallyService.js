export function localWallyAnswer(question, profileSummary = '', locale = 'pt-BR') {
  const messages = {
    'Faça uma pergunta de até 1000 caracteres.': 'Ask a question up to 1000 characters.',
    'Abra Projetos para consultar o catálogo e os repositórios públicos.':
      'Open Projects to explore the catalog and public repositories.',
    'O currículo pode ser consultado no aplicativo Currículo.':
      'You can read the resume in the Resume app.',
    'Consulte cursos e certificados no aplicativo Certificados.':
      'Browse courses and certificates in the Certificates app.',
    'Use Contato para mensagens e solicitações de horário.':
      'Use Contact for messages and meeting requests.',
    'Seus arquivos pessoais ficam somente neste navegador, no aplicativo Arquivos.':
      'Your personal files stay only in this browser, in the Files app.',
    'Configurações reúne temas, efeitos, wallpapers, idioma e widgets.':
      'Settings contains themes, effects, wallpapers, language and widgets.',
    'Abra Jogos para consultar os jogos disponíveis.': 'Open Games to see the available games.',
    'Use o formulário de login do Terminal para autenticação administrativa. Não compartilhe senhas nesta conversa.':
      'Use the Terminal login form for administrator authentication. Do not share passwords in this conversation.',
    'Estou em modo local. Posso orientar sobre projetos, currículo, certificados, contato, arquivos e configurações. Não há IA remota conectada.':
      'I am in local mode. I can guide you through projects, resume, certificates, contact, files and settings. No remote AI is connected.',
  };
  const reply = (message, actions = []) => ({
    message: locale === 'en' ? (messages[message] ?? message) : message,
    actions,
  });
  const text =
    typeof question === 'string'
      ? question
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
      : '';
  if (!text || text.length > 1000) return reply('Faça uma pergunta de até 1000 caracteres.');
  /* ----- Sugerir tema apenas para um pedido explícito e sem executar automaticamente ----- */
  const themeRequest =
    /\b(tema|theme|mode|modo)\b/.test(text) &&
    /\b(mude|mudar|troque|trocar|alterar|ative|ativar|change|switch|set|enable|use)\b/.test(text) &&
    !/\b(nao|not|never|nunca|dont|don't)\b/.test(text);
  const light = /\b(claro|light)\b/.test(text);
  const dark = /\b(escuro|dark)\b/.test(text);
  if (themeRequest && light !== dark) {
    return reply(
      locale === 'en'
        ? 'Use the button to apply the requested theme.'
        : 'Use o botão para aplicar o tema solicitado.',
      [{ type: 'set-theme', theme: light ? 'light' : 'dark' }],
    );
  }
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
    if (pattern.test(text)) return reply(message, [{ type: 'open-app', appId }]);
  if (/perfil|sobre|profile|developer/.test(text) && profileSummary)
    return { message: profileSummary, actions: [{ type: 'open-app', appId: 'about-me' }] };
  if (/admin|login|senha|password/.test(text))
    return reply(
      'Use o formulário de login do Terminal para autenticação administrativa. Não compartilhe senhas nesta conversa.',
    );
  return reply(
    'Estou em modo local. Posso orientar sobre projetos, currículo, certificados, contato, arquivos e configurações. Não há IA remota conectada.',
  );
}

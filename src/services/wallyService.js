/* === RESPOSTAS LOCAIS DO WALLY === */
export function localWallyAnswer(
  question,
  profileSummary = '',
  locale = 'pt-BR',
  publicContent = {},
) {
  const messages = {
    'Faça uma pergunta de até 1000 caracteres.': 'Ask a question up to 1000 characters.',
    'Abra Projetos para consultar o catálogo e os repositórios públicos.':
      'Open Projects to explore the catalog and public repositories.',
    'O currículo pode ser consultado no aplicativo Currículo.':
      'You can read the resume in the Resume app.',
    'Consulte cursos e certificados no aplicativo Certificados.':
      'Browse courses and certificates in the Certificates app.',
    'Use o aplicativo Contato para enviar uma mensagem profissional.':
      'Use the Contact app to send a professional message.',
    'Seus arquivos pessoais ficam somente neste navegador, no aplicativo Arquivos.':
      'Your personal files stay only in this browser, in the Files app.',
    'Configurações reúne temas, efeitos, wallpapers, idioma e widgets.':
      'Settings contains themes, effects, wallpapers, language and widgets.',
    'Abra Jogos para consultar os jogos disponíveis.': 'Open Games to see the available games.',
    'Use o formulário de login do Terminal para autenticação administrativa. Não compartilhe senhas nesta conversa.':
      'Use the Terminal login form for administrator authentication. Do not share passwords in this conversation.',
    'Estou respondendo em modo local. Posso orientar sobre projetos, currículo, certificados, contato, arquivos e configurações.':
      'I am responding in local mode. I can guide you through projects, resume, certificates, contact, files and settings.',
  };

  /* ----- Preparar resposta no idioma selecionado ----- */
  const reply = (message, actions = []) => ({
    message: locale === 'en' ? (messages[message] ?? message) : message,
    actions,
  });

  /* ----- Normalizar a pergunta ----- */
  const text =
    typeof question === 'string'
      ? question
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
      : '';

  if (!text || text.length > 1000) {
    return reply('Faça uma pergunta de até 1000 caracteres.');
  }

  /* ----- Orientação para autenticação administrativa ----- */
  if (/admin|login|senha|password/.test(text)) {
    return reply(
      'Use o formulário de login do Terminal para autenticação administrativa. Não compartilhe senhas nesta conversa.',
    );
  }

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

  /* ----- Conhecimentos publicados no currículo ----- */
  if (/habilidade|tecnolog|conhecimento|skills|technolog|technical/.test(text)) {
    const localized = (value) => (typeof value === 'string' ? value : (value?.[locale] ?? ''));
    const section = publicContent.resume?.sections?.find((item) => item.id === 'technical-skills');
    const skills = (section?.items ?? [])
      .map((item) => localized(item.description))
      .filter(Boolean);
    return reply(
      skills.join('\n') ||
        (locale === 'en'
          ? 'Explore the developer’s technical skills in About Me and Resume.'
          : 'Consulte os conhecimentos técnicos do desenvolvedor em Sobre Mim e Currículo.'),
      [
        { type: 'open-app', appId: 'about-me' },
        { type: 'open-app', appId: 'resume' },
      ],
    );
  }

  /* ----- Identificar aplicativos relacionados à pergunta ----- */
  const subjects = [
    [
      /dev insights|estatistica|statistics|contribui|contribution|wakatime/,
      'dev-insights',
      locale === 'en'
        ? 'Open Dev Insights to explore public development activity.'
        : 'Abra Dev Insights para explorar a atividade pública de desenvolvimento.',
    ],
    [
      /nota|publicac|notes|posts/,
      'notes',
      locale === 'en'
        ? 'Open Notes to read published content.'
        : 'Abra Notas para ler os conteúdos publicados.',
    ],
    [
      /calculadora|calculator/,
      'calculator',
      locale === 'en'
        ? 'Open Calculator for basic and scientific calculations.'
        : 'Abra Calculadora para cálculos básicos e científicos.',
    ],
    [
      /terminal/,
      'terminal',
      locale === 'en'
        ? 'Use help in Terminal to see the available commands.'
        : 'Use help no Terminal para consultar os comandos disponíveis.',
    ],
    [
      /projet|project/,
      'projects',
      'Abra Projetos para consultar o catálogo e os repositórios públicos.',
    ],
    [/curricul|resume/, 'resume', 'O currículo pode ser consultado no aplicativo Currículo.'],
    [/certific/, 'certificates', 'Consulte cursos e certificados no aplicativo Certificados.'],
    [
      /contato|contact|mensagem|message|agend|meeting|get in touch/,
      'contact',
      'Use o aplicativo Contato para enviar uma mensagem profissional.',
    ],
    [
      /arquivo|files|editor/,
      'files',
      'Seus arquivos pessoais ficam somente neste navegador, no aplicativo Arquivos.',
    ],
    [
      /config|settings|tema|theme|blur|personaliz|customiz/,
      'settings',
      'Configurações reúne temas, efeitos, wallpapers, idioma e widgets.',
    ],
    [/jogo|game/, 'games', 'Abra Jogos para consultar os jogos disponíveis.'],
  ];

  for (const [pattern, appId, message] of subjects) {
    if (pattern.test(text)) {
      return reply(message, [{ type: 'open-app', appId }]);
    }
  }

  /* ----- Responder sobre o perfil público ----- */
  if (
    /perfil|sobre|desenvolvedor|formacao|trajetoria|profile|developer|education|background/.test(
      text,
    ) &&
    profileSummary
  ) {
    return {
      message: profileSummary,
      actions: [{ type: 'open-app', appId: 'about-me' }],
    };
  }

  /* ----- Resposta padrão do modo local ----- */
  return reply(
    'Estou respondendo em modo local. Posso orientar sobre projetos, currículo, certificados, contato, arquivos e configurações.',
  );
}

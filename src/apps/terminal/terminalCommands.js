/* === Catálogo de comandos WS OS === */
export const TERMINAL_GROUPS = [
  {
    title: 'SISTEMA',
    commands: [
      ['help', 'Exibe a ajuda ou detalhes de um comando'],
      ['apps', 'Lista aplicativos disponíveis'],
      ['windows', 'Lista janelas abertas'],
      ['open', 'Abre um aplicativo'],
      ['close', 'Fecha uma janela'],
      ['theme', 'Altera o tema'],
      ['lang', 'Altera o idioma'],
      ['date', 'Exibe data e hora'],
      ['whoami', 'Identifica a sessão'],
    ],
  },
  {
    title: 'ARQUIVOS',
    commands: [
      ['pwd', 'Exibe o diretório atual'],
      ['ls', 'Lista arquivos e pastas'],
      ['cd', 'Navega entre pastas'],
      ['cat', 'Lê arquivos de texto'],
    ],
  },
  {
    title: 'PORTFÓLIO',
    commands: [
      ['about', 'Exibe informações profissionais'],
      ['projects', 'Consulta projetos'],
      ['certificates', 'Lista certificados'],
      ['contact', 'Mostra canais de contato'],
      ['github', 'Abre o perfil do GitHub'],
      ['linkedin', 'Abre o perfil do LinkedIn'],
      ['resume', 'Abre o currículo'],
    ],
  },
  {
    title: 'TERMINAL',
    commands: [
      ['echo', 'Exibe um texto'],
      ['history', 'Lista comandos anteriores'],
      ['clear', 'Limpa a tela'],
      ['login', 'Inicia autenticação administrativa'],
      ['logout', 'Encerra a sessão administrativa'],
    ],
  },
];

export const TERMINAL_COMMANDS = TERMINAL_GROUPS.flatMap(
  (group) => group.commands.map(([name]) => name),
);

/* === Sintaxe e documentação === */

export const TERMINAL_USAGE = {
  help: 'help [comando]',
  apps: 'apps',
  windows: 'windows',
  open: 'open <appId>',
  close: 'close <instanceId|appId>',
  theme: 'theme <dark|light>',
  lang: 'lang <pt-BR|en>',
  date: 'date',
  whoami: 'whoami',
  pwd: 'pwd',
  ls: 'ls [caminho]',
  cd: 'cd [caminho]',
  cat: 'cat <arquivo.txt>',
  about: 'about',
  projects: 'projects',
  certificates: 'certificates',
  contact: 'contact',
  github: 'github',
  linkedin: 'linkedin',
  resume: 'resume',
  echo: 'echo <texto>',
  history: 'history',
  clear: 'clear',
  login: 'login',
  logout: 'logout',
};

export function commandHelp(name) {
  if (!name) {
    return [
      'WS OS TERMINAL — COMANDOS',
      '',
      ...TERMINAL_GROUPS.flatMap((group) => [
        group.title,
        ...group.commands.map(
          ([command, description]) =>
            `  ${command.padEnd(15)} ${description}`,
        ),
        '',
      ]),
      'ATALHOS',
      '  Enter           Executar',
      '  Tab             Autocompletar',
      '  ↑ / ↓           Navegar no histórico',
      '  Esc             Cancelar autenticação',
      '',
      'Digite help <comando> para consultar a sintaxe.',
    ];
  }

  const normalized = name.toLowerCase();
  const group = TERMINAL_GROUPS.find((item) =>
    item.commands.some(([command]) => command === normalized),
  );

  if (!group) {
    throw new Error(`Comando "${name}" não encontrado.`);
  }

  const [, description] = group.commands.find(
    ([command]) => command === normalized,
  );

  return [
    `COMANDO: ${normalized}`,
    description,
    `Uso: ${TERMINAL_USAGE[normalized]}`,
  ];
}

/* === Parser de comandos === */
export function parseCommand(input) {
  if (typeof input !== 'string' || input.length > 512) {
    throw new Error('Comando muito longo.');
  }

  const tokens = [];
  let value = '';
  let quote = null;
  let escaped = false;
  let active = false;

  for (const char of input.trim()) {
    if (escaped) {
      value += char;
      escaped = false;
      active = true;
      continue;
    }

    if (quote && char === '\\') {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        value += char;
      }
      active = true;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      active = true;
      continue;
    }

    if (/\s/.test(char)) {
      if (active) {
        tokens.push(value);
        value = '';
        active = false;
      }
      continue;
    }

    value += char;
    active = true;
  }

  if (quote || escaped) {
    throw new Error('Aspas não fechadas.');
  }

  if (active) {
    tokens.push(value);
  }

  const [name = '', ...args] = tokens;

  return {
    name: name.toLowerCase(),
    args,
  };
}

/* === Autocomplete === */
function uniqueMatch(values, fragment) {
  const matches = [...new Set(values)].filter((item) =>
    item.toLowerCase().startsWith(fragment.toLowerCase()),
  );

  return matches.length === 1 ? matches[0] : null;
}

export function completeCommand(input, appIds = [], paths = []) {
  if (typeof input !== 'string' || !input) return input;

  /* ----- Nome do comando ----- */
  if (!/\s/.test(input)) {
    const match = uniqueMatch(TERMINAL_COMMANDS, input);

    return match ? `${match} ` : input;
  }

  const match = input.match(/^(\S+)\s+([^\s]*)$/);
  if (!match) return input;

  const [, command, fragment] = match;

  /* ----- Aplicativos ----- */
  if (command === 'open') {
    const value = uniqueMatch(appIds, fragment);
    return value ? `open ${value}` : input;
  }

  /* ----- Comandos da ajuda ----- */
  if (command === 'help') {
    const value = uniqueMatch(TERMINAL_COMMANDS, fragment);
    return value ? `help ${value}` : input;
  }

  /* ----- Preferências ----- */
  const options = {
    theme: ['dark', 'light'],
    lang: ['pt-BR', 'en'],
  };

  if (options[command]) {
    const value = uniqueMatch(options[command], fragment);
    return value ? `${command} ${value}` : input;
  }

  /* ----- Arquivos e diretórios ----- */
  if (['ls', 'cd', 'cat'].includes(command)) {
    const slash = fragment.lastIndexOf('/');
    const base = slash >= 0 ? fragment.slice(0, slash + 1) : '';
    const prefix = slash >= 0 ? fragment.slice(slash + 1) : fragment;
    const value = uniqueMatch(paths, prefix);

    return value ? `${command} ${base}${value}` : input;
  }

  return input;
}

/* === Proteção dos argumentos de autenticação === */
export function safeTerminalCommand(input) {
  if (typeof input !== 'string') return '';

  const trimmed = input.trim();

  // Reconhece login mesmo com aspas inseridas entre letras.
  // Exemplos: login, "login", 'lo'gin, LOGIN.
  const loginPrefix = /^['"]?l['"]?o['"]?g['"]?i['"]?n(?=['"]|\s|$)/i;

  if (loginPrefix.test(trimmed)) {
    return 'login';
  }

  try {
    if (parseCommand(trimmed).name === 'login') {
      return 'login';
    }
  } catch {
    // Entradas inválidas não expõem argumentos reconhecidos como login.
  }

  return input;
}

/* === Easter eggs ocultos === */

export const TERMINAL_EASTER_EGGS = {
  sudo: [
    'Permissão negada.',
    'Boa tentativa. O WS OS leva segurança a sério. 😎',
    'Para administração, utilize login.',
  ],

  coffee: [
    '      ( (',
    '       ) )',
    '    ........',
    '    |      |]',
    '    \\      /',
    '     `----´',
    '',
    'Compilando motivação...',
    '☕ Café preparado. Bugs restantes: desconhecidos.',
  ],

  42: [
    '42.',
    'A resposta para a vida, o universo e tudo mais.',
    'A pergunta original continua em aberto.',
  ],
};

export function getNeofetchLines({
  username = 'visitor',
  locale = 'pt-BR',
  theme = 'WS OS',
  appCount = 0,
} = {}) {
  return [
    '      __      __   _____     ___   _____',
    '      \\ \\    / /  / ___/    / _ \\ / ___/',
    '       \\ \\/\\/ /   \\__ \\    | (_) |\\__ \\',
    '        \\_/\\_/    /___/     \\___/ /___/',
    '',
    `  Usuário:     ${username}`,
    '  Sistema:     WS OS V2',
    `  Idioma:      ${locale}`,
    `  Aparência:   ${theme}`,
    `  Aplicativos: ${appCount}`,
    '  Terminal:    WS Terminal',
  ];
}

/* === Quadros da animação Matrix === */

export function createMatrixFrame(width = 46, height = 12) {
  const characters = '01アイウエオカキクケコサシスセソ';
  const lines = [];

  for (let row = 0; row < height; row++) {
    let line = '';

    for (let column = 0; column < width; column++) {
      const visible = Math.random() > 0.38;
      const index = Math.floor(Math.random() * characters.length);

      line += visible ? characters[index] : ' ';
    }

    lines.push(line);
  }

  return lines;
}

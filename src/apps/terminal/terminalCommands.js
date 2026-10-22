export const TERMINAL_COMMANDS = [
  'help',
  'apps',
  'open',
  'close',
  'theme',
  'lang',
  'ls',
  'pwd',
  'date',
  'whoami',
  'history',
  'clear',
  'echo',
  'login',
  'logout',
];
export function parseCommand(input) {
  if (typeof input !== 'string' || input.length > 512) throw new Error('Comando muito longo.');
  const tokens = [];
  let value = '',
    quote = null,
    escaped = false;
  for (const char of input.trim()) {
    if (escaped) {
      value += char;
      escaped = false;
      continue;
    }
    if (char === '\\' && quote) {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      else value += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (value) {
        tokens.push(value);
        value = '';
      }
    } else value += char;
  }
  if (quote || escaped) throw new Error('Aspas não fechadas.');
  if (value) tokens.push(value);
  const [name = '', ...args] = tokens;
  return { name: name.toLowerCase(), args };
}
export function completeCommand(input, appIds) {
  if (!input.includes(' ')) {
    const matches = TERMINAL_COMMANDS.filter((item) => item.startsWith(input.toLowerCase()));
    return matches.length === 1 ? matches[0] + ' ' : input;
  }
  const prefix = input.match(/^open\s+([^\s]*)$/);
  if (!prefix) return input;
  const matches = appIds.filter((item) => item.startsWith(prefix[1]));
  return matches.length === 1 ? 'open ' + matches[0] : input;
}

/* === Comandos de autenticação nunca conservam argumentos no log === */
export function safeTerminalCommand(input) {
  if (typeof input !== 'string') return '';
  if (/^\s*["']?login(?:["']?(?:\s|$))/i.test(input)) return 'login';
  try {
    if (parseCommand(input.trim().split(/\s/)[0]).name === 'login') return 'login';
  } catch {
    /* Sem eco de argumentos de autenticação inválidos. */
  }
  try {
    if (parseCommand(input).name === 'login') return 'login';
  } catch {
    /* A mensagem do parser não inclui o conteúdo digitado. */
  }
  return input;
}

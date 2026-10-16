import { useEffect, useRef, useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { getRegisteredApps } from '../../core/appRegistry';
import { openApp, closeApp } from '../../core/appManager';
import { useSystem } from '../../core/useSystem';
import { setTheme } from '../../core/themeManager';
import { setLocale } from '../../shared/i18n/i18n';
import { listLocalFiles } from '../../services/storage/localFilesStorage';
import { TERMINAL_COMMANDS, parseCommand, completeCommand } from './terminalCommands';
import {
  loginAdmin,
  logoutAdmin,
  isAdminAuthenticated,
} from '../../services/authService';
import '../../styles/apps.css';
import './Terminal.css';
export default function Terminal() {
  const locale = useLocale(),
    { run, appState } = useSystem();
  const [input, setInput] = useState(''),
    [lines, setLines] = useState([]),
    [history, setHistory] = useState([]),
    [cursor, setCursor] = useState(null),
    [busy, setBusy] = useState(false),
    [showLogin, setShowLogin] = useState(false),
    [loginEmail, setLoginEmail] = useState(''),
    [loginPassword, setLoginPassword] = useState(''),
    [authenticated, setAuthenticated] = useState(
      () => isAdminAuthenticated()
    );
  const inputRef = useRef(null),
    busyRef = useRef(false),
    alive = useRef(true),
    logRef = useRef(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);
  const apps = getRegisteredApps().filter((app) => app.public);
  async function submitLogin(event) {
    event.preventDefault();

    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);

    try {
      await loginAdmin(loginEmail, loginPassword);

      setAuthenticated(true);
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');

      setLines((current) => [
        ...current,
        {
          command: 'login',
          output: ['Autenticação administrativa realizada.'],
        },
      ].slice(-100));
    } catch (error) {
      setLines((current) => [
        ...current,
        {
          command: 'login',
          output: [error.message],
        },
      ].slice(-100));
    } finally {
      setLoginPassword('');
      busyRef.current = false;

      if (alive.current) {
        setBusy(false);
      }
    }
  }
  async function execute(event) {
    event.preventDefault();
    if (!input.trim() || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const command = input;
    setInput('');
    setCursor(null);
    if (!/^login\b/i.test(command)) setHistory((current) => [...current, command].slice(-100));
    let output = [];
    try {
      const { name, args } = parseCommand(command);
      switch (name) {
        case 'help':
          output = [
            TERMINAL_COMMANDS.join(' · '),
            'open <appId> · close <instanceId|appId> · theme dark|light · lang pt-BR|en',
            'Use Tab para completar e setas para navegar no histórico.',
          ];
          break;
        case 'apps':
          output = apps.map(
            (app) =>
              `${app.id} — ${t(app.name)}${app.implemented ? '' : ` (${t('Em desenvolvimento')})`}`,
          );
          break;
        case 'open': {
          const app = apps.find(
            (app) =>
              app.id === args[0] || t(app.name).toLowerCase() === args.join(' ').toLowerCase(),
          );
          if (!app?.implemented)
            throw new Error('Aplicativo indisponível. Use apps para consultar o catálogo.');
          run(openApp, app.id, { origin: 'terminal' });
          output = ['Aplicativo aberto.'];
          break;
        }
        case 'close': {
          const matches = appState.instances.filter(
            (item) =>
              item.id === args[0] || item.id.startsWith(args[0] || '!') || item.appId === args[0],
          );
          if (matches.length !== 1) throw new Error('Informe um ID único da instância.');
          output = [
            run(closeApp, matches[0].id) === false
              ? 'Fechamento depende da confirmação de descarte.'
              : 'Janela fechada.',
          ];
          break;
        }
        case 'theme':
          if (!['dark', 'light'].includes(args[0]))
            throw new Error('Use theme dark ou theme light.');
          output = [
            setTheme(args[0]) ? 'Preferência aplicada.' : 'Preferência ativa somente nesta sessão.',
          ];
          break;
        case 'lang':
          if (!['pt-BR', 'en'].includes(args[0])) throw new Error('Use lang pt-BR ou lang en.');
          output = [
            setLocale(args[0])
              ? 'Preferência aplicada.'
              : 'Preferência ativa somente nesta sessão.',
          ];
          break;
        case 'ls':
          output = (await listLocalFiles())
            .filter((item) => !item.trashed && item.parentId === null)
            .map((item) => `${item.kind === 'folder' ? '[+]' : '[-]'} ${item.name}`);
          if (!output.length) output = ['Esta pasta está vazia.'];
          break;
        case 'pwd':
          output = ['ws-os:/personal'];
          break;
        case 'date':
          output = [new Date().toLocaleString(locale)];
          break;
        case 'whoami':
          output = [
            authenticated && isAdminAuthenticated()
              ? 'Administrador'
              : 'Visitante',
          ];
          break;
        case 'history':
          output = history.map((item, index) => `${index + 1} ${item}`);
          break;
        case 'clear':
          setLines([]);
          return;
        case 'echo':
          output = [args.join(' ')];
          break;
        case 'login':
          if (isAdminAuthenticated()) {
            output = ['Você já possui uma sessão administrativa.'];
          } else {
            setAuthenticated(false);
            setShowLogin(true);
            output = ['Informe suas credenciais no formulário seguro.'];
          }
          break;
        case 'logout': {
          const remoteLogoutSucceeded = await logoutAdmin();

          setAuthenticated(false);
          setShowLogin(false);
          setLoginEmail('');
          setLoginPassword('');

          output = [
            remoteLogoutSucceeded
              ? 'Sessão local encerrada e logout solicitado ao Supabase.'
              : 'Sessão local encerrada. Não foi possível confirmar o logout remoto.',
          ];
          break;
        }
        default:
          throw new Error('Comando não reconhecido. Use help.');
      }
    } catch (error) {
      output = [error.message];
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
    if (alive.current) setLines((current) => [...current, { command, output }].slice(-100));
    inputRef.current?.focus();
  }
  return (
    <article className="desktop-window__content ws-app ws-terminal">
      <h2>{t('Terminal')}</h2>
      <p>{t('Comandos limitados ao WS OS. Histórico somente nesta sessão.')}</p>
      <p className="ws-app__muted">{t('Digite help para consultar os comandos disponíveis.')}</p>
      <div ref={logRef} className="ws-terminal__log" role="log" aria-live="polite" tabIndex={0}>
        {lines.map((entry, index) => (
          <div key={index}>
            <p>&gt; {entry.command}</p>
            {entry.output.map((line, row) => (
              <pre key={row}>{t(line)}</pre>
            ))}
          </div>
        ))}
      </div>
      {showLogin && (
        <form onSubmit={submitLogin}>
          <h3>Autenticação administrativa</h3>

          <label>
            E-mail
            <input
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              autoComplete="username"
              required
              maxLength={254}
              disabled={busy}
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={busy}
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy ? 'Autenticando...' : 'Entrar'}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setShowLogin(false);
              setLoginPassword('');
            }}
          >
            Cancelar
          </button>
        </form>
      )}
      <form onSubmit={execute}>
        <label>
          {t('Comando')}
          <input
            ref={inputRef}
            value={input}
            maxLength={512}
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            onKeyDown={(event) => {
              if (event.key === 'Tab') {
                const next = completeCommand(
                  input,
                  apps.filter((app) => app.implemented).map((app) => app.id),
                );
                if (next !== input) {
                  event.preventDefault();
                  setInput(next);
                }
              }
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                const next =
                  event.key === 'ArrowUp'
                    ? Math.max(0, (cursor ?? history.length) - 1)
                    : Math.min(history.length, (cursor ?? history.length) + 1);
                setCursor(next);
                setInput(history[next] ?? '');
              }
            }}
          />
        </label>
        <button type="submit" disabled={busy}>
          {t('Executar')}
        </button>
      </form>
      <h3>{t('Janelas abertas')}</h3>
      <ul>
        {appState.instances.map((item) => (
          <li key={item.id}>
            {item.appId}: <code>{item.id}</code>
          </li>
        ))}
      </ul>
    </article>
  );
}

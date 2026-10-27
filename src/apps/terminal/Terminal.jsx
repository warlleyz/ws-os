import { useEffect, useRef, useState } from 'react';

import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';

import { portfolio, contentText } from '../../content/portfolioContent';
import { getRegisteredApps } from '../../core/appRegistry';
import { openApp, closeApp } from '../../core/appManager';
import { canCloseApp } from '../../core/appCloseGuards';
import { useSystem } from '../../core/useSystem';
import { setTheme } from '../../core/themeManager';

import { fetchGithubPortfolio } from '../../services/githubService';

import {
  createPortfolioTree,
  normalizePortfolioPath,
  listPortfolioPath,
  readPortfolioPath,
  isPortfolioDirectory,
} from './terminalPortfolio';

import { listLocalFiles, readLocalFile } from '../../services/storage/localFilesStorage';

import {
  parseCommand,
  completeCommand,
  safeTerminalCommand,
  commandHelp,
  TERMINAL_USAGE,
  TERMINAL_EASTER_EGGS,
  getNeofetchLines,
  createMatrixFrame,
} from './terminalCommands';

import {
  loginAdmin,
  logoutAdmin,
  isAdminAuthenticated,
  verifyAdminSession,
  subscribeAdminSession,
} from '../../services/authService';

import '../../styles/apps.css';
import './Terminal.css';

/* === CONSTANTES === */

const MAX_HISTORY = 100;
const MAX_OUTPUT = 100;
const MAX_TEXT_PREVIEW = 32000;

/* === UTILITÁRIOS DE ARQUIVOS === */

function visibleEntries(entries) {
  return entries.filter((item) => !item.trashed);
}

function findChild(entries, parentId, name) {
  return entries.find(
    (item) => item.parentId === parentId && item.name.toLowerCase() === name.toLowerCase(),
  );
}

function pathForFolder(entries, folderId) {
  const parts = [];
  const visited = new Set();
  let id = folderId;

  while (id !== null) {
    if (visited.has(id)) {
      throw new Error('Estrutura de diretórios inválida.');
    }

    visited.add(id);

    const folder = entries.find((item) => item.id === id && item.kind === 'folder');

    if (!folder) {
      throw new Error('Diretório não encontrado.');
    }

    parts.unshift(folder.name);
    id = folder.parentId;
  }

  return `/personal${parts.length ? `/${parts.join('/')}` : ''}`;
}

function resolvePath(entries, currentId, value) {
  const path = String(value ?? '').trim();

  if (!path || path === '.') {
    return { id: currentId, item: null };
  }

  if (path === '~' || path === '/' || path === '/personal') {
    return { id: null, item: null };
  }

  let folderId = path.startsWith('/') ? null : currentId;

  const parts = path
    .replace(/^\/personal(?:\/|$)/, '/')
    .split('/')
    .filter(Boolean);

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];

    if (part === '.') continue;

    if (part === '..') {
      const current = entries.find((item) => item.id === folderId);
      folderId = current?.parentId ?? null;
      continue;
    }

    const item = findChild(entries, folderId, part);

    if (!item) {
      throw new Error(`Caminho não encontrado: ${path}`);
    }

    if (index === parts.length - 1) {
      return { id: folderId, item };
    }

    if (item.kind !== 'folder') {
      throw new Error(`Não é um diretório: ${part}`);
    }

    folderId = item.id;
  }

  return { id: folderId, item: null };
}

function getDirectory(entries, currentId, value) {
  const result = resolvePath(entries, currentId, value);

  if (!result.item) return result.id;

  if (result.item.kind !== 'folder') {
    throw new Error('O caminho informado não é um diretório.');
  }

  return result.item.id;
}

function describeFile(item) {
  return `${item.kind === 'folder' ? '[DIR]' : '[FILE]'} ${item.name}`;
}

/* === APLICATIVO TERMINAL === */

export default function Terminal({ instance }) {
  const locale = useLocale();
  const { run, appState } = useSystem();

  /* === SESSÃO DE COMANDOS === */
  const [input, setInput] = useState('');
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [pathSuggestions, setPathSuggestions] = useState([]);

  /* === AUTENTICAÇÃO === */
  const [loginStep, setLoginStep] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(() => isAdminAuthenticated());

  /* === REFERÊNCIAS === */
  const screenRef = useRef(null);
  const commandRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const loginRequest = useRef(null);
  const alive = useRef(true);
  const busyRef = useRef(false);
  const serialRef = useRef(0);

  const apps = getRegisteredApps().filter((app) => app.public);
  const identity = authenticated ? 'warlley' : 'visitor';

  /* === NAVEGAÇÃO VIRTUAL === */
  const [terminalPath, setTerminalPath] = useState('~');
  const [repositories, setRepositories] = useState([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  /* === ANIMAÇÃO MATRIX === */
  const [matrixActive, setMatrixActive] = useState(false);
  const [matrixFrame, setMatrixFrame] = useState([]);

  /* === INICIALIZAÇÃO E LIMPEZA === */
  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
      loginRequest.current?.abort();
    };
  }, []);

  /* === ESTADO ADMINISTRATIVO === */
  useEffect(
    () =>
      subscribeAdminSession(() => {
        setAuthenticated(isAdminAuthenticated());
      }),
    [],
  );

  /* === SCROLL AUTOMÁTICO === */
  useEffect(() => {
    const screen = screenRef.current;

    if (!screen) return;

    screen.scrollTop = screen.scrollHeight;
  }, [lines, loginStep, busy]);

  /* === FOCO DO PROMPT === */
  useEffect(() => {
    if (busy) return;

    if (loginStep === 'email') {
      emailRef.current?.focus();
    } else if (loginStep === 'password') {
      passwordRef.current?.focus();
    } else {
      commandRef.current?.focus();
    }
  }, [loginStep, busy]);

  /* === REGISTRO DE SAÍDA === */
  function appendLine(command, output = [], type = 'normal', user = identity) {
    const messages = Array.isArray(output) ? output : [output];

    setLines((current) =>
      [
        ...current,
        {
          id: ++serialRef.current,
          command,
          output: messages,
          type,
          identity: user,
        },
      ].slice(-MAX_OUTPUT),
    );
  }

  function resetLogin() {
    setLoginStep(null);
    setLoginEmail('');
    setLoginPassword('');
  }

  /* === LOGIN POR ETAPAS === */
  function cancelLogin() {
    if (busyRef.current) return;

    resetLogin();
    appendLine('', ['Autenticação cancelada.']);
  }

  async function submitLogin(event) {
    event.preventDefault();

    if (busyRef.current || !loginEmail.trim() || !loginPassword) {
      return;
    }

    busyRef.current = true;
    setBusy(true);

    const controller = new AbortController();
    loginRequest.current = controller;

    try {
      await loginAdmin(loginEmail.trim(), loginPassword, {
        signal: controller.signal,
      });

      if (!alive.current || controller.signal.aborted) return;

      resetLogin();
      setAuthenticated(true);

      appendLine('', ['Autenticação administrativa realizada.'], 'success', 'warlley');
    } catch (error) {
      if (!alive.current || controller.signal.aborted) return;

      setLoginPassword('');

      appendLine('', [error instanceof Error ? error.message : 'Falha na autenticação.'], 'error');
    } finally {
      if (loginRequest.current === controller) {
        loginRequest.current = null;
      }

      busyRef.current = false;

      if (alive.current) {
        setLoginPassword('');
        setBusy(false);
      }
    }
  }

  function advanceLogin(event) {
    event.preventDefault();

    if (busyRef.current) return;

    if (loginStep === 'email') {
      const email = loginEmail.trim();

      if (!email) return;

      setLoginEmail(email);
      setLoginStep('password');
      return;
    }

    if (loginStep === 'password') {
      return submitLogin(event);
    }
  }

  /* === ENTRADA E HISTÓRICO === */
  function updateInput(value) {
    setInput(value);
    setHistoryIndex(null);
  }

  async function autocomplete() {
    const command = input.trimStart().split(/\s+/)[0]?.toLowerCase();

    let paths = [];

    if (['cd', 'ls', 'cat'].includes(command)) {
      try {
        const entries = visibleEntries(await listLocalFiles());

        if (!alive.current) return;

        const argument = input.slice(command.length).trimStart();
        const slash = argument.lastIndexOf('/');
        const directory = slash >= 0 ? argument.slice(0, slash + 1) : '.';

        const folderId = getDirectory(entries, currentFolderId, directory);

        paths = entries
          .filter(
            (item) => item.parentId === folderId && (command !== 'cd' || item.kind === 'folder'),
          )
          .map((item) => item.name);

        setPathSuggestions(paths);
      } catch {
        setPathSuggestions([]);
        return;
      }
    }

    setInput((current) =>
      completeCommand(
        current,
        apps.filter((app) => app.implemented).map((app) => app.id),
        paths,
      ),
    );
  }

  function handleCommandKeyDown(event) {
    if (event.nativeEvent?.isComposing || event.isComposing) {
      return;
    }

    if (event.key === 'Tab') {
      const immediate = completeCommand(
        input,
        apps.filter((app) => app.implemented).map((app) => app.id),
        pathSuggestions,
      );

      if (immediate !== input) {
        event.preventDefault();
        setInput(immediate);
      } else if (/^(cd|ls|cat)\s/.test(input)) {
        event.preventDefault();
        void autocomplete();
      }

      return;
    }

    if (event.key === 'ArrowUp') {
      if (!history.length) return;

      event.preventDefault();

      if (historyIndex === null) {
        setDraft(input);
      }

      const next = Math.max(0, (historyIndex ?? history.length) - 1);

      setHistoryIndex(next);
      setInput(history[next]);
      return;
    }

    if (event.key === 'ArrowDown') {
      if (historyIndex === null) return;

      event.preventDefault();

      const next = historyIndex + 1;

      if (next >= history.length) {
        setHistoryIndex(null);
        setInput(draft);
      } else {
        setHistoryIndex(next);
        setInput(history[next]);
      }
    }
  }

  /* === LINKS PROFISSIONAIS === */
  function contactUrl(label) {
    return (
      portfolio.contact.links.find((link) => link.label.toLowerCase() === label.toLowerCase())
        ?.url ?? null
    );
  }

  function openExternal(url) {
    if (typeof url !== 'string' || !/^https:\/\/[a-z0-9.-]+(?:[/:?#]|$)/i.test(url)) {
      throw new Error('Endereço externo indisponível.');
    }

    const opened = window.open(url, '_blank', 'noopener,noreferrer');

    if (opened === null) {
      return 'Solicitação de abertura enviada ao navegador.';
    }

    return 'Link externo aberto.';
  }

  function openRegisteredApp(appId) {
    run(openApp, appId, {
      origin: 'terminal',
      ...(instance?.id ? { originInstanceId: instance.id } : {}),
    });
  }

  /* === ANIMAÇÃO TEMPORÁRIA, COM LIMPEZA AUTOMÁTICA === */
  useEffect(() => {
    if (!matrixActive) return undefined;

    let frames = 0;
    const maxFrames = 32;

    const interval = window.setInterval(() => {
      setMatrixFrame(createMatrixFrame());
      frames += 1;

      if (frames >= maxFrames) {
        window.clearInterval(interval);
        setMatrixActive(false);
        setMatrixFrame([]);
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [matrixActive]);

  /* === MOTOR DE COMANDOS === */
  async function execute(event) {
    event.preventDefault();

    if (!input.trim() || busyRef.current || loginStep !== null) {
      return;
    }

    const command = input;
    const safeCommand = safeTerminalCommand(command);
    const userAtExecution = identity;

    /* === ESTRUTURA VIRTUAL PÚBLICA === */
    const portfolioTree = createPortfolioTree(portfolio, repositories, locale, contentText);

    /* === CONSULTA REAL AO GITHUB === */
    async function loadTerminalProjects() {
      const result = await fetchGithubPortfolio(portfolio.githubUser);

      if (!alive.current) return null;

      const items = result.data?.repositories ?? [];

      setRepositories(items);
      setProjectsLoaded(true);

      return items;
    }

    setInput('');
    setHistoryIndex(null);
    setPathSuggestions([]);

    if (safeCommand !== 'login') {
      setHistory((current) => [...current, command].slice(-MAX_HISTORY));
    }

    busyRef.current = true;
    setBusy(true);

    let output = [];
    let outputType = 'normal';
    let clearRequested = false;

    try {
      const { name, args } = parseCommand(command);

      /* ----- IMPEDIR CREDENCIAIS COMO ARGUMENTOS ----- */
      if (name === 'login' && args.length) {
        throw new Error('Use apenas login. As credenciais são informadas em etapas protegidas.');
      }

      switch (name) {
        /* === AJUDA === */
        case 'help': {
          output = commandHelp(args[0]);
          break;
        }

        /* === CATÁLOGO DE APLICATIVOS === */
        case 'apps': {
          output = apps.map(
            (app) =>
              `${app.id.padEnd(17)} ${t(app.name)}${app.implemented ? '' : ' [indisponível]'}`,
          );
          break;
        }

        /* === JANELAS === */
        case 'windows': {
          output = appState.instances.map(
            (item) => `${item.appId.padEnd(17)} ${item.id}${item.minimized ? ' [minimizada]' : ''}`,
          );

          if (!output.length) output = ['Nenhuma janela aberta.'];
          break;
        }

        /* === ABRIR APLICATIVO === */
        case 'open': {
          const requested = args.join(' ').toLowerCase();

          if (!requested) {
            throw new Error(`Uso: ${TERMINAL_USAGE.open}`);
          }

          if (requested === 'administration' || requested === 'administração') {
            const authorized = await verifyAdminSession();

            if (!alive.current) return;

            if (!authorized) {
              setAuthenticated(false);
              throw new Error('Acesso administrativo negado. Utilize login.');
            }

            setAuthenticated(true);
            openRegisteredApp('administration');
            output = ['Administração aberta.'];
            break;
          }

          const app = apps.find(
            (item) => item.id === requested || t(item.name).toLowerCase() === requested,
          );

          if (!app?.implemented) {
            throw new Error('Aplicativo indisponível. Use apps para consultar o catálogo.');
          }

          openRegisteredApp(app.id);
          output = [`Aplicativo aberto: ${t(app.name)}`];
          break;
        }

        /* === FECHAR JANELA === */
        case 'close': {
          if (!args[0]) {
            throw new Error(`Uso: ${TERMINAL_USAGE.close}`);
          }

          const matches = appState.instances.filter(
            (item) => item.id === args[0] || item.appId === args[0] || item.id.startsWith(args[0]),
          );

          if (matches.length !== 1) {
            throw new Error('Informe um ID único da instância. Consulte windows.');
          }

          run(closeApp, matches[0].id);

          // A preparação e a animação podem terminar depois do comando.
          output = ['Fechamento solicitado.'];
          break;
        }

        /* === TEMA === */
        case 'theme': {
          if (!['dark', 'light'].includes(args[0])) {
            throw new Error(`Uso: ${TERMINAL_USAGE.theme}`);
          }

          output = [
            setTheme(args[0]) ? 'Preferência aplicada.' : 'Preferência ativa somente nesta sessão.',
          ];
          break;
        }

        /* === IDIOMA === */
        case 'lang': {
          if (!['pt-BR', 'en'].includes(args[0])) {
            throw new Error(`Uso: ${TERMINAL_USAGE.lang}`);
          }

          output = [
            setLocale(args[0])
              ? 'Preferência aplicada.'
              : 'Preferência ativa somente nesta sessão.',
          ];
          break;
        }

        /* === DIRETÓRIO ATUAL === */
        case 'pwd': {
          if (terminalPath.startsWith('~/personal')) {
            const entries = visibleEntries(await listLocalFiles());

            output = [`~${pathForFolder(entries, currentFolderId)}`];
          } else {
            output = [terminalPath];
          }

          break;
        }

        /* === LISTAGEM DE ARQUIVOS === */
        case 'ls': {
          const requested = args[0] ?? '.';
          const path = normalizePortfolioPath(terminalPath, requested);

          if (path === '~/personal' || path.startsWith('~/personal/')) {
            const entries = visibleEntries(await listLocalFiles());

            const folderId =
              path === '~/personal'
                ? null
                : getDirectory(entries, null, path.replace(/^~\/personal\/?/, ''));

            output = entries
              .filter((item) => item.parentId === folderId)
              .sort((a, b) => a.name.localeCompare(b.name, locale))
              .map(describeFile);

            if (!output.length) output = ['Esta pasta está vazia.'];
            break;
          }

          let tree = portfolioTree;

          if (
            (path === '~/portfolio/projects' || path.startsWith('~/portfolio/projects/')) &&
            !projectsLoaded
          ) {
            const fresh = await loadTerminalProjects();
            if (!alive.current || !fresh) return;

            tree = createPortfolioTree(portfolio, fresh, locale, contentText);
          }

          output = listPortfolioPath(tree, path);

          if (!output.length) output = ['Diretório vazio.'];
          break;
        }

        /* === NAVEGAÇÃO DE ARQUIVOS === */
        case 'cd': {
          const target = args[0] ?? '~';
          const next = normalizePortfolioPath(terminalPath, target);

          if (next === '~/personal' || next.startsWith('~/personal/')) {
            const entries = visibleEntries(await listLocalFiles());

            const personalPath = next.replace(/^~\/personal\/?/, '');
            const folderId = getDirectory(entries, null, personalPath || '.');

            setCurrentFolderId(folderId);
            setTerminalPath(next);
            output = [];
            break;
          }

          let tree = portfolioTree;

          if (next.startsWith('~/portfolio/projects/') && !projectsLoaded) {
            const fresh = await loadTerminalProjects();
            if (!alive.current || !fresh) return;

            tree = createPortfolioTree(portfolio, fresh, locale, contentText);
          }

          if (!isPortfolioDirectory(tree, next)) {
            throw new Error(`Diretório não encontrado: ${next}`);
          }

          setTerminalPath(next);
          output = [];
          break;
        }

        /* === LEITURA DE ARQUIVOS TEXTUAIS === */
        case 'cat': {
          if (!args[0]) {
            throw new Error('Uso: cat <arquivo>');
          }

          const path = normalizePortfolioPath(terminalPath, args[0]);

          if (path.startsWith('~/personal/')) {
            const entries = visibleEntries(await listLocalFiles());

            const localPath = path.replace(/^~\/personal\/?/, '');
            const result = resolvePath(entries, null, localPath);

            if (!result.item || result.item.kind !== 'file') {
              throw new Error('Arquivo não encontrado.');
            }

            const file = await readLocalFile(result.item.id);

            if (!/\.(txt|md|json|csv|log|js|css|html)$/i.test(file.name)) {
              throw new Error('Formato não compatível com cat.');
            }

            if (file.blob.size > MAX_TEXT_PREVIEW) {
              throw new Error('Arquivo muito grande para o Terminal.');
            }

            output = (await file.blob.text()).split(/\r?\n/);
            break;
          }

          let tree = portfolioTree;

          if (path.startsWith('~/portfolio/projects/') && !projectsLoaded) {
            const fresh = await loadTerminalProjects();
            if (!alive.current || !fresh) return;

            tree = createPortfolioTree(portfolio, fresh, locale, contentText);
          }

          output = readPortfolioPath(tree, path).split('\n');
          break;
        }

        /* === PERFIL === */
        case 'about': {
          output = [
            portfolio.profile.name,
            contentText(portfolio.profile.headline, locale),
            '',
            contentText(portfolio.profile.summary, locale),
          ];
          break;
        }

        /* === PROJETOS === */
        case 'projects': {
          const projects = portfolio.projects ?? [];

          if (projects.length) {
            output = projects.map((project) => `${project.name ?? project.title ?? project.id}`);
          } else {
            output = [
              'Os projetos são carregados pela integração do GitHub.',
              'Use open projects para consultar o catálogo atualizado.',
            ];
          }

          break;
        }

        /* === CERTIFICADOS === */
        case 'certificates': {
          output = (portfolio.certificates ?? []).map(
            (certificate) =>
              `${contentText(certificate.title, locale)} — ${certificate.issuer ?? ''}`,
          );

          if (!output.length) {
            output = ['Nenhum certificado cadastrado.'];
          }

          break;
        }

        /* === CONTATOS === */
        case 'contact': {
          output = (portfolio.contact.links ?? []).map(
            (link) => `${contentText(link.label, locale)}: ${link.url}`,
          );
          break;
        }

        /* === LINKS EXTERNOS === */
        case 'github':
        case 'linkedin': {
          const url = contactUrl(name);

          output = [openExternal(url), url];
          break;
        }

        /* === CURRÍCULO === */
        case 'resume': {
          openRegisteredApp('resume');
          output = ['Currículo aberto.'];
          break;
        }

        /* === INFORMAÇÕES GERAIS === */
        case 'date': {
          output = [new Date().toLocaleString(locale)];
          break;
        }

        case 'whoami': {
          output = [authenticated && isAdminAuthenticated() ? 'Administrador' : 'Visitante'];
          break;
        }

        /* === HISTÓRICO === */
        case 'history': {
          output = history.map((item, index) => `${index + 1} ${item}`);

          if (!output.length) {
            output = ['Histórico vazio.'];
          }

          break;
        }

        /* === LIMPAR SAÍDA === */
        case 'clear': {
          clearRequested = true;
          break;
        }

        /* === ECHO === */
        case 'echo': {
          output = [args.join(' ')];
          break;
        }

        /* === LOGIN === */
        case 'login': {
          if (isAdminAuthenticated()) {
            setAuthenticated(true);
            output = ['Você já possui uma sessão administrativa.'];
          } else {
            setAuthenticated(false);
            setLoginEmail('');
            setLoginPassword('');
            setLoginStep('email');

            output = ['WS OS Authentication', 'Informe as credenciais solicitadas pelo prompt.'];
          }

          break;
        }

        /* === LOGOUT === */
        case 'logout': {
          const pendingChanges = appState.instances.some((item) => !canCloseApp(item.id));

          if (
            pendingChanges &&
            !window.confirm(
              'Existem alterações não salvas em aplicativos abertos.\n\n' +
                'O acesso administrativo será encerrado. Deseja continuar?',
            )
          ) {
            output = ['Logout cancelado. Alterações preservadas.'];
            break;
          }

          const remoteLogoutSucceeded = await logoutAdmin();

          if (!alive.current) return;

          setAuthenticated(false);
          resetLogin();

          const adminWindows = appState.instances.filter((item) => item.appId === 'administration');

          for (const item of adminWindows) {
            run(closeApp, item.id);
          }

          output = [
            remoteLogoutSucceeded
              ? 'Sessão encerrada e logout remoto solicitado.'
              : 'Sessão local encerrada. Logout remoto não confirmado.',
          ];

          break;
        }

        /* === EASTER EGGS === */
        case 'sudo':
        case 'coffee':
        case '42': {
          output = TERMINAL_EASTER_EGGS[name];
          break;
        }

        case 'neofetch': {
          output = getNeofetchLines({
            username: isAdminAuthenticated() ? 'warlley' : 'visitor',
            locale,
            theme: 'Tema atual da WS OS',
            appCount: apps.length,
          });
          break;
        }

        case 'matrix': {
          if (matrixActive) {
            output = ['Matrix já está em execução.'];
          } else {
            setMatrixActive(true);
            output = ['Entrando na Matrix...'];
          }
          break;
        }

        /* === COMANDO INVÁLIDO === */
        default: {
          throw new Error(`Comando não reconhecido: ${name}. Digite help.`);
        }
      }
    } catch (error) {
      output = [error instanceof Error ? error.message : 'Não foi possível executar o comando.'];
      outputType = 'error';
    } finally {
      busyRef.current = false;

      if (alive.current) {
        setBusy(false);
      }
    }

    if (!alive.current) return;

    if (clearRequested) {
      setLines([]);
    } else {
      appendLine(safeCommand, output, outputType, userAtExecution);
    }
  }

  /* === FOCO AO CLICAR NA SUPERFÍCIE === */
  function focusCommand(event) {
    if (
      busy ||
      window.getSelection()?.toString() ||
      event.target.closest('input, a, button, textarea')
    ) {
      return;
    }

    if (loginStep === 'email') {
      emailRef.current?.focus();
    } else if (loginStep === 'password') {
      passwordRef.current?.focus();
    } else {
      commandRef.current?.focus();
    }
  }

  /* === TECLADO DURANTE AUTENTICAÇÃO === */
  function handleLoginKeyDown(event) {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      cancelLogin();
    }
  }

  /* === INTERFACE DE TERMINAL === */
  return (
    <article className="desktop-window__content ws-app ws-terminal" aria-label={t('Terminal')}>
      <div className="ws-terminal__screen" ref={screenRef} onClick={focusCommand}>
        {/* === INICIALIZAÇÃO === */}
        <div className="ws-terminal__welcome">
          <p>
            Digite <strong>help</strong> para consultar os comandos disponíveis.
          </p>
        </div>

        {/* === SAÍDAS E HISTÓRICO === */}
        <div
          className="ws-terminal__log"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          tabIndex={0}
        >
          {lines.map((entry) => (
            <div className="ws-terminal__entry" key={entry.id}>
              {entry.command && (
                <div className="ws-terminal__command-line">
                  <span className="ws-terminal__user">{entry.identity}@ws-os</span>

                  <span className="ws-terminal__path">:~$</span>

                  <span className="ws-terminal__command-text">{entry.command}</span>
                </div>
              )}

              {entry.output.length > 0 && (
                <div
                  className={['ws-terminal__output', `ws-terminal__output--${entry.type}`].join(
                    ' ',
                  )}
                >
                  {entry.output.map((line, index) => (
                    <pre key={index}>{t(line)}</pre>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* === PROMPT DE AUTENTICAÇÃO === */}
        {loginStep !== null ? (
          <form
            className="ws-terminal__login"
            onSubmit={advanceLogin}
            onKeyDown={handleLoginKeyDown}
          >
            {loginStep === 'email' ? (
              <label className="ws-terminal__login-line">
                <span>E-mail:</span>

                <input
                  ref={emailRef}
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  required
                  disabled={busy}
                  aria-label={t('E-mail')}
                />
              </label>
            ) : (
              <label className="ws-terminal__login-line">
                <span>Senha:</span>

                <input
                  ref={passwordRef}
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  aria-label={t('Senha')}
                />
              </label>
            )}

            <p className="ws-terminal__hint">
              {loginStep === 'email'
                ? 'Enter: continuar · Esc: cancelar'
                : 'Enter: autenticar · Esc: cancelar'}
            </p>

            <button className="ws-terminal__sr-only" type="submit" disabled={busy}>
              {loginStep === 'email' ? 'Continuar' : t(busy ? 'Autenticando...' : 'Entrar')}
            </button>
          </form>
        ) : (
          /* === PROMPT PRINCIPAL === */
          <form className="ws-terminal__input-line" onSubmit={execute}>
            <span className="ws-terminal__user" aria-hidden="true">
              {identity}@ws-os
            </span>

            <span className="ws-terminal__path" aria-hidden="true">
              :{terminalPath}$
            </span>

            <label className="ws-terminal__input-wrap">
              <span className="ws-terminal__sr-only">{t('Comando')}</span>

              <input
                ref={commandRef}
                type="text"
                value={input}
                onChange={(event) => updateInput(event.target.value)}
                onKeyDown={handleCommandKeyDown}
                maxLength={512}
                disabled={busy}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-label={t('Comando')}
              />
            </label>

            <button className="ws-terminal__sr-only" type="submit" disabled={busy}>
              {t('Executar')}
            </button>
          </form>
        )}

        {/* === EASTER EGG MATRIX === */}
        {matrixActive && (
          <div className="ws-terminal__matrix" aria-label="Animação Matrix" aria-live="off">
            <pre aria-hidden="true">{matrixFrame.join('\n')}</pre>
          </div>
        )}

        {/* === OPERAÇÃO EM ANDAMENTO === */}
        {busy && (
          <p className="ws-terminal__processing" role="status">
            {loginStep !== null ? t('Autenticando...') : 'Processando...'}
          </p>
        )}
      </div>
    </article>
  );
}

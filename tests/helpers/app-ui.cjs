const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');

/* === COMPONENTES COM EFEITOS E TRANSPORTE CONTROLADO === */
async function renderApp(
  file,
  props,
  bindings = {},
  { entryPoint, getArguments = (value) => [value] } = {},
) {
  const { transformWithOxc } = await import('vite');
  const { code } = await transformWithOxc(
    fs
      .readFileSync(path.join(root, file), 'utf8')
      .replaceAll('import.meta.env.BASE_URL', "'/portfolio/'")
      .replaceAll('import.meta.env.DEV', 'false')
      .replaceAll('import.meta.env.VITE_RANKINGS_ENABLED', '__rankingsEnabled'),
    file,
    {
      jsx: { runtime: 'classic' },
    },
  );
  const name =
    entryPoint ??
    /export default function (\w+)/.exec(code)?.[1] ??
    /export default memo\((\w+)\)/.exec(code)?.[1];
  const slots = [],
    effects = [];
  let cursor = 0,
    tree;
  const React = {
    createElement: (type, props, ...children) => {
      const resolvedProps = { ...props, children };

      /* ----- RENDERIZAR COMPONENTES VISUAIS SEM HOOKS NO AMBIENTE DE TESTE ----- */
      const presentationalComponents = new Set([
        'CertificateCard',
        'CertificateDetails',
        'DetailsNavigation',
        'CategoryIcon',
        'CertificatesHeader',
        'ContactChannels',
        'ContactHeader',
      ]);

      if (typeof type === 'function' && presentationalComponents.has(type.name)) {
        return type(resolvedProps);
      }

      if (props?.ref && bindings.attachRef) {
        props.ref.current = bindings.attachRef(type, props);
      }

      return { type, props: resolvedProps };
    },
    useMemo(compute, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, n) => value !== slots[index].deps[n])) {
        slots[index] = { deps, value: compute() };
      }
      return slots[index].value;
    },
    useRef: (initial) => (slots[cursor++] ??= { current: initial }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === 'function' ? value(slots[index]) : value;
        },
      ];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, n) => value !== slots[index].deps[n])) {
        slots[index]?.cleanup?.();
        slots[index] = { deps };
        effects.push(() => {
          slots[index].cleanup = effect();
        });
      }
    },
    useCallback: (callback, deps) => React.useMemo(() => callback, deps),
    useLayoutEffect: (effect, deps) => React.useEffect(effect, deps),
  };
  const App = vm.runInNewContext(
    code
      .replace(/^import[\s\S]*?;\s*$/gm, '')
      .replace('export default function', 'function')
      .replace(/export default memo\(\w+\);?/, '') +
      ';' +
      name,
    {
      React,
      __rankingsEnabled: 'false',
      ...React,
      URL,
      AbortController,
      Response,
      setTimeout,
      clearTimeout,
      useLocale: () => 'pt-BR',
      t: (value) => value,
      contentText: (value) => value ?? '',
      portfolio: { certificates: [], resume: { sections: [] }, projects: [] },
      safeExternalUrl: (value) => (value?.startsWith('https://') ? value : null),
      publicAssetUrl: (value) => (value?.startsWith('/') ? 'https://ws.test' + value : null),
      fileKind: (value) => (value.endsWith('.pdf') ? 'pdf' : null),
      resolveStaticFile: () => ({ ok: true, resource: { url: '/curriculo.pdf' } }),
      useSystem: () => ({ run() {} }),
      useAppBack: () => {},
      openApp: 'open',
      ...Object.fromEntries(
        [
          'Award',
          'Download',
          'ExternalLink',
          'Search',
          'Eye',
          'FileText',
          'AlertCircle',
          'ArrowUpRight',
          'BookOpen',
          'CheckCircle2',
          'GraduationCap',
          'Layers3',
          'LoaderCircle',
          'RefreshCw',
          'UserRound',
          'Wrench',
          'ArrowLeft',
          'ArrowRight',
          'FolderGit2',
          'Orbit',
          'CalendarDays',
          'Clock3',
          'Trophy',
          'X',
          'GitBranch',
          'BriefcaseBusiness',
          'Gamepad2',
          'Mail',
          'MessageCircle',
          'Send',
          'ShieldCheck',
        ].map((name) => [name, name]),
      ),
      ...bindings,
    },
  );
  function nodes(node) {
    if (!arguments.length) node = tree;

    if (Array.isArray(node)) {
      return node.flatMap((item) => nodes(item));
    }

    if (!node || typeof node !== 'object') {
      return [];
    }

    if (!('type' in node) || !('props' in node)) {
      return [];
    }

    return [node, ...nodes(node.props?.children)];
  }
  function text(node) {
    if (!arguments.length) node = tree;
    if (Array.isArray(node)) return node.map((item) => text(item)).join(' ');
    return node && typeof node === 'object' ? text(node.props.children) : String(node ?? '');
  }
  const render = () => {
    cursor = 0;
    tree = App(...getArguments(props));
    while (effects.length) effects.shift()();
    return tree;
  };
  render();
  return {
    render,
    nodes,
    text,
    button: (label) =>
      nodes().find((node) => node.type === 'button' && text(node).trim() === label),
    flush: async () => {
      await new Promise((resolve) => setImmediate(resolve));
      render();
    },
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
  };
}

module.exports = { renderApp };

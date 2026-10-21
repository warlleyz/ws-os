import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  FileCode2,
  FileImage,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  House,
  Info,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { openApp } from '../../core/appManager';
import { useSystem } from '../../core/useSystem';
import { subscribePublicData } from '../../services/publicDataService';
import { fileKind } from '../../services/storage/fileModel';
import {
  changeLocalFile,
  changeLocalFiles,
  createLocalFolder,
  createLocalText,
  uploadLocalFile,
} from '../../services/storage/localFilesStorage';
import useAppBack from '../../shared/hooks/useAppBack';
import useLocalFiles from '../../shared/hooks/useLocalFiles';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { validId } from '../../shared/utils/contractValidation';
import { publicAssetUrl } from '../../shared/utils/urls';

import '../../styles/apps.css';
import './Files.css';
/* === Preferências e utilitários === */
/* ----- Leitura das preferências locais ----- */
function preference(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
/* ----- Persistência tolerante a falhas ----- */
function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Uso da sessão preservado. */
  }
}
/* ----- Ícone conforme o tipo do item ----- */
function iconFor(item) {
  return item.kind === 'folder'
    ? Folder
    : fileKind(item.name) === 'image'
      ? FileImage
      : /\.(js|css|html|json)$/i.test(item.name)
        ? FileCode2
        : FileText;
}
/* ----- Normalização da pesquisa ----- */
function normalized(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
/* === Gerenciador de arquivos === */
export default function Files({ instance }) {
  /* ----- Integração com o sistema ----- */
  const locale = useLocale();
  const { run } = useSystem();
  const store = useLocalFiles();
  /* ----- Estados de navegação e localização ----- */
  const [space, setSpace] = useState(() => {
    const saved = preference('ws-os:files-location', {});
    return ['home', 'personal', 'official', 'trash'].includes(saved.space) ? saved.space : 'home';
  });
  const [folderId, setFolderId] = useState(
    () => preference('ws-os:files-location', {}).folderId ?? null,
  );
  /* ----- Estados de visualização e ordenação ----- */
  const [viewMode, setViewMode] = useState(() => {
    try {
      const raw = localStorage.getItem('ws-os:files-view');
      return raw === 'list' || raw === '"list"' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const [sort, setSort] = useState(() =>
    ['name', 'updated', 'size'].includes(preference('ws-os:files-sort', 'name'))
      ? preference('ws-os:files-sort', 'name')
      : 'name',
  );
  /* ----- Histórico de documentos acessados ----- */
  const [recentFiles, setRecentFiles] = useState(() => {
    const saved = preference('ws-os:files-recent', []);
    return Array.isArray(saved) ? saved.slice(0, 8) : [];
  });
  function registerRecent(entry) {
    setRecentFiles((previous) => {
      const next = [
        entry,
        ...previous.filter((item) => !(item.source === entry.source && item.id === entry.id)),
      ].slice(0, 8);
      persist('ws-os:files-recent', next);
      return next;
    });
  }
  /* ----- Pesquisa da tela inicial ----- */
  const [homeQuery, setHomeQuery] = useState('');
  /* ----- Estados de pesquisa, seleção e interação ----- */
  const [query, setQuery] = useState(''),
    [globalSearch, setGlobalSearch] = useState(false),
    [selected, setSelected] = useState([]);
  const [details, setDetails] = useState(false),
    [context, setContext] = useState(null),
    [action, setAction] = useState(null);
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  /* ----- Estado do catálogo oficial ----- */
  const [remoteOfficial, setRemoteOfficial] = useState([]);
  const [officialError, setOfficialError] = useState(false);
  const [officialLoading, setOfficialLoading] = useState(true);
  const [officialRevision, setOfficialRevision] = useState(0);
  /* ----- Referências de elementos e operações ----- */
  const inputRef = useRef(null),
    busyRef = useRef(false),
    contextRef = useRef(null);
  /* ----- Controle da barra de endereços ----- */
  const addressInputRef = useRef(null);
  const addressAreaRef = useRef(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressValue, setAddressValue] = useState('');
  const [addressError, setAddressError] = useState('');
  /* ----- Ativação da edição ----- */
  function editAddress() {
    setAddressValue(addressPath);
    setAddressError('');
    setEditingAddress(true);
  }
  /* ----- Resolução de endereço digitado ----- */
  function navigateToAddress(value) {
    const parts = value
      .trim()
      .replace(/\\\\/g, '/')
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts[0]?.toLowerCase() !== 'ws files') {
      setAddressError('O caminho deve começar com WS Files.');
      return;
    }
    const root = parts[1]?.toLowerCase();
    if (!root && parts.length === 1) {
      navigate('home');
      setEditingAddress(false);
      setAddressError('');
      return;
    }
    if (root === 'arquivos oficiais' || root === 'lixeira') {
      if (parts.length !== 2) {
        setAddressError('Este caminho não possui subpastas navegáveis.');
        return;
      }
      navigate(root === 'lixeira' ? 'trash' : 'official');
      setEditingAddress(false);
      setAddressError('');
      return;
    }
    if (root === 'meus arquivos') {
      let parent = null;
      for (const name of parts.slice(2)) {
        const matches = store.entries.filter(
          (item) =>
            item.kind === 'folder' &&
            !item.trashed &&
            item.parentId === parent &&
            item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
        );
        if (matches.length !== 1) {
          setAddressError(
            matches.length > 1
              ? 'O caminho é ambíguo: existem pastas com o mesmo nome.'
              : 'Pasta não encontrada neste caminho.',
          );
          return;
        }
        parent = matches[0].id;
      }
      navigate('personal', parent);
      setEditingAddress(false);
      setAddressError('');
      return;
    }
    setAddressError('Endereço não encontrado.');
  }
  /* ----- Cópia do endereço atual ----- */
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(addressPath);
      setAddressError('');
    } catch {
      editAddress();
    }
  }
  /* ----- Pasta e destino ativos ----- */
  const folder = store.entries.find(
    (item) => item.id === folderId && item.kind === 'folder' && !item.trashed,
  );
  const unavailableFolder = space === 'personal' && folderId !== null && !folder && !store.loading;
  const parentId = folder?.id ?? null;
  /* ----- Indicadores do espaço pessoal ----- */
  const usedBytes = store.entries.reduce((sum, item) => sum + (item.blob?.size ?? 0), 0);
  const storagePercent = Math.min(100, (usedBytes / (50 * 1024 * 1024)) * 100);
  /* === Dados derivados === */
  /* ----- Documentos estáticos já publicados ----- */
  const staticOfficial = [
    ...portfolio.officialFiles,
    ...(portfolio.resume?.url
      ? [{ id: 'resume', name: t('Currículo'), url: portfolio.resume.url }]
      : []),
    ...(portfolio.certificates ?? [])
      .filter((item) => item.url)
      .map((item) => ({ ...item, name: item.title })),
  ];
  const officialFiles = [
    ...new Map(
      staticOfficial
        .filter((item) => publicAssetUrl(item.url))
        .map((item) => [item.url, { ...item, source: 'static' }]),
    ).values(),
    ...remoteOfficial,
  ];
  const filteredOfficial = officialFiles.filter(
    (item) =>
      !normalized(query.trim()) ||
      normalized(contentText(item.name, locale)).includes(normalized(query.trim())),
  );
  /* ----- Arquivos disponíveis na pesquisa inicial ----- */
  const searchableLocal = store.entries.filter((item) => !item.trashed);
  const homeResults = homeQuery.trim()
    ? [
      ...searchableLocal.map((item) => ({
        source: 'local',
        id: item.id,
        name: item.name,
        kind: item.kind,
        entry: item,
      })),
      ...officialFiles.map((item) => ({
        source: item.source,
        id: item.source === 'managed' ? item.resourceId : item.id,
        name: contentText(item.name, locale),
        kind: 'file',
        entry: item,
      })),
    ]
      .filter((item) => normalized(item.name).includes(normalized(homeQuery.trim())))
      .slice(0, 20)
    : [];
  /* ----- Histórico válido dos arquivos acessados ----- */
  const availableRecentFiles = recentFiles
    .map((recent) => {
      if (recent.source === 'local') {
        const entry = searchableLocal.find((item) => item.id === recent.id);
        return entry?.kind === 'file' ? { ...recent, entry } : null;
      }
      const entry = officialFiles.find(
        (item) =>
          item.source === recent.source &&
          (item.source === 'managed' ? item.resourceId : item.id) === recent.id,
      );
      return entry ? { ...recent, entry } : null;
    })
    .filter(Boolean);
  /* ----- Abertura de resultados e documentos recentes ----- */
  function openHomeEntry(item) {
    if (item.source === 'local') {
      open(item.entry);
      return;
    }
    openOfficial(item.entry);
  }
  /* ----- Seleção e navegação hierárquica ----- */
  const currentSelection = store.entries.filter(
    (item) => selected.includes(item.id) && (space === 'trash' ? item.trashed : !item.trashed),
  );
  const current = currentSelection.length === 1 ? currentSelection[0] : null;
  const breadcrumbs = [];
  for (
    let current = folder;
    current;
    current = store.entries.find((item) => item.id === current.parentId && !item.trashed)
  )
    breadcrumbs.unshift(current);
  /* ----- Construção do caminho virtual ----- */
  const addressSegments = [
    'WS Files',
    ...(space === 'home'
      ? []
      : [
        space === 'personal'
          ? 'Meus arquivos'
          : space === 'official'
            ? 'Arquivos oficiais'
            : 'Lixeira',
      ]),
    ...(space === 'personal' ? breadcrumbs.map((item) => item.name) : []),
  ];
  const addressPath = addressSegments.join('/');
  /* ----- Pesquisa e ordenação dos arquivos pessoais ----- */
  const term = normalized(query.trim());
  const visible = store.entries
    .filter((item) => {
      const inSpace =
        space === 'trash'
          ? item.trashed && !store.entries.find((parent) => parent.id === item.parentId)?.trashed
          : !unavailableFolder &&
          !item.trashed &&
          (globalSearch && term ? true : item.parentId === parentId);
      return inSpace && (!term || normalized(item.name).includes(term));
    })
    .sort((a, b) =>
      a.kind !== b.kind
        ? a.kind === 'folder'
          ? -1
          : 1
        : sort === 'updated'
          ? b.updatedAt - a.updatedAt
          : sort === 'size'
            ? (b.blob?.size ?? 0) - (a.blob?.size ?? 0)
            : a.name.localeCompare(b.name, locale),
    );
  /* === Efeitos de sincronização === */
  /* ----- Consulta pública de arquivos gerenciados ----- */
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    async function load() {
      setOfficialLoading(true);
      try {
        const response = await fetch('/api/files', {
          method: 'GET',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Catálogo indisponível.');
        const payload = await response.json();
        if (!Array.isArray(payload.items)) throw new Error('Catálogo inválido.');
        const validItems = payload.items
          .filter(
            (item) =>
              item &&
              typeof item.resourceId === 'string' &&
              validId(item.resourceId) &&
              typeof item.name === 'string' &&
              item.name.trim() &&
              item.visibility === 'public' &&
              item.state === 'available',
          )
          .map((item) => ({
            source: 'managed',
            id: `managed:${item.resourceId}`,
            resourceId: item.resourceId,
            name: item.name,
            description: '',
            size: item.size,
            mimeType: item.mimeType,
          }));
        if (mounted) {
          setRemoteOfficial(validItems);
          setOfficialError(false);
        }
      } catch {
        if (mounted && !controller.signal.aborted) setOfficialError(true);
      } finally {
        if (mounted) setOfficialLoading(false);
      }
    }
    load();
    const unsubscribe = subscribePublicData(({ prefix }) => {
      if (prefix.startsWith('/api/files') || prefix.startsWith('/api/content')) {
        setOfficialRevision((revision) => revision + 1);
      }
    });
    return () => {
      mounted = false;
      controller.abort();
      unsubscribe();
    };
  }, [officialRevision]);
  /* === Navegação e comportamento do aplicativo === */
  /* ----- Navegação entre áreas e pastas ----- */
  function navigate(nextSpace, id = null) {
    if (busyRef.current) return;
    setSpace(nextSpace);
    setFolderId(id);
    setSelected([]);
    setAction(null);
    setContext(null);
    setQuery('');
    persist('ws-os:files-location', { space: nextSpace, folderId: id });
  }
  /* ----- Voltar ao contexto anterior ----- */
  useAppBack(instance?.id, () => {
    if (busyRef.current) return true;
    if (context) {
      setContext(null);
      return true;
    }
    if (action) {
      setAction(null);
      return true;
    }
    if (space === 'personal' && (parentId || unavailableFolder)) {
      navigate('personal', folder?.parentId ?? null);
      return true;
    }
    if (space !== 'home') {
      navigate('home');
      return true;
    }
    return false;
  });
  /* ----- Abertura do menu por ponteiro ou teclado ----- */
  function showContext(event, target = { type: 'workspace' }) {
    event.preventDefault();
    event.stopPropagation();
    if (busyRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (target.type === 'local') {
      if (!selected.includes(target.id)) setSelected([target.id]);
    } else setSelected([]);
    setContext({
      ...target,
      x: event.clientX || rect.left + 12,
      y: event.clientY || rect.top + 12,
      trigger: event.currentTarget,
    });
  }
  function contextKey(event, target) {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      showContext(event, target);
    }
  }
  function refreshFiles() {
    store.refresh();
    setOfficialRevision((value) => value + 1);
    setContext(null);
  }
  /* ----- Fechamento e posicionamento do menu de contexto ----- */
  useEffect(() => {
    if (!context) return;
    const menu = contextRef.current;
    if (menu) {
      const rect = menu.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(context.x, window.innerWidth - rect.width - 8)) + 'px';
      menu.style.top =
        Math.max(8, Math.min(context.y, window.innerHeight - rect.height - 8)) + 'px';
      menu.querySelector('button:not(:disabled)')?.focus();
    }
    function close(event) {
      if (!contextRef.current?.contains(event.target)) setContext(null);
    }
    function key(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setContext(null);
        context.trigger?.focus();
      }
      if (event.key === 'Tab') setContext(null);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const buttons = [...(menu?.querySelectorAll('button:not(:disabled)') ?? [])];
        const index = buttons.indexOf(document.activeElement);
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    }
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', key, true);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', scroll, true);
    function dismiss() {
      setContext(null);
    }
    function scroll(event) {
      if (!menu?.contains(event.target)) dismiss();
    }
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [context]);
  /* === Operações locais === */
  /* ----- Execução, bloqueio e feedback ----- */
  async function perform(operation) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await operation();
      setAction(null);
      setSelected([]);
      setContext(null);
      setMessage('Operação concluída.');
      return result;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  /* ----- Abertura de pastas e documentos ----- */
  function open(item, edit = false) {
    if (item.kind === 'folder') {
      navigate('personal', item.id);
      return;
    }
    /* ----- Registro de abertura de arquivo pessoal ----- */
    registerRecent({
      source: 'local',
      id: item.id,
      name: item.name,
      openedAt: Date.now(),
    });
    run(openApp, edit ? 'file-editor' : 'file-viewer', {
      origin: 'files',
      params: { fileId: item.id },
    });
  }
  /* ----- Abertura de documentos oficiais ----- */
  function openOfficial(item) {
    /* ----- Registro de abertura de documento oficial ----- */
    registerRecent({
      source: item.source,
      id: item.source === 'managed' ? item.resourceId : item.id,
      name: contentText(item.name, locale),
      openedAt: Date.now(),
    });
    if (item.source === 'managed') {
      run(openApp, 'file-viewer', {
        origin: 'files',
        params: { resource: { source: 'managed', resourceId: item.resourceId } },
      });
      return;
    }
    run(openApp, 'file-viewer', {
      origin: 'files',
      params: { url: publicAssetUrl(item.url), name: contentText(item.name, locale) },
    });
  }
  /* ----- Seleção individual e múltipla ----- */
  function select(event, item) {
    if (busy) return;
    setSelected((previous) =>
      event.ctrlKey || event.metaKey
        ? previous.includes(item.id)
          ? previous.filter((id) => id !== item.id)
          : [...previous, item.id]
        : [item.id],
    );
    setContext(null);
  }
  /* ----- Operações em lote ----- */
  async function batch(type) {
    if (!currentSelection.length) return;
    if (type === 'purge') {
      setAction({ type: 'purge', ids: currentSelection.map((item) => item.id) });
      return;
    }
    await perform(() => changeLocalFiles(currentSelection.map((item) => ({ type, id: item.id }))));
  }
  /* ----- Confirmação de criação, edição e exclusão ----- */
  async function submitAction(event) {
    event.preventDefault();
    if (!action) return;
    if (action.type.startsWith('create-') && unavailableFolder) {
      setMessage('Pasta de destino indisponível.');
      return;
    }
    await perform(async () => {
      if (action.type === 'create-folder') return createLocalFolder(action.name, parentId);
      if (action.type === 'create-file') {
        const file = await createLocalText(action.name, parentId);
        open(file, true);
        return file;
      }
      if (action.type === 'purge') {
        return changeLocalFiles(action.ids.map((id) => ({ type: 'purge', id })));
      }
      if (action.type === 'rename')
        return changeLocalFile({ type: 'rename', id: action.id, name: action.name });
      return changeLocalFiles(
        action.ids.map((id) => ({ type: action.type, id, parentId: action.parentId ?? null })),
      );
    });
  }
  /* === Componentes internos da interface === */
  /* ----- Ferramentas da seleção atual ----- */
  const selectionTools = (
    ids = currentSelection.map((item) => item.id),
    item = current,
    menu = false,
  ) => (
    <>
      {space === 'trash' ? (
        <>
          <button
            role={menu ? 'menuitem' : undefined}
            type="button"
            disabled={busy || !ids.length}
            onClick={() => batch('restore')}
          >
            {t('Restaurar')}
          </button>
          <button
            role={menu ? 'menuitem' : undefined}
            type="button"
            disabled={busy || !ids.length}
            onClick={() => batch('purge')}
          >
            {t('Excluir definitivamente')}
          </button>
        </>
      ) : (
        <>
          <button
            role={menu ? 'menuitem' : undefined}
            type="button"
            disabled={busy || !item}
            onClick={() => {
              setContext(null);
              open(item);
            }}
          >
            {t('Abrir')}
          </button>
          {item?.kind === 'file' && fileKind(item.name) === 'text' && (
            <button
              role={menu ? 'menuitem' : undefined}
              type="button"
              disabled={busy}
              onClick={() => {
                setContext(null);
                open(item, true);
              }}
            >
              {t('Editar')}
            </button>
          )}
          <button
            role={menu ? 'menuitem' : undefined}
            type="button"
            disabled={busy || !item}
            onClick={() => {
              setAction({ type: 'rename', id: item.id, name: item.name });
              setContext(null);
            }}
          >
            {t('Renomear')}
          </button>
          <button
            role={menu ? 'menuitem' : undefined}
            type="button"
            disabled={busy || !ids.length}
            onClick={() => {
              setAction({ type: 'move', ids, parentId: null });
              setContext(null);
            }}
          >
            {t('Mover item')}
          </button>
          <button
            role={menu ? 'menuitem' : undefined}
            type="button"
            disabled={busy || !ids.length}
            onClick={() => batch('trash')}
          >
            {t('Mover para lixeira')}
          </button>
        </>
      )}
    </>
  );
  /* === Estrutura visual === */
  return (
    <article
      className="desktop-window__content ws-app ws-files"
      data-space={space}
      data-folder-open={Boolean(folderId && folder)}
    >
      <div className="ws-files__layout">
        {/* ----- Navegação lateral ----- */}
        <aside className="ws-files__sidebar" aria-label={t('Locais')}>
          <div className="ws-files__identity" aria-hidden="true">
            <span className="ws-files__identity-mark">
              <HardDrive size={21} />
            </span>
            <span className="ws-files__identity-copy">
              <strong>WS Files</strong>
              <small>WS OS / Explorer</small>
            </span>
          </div>
          <span className="ws-files__sidebar-label">{t('Locais')}</span>
          <nav className="ws-files__navigation">
            {[
              ['home', 'Início', House],
              ['personal', 'Meus arquivos', FolderOpen],
              ['official', 'Arquivos oficiais', ShieldCheck],
              ['trash', 'Lixeira', Trash2],
            ].map(([id, label, Icon]) => (
              <button
                type="button"
                key={id}
                disabled={busy}
                aria-pressed={space === id}
                onClick={() => navigate(id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{t(label)}</span>
              </button>
            ))}
          </nav>
          <section className="ws-files__storage" aria-label={t('Meus arquivos')}>
            <div className="ws-files__storage-heading">
              <HardDrive size={15} />
              <strong>{t('Meus arquivos')}</strong>
            </div>
            <div
              className="ws-files__storage-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(storagePercent)}
              aria-label="Armazenamento local utilizado"
            >
              <span style={{ width: `${storagePercent}%` }} />
            </div>
            <span>
              {(usedBytes / (1024 * 1024)).toLocaleString(locale, { maximumFractionDigits: 1 })} /
              50 MB
            </span>
            <p>{t('Arquivos pessoais ficam neste navegador.')}</p>
          </section>
        </aside>
        {/* ----- Conteúdo e navegação por pastas ----- */}
        <main
          className="ws-files__main"
          tabIndex={-1}
          onContextMenu={(event) => {
            if (
              event.target.closest(
                'input, textarea, select, button, a, form, [contenteditable="true"]',
              )
            )
              return;
            showContext(event);
          }}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget) contextKey(event);
          }}
        >
          {/* ----- Barra de navegação do gerenciador ----- */}
          {/* ----- Barra de endereços do sistema de arquivos ----- */}
          <header className="ws-files__page-header">
            <div
              className="ws-files__addressbar"
              ref={addressAreaRef}
              onKeyDown={(event) => {
                if (event.ctrlKey && event.key.toLowerCase() === 'l') {
                  event.preventDefault();
                  editAddress();
                }
              }}
            >
              {/* ----- Navegação para pasta anterior ----- */}
              <button
                type="button"
                className="ws-files__addressbar-back"
                aria-label="Voltar"
                disabled={space === 'home' || busy}
                onClick={() => {
                  if (space === 'personal' && folderId) {
                    navigate('personal', folder?.parentId ?? null);
                  } else {
                    navigate('home');
                  }
                }}
              >
                <ArrowLeft size={17} aria-hidden="true" />
              </button>
              {/* ----- Campo de endereço e breadcrumbs ----- */}
              <div className="ws-files__addressbar-path">
                {editingAddress ? (
                  <form
                    className="ws-files__address-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      navigateToAddress(addressValue);
                    }}
                  >
                    <input
                      ref={addressInputRef}
                      autoFocus
                      value={addressValue}
                      aria-label="Editar caminho da pasta"
                      onChange={(event) => {
                        setAddressValue(event.target.value);
                        setAddressError('');
                      }}
                      onFocus={(event) => event.target.select()}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setEditingAddress(false);
                          setAddressError('');
                        }
                      }}
                      onBlur={(event) => {
                        if (!event.currentTarget.form?.contains(event.relatedTarget)) {
                          setEditingAddress(false);
                        }
                      }}
                    />
                  </form>
                ) : (
                  <div
                    className="ws-files__addressbar-segments"
                    onClick={(event) => {
                      if (event.target === event.currentTarget) editAddress();
                    }}
                  >
                    <button type="button" onClick={() => navigate('home')}>
                      <House size={15} aria-hidden="true" />
                      WS Files
                    </button>
                    {space !== 'home' && (
                      <>
                        <ChevronRight size={14} aria-hidden="true" />
                        <button type="button" onClick={() => navigate(space)}>
                          {space === 'personal'
                            ? 'Meus arquivos'
                            : space === 'official'
                              ? 'Arquivos oficiais'
                              : 'Lixeira'}
                        </button>
                      </>
                    )}
                    {space === 'personal' &&
                      breadcrumbs.map((item) => (
                        <span key={item.id} className="ws-files__addressbar-segment">
                          <ChevronRight size={14} aria-hidden="true" />
                          <button type="button" onClick={() => navigate('personal', item.id)}>
                            {item.name}
                          </button>
                        </span>
                      ))}
                    <button
                      type="button"
                      className="ws-files__addressbar-edit"
                      aria-label="Digitar endereço"
                      onClick={editAddress}
                    >
                      <span> </span>
                    </button>
                  </div>
                )}
              </div>
              {/* ----- Ações da barra ----- */}
              <button
                type="button"
                className="ws-files__addressbar-copy"
                onClick={copyAddress}
                title="Copiar caminho"
                aria-label="Copiar caminho"
              >
                <Copy size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="ws-files__addressbar-refresh"
                title="Atualizar"
                aria-label="Atualizar"
                onClick={() => {
                  store.refresh();
                  setOfficialRevision((value) => value + 1);
                }}
              >
                <RotateCcw size={16} aria-hidden="true" />
              </button>
            </div>
            {addressError && (
              <p className="ws-files__address-error" role="alert">
                {addressError}
              </p>
            )}
            {/* ----- Pesquisa integrada à navegação ----- */}
            <label className="ws-files__header-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={space === 'home' ? homeQuery : query}
                onChange={(event) => {
                  if (space === 'home') {
                    setHomeQuery(event.target.value);
                  } else {
                    setQuery(event.target.value);
                    setSelected([]);
                  }
                }}
                placeholder={t('Pesquisar arquivos')}
                aria-label={t('Pesquisar arquivos')}
              />
            </label>
          </header>
          {/* ----- Início ou área de arquivos ----- */}
          {space === 'home' ? (
            <section className="ws-files__home">
              {/* ----- Apresentação da área inicial ----- */}
              <header className="ws-files__home-heading">
                <div className="ws-files__home-heading-content">
                  <span className="ws-files__home-eyebrow">
                    <Sparkles size={13} aria-hidden="true" />
                    EXPLORADOR DE ARQUIVOS
                  </span>
                  <h2>Bem-vindo ao WS Files</h2>
                  <p>
                    Seus documentos e arquivos, organizados em um só lugar. Acesse seus espaços e
                    continue de onde parou.
                  </p>
                </div>
                <div className="ws-files__home-heading-art" aria-hidden="true">
                  <FolderOpen size={62} strokeWidth={1.1} />
                </div>
              </header>
              {homeQuery.trim() ? (
                /* ----- Resultados da pesquisa ----- */
                <section className="ws-files__home-section">
                  <div className="ws-files__section-heading">
                    <h3>Resultados da pesquisa</h3>
                    <span>{homeResults.length} resultados</span>
                  </div>
                  <div className="ws-files__recent-list">
                    {homeResults.map((item) => {
                      const Icon =
                        item.kind === 'folder'
                          ? Folder
                          : item.source !== 'local'
                            ? ShieldCheck
                            : iconFor(item.entry);
                      return (
                        <button
                          key={`${item.source}:${item.id}`}
                          type="button"
                          className="ws-files__recent-item"
                          onClick={() => openHomeEntry(item)}
                          onContextMenu={(event) =>
                            showContext(
                              event,
                              item.source === 'local'
                                ? { type: 'local', id: item.id }
                                : { type: 'official', item: item.entry },
                            )
                          }
                          onKeyDown={(event) =>
                            contextKey(
                              event,
                              item.source === 'local'
                                ? { type: 'local', id: item.id }
                                : { type: 'official', item: item.entry },
                            )
                          }
                        >
                          <span className="ws-files__recent-icon">
                            <Icon size={20} aria-hidden="true" />
                          </span>
                          <span className="ws-files__recent-info">
                            <strong>{item.name}</strong>
                            <small>
                              {item.source === 'local'
                                ? item.kind === 'folder'
                                  ? 'Pasta pessoal'
                                  : 'Arquivo pessoal'
                                : 'Arquivo oficial'}
                            </small>
                          </span>
                          <ChevronRight size={17} aria-hidden="true" />
                        </button>
                      );
                    })}
                    {!homeResults.length && (
                      <p className="ws-files__home-empty">Nenhum arquivo corresponde à pesquisa.</p>
                    )}
                  </div>
                </section>
              ) : (
                <>
                  {/* ----- Acesso rápido aos espaços ----- */}
                  <section className="ws-files__home-section">
                    <div className="ws-files__section-heading">
                      <h3>Acesso rápido</h3>
                      <span>Locais principais</span>
                    </div>
                    <div className="ws-files__home-grid">
                      {[
                        {
                          id: 'personal',
                          label: 'Meus arquivos',
                          description: 'Arquivos e pastas pessoais',
                          Icon: FolderOpen,
                          count: store.entries.filter((item) => !item.trashed).length,
                        },
                        {
                          id: 'official',
                          label: 'Arquivos oficiais',
                          description: 'Documentos publicados',
                          Icon: ShieldCheck,
                          count: officialFiles.length,
                        },
                        {
                          id: 'trash',
                          label: 'Lixeira',
                          description: 'Itens removidos',
                          Icon: Trash2,
                          count: store.entries.filter((item) => item.trashed).length,
                        },
                      ].map(({ id, label, description, Icon, count }) => (
                        <button
                          key={id}
                          type="button"
                          className="ws-files__home-card"
                          onClick={() => navigate(id)}
                          disabled={busy}
                        >
                          <span className="ws-files__home-icon">
                            <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
                          </span>
                          <span className="ws-files__home-card-content">
                            <strong>{t(label)}</strong>
                            <span className="ws-files__home-description">{description}</span>
                          </span>
                          <span className="ws-files__home-card-footer">
                            <span>
                              {count} {t('itens')}
                            </span>
                            <ChevronRight size={16} aria-hidden="true" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                  {/* ----- Documentos acessados recentemente ----- */}
                  <section className="ws-files__home-section">
                    <div className="ws-files__section-heading">
                      <h3>Acessados recentemente</h3>
                      <span>{availableRecentFiles.length} arquivos</span>
                    </div>
                    {availableRecentFiles.length ? (
                      <div className="ws-files__recent-list">
                        {availableRecentFiles.map((item) => {
                          const Icon = item.source === 'local' ? iconFor(item.entry) : ShieldCheck;
                          return (
                            <button
                              key={`${item.source}:${item.id}`}
                              type="button"
                              className="ws-files__recent-item"
                              onClick={() => openHomeEntry(item)}
                              onContextMenu={(event) =>
                                showContext(
                                  event,
                                  item.source === 'local'
                                    ? { type: 'local', id: item.id }
                                    : { type: 'official', item: item.entry },
                                )
                              }
                              onKeyDown={(event) =>
                                contextKey(
                                  event,
                                  item.source === 'local'
                                    ? { type: 'local', id: item.id }
                                    : { type: 'official', item: item.entry },
                                )
                              }
                            >
                              <span className="ws-files__recent-icon">
                                <Icon size={20} aria-hidden="true" />
                              </span>
                              <span className="ws-files__recent-info">
                                <strong>{item.name}</strong>
                                <small>
                                  {item.source === 'local' ? 'Arquivo pessoal' : 'Arquivo oficial'}
                                </small>
                              </span>
                              <time dateTime={new Date(item.openedAt).toISOString()}>
                                {new Date(item.openedAt).toLocaleDateString(locale)}
                              </time>
                              <ChevronRight size={16} aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="ws-files__home-empty">
                        <FileText size={23} aria-hidden="true" />
                        <p>Seus arquivos abertos recentemente aparecerão aqui.</p>
                      </div>
                    )}
                  </section>
                </>
              )}
            </section>
          ) : (
            <>
              {/* ----- Barra unificada de ferramentas ----- */}
              <div className="ws-files__tools">
                <div className="ws-files__commandbar" role="toolbar" aria-label={t('Arquivos')}>
                  {space === 'personal' && (
                    <button
                      type="button"
                      className="ws-files__scope"
                      aria-pressed={globalSearch}
                      onClick={() => {
                        setGlobalSearch((value) => !value);
                        setSelected([]);
                      }}
                    >
                      <FolderOpen size={15} aria-hidden="true" />
                      {t('Todas as pastas')}
                    </button>
                  )}
                  <label>
                    {t('Ordenar')}
                    <select
                      value={sort}
                      onChange={(event) => {
                        setSort(event.target.value);
                        persist('ws-os:files-sort', event.target.value);
                      }}
                    >
                      <option value="name">{t('Nome')}</option>
                      <option value="updated">{t('Atualização')}</option>
                      <option value="size">{t('Tamanho')}</option>
                    </select>
                  </label>
                  <div className="ws-files__view-controls">
                    <button
                      type="button"
                      aria-label={t('Visualização em grade')}
                      aria-pressed={viewMode === 'grid'}
                      onClick={() => {
                        setViewMode('grid');
                        persist('ws-os:files-view', 'grid');
                      }}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('Visualização em lista')}
                      aria-pressed={viewMode === 'list'}
                      onClick={() => {
                        setViewMode('list');
                        persist('ws-os:files-view', 'list');
                      }}
                    >
                      <List size={18} />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label={t('Detalhes')}
                    aria-pressed={details}
                    onClick={() => setDetails((value) => !value)}
                  >
                    <Info size={18} />
                  </button>
                </div>
                {space === 'personal' && (
                  <div className="ws-app__toolbar ws-files__create">
                    {(parentId || unavailableFolder) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => navigate('personal', folder?.parentId ?? null)}
                      >
                        <ArrowLeft size={16} />
                        {t('Pasta anterior')}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy || store.loading || unavailableFolder}
                      onClick={() => setAction({ type: 'create-folder', name: '' })}
                    >
                      <Plus size={16} />
                      {t('Criar pasta')}
                    </button>
                    <button
                      type="button"
                      disabled={busy || store.loading || unavailableFolder}
                      onClick={() => setAction({ type: 'create-file', name: '' })}
                    >
                      <FilePlus2 size={16} aria-hidden="true" />
                      {t('Criar arquivo de texto')}
                    </button>
                    <button
                      type="button"
                      disabled={busy || store.loading || unavailableFolder}
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload size={16} />
                      {t('Importar arquivo')}
                    </button>
                    <input
                      ref={inputRef}
                      type="file"
                      hidden
                      accept=".txt,.md,.json,.csv,.log,.js,.css,.html,.png,.jpg,.jpeg,.webp,.pdf"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file && !unavailableFolder)
                          perform(() => uploadLocalFile(file, parentId));
                      }}
                    />
                  </div>
                )}
                {/* ----- Fim da barra unificada ----- */}
              </div>
              {space !== 'official' && currentSelection.length > 0 && (
                <div className="ws-app__toolbar ws-files__selection">
                  <label className="ws-files__check">
                    <input
                      type="checkbox"
                      aria-label={t('Selecionar todos')}
                      checked={
                        visible.length > 0 && visible.every((item) => selected.includes(item.id))
                      }
                      onChange={(event) =>
                        setSelected(event.target.checked ? visible.map((item) => item.id) : [])
                      }
                    />
                    {currentSelection.length} {t('selecionados')}
                  </label>
                  {selectionTools()}
                </div>
              )}
              {store.loading && <p role="status">{t('Carregando')}</p>}
              {store.error && <p role="alert">{t(store.error)}</p>}
              {unavailableFolder && <p role="status">{t('Pasta de destino indisponível.')}</p>}
              <p role="status">{t(message)}</p>
              {action && (
                <form className="ws-app__card ws-files__dialog" onSubmit={submitAction}>
                  <h3>
                    {t(
                      action.type === 'rename'
                        ? 'Renomear'
                        : action.type === 'move'
                          ? 'Mover item'
                          : action.type === 'purge'
                            ? 'Excluir definitivamente'
                            : action.type === 'create-folder'
                              ? 'Criar pasta'
                              : 'Criar arquivo de texto',
                    )}
                  </h3>
                  {['rename', 'create-folder', 'create-file'].includes(action.type) && (
                    <label>
                      {t('Nome')}
                      <input
                        aria-label={t('Nome do novo item')}
                        autoFocus
                        value={action.name}
                        maxLength={120}
                        required
                        disabled={busy}
                        onChange={(event) => setAction({ ...action, name: event.target.value })}
                      />
                    </label>
                  )}
                  {action.type === 'move' && (
                    <label>
                      {t('Pasta de destino')}
                      <select
                        value={action.parentId ?? ''}
                        disabled={busy}
                        onChange={(event) =>
                          setAction({ ...action, parentId: event.target.value || null })
                        }
                      >
                        <option value="">{t('Meus arquivos')}</option>
                        {store.entries
                          .filter(
                            (item) =>
                              item.kind === 'folder' &&
                              !item.trashed &&
                              !action.ids.includes(item.id),
                          )
                          .map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {action.type === 'purge' && (
                    <p>
                      {t(
                        'Esta exclusão é permanente e inclui o conteúdo da pasta. Confirme somente se não precisar recuperá-lo.',
                      )}
                    </p>
                  )}
                  <div className="ws-app__toolbar">
                    <button disabled={busy} type="submit">
                      {t('Confirmar')}
                    </button>
                    <button disabled={busy} type="button" onClick={() => setAction(null)}>
                      {t('Cancelar')}
                    </button>
                  </div>
                </form>
              )}
              {/* ----- Catálogo oficial ou arquivos pessoais ----- */}
              {space === 'official' ? (
                <section className="ws-files__official" aria-label={t('Arquivos oficiais')}>
                  <div className="ws-files__workspace-heading">
                    <div>
                      <strong>{t('Arquivos oficiais')}</strong>
                      <span>
                        {filteredOfficial.length} {t('itens')}
                      </span>
                    </div>
                  </div>
                  {officialLoading && <p role="status">{t('Carregando')}</p>}
                  {officialError && (
                    <p role="status" className="ws-files__notice">
                      {t(
                        'Catálogo remoto indisponível. Os documentos versionados continuam disponíveis.',
                      )}
                    </p>
                  )}
                  <div className="ws-files__official-grid">
                    {filteredOfficial.map((item) => (
                      <article
                        className="ws-app__card ws-files__official-card"
                        key={item.id}
                        tabIndex={0}
                        aria-label={contentText(item.name, locale)}
                        onContextMenu={(event) => showContext(event, { type: 'official', item })}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          contextKey(event, { type: 'official', item });
                          if (event.key === 'Enter') openOfficial(item);
                        }}
                      >
                        <div className="ws-files__official-heading">
                          <span className="ws-files__official-badge">
                            <ShieldCheck size={13} aria-hidden="true" />
                            {t('Somente leitura')}
                          </span>
                          <button
                            type="button"
                            className="ws-files__official-more"
                            aria-label={t('Ações') + ' ' + contentText(item.name, locale)}
                            onClick={(event) => showContext(event, { type: 'official', item })}
                          >
                            <MoreHorizontal size={18} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="ws-files__official-icon">
                          {item.mimeType?.startsWith('image/') ||
                            /\.(png|jpe?g|webp)$/i.test(contentText(item.name, locale)) ? (
                            <FileImage size={23} aria-hidden="true" />
                          ) : (
                            <FileText size={23} aria-hidden="true" />
                          )}
                        </div>
                        <div className="ws-files__official-description">
                          <h3 title={contentText(item.name, locale)}>
                            {contentText(item.name, locale)}
                          </h3>
                          {item.description && <p>{contentText(item.description, locale)}</p>}
                          {item.source === 'managed' && Number.isFinite(item.size) && (
                            <small>
                              {(item.size / 1024).toLocaleString(locale, {
                                maximumFractionDigits: 1,
                              })}{' '}
                              KB
                            </small>
                          )}
                        </div>
                        <button type="button" onClick={() => openOfficial(item)}>
                          {t('Visualizar')}
                        </button>
                      </article>
                    ))}
                  </div>
                  {!officialLoading && !filteredOfficial.length && (
                    <p className="ws-files__empty" role="status">
                      {t(
                        term ? 'Nenhum arquivo encontrado.' : 'Nenhum arquivo oficial cadastrado.',
                      )}
                    </p>
                  )}
                </section>
              ) : (
                <div className={`ws-files__workspace ${details ? 'has-details' : ''}`}>
                  <div className="ws-files__workspace-heading">
                    <div>
                      <strong>
                        {space === 'trash' ? t('Lixeira') : (folder?.name ?? t('Meus arquivos'))}
                      </strong>
                      <span>
                        {visible.length} {t('itens')}
                      </span>
                    </div>
                    {space === 'personal' && (
                      <span className="ws-files__workspace-hint">Duplo clique para abrir</span>
                    )}
                  </div>
                  <ul
                    className={`ws-files__list ${viewMode === 'grid' ? 'ws-files__list--grid' : 'ws-files__list--details'}`}
                    aria-label={t('Arquivos')}
                  >
                    {visible.map((item) => {
                      const Icon = iconFor(item);
                      return (
                        <li
                          key={item.id}
                          className="ws-app__card ws-files__entry"
                          data-selected={selected.includes(item.id)}
                          tabIndex={0}
                          aria-label={item.name}
                          onClick={(event) => {
                            select(event, item);
                            if (event.nativeEvent?.pointerType === 'touch' && space !== 'trash')
                              open(item);
                          }}
                          onDoubleClick={() => {
                            if (space !== 'trash') open(item);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && space !== 'trash') {
                              event.preventDefault();
                              open(item);
                            }
                            if (event.key === ' ') {
                              event.preventDefault();
                              select(event, item);
                            }
                            if (
                              event.key === 'ContextMenu' ||
                              (event.shiftKey && event.key === 'F10')
                            ) {
                              showContext(event, { type: 'local', id: item.id });
                            }
                          }}
                          onContextMenu={(event) => {
                            showContext(event, { type: 'local', id: item.id });
                          }}
                        >
                          <label
                            className="ws-files__entry-select"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              aria-label={t('Selecionar') + ' ' + item.name}
                              checked={selected.includes(item.id)}
                              onChange={(event) =>
                                setSelected((ids) =>
                                  event.target.checked
                                    ? [...new Set([...ids, item.id])]
                                    : ids.filter((id) => id !== item.id),
                                )
                              }
                            />
                          </label>
                          <span
                            className="ws-files__entry-icon"
                            data-kind={item.kind === 'folder' ? 'folder' : fileKind(item.name)}
                          >
                            <Icon size={viewMode === 'grid' ? 34 : 23} aria-hidden="true" />
                          </span>
                          <strong title={item.name}>{item.name}</strong>
                          <small>
                            {item.kind === 'folder'
                              ? t('Pasta')
                              : (item.blob.size / 1024).toLocaleString(locale, {
                                maximumFractionDigits: 1,
                              }) + ' KB'}
                          </small>
                          <button
                            type="button"
                            className="ws-files__more"
                            aria-label={t('Ações') + ' ' + item.name}
                            onClick={(event) => {
                              showContext(event, { type: 'local', id: item.id });
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </li>
                      );
                    })}
                    {!visible.length && (
                      <li className="ws-files__empty">
                        <span className="ws-files__empty-icon" aria-hidden="true">
                          {space === 'trash' ? <Trash2 size={28} /> : <FolderOpen size={28} />}
                        </span>
                        <strong>
                          {t(
                            term
                              ? 'Nenhum arquivo encontrado.'
                              : space === 'trash'
                                ? 'A lixeira está vazia.'
                                : 'Esta pasta está vazia.',
                          )}
                        </strong>
                        <p>
                          {term
                            ? 'Tente pesquisar com outro nome.'
                            : space === 'trash'
                              ? 'Os itens removidos aparecerão aqui.'
                              : 'Crie uma pasta ou importe um documento para começar.'}
                        </p>
                        {!term && space === 'personal' && !unavailableFolder && (
                          <button
                            type="button"
                            disabled={busy || store.loading}
                            onClick={() => setAction({ type: 'create-folder', name: '' })}
                          >
                            <Plus size={15} aria-hidden="true" /> {t('Criar pasta')}
                          </button>
                        )}
                      </li>
                    )}
                  </ul>
                  {details && (
                    <aside className="ws-files__details">
                      <Info size={24} />
                      <h3>{t('Detalhes')}</h3>
                      {current ? (
                        <dl>
                          <dt>{t('Nome')}</dt>
                          <dd>{current.name}</dd>
                          <dt>{t('Tipo')}</dt>
                          <dd>{t(current.kind === 'folder' ? 'Pasta' : 'Arquivo')}</dd>
                          <dt>{t('Tamanho')}</dt>
                          <dd>{current.blob?.size ?? 0} bytes</dd>
                          <dt>{t('Atualização')}</dt>
                          <dd>{new Date(current.updatedAt).toLocaleString(locale)}</dd>
                          <dt>{t('Revisão')}</dt>
                          <dd>{current.revision}</dd>
                        </dl>
                      ) : (
                        <p>{t('Selecione um item para ver os detalhes.')}</p>
                      )}
                    </aside>
                  )}
                </div>
              )}
              <footer className="ws-files__status">
                <span>
                  {space === 'official' ? filteredOfficial.length : visible.length} {t('itens')}
                </span>
                {space !== 'official' && <span>{t('Somente neste navegador')}</span>}
              </footer>
            </>
          )}
        </main>
      </div>
      {context &&
        createPortal(
          <section
            ref={contextRef}
            className="ws-files__context"
            role="menu"
            aria-label={t('Ações do arquivo')}
            style={{ left: context.x, top: context.y }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => setContext(null)}
          >
            <div className="ws-files__context-heading">
              {t(
                context.type === 'official'
                  ? 'Arquivos oficiais'
                  : context.type === 'local'
                    ? 'Ações do arquivo'
                    : 'Arquivos',
              )}
            </div>
            {context.type === 'local' ? (
              selectionTools(undefined, undefined, true)
            ) : context.type === 'official' ? (
              <button type="button" role="menuitem" onClick={() => openOfficial(context.item)}>
                {t('Visualizar')}
              </button>
            ) : (
              <>
                {space === 'personal' && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={busy || store.loading || unavailableFolder}
                      onClick={() => setAction({ type: 'create-folder', name: '' })}
                    >
                      <Folder size={16} />
                      {t('Criar pasta')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={busy || store.loading || unavailableFolder}
                      onClick={() => setAction({ type: 'create-file', name: '' })}
                    >
                      <FilePlus2 size={16} />
                      {t('Criar arquivo de texto')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={busy || store.loading || unavailableFolder}
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload size={16} />
                      {t('Importar arquivo')}
                    </button>
                  </>
                )}
                <button type="button" role="menuitem" onClick={refreshFiles}>
                  <RotateCcw size={16} />
                  {t('Atualizar')}
                </button>
                {space === 'personal' && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!visible.length}
                    onClick={() => setSelected(visible.map((item) => item.id))}
                  >
                    {t('Selecionar todos')}
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setContext(null);
                context.trigger?.focus();
              }}
            >
              {t('Fechar')}
            </button>
          </section>,
          document.body,
        )}
    </article>
  );
}
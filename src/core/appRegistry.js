import {
  Award,
  Calculator,
  ChartNoAxesCombined,
  Contact,
  FilePenLine,
  FileSearch,
  FileText,
  FolderGit2,
  FolderOpen,
  Gamepad2,
  Info,
  NotebookPen,
  Settings,
  Shield,
  Sparkles,
  TerminalSquare,
  UserRound,
} from 'lucide-react';

/* === Registro de aplicativos === */
/* === Dimensões iniciais por tarefa; geometria permanece somente na sessão === */
const windowProfiles = {
  'about-me': { width: 950, height: 860 },
  projects: { width: 1100, height: 760 },
  'dev-insights': { width: 1100, height: 750 },
  resume: { width: 950, height: 760 },
  certificates: { width: 980, height: 740 },
  contact: { width: 980, height: 760 },
  calculator: { width: 360, height: 520 },
  settings: { width: 980, height: 680 },
  'file-editor': { width: 920, height: 680 },
  'file-viewer': { width: 1040, height: 720 },
  notes: { width: 900, height: 660 },
  files: { width: 1080, height: 720 },
};
const appDefinitions = [
  /* ----- Aplicativos Desktop ----- */
  {
    id: 'about-me',
    name: 'Sobre Mim',
    icon: UserRound,
    category: 'desktop',
    menuCategory: 'portfolio',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/about-me/AboutMe.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'projects',
    name: 'Projetos',
    icon: FolderGit2,
    category: 'desktop',
    menuCategory: 'portfolio',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/projects/Projects.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: true,
    public: true,
    showInMenu: true,
  },
  {
    id: 'dev-insights',
    name: 'Dev Insights',
    icon: ChartNoAxesCombined,
    category: 'desktop',
    menuCategory: 'portfolio',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/dev-insights/DevInsights.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'resume',
    name: 'Currículo',
    icon: FileText,
    category: 'desktop',
    menuCategory: 'portfolio',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/file-viewer/FileViewer.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'certificates',
    name: 'Certificados',
    icon: Award,
    category: 'desktop',
    menuCategory: 'portfolio',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/certificates/Certificates.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'contact',
    name: 'Contato',
    icon: Contact,
    category: 'desktop',
    menuCategory: 'portfolio',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/contact/Contact.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: TerminalSquare,
    category: 'desktop',
    menuCategory: 'development',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/terminal/Terminal.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'games',
    name: 'Jogos',
    icon: Gamepad2,
    category: 'desktop',
    menuCategory: 'entertainment',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/games/Games.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: true,
    public: true,
    showInMenu: true,
  },
  {
    id: 'notes',
    name: 'Notas',
    icon: NotebookPen,
    category: 'desktop',
    menuCategory: 'productivity',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/notes/Notes.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'files',
    name: 'Arquivos',
    icon: FolderOpen,
    category: 'desktop',
    menuCategory: 'productivity',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/files/Files.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'settings',
    name: 'Configurações',
    icon: Settings,
    category: 'desktop',
    menuCategory: 'system',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/settings/Settings.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'about-system',
    name: 'Sobre o Sistema',
    icon: Info,
    category: 'desktop',
    menuCategory: 'system',
    desktopShortcut: true,
    implemented: true,
    loadComponent: () => import('../apps/about-system/AboutSystem.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },

  /* ----- Aplicativos de Sistema ----- */
  {
    id: 'file-viewer',
    name: 'Visualizador de Arquivos',
    icon: FileSearch,
    category: 'system',
    menuCategory: 'system',
    desktopShortcut: false,
    implemented: true,
    loadComponent: () => import('../apps/file-viewer/FileViewer.jsx'),
    allowMultipleInstances: true,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: false,
  },
  {
    id: 'file-editor',
    name: 'Editor de Arquivos',
    icon: FilePenLine,
    category: 'system',
    menuCategory: 'system',
    desktopShortcut: false,
    implemented: true,
    loadComponent: () => import('../apps/file-editor/FileEditor.jsx'),
    allowMultipleInstances: true,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: false,
  },
  {
    id: 'calculator',
    name: 'Calculadora',
    icon: Calculator,
    category: 'system',
    menuCategory: 'productivity',
    desktopShortcut: false,
    implemented: true,
    loadComponent: () => import('../apps/calculator/Calculator.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: true,
  },
  {
    id: 'wally-extended',
    name: 'Wally Estendido',
    icon: Sparkles,
    category: 'system',
    menuCategory: 'system',
    desktopShortcut: false,
    implemented: true,
    loadComponent: () => import('../apps/wally-extended/WallyExtended.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: true,
    showInMenu: false,
  },
  {
    id: 'administration',
    requiredCapability: 'administration.access',
    name: 'Administração',
    icon: Shield,
    category: 'system',
    menuCategory: 'system',
    desktopShortcut: false,
    implemented: true,
    loadComponent: () => import('../apps/administration/Administration.jsx'),
    allowMultipleInstances: false,
    pauseWhenMinimized: false,
    public: false,
    showInMenu: false,
  },
].map((app) => ({
  ...app,
  window: Object.freeze({
    minWidth: 300,
    minHeight: 220,
    ...(windowProfiles[app.id] ?? { width: 720, height: 480 }),
  }),
}));

/* === Contratos de navegação === */
const navigationContracts = {
  terminal: { params: {}, reusePolicy: 'existing' },
  /* ----- Aplicativos Desktop ----- */
  projects: {
    params: {
      projectId: 'string',
    },
    reusePolicy: 'existing',
  },
  notes: {
    params: {
      postId: 'string',
    },
    reusePolicy: 'existing',
  },
  settings: {
    params: {
      section: 'string',
    },
    reusePolicy: 'existing',
  },

  /* ----- Aplicativos de Sistema ----- */
  'file-viewer': {
    params: {
      fileId: 'string',
      url: 'string',
      name: 'string',
      resource: 'file-resource',
    },
    reusePolicy: 'multiple',
  },
  'file-editor': {
    params: {
      fileId: 'string',
    },
    reusePolicy: 'multiple',
  },
};

/* === Consultas do Registry === */
/* ----- Definição de aplicativo ----- */
export function getAppDefinition(appId) {
  return appDefinitions.find((app) => app.id === appId) ?? null;
}

/* ----- Lista de aplicativos ----- */
export function getRegisteredApps() {
  return [...appDefinitions];
}

/* ----- Contrato de navegação ----- */
export function getAppNavigationContract(appId) {
  const app = getAppDefinition(appId);

  if (!app) return null;

  const contract = navigationContracts[appId];

  return {
    requiredCapability: app.requiredCapability ?? null,
    requiresAuthentication: !app.public,
    params: contract?.params ?? null,
    reusePolicy: contract?.reusePolicy ?? (app.allowMultipleInstances ? 'multiple' : 'existing'),
  };
}

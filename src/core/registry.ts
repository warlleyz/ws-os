
import type {
    AppDefinition,
    AppId,
    AppRegistryContract,
} from './types'

/**
 * Catálogo central dos aplicativos da WS OS V2.
 *
 * Os identificadores devem permanecer estáveis:
 * preferências e outros serviços poderão utilizá-los.
 */
const APP_DEFINITIONS = [
    {
        id: 'about-me',
        name: 'Sobre Mim',
        icon: 'user-round',
        category: 'portfolio',
        instancePolicy: 'single',
        capabilities: ['windows'],
    },
    {
        id: 'projects',
        name: 'Projetos',
        icon: 'folder-kanban',
        category: 'portfolio',
        instancePolicy: 'single',
        capabilities: ['windows'],
    },
    {
        id: 'dev-insights',
        name: 'Dev Insights',
        icon: 'chart-no-axes-combined',
        category: 'portfolio',
        instancePolicy: 'single',
        capabilities: ['windows'],
    },
    {
        id: 'resume',
        name: 'Currículo',
        icon: 'file-user',
        category: 'career',
        instancePolicy: 'single',
        capabilities: ['windows'],
    },
    {
        id: 'certificates',
        name: 'Certificados',
        icon: 'award',
        category: 'career',
        instancePolicy: 'single',
        capabilities: ['windows'],
    },
    {
        id: 'contact',
        name: 'Contato',
        icon: 'mail',
        category: 'communication',
        instancePolicy: 'single',
        capabilities: ['windows'],
    },
    {
        id: 'notes',
        name: 'Notas',
        icon: 'notebook-pen',
        category: 'utilities',
        instancePolicy: 'single',
        capabilities: ['windows', 'preferences'],
    },
    {
        id: 'games',
        name: 'Jogos',
        icon: 'gamepad-2',
        category: 'entertainment',
        instancePolicy: 'single',
        capabilities: ['windows', 'audio'],
    },
    {
        id: 'files',
        name: 'Arquivos',
        icon: 'folder-open',
        category: 'utilities',
        instancePolicy: 'multiple',
        capabilities: ['windows', 'files:read', 'files:write'],
    },
    {
        id: 'terminal',
        name: 'Terminal',
        icon: 'terminal',
        category: 'system',
        instancePolicy: 'multiple',
        capabilities: ['windows', 'system:read'],
    },
    {
        id: 'settings',
        name: 'Configurações',
        icon: 'settings',
        category: 'system',
        instancePolicy: 'single',
        capabilities: ['windows', 'preferences'],
    },
    {
        id: 'system-about',
        name: 'Sobre o Sistema',
        icon: 'info',
        category: 'system',
        instancePolicy: 'single',
        capabilities: ['windows', 'system:read'],
    },
] as const satisfies readonly AppDefinition[]

const apps: readonly AppDefinition[] = Object.freeze(
    APP_DEFINITIONS.map((app) =>
        Object.freeze({
            ...app,
            capabilities: Object.freeze([...app.capabilities]),
        }),
    ),
)

const appsById = new Map<AppId, AppDefinition>(
    apps.map((app) => [app.id, app]),
)

export const appRegistry: AppRegistryContract = {
    getApp(appId) {
        return appsById.get(appId)
    },

    getApps() {
        return apps
    },
}

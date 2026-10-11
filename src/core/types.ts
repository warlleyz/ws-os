
/**
 * Contratos fundamentais da WS OS V2.
 *
 * O Core descreve aplicativos e instâncias.
 * A apresentação de janelas pertence ao Shell.
 */

export type AppId = string
export type InstanceId = string

/**
 * Política de instâncias declarada por aplicativo.
 */
export type AppInstancePolicy = 'single' | 'multiple'

/**
 * Capacidades internas solicitadas por aplicativos.
 * A autorização efetiva será implementada nos serviços
 * responsáveis, não apenas por estes tipos.
 */
export type AppCapability =
    | 'windows'
    | 'notifications'
    | 'audio'
    | 'preferences'
    | 'files:read'
    | 'files:write'
    | 'system:read'
    | 'system:control'
    | 'admin'

/**
 * Identificação e configuração inicial de um aplicativo.
 */
export interface AppDefinition {
    id: AppId
    name: string
    description?: string
    icon: string
    category: AppCategory
    instancePolicy: AppInstancePolicy
    capabilities: readonly AppCapability[]
}

export type AppCategory =
    | 'portfolio'
    | 'career'
    | 'system'
    | 'utilities'
    | 'entertainment'
    | 'communication'

/**
 * Ciclo de vida lógico de uma instância.
 *
 * Minimização, posição e tamanho são estados de
 * apresentação gerenciados pelo Shell.
 */
export type AppInstanceStatus =
    | 'starting'
    | 'running'
    | 'suspended'
    | 'closing'
    | 'error'

export interface AppInstance {
    id: InstanceId
    appId: AppId
    status: AppInstanceStatus
    createdAt: number
}

/**
 * Operações disponibilizadas futuramente pelo Core.
 * Esta etapa define somente o contrato, sem implementar
 * gerenciamento de estado ou permissões.
 */
export interface AppRegistryContract {
    getApp(appId: AppId): AppDefinition | undefined
    getApps(): readonly AppDefinition[]
}

export interface AppLifecycleContract {
    open(appId: AppId): InstanceId
    close(instanceId: InstanceId): void
    getInstance(instanceId: InstanceId): AppInstance | undefined
    getInstances(): readonly AppInstance[]
}

/**
 * Eventos emitidos pelo gerenciamento de instâncias.
 */

export type AppLifecycleEvent =
    | {
        type: 'instance:opened'
        instance: AppInstance
    }
    | {
        type: 'instance:reused'
        instance: AppInstance
    }
    | {
        type: 'instance:closed'
        instance: AppInstance
    }
    | {
        type: 'instance:status-changed'
        instance: AppInstance
        previousStatus: AppInstanceStatus
    }

export type AppLifecycleListener = (
    event: AppLifecycleEvent, 
) => void 

export interface ObservableAppLifecycleContract
    extends AppLifecycleContract {
    subscribe(listener: AppLifecycleListener): () => void

    setStatus(
        instanceId: InstanceId,
        status: AppInstanceStatus,
    ): boolean

    getSnapshot(): readonly AppInstance[]

    subscribeSnapshot(listener: () => void): () => void
}

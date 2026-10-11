
import { appRegistry } from './registry'

import type {
    AppId,
    AppInstance,
    AppInstanceStatus,
    AppLifecycleEvent,
    AppLifecycleListener,
    InstanceId,
    ObservableAppLifecycleContract,
} from './types'

const ALLOWED_TRANSITIONS: Record<
    AppInstanceStatus,
    readonly AppInstanceStatus[]
> = {
    starting: ['running', 'error', 'closing'],
    running: ['suspended', 'error', 'closing'],
    suspended: ['running', 'error', 'closing'],
    error: ['running', 'closing'],
    closing: [],
}

function canTransition(
    currentStatus: AppInstanceStatus,
    nextStatus: AppInstanceStatus,
): boolean {
    return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)
}

export function createAppLifecycle(): ObservableAppLifecycleContract {
    const instances = new Map<InstanceId, AppInstance>()
    const listeners = new Set<AppLifecycleListener>()


    let snapshot: readonly AppInstance[] = []
    const snapshotListeners = new Set<() => void>()

    function updateSnapshot(): void {
        snapshot = Array.from(instances.values(), (instance) => ({
            ...instance,
        }))

        for (const listener of Array.from(snapshotListeners)) {
            try {
                listener()
            } catch (error) {
                console.error(
                    '[WS OS Core] Erro em listener de snapshot:',
                    error,
                )
            }
        }
    }

    function getSnapshot(): readonly AppInstance[] {
        return snapshot
    }

    function subscribeSnapshot(listener: () => void): () => void {
        snapshotListeners.add(listener)

        return () => {
            snapshotListeners.delete(listener)
        }
    }

    function emit(event: AppLifecycleEvent): void {
        for (const listener of Array.from(listeners)) {
            try {
                listener(event)
            } catch (error) {
                console.error(
                    '[WS OS Core] Erro em listener do ciclo de vida:',
                    error,
                )
            }
        }
    }

    function subscribe(listener: AppLifecycleListener): () => void {
        listeners.add(listener)

        return () => {
            listeners.delete(listener)
        }
    }

    function open(appId: AppId): InstanceId {
        const app = appRegistry.getApp(appId)

        if (!app) {
            throw new Error(`Aplicativo não registrado: ${appId}`)
        }

        if (app.instancePolicy === 'single') {
            const existing = Array.from(instances.values()).find(
                (instance) =>
                    instance.appId === appId &&
                    instance.status !== 'closing',
            )

            if (existing) {

                if (existing.status === 'suspended') {
                    setStatus(existing.id, 'running')
                }

                const currentInstance = instances.get(existing.id)

                if (currentInstance) {
                    emit({
                        type: 'instance:reused',
                        instance: { ...currentInstance },
                    })
                }

                return existing.id
            }
        }

        const instance: AppInstance = {
            id: crypto.randomUUID(),
            appId,
            status: 'running',
            createdAt: Date.now(),
        }

        instances.set(instance.id, instance)
        updateSnapshot()

        emit({
            type: 'instance:opened',
            instance: { ...instance },
        })

        return instance.id
    }

    function setStatus(
        instanceId: InstanceId,
        status: AppInstanceStatus,
    ): boolean {
        const instance = instances.get(instanceId)

        if (!instance || !canTransition(instance.status, status)) {
            return false
        }

        const previousStatus = instance.status

        const updatedInstance: AppInstance = {
            ...instance,
            status,
        }

        instances.set(instanceId, updatedInstance)
        updateSnapshot()

        emit({
            type: 'instance:status-changed',
            instance: { ...updatedInstance },
            previousStatus,
        })

        return true
    }

    function close(instanceId: InstanceId): void {
        const instance = instances.get(instanceId)

        if (!instance) {
            return
        }

        instances.delete(instanceId)
        updateSnapshot()

        emit({
            type: 'instance:closed',
            instance: { ...instance },
        })
    }

    function getInstance(
        instanceId: InstanceId,
    ): AppInstance | undefined {
        const instance = instances.get(instanceId)

        return instance ? { ...instance } : undefined
    }

    function getInstances(): readonly AppInstance[] {
        return Array.from(
            instances.values(),
            (instance) => ({ ...instance }),
        )
    }

    return {
        open,
        close,
        getInstance,
        getInstances,
        setStatus,
        subscribe,
        getSnapshot,
        subscribeSnapshot,
    }

}

/**
 * Instância compartilhada do gerenciador de aplicativos.
 *
 * O Shell e os serviços deverão consumir esta instância.
 * A função createAppLifecycle permanece disponível
 * para criar instâncias isoladas nos testes.
 */
export const appLifecycle = createAppLifecycle()

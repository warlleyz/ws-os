
import { useSyncExternalStore } from 'react'

import { appLifecycle } from './lifecycle'

/**
 * Permite que componentes React acompanhem as
 * instâncias do Core sem duplicar seu estado.
 */
export function useApps() {
    return useSyncExternalStore(
        appLifecycle.subscribeSnapshot,
        appLifecycle.getSnapshot,
        appLifecycle.getSnapshot,
    )
}

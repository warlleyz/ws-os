
import { describe, expect, it } from 'vitest'

import { appRegistry } from './registry'

describe('registro de aplicativos da WS OS', () => {
    it('registra os 12 aplicativos principais', () => {
        expect(appRegistry.getApps()).toHaveLength(12)
    })

    it('não permite identificadores duplicados', () => {
        const apps = appRegistry.getApps()
        const ids = apps.map((app) => app.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it('recupera um aplicativo pelo identificador', () => {
        const app = appRegistry.getApp('terminal')

        expect(app?.name).toBe('Terminal')
        expect(app?.instancePolicy).toBe('multiple')
    })

    it('retorna undefined para aplicativos inexistentes', () => {
        expect(appRegistry.getApp('unknown')).toBeUndefined()
    })

    it('possui configurações válidas de instâncias', () => {
        for (const app of appRegistry.getApps()) {
            expect(['single', 'multiple']).toContain(
                app.instancePolicy,
            )
        }
    })

    it('declara a capacidade de janelas nos aplicativos', () => {
        for (const app of appRegistry.getApps()) {
            expect(app.capabilities).toContain('windows')
        }
    })


    it('protege a lista de aplicativos contra alterações', () => {
        expect(Object.isFrozen(appRegistry.getApps())).toBe(true)
    })

    it('protege os metadados e capacidades dos aplicativos', () => {
        for (const app of appRegistry.getApps()) {
            expect(Object.isFrozen(app)).toBe(true)
            expect(Object.isFrozen(app.capabilities)).toBe(true)
        }
    })
    
    it('mantém Projetos como aplicativo de instância única', () => {
        const projects = appRegistry.getApp('projects')

        expect(projects?.instancePolicy).toBe('single')
    })

})

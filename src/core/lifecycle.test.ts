
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppLifecycle } from './lifecycle'

describe('ciclo de vida dos aplicativos', () => {
    let lifecycle: ReturnType<typeof createAppLifecycle>

    beforeEach(() => {
        lifecycle = createAppLifecycle()
    })

    it('abre um aplicativo registrado', () => {
        const id = lifecycle.open('about-me')
        const instance = lifecycle.getInstance(id)

        expect(instance?.appId).toBe('about-me')
        expect(instance?.status).toBe('running')
    })

    it('reutiliza uma instância única', () => {
        const firstId = lifecycle.open('settings')
        const secondId = lifecycle.open('settings')

        expect(secondId).toBe(firstId)
        expect(lifecycle.getInstances()).toHaveLength(1)
    })

    it('permite múltiplas instâncias quando configurado', () => {
        const firstId = lifecycle.open('terminal')
        const secondId = lifecycle.open('terminal')

        expect(secondId).not.toBe(firstId)
        expect(lifecycle.getInstances()).toHaveLength(2)
    })

    it('fecha uma instância', () => {
        const id = lifecycle.open('projects')

        lifecycle.close(id)

        expect(lifecycle.getInstance(id)).toBeUndefined()
        expect(lifecycle.getInstances()).toHaveLength(0)
    })

    it('impede aplicativos não registrados', () => {
        expect(() => lifecycle.open('unknown')).toThrow(
            'Aplicativo não registrado',
        )
    })

    it('mantém instâncias independentes', () => {
        const settings = lifecycle.open('settings')
        const terminal = lifecycle.open('terminal')

        lifecycle.close(settings)

        expect(lifecycle.getInstance(settings)).toBeUndefined()
        expect(lifecycle.getInstance(terminal)).toBeDefined()
    })

    it('retorna uma lista atualizada de instâncias', () => {
        lifecycle.open('about-me')
        lifecycle.open('terminal')
        lifecycle.open('terminal')

        const instances = lifecycle.getInstances()

        expect(instances).toHaveLength(3)
        expect(instances.map((instance) => instance.appId)).toEqual([
            'about-me',
            'terminal',
            'terminal',
        ])
    })


    it('notifica quando uma instância é aberta', () => {
        const events: string[] = []

        lifecycle.subscribe((event) => {
            events.push(event.type)
        })

        lifecycle.open('terminal')

        expect(events).toEqual(['instance:opened'])
    })

    it('notifica a reutilização de uma instância única', () => {
        const events: string[] = []

        lifecycle.subscribe((event) => {
            events.push(event.type)
        })

        lifecycle.open('settings')
        lifecycle.open('settings')

        expect(events).toEqual([
            'instance:opened',
            'instance:reused',
        ])
    })

    it('notifica o fechamento de uma instância', () => {
        const events: string[] = []

        lifecycle.subscribe((event) => {
            events.push(event.type)
        })

        const id = lifecycle.open('projects')
        lifecycle.close(id)

        expect(events).toEqual([
            'instance:opened',
            'instance:closed',
        ])
    })

    it('permite cancelar a inscrição de eventos', () => {
        const events: string[] = []

        const unsubscribe = lifecycle.subscribe((event) => {
            events.push(event.type)
        })

        lifecycle.open('terminal')
        unsubscribe()
        lifecycle.open('terminal')

        expect(events).toEqual(['instance:opened'])
    })

    it('não emite fechamento para instâncias inexistentes', () => {
        const events: string[] = []

        lifecycle.subscribe((event) => {
            events.push(event.type)
        })

        lifecycle.close('unknown-instance')

        expect(events).toHaveLength(0)
    })


    it('altera o estado de uma instância', () => {
        const id = lifecycle.open('games')

        expect(lifecycle.setStatus(id, 'suspended')).toBe(true)
        expect(lifecycle.getInstance(id)?.status).toBe('suspended')
    })

    it('permite retomar uma instância suspensa', () => {
        const id = lifecycle.open('games')

        lifecycle.setStatus(id, 'suspended')
        lifecycle.setStatus(id, 'running')

        expect(lifecycle.getInstance(id)?.status).toBe('running')
    })

    it('emite evento quando o estado é alterado', () => {
        const changes: string[] = []

        lifecycle.subscribe((event) => {
            if (event.type === 'instance:status-changed') {
                changes.push(
                    `${event.previousStatus}->${event.instance.status}`,
                )
            }
        })

        const id = lifecycle.open('games')
        lifecycle.setStatus(id, 'suspended')

        expect(changes).toEqual(['running->suspended'])
    })

    it('não emite evento quando o estado não muda', () => {
        const changes: string[] = []

        lifecycle.subscribe((event) => {
            if (event.type === 'instance:status-changed') {
                changes.push(event.type)
            }
        })

        const id = lifecycle.open('games')

        expect(lifecycle.setStatus(id, 'running')).toBe(false)
        expect(changes).toHaveLength(0)
    })

    it('não altera instâncias inexistentes', () => {
        expect(
            lifecycle.setStatus('unknown-instance', 'suspended'),
        ).toBe(false)
    })


    it('permite suspender e retomar uma instância', () => {
        const id = lifecycle.open('games')

        expect(lifecycle.setStatus(id, 'suspended')).toBe(true)
        expect(lifecycle.setStatus(id, 'running')).toBe(true)
        expect(lifecycle.getInstance(id)?.status).toBe('running')
    })

    it('permite recuperar uma instância em erro', () => {
        const id = lifecycle.open('terminal')

        expect(lifecycle.setStatus(id, 'error')).toBe(true)
        expect(lifecycle.setStatus(id, 'running')).toBe(true)
        expect(lifecycle.getInstance(id)?.status).toBe('running')
    })

    it('impede uma transição não permitida', () => {
        const id = lifecycle.open('terminal')

        expect(lifecycle.setStatus(id, 'starting')).toBe(false)
        expect(lifecycle.getInstance(id)?.status).toBe('running')
    })

    it('impede reativar uma instância em encerramento', () => {
        const id = lifecycle.open('settings')

        expect(lifecycle.setStatus(id, 'closing')).toBe(true)
        expect(lifecycle.setStatus(id, 'running')).toBe(false)
        expect(lifecycle.getInstance(id)?.status).toBe('closing')
    })

    it('permite remover uma instância em encerramento', () => {
        const id = lifecycle.open('settings')

        lifecycle.setStatus(id, 'closing')
        lifecycle.close(id)

        expect(lifecycle.getInstance(id)).toBeUndefined()
    })

    it('não emite eventos para transições inválidas', () => {
        const changes: string[] = []

        lifecycle.subscribe((event) => {
            if (event.type === 'instance:status-changed') {
                changes.push(event.type)
            }
        })

        const id = lifecycle.open('terminal')

        expect(lifecycle.setStatus(id, 'starting')).toBe(false)
        expect(lifecycle.setStatus(id, 'closing')).toBe(true)
        expect(lifecycle.setStatus(id, 'suspended')).toBe(false)

        expect(changes).toHaveLength(1)
    })


    it('retoma uma instância única suspensa ao reabrir', () => {
        const id = lifecycle.open('settings')

        lifecycle.setStatus(id, 'suspended')

        const reopenedId = lifecycle.open('settings')

        expect(reopenedId).toBe(id)
        expect(lifecycle.getInstance(id)?.status).toBe('running')
        expect(lifecycle.getInstances()).toHaveLength(1)
    })

    it('preserva o erro ao reutilizar uma instância única', () => {
        const id = lifecycle.open('settings')

        lifecycle.setStatus(id, 'error')

        const reopenedId = lifecycle.open('settings')

        expect(reopenedId).toBe(id)
        expect(lifecycle.getInstance(id)?.status).toBe('error')
        expect(lifecycle.getInstances()).toHaveLength(1)
    })

    it('cria nova instância quando a anterior está encerrando', () => {
        const firstId = lifecycle.open('settings')

        lifecycle.setStatus(firstId, 'closing')

        const secondId = lifecycle.open('settings')

        expect(secondId).not.toBe(firstId)
        expect(lifecycle.getInstance(firstId)?.status).toBe('closing')
        expect(lifecycle.getInstance(secondId)?.status).toBe('running')
    })

    it('mantém os listeners independentes em caso de erro', () => {
        const received: string[] = []
        const originalConsoleError = console.error

        console.error = () => { }

        try {
            lifecycle.subscribe(() => {
                throw new Error('Falha simulada')
            })

            lifecycle.subscribe((event) => {
                received.push(event.type)
            })

            lifecycle.open('terminal')

            expect(received).toEqual(['instance:opened'])
        } finally {
            console.error = originalConsoleError
        }
    })

    it('emite mudança de estado antes da reutilização', () => {
        const events: string[] = []
        const id = lifecycle.open('settings')

        lifecycle.setStatus(id, 'suspended')

        lifecycle.subscribe((event) => {
            events.push(event.type)
        })

        lifecycle.open('settings')

        expect(events).toEqual([
            'instance:status-changed',
            'instance:reused',
        ])
    })

    it('emite reutilização sem ocultar o erro', () => {
        const id = lifecycle.open('settings')
        lifecycle.setStatus(id, 'error')

        const events: string[] = []

        lifecycle.subscribe((event) => {
            events.push(event.type)
        })

        lifecycle.open('settings')

        expect(events).toEqual(['instance:reused'])
        expect(lifecycle.getInstance(id)?.status).toBe('error')
    })

    it('mantém isolados os gerenciadores criados para testes', () => {
        const first = createAppLifecycle()
        const second = createAppLifecycle()

        const id = first.open('terminal')

        expect(first.getInstance(id)).toBeDefined()
        expect(second.getInstance(id)).toBeUndefined()
        expect(second.getInstances()).toHaveLength(0)
    })


    it('mantém a referência do snapshot sem mudanças', () => {
        const first = lifecycle.getSnapshot()
        const second = lifecycle.getSnapshot()

        expect(second).toBe(first)
    })

    it('atualiza o snapshot apenas quando o estado muda', () => {
        const initial = lifecycle.getSnapshot()

        const id = lifecycle.open('terminal')
        const afterOpen = lifecycle.getSnapshot()

        expect(afterOpen).not.toBe(initial)
        expect(afterOpen).toHaveLength(1)

        // A mesma transição não deve criar outro snapshot.
        expect(lifecycle.setStatus(id, 'running')).toBe(false)
        expect(lifecycle.getSnapshot()).toBe(afterOpen)

        lifecycle.setStatus(id, 'suspended')
        const afterSuspend = lifecycle.getSnapshot()

        expect(afterSuspend).not.toBe(afterOpen)
        expect(afterSuspend[0].status).toBe('suspended')

        lifecycle.close(id)

        expect(lifecycle.getSnapshot()).toHaveLength(0)
    })

})

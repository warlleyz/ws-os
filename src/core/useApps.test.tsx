
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { appLifecycle } from './lifecycle'
import { useApps } from './useApps'

describe('integração do Core com React', () => {
    it('atualiza o hook quando uma instância é aberta', () => {
        const { result, unmount } = renderHook(() => useApps())

        let id = ''

        try {
            act(() => {
                id = appLifecycle.open('terminal')
            })

            expect(
                result.current.some((instance) => instance.id === id),
            ).toBe(true)
        } finally {
            act(() => {
                if (id) appLifecycle.close(id)
            })
            unmount()
        }
    })

    it('atualiza o hook quando uma instância é fechada', () => {
        const id = appLifecycle.open('terminal')
        const { result, unmount } = renderHook(() => useApps())

        try {
            act(() => {
                appLifecycle.close(id)
            })

            expect(
                result.current.some((instance) => instance.id === id),
            ).toBe(false)
        } finally {
            appLifecycle.close(id)
            unmount()
        }
    })


    it('atualiza o hook quando o estado muda', () => {
        const id = appLifecycle.open('games')
        const { result, unmount } = renderHook(() => useApps())

        try {
            act(() => {
                appLifecycle.setStatus(id, 'suspended')
            })

            const instance = result.current.find(
                (item) => item.id === id,
            )

            expect(instance?.status).toBe('suspended')
        } finally {
            act(() => {
                appLifecycle.close(id)
            })

            unmount()
        }
    })

})

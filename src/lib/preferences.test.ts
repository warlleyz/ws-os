
import { beforeEach, describe, expect, it } from 'vitest'

import {
    loadPreferences,
    savePreferences,
} from './preferences'

describe('preferências da WS OS', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('utiliza o tema escuro por padrão', () => {
        expect(loadPreferences()).toEqual({
            theme: 'dark',
        })
    })

    it('salva e recupera o tema claro', () => {
        savePreferences({ theme: 'light' })

        expect(loadPreferences()).toEqual({
            theme: 'light',
        })
    })

    it('recupera a preferência do formato anterior', () => {
        localStorage.setItem('ws-os-theme', 'light')

        expect(loadPreferences()).toEqual({
            theme: 'light',
        })
    })

    it('ignora temas inválidos', () => {
        localStorage.setItem(
            'ws-os-preferences',
            JSON.stringify({ theme: 'invalid' }),
        )

        expect(loadPreferences()).toEqual({
            theme: 'dark',
        })
    })

    it('retorna o padrão quando os dados estão corrompidos', () => {
        localStorage.setItem('ws-os-preferences', '{invalid')

        expect(loadPreferences()).toEqual({
            theme: 'dark',
        })
    })
})


import { useEffect, useState } from 'react'

import { Button, Card, TextField } from './components/ui'
import {
  loadPreferences,
  savePreferences,
  type Preferences,
} from './lib/preferences'

function App() {
  const [preferences, setPreferences] =
    useState<Preferences>(loadPreferences)

  const { theme } = preferences

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    savePreferences(preferences)
  }, [preferences, theme])

  function toggleTheme() {
    setPreferences((current) => ({
      ...current,
      theme: current.theme === 'dark' ? 'light' : 'dark',
    }))
  }

  return (
    <main className="min-h-screen bg-ws-bg px-6 py-10 text-ws-text">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-ws-accent">
              WS OS V2
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Design System
            </h1>

            <p className="mt-2 text-ws-muted">
              Fundação visual inspirada na WS OS V1.
            </p>
          </div>

          <Button variant="secondary" onClick={toggleTheme}>
            Tema {theme === 'dark' ? 'claro' : 'escuro'}
          </Button>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <span className="text-xs font-bold uppercase tracking-wider text-ws-accent">
              Superfície principal
            </span>

            <h2 className="mt-4 text-xl font-bold">
              Identidade visual
            </h2>

            <p className="mt-3 leading-relaxed text-ws-muted">
              Nunito Sans, superfícies suaves e componentes
              compartilhados entre os aplicativos.
            </p>

            <div className="mt-6">
              <Button>Botão principal</Button>
            </div>
          </Card>

          <Card>
            <span className="text-xs font-bold uppercase tracking-wider text-ws-accent">
              Tipografia técnica
            </span>

            <h2 className="mt-4 text-xl font-bold">
              JetBrains Mono Thin
            </h2>

            <div className="mt-4 rounded-xl bg-ws-bg p-4">
              <pre className="ws-mono text-sm leading-7">
                {`> system.status()
> ready: true
> version: 2.0`}
              </pre>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-bold">
            Elementos de interface
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button disabled>Desabilitado</Button>
          </div>

          <div className="mt-6">
            <TextField
              id="ws-test-input"
              label="Campo de teste"
              placeholder="Digite alguma coisa..."
            />
          </div>
        </Card>

        <footer className="text-center text-sm text-ws-muted">
          Marco 01 — Preferências centralizadas
        </footer>
      </div>
    </main>
  )
}

export default App

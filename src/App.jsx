
import { useState } from 'react';

import {
  activateApp,
  closeApp,
  initialAppState,
  minimizeApp,
  openApp,
  restoreApp,
} from './core/appManager';

import {
  getAppDefinition,
  getRegisteredApps,
} from './core/appRegistry';

import './App.css';

function App() {
  const [appState, setAppState] = useState(initialAppState);

  const run = (operation, id) => {
    setAppState((state) => operation(state, id));
  };

  return (
    <main className="system">
      <div className="system__background" aria-hidden="true" />

      <section className="welcome" aria-labelledby="welcome-title">
        <div className="welcome__identity">
          <span className="welcome__symbol" aria-hidden="true">
            W
          </span>
          <span className="welcome__version">VERSION 2.0</span>
        </div>

        <div className="welcome__content">
          <span className="welcome__eyebrow">
            PORTFÓLIO INTERATIVO
          </span>
          <h1 id="welcome-title">
            WS <span>OS</span>
          </h1>
          <p>Core — ciclo de vida das instâncias.</p>
        </div>

        <div className="core-test">
          <h2>Aplicativos</h2>

          <div className="core-test__actions">
            {getRegisteredApps().map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => run(openApp, app.id)}
              >
                Abrir {app.name}
              </button>
            ))}
          </div>

          <h2>Instâncias abertas: {appState.instances.length}</h2>

          {appState.instances.length === 0 ? (
            <p>Nenhuma instância aberta.</p>
          ) : (
            <ul className="core-test__instances">
              {appState.instances.map((instance) => {
                const app = getAppDefinition(instance.appId);
                const isActive =
                  appState.activeInstanceId === instance.id;

                return (
                  <li key={instance.id}>
                    <span>
                      {app?.name ?? instance.appId}
                      {isActive && ' (ativa)'}
                      {instance.minimized && ' (minimizada)'}
                      {' — '}
                      {instance.executionState === 'paused'
                        ? 'Pausada'
                        : 'Em execução'}
                    </span>

                    <div className="core-test__actions">
                      {instance.minimized ? (
                        <button
                          type="button"
                          onClick={() =>
                            run(restoreApp, instance.id)
                          }
                        >
                          Restaurar
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isActive}
                            onClick={() =>
                              run(activateApp, instance.id)
                            }
                          >
                            Ativar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              run(minimizeApp, instance.id)
                            }
                          >
                            Minimizar
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          run(closeApp, instance.id)
                        }
                      >
                        Fechar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="welcome__footer">
          <span className="welcome__status">
            <span className="welcome__status-dot" />
            Core em desenvolvimento
          </span>
          <span className="welcome__signature">
            WARLLEY.DEV
          </span>
        </div>
      </section>
    </main>
  );
}

export default App;

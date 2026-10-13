
import { useState } from 'react';

import Window from './Window';
import Taskbar from './Taskbar';

import {
    activateApp,
    closeApp,
    initialAppState,
    minimizeApp,
    openApp,
    restoreApp,
} from '../core/appManager';

import {
    getAppDefinition,
    getRegisteredApps,
} from '../core/appRegistry';

export default function Desktop() {
    const [appState, setAppState] = useState(initialAppState);

    function run(operation, id) {
        setAppState((current) => operation(current, id));
    }

    return (
        <main className="desktop">
            <div className="desktop__wallpaper" aria-hidden="true" />

            <header className="desktop__header">
                <div className="desktop__brand">
                    <span className="desktop__logo">W</span>

                    <div>
                        <strong>WS OS</strong>
                        <small>Ambiente de desenvolvimento</small>
                    </div>
                </div>

                <span className="desktop__version">V2 · F4.1</span>
            </header>

            <section
                className="desktop__workspace"
                aria-label="Área de trabalho"
            >
                <div className="desktop__shortcuts">
                    {getRegisteredApps().map((app) => (
                        <button
                            key={app.id}
                            className="desktop__shortcut"
                            type="button"
                            onDoubleClick={() => run(openApp, app.id)}
                            title={`Clique duas vezes para abrir ${app.name}`}
                        >
                            <span className="desktop__shortcut-icon">
                                {app.name.charAt(0)}
                            </span>
                            <span>{app.name}</span>
                        </button>
                    ))}
                </div>

                <aside className="desktop__debug">
                    <div className="desktop__debug-heading">
                        <strong>Core</strong>
                        <span>
                            {appState.instances.length} instância(s)
                        </span>
                    </div>

                    <p className="desktop__debug-hint">
                        Clique duas vezes em um aplicativo para abrir.
                    </p>

                    {appState.instances.length === 0 ? (
                        <p className="desktop__empty">
                            Nenhum aplicativo aberto.
                        </p>
                    ) : (
                        <ul className="desktop__instances">
                            {appState.instances.map((instance) => {
                                const app = getAppDefinition(instance.appId);

                                const active =
                                    appState.activeInstanceId === instance.id;

                                return (
                                    <li key={instance.id}>
                                        <div className="desktop__instance-info">
                                            <strong>
                                                {app?.name ?? instance.appId}
                                                {active ? ' · Ativa' : ''}
                                            </strong>

                                            <small>
                                                {instance.minimized
                                                    ? 'Minimizada'
                                                    : 'Aberta'}
                                                {' · '}
                                                {instance.executionState === 'paused'
                                                    ? 'Pausada'
                                                    : 'Em execução'}
                                            </small>
                                        </div>

                                        <div className="desktop__instance-actions">
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
                                                        disabled={active}
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
                </aside>
            </section>

            <div className="desktop__window-layer">
                {appState.instances.map((instance, index) => {
                    const focusIndex =
                        appState.focusHistory.indexOf(instance.id);

                    const isActive =
                        appState.activeInstanceId === instance.id;

                    return (
                        <Window
                            key={instance.id}
                            instance={instance}
                            app={getAppDefinition(instance.appId)}
                            active={isActive}
                            zIndex={focusIndex >= 0 ? focusIndex + 1 : 0}
                            offset={index % 6}
                            onActivate={() =>
                                run(activateApp, instance.id)
                            }
                            onMinimize={() =>
                                run(minimizeApp, instance.id)
                            }
                            onClose={() =>
                                run(closeApp, instance.id)
                            }
                        />
                    );
                })}
            </div>

            <footer className="desktop__footer">
                <span>WS OS V2</span>
                <span>Desktop em desenvolvimento</span>
            </footer>

            <Taskbar
                appState={appState}
                onAppAction={run}
            />
        </main>
    );
}
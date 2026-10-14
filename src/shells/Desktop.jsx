import { useEffect, useMemo, useRef, useState } from 'react';

import Window from './Window';
import Taskbar from './Taskbar';

import {
    activateApp,
    closeApp,
    initialAppState,
    minimizeApp,
    openApp,
} from '../core/appManager';

import {
    getAppDefinition,
    getRegisteredApps,
} from '../core/appRegistry';

const desktopShortcutOrder = [
    'about-me',
    'projects',
    'dev-insights',
    'resume',
    'certificates',
    'contact',
    'terminal',
    'games',
    'notes',
    'files',
    'settings',
    'about-system',
];

const SHORTCUT_SIZE = 82;
const COLUMN_STEP = 90;
const ROW_STEP = 88;
const TASKBAR_RESERVED_WIDTH = 720;
const TASKBAR_RESERVED_BOTTOM = 64;

function getShortcutPositions(count, width, height) {
    const positions = [];
    const rows = Math.max(
        1,
        Math.floor((Math.max(height, SHORTCUT_SIZE) - SHORTCUT_SIZE) / ROW_STEP) + 1,
    );
    const reservedWidth = Math.min(TASKBAR_RESERVED_WIDTH, width);
    const reservedLeft = (width - reservedWidth) / 2;
    const reservedRight = reservedLeft + reservedWidth;
    const reservedTop = height - TASKBAR_RESERVED_BOTTOM;

    for (let column = 0; positions.length < count; column += 1) {
        const left = column * COLUMN_STEP;

        for (let row = 0; row < rows && positions.length < count; row += 1) {
            const top = row * ROW_STEP;

            const overlapsTaskbar =
                left < reservedRight &&
                left + SHORTCUT_SIZE > reservedLeft &&
                top < height &&
                top + SHORTCUT_SIZE > reservedTop;

            if (overlapsTaskbar && height >= SHORTCUT_SIZE + TASKBAR_RESERVED_BOTTOM) continue;

            positions.push({ left, top });
        }
    }

    return positions;
}

export default function Desktop() {
    const [appState, setAppState] = useState(initialAppState);
    const [selectedShortcut, setSelectedShortcut] = useState(null);
    const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
    const shortcutsRef = useRef(null);

    const shortcuts = useMemo(
        () =>
            getRegisteredApps()
                .filter(
                    (app) =>
                        app.desktopShortcut &&
                        desktopShortcutOrder.includes(app.id),
                )
                .sort(
                    (a, b) =>
                        desktopShortcutOrder.indexOf(a.id) -
                        desktopShortcutOrder.indexOf(b.id),
                ),
        [],
    );

    useEffect(() => {
        const element = shortcutsRef.current;
        if (!element) return;

        const observer = new ResizeObserver(([entry]) => {
            const width = Math.round(entry.contentRect.width);
            const height = Math.round(entry.contentRect.height);

            setGridSize((current) =>
                current.width === width && current.height === height
                    ? current
                    : { width, height },
            );
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const positions = getShortcutPositions(
        shortcuts.length,
        gridSize.width,
        gridSize.height,
    );

    function run(operation, id) {
        setAppState((current) => operation(current, id));
    }

    return (
        <main className="desktop">
            <div className="desktop__wallpaper" aria-hidden="true" />

            <section
                className="desktop__workspace"
                aria-label="Área de trabalho"
                onPointerDown={(event) => {
                    if (
                        event.target instanceof Element &&
                        !event.target.closest('.desktop__shortcut')
                    ) {
                        setSelectedShortcut(null);
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setSelectedShortcut(null);
                    }
                }}
            >
                <div
                    ref={shortcutsRef}
                    className="desktop__shortcuts"
                    aria-label="Atalhos da área de trabalho"
                >
                    {shortcuts.map((app, index) => {
                        const AppIcon = app.icon;
                        const isOpen = appState.instances.some(
                            (instance) => instance.appId === app.id,
                        );

                        return (
                            <button
                                key={app.id}
                                className={[
                                    'desktop__shortcut',
                                    selectedShortcut === app.id
                                        ? 'desktop__shortcut--selected'
                                        : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                style={{
                                    position: 'absolute',
                                    left: positions[index].left,
                                    top: positions[index].top,
                                }}
                                type="button"
                                aria-label={`Abrir ${app.name}`}
                                aria-pressed={selectedShortcut === app.id}
                                title={app.name}
                                onClick={() => {
                                    setSelectedShortcut(app.id);
                                }}
                                onDoubleClick={() => {
                                    setSelectedShortcut(app.id);
                                    run(openApp, app.id);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        setSelectedShortcut(app.id);
                                        run(openApp, app.id);
                                    }

                                    if (event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedShortcut(app.id);
                                    }
                                }}
                            >
                                <span
                                    className="desktop__shortcut-icon"
                                    aria-hidden="true"
                                >
                                    {AppIcon ? (
                                        <AppIcon size={27} strokeWidth={1.8} />
                                    ) : (
                                        app.name.charAt(0)
                                    )}

                                    {isOpen && (
                                        <span className="desktop__shortcut-indicator" />
                                    )}
                                </span>

                                <span className="desktop__shortcut-label">
                                    {app.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <div className="desktop__window-layer">
                {appState.instances.map((instance, index) => {
                    const focusIndex = appState.focusHistory.indexOf(instance.id);
                    const isActive = appState.activeInstanceId === instance.id;

                    return (
                        <Window
                            key={instance.id}
                            instance={instance}
                            app={getAppDefinition(instance.appId)}
                            active={isActive}
                            zIndex={focusIndex >= 0 ? focusIndex + 1 : 0}
                            offset={index % 6}
                            onActivate={() => run(activateApp, instance.id)}
                            onMinimize={() => run(minimizeApp, instance.id)}
                            onClose={() => run(closeApp, instance.id)}
                        />
                    );
                })}
            </div>

            <Taskbar appState={appState} onAppAction={run} />
        </main>
    );
}

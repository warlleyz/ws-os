import { useEffect, useMemo, useRef, useState } from 'react';

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

import {
    initialNotificationState,
    createNotification,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
} from '../core/notificationManager';

// Distribuição dos atalhos no Desktop.
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

// Avisos temporários: o histórico é mantido pelo notificationManager.
const TOAST_DURATION = 5000;
const MAX_VISIBLE_TOASTS = 3;

function NotificationToast({ notification, onDismiss, onAction }) {
    const remainingRef = useRef(TOAST_DURATION);
    const startedAtRef = useRef(null);
    const timerRef = useRef(null);
    const onDismissRef = useRef(onDismiss);

    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        const remaining = remainingRef;
        const startedAt = startedAtRef;
        const timer = timerRef;
        const element = document.getElementById(`ws-toast-${notification.id}`);

        function pauseTimer() {
            if (startedAt.current === null) return;
            window.clearTimeout(timer.current);
            remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
            startedAt.current = null;
            timer.current = null;
        }

        function startTimer() {
            if (startedAt.current !== null || remaining.current <= 0) return;
            startedAt.current = Date.now();
            timer.current = window.setTimeout(() => {
                startedAt.current = null;
                timer.current = null;
                onDismissRef.current(notification.id);
            }, remaining.current);
        }

        function handleFocusOut(event) {
            if (!element?.contains(event.relatedTarget) && !element?.matches(':hover')) startTimer();
        }

        function handleMouseLeave() {
            if (!element?.contains(document.activeElement)) startTimer();
        }

        startTimer();
        element?.addEventListener('mouseenter', pauseTimer);
        element?.addEventListener('mouseleave', handleMouseLeave);
        element?.addEventListener('focusin', pauseTimer);
        element?.addEventListener('focusout', handleFocusOut);

        return () => {
            pauseTimer();
            element?.removeEventListener('mouseenter', pauseTimer);
            element?.removeEventListener('mouseleave', handleMouseLeave);
            element?.removeEventListener('focusin', pauseTimer);
            element?.removeEventListener('focusout', handleFocusOut);
        };
    }, [notification.id]);

    const typeLabels = {
        info: 'Informação',
        success: 'Sucesso',
        warning: 'Atenção',
        error: 'Erro',
    };

    return (
        <article
            id={`ws-toast-${notification.id}`}
            className={`ws-toast ws-toast--${notification.type}`}
            role="status"
            aria-label={`Notificação: ${notification.title}`}
        >
            <div className="ws-toast__indicator" aria-hidden="true" />
            <div className="ws-toast__content">
                <div className="ws-toast__header">
                    <span className="ws-toast__source">{notification.source}</span>
                    <span className="ws-toast__type">
                        {typeLabels[notification.type] ?? 'Informação'}
                    </span>
                </div>
                <strong className="ws-toast__title">{notification.title}</strong>
                {notification.message && (
                    <p className="ws-toast__message">{notification.message}</p>
                )}
                {notification.action?.type === 'open-app' && (
                    <button
                        type="button"
                        className="ws-toast__action"
                        onClick={() => onAction(notification)}
                    >
                        {notification.action.label ?? 'Abrir aplicativo'}
                    </button>
                )}
            </div>
            <button
                type="button"
                className="ws-toast__close"
                aria-label={`Dispensar notificação: ${notification.title}`}
                title="Dispensar"
                onClick={() => onDismiss(notification.id)}
            >
                ×
            </button>
        </article>
    );
}

export default function Desktop() {
    const [appState, setAppState] = useState(initialAppState);
    const [notificationState, setNotificationState] = useState(
        initialNotificationState,
    );
    const [visibleToasts, setVisibleToasts] = useState([]);
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
    // Único ponto de entrada para ações de aplicativos e avisos do sistema.
    function run(operation, id) {
        setAppState((current) => operation(current, id));
        if (operation === openApp) {
            const app = getAppDefinition(id);
            if (app) {
                const notification = createNotification({
                    title: 'Aplicativo iniciado',
                    message: `${app.name} foi aberto na WS OS.`,
                    source: 'Sistema',
                    type: 'info',
                    action: {
                        type: 'open-app',
                        appId: app.id,
                    },
                });
                if (notification) {
                    setNotificationState((current) =>
                        addNotification(current, notification),
                    );
                    setVisibleToasts((current) => [
                        ...current,
                        notification,
                    ].slice(-MAX_VISIBLE_TOASTS));
                }
            }
        }
    }

    function handleNotificationAction(action, id) {
        if (action === 'remove') {
            dismissToast(id);
        }
        if (action === 'clear') {
            setVisibleToasts([]);
        }
        setNotificationState((current) => {
            switch (action) {
                case 'read':
                    return markNotificationAsRead(current, id);
                case 'read-all':
                    return markAllNotificationsAsRead(current);
                case 'remove':
                    return removeNotification(current, id);
                case 'clear':
                    return clearNotifications(current);
                default:
                    return current;
            }
        });
    }

    function dismissToast(id) {
        setVisibleToasts((current) =>
            current.filter((notification) => notification.id !== id),
        );
    }

    function handleNotificationOpen(notification) {
        const action = notification?.action;
        if (action?.type !== 'open-app') return;

        const app = getAppDefinition(action.appId);
        if (!app?.public) return;

        const instance = [...appState.instances].reverse().find(
            (item) => item.appId === action.appId,
        );

        if (instance) {
            run(instance.minimized ? restoreApp : activateApp, instance.id);
        } else {
            run(openApp, action.appId);
        }

        setNotificationState((current) =>
            markNotificationAsRead(current, notification.id),
        );
        dismissToast(notification.id);
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
            <Taskbar
                appState={appState}
                onAppAction={run}
                notificationState={notificationState}
                onNotificationAction={handleNotificationAction}
                onNotificationOpen={handleNotificationOpen}
            />
            {visibleToasts.length > 0 && (
                <aside
                    className="ws-toast-container"
                    aria-label="Notificações recentes"
                >
                    {visibleToasts.map((notification) => (
                        <NotificationToast
                            key={notification.id}
                            notification={notification}
                            onDismiss={dismissToast}
                            onAction={handleNotificationOpen}
                        />
                    ))}
                </aside>
            )}
        </main>
    );
}

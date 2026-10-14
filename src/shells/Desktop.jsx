import { useEffect, useMemo, useRef, useState } from 'react';

import Window from './Window';
import Taskbar from './Taskbar';

import ClockWidget from '../widgets/ClockWidget';
import {
    getWidgetDefinition,
    loadWidgetState,
    saveWidgetState,
    setWidgetVisibility,
    setWidgetPosition,
    setWidgetSize,
} from '../core/widgetManager';

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

const COLUMN_STEP = 90;
const ROW_STEP = 88;
const TASKBAR_RESERVED_WIDTH = 720;
const TASKBAR_RESERVED_BOTTOM = 64;


function getDesktopLayout(count, width, height, widget) {
    const columns = Math.floor(width / COLUMN_STEP);
    const rows = Math.floor(height / ROW_STEP);

    if (columns < 1 || rows < 1) {
        return {
            shortcuts: [],
            widget: null,
        };
    }

    const occupied = new Set();
    const shortcuts = [];

    const reservedWidth = Math.min(TASKBAR_RESERVED_WIDTH, width);
    const reservedLeft = (width - reservedWidth) / 2;
    const reservedRight = reservedLeft + reservedWidth;
    const reservedTop = height - TASKBAR_RESERVED_BOTTOM;

    function isAvailable(column, row) {
        if (column >= columns || row >= rows) return false;

        const left = column * COLUMN_STEP;
        const top = row * ROW_STEP;

        const overlapsTaskbar =
            left < reservedRight &&
            left + COLUMN_STEP > reservedLeft &&
            top < height &&
            top + ROW_STEP > reservedTop;

        return (
            !occupied.has(`${column}:${row}`) &&
            !overlapsTaskbar
        );
    }

    // Reserva duas colunas e duas linhas para o relógio.
    let widgetPosition = null;

    const widgetColumns = widget?.size?.columns ?? 2;
    const widgetRows = widget?.size?.rows ?? 2;

    if (
        widget?.visible &&
        columns >= widgetColumns &&
        rows >= widgetRows
    ) {
        const preferredColumn = widget.position?.column;
        const preferredRow = widget.position?.row;

        const column =
            preferredColumn !== undefined && preferredColumn !== null &&
                preferredColumn + widgetColumns <= columns
                ? preferredColumn
                : columns - widgetColumns;

        const row =
            preferredRow !== undefined && preferredRow !== null &&
                preferredRow + widgetRows <= rows
                ? preferredRow
                : 0;

        let available = true;

        for (let x = column; x < column + widgetColumns; x += 1) {
            for (let y = row; y < row + widgetRows; y += 1) {
                if (!isAvailable(x, y)) {
                    available = false;
                }
            }
        }

        if (available) {
            for (let x = column; x < column + widgetColumns; x += 1) {
                for (let y = row; y < row + widgetRows; y += 1) {
                    occupied.add(`${x}:${y}`);
                }
            }

            widgetPosition = {
                left: column * COLUMN_STEP,
                top: row * ROW_STEP,
            };
        }
    }

    // Atalhos e widgets utilizam o mesmo mapa de ocupação.
    for (
        let column = 0;
        column < columns && shortcuts.length < count;
        column += 1
    ) {
        for (
            let row = 0;
            row < rows && shortcuts.length < count;
            row += 1
        ) {
            if (!isAvailable(column, row)) continue;

            occupied.add(`${column}:${row}`);

            shortcuts.push({
                left: column * COLUMN_STEP,
                top: row * ROW_STEP,
            });
        }
    }

    return { shortcuts, widget: widgetPosition };
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

export default function Desktop({ theme, onThemeChange }) {
    const [appState, setAppState] = useState(initialAppState);
    const [widgetState, setWidgetState] = useState(loadWidgetState);
    useEffect(() => {
        saveWidgetState(widgetState);
    }, [widgetState]);

    function toggleClockWidget() {
        setWidgetState((current) => {
            const clock = current.widgets.find(
                (widget) => widget.instanceId === 'clock-default',
            );

            if (!clock) return current;

            return setWidgetVisibility(
                current,
                clock.instanceId,
                !clock.visible,
            );
        });
    }
    const [notificationState, setNotificationState] = useState(
        initialNotificationState,
    );
    const [visibleToasts, setVisibleToasts] = useState([]);
    const [selectedShortcut, setSelectedShortcut] = useState(null);
    const [desktopContext, setDesktopContext] = useState(null);
    const [shortcutContext, setShortcutContext] = useState(null);
    const [shortcutOrder, setShortcutOrder] = useState('default');
    const desktopContextRef = useRef(null);
    const shortcutContextRef = useRef(null);
    const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
    const shortcutsRef = useRef(null);
    const widgetDragRef = useRef(null);
    const shortcuts = useMemo(() => {
        const apps = getRegisteredApps()
            .filter(
                (app) =>
                    app.desktopShortcut &&
                    desktopShortcutOrder.includes(app.id),
            );

        if (shortcutOrder === 'name') {
            return apps.sort((a, b) =>
                a.name.localeCompare(b.name, 'pt-BR'),
            );
        }

        return apps.sort(
            (a, b) =>
                desktopShortcutOrder.indexOf(a.id) -
                desktopShortcutOrder.indexOf(b.id),
        );
    }, [shortcutOrder]);
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
    const clockWidget = widgetState.widgets.find(
        (widget) => widget.instanceId === 'clock-default',
    );

    const desktopLayout = getDesktopLayout(
        shortcuts.length,
        gridSize.width,
        gridSize.height,
        clockWidget,
    );

    const positions = desktopLayout.shortcuts;

    function canPlaceWidget(candidate) {
        const layout = getDesktopLayout(
            shortcuts.length,
            gridSize.width,
            gridSize.height,
            candidate,
        );

        return (
            layout.widget !== null &&
            layout.shortcuts.length >= positions.length
        );
    }

    function changeWidgetSize(value) {
        const [columns, rows] = value.split('x').map(Number);

        const candidate = {
            ...clockWidget,
            size: { columns, rows },
        };

        if (!canPlaceWidget(candidate)) return;

        setWidgetState((current) =>
            setWidgetSize(
                current,
                'clock-default',
                { columns, rows },
            ),
        );
    }

    function startWidgetDrag(event) {
        if (event.button !== 0 || !desktopLayout.widget) return;

        widgetDragRef.current = {
            x: event.clientX,
            y: event.clientY,
            left: desktopLayout.widget.left,
            top: desktopLayout.widget.top,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function moveWidgetDrag(event) {
        const drag = widgetDragRef.current;
        if (!drag) return;

        const widgetElement = event.currentTarget.closest('.desktop__widget');
        if (!widgetElement) return;

        widgetElement.style.translate =
            `${event.clientX - drag.x}px ${event.clientY - drag.y}px`;
    }

    function finishWidgetDrag(event) {
        const drag = widgetDragRef.current;
        if (!drag) return;

        widgetDragRef.current = null;

        const widgetElement = event.currentTarget.closest('.desktop__widget');

        if (widgetElement) {
            widgetElement.style.translate = '';
        }

        if (event.type === 'pointercancel') return;

        const column = Math.round(
            (drag.left + event.clientX - drag.x) / COLUMN_STEP,
        );

        const row = Math.round(
            (drag.top + event.clientY - drag.y) / ROW_STEP,
        );

        if (column < 0 || row < 0) return;

        const candidate = {
            ...clockWidget,
            position: { column, row },
        };

        if (!canPlaceWidget(candidate)) return;

        const layout = getDesktopLayout(
            shortcuts.length,
            gridSize.width,
            gridSize.height,
            candidate,
        );

        if (
            layout.widget.left !== column * COLUMN_STEP ||
            layout.widget.top !== row * ROW_STEP
        ) {
            return;
        }

        setWidgetState((current) =>
            setWidgetPosition(
                current,
                'clock-default',
                { column, row },
            ),
        );
    }

    function showDesktop() {
        setAppState((current) =>
            current.instances.reduce(
                (state, instance) => minimizeApp(state, instance.id),
                current,
            ),
        );

        setSelectedShortcut(null);
    }

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

    function openShortcutContext(event, app) {
        event.preventDefault();
        event.stopPropagation();

        const workspace = event.currentTarget.closest('.desktop__workspace');
        if (!workspace) return;

        const rect = workspace.getBoundingClientRect();
        const menuWidth = 210;
        const menuHeight = 150;

        setDesktopContext(null);
        setSelectedShortcut(app.id);

        setShortcutContext({
            appId: app.id,
            x: Math.max(
                8,
                Math.min(event.clientX - rect.left, rect.width - menuWidth - 8),
            ),
            y: Math.max(
                8,
                Math.min(event.clientY - rect.top, rect.height - menuHeight - 8),
            ),
            showInfo: false,
        });
    }

    function runShortcutContextAction(action) {
        if (!shortcutContext) return;

        if (action === 'open') {
            run(openApp, shortcutContext.appId);
            setShortcutContext(null);
            return;
        }

        if (action === 'info') {
            setShortcutContext((current) =>
                current
                    ? { ...current, showInfo: !current.showInfo }
                    : null,
            );
        }
    }

    function openDesktopContext(event) {
        if (
            event.target.closest(
                '.desktop__shortcut, .desktop__widget, .desktop__widget-toggle',
            )
        ) {
            return;
        }

        event.preventDefault();

        const workspace = event.currentTarget;
        const rect = workspace.getBoundingClientRect();

        const menuWidth = 210;
        const menuHeight = 170;

        setShortcutContext(null);

        setDesktopContext({
            x: Math.max(
                8,
                Math.min(event.clientX - rect.left, rect.width - menuWidth - 8),
            ),
            y: Math.max(
                8,
                Math.min(event.clientY - rect.top, rect.height - menuHeight - 8),
            ),
        });
    }

    function runDesktopContextAction(action) {
        if (action === 'sort-name') {
            setShortcutOrder('name');
        }

        if (action === 'sort-default') {
            setShortcutOrder('default');
        }

        if (action === 'toggle-clock') {
            toggleClockWidget();
        }

        setDesktopContext(null);
    }

    useEffect(() => {
        function handlePointerDown(event) {
            if (!desktopContextRef.current?.contains(event.target)) {
                setDesktopContext(null);
            }

            if (!shortcutContextRef.current?.contains(event.target)) {
                setShortcutContext(null);
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setDesktopContext(null);
                setShortcutContext(null);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <main className="desktop">
            <div className="desktop__wallpaper" aria-hidden="true" />
            <section
                className="desktop__workspace"
                aria-label="Área de trabalho"
                onContextMenu={openDesktopContext}
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
                {desktopContext && (
                    <div
                        ref={desktopContextRef}
                        className="desktop__context"
                        role="group"
                        aria-label="Opções da área de trabalho"
                        style={{
                            left: desktopContext.x,
                            top: desktopContext.y,
                        }}
                    >
                        <strong>Área de trabalho</strong>

                        <button
                            type="button"
                            onClick={() => runDesktopContextAction('sort-default')}
                            disabled={shortcutOrder === 'default'}
                        >
                            Organização padrão
                        </button>

                        <button
                            type="button"
                            onClick={() => runDesktopContextAction('sort-name')}
                            disabled={shortcutOrder === 'name'}
                        >
                            Ordenar por nome
                        </button>

                        <div className="desktop__context-divider" />

                        <button
                            type="button"
                            onClick={() => runDesktopContextAction('toggle-clock')}
                        >
                            {clockWidget?.visible ? 'Ocultar relógio' : 'Mostrar relógio'}
                        </button>
                    </div>
                )}

                {shortcutContext && (() => {
                    const app = getAppDefinition(shortcutContext.appId);
                    if (!app) return null;

                    return (
                        <div
                            ref={shortcutContextRef}
                            className="desktop__context"
                            role="group"
                            aria-label={`Opções de ${app.name}`}
                            style={{
                                left: shortcutContext.x,
                                top: shortcutContext.y,
                            }}
                        >
                            <strong>{app.name}</strong>

                            <button
                                type="button"
                                onClick={() => runShortcutContextAction('open')}
                            >
                                Abrir
                            </button>

                            <button
                                type="button"
                                aria-expanded={shortcutContext.showInfo}
                                onClick={() => runShortcutContextAction('info')}
                            >
                                Informações
                            </button>

                            {shortcutContext.showInfo && (
                                <div className="desktop__context-info">
                                    <span>
                                        Tipo: {app.category === 'system'
                                            ? 'Aplicativo de Sistema'
                                            : 'Aplicativo Desktop'}
                                    </span>

                                    <span>
                                        Estado: {app.implemented
                                            ? 'Implementado'
                                            : 'Em desenvolvimento'}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })()}
                <div
                    ref={shortcutsRef}
                    className="desktop__shortcuts"
                    aria-label="Atalhos da área de trabalho"
                >
                    {desktopLayout.widget &&
                        widgetState.widgets
                            .filter((widget) => widget.visible)
                            .map((widget) => {
                                const definition = getWidgetDefinition(widget.widgetId);

                                if (!definition || widget.widgetId !== 'clock') {
                                    return null;
                                }

                                return (
                                    <div
                                        key={widget.instanceId}
                                        className="desktop__widget"
                                        data-widget-id={widget.widgetId}
                                        data-widget-size={widget.size}
                                        style={{
                                            position: 'absolute',
                                            left: desktopLayout.widget.left,
                                            top: desktopLayout.widget.top,
                                            width: widget.size.columns * COLUMN_STEP,
                                            height: widget.size.rows * ROW_STEP,
                                        }}
                                    >
                                        <div className="desktop__widget-controls">
                                            <button
                                                type="button"
                                                className="desktop__widget-drag"
                                                aria-label="Arrastar relógio"
                                                title="Arrastar relógio"
                                                onPointerDown={startWidgetDrag}
                                                onPointerMove={moveWidgetDrag}
                                                onPointerUp={finishWidgetDrag}
                                                onPointerCancel={finishWidgetDrag}
                                                onDragStart={(event) => event.preventDefault()}
                                            >
                                                Arrastar
                                            </button>

                                            <label className="desktop__widget-size">
                                                <span>Tamanho</span>
                                                <select
                                                    aria-label="Tamanho do relógio"
                                                    value={`${widget.size.columns}x${widget.size.rows}`}
                                                    onChange={(event) => changeWidgetSize(event.target.value)}
                                                >
                                                    <option value="2x2">2 × 2</option>
                                                    <option value="3x2">3 × 2</option>
                                                    <option value="3x3">3 × 3</option>
                                                </select>
                                            </label>
                                        </div>

                                        <ClockWidget />
                                    </div>
                                );
                            })}
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
                                    left: positions[index]?.left ?? -1000,
                                    top: positions[index]?.top ?? -1000,
                                    display: positions[index] ? undefined : 'none',
                                }}
                                type="button"
                                aria-label={`Abrir ${app.name}`}
                                aria-pressed={selectedShortcut === app.id}
                                title={app.name}
                                onContextMenu={(event) => openShortcutContext(event, app)}
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
                onShowDesktop={showDesktop}
                theme={theme}
                onThemeChange={onThemeChange}
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

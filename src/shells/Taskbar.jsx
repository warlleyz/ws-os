
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    activateApp,
    closeApp,
    minimizeApp,
    openApp,
    restoreApp,
} from '../core/appManager';
import {
    getAppDefinition,
    getRegisteredApps,
} from '../core/appRegistry';
function TaskbarIcon({ name, size = 18 }) {
    const paths = {
        menu: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </>
        ),
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        controls: (
            <>
                <path d="M4 7h16M4 17h16" />
                <circle cx="9" cy="7" r="2" fill="currentColor" />
                <circle cx="16" cy="17" r="2" fill="currentColor" />
            </>
        ),
        wally: (
            <>
                <rect x="4" y="6" width="16" height="14" rx="4" />
                <path d="M12 3v3M9 3h6" />
                <path d="M9 12h.01M15 12h.01" strokeWidth="3" />
                <path d="M9 16c2 1.5 4 1.5 6 0" />
            </>
        ),
        weather: (
            <>
                <path d="M7 18a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4.5 4.5 0 0 1 0 9H7Z" />
                <path d="M6 3V2M2 7H1M3.5 4.5l-1-1" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
    };
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name] ?? paths.menu}
        </svg>
    );
}
function AppIcon({ app, size = 18 }) {
    const Icon = app?.icon;
    if (Icon) {
        return (
            <Icon
                size={size}
                strokeWidth={1.8}
                aria-hidden="true"
            />
        );
    }
    return (
        <span aria-hidden="true">
            {app?.name?.charAt(0) ?? '?'}
        </span>
    );
}
export default function Taskbar({ appState, onAppAction }) {
    const [contextGroup, setContextGroup] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [previewGroup, setPreviewGroup] = useState(null);
    const previewOpenTimerRef = useRef(null);
    const previewCloseTimerRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const taskbarRef = useRef(null);
    const appsScrollRef = useRef(null);
    const [appsScroll, setAppsScroll] = useState({
        overflow: false,
        left: false,
        right: false,
    });
    const floatingLayerRef = useRef(null);
    const previewRef = useRef(null);
    const highlightedWindowRef = useRef(null);
    const contextMenuRef = useRef(null);
    const contextTriggerRef = useRef(null);
    const menuButtonRef = useRef(null);
    const groups = [];
    for (const instance of appState.instances) {
        let group = groups.find((item) => item.appId === instance.appId);
        if (!group) {
            group = { appId: instance.appId, instances: [] };
            groups.push(group);
        }
        group.instances.push(instance);
    }
    // Detecta excesso de aplicativos e mantém a navegação atualizada.
    useEffect(() => {
        const element = appsScrollRef.current;
        if (!element) return;
        const update = () => {
            const maxScroll = element.scrollWidth - element.clientWidth;
            const next = {
                overflow: maxScroll > 1,
                left: element.scrollLeft > 1,
                right: element.scrollLeft < maxScroll - 1,
            };
            setAppsScroll((current) =>
                current.overflow === next.overflow &&
                    current.left === next.left &&
                    current.right === next.right
                    ? current
                    : next,
            );
        };
        const observer = new ResizeObserver(update);
        observer.observe(element);
        if (element.firstElementChild) {
            observer.observe(element.firstElementChild);
        }
        const frame = requestAnimationFrame(update);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [groups.length]);
    function scrollApps(direction) {
        appsScrollRef.current?.scrollBy({
            left: direction * 164,
            behavior: 'smooth',
        });
    }
    const preview = groups.find(
        (group) => group.appId === previewGroup,
    );
    const context = groups.find(
        (group) => group.appId === contextGroup,
    );
    const contextApp = context
        ? getAppDefinition(context.appId)
        : null;
    function getTargetInstance(group) {
        const active = group.instances.find(
            (instance) => instance.id === appState.activeInstanceId,
        );
        if (active) return active;
        return (
            [...group.instances]
                .reverse()
                .find((instance) => !instance.minimized) ??
            group.instances.at(-1)
        );
    }
    const contextTarget = context
        ? getTargetInstance(context)
        : null;
    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);
        return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
        function handlePointerDown(event) {
            if (
                !taskbarRef.current?.contains(event.target) &&
                !floatingLayerRef.current?.contains(event.target)
            ) {
                clearWindowHighlight();
                setContextGroup(null);
                setMenuOpen(false);
                contextTriggerRef.current = null;
            }
        }
        function handleKeyDown(event) {
            if (event.key !== 'Escape') return;
            clearWindowHighlight();
            if (contextTriggerRef.current) {
                contextTriggerRef.current.focus();
            } else if (menuOpen) {
                menuButtonRef.current?.focus();
            }
            window.clearTimeout(previewOpenTimerRef.current);
            window.clearTimeout(previewCloseTimerRef.current);
            setPreviewGroup(null);
            setContextGroup(null);
            setMenuOpen(false);
        }
        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen]);
    useEffect(() => {
        if (contextGroup) {
            contextMenuRef.current
                ?.querySelector('button:not(:disabled)')
                ?.focus();
        }
    }, [contextGroup]);
    function clearWindowHighlight() {
        const element = highlightedWindowRef.current;
        if (element) {
            delete element.dataset.taskbarPreview;
        }
        highlightedWindowRef.current = null;
    }
    function highlightWindow(instance) {
        clearWindowHighlight();
        if (instance.minimized) return;
        const element = document.querySelector(
            `[data-instance-id="${instance.id}"]`,
        );
        if (!element) return;
        element.dataset.taskbarPreview = 'true';
        highlightedWindowRef.current = element;
    }
    function clearPreviewTimers() {
        window.clearTimeout(previewOpenTimerRef.current);
        window.clearTimeout(previewCloseTimerRef.current);
    }
    function closePreview() {
        clearWindowHighlight();
        clearPreviewTimers();
        setPreviewGroup(null);
    }
    function schedulePreviewOpen(appId) {
        clearPreviewTimers();
        previewOpenTimerRef.current = window.setTimeout(() => {
            setPreviewGroup(appId);
        }, 300);
    }
    function schedulePreviewClose() {
        window.clearTimeout(previewOpenTimerRef.current);
        window.clearTimeout(previewCloseTimerRef.current);
        previewCloseTimerRef.current = window.setTimeout(() => {
            if (previewRef.current?.matches(':hover')) return;
            clearWindowHighlight();
            setPreviewGroup(null);
        }, 300);
    }
    useEffect(() => {
        const element = highlightedWindowRef.current;
        if (!element) return;
        const instanceId = element.dataset.instanceId;
        const instance = appState.instances.find(
            (item) => item.id === instanceId,
        );
        if (!instance || instance.minimized || !element.isConnected) {
            delete element.dataset.taskbarPreview;
            highlightedWindowRef.current = null;
        }
    }, [appState.instances]);
    function closePanels() {
        clearWindowHighlight();
        closePreview();
        setContextGroup(null);
        setMenuOpen(false);
        contextTriggerRef.current = null;
    }
    function activateInstance(instance) {
        onAppAction(
            instance.minimized ? restoreApp : activateApp,
            instance.id,
        );
        closePanels();
    }
    function handleGroupClick(group) {
        clearWindowHighlight();
        setContextGroup(null);
        setMenuOpen(false);
        contextTriggerRef.current = null;
        if (group.instances.length > 1) {
            clearPreviewTimers();
            setPreviewGroup((current) =>
                current === group.appId ? null : group.appId,
            );
            return;
        }
        const instance = group.instances[0];
        if (instance.minimized) {
            activateInstance(instance);
        } else if (appState.activeInstanceId === instance.id) {
            onAppAction(minimizeApp, instance.id);
            closePanels();
        } else {
            activateInstance(instance);
        }
    }
    function handleContextMenu(event, group) {
        event.preventDefault();
        clearWindowHighlight();
        closePreview();
        contextTriggerRef.current = event.currentTarget;
        setMenuOpen(false);
        setContextGroup((current) =>
            current === group.appId ? null : group.appId,
        );
    }
    function handleContextKeyDown(event, group) {
        if (event.key === 'F10' && event.shiftKey) {
            event.preventDefault();
            contextTriggerRef.current = event.currentTarget;
            setMenuOpen(false);
            setContextGroup(group.appId);
        }
    }
    function handleMenuNavigation(event) {
        if (
            !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
        ) {
            return;
        }
        const buttons = Array.from(
            contextMenuRef.current?.querySelectorAll(
                'button:not(:disabled)',
            ) ?? [],
        );
        if (buttons.length === 0) return;
        event.preventDefault();
        const currentIndex = buttons.indexOf(document.activeElement);
        let nextIndex = 0;
        if (event.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % buttons.length;
        } else if (event.key === 'ArrowUp') {
            nextIndex =
                (currentIndex - 1 + buttons.length) % buttons.length;
        } else if (event.key === 'End') {
            nextIndex = buttons.length - 1;
        }
        buttons[nextIndex].focus();
    }
    function runContextAction(action) {
        if (!context) return;
        const target = getTargetInstance(context);
        switch (action) {
            case 'new':
                onAppAction(openApp, context.appId);
                break;
            case 'activate':
                if (target) {
                    onAppAction(
                        target.minimized ? restoreApp : activateApp,
                        target.id,
                    );
                }
                break;
            case 'minimize':
                if (target && !target.minimized) {
                    onAppAction(minimizeApp, target.id);
                }
                break;
            case 'close':
                if (target) onAppAction(closeApp, target.id);
                break;
            case 'close-all':
                for (const instance of context.instances) {
                    onAppAction(closeApp, instance.id);
                }
                break;
            default:
                break;
        }
        closePanels();
    }
    function toggleWSMenu() {
        setContextGroup(null);
        contextTriggerRef.current = null;
        setMenuOpen((current) => !current);
    }
    const timeText = currentTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const dateText = currentTime.toLocaleDateString('pt-BR');
    return (
        <div className="taskbar-container" ref={taskbarRef}>
            {createPortal(
                <div
                    ref={floatingLayerRef}
                    className="taskbar-floating-layer"
                >
                    {preview && !contextGroup && !menuOpen && (
                        <section
                            ref={previewRef}
                            className="taskbar-preview"
                            aria-label={`Pré-visualizações de ${getAppDefinition(preview.appId)?.name ?? preview.appId
                                }`}
                            onPointerEnter={() => {
                                window.clearTimeout(previewCloseTimerRef.current);
                            }}
                            onPointerLeave={schedulePreviewClose}
                        >
                            <div className="taskbar-preview__list">
                                {preview.instances.map((instance, index) => {
                                    const app = getAppDefinition(instance.appId);
                                    const title = `${app?.name ?? instance.appId}${preview.instances.length > 1
                                        ? ` — Janela ${index + 1}`
                                        : ''
                                        }`;
                                    return (
                                        <div
                                            key={instance.id}
                                            className="taskbar-preview__item"
                                        >
                                            <div className="taskbar-preview__header">
                                                <strong title={title}>{title}</strong>
                                                <button
                                                    type="button"
                                                    className="taskbar-preview__close"
                                                    aria-label={`Fechar ${title}`}
                                                    title="Fechar janela"
                                                    onClick={() => {
                                                        clearWindowHighlight();
                                                        onAppAction(closeApp, instance.id);
                                                    }}
                                                >
                                                    <svg
                                                        width="13"
                                                        height="13"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M18 6 6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                className="taskbar-preview__open"
                                                aria-label={`Ativar ${title}`}
                                                onPointerEnter={() => highlightWindow(instance)}
                                                onPointerLeave={clearWindowHighlight}
                                                onFocus={() => highlightWindow(instance)}
                                                onBlur={clearWindowHighlight}
                                                onClick={() => activateInstance(instance)}
                                            >
                                                <span
                                                    className="taskbar-preview__placeholder"
                                                    aria-hidden="true"
                                                >
                                                    <span className="taskbar-preview__placeholder-icon">
                                                        <AppIcon app={app} size={27} />
                                                    </span>
                                                </span>
                                                <small>
                                                    {instance.minimized
                                                        ? 'Minimizada'
                                                        : appState.activeInstanceId === instance.id
                                                            ? 'Ativa'
                                                            : 'Aberta'}
                                                </small>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                    {menuOpen && (
                        <section
                            className="taskbar-launcher"
                            aria-label="WS Menu"
                        >
                            <strong className="taskbar-launcher__title">
                                Aplicativos
                            </strong>
                            <div className="taskbar-launcher__apps">
                                {getRegisteredApps()
                                    .filter((app) => app.public)
                                    .map((app) => (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() => {
                                                onAppAction(openApp, app.id);
                                                closePanels();
                                            }}
                                        >
                                            <span className="taskbar-launcher__icon">
                                                <AppIcon app={app} size={18} />
                                            </span>
                                            <span>{app.name}</span>
                                        </button>
                                    ))}
                            </div>
                        </section>
                    )}
                    {context && (
                        <section
                            ref={contextMenuRef}
                            className="taskbar-context"
                            aria-label={`Opções de ${contextApp?.name ?? context.appId}`}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    event.stopPropagation();
                                    contextTriggerRef.current?.focus();
                                    closePanels();
                                    return;
                                }
                                handleMenuNavigation(event);
                            }}
                        >
                            <strong className="taskbar-context__title">
                                {contextApp?.name ?? context.appId}
                            </strong>
                            <div className="taskbar-context__actions">
                                {contextApp?.allowMultipleInstances && (
                                    <button
                                        type="button"
                                        onClick={() => runContextAction('new')}
                                    >
                                        Abrir nova janela
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => runContextAction('activate')}
                                >
                                    {contextTarget?.minimized
                                        ? 'Restaurar janela'
                                        : 'Ativar janela'}
                                </button>
                                <button
                                    type="button"
                                    disabled={!contextTarget || contextTarget.minimized}
                                    onClick={() => runContextAction('minimize')}
                                >
                                    Minimizar janela
                                </button>
                                <div className="taskbar-context__divider" />
                                <button
                                    type="button"
                                    onClick={() => runContextAction('close')}
                                >
                                    Fechar janela
                                </button>
                                {context.instances.length > 1 && (
                                    <button
                                        type="button"
                                        className="taskbar-context__danger"
                                        onClick={() => runContextAction('close-all')}
                                    >
                                        Fechar todas as janelas
                                    </button>
                                )}
                            </div>
                        </section>
                    )}
                </div>,
                document.body,
            )}
            <nav className="taskbar" aria-label="Barra de tarefas">
                <div className="taskbar__section taskbar__section--start">
                    <button
                        ref={menuButtonRef}
                        type="button"
                        className="taskbar__system-button taskbar__menu-button"
                        aria-label="WS Menu"
                        aria-expanded={menuOpen}
                        title="WS Menu"
                        onClick={toggleWSMenu}
                    >
                        <TaskbarIcon name="menu" size={19} />
                    </button>
                </div>
                <span className="taskbar__divider" aria-hidden="true" />
                {groups.length > 0 && (
                    <div className="taskbar__apps-navigation">
                        {appsScroll.overflow && (
                            <button
                                type="button"
                                className="taskbar__scroll-button"
                                aria-label="Ver aplicativos anteriores"
                                title="Aplicativos anteriores"
                                disabled={!appsScroll.left}
                                onClick={() => scrollApps(-1)}
                            >
                                ‹
                            </button>
                        )}
                        <div
                            ref={appsScrollRef}
                            className="taskbar__apps"
                            aria-label="Aplicativos abertos"
                            onScroll={() => {
                                const element = appsScrollRef.current;
                                if (!element) return;
                                const maxScroll = element.scrollWidth - element.clientWidth;
                                setAppsScroll((current) => ({
                                    ...current,
                                    left: element.scrollLeft > 1,
                                    right: element.scrollLeft < maxScroll - 1,
                                }));
                            }}
                        >
                            {groups.map((group) => {
                                const app = getAppDefinition(group.appId);
                                const active = group.instances.some(
                                    (instance) =>
                                        instance.id === appState.activeInstanceId,
                                );
                                const allMinimized = group.instances.every(
                                    (instance) => instance.minimized,
                                );
                                return (
                                    <button
                                        key={group.appId}
                                        type="button"
                                        className={[
                                            'taskbar__app',
                                            active ? 'taskbar__app--active' : '',
                                            allMinimized ? 'taskbar__app--minimized' : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        aria-label={app?.name ?? group.appId}
                                        aria-pressed={active}
                                        aria-expanded={
                                            previewGroup === group.appId ||
                                            contextGroup === group.appId
                                        }
                                        title={app?.name ?? group.appId}
                                        onClick={() => handleGroupClick(group)}
                                        onPointerEnter={() => {
                                            window.clearTimeout(previewCloseTimerRef.current);
                                            if (previewGroup !== group.appId) {
                                                schedulePreviewOpen(group.appId);
                                            }
                                        }}
                                        onPointerLeave={schedulePreviewClose}
                                        onContextMenu={(event) =>
                                            handleContextMenu(event, group)
                                        }
                                        onKeyDown={(event) =>
                                            handleContextKeyDown(event, group)
                                        }
                                    >
                                        <span className="taskbar__app-icon">
                                            <AppIcon app={app} size={20} />
                                        </span>
                                        <span
                                            className="taskbar__app-indicator"
                                            aria-hidden="true"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        {appsScroll.overflow && (
                            <button
                                type="button"
                                className="taskbar__scroll-button"
                                aria-label="Ver próximos aplicativos"
                                title="Próximos aplicativos"
                                disabled={!appsScroll.right}
                                onClick={() => scrollApps(1)}
                            >
                                ›
                            </button>
                        )}
                    </div>
                )}
                {groups.length > 0 && (
                    <span className="taskbar__divider" aria-hidden="true" />
                )}
                <div className="taskbar__section taskbar__section--system">
                    <button
                        type="button"
                        className="taskbar__system-button"
                        title="Notificações — em desenvolvimento"
                        aria-label="Notificações — em desenvolvimento"
                        disabled
                    >
                        <TaskbarIcon name="bell" />
                    </button>
                    <button
                        type="button"
                        className="taskbar__system-button"
                        title="Controles rápidos — em desenvolvimento"
                        aria-label="Controles rápidos — em desenvolvimento"
                        disabled
                    >
                        <TaskbarIcon name="controls" />
                    </button>
                    <button
                        type="button"
                        className="taskbar__system-button"
                        title="Wally — em desenvolvimento"
                        aria-label="Wally — em desenvolvimento"
                        disabled
                    >
                        <TaskbarIcon name="wally" />
                    </button>
                </div>
                <span className="taskbar__divider" aria-hidden="true" />
                <div className="taskbar__section taskbar__section--status">
                    <span
                        className="taskbar__weather"
                        title="Clima — integração pendente"
                        aria-label="Clima — integração pendente"
                    >
                        <TaskbarIcon name="weather" />
                    </span>
                    <time
                        className="taskbar__clock"
                        dateTime={currentTime.toISOString()}
                        title={dateText}
                    >
                        {timeText}
                    </time>
                </div>
            </nav>
        </div>
    );
}


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

// Utilitários e preferências persistentes do WS Menu.
function normalizeSearch(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}
const FAVORITES_STORAGE_KEY = 'ws-os:menu-favorites';
const MAX_FAVORITES = 6;
const DEFAULT_FAVORITES = [
    'about-me',
    'projects',
    'dev-insights',
    'resume',
    'files',
    'notes',
];
function getInitialFavorites() {
    try {
        const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return [...new Set(parsed.filter(
                    (id) => typeof id === 'string',
                ))].slice(0, MAX_FAVORITES);
            }
        }
    } catch {
        // Usa os favoritos padrão se o armazenamento estiver indisponível.
    }
    return DEFAULT_FAVORITES;
}
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
function resolvePanel(value, current, panel) {
    const next = typeof value === 'function' ? value(current === panel) : value;
    return next ? panel : (current === panel ? null : current);
}

export default function Taskbar({
    appState,
    onAppAction,
    notificationState,
    onNotificationAction,
    onNotificationOpen,
    onShowDesktop,
    theme,
    onThemeChange,
}) {
    const notifications = notificationState?.items ?? [];
    const unreadCount = notifications.filter((item) => !item.read).length;

    const [contextGroup, setContextGroup] = useState(null);
    const [activePanel, setActivePanel] = useState(null);
    const menuOpen = activePanel === 'menu';
    const notificationOpen = activePanel === 'notifications';
    const quickControlsOpen = activePanel === 'controls';
    const wallyOpen = activePanel === 'wally';
    const weatherOpen = activePanel === 'weather';
    const calendarOpen = activePanel === 'calendar';

    function setMenuOpen(value) { setActivePanel((current) => resolvePanel(value, current, 'menu')); }
    function setNotificationOpen(value) { setActivePanel((current) => resolvePanel(value, current, 'notifications')); }
    function setQuickControlsOpen(value) { setActivePanel((current) => resolvePanel(value, current, 'controls')); }
    function setWallyOpen(value) { setActivePanel((current) => resolvePanel(value, current, 'wally')); }
    function setWeatherOpen(value) { setActivePanel((current) => resolvePanel(value, current, 'weather')); }
    function setCalendarOpen(value) { setActivePanel((current) => resolvePanel(value, current, 'calendar')); }
    const [menuView, setMenuView] = useState('home');
    const [menuSearch, setMenuSearch] = useState('');
    const [shortcutContext, setShortcutContext] = useState(null);
    const [favoriteIds, setFavoriteIds] = useState(getInitialFavorites);
    const [previewGroup, setPreviewGroup] = useState(null);
    const previewOpenTimerRef = useRef(null);
    const previewCloseTimerRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState('');
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
    const menuSearchRef = useRef(null);
    const shortcutContextRef = useRef(null);
    const shortcutTriggerRef = useRef(null);
    // Favoritos do WS Menu.
    useEffect(() => {
        try {
            localStorage.setItem(
                FAVORITES_STORAGE_KEY,
                JSON.stringify(favoriteIds),
            );
        } catch {
            // A seleção funciona durante a sessão, mesmo sem persistência.
        }
    }, [favoriteIds]);
    function toggleFavorite(appId) {
        setFavoriteIds((current) => {
            if (current.includes(appId)) {
                return current.filter((id) => id !== appId);
            }
            if (current.length >= MAX_FAVORITES) {
                return current;
            }
            return [...current, appId];
        });
    }
    function openShortcutContext(event, app) {
        event.preventDefault();
        const panel = event.currentTarget.closest(
            '.taskbar-launcher--redesign',
        );
        if (!panel) return;
        shortcutTriggerRef.current = event.currentTarget;
        const rect = panel.getBoundingClientRect();
        const width = 204;
        const estimatedHeight = 210;
        const padding = 8;
        const x = Math.max(
            padding,
            Math.min(
                event.clientX - rect.left,
                rect.width - width - padding,
            ),
        );
        const y = Math.max(
            padding,
            Math.min(
                event.clientY - rect.top,
                rect.height - estimatedHeight - padding,
            ),
        );
        setShortcutContext({
            appId: app.id,
            x,
            y,
            showInfo: false,
        });
    }
    function runShortcutContextAction(action) {
        if (!shortcutContext) return;
        const appId = shortcutContext.appId;
        if (action === 'open') {
            onAppAction(openApp, appId);
            closePanels();
            return;
        }
        if (action === 'favorite') {
            toggleFavorite(appId);
            setShortcutContext(null);
            shortcutTriggerRef.current?.focus();
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
    const menuApps = getRegisteredApps()
        .filter((app) => app.public && app.showInMenu !== false)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const searchTerm = normalizeSearch(menuSearch.trim());
    const searchResults = menuApps.filter((app) =>
        normalizeSearch(app.name).includes(searchTerm),
    );
    const favoriteApps = favoriteIds
        .map((id) => menuApps.find((app) => app.id === id))
        .filter(Boolean);
    const visibleMenuApps = searchTerm
        ? searchResults
        : menuView === 'all'
            ? menuApps
            : favoriteApps;
    useEffect(() => {
        if (!shortcutContext) return;
        shortcutContextRef.current
            ?.querySelector('button:not(:disabled)')
            ?.focus();
    }, [shortcutContext]);
    useEffect(() => {
        if (menuOpen) menuSearchRef.current?.focus();
    }, [menuOpen]);
    // Instâncias agrupadas por aplicativo na Taskbar.
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
            const insideTaskbar = taskbarRef.current?.contains(event.target);
            const insideFloating = floatingLayerRef.current?.contains(
                event.target,
            );
            if (!insideTaskbar && !insideFloating) {
                clearWindowHighlight();
                clearPreviewTimers();
                setPreviewGroup(null);
                setContextGroup(null);
                setShortcutContext(null);
                setMenuOpen(false);
                setNotificationOpen(false);
                setQuickControlsOpen(false);
                setWallyOpen(false);
                setWeatherOpen(false);
                contextTriggerRef.current = null;
                shortcutTriggerRef.current = null;
            }
        }

        function handleKeyDown(event) {
            const key = event.code;

            if (
                event.ctrlKey &&
                event.shiftKey &&
                !event.altKey &&
                !event.repeat &&
                event.code === 'Space'
            ) {
                event.preventDefault();
                event.stopPropagation();

                clearWindowHighlight();
                clearPreviewTimers();

                setPreviewGroup(null);
                setContextGroup(null);
                setShortcutContext(null);

                contextTriggerRef.current = null;
                shortcutTriggerRef.current = null;

                setMenuView('home');
                setMenuSearch('');

                setActivePanel((current) =>
                    current === 'menu' ? null : 'menu'
                );

                return;
            }

                if (key === 'KeyD') {
                    if (event.ctrlKey && event.altKey && !event.repeat) {
                    event.preventDefault();

                    clearWindowHighlight();
                    clearPreviewTimers();

                    setPreviewGroup(null);
                    setContextGroup(null);
                    setShortcutContext(null);
                    setActivePanel(null);

                    contextTriggerRef.current = null;
                    shortcutTriggerRef.current = null;

                    onShowDesktop?.();
                    return;
                }
            }

            if (event.key !== 'Escape') return;

            if (shortcutContext) {
                event.preventDefault();
                event.stopImmediatePropagation?.();

                setShortcutContext(null);
                shortcutTriggerRef.current?.focus();
                return;
            }

            clearWindowHighlight();
            clearPreviewTimers();

            if (contextTriggerRef.current) {
                contextTriggerRef.current.focus();
            } else if (menuOpen) {
                menuButtonRef.current?.focus();
            }

            setPreviewGroup(null);
            setContextGroup(null);
            setShortcutContext(null);
            setActivePanel(null);

            contextTriggerRef.current = null;
            shortcutTriggerRef.current = null;
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen, shortcutContext, onShowDesktop]);
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
    // Fechamento e alternância de painéis flutuantes.
    function closePanels() {
        clearWindowHighlight();
        closePreview();
        setContextGroup(null);
        setShortcutContext(null);
        setMenuOpen(false);
        setNotificationOpen(false);
        setMenuView('home');
        setMenuSearch('');
        setQuickControlsOpen(false);
        setWallyOpen(false);
        setWeatherOpen(false);
        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;
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
        setNotificationOpen(false);
        setQuickControlsOpen(false);
        setWallyOpen(false);
        setWeatherOpen(false);
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
        setNotificationOpen(false);
        setQuickControlsOpen(false);
        setWallyOpen(false);
        setWeatherOpen(false);
        setContextGroup((current) =>
            current === group.appId ? null : group.appId,
        );
    }
    function handleContextKeyDown(event, group) {
        if (event.key === 'F10' && event.shiftKey) {
            event.preventDefault();
            contextTriggerRef.current = event.currentTarget;
            setMenuOpen(false);
            setNotificationOpen(false);
            setContextGroup(group.appId);
            setQuickControlsOpen(false);
            setWallyOpen(false);
            setWeatherOpen(false);
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
        clearWindowHighlight();
        closePreview();
        setContextGroup(null);
        setShortcutContext(null);
        setQuickControlsOpen(false);
        setWallyOpen(false);
        setWeatherOpen(false);
        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;
        if (!menuOpen) {
            setMenuView('home');
            setMenuSearch('');
        }
        setMenuOpen((current) => !current);
        setNotificationOpen(false);
    }
    function toggleNotifications() {
        clearWindowHighlight();
        closePreview();
        setContextGroup(null);
        setShortcutContext(null);
        setMenuOpen(false);
        setQuickControlsOpen(false);
        setWallyOpen(false);
        setWeatherOpen(false);
        setNotificationOpen((current) => !current);
        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;
    }
    function toggleQuickControls() {
        clearWindowHighlight();
        closePreview();

        setContextGroup(null);
        setShortcutContext(null);
        setMenuOpen(false);
        setNotificationOpen(false);

        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;

        setQuickControlsOpen((current) => !current);
    }
    function toggleWally() {
        clearWindowHighlight();
        closePreview();

        setContextGroup(null);
        setShortcutContext(null);
        setMenuOpen(false);
        setNotificationOpen(false);
        setQuickControlsOpen(false);

        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;

        setWallyOpen((current) => !current);
    }
    function toggleWeather() {
        clearWindowHighlight();
        closePreview();

        setContextGroup(null);
        setShortcutContext(null);
        setMenuOpen(false);
        setNotificationOpen(false);
        setQuickControlsOpen(false);
        setWallyOpen(false);

        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;

        setWeatherOpen((current) => !current);
    }

    async function fetchWeather(latitude, longitude) {
        setWeatherLoading(true);
        setWeatherError('');

        try {
            const params = new URLSearchParams({
                latitude: String(latitude),
                longitude: String(longitude),
                current:
                    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
                timezone: 'auto',
            });

            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?${params}`,
            );

            if (!response.ok) {
                throw new Error('Não foi possível consultar o clima.');
            }

            const data = await response.json();

            if (
                !data.current ||
                !Number.isFinite(data.current.temperature_2m)
            ) {
                throw new Error('Dados meteorológicos indisponíveis.');
            }

            setWeather(data.current);
        } catch (error) {
            setWeatherError(error.message || 'Erro ao consultar o clima.');
        } finally {
            setWeatherLoading(false);
        }
    }

    function requestWeather() {
        if (!navigator.geolocation) {
            setWeatherError('Geolocalização indisponível neste navegador.');
            return;
        }

        setWeatherLoading(true);
        setWeatherError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(
                    position.coords.latitude,
                    position.coords.longitude,
                );
            },
            () => {
                setWeatherLoading(false);
                setWeatherError(
                    'Não foi possível obter sua localização. Verifique a permissão do navegador.',
                );
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000,
            },
        );
    }

    function getWeatherDescription(code) {
        if (code === 0) return 'Céu limpo';
        if ([1, 2, 3].includes(code)) return 'Parcialmente nublado';
        if ([45, 48].includes(code)) return 'Nevoeiro';
        if ([51, 53, 55, 56, 57].includes(code)) return 'Garoa';
        if ([61, 63, 65, 66, 67].includes(code)) return 'Chuva';
        if ([71, 73, 75, 77].includes(code)) return 'Neve';
        if ([80, 81, 82].includes(code)) return 'Pancadas de chuva';
        if ([85, 86].includes(code)) return 'Pancadas de neve';
        if ([95, 96, 99].includes(code)) return 'Trovoadas';

        return 'Condição indisponível';
    }
    const timeText = currentTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const dateText = currentTime.toLocaleDateString('pt-BR');
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });
    const monthLabel = calendarMonth.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    });
    const firstWeekday = calendarMonth.getDay();
    const daysInMonth = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        0,
    ).getDate();

    function toggleCalendar() {
        clearWindowHighlight();
        closePreview();
        setContextGroup(null);
        setShortcutContext(null);
        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;
        setCalendarOpen((current) => !current);
    }
    // Camada flutuante + barra inferior (sem containers extras).
    return (
        <div className="taskbar-container" ref={taskbarRef}>
            {createPortal(
                <div
                    ref={floatingLayerRef}
                    className="taskbar-floating-layer"
                >
                    {preview &&
                        !contextGroup &&
                        !menuOpen &&
                        !notificationOpen &&
                        !quickControlsOpen &&
                        !wallyOpen &&
                        !weatherOpen &&
                        !calendarOpen && (
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
                            className="taskbar-launcher taskbar-launcher--redesign"
                            aria-label="WS Menu"
                            onPointerDown={(event) => {
                                if (
                                    shortcutContext &&
                                    !event.target.closest('.ws-menu__context')
                                ) {
                                    setShortcutContext(null);
                                }
                            }}
                        >
                            <header className="ws-menu__identity">
                                <div className="ws-menu__avatar" aria-hidden="true">
                                    <TaskbarIcon name="wally" size={21} />
                                </div>
                                <div className="ws-menu__identity-text">
                                    <strong>Visitante</strong>
                                    <small>Bem-vindo à WS OS</small>
                                </div>
                                <span className="ws-menu__brand">WS OS V2</span>
                            </header>
                            <div className="ws-menu__search">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <circle cx="10.8" cy="10.8" r="6.8" />
                                    <path d="m16 16 5 5" />
                                </svg>
                                <input
                                    ref={menuSearchRef}
                                    type="search"
                                    aria-label="Pesquisar na WS OS"
                                    placeholder="Pesquisar na WS OS..."
                                    value={menuSearch}
                                    onChange={(event) => setMenuSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && visibleMenuApps.length > 0) {
                                            event.preventDefault();
                                            onAppAction(openApp, visibleMenuApps[0].id);
                                            closePanels();
                                        }
                                    }}
                                />
                                {menuSearch && (
                                    <button
                                        type="button"
                                        aria-label="Limpar pesquisa"
                                        title="Limpar pesquisa"
                                        onClick={() => {
                                            setMenuSearch('');
                                            menuSearchRef.current?.focus();
                                        }}
                                    >×</button>
                                )}
                            </div>
                            <div className="ws-menu__main">
                                <div className="ws-menu__section-heading">
                                    <strong>
                                        {searchTerm
                                            ? 'Resultados da pesquisa'
                                            : menuView === 'all'
                                                ? 'Todos os aplicativos'
                                                : 'Aplicativos Favoritos'}
                                    </strong>
                                    {!searchTerm && (
                                        <button
                                            type="button"
                                            className="ws-menu__view-toggle"
                                            onClick={() => setMenuView((current) => current === 'all' ? 'home' : 'all')}
                                        >
                                            {menuView === 'all' ? 'Voltar' : 'Todos os aplicativos'}
                                            <span aria-hidden="true">{menuView === 'all' ? ' ←' : ' →'}</span>
                                        </button>
                                    )}
                                </div>
                                <div className="ws-menu__apps" aria-label="Aplicativos">
                                    {visibleMenuApps.length === 0 ? (
                                        <p className="ws-menu__empty">
                                            {searchTerm
                                                ? 'Nenhum aplicativo encontrado.'
                                                : menuView === 'home'
                                                    ? 'Nenhum favorito. Clique em Todos os aplicativos para adicionar.'
                                                    : 'Nenhum aplicativo disponível.'}
                                        </p>
                                    ) : (
                                        visibleMenuApps.map((app) => {
                                            return (
                                                <div className="ws-menu__app-item" key={app.id}>
                                                    <button
                                                        type="button"
                                                        className="ws-menu__app"
                                                        onContextMenu={(event) => openShortcutContext(event, app)}
                                                        onKeyDown={(event) => {
                                                            if (
                                                                (event.shiftKey && event.key === 'F10') ||
                                                                event.key === 'ContextMenu'
                                                            ) {
                                                                event.preventDefault();
                                                                const rect = event.currentTarget.getBoundingClientRect();
                                                                openShortcutContext(
                                                                    {
                                                                        preventDefault: () => { },
                                                                        currentTarget: event.currentTarget,
                                                                        clientX: rect.left + rect.width / 2,
                                                                        clientY: rect.top + rect.height / 2,
                                                                    },
                                                                    app,
                                                                );
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            onAppAction(openApp, app.id);
                                                            closePanels();
                                                        }}
                                                    >
                                                        <span className="ws-menu__app-icon">
                                                            <AppIcon app={app} size={19} />
                                                        </span>
                                                        <span className="ws-menu__app-name">
                                                            {app.name}
                                                        </span>
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            {shortcutContext && (() => {
                                const app = getAppDefinition(shortcutContext.appId);
                                const isFavorite = favoriteIds.includes(shortcutContext.appId);
                                if (!app) return null;
                                const canFavorite =
                                    isFavorite || favoriteIds.length < MAX_FAVORITES;
                                return (
                                    <div
                                        ref={shortcutContextRef}
                                        className="ws-menu__context"
                                        role="group"
                                        aria-label={`Opções de ${app.name}`}
                                        style={{
                                            left: shortcutContext.x,
                                            top: shortcutContext.y,
                                        }}
                                    >
                                        <div className="ws-menu__context-header">
                                            <span className="ws-menu__context-icon">
                                                <AppIcon app={app} size={18} />
                                            </span>
                                            <strong title={app.name}>{app.name}</strong>
                                        </div>
                                        <div className="ws-menu__context-divider" />
                                        <button
                                            type="button"
                                            onClick={() => runShortcutContextAction('open')}
                                        >
                                            <span className="ws-menu__context-action-icon">
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M8 5l11 7-11 7V5Z" />
                                                </svg>
                                            </span>
                                            Abrir
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!canFavorite}
                                            onClick={() => runShortcutContextAction('favorite')}
                                        >
                                            <span className="ws-menu__context-action-icon">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                    fill={isFavorite ? 'currentColor' : 'none'}
                                                >
                                                    <path d="m12 2 3.1 6.3 7 1-5.1 5 .9 7-5.9-3.2-5.9 3.2.9-7-5.1-5 7-1L12 2Z" />
                                                </svg>
                                            </span>
                                            {isFavorite
                                                ? 'Desafixar do WS Menu'
                                                : 'Fixar no WS Menu'}
                                        </button>
                                        <div className="ws-menu__context-divider" />
                                        <button
                                            type="button"
                                            aria-expanded={shortcutContext.showInfo}
                                            onClick={() => runShortcutContextAction('info')}
                                        >
                                            <span className="ws-menu__context-action-icon">
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                    <circle cx="12" cy="12" r="9" />
                                                    <path d="M12 11v6M12 7h.01" />
                                                </svg>
                                            </span>
                                            Informações
                                        </button>
                                        {shortcutContext.showInfo && (
                                            <div className="ws-menu__context-details">
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
                        </section>
                    )}
                    {weatherOpen && (
                        <section className="taskbar-weather-panel" role="region" aria-label="Painel do clima">
                            <header className="taskbar-weather-panel__header">
                                <strong>Clima</strong>
                                <button type="button" aria-label="Fechar clima" onClick={() => setWeatherOpen(false)}>×</button>
                            </header>
                            <div className="taskbar-weather-panel__content">
                                {weather && (
                                    <>
                                        <strong>{Math.round(weather.temperature_2m)} °C</strong>
                                        <p>{getWeatherDescription(weather.weather_code)}</p>
                                        <p>Sensação: {Math.round(weather.apparent_temperature)} °C</p>
                                        <p>Umidade: {weather.relative_humidity_2m}%</p>
                                        <p>Vento: {Math.round(weather.wind_speed_10m)} km/h</p>
                                    </>
                                )}
                                {weatherError && <p role="alert">{weatherError}</p>}
                                <button type="button" disabled={weatherLoading} onClick={requestWeather}>
                                    {weatherLoading ? 'Consultando...' : weather ? 'Atualizar clima' : 'Consultar clima'}
                                </button>
                            </div>
                        </section>
                    )}
                    {calendarOpen && (
                        <section className="taskbar-calendar" role="region" aria-label="Calendário">
                            <header className="taskbar-calendar__header">
                                <strong>{monthLabel}</strong>
                                <div>
                                    <button type="button" aria-label="Mês anterior" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
                                    <button type="button" onClick={() => setCalendarMonth(new Date(currentTime.getFullYear(), currentTime.getMonth(), 1))}>Hoje</button>
                                    <button type="button" aria-label="Próximo mês" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
                                    <button type="button" aria-label="Fechar calendário" onClick={() => setCalendarOpen(false)}>×</button>
                                </div>
                            </header>
                            <div className="taskbar-calendar__grid">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                                    <span className="taskbar-calendar__weekday" key={index}>{day}</span>
                                ))}
                                {Array.from({ length: firstWeekday }, (_, index) => (
                                    <span key={`empty-${index}`} aria-hidden="true" />
                                ))}
                                {Array.from({ length: daysInMonth }, (_, index) => {
                                    const day = index + 1;
                                    const isToday = currentTime.getFullYear() === calendarMonth.getFullYear()
                                        && currentTime.getMonth() === calendarMonth.getMonth()
                                        && currentTime.getDate() === day;
                                    return <span key={day} className={isToday ? 'taskbar-calendar__today' : undefined} aria-current={isToday ? 'date' : undefined}>{day}</span>;
                                })}
                            </div>
                        </section>
                    )}
                    {wallyOpen && (
                        <section
                            className="taskbar-wally"
                            role="region"
                            aria-label="Wally"
                        >
                            <header className="taskbar-wally__header">
                                <div>
                                    <strong>Wally</strong>
                                    <small>Assistente da WS OS</small>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Fechar Wally"
                                    onClick={() => setWallyOpen(false)}
                                >
                                    ×
                                </button>
                            </header>

                            <div className="taskbar-wally__content">
                                <TaskbarIcon name="wally" size={32} />

                                <strong>Olá! Eu sou o Wally.</strong>

                                <p>
                                    Sou o assistente da WS OS.
                                    Minhas funcionalidades serão integradas
                                    nas próximas etapas.
                                </p>
                            </div>
                        </section>
                    )}
                    {quickControlsOpen && (
                        <section
                            className="taskbar-quick-controls"
                            role="region"
                            aria-label="Painel de Controle Rápido"
                        >
                            <header className="taskbar-quick-controls__header">
                                <div>
                                    <strong>Controle Rápido</strong>
                                    <small>Preferências do sistema</small>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Fechar Controle Rápido"
                                    onClick={() => setQuickControlsOpen(false)}
                                >
                                    ×
                                </button>
                            </header>

                            <div className="taskbar-quick-controls__content">
                                <div className="taskbar-quick-controls__section">
                                    <strong>Aparência</strong>

                                    <label className="taskbar-quick-controls__theme">
                                        <span>Tema do sistema</span>

                                        <select
                                            aria-label="Tema do sistema"
                                            value={theme}
                                            onChange={(event) =>
                                                onThemeChange(event.target.value)
                                            }
                                        >
                                            <option value="dark">Escuro</option>
                                            <option value="light">Claro</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="taskbar-quick-controls__section">
                                    <strong>Efeitos</strong>
                                    <p>Animações e transparências.</p>
                                </div>
                            </div>
                        </section>
                    )}
                    {notificationOpen && (
                        <section
                            className="taskbar-notifications"
                            role="region"
                            aria-label="Central de notificações"
                        >
                            <header className="taskbar-notifications__header">
                                <div>
                                    <strong>Notificações</strong>
                                    <small>
                                        {unreadCount > 0
                                            ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                                            : 'Nenhuma notificação não lida'}
                                    </small>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Fechar notificações"
                                    title="Fechar notificações"
                                    onClick={() => setNotificationOpen(false)}
                                >×</button>
                            </header>
                            {notifications.length > 0 ? (
                                <>
                                    <div className="taskbar-notifications__toolbar">
                                        <button
                                            type="button"
                                            disabled={unreadCount === 0}
                                            onClick={() => onNotificationAction('read-all')}
                                        >Marcar todas como lidas</button>
                                        <button
                                            type="button"
                                            onClick={() => onNotificationAction('clear')}
                                        >Limpar tudo</button>
                                    </div>
                                    <div className="taskbar-notifications__list">
                                        {notifications.map((notification) => (
                                            <article
                                                key={notification.id}
                                                className={[
                                                    'taskbar-notifications__item',
                                                    notification.read
                                                        ? 'taskbar-notifications__item--read'
                                                        : 'taskbar-notifications__item--unread',
                                                ].join(' ')}
                                            >
                                                <div className="taskbar-notifications__item-top">
                                                    <span className="taskbar-notifications__source">
                                                        {notification.source}
                                                    </span>
                                                    <time dateTime={new Date(notification.createdAt).toISOString()}>
                                                        {new Date(notification.createdAt).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </time>
                                                </div>
                                                <strong>{notification.title}</strong>
                                                {notification.message && <p>{notification.message}</p>}
                                                <div className="taskbar-notifications__actions">
                                                    {notification.action?.type === 'open-app' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onNotificationOpen(notification);
                                                                setNotificationOpen(false);
                                                            }}
                                                        >
                                                            {notification.action.label ?? 'Abrir aplicativo'}
                                                        </button>
                                                    )}
                                                    {!notification.read && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onNotificationAction('read', notification.id)}
                                                        >Marcar como lida</button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onNotificationAction('remove', notification.id)}
                                                    >Excluir</button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="taskbar-notifications__empty">
                                    <TaskbarIcon name="bell" size={26} />
                                    <strong>Tudo em dia</strong>
                                    <p>Nenhuma notificação por enquanto.</p>
                                </div>
                            )}
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
                        title="Notificações"
                        aria-label="Notificações"
                        aria-expanded={notificationOpen}
                        onClick={toggleNotifications}
                    >
                        <span className="taskbar-notifications__trigger">
                            <TaskbarIcon name="bell" />
                            {unreadCount > 0 && (
                                <span
                                    className="taskbar-notifications__badge"
                                    aria-label={`${unreadCount} notificações não lidas`}
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </span>
                    </button>
                    <button
                        type="button"
                        className="taskbar__system-button"
                        title="Controle Rápido"
                        aria-label="Controle Rápido"
                        aria-expanded={quickControlsOpen}
                        onClick={toggleQuickControls}
                    >
                        <TaskbarIcon name="controls" />
                    </button>
                    <button
                        type="button"
                        className="taskbar__system-button"
                        title="Wally"
                        aria-label="Wally"
                        aria-expanded={wallyOpen}
                        onClick={toggleWally}
                    >
                        <TaskbarIcon name="wally" />
                    </button>
                </div>
                <span className="taskbar__divider" aria-hidden="true" />
                <div className="taskbar__section taskbar__section--status">
                    <button
                        type="button"
                        className="taskbar__weather"
                        title="Clima"
                        aria-label="Clima"
                        aria-expanded={weatherOpen}
                        onClick={toggleWeather}
                    >
                        <TaskbarIcon name="weather" />
                        {weather && (
                            <span>{Math.round(weather.temperature_2m)}°</span>
                        )}
                    </button>
                    <button
                        type="button"
                        className="taskbar__clock"
                        title={dateText}
                        aria-label={`Calendário, ${dateText}`}
                        aria-expanded={calendarOpen}
                        onClick={toggleCalendar}
                    >
                        <time dateTime={currentTime.toISOString()}>{timeText}</time>
                    </button>
                </div>
            </nav>
        </div>
    );
}

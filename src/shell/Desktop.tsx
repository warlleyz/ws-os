
import { useState } from 'react'

import {
    Award,
    ChartNoAxesCombined,
    FileUser,
    FolderKanban,
    Mail,
    UserRound,
    type LucideIcon,
} from 'lucide-react'

import { appLifecycle } from '../core/lifecycle'
import { appRegistry } from '../core/registry'
import { useApps } from '../core/useApps'

import {
    Window,
    type WindowPosition,
    type WindowSize,
} from './Window'

type DesktopProps = {
    onOpenApp: (appId: string) => string
}

const DESKTOP_SHORTCUTS = [
    'about-me',
    'projects',
    'dev-insights',
    'resume',
    'certificates',
    'contact',
] as const

const SHORTCUT_ICONS: Record<
    (typeof DESKTOP_SHORTCUTS)[number],
    LucideIcon
> = {
    'about-me': UserRound,
    projects: FolderKanban,
    'dev-insights': ChartNoAxesCombined,
    resume: FileUser,
    certificates: Award,
    contact: Mail,
}

export function Desktop({ onOpenApp }: DesktopProps) {
    // === SELEÇÃO DE ATALHOS ===

    const [selectedApp, setSelectedApp] = useState<
        string | null
    >(null)

    // === ORDEM DE FOCO ===

    const [windowOrder, setWindowOrder] = useState<
        string[]
    >([])

    // === GEOMETRIA DAS JANELAS ===

    const [windowPositions, setWindowPositions] = useState<
        Record<string, WindowPosition>
    >({})

    const [windowSizes, setWindowSizes] = useState<
        Record<string, WindowSize>
    >({})

    const [nextWindowOffset, setNextWindowOffset] =
        useState(0)

    // === ESTADOS VISUAIS ===

    const [maximizedWindows, setMaximizedWindows] = useState<
        Record<string, boolean>
    >({})

    const [minimizedWindows, setMinimizedWindows] = useState<
        Record<string, boolean>
    >({})

    // === INSTÂNCIAS DO CORE ===

    const instances = useApps()

    const visibleInstances = instances.filter(
        (instance) => !minimizedWindows[instance.id],
    )

    const activeInstanceId =
        [...windowOrder]
            .reverse()
            .find((id) =>
                visibleInstances.some(
                    (instance) => instance.id === id,
                ),
            ) ??
        visibleInstances.at(-1)?.id ??
        null

    // === FOCO ===

    function focusWindow(instanceId: string) {
        setWindowOrder((current) => [
            ...current.filter((id) => id !== instanceId),
            instanceId,
        ])
    }

    // === ABERTURA E RESTAURAÇÃO ===

    function openApp(appId: string) {
        const instanceId = onOpenApp(appId)

        setMinimizedWindows((current) => {
            if (!current[instanceId]) return current

            return {
                ...current,
                [instanceId]: false,
            }
        })

        if (!windowPositions[instanceId]) {
            const offset = (nextWindowOffset % 5) * 28

            setWindowPositions((current) => ({
                ...current,
                [instanceId]: {
                    x: offset,
                    y: offset,
                },
            }))

            setNextWindowOffset((current) => current + 1)
        }

        focusWindow(instanceId)
    }

    // === MOVIMENTAÇÃO ===

    function updateWindowPosition(
        instanceId: string,
        position: WindowPosition,
    ) {
        setWindowPositions((current) => ({
            ...current,
            [instanceId]: position,
        }))
    }

    // === REDIMENSIONAMENTO ===

    function updateWindowGeometry(
        instanceId: string,
        position: WindowPosition,
        size: WindowSize,
    ) {
        setWindowPositions((current) => ({
            ...current,
            [instanceId]: position,
        }))

        setWindowSizes((current) => ({
            ...current,
            [instanceId]: size,
        }))
    }

    // === MAXIMIZAÇÃO ===

    function toggleMaximize(instanceId: string) {
        setMaximizedWindows((current) => ({
            ...current,
            [instanceId]: !current[instanceId],
        }))

        focusWindow(instanceId)
    }

    // === MINIMIZAÇÃO ===

    function minimizeWindow(instanceId: string) {
        setMinimizedWindows((current) => ({
            ...current,
            [instanceId]: true,
        }))

        setWindowOrder((current) =>
            current.filter((id) => id !== instanceId),
        )
    }

    // === FECHAMENTO ===

    function closeWindow(instanceId: string) {
        appLifecycle.close(instanceId)

        setWindowPositions((current) => {
            const updated = { ...current }
            delete updated[instanceId]
            return updated
        })

        setWindowSizes((current) => {
            const updated = { ...current }
            delete updated[instanceId]
            return updated
        })

        setMaximizedWindows((current) => {
            const updated = { ...current }
            delete updated[instanceId]
            return updated
        })

        setMinimizedWindows((current) => {
            const updated = { ...current }
            delete updated[instanceId]
            return updated
        })

        setWindowOrder((current) =>
            current.filter((id) => id !== instanceId),
        )
    }

    // === RENDERIZAÇÃO ===

    return (
        <main
            className="relative h-dvh w-full overflow-hidden bg-ws-bg text-ws-text select-none"
            aria-label="Área de trabalho da WS OS"
            onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                    setSelectedApp(null)
                }
            }}
        >
            {/* === WALLPAPER PROVISÓRIO === */}

            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: [
                        'radial-gradient(ellipse at 70% 24%, color-mix(in srgb, var(--ws-accent) 14%, transparent), transparent 55%)',
                        'linear-gradient(145deg, var(--ws-bg), var(--ws-surface))',
                    ].join(', '),
                }}
                aria-hidden="true"
            />

            {/* === ATALHOS === */}

            <section
                className="absolute inset-x-4 top-5 bottom-24 z-10 grid w-fit grid-flow-col auto-cols-[84px] grid-rows-[repeat(auto-fill,84px)] content-start gap-x-2 gap-y-2"
                aria-label="Atalhos da área de trabalho"
            >
                {DESKTOP_SHORTCUTS.map((appId) => {
                    const app = appRegistry.getApp(appId)

                    if (!app) return null

                    const Icon = SHORTCUT_ICONS[appId]

                    const isSelected = selectedApp === app.id

                    const isOpen = instances.some(
                        (instance) =>
                            instance.appId === app.id &&
                            instance.status !== 'closing',
                    )

                    return (
                        <button
                            key={app.id}
                            type="button"
                            title={`Abrir ${app.name}`}
                            aria-label={`Abrir ${app.name}`}
                            aria-pressed={isSelected}
                            onClick={() => setSelectedApp(app.id)}
                            onDoubleClick={() => openApp(app.id)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    openApp(app.id)
                                }
                            }}
                            className={[
                                'group relative flex h-[82px] w-[82px]',
                                'flex-col items-center justify-center gap-[7px]',
                                'rounded-[10px] border px-1.5 py-1',
                                'transition-[background,border-color,transform] duration-150',
                                'active:scale-[0.97]',
                                isSelected
                                    ? 'border-ws-border bg-[color-mix(in_srgb,var(--ws-accent)_14%,transparent)]'
                                    : 'border-transparent hover:border-ws-border hover:bg-[var(--ws-glass)]',
                            ].join(' ')}
                        >
                            <span
                                className={[
                                    'relative flex h-[46px] w-[46px] shrink-0',
                                    'items-center justify-center',
                                    'rounded-[13px] border border-ws-border',
                                    'bg-[var(--ws-glass)] text-ws-text',
                                    'shadow-[var(--ws-shadow)] backdrop-blur-xl',
                                    'transition-transform duration-150',
                                    'group-hover:-translate-y-0.5',
                                    isOpen ? 'text-ws-accent' : '',
                                ].join(' ')}
                                aria-hidden="true"
                            >
                                <Icon size={28} strokeWidth={1.7} />

                                <span
                                    className={[
                                        'absolute -right-0.5 -bottom-0.5',
                                        'h-2 w-2 rounded-full border-2 border-ws-bg',
                                        'transition-[opacity,transform] duration-150',
                                        isOpen
                                            ? 'scale-100 bg-ws-accent opacity-100'
                                            : 'scale-75 opacity-0',
                                    ].join(' ')}
                                />
                            </span>

                            <span className="w-full truncate text-center text-[11px] font-medium leading-tight">
                                {app.name}
                            </span>
                        </button>
                    )
                })}
            </section>

            {/* === JANELAS === */}

            <div className="pointer-events-none absolute inset-0 z-20">
                {instances.map((instance, index) => {
                    const app = appRegistry.getApp(instance.appId)

                    if (!app) return null

                    const position = windowPositions[instance.id] ?? {
                        x: 0,
                        y: 0,
                    }

                    const size = windowSizes[instance.id] ?? {
                        width: Math.max(
                            0,
                            Math.min(720, window.innerWidth - 32),
                        ),
                        height: Math.max(
                            0,
                            Math.min(500, window.innerHeight - 32),
                        ),
                    }

                    const orderIndex = windowOrder.indexOf(
                        instance.id,
                    )

                    const zIndex =
                        orderIndex >= 0
                            ? 100 + orderIndex
                            : 10 + index

                    const isActive =
                        activeInstanceId === instance.id

                    return (
                        <Window
                            key={instance.id}
                            title={app.name}
                            position={position}
                            size={size}
                            zIndex={zIndex}
                            active={isActive}
                            maximized={Boolean(
                                maximizedWindows[instance.id],
                            )}
                            minimized={Boolean(
                                minimizedWindows[instance.id],
                            )}
                            onFocusWindow={() =>
                                focusWindow(instance.id)
                            }
                            onPositionChange={(nextPosition) =>
                                updateWindowPosition(
                                    instance.id,
                                    nextPosition,
                                )
                            }
                            onResize={(nextPosition, nextSize) =>
                                updateWindowGeometry(
                                    instance.id,
                                    nextPosition,
                                    nextSize,
                                )
                            }
                            onToggleMaximize={() =>
                                toggleMaximize(instance.id)
                            }
                            onMinimize={() =>
                                minimizeWindow(instance.id)
                            }
                            onClose={() =>
                                closeWindow(instance.id)
                            }
                        >
                            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-ws-accent">
                                    WS OS V2
                                </span>

                                <h2 className="text-2xl font-bold">
                                    {app.name}
                                </h2>

                                <p className="max-w-sm text-sm leading-relaxed text-ws-muted">
                                    Estrutura visual da janela concluída.
                                    O conteúdo deste aplicativo será
                                    integrado em seu respectivo marco.
                                </p>

                                <span className="ws-mono text-xs text-ws-muted">
                                    {instance.id.slice(0, 8)}
                                </span>
                            </div>
                        </Window>
                    )
                })}
            </div>
        </main>
    )
}
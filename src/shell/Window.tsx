
import { Maximize2, Minus, X } from 'lucide-react'
import {
    useRef,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from 'react'

export type WindowPosition = {
    x: number
    y: number
}

export type WindowSize = {
    width: number
    height: number
}

type ResizeDirection =
    | 'n'
    | 's'
    | 'e'
    | 'w'
    | 'ne'
    | 'nw'
    | 'se'
    | 'sw'

type WindowProps = {
    title: string
    children: ReactNode
    position: WindowPosition
    size: WindowSize
    zIndex?: number
    active?: boolean
    maximized?: boolean
    minimized?: boolean
    onFocusWindow: () => void
    onPositionChange: (position: WindowPosition) => void
    onResize: (
        position: WindowPosition,
        size: WindowSize,
    ) => void
    onToggleMaximize: () => void
    onMinimize: () => void
    onClose: () => void
}

type DragState = {
    pointerId: number
    startX: number
    startY: number
    startLeft: number
    startTop: number
    width: number
    height: number
    position: WindowPosition
}

type ResizeState = {
    pointerId: number
    direction: ResizeDirection
    startX: number
    startY: number
    left: number
    top: number
    right: number
    bottom: number
    position: WindowPosition
    size: WindowSize
}

const MARGIN = 8
const MIN_WIDTH = 360
const MIN_HEIGHT = 260

const RESIZE_HANDLES: {
    direction: ResizeDirection
    className: string
}[] = [
        {
            direction: 'n',
            className: 'top-0 left-3 right-3 h-1.5 cursor-n-resize',
        },
        {
            direction: 's',
            className: 'bottom-0 left-3 right-3 h-1.5 cursor-s-resize',
        },
        {
            direction: 'e',
            className: 'right-0 top-3 bottom-3 w-1.5 cursor-e-resize',
        },
        {
            direction: 'w',
            className: 'left-0 top-3 bottom-3 w-1.5 cursor-w-resize',
        },
        {
            direction: 'ne',
            className: 'right-0 top-0 h-3 w-3 cursor-ne-resize',
        },
        {
            direction: 'nw',
            className: 'left-0 top-0 h-3 w-3 cursor-nw-resize',
        },
        {
            direction: 'se',
            className: 'right-0 bottom-0 h-3 w-3 cursor-se-resize',
        },
        {
            direction: 'sw',
            className: 'left-0 bottom-0 h-3 w-3 cursor-sw-resize',
        },
    ]

function clamp(
    value: number,
    minimum: number,
    maximum: number,
) {
    return Math.min(Math.max(value, minimum), maximum)
}

export function Window({
    title,
    children,
    position,
    size,
    zIndex = 10,
    active = false,
    maximized = false,
    minimized = false,
    onFocusWindow,
    onPositionChange,
    onResize,
    onToggleMaximize,
    onMinimize,
    onClose,
}: WindowProps) {
    const dragState = useRef<DragState | null>(null)
    const resizeState = useRef<ResizeState | null>(null)

    // === ARRASTE ===

    function handleDragStart(
        event: ReactPointerEvent<HTMLElement>,
    ) {
        if (
            maximized ||
            minimized ||
            event.button !== 0 ||
            (
                event.target instanceof Element &&
                event.target.closest('button')
            )
        ) {
            return
        }

        const element = event.currentTarget.parentElement

        if (!element) return

        const bounds = element.getBoundingClientRect()

        dragState.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startLeft: bounds.left,
            startTop: bounds.top,
            width: bounds.width,
            height: bounds.height,
            position: { ...position },
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        event.preventDefault()
        onFocusWindow()
    }

    function handleDragMove(
        event: ReactPointerEvent<HTMLElement>,
    ) {
        const drag = dragState.current

        if (!drag || drag.pointerId !== event.pointerId) {
            return
        }

        const left = clamp(
            drag.startLeft + event.clientX - drag.startX,
            MARGIN,
            Math.max(
                MARGIN,
                window.innerWidth - drag.width - MARGIN,
            ),
        )

        const top = clamp(
            drag.startTop + event.clientY - drag.startY,
            MARGIN,
            Math.max(
                MARGIN,
                window.innerHeight - drag.height - MARGIN,
            ),
        )

        onPositionChange({
            x: drag.position.x + left - drag.startLeft,
            y: drag.position.y + top - drag.startTop,
        })
    }

    function handleDragEnd(
        event: ReactPointerEvent<HTMLElement>,
    ) {
        if (dragState.current?.pointerId !== event.pointerId) {
            return
        }

        dragState.current = null

        if (
            event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
            event.currentTarget.releasePointerCapture(
                event.pointerId,
            )
        }
    }

    // === REDIMENSIONAMENTO ===

    function handleResizeStart(
        event: ReactPointerEvent<HTMLDivElement>,
        direction: ResizeDirection,
    ) {
        if (
            maximized ||
            minimized ||
            event.button !== 0
        ) {
            return
        }

        const element = event.currentTarget.parentElement

        if (!element) return

        const bounds = element.getBoundingClientRect()

        resizeState.current = {
            pointerId: event.pointerId,
            direction,
            startX: event.clientX,
            startY: event.clientY,
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            position: { ...position },
            size: {
                width: bounds.width,
                height: bounds.height,
            },
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        event.stopPropagation()
        event.preventDefault()
        onFocusWindow()
    }

    function handleResizeMove(
        event: ReactPointerEvent<HTMLDivElement>,
    ) {
        const resize = resizeState.current

        if (!resize || resize.pointerId !== event.pointerId) {
            return
        }

        const deltaX = event.clientX - resize.startX
        const deltaY = event.clientY - resize.startY
        const direction = resize.direction

        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        const minWidth = Math.max(
            0,
            Math.min(MIN_WIDTH, viewportWidth - MARGIN * 2),
        )

        const minHeight = Math.max(
            0,
            Math.min(MIN_HEIGHT, viewportHeight - MARGIN * 2),
        )

        let left = resize.left
        let top = resize.top
        let right = resize.right
        let bottom = resize.bottom

        if (direction.includes('e')) {
            right = clamp(
                resize.right + deltaX,
                left + minWidth,
                Math.max(left + minWidth, viewportWidth - MARGIN),
            )
        }

        if (direction.includes('w')) {
            left = clamp(
                resize.left + deltaX,
                MARGIN,
                Math.max(MARGIN, right - minWidth),
            )
        }

        if (direction.includes('s')) {
            bottom = clamp(
                resize.bottom + deltaY,
                top + minHeight,
                Math.max(
                    top + minHeight,
                    viewportHeight - MARGIN,
                ),
            )
        }

        if (direction.includes('n')) {
            top = clamp(
                resize.top + deltaY,
                MARGIN,
                Math.max(MARGIN, bottom - minHeight),
            )
        }

        const nextSize: WindowSize = {
            width: right - left,
            height: bottom - top,
        }

        const nextPosition: WindowPosition = {
            x:
                resize.position.x +
                left -
                resize.left +
                (nextSize.width - resize.size.width) / 2,
            y:
                resize.position.y +
                top -
                resize.top +
                (nextSize.height - resize.size.height) / 2,
        }

        onResize(nextPosition, nextSize)
    }

    function handleResizeEnd(
        event: ReactPointerEvent<HTMLDivElement>,
    ) {
        if (resizeState.current?.pointerId !== event.pointerId) {
            return
        }

        resizeState.current = null

        if (
            event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
            event.currentTarget.releasePointerCapture(
                event.pointerId,
            )
        }
    }

    // === RENDERIZAÇÃO ===

    return (
        <section
            className={[
                'pointer-events-auto absolute flex flex-col',
                'rounded-2xl border border-ws-border',
                'bg-[var(--ws-glass)] backdrop-blur-2xl',
                'transition-[border-color,box-shadow] duration-150',
                active
                    ? 'shadow-[0_18px_48px_rgba(0,0,0,0.32)]'
                    : 'shadow-[var(--ws-shadow)]',
            ].join(' ')}
            style={
                minimized
                    ? {
                        display: 'none',
                        zIndex,
                    }
                    : maximized
                        ? {
                            top: MARGIN,
                            left: MARGIN,
                            width: `calc(100% - ${MARGIN * 2}px)`,
                            height: `calc(100% - ${MARGIN * 2}px)`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            transform: 'none',
                            zIndex,
                        }
                        : {
                            width: size.width,
                            height: size.height,
                            maxWidth: `calc(100% - ${MARGIN * 2}px)`,
                            maxHeight: `calc(100% - ${MARGIN * 2}px)`,
                            top: `calc(50% + ${position.y}px)`,
                            left: `calc(50% + ${position.x}px)`,
                            transform: 'translate(-50%, -50%)',
                            zIndex,
                        }
            }
            onPointerDown={(event) => {
                if (
                    event.target instanceof Element &&
                    event.target.closest('button')
                ) {
                    return
                }

                onFocusWindow()
            }}
            aria-label={`Janela: ${title}`}
            aria-hidden={minimized}
        >
            {/* === BARRA DE TÍTULO === */}

            <header
                className={[
                    'flex h-12 shrink-0 touch-none',
                    'items-center justify-between',
                    'rounded-t-2xl border-b border-ws-border px-4',
                    maximized
                        ? 'cursor-default'
                        : 'cursor-grab active:cursor-grabbing',
                    active
                        ? 'bg-[var(--ws-surface-raised)]'
                        : 'bg-ws-surface',
                ].join(' ')}
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                onLostPointerCapture={() => {
                    dragState.current = null
                }}
            >
                <div className="pointer-events-none flex min-w-0 items-center gap-3">
                    <span
                        className={[
                            'h-2 w-2 shrink-0 rounded-full',
                            active ? 'bg-ws-accent' : 'bg-ws-muted',
                        ].join(' ')}
                    />

                    <span className="truncate text-sm font-semibold">
                        {title}
                    </span>
                </div>

                {/* Controles: minimizar, maximizar e fechar */}

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onMinimize}
                        title="Minimizar"
                        aria-label={`Minimizar ${title}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ws-border bg-[var(--ws-surface-raised)] text-ws-text transition-colors hover:bg-[var(--ws-glass)]"
                    >
                        <Minus size={13} strokeWidth={2} />
                    </button>

                    <button
                        type="button"
                        onClick={onToggleMaximize}
                        title={maximized ? 'Restaurar' : 'Maximizar'}
                        aria-label={
                            maximized
                                ? `Restaurar ${title}`
                                : `Maximizar ${title}`
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ws-border bg-[var(--ws-surface-raised)] text-ws-text transition-colors hover:bg-[var(--ws-glass)]"
                    >
                        <Maximize2 size={12} strokeWidth={2} />
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        title="Fechar"
                        aria-label={`Fechar ${title}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ws-border bg-[var(--ws-surface-raised)] text-ws-text transition-colors hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-400"
                    >
                        <X size={13} strokeWidth={2} />
                    </button>
                </div>
            </header>

            {/* === CONTEÚDO === */}

            <div className="min-h-0 flex-1 overflow-auto p-6">
                {children}
            </div>

            {/* === ÁREAS DE REDIMENSIONAMENTO === */}

            {!maximized &&
                !minimized &&
                RESIZE_HANDLES.map(({ direction, className }) => (
                    <div
                        key={direction}
                        role="presentation"
                        className={`absolute z-10 touch-none ${className}`}
                        onPointerDown={(event) =>
                            handleResizeStart(event, direction)
                        }
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeEnd}
                        onLostPointerCapture={() => {
                            resizeState.current = null
                        }}
                    />
                ))}
        </section>
    )
}
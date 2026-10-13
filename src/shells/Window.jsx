import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_WIDTH = 300;
const MIN_HEIGHT = 220;
const WINDOW_GAP = 8;
const SNAP_DISTANCE = 24;

const RESIZE_DIRECTIONS = [
    'n',
    's',
    'e',
    'w',
    'ne',
    'nw',
    'se',
    'sw',
];

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getBounds(element) {
    const parent = element?.offsetParent;

    return {
        width: parent?.clientWidth ?? window.innerWidth,
        height: parent?.clientHeight ?? window.innerHeight,
    };
}

function readGeometry(element) {
    const rect = element.getBoundingClientRect();
    const parentRect = element.offsetParent?.getBoundingClientRect();

    return {
        x: rect.left - (parentRect?.left ?? 0),
        y: rect.top - (parentRect?.top ?? 0),
        width: rect.width,
        height: rect.height,
    };
}

function constrainGeometry(geometry, bounds) {
    const gapX = Math.min(WINDOW_GAP, bounds.width / 2);
    const gapY = Math.min(WINDOW_GAP, bounds.height / 2);

    const availableWidth = Math.max(0, bounds.width - gapX * 2);
    const availableHeight = Math.max(0, bounds.height - gapY * 2);

    const width = clamp(
        geometry.width,
        Math.min(MIN_WIDTH, availableWidth),
        availableWidth,
    );

    const height = clamp(
        geometry.height,
        Math.min(MIN_HEIGHT, availableHeight),
        availableHeight,
    );

    return {
        x: clamp(
            geometry.x,
            gapX,
            Math.max(gapX, bounds.width - width - gapX),
        ),
        y: clamp(
            geometry.y,
            gapY,
            Math.max(gapY, bounds.height - height - gapY),
        ),
        width,
        height,
    };
}

function applyGeometry(element, geometry) {
    const next = constrainGeometry(geometry, getBounds(element));

    element.style.left = `${next.x}px`;
    element.style.top = `${next.y}px`;
    element.style.width = `${next.width}px`;
    element.style.height = `${next.height}px`;

    return next;
}

function resizeGeometry(initial, direction, dx, dy, bounds) {
    const gapX = Math.min(WINDOW_GAP, bounds.width / 2);
    const gapY = Math.min(WINDOW_GAP, bounds.height / 2);

    let left = initial.x;
    let top = initial.y;
    let right = initial.x + initial.width;
    let bottom = initial.y + initial.height;

    const minWidth = Math.min(
        MIN_WIDTH,
        bounds.width - gapX * 2,
    );

    const minHeight = Math.min(
        MIN_HEIGHT,
        bounds.height - gapY * 2,
    );

    if (direction.includes('e')) {
        right = clamp(
            right + dx,
            left + minWidth,
            bounds.width - gapX,
        );
    }

    if (direction.includes('w')) {
        left = clamp(
            left + dx,
            gapX,
            right - minWidth,
        );
    }

    if (direction.includes('s')) {
        bottom = clamp(
            bottom + dy,
            top + minHeight,
            bounds.height - gapY,
        );
    }

    if (direction.includes('n')) {
        top = clamp(
            top + dy,
            gapY,
            bottom - minHeight,
        );
    }

    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
    };
}

function getSnapMode(x, y, width, height) {
    const left = x <= SNAP_DISTANCE;
    const right = x >= width - SNAP_DISTANCE;
    const top = y <= SNAP_DISTANCE;
    const bottom = y >= height - SNAP_DISTANCE;

    if (top && left) return 'top-left';
    if (top && right) return 'top-right';
    if (bottom && left) return 'bottom-left';
    if (bottom && right) return 'bottom-right';

    if (top) return 'maximized';
    if (left) return 'left';
    if (right) return 'right';

    return null;
}

export default function Window({
    instance,
    app,
    active,
    zIndex,
    offset,
    onActivate,
    onMinimize,
    onClose,
}) {
    const windowRef = useRef(null);
    const geometryRef = useRef(null);
    const interactionRef = useRef(null);
    const previewRef = useRef(null);
    const modeRef = useRef('normal');

    const [mode, setMode] = useState('normal');

    const appName = app?.name ?? instance.appId;

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key !== 'Escape') return;

            const interaction = interactionRef.current;
            if (!interaction) return;

            const element = windowRef.current;

            interactionRef.current = null;

            if (element) {
                geometryRef.current = applyGeometry(
                    element,
                    interaction.geometry,
                );
            }

            previewRef.current?.remove();
            previewRef.current = null;

            const target = interaction.captureTarget;

            if (
                target?.hasPointerCapture(interaction.pointerId)
            ) {
                target.releasePointerCapture(interaction.pointerId);
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!instance.minimized) return;

        const interaction = interactionRef.current;

        interactionRef.current = null;

        if (interaction) {
            const target = interaction.captureTarget;

            if (
                target?.hasPointerCapture(interaction.pointerId)
            ) {
                target.releasePointerCapture(interaction.pointerId);
            }
        }

        previewRef.current?.remove();
        previewRef.current = null;
    }, [instance.minimized]);

    function removeSnapPreview() {
        previewRef.current?.remove();
        previewRef.current = null;
    }

    function updateSnapPreview(nextMode) {
        const element = windowRef.current;
        const parent = element?.offsetParent;

        if (!parent || !nextMode) {
            removeSnapPreview();
            return;
        }

        if (!previewRef.current) {
            const preview = document.createElement('div');

            preview.setAttribute('aria-hidden', 'true');
            preview.style.pointerEvents = 'none';

            parent.appendChild(preview);
            previewRef.current = preview;
        }

        const preview = previewRef.current;
        const className = `desktop-window desktop-window--${nextMode} desktop-snap-preview`;

        if (preview.className !== className) {
            preview.className = className;
        }
    }

    function changeMode(nextMode) {
        modeRef.current = nextMode;
        setMode(nextMode);
    }

    function toggleMaximize() {
        if (modeRef.current === 'normal') {
            changeMode('maximized');
        } else {
            changeMode('normal');
        }
    }

    // A geometria normal permanece preservada durante o snap.
    useLayoutEffect(() => {
        const element = windowRef.current;
        if (!element) return;

        if (!geometryRef.current) {
            geometryRef.current = readGeometry(element);
        }

        if (mode === 'normal') {
            geometryRef.current = applyGeometry(
                element,
                geometryRef.current,
            );
        }
    }, [mode]);

    // Observa somente alterações reais no tamanho do Desktop.
    useLayoutEffect(() => {
        const element = windowRef.current;
        const parent = element?.offsetParent;

        if (!element || !parent) return;

        let frame = 0;

        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);

            frame = requestAnimationFrame(() => {
                if (
                    modeRef.current !== 'normal' ||
                    !geometryRef.current
                ) {
                    return;
                }

                geometryRef.current = applyGeometry(
                    element,
                    geometryRef.current,
                );
            });
        });

        observer.observe(parent);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, []);

    useLayoutEffect(() => {
        return () => {
            previewRef.current?.remove();
            previewRef.current = null;
        };
    }, []);

    function startInteraction(event, type, direction = '') {
        if (event.button !== 0) return;

        if (
            type === 'drag' &&
            event.target.closest('button')
        ) {
            return;
        }

        if (type === 'resize' && modeRef.current !== 'normal') {
            return;
        }

        const element = windowRef.current;
        if (!element) return;

        const bounds = getBounds(element);

        let geometry =
            geometryRef.current ?? readGeometry(element);

        if (type === 'drag' && modeRef.current !== 'normal') {
            const rect = element.getBoundingClientRect();
            const parentRect =
                element.offsetParent.getBoundingClientRect();

            const relativeX = clamp(
                (event.clientX - rect.left) / Math.max(rect.width, 1),
                0,
                1,
            );

            const cursorOffsetY = clamp(
                event.clientY - rect.top,
                0,
                Math.min(46, geometry.height),
            );

            geometry = constrainGeometry(
                {
                    ...geometry,
                    x:
                        event.clientX -
                        parentRect.left -
                        geometry.width * relativeX,
                    y:
                        event.clientY -
                        parentRect.top -
                        cursorOffsetY,
                },
                bounds,
            );

            changeMode('normal');
            geometryRef.current = applyGeometry(element, geometry);
        }

        interactionRef.current = {
            type,
            direction,
            pointerId: event.pointerId,
            captureTarget: event.currentTarget,
            startX: event.clientX,
            startY: event.clientY,
            geometry: { ...geometry },
            lastX: event.clientX,
            lastY: event.clientY,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    function moveInteraction(event) {
        const interaction = interactionRef.current;

        if (
            !interaction ||
            interaction.pointerId !== event.pointerId
        ) {
            return;
        }

        const element = windowRef.current;
        if (!element) return;

        interaction.lastX = event.clientX;
        interaction.lastY = event.clientY;

        const dx = event.clientX - interaction.startX;
        const dy = event.clientY - interaction.startY;

        const initial = interaction.geometry;

        let next;

        if (interaction.type === 'drag') {
            next = {
                ...initial,
                x: initial.x + dx,
                y: initial.y + dy,
            };

            const bounds = getBounds(element);
            const parentRect =
                element.offsetParent?.getBoundingClientRect();

            const pointerX =
                event.clientX - (parentRect?.left ?? 0);

            const pointerY =
                event.clientY - (parentRect?.top ?? 0);

            const snapMode = getSnapMode(
                pointerX,
                pointerY,
                bounds.width,
                bounds.height,
            );

            updateSnapPreview(snapMode);
        } else {
            next = resizeGeometry(
                initial,
                interaction.direction,
                dx,
                dy,
                getBounds(element),
            );
        }

        geometryRef.current = applyGeometry(element, next);
    }

    function endInteraction(event) {
        const interaction = interactionRef.current;

        if (
            !interaction ||
            interaction.pointerId !== event.pointerId
        ) {
            return;
        }

        interactionRef.current = null;

        removeSnapPreview();

        if (
            event.type === 'pointerup' &&
            interaction.type === 'drag'
        ) {
            const element = windowRef.current;

            if (element) {
                const bounds = getBounds(element);
                const parentRect =
                    element.offsetParent?.getBoundingClientRect();

                const pointerX =
                    interaction.lastX - (parentRect?.left ?? 0);

                const pointerY =
                    interaction.lastY - (parentRect?.top ?? 0);

                const nextMode = getSnapMode(
                    pointerX,
                    pointerY,
                    bounds.width,
                    bounds.height,
                );

                if (nextMode) {
                    changeMode(nextMode);
                }
            }
        }

        if (
            event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
            event.currentTarget.releasePointerCapture(
                event.pointerId,
            );
        }
    }

    function handleResizeKeyDown(event, direction) {
        const allowedKeys = [
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
        ];

        if (!allowedKeys.includes(event.key)) return;

        event.preventDefault();

        const element = windowRef.current;
        if (!element || modeRef.current !== 'normal') return;

        const step = event.shiftKey ? 20 : 10;

        const dx =
            event.key === 'ArrowRight'
                ? step
                : event.key === 'ArrowLeft'
                    ? -step
                    : 0;

        const dy =
            event.key === 'ArrowDown'
                ? step
                : event.key === 'ArrowUp'
                    ? -step
                    : 0;

        const initial =
            geometryRef.current ?? readGeometry(element);

        const next = resizeGeometry(
            initial,
            direction,
            dx,
            dy,
            getBounds(element),
        );

        geometryRef.current = applyGeometry(element, next);
    }

    return (
        <section
            ref={windowRef}
            data-instance-id={instance.id}
            className={[
                'desktop-window',
                active ? 'desktop-window--active' : '',
                mode !== 'normal'
                    ? `desktop-window--${mode}`
                    : '',
            ]
                .filter(Boolean)
                .join(' ')}
            aria-label={`Janela de ${appName}`}
            aria-hidden={instance.minimized || undefined}
            inert={instance.minimized}
            style={{
                zIndex,
                '--window-offset': offset,
                visibility: instance.minimized
                    ? 'hidden'
                    : 'visible',
                pointerEvents: instance.minimized
                    ? 'none'
                    : 'auto',
            }}
            onPointerDown={onActivate}
        >
            <header className="desktop-window__header">
                <span
                    className="desktop-window__focus"
                    data-active={active}
                    title={active ? 'Janela ativa' : 'Janela inativa'}
                />

                <strong className="desktop-window__title">
                    {appName}
                </strong>

                <div
                    className="desktop-window__drag-area"
                    onPointerDown={(event) =>
                        startInteraction(event, 'drag')
                    }
                    onPointerMove={moveInteraction}
                    onPointerUp={endInteraction}
                    onPointerCancel={endInteraction}
                    onLostPointerCapture={endInteraction}
                    onDoubleClick={toggleMaximize}
                    title="Arrastar para mover ou encaixar"
                />

                <div className="desktop-window__controls">
                    <button
                        className="desktop-window__control desktop-window__control--minimize"
                        type="button"
                        aria-label="Minimizar"
                        title="Minimizar"
                        onClick={onMinimize}
                    >
                        <svg viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M2.5 6h7" />
                        </svg>
                    </button>

                    <button
                        className="desktop-window__control desktop-window__control--maximize"
                        type="button"
                        aria-label={
                            mode === 'normal'
                                ? 'Maximizar'
                                : 'Restaurar tamanho'
                        }
                        title={
                            mode === 'normal'
                                ? 'Maximizar'
                                : 'Restaurar'
                        }
                        onClick={toggleMaximize}
                    >
                        <svg viewBox="0 0 12 12" aria-hidden="true">
                            {mode === 'normal' ? (
                                <rect
                                    x="2.5"
                                    y="2.5"
                                    width="7"
                                    height="7"
                                    rx="1"
                                />
                            ) : (
                                <>
                                    <rect
                                        x="2"
                                        y="4"
                                        width="6"
                                        height="6"
                                        rx="1"
                                    />
                                    <path d="M4 4V2h6v6H8" />
                                </>
                            )}
                        </svg>
                    </button>

                    <button
                        className="desktop-window__control desktop-window__control--close"
                        type="button"
                        aria-label="Fechar"
                        title="Fechar"
                        onClick={onClose}
                    >
                        <svg viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M3 3l6 6M9 3L3 9" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="desktop-window__content">
                <h2>{appName}</h2>
                <p>Aplicativo em desenvolvimento.</p>
                <small>
                    Instância: {instance.id.slice(0, 8)}
                </small>
            </div>

            {mode === 'normal' &&
                RESIZE_DIRECTIONS.map((direction) => (
                    <div
                        key={direction}
                        className={`desktop-window__resize desktop-window__resize--${direction}`}
                        role="separator"
                        tabIndex={0}
                        aria-label={`Redimensionar janela: ${direction}`}
                        aria-orientation={
                            direction === 'n' || direction === 's'
                                ? 'horizontal'
                                : 'vertical'
                        }
                        onKeyDown={(event) =>
                            handleResizeKeyDown(event, direction)
                        }
                        onPointerDown={(event) =>
                            startInteraction(event, 'resize', direction)
                        }
                        onPointerMove={moveInteraction}
                        onPointerUp={endInteraction}
                        onPointerCancel={endInteraction}
                        onLostPointerCapture={endInteraction}
                    />
                ))}
        </section>
    );
}

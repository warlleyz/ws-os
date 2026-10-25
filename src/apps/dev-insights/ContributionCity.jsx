import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Focus,
    Maximize2,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import './ContributionCity.css';
/* === Configuração geométrica === */
const WEEKS_PER_DISTRICT = 14;
const DISTRICT_WIDTH = 350;
const DISTRICT_HEIGHT = 250;
const TILE_WIDTH = 14;
const TILE_DEPTH = 7;
const MIN_HEIGHT = 2;
const MAX_HEIGHT = 54;
const ZOOM_LEVELS = [1, 1.25, 1.5, 1.8];
/* === Textos === */
const COPY = {
    'pt-BR': {
        title: 'Cidade de contribuições',
        description: 'Explore minha atividade no GitHub em uma cidade interativa.',
        contributions: 'Contribuições',
        activeDays: 'Dias ativos',
        bestDay: 'Melhor dia',
        selectedDay: 'Dia selecionado',
        select: 'Selecione um edifício',
        noActivity: 'Nenhuma contribuição registrada',
        activity: 'Contribuições neste dia',
        week: 'Semana',
        intensity: 'Intensidade',
        low: 'Baixa',
        medium: 'Moderada',
        high: 'Alta',
        none: 'Sem atividade',
        district: 'Distrito',
        loading: 'Construindo a cidade...',
        unavailable: 'Não foi possível carregar as contribuições.',
        notConfigured: 'Aguardando dados de contribuições.',
        empty: 'Nenhuma contribuição encontrada neste período.',
        retry: 'Tentar novamente',
        reset: 'Restaurar zoom',
        zoomIn: 'Aproximar',
        zoomOut: 'Afastar',
        previous: 'Dia anterior',
        next: 'Próximo dia',
        explore: 'Clique em um edifício para explorar sua atividade.',
        totalDays: 'Dias analisados',
        scale: 'Altura proporcional à atividade diária',
    },
    en: {
        title: 'Contribution City',
        description: 'Explore my GitHub activity in an interactive city.',
        contributions: 'Contributions',
        activeDays: 'Active days',
        bestDay: 'Best day',
        selectedDay: 'Selected day',
        select: 'Select a building',
        noActivity: 'No contributions recorded',
        activity: 'Contributions on this day',
        week: 'Week',
        intensity: 'Intensity',
        low: 'Low',
        medium: 'Moderate',
        high: 'High',
        none: 'No activity',
        district: 'District',
        loading: 'Building the city...',
        unavailable: 'Unable to load contributions.',
        notConfigured: 'Waiting for contribution data.',
        empty: 'No contributions found for this period.',
        retry: 'Try again',
        reset: 'Reset zoom',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        previous: 'Previous day',
        next: 'Next day',
        explore: 'Select a building to explore its activity.',
        totalDays: 'Days analyzed',
        scale: 'Height represents daily activity',
    },
};
/* === Utilitários de datas === */
function dateToUTC(value) {
    return new Date(`${value}T12:00:00Z`);
}
function formatDate(value, locale) {
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(dateToUTC(value));
}
function formatMonth(value, locale) {
    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(dateToUTC(value));
}
/* === Preparação dos dados reais === */
function buildCity(days) {
    const valid = days
        .filter(
            (day) =>
                /^\d{4}-\d{2}-\d{2}$/.test(day?.date) &&
                Number.isSafeInteger(day.count) &&
                day.count >= 0 &&
                !Number.isNaN(dateToUTC(day.date).getTime()),
        )
        .sort((a, b) => a.date.localeCompare(b.date));
    if (!valid.length) return { buildings: [], districts: [] };
    const first = dateToUTC(valid[0].date);
    const sunday = Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        first.getUTCDate() - first.getUTCDay(),
    );
    const maxCount = Math.max(1, ...valid.map((day) => day.count));
    const districtMap = new Map();
    const buildings = valid.map((day) => {
        const date = dateToUTC(day.date);
        const elapsed = Math.round((date.getTime() - sunday) / 86400000);
        const weekIndex = Math.floor(elapsed / 7);
        const weekday = date.getUTCDay();
        const districtIndex = Math.floor(
            weekIndex / WEEKS_PER_DISTRICT,
        );
        const localWeek = weekIndex % WEEKS_PER_DISTRICT;
        const districtColumn = districtIndex % 2;
        const districtRow = Math.floor(districtIndex / 2);
        const originX = districtColumn * DISTRICT_WIDTH;
        const originY = districtRow * DISTRICT_HEIGHT;
        const intensity = day.count / maxCount;
        const height =
            day.count === 0
                ? MIN_HEIGHT
                : 7 + (Math.log1p(day.count) / Math.log1p(maxCount)) * MAX_HEIGHT;
        const x =
            originX + 115 + (localWeek - weekday) * TILE_WIDTH;
        const y =
            originY + 66 + (localWeek + weekday) * TILE_DEPTH;
        const building = {
            ...day,
            weekIndex,
            weekday,
            districtIndex,
            intensity,
            height,
            x,
            y,
        };
        if (!districtMap.has(districtIndex)) {
            districtMap.set(districtIndex, {
                index: districtIndex,
                originX,
                originY,
                firstDate: day.date,
                lastDate: day.date,
                count: 0,
            });
        }
        const district = districtMap.get(districtIndex);
        district.lastDate = day.date;
        district.count += day.count;
        return building;
    });
    return {
        buildings,
        districts: [...districtMap.values()],
    };
}
/* === Geometria e desenho da cidade === */
function buildingFaces({ x, y, height }) {
    return {
        left: [
            [x - TILE_WIDTH, y + TILE_DEPTH - height],
            [x, y + 2 * TILE_DEPTH - height],
            [x, y + 2 * TILE_DEPTH],
            [x - TILE_WIDTH, y + TILE_DEPTH],
        ],
        right: [
            [x, y + 2 * TILE_DEPTH - height],
            [x + TILE_WIDTH, y + TILE_DEPTH - height],
            [x + TILE_WIDTH, y + TILE_DEPTH],
            [x, y + 2 * TILE_DEPTH],
        ],
        top: [
            [x, y - height],
            [x + TILE_WIDTH, y + TILE_DEPTH - height],
            [x, y + 2 * TILE_DEPTH - height],
            [x - TILE_WIDTH, y + TILE_DEPTH - height],
        ],
    };
}
function tracePolygon(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(...points[i]);
    ctx.closePath();
}
function drawCity(ctx, buildings, districts, selectedDate, bestDate, locale, districtLabel, colors) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    districts.forEach(({ originX, originY, index, firstDate, lastDate }) => {
        ctx.fillStyle = colors.districtFill;
        ctx.strokeStyle = colors.districtStroke;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.roundRect(originX + 8, originY + 8, DISTRICT_WIDTH - 16, DISTRICT_HEIGHT - 16, 12);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors.secondary;
        ctx.font = '700 10px system-ui, sans-serif';
        ctx.fillText(`${districtLabel} ${String(index + 1).padStart(2, '0')}`, originX + 23, originY + 30);
        ctx.fillStyle = colors.muted;
        ctx.font = '9px system-ui, sans-serif';
        ctx.fillText(`${formatMonth(firstDate, locale)} — ${formatMonth(lastDate, locale)}`, originX + 23, originY + 46);
    });
    buildings.forEach((building) => {
        const { date, count, intensity } = building;
        const faces = buildingFaces(building);
        const selected = date === selectedDate;
        const highlighted = date === bestDate && count > 0;
        const alpha = count === 0 ? 0.11 : null;
        const stroke = selected || highlighted ? colors.highlight : colors.faceStroke;
        for (const face of ['left', 'right', 'top']) {
            tracePolygon(ctx, faces[face]);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = selected ? 2 : highlighted && face === 'top' ? 1.5 : 0.75;
            ctx.globalAlpha = selected || (highlighted && face === 'top') ? 1 : alpha ?? (
                face === 'left' ? 0.11 + intensity * 0.57
                    : face === 'right' ? 0.16 + intensity * 0.68
                        : 0.16 + intensity * 0.84
            );
            ctx.fillStyle = face === 'top' ? colors.topGradient : colors.accent;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.stroke();
        }
    });
}
function pointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}
function hitTestBuilding(buildings, x, y) {
    for (let i = buildings.length - 1; i >= 0; i -= 1) {
        const faces = buildingFaces(buildings[i]);
        if (Object.values(faces).some((polygon) => pointInPolygon(x, y, polygon))) {
            return buildings[i];
        }
    }
    return null;
}
/* === Camada Canvas: independente do React para cada edifício === */
function CityCanvas({ buildings, districts, selectedDate, bestDate, locale, districtLabel, width, height, zoom, onSelect, ariaLabel }) {
    const canvasRef = useRef(null);
    const viewportRef = useRef(null);
    const [hoverDate, setHoverDate] = useState(null);
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return undefined;
        const onWheel = (event) => {
            let parent = viewport.parentElement;
            while (parent) {
                const style = getComputedStyle(parent);
                const canScroll = /(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight;
                if (canScroll) {
                    event.preventDefault();
                    parent.scrollTop += event.deltaY;
                    parent.scrollLeft += event.deltaX;
                    return;
                }
                parent = parent.parentElement;
            }
        };
        viewport.addEventListener('wheel', onWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', onWheel);
    }, []);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const render = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * zoom * dpr);
            canvas.height = Math.round(height * zoom * dpr);
            canvas.style.width = `${width * zoom}px`;
            canvas.style.height = `${height * zoom}px`;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
            const styles = getComputedStyle(canvas);
            const value = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
            const accent = value('--accent-primary', '#378ce4');
            const highlight = value('--city-highlight', accent);
            const gradient = ctx.createLinearGradient(0, 0, TILE_WIDTH, TILE_DEPTH * 2);
            gradient.addColorStop(0, highlight);
            gradient.addColorStop(1, accent);
            drawCity(ctx, buildings, districts, selectedDate, bestDate, locale, districtLabel, {
                accent,
                highlight,
                topGradient: gradient,
                faceStroke: `color-mix(in srgb, ${accent} 28%, transparent)`,
                districtFill: `color-mix(in srgb, ${value('--text-primary', '#fff')} 2%, transparent)`,
                districtStroke: `color-mix(in srgb, ${accent} 15%, transparent)`,
                secondary: value('--text-secondary', '#aaa'),
                muted: value('--text-muted', '#888'),
            });
        };
        render();
        const observer = new MutationObserver(render);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent', 'style', 'class'] });
        return () => observer.disconnect();
    }, [buildings, districts, selectedDate, bestDate, locale, districtLabel, width, height, zoom]);
    const dateAtEvent = useCallback((event) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return hitTestBuilding(buildings, (event.clientX - rect.left) / zoom, (event.clientY - rect.top) / zoom);
    }, [buildings, zoom]);
    return (
        <div className="ws-city__viewport" role="region" aria-label={ariaLabel} ref={viewportRef}>
            <canvas
                ref={canvasRef}
                className={`ws-city__drawing${hoverDate ? ' is-hovering-building' : ''}`}
                role="img"
                aria-label={ariaLabel}
                tabIndex={0}
                title={hoverDate ? `${formatDate(hoverDate.date, locale)}: ${hoverDate.count}` : ariaLabel}
                onPointerMove={(event) => setHoverDate((current) => {
                    const next = dateAtEvent(event);
                    return current?.date === next?.date ? current : next;
                })}
                onPointerLeave={() => setHoverDate(null)}
                onClick={(event) => {
                    const building = dateAtEvent(event);
                    if (building) onSelect(building.date);
                }}
                onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    if (buildings.length) onSelect(selectedDate || buildings[0].date);
                }}
            />
        </div>
    );
}
/* === Indicador de resumo === */
function SummaryItem({ label, value }) {
    return (
        <div className="ws-city__summary-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
/* === Componente principal === */
export default function ContributionCity({
    days = [],
    locale = 'pt-BR',
    status = 'idle',
    onRetry,
}) {
    const copy = COPY[locale] || COPY['pt-BR'];
    const [selectedDate, setSelectedDate] = useState(null);
    const [zoomIndex, setZoomIndex] = useState(0);
    const { buildings, districts } = useMemo(
        () => buildCity(days),
        [days],
    );
    const total = buildings.reduce((sum, day) => sum + day.count, 0);
    const activeDays = buildings.filter((day) => day.count > 0).length;
    const bestDay = buildings.reduce(
        (best, day) => (!best || day.count > best.count ? day : best),
        null,
    );
    const selected =
        buildings.find((day) => day.date === selectedDate) ?? null;
    const selectedIndex = selected
        ? buildings.findIndex((day) => day.date === selected.date)
        : -1;
    const districtRows = Math.max(1, Math.ceil(districts.length / 2));
    const svgWidth = DISTRICT_WIDTH * 2;
    const svgHeight = DISTRICT_HEIGHT * districtRows;
    const zoom = ZOOM_LEVELS[zoomIndex];
    function navigateDay(direction) {
        if (!buildings.length) return;
        const nextIndex =
            selectedIndex === -1
                ? direction > 0 ? 0 : buildings.length - 1
                : Math.max(
                    0,
                    Math.min(buildings.length - 1, selectedIndex + direction),
                );
        setSelectedDate(buildings[nextIndex].date);
    }
    const intensityLabel = selected
        ? selected.count === 0
            ? copy.none
            : selected.intensity < 0.25
                ? copy.low
                : selected.intensity < 0.65
                    ? copy.medium
                    : copy.high
        : null;
    return (
        <section className="ws-city">
            {/* === Cabeçalho === */}
            <header className="ws-city__header">
                <div className="ws-city__heading">
                    <span className="ws-city__eyebrow">
                        <span className="ws-city__live-dot" />
                        GITHUB CONTRIBUTIONS
                    </span>
                    <h3>{copy.title}</h3>
                    <p>{copy.description}</p>
                </div>
                <div className="ws-city__controls">
                    <button
                        type="button"
                        title={copy.zoomOut}
                        aria-label={copy.zoomOut}
                        disabled={zoomIndex === 0}
                        onClick={() => setZoomIndex((value) => Math.max(0, value - 1))}
                    >
                        <ZoomOut size={17} />
                    </button>
                    <span className="ws-city__zoom-label">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        type="button"
                        title={copy.zoomIn}
                        aria-label={copy.zoomIn}
                        disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                        onClick={() =>
                            setZoomIndex((value) =>
                                Math.min(ZOOM_LEVELS.length - 1, value + 1),
                            )
                        }
                    >
                        <ZoomIn size={17} />
                    </button>
                    <span className="ws-city__control-divider" />
                    <button
                        type="button"
                        title={copy.reset}
                        aria-label={copy.reset}
                        onClick={() => setZoomIndex(0)}
                    >
                        <Focus size={17} />
                    </button>
                </div>
            </header>
            {/* === Estados de carregamento === */}
            {status !== 'ready' ? (
                <div className="ws-city__state" role="status">
                    <Maximize2 size={28} strokeWidth={1.3} />
                    <p>
                        {status === 'loading'
                            ? copy.loading
                            : status === 'error'
                                ? copy.unavailable
                                : copy.notConfigured}
                    </p>
                    {status === 'error' && onRetry && (
                        <button type="button" onClick={onRetry}>
                            {copy.retry}
                        </button>
                    )}
                </div>
            ) : buildings.length === 0 ? (
                <div className="ws-city__state" role="status">
                    <CalendarDays size={28} strokeWidth={1.3} />
                    <p>{copy.empty}</p>
                </div>
            ) : (
                <>
                    {/* === Visualização e painel contextual === */}
                    <div className="ws-city__workspace">
                        <div className="ws-city__visualization">
                            <div className="ws-city__canvas">
                                <CityCanvas
                                    buildings={buildings}
                                    districts={districts}
                                    selectedDate={selected?.date ?? null}
                                    bestDate={bestDay?.date ?? null}
                                    locale={locale}
                                    districtLabel={copy.district}
                                    width={svgWidth}
                                    height={svgHeight}
                                    zoom={zoom}
                                    onSelect={setSelectedDate}
                                    ariaLabel={copy.title}
                                />
                            </div>
                            <div className="ws-city__canvas-footer">
                                <span>{copy.scale}</span>
                                <span>
                                    {buildings.length} {copy.totalDays.toLowerCase()}
                                </span>
                            </div>
                        </div>
                        {/* === Detalhes da seleção === */}
                        <aside className="ws-city__details">
                            <div className="ws-city__details-heading">
                                <CalendarDays size={17} />
                                <span>{copy.selectedDay}</span>
                            </div>
                            {selected ? (
                                <div className="ws-city__selected-content">
                                    <strong className="ws-city__selected-date">
                                        {formatDate(selected.date, locale)}
                                    </strong>
                                    <div className="ws-city__selected-number">
                                        {selected.count.toLocaleString(locale)}
                                    </div>
                                    <span className="ws-city__selected-caption">
                                        {copy.activity}
                                    </span>
                                    <div className="ws-city__detail-row">
                                        <span>{copy.week}</span>
                                        <strong>{selected.weekIndex + 1}</strong>
                                    </div>
                                    <div className="ws-city__detail-row">
                                        <span>{copy.intensity}</span>
                                        <strong>{intensityLabel}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div className="ws-city__details-empty">
                                    <Focus size={30} strokeWidth={1.2} />
                                    <p>{copy.explore}</p>
                                </div>
                            )}
                            <div className="ws-city__details-navigation">
                                <button
                                    type="button"
                                    aria-label={copy.previous}
                                    title={copy.previous}
                                    onClick={() => navigateDay(-1)}
                                    disabled={selectedIndex === 0}
                                >
                                    <ChevronLeft size={17} />
                                </button>
                                <span>
                                    {selectedIndex >= 0
                                        ? `${selectedIndex + 1} / ${buildings.length}`
                                        : '—'}
                                </span>
                                <button
                                    type="button"
                                    aria-label={copy.next}
                                    title={copy.next}
                                    onClick={() => navigateDay(1)}
                                    disabled={selectedIndex === buildings.length - 1}
                                >
                                    <ChevronRight size={17} />
                                </button>
                            </div>
                        </aside>
                    </div>
                    {/* === Resumo === */}
                    <footer className="ws-city__summary">
                        <SummaryItem
                            label={copy.contributions}
                            value={total.toLocaleString(locale)}
                        />
                        <SummaryItem
                            label={copy.activeDays}
                            value={activeDays.toLocaleString(locale)}
                        />
                        <SummaryItem
                            label={copy.bestDay}
                            value={
                                bestDay
                                    ? `${bestDay.count.toLocaleString(locale)}`
                                    : '—'
                            }
                        />
                        <SummaryItem
                            label={copy.totalDays}
                            value={buildings.length.toLocaleString(locale)}
                        />
                    </footer>
                </>
            )}
        </section>
    );
}

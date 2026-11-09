import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    Layers3,
    Pause,
    Play,
    RotateCcw,
    Trophy,
} from 'lucide-react';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { useGameRecord } from '../rankings/gameRecords';

import {
    createSolitaireGame,
    drawSolitaireCard,
    getSolitaireFoundationCount,
    moveSolitaireCards,
    pauseSolitaireGame,
    startSolitaireGame,
} from './solitaireModel';

import './SolitaireGame.css';

/* === IDENTIDADE DAS CARTAS === */
const SUITS = {
    hearts: { symbol: '♥', label: 'Copas' },
    diamonds: { symbol: '♦', label: 'Ouros' },
    clubs: { symbol: '♣', label: 'Paus' },
    spades: { symbol: '♠', label: 'Espadas' },
};

const RANKS = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K',
};

/* === FORMATAÇÃO DAS CARTAS === */
function getRankLabel(rank) {
    return RANKS[rank] ?? String(rank);
}

/* === CARTA VISUAL === */
function SolitaireCard({
    card,
    selected = false,
    disabled = false,
    onClick,
    onPointerDown,
    style,
}) {
    const suit = SUITS[card.suit];

    return (
        <button
            type="button"
            className={[
                'ws-solitaire-game__card',
                card.faceUp ? 'is-face-up' : 'is-face-down',
                card.color === 'red' ? 'is-red' : 'is-black',
                selected ? 'is-selected' : '',
            ].filter(Boolean).join(' ')}
            style={style}
            onClick={onClick}
            onPointerDown={onPointerDown}
            onDragStart={(event) => event.preventDefault()}
            disabled={disabled || !card.faceUp}
            aria-pressed={selected}
            aria-label={
                card.faceUp
                    ? t('Carta {0} de {1}').replace('{0}', getRankLabel(card.rank)).replace('{1}', t(suit.label))
                    : t('Carta virada para baixo')
            }
        >
            {card.faceUp ? (
                <>
                    <span className="ws-solitaire-game__card-corner">
                        <strong>{getRankLabel(card.rank)}</strong>
                        <span>{suit.symbol}</span>
                    </span>

                    <span
                        className="ws-solitaire-game__card-center"
                        aria-hidden="true"
                    >
                        {suit.symbol}
                    </span>
                </>
            ) : (
                <span
                    className="ws-solitaire-game__card-pattern"
                    aria-hidden="true"
                >
                    ◆
                </span>
            )}
        </button>
    );
}

/* === CONTROLES DO CABEÇALHO === */
function SolitaireHeaderActions({
    status,
    disabled,
    onStart,
    onPause,
    onRestart,
}) {
    return (
        <div className="ws-solitaire-game__actions">
            {status === 'playing' ? (
                <button
                    type="button"
                    onClick={onPause}
                    disabled={disabled}
                >
                    <Pause size={16} aria-hidden="true" />
                    {t('Pausar')}
                </button>
            ) : status === 'ready' || status === 'paused' ? (
                <button
                    type="button"
                    onClick={onStart}
                    disabled={disabled}
                >
                    <Play size={16} aria-hidden="true" />
                    {t(status === 'paused' ? 'Continuar' : 'Iniciar')}
                </button>
            ) : null}

            <button
                type="button"
                onClick={onRestart}
                disabled={disabled}
                title={t('Reiniciar')}
                aria-label={t('Reiniciar')}
            >
                <RotateCcw size={16} aria-hidden="true" />
            </button>
        </div>
    );
}

/* === APLICATIVO PACIÊNCIA === */
export default function SolitaireGame({
    paused = false,
    onHeaderChange,
}) {
    useLocale();

    /* ----- ESTADO DA PARTIDA ----- */
    const [game, setGame] = useState(createSolitaireGame);
    const [selection, setSelection] = useState(null);
    const [drag, setDrag] = useState(null);
    const dragRef = useRef(null);
    const tableRef = useRef(null);
    const suppressClickRef = useRef(false);
    const onHeaderChangeRef = useRef(onHeaderChange);

    const finished = game.status === 'won';
    const foundationCount = getSolitaireFoundationCount(game);

    /* ----- RECORDE LOCAL ----- */
    const { record, error: recordError } = useGameRecord(
        'solitaire',
        game.moves,
        finished,
    );

    /* === CONTROLES DA PARTIDA === */
    const handleStart = useCallback(() => {
        if (!paused) {
            setGame(startSolitaireGame);
        }
    }, [paused]);

    const handlePause = useCallback(() => {
        setSelection(null);
        setGame(pauseSolitaireGame);
    }, []);

    const handleRestart = useCallback(() => {
        if (paused) {
            return;
        }

        setSelection(null);
        setGame(createSolitaireGame());
    }, [paused]);

    const handleDraw = useCallback(() => {
        if (paused || game.status !== 'playing') {
            return;
        }

        setSelection(null);
        setGame(drawSolitaireCard);
    }, [paused, game.status]);

    /* === MOVIMENTAÇÃO PARA UM DESTINO === */
    const moveTo = useCallback((target) => {
        if (!selection || paused || game.status !== 'playing') {
            return false;
        }

        const next = moveSolitaireCards(
            game,
            selection.source,
            target,
            selection.cardId,
        );

        if (next === game) {
            return false;
        }

        setGame(next);
        setSelection(null);

        return true;
    }, [game, selection, paused]);

    /* === SELEÇÃO DE CARTAS === */
    const handleCardClick = useCallback((source, card) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }
        if (
            paused ||
            game.status !== 'playing' ||
            !card.faceUp
        ) {
            return;
        }

        /* ----- TENTAR MOVER PARA O LOCAL CLICADO ----- */
        if (
            selection &&
            moveTo({
                type: source.type,
                index: source.index,
            })
        ) {
            return;
        }

        /* ----- DESMARCAR CARTA JÁ SELECIONADA ----- */
        if (
            selection?.cardId === card.id &&
            selection.source.type === source.type &&
            selection.source.index === source.index
        ) {
            setSelection(null);
            return;
        }

        /* ----- SELECIONAR NOVA ORIGEM ----- */
        setSelection({
            source,
            cardId: card.id,
        });
    }, [game.status, paused, selection, moveTo]);

    /* === ARRASTE POR MOUSE, CANETA E TOQUE === */
    function beginDrag(event, source, card) {
        suppressClickRef.current = false;
        if (paused || game.status !== 'playing' || !card.faceUp || event.button !== 0 || event.isPrimary === false) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const pile = source.type === 'tableau' ? game.tableau[source.index]
            : source.type === 'waste' ? game.waste : game.foundations[source.index];
        dragRef.current = { source, cardId: card.id, pointerId: event.pointerId,
            startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top, cards: pile.slice(pile.findIndex((item) => item.id === card.id)),
            element: event.currentTarget, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function updateDrag(event) {
        const current = dragRef.current;
        if (!current || current.pointerId !== event.pointerId || paused || game.status !== 'playing') return;
        if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return;
        current.moved = true;
        event.preventDefault();
        const rect = tableRef.current.getBoundingClientRect();
        setDrag({ cards: current.cards, x: event.clientX - rect.left - current.offsetX,
            y: event.clientY - rect.top - current.offsetY });
    }

    function finishDrag(event, cancelled = false) {
        const current = dragRef.current;
        if (!current || (event.pointerId !== undefined && current.pointerId !== event.pointerId)) return;
        dragRef.current = null;
        setDrag(null);
        if (current.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId);
        if (!current.moved) return;
        suppressClickRef.current = true;
        if (cancelled || paused || game.status !== 'playing') return;
        const target = tableRef.current.ownerDocument.elementFromPoint(event.clientX, event.clientY)?.closest('[data-solitaire-target]');
        if (!target || !tableRef.current.contains(target)) return;
        setGame((state) => moveSolitaireCards(state, current.source,
            { type: target.dataset.solitaireTarget, index: Number(target.dataset.pileIndex) }, current.cardId));
        setSelection(null);
    }

    /* === CABEÇALHO COMPARTILHADO === */
    const headerActions = useMemo(() => (
        <SolitaireHeaderActions
            status={game.status}
            disabled={paused}
            onStart={handleStart}
            onPause={handlePause}
            onRestart={handleRestart}
        />
    ), [
        game.status,
        paused,
        handleStart,
        handlePause,
        handleRestart,
    ]);

    useEffect(() => {
        onHeaderChangeRef.current = onHeaderChange;
    }, [onHeaderChange]);

    useEffect(() => {
        const status = paused
            ? 'SUSPENSO'
            : {
                ready: 'PRONTO',
                playing: 'JOGANDO',
                paused: 'PAUSADO',
                won: 'VITÓRIA',
            }[game.status];

        onHeaderChangeRef.current?.({
            status,
            actions: headerActions,
        });
    }, [game.status, paused, headerActions]);

    /* === CONSULTAS === */
    const wasteTop = game.waste.at(-1);
    const interactionDisabled = paused || game.status !== 'playing';

    /* === INTERFACE === */
    return (
        <div className="ws-solitaire-game">
            {/* === INDICADORES === */}
            <div className="ws-solitaire-game__stats">
                <div className="ws-solitaire-game__stat">
                    <span>{t('MOVIMENTOS')}</span>
                    <strong>{game.moves}</strong>
                </div>

                <div className="ws-solitaire-game__stat">
                    <span>{t('CARTAS NAS BASES')}</span>
                    <strong>{foundationCount} / 52</strong>
                </div>

                <div className="ws-solitaire-game__stat">
                    <span>{t('RECORDE')}</span>
                    <strong>
                        <Trophy size={17} aria-hidden="true" />
                        {record ?? '—'}
                    </strong>
                </div>
            </div>

            {/* === MESA DE JOGO === */}
            <div className="ws-solitaire-game__table" ref={tableRef}
                onPointerMove={updateDrag}
                onPointerUp={(event) => finishDrag(event)}
                onPointerCancel={(event) => finishDrag(event, true)}
                onLostPointerCapture={(event) => finishDrag(event, true)}
                onKeyDown={(event) => { if (event.key === 'Escape' && dragRef.current) { event.stopPropagation(); finishDrag(event, true); } }}
            >
                {drag && !paused && game.status === 'playing' && (
                    <div className="ws-solitaire-game__drag-preview" aria-hidden="true" style={{ left: drag.x, top: drag.y }}>
                        {drag.cards.map((card, index) => (
                            <span key={card.id} className={card.color === 'red' ? 'is-red' : ''}
                                style={{ transform: `translateY(${index * 20}px)` }}>
                                {getRankLabel(card.rank)} {SUITS[card.suit].symbol}
                            </span>
                        ))}
                    </div>
                )}
                {/* ----- ESTOQUE, DESCARTE E BASES ----- */}
                <div className="ws-solitaire-game__top-row">
                    <div className="ws-solitaire-game__pile">
                        <button
                            type="button"
                            className={[
                                'ws-solitaire-game__stock',
                                game.stock.length ? 'has-cards' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={handleDraw}
                            disabled={
                                interactionDisabled ||
                                (!game.stock.length && !game.waste.length)
                            }
                            aria-label={t('Comprar carta')}
                        >
                            {game.stock.length ? (
                                <span aria-hidden="true">◆</span>
                            ) : (
                                <RotateCcw
                                    size={24}
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                        <small>{t('Estoque')}</small>
                    </div>

                    <div className="ws-solitaire-game__pile">
                        <div className="ws-solitaire-game__slot">
                            {wasteTop && (
                                <SolitaireCard
                                    card={wasteTop}
                                    onPointerDown={(event) => beginDrag(event, { type: 'waste', index: 0 }, wasteTop)}
                                    disabled={interactionDisabled}
                                    selected={
                                        selection?.cardId === wasteTop.id
                                    }
                                    onClick={() => handleCardClick(
                                        { type: 'waste', index: 0 },
                                        wasteTop,
                                    )}
                                />
                            )}
                        </div>
                        <small>{t('Descarte')}</small>
                    </div>

                    <div className="ws-solitaire-game__foundation-group">
                        {game.foundations.map((cards, index) => {
                            const topCard = cards.at(-1);

                            return (
                                <div
                                    className="ws-solitaire-game__pile"
                                    data-solitaire-target="foundation"
                                    data-pile-index={index}
                                    key={index}
                                >
                                    <div className="ws-solitaire-game__slot">
                                        {topCard ? (
                                            <SolitaireCard
                                                card={topCard}
                                                onPointerDown={(event) => beginDrag(event, { type: 'foundation', index }, topCard)}
                                                disabled={interactionDisabled}
                                                selected={
                                                    selection?.cardId ===
                                                    topCard.id
                                                }
                                                onClick={() => handleCardClick(
                                                    {
                                                        type: 'foundation',
                                                        index,
                                                    },
                                                    topCard,
                                                )}
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                className="ws-solitaire-game__empty"
                                                onClick={() => moveTo({
                                                    type: 'foundation',
                                                    index,
                                                })}
                                                disabled={interactionDisabled}
                                                aria-label={`${t('Base')} ${index + 1}`}
                                            >
                                                A
                                            </button>
                                        )}
                                    </div>
                                    <small>{t('Base')} {index + 1}</small>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ----- SETE COLUNAS ----- */}
                <div className="ws-solitaire-game__tableau">
                    {game.tableau.map((cards, columnIndex) => (
                        <div
                            className="ws-solitaire-game__column"
                            data-solitaire-target="tableau"
                            data-pile-index={columnIndex}
                            key={columnIndex}
                        >
                            <button
                                type="button"
                                className="ws-solitaire-game__column-target"
                                onClick={() => moveTo({
                                    type: 'tableau',
                                    index: columnIndex,
                                })}
                                disabled={interactionDisabled}
                                aria-label={`${t('Coluna')} ${columnIndex + 1}`}
                            />

                            {cards.map((card, cardIndex) => {
                                const selectedIndex = cards.findIndex(
                                    (item) => item.id === selection?.cardId,
                                );

                                return (
                                    <SolitaireCard
                                        key={card.id}
                                        card={card}
                                        onPointerDown={(event) => beginDrag(event, { type: 'tableau', index: columnIndex }, card)}
                                        disabled={interactionDisabled}
                                        style={{
                                            '--card-index': cardIndex,
                                            '--stack-count': cards.length,
                                            zIndex: cardIndex + 1,
                                        }}
                                        selected={
                                            selection?.source.type === 'tableau' &&
                                            selection.source.index === columnIndex &&
                                            selectedIndex >= 0 &&
                                            cardIndex >= selectedIndex
                                        }
                                        onClick={() => handleCardClick(
                                            {
                                                type: 'tableau',
                                                index: columnIndex,
                                            },
                                            card,
                                        )}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* === ESTADO DA PARTIDA === */}
                {(paused || game.status !== 'playing') && (
                    <div className="ws-solitaire-game__overlay">
                        <strong>
                            {paused
                                ? t('Jogo suspenso')
                                : finished
                                    ? t('Você venceu!')
                                    : game.status === 'paused'
                                        ? t('Jogo pausado')
                                        : t('Pronto para jogar?')}
                        </strong>

                        {finished && !paused && (
                            <p>
                                {game.moves} {t('movimentos')}
                            </p>
                        )}

                        {!paused && (
                            <button
                                type="button"
                                onClick={
                                    finished
                                        ? handleRestart
                                        : handleStart
                                }
                            >
                                {t(
                                    finished
                                        ? 'Jogar novamente'
                                        : game.status === 'paused'
                                            ? 'Continuar'
                                            : 'Iniciar partida',
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* === INSTRUÇÕES === */}
            <div className="ws-solitaire-game__footer">
                <span>
                    <Layers3 size={14} aria-hidden="true" />
                    {t('Arraste uma carta até o destino ou selecione a carta e toque no destino.')}
                </span>

                {selection && (
                    <button
                        type="button"
                        onClick={() => setSelection(null)}
                    >
                        {t('Cancelar seleção')}
                    </button>
                )}
            </div>

            {recordError && (
                <p className="ws-solitaire-game__error" role="alert">
                    {t('Não foi possível salvar o recorde local.')}
                </p>
            )}
        </div>
    );
}

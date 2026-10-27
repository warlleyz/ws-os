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
    onClick,
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
            aria-pressed={selected}
            aria-label={
                card.faceUp
                    ? `${getRankLabel(card.rank)} de ${suit.label}`
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
            <div className="ws-solitaire-game__table">
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
                                    key={index}
                                >
                                    <div className="ws-solitaire-game__slot">
                                        {topCard ? (
                                            <SolitaireCard
                                                card={topCard}
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
                    {t('Selecione uma carta e depois clique no destino.')}
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
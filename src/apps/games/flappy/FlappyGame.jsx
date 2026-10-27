import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    Pause,
    Play,
    RotateCcw,
    Trophy,
} from 'lucide-react';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { useGameRecord } from '../rankings/gameRecords';

import {
    FLAPPY_CONFIG,
    advanceFlappyGame,
    createFlappyGame,
    flapBird,
    getFlappyRotation,
    pauseFlappyGame,
    startFlappyGame,
} from './flappyModel';

import './FlappyGame.css';

/* === CONFIGURAÇÃO DA ANIMAÇÃO === */
const STEP = 1 / 60;
const FRAME_INTERVAL = 1000 / 30;

/* === OBSTÁCULOS === */
const FlappyPipe = memo(function FlappyPipe({ pipe }) {
    const { height, groundHeight, pipeWidth, pipeGap } = FLAPPY_CONFIG;
    const floor = height - groundHeight;
    const bottomY = pipe.topHeight + pipeGap;

    return (
        <g className="ws-flappy-game__pipe">
            {/* ----- CANO SUPERIOR ----- */}
            <rect
                x={pipe.x + 5}
                y={0}
                width={pipeWidth - 10}
                height={pipe.topHeight}
                rx="4"
            />

            <rect
                className="ws-flappy-game__pipe-cap"
                x={pipe.x}
                y={pipe.topHeight - 23}
                width={pipeWidth}
                height={23}
                rx="5"
            />

            {/* ----- CANO INFERIOR ----- */}
            <rect
                x={pipe.x + 5}
                y={bottomY}
                width={pipeWidth - 10}
                height={floor - bottomY}
                rx="4"
            />

            <rect
                className="ws-flappy-game__pipe-cap"
                x={pipe.x}
                y={bottomY}
                width={pipeWidth}
                height={23}
                rx="5"
            />
        </g>
    );
});

/* === PÁSSARO === */
const FlappyBird = memo(function FlappyBird({ y, velocity }) {
    const rotation = getFlappyRotation(velocity);

    return (
        <g
            className="ws-flappy-game__bird"
            transform={`translate(${FLAPPY_CONFIG.birdX} ${y}) rotate(${rotation})`}
        >
            <ellipse
                cx="0"
                cy="0"
                rx="16"
                ry="12"
                className="ws-flappy-game__bird-body"
            />

            <ellipse
                cx="-4"
                cy="5"
                rx="8"
                ry="5"
                className="ws-flappy-game__bird-wing"
            />

            <circle
                cx="7"
                cy="-5"
                r="5"
                fill="#fff"
            />

            <circle
                cx="9"
                cy="-5"
                r="2"
                fill="#172033"
            />

            <path
                d="M 13 0 L 25 4 L 13 8 Z"
                className="ws-flappy-game__bird-beak"
            />
        </g>
    );
});

/* === AÇÕES DO CABEÇALHO === */
const FlappyHeaderActions = memo(function FlappyHeaderActions({
    status,
    disabled,
    onStart,
    onPause,
    onRestart,
}) {
    return (
        <div className="ws-flappy-game__actions">
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
                aria-label={t('Reiniciar')}
                title={t('Reiniciar')}
            >
                <RotateCcw size={16} aria-hidden="true" />
            </button>
        </div>
    );
});

/* === APLICATIVO FLAPPY BIRD === */
export default function FlappyGame({
    paused = false,
    ranking = null,
    onHeaderChange,
}) {
    useLocale();

    /* ----- ESTADO DA PARTIDA ----- */
    const [game, setGame] = useState(createFlappyGame);

    const gameRef = useRef(game);
    const boardRef = useRef(null);
    const onHeaderChangeRef = useRef(onHeaderChange);

    const finished = game.status === 'gameover';

    /* ----- RECORDE LOCAL ----- */
    const { record, error: recordError } = useGameRecord(
        'flappy',
        game.score,
        finished && game.score > 0,
    );

    /* === ATUALIZAÇÃO DA PARTIDA === */
    const updateGame = useCallback((updater) => {
        const current = gameRef.current;
        const next = updater(current);

        if (next !== current) {
            gameRef.current = next;
            setGame(next);
        }
    }, []);

    /* === CONTROLES === */
    const handleStart = useCallback(() => {
        if (paused) return;

        updateGame(startFlappyGame);
    }, [paused, updateGame]);

    const handlePause = useCallback(() => {
        updateGame(pauseFlappyGame);
    }, [updateGame]);

    const handleRestart = useCallback(() => {
        if (paused) return;

        const next = createFlappyGame();

        gameRef.current = next;
        setGame(next);
    }, [paused]);

    const handleFlap = useCallback(() => {
        if (paused) return;

        updateGame(flapBird);
    }, [paused, updateGame]);

    /* === CICLO DE ANIMAÇÃO === */
    useEffect(() => {
        if (paused || game.status !== 'playing') {
            return undefined;
        }

        let frameId = 0;
        let previousTime = null;
        let lastRender = 0;
        let accumulator = 0;

        function animate(timestamp) {
            if (previousTime === null) {
                previousTime = timestamp;
                lastRender = timestamp;
            }

            const elapsed = Math.min(
                (timestamp - previousTime) / 1000,
                0.1,
            );

            previousTime = timestamp;
            accumulator += elapsed;

            let next = gameRef.current;

            /* ----- FÍSICA EM PASSOS FIXOS ----- */
            while (
                accumulator >= STEP &&
                next.status === 'playing'
            ) {
                next = advanceFlappyGame(next, STEP);
                accumulator -= STEP;
            }

            gameRef.current = next;

            /* ----- ATUALIZAÇÃO VISUAL ----- */
            if (
                timestamp - lastRender >= FRAME_INTERVAL ||
                next.status !== 'playing'
            ) {
                setGame(next);
                lastRender = timestamp;
            }

            if (next.status === 'playing') {
                frameId = window.requestAnimationFrame(animate);
            }
        }

        frameId = window.requestAnimationFrame(animate);

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [paused, game.status]);

    /* === TECLADO === */
    useEffect(() => {
        function handleKeyDown(event) {
            if (paused || event.repeat) return;

            const target = event.target;

            if (
                target instanceof HTMLElement &&
                (
                    target.isContentEditable ||
                    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
                )
            ) {
                return;
            }

            const desktopWindow = boardRef.current?.closest(
                '.desktop-window',
            );

            if (
                desktopWindow &&
                !desktopWindow.classList.contains(
                    'desktop-window--active',
                )
            ) {
                return;
            }

            if (
                event.code === 'Space' ||
                event.code === 'ArrowUp'
            ) {
                event.preventDefault();

                if (
                    gameRef.current.status === 'ready' ||
                    gameRef.current.status === 'playing'
                ) {
                    handleFlap();
                } else if (gameRef.current.status === 'paused') {
                    handleStart();
                }

                return;
            }

            if (event.code === 'KeyP') {
                if (gameRef.current.status === 'playing') {
                    handlePause();
                } else if (gameRef.current.status === 'paused') {
                    handleStart();
                }

                return;
            }

            if (event.code === 'KeyR') {
                handleRestart();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        paused,
        handleFlap,
        handlePause,
        handleRestart,
        handleStart,
    ]);

    /* === CABEÇALHO COMPARTILHADO === */
    const headerActions = useMemo(() => (
        <FlappyHeaderActions
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
                gameover: 'FIM DE JOGO',
            }[game.status];

        onHeaderChangeRef.current?.({
            status,
            actions: headerActions,
        });
    }, [game.status, paused, headerActions]);

    /* === INTERFACE === */
    return (
        <div className="ws-flappy-game__layout">
            <div className="ws-flappy-game">
            {/* === INDICADORES === */}
            <div className="ws-flappy-game__stats">
                <div className="ws-flappy-game__stat">
                    <span>{t('PONTUAÇÃO')}</span>
                    <strong>{game.score}</strong>
                </div>

                <div className="ws-flappy-game__stat">
                    <span>{t('RECORDE')}</span>
                    <strong>
                        <Trophy size={17} aria-hidden="true" />
                        {record ?? 0}
                    </strong>
                </div>
            </div>

            {/* === CENÁRIO === */}
            <div
                ref={boardRef}
                className="ws-flappy-game__stage"
            >
                <button
                    type="button"
                    className="ws-flappy-game__play-surface"
                    onClick={handleFlap}
                    disabled={
                        paused ||
                        game.status === 'paused' ||
                        game.status === 'gameover'
                    }
                    aria-label={t('Fazer o pássaro voar')}
                >
                    <svg
                        viewBox={`0 0 ${FLAPPY_CONFIG.width} ${FLAPPY_CONFIG.height}`}
                        preserveAspectRatio="xMidYMid meet"
                        aria-hidden="true"
                    >
                        {/* ----- CÉU ----- */}
                        <rect
                            width={FLAPPY_CONFIG.width}
                            height={FLAPPY_CONFIG.height}
                            className="ws-flappy-game__sky"
                        />

                        {/* ----- DETALHES DO CENÁRIO ----- */}
                        <circle
                            cx="285"
                            cy="100"
                            r="35"
                            className="ws-flappy-game__sun"
                        />

                        <g className="ws-flappy-game__clouds">
                            <ellipse cx="65" cy="110" rx="40" ry="12" />
                            <ellipse cx="155" cy="200" rx="50" ry="13" />
                            <ellipse cx="275" cy="285" rx="38" ry="11" />
                        </g>

                        {/* ----- OBSTÁCULOS ----- */}
                        {game.pipes.map((pipe) => (
                            <FlappyPipe key={pipe.id} pipe={pipe} />
                        ))}

                        {/* ----- PÁSSARO ----- */}
                        <FlappyBird
                            y={game.birdY}
                            velocity={game.velocity}
                        />

                        {/* ----- CHÃO ----- */}
                        <rect
                            x="0"
                            y={FLAPPY_CONFIG.height - FLAPPY_CONFIG.groundHeight}
                            width={FLAPPY_CONFIG.width}
                            height={FLAPPY_CONFIG.groundHeight}
                            className="ws-flappy-game__ground"
                        />
                    </svg>
                </button>

                {/* === SOBREPOSIÇÃO DE ESTADO === */}
                {(paused || game.status !== 'playing') && (
                    <div className="ws-flappy-game__overlay">
                        <strong>
                            {paused
                                ? t('Jogo suspenso')
                                : game.status === 'gameover'
                                    ? t('Fim de jogo!')
                                    : game.status === 'paused'
                                        ? t('Jogo pausado')
                                        : t('Pronto para voar?')}
                        </strong>

                        {finished && !paused && (
                            <p>{game.score} {t('pontos')}</p>
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
            <p className="ws-flappy-game__hint">
                {t('Pressione Espaço ou toque no cenário para voar.')}
            </p>

                {recordError && (
                    <p className="ws-flappy-game__error" role="alert">
                        {t('Não foi possível salvar o recorde local.')}
                    </p>
                )}
            </div>

            {/* === CLASSIFICAÇÃO GLOBAL === */}
            {ranking && (
                <aside className="ws-flappy-game__ranking">
                    {ranking}
                </aside>
            )}
        </div>
    );
}
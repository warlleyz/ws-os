import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Pause,
    Play,
    RotateCcw,
    Trophy,
    Zap,
} from 'lucide-react';

import {
    FaJava,
} from 'react-icons/fa';

import {
    SiCplusplus,
    SiCss,
    SiDocker,
    SiGit,
    SiGithub,
    SiGo,
    SiHtml5,
    SiJavascript,
    SiKotlin,
    SiLinux,
    SiMongodb,
    SiMysql,
    SiNodedotjs,
    SiPostgresql,
    SiPython,
    SiReact,
    SiRust,
    SiSpring,
    SiTypescript,
} from 'react-icons/si';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { useGameRecord } from '../rankings/gameRecords';

import {
    SNAKE_CONFIG,
    advanceSnakeGame,
    changeSnakeDirection,
    createSnakeGame,
    getSnakeSpeed,
    pauseSnakeGame,
    startSnakeGame,
} from './snakeModel';

import './SnakeGame.css';

/* === CONFIGURAÇÃO DOS CONTROLES === */
const KEY_DIRECTIONS = {
    arrowup: 'up',
    arrowdown: 'down',
    arrowleft: 'left',
    arrowright: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
};

/* === CATÁLOGO VISUAL DAS TECNOLOGIAS === */
const TECHNOLOGIES = {
    javascript: {
        name: 'JavaScript',
        icon: SiJavascript,
        color: '#f7df1e',
    },
    typescript: {
        name: 'TypeScript',
        icon: SiTypescript,
        color: '#3178c6',
    },
    react: {
        name: 'React',
        icon: SiReact,
        color: '#61dafb',
    },
    nodejs: {
        name: 'Node.js',
        icon: SiNodedotjs,
        color: '#5fa04e',
    },
    html: {
        name: 'HTML5',
        icon: SiHtml5,
        color: '#e34f26',
    },
    css: {
        name: 'CSS3',
        icon: SiCss,
        color: '#1572b6',
    },
    python: {
        name: 'Python',
        icon: SiPython,
        color: '#3776ab',
    },
    java: {
        name: 'Java',
        icon: FaJava,
        color: '#e76f00',
    },
    spring: {
        name: 'Spring Boot',
        icon: SiSpring,
        color: '#6db33f',
    },
    mongodb: {
        name: 'MongoDB',
        icon: SiMongodb,
        color: '#47a248',
    },
    mysql: {
        name: 'MySQL',
        icon: SiMysql,
        color: '#4479a1',
    },
    postgresql: {
        name: 'PostgreSQL',
        icon: SiPostgresql,
        color: '#4169e1',
    },
    docker: {
        name: 'Docker',
        icon: SiDocker,
        color: '#2496ed',
    },
    git: {
        name: 'Git',
        icon: SiGit,
        color: '#f05032',
    },
    github: {
        name: 'GitHub',
        icon: SiGithub,
        color: '#a78bfa',
    },
    linux: {
        name: 'Linux',
        icon: SiLinux,
        color: '#e6b83c',
    },
    cplusplus: {
        name: 'C++',
        icon: SiCplusplus,
        color: '#659ad2',
    },
    go: {
        name: 'Go',
        icon: SiGo,
        color: '#00add8',
    },
    rust: {
        name: 'Rust',
        icon: SiRust,
        color: '#ce7855',
    },
    kotlin: {
        name: 'Kotlin',
        icon: SiKotlin,
        color: '#a97bff',
    },
};

/* === IDENTIFICAÇÃO DOS ESTADOS === */
function getSnakeStatus(status, suspended) {
    if (suspended) {
        return 'SUSPENSO';
    }

    const labels = {
        ready: 'PRONTO',
        playing: 'JOGANDO',
        paused: 'PAUSADO',
        gameover: 'FIM DE JOGO',
        won: 'VITÓRIA',
    };

    return labels[status] ?? '';
}

/* === POSICIONAMENTO DOS ELEMENTOS === */
function getPositionStyle(position) {
    return {
        '--snake-x': position.x,
        '--snake-y': position.y,
    };
}

/* === SEGMENTOS DA COBRA === */
const SnakeSegment = memo(function SnakeSegment({
    segment,
    index,
    direction,
    previous,
    next,
}) {
    const isHead = index === 0;
    const isTail = next === null;

    /* ----- CONEXÕES ENTRE SEGMENTOS ----- */
    const connectsUp =
        (previous && previous.x === segment.x && previous.y === segment.y - 1) ||
        (next && next.x === segment.x && next.y === segment.y - 1);

    const connectsDown =
        (previous && previous.x === segment.x && previous.y === segment.y + 1) ||
        (next && next.x === segment.x && next.y === segment.y + 1);

    const connectsLeft =
        (previous && previous.x === segment.x - 1 && previous.y === segment.y) ||
        (next && next.x === segment.x - 1 && next.y === segment.y);

    const connectsRight =
        (previous && previous.x === segment.x + 1 && previous.y === segment.y) ||
        (next && next.x === segment.x + 1 && next.y === segment.y);

    return (
        <div
            className={[
                'ws-snake__segment',
                isHead ? 'ws-snake__segment--head' : '',
                isTail ? 'ws-snake__segment--tail' : '',
            ].filter(Boolean).join(' ')}
            data-direction={isHead ? direction : undefined}
            data-up={connectsUp ? 'true' : undefined}
            data-down={connectsDown ? 'true' : undefined}
            data-left={connectsLeft ? 'true' : undefined}
            data-right={connectsRight ? 'true' : undefined}
            style={getPositionStyle(segment)}
            aria-hidden="true"
        >
            {isHead && (
                <span className="ws-snake__eyes">
                    <span />
                    <span />
                </span>
            )}
        </div>
    );
});

/* === TECNOLOGIA COLETÁVEL === */
const SnakeFood = memo(function SnakeFood({ food }) {
    const technology = TECHNOLOGIES[food.id];

    if (!technology) {
        return null;
    }

    const Icon = technology.icon;

    return (
        <div
            className="ws-snake__food"
            style={{
                ...getPositionStyle(food),
                '--snake-food-color': technology.color,
            }}
            title={technology.name}
            aria-hidden="true"
        >
            <span className="ws-snake__food-icon">
                <Icon />
            </span>
        </div>
    );
});

/* === TABULEIRO DO SNAKE === */
const SnakeBoard = memo(function SnakeBoard({ game }) {
    return (
        <div
            className="ws-snake__board"
            role="img"
            aria-label={`${t('Tabuleiro do jogo Snake')}. ${game.score} ${t('pontos')}.`}
            style={{
                '--snake-columns': SNAKE_CONFIG.columns,
                '--snake-rows': SNAKE_CONFIG.rows,
            }}
        >
            {/* === CORPO DA COBRA === */}
            {game.snake.map((segment, index) => (
                <SnakeSegment
                    key={index}
                    segment={segment}
                    index={index}
                    direction={game.direction}
                    previous={index > 0 ? game.snake[index - 1] : null}
                    next={index < game.snake.length - 1 ? game.snake[index + 1] : null}
                />
            ))}

            {/* === TECNOLOGIAS DISPONÍVEIS === */}
            {game.foods.map((food) => (
                <SnakeFood
                    key={`${food.x}:${food.y}`}
                    food={food}
                />
            ))}
        </div>
    );
});

/* === CONTROLES DIRECIONAIS === */
const DIRECTION_CONTROLS = [
    { direction: 'up', Icon: ArrowUp, label: 'Cima' },
    { direction: 'left', Icon: ArrowLeft, label: 'Esquerda' },
    { direction: 'down', Icon: ArrowDown, label: 'Baixo' },
    { direction: 'right', Icon: ArrowRight, label: 'Direita' },
];

const SnakeDirectionControls = memo(function SnakeDirectionControls({
    onDirection,
    disabled,
}) {
    return (
        <div className="ws-snake__direction-controls">
            {DIRECTION_CONTROLS.map(({ direction, Icon, label }) => (
                <button
                    key={direction}
                    type="button"
                    className={`ws-snake__direction ws-snake__direction--${direction}`}
                    onClick={() => onDirection(direction)}
                    disabled={disabled}
                    aria-label={t(label)}
                >
                    <Icon size={19} aria-hidden="true" />
                </button>
            ))}
        </div>
    );
});

/* === CONTROLES DO CABEÇALHO === */
const SnakeHeaderActions = memo(function SnakeHeaderActions({
    status,
    paused,
    onStart,
    onPause,
    onRestart,
}) {
    const playing = status === 'playing';
    const finished = status === 'gameover' || status === 'won';

    return (
        <div className="ws-snake__header-actions">
            {playing ? (
                <button
                    type="button"
                    onClick={onPause}
                    disabled={paused}
                >
                    <Pause size={16} aria-hidden="true" />
                    {t('Pausar')}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onStart}
                    disabled={paused || finished}
                >
                    <Play size={16} aria-hidden="true" />
                    {status === 'paused' ? t('Continuar') : t('Iniciar')}
                </button>
            )}

            <button
                type="button"
                onClick={onRestart}
                disabled={paused}
                aria-label={t('Reiniciar')}
                title={t('Reiniciar')}
            >
                <RotateCcw size={16} aria-hidden="true" />
            </button>
        </div>
    );
});

/* === APLICATIVO SNAKE === */
export default function SnakeGame({
    paused = false,
    ranking = null,
    onHeaderChange,
}) {
    useLocale();

    /* ----- ESTADO DA PARTIDA ----- */
    const [game, setGame] = useState(createSnakeGame);
    const gameRef = useRef(game);
    const boardRef = useRef(null);
    const directionLockedRef = useRef(false);
    const timerRef = useRef(null);
    const onHeaderChangeRef = useRef(onHeaderChange);

    /* ----- RECORDE LOCAL ----- */
    const finished = game.status === 'gameover' || game.status === 'won';

    const { record, error: recordError } = useGameRecord(
        'snake',
        game.score,
        finished,
    );

    /* === ATUALIZAÇÃO DA REFERÊNCIA DO CABEÇALHO === */
    useEffect(() => {
        onHeaderChangeRef.current = onHeaderChange;
    }, [onHeaderChange]);

    /* === ATUALIZAÇÃO DO ESTADO === */
    const updateGame = useCallback((updater) => {
        const current = gameRef.current;
        const next = updater(current);

        if (next !== current) {
            gameRef.current = next;
            setGame(next);
        }
    }, []);

    /* === ALTERAÇÃO DA DIREÇÃO === */
    const handleDirection = useCallback(
        (direction) => {
            const current = gameRef.current;

            if (
                paused ||
                directionLockedRef.current ||
                current.status !== 'playing'
            ) {
                return;
            }

            const next = changeSnakeDirection(current, direction);

            if (next === current) {
                return;
            }

            directionLockedRef.current = true;
            updateGame(() => next);
        },
        [paused, updateGame],
    );

    /* === INICIAR OU CONTINUAR === */
    const handleStart = useCallback(() => {
        if (paused) {
            return;
        }

        updateGame(startSnakeGame);
        boardRef.current?.focus();
    }, [paused, updateGame]);

    /* === PAUSAR === */
    const handlePause = useCallback(() => {
        updateGame(pauseSnakeGame);
    }, [updateGame]);

    /* === REINICIAR === */
    const handleRestart = useCallback(() => {
        if (paused) {
            return;
        }

        const next = createSnakeGame();

        directionLockedRef.current = false;
        gameRef.current = next;

        setGame(next);
        boardRef.current?.focus();
    }, [paused]);

    /* === AÇÕES DO CABEÇALHO === */
    const headerActions = useMemo(
        () => (
            <SnakeHeaderActions
                status={game.status}
                paused={paused}
                onStart={handleStart}
                onPause={handlePause}
                onRestart={handleRestart}
            />
        ),
        [
            game.status,
            paused,
            handleStart,
            handlePause,
            handleRestart,
        ],
    );

    /* === INTEGRAÇÃO COM O CABEÇALHO COMPARTILHADO === */
    useEffect(() => {
        onHeaderChangeRef.current?.({
            status: getSnakeStatus(game.status, paused),
            actions: headerActions,
        });
    }, [game.status, paused, headerActions]);

    /* === CICLO DE MOVIMENTAÇÃO === */
    useEffect(() => {
        if (paused || game.status !== 'playing') {
            return undefined;
        }

        let active = true;
        let lastTick = performance.now();
        let frameId = null;

        function tick(now) {
            if (!active) {
                return;
            }

            const current = gameRef.current;

            if (current.status !== 'playing') {
                return;
            }

            const speed = getSnakeSpeed(current.score);

            if (now - lastTick >= speed) {
                lastTick = now;

                updateGame((state) => advanceSnakeGame(state));
                directionLockedRef.current = false;
            }

            frameId = window.requestAnimationFrame(tick);
        }

        frameId = window.requestAnimationFrame(tick);
        timerRef.current = frameId;

        return () => {
            active = false;

            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }

            timerRef.current = null;
        };
    }, [game.status, paused, updateGame]);

    /* === CONTROLES DO TECLADO === */
    useEffect(() => {
        function handleKeyDown(event) {
            const target = event.target;

            if (
                paused ||
                (
                    target instanceof HTMLElement &&
                    (
                        target.isContentEditable ||
                        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
                    )
                )
            ) {
                return;
            }

            const key = event.key.toLowerCase();
            const direction = KEY_DIRECTIONS[key];

            if (direction) {
                if (gameRef.current.status === 'playing') {
                    event.preventDefault();
                    handleDirection(direction);
                }

                return;
            }

            if (event.code === 'Space' || key === 'p') {
                if (gameRef.current.status === 'playing') {
                    event.preventDefault();
                    handlePause();
                } else if (
                    gameRef.current.status === 'ready' ||
                    gameRef.current.status === 'paused'
                ) {
                    event.preventDefault();
                    handleStart();
                }

                return;
            }

            if (key === 'r') {
                event.preventDefault();
                handleRestart();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        paused,
        handleDirection,
        handlePause,
        handleStart,
        handleRestart,
    ]);

    /* === INFORMAÇÕES DA PARTIDA === */
    const speed = getSnakeSpeed(game.score);

    return (
        <div className="ws-snake">
            {/* === ESTATÍSTICAS === */}
            <div className="ws-snake__stats">
                <div className="ws-snake__stat">
                    <span>{t('PONTUAÇÃO')}</span>
                    <strong>{game.score}</strong>
                </div>

                <div className="ws-snake__stat">
                    <span>{t('RECORDE')}</span>
                    <strong>
                        <Trophy size={17} aria-hidden="true" />
                        {record ?? 0}
                    </strong>
                </div>

                <div className="ws-snake__stat">
                    <span>{t('VELOCIDADE')}</span>
                    <strong>
                        <Zap size={17} aria-hidden="true" />
                        {Math.round(1000 / speed)}
                    </strong>
                </div>
            </div>

            {/* === ÁREA PRINCIPAL === */}
            <div className="ws-snake__layout">
                {/* ----- TABULEIRO ----- */}
                <div
                    ref={boardRef}
                    className="ws-snake__board-container"
                    tabIndex={0}
                    aria-label={t('Área de jogo do Snake')}
                >
                    <SnakeBoard game={game} />

                    {/* ----- ESTADOS DA PARTIDA ----- */}
                    {(game.status !== 'playing' || paused) && (
                        <div className="ws-snake__overlay">
                            <strong>
                                {paused
                                    ? t('Jogo suspenso')
                                    : game.status === 'ready'
                                        ? t('Pronto para jogar?')
                                        : game.status === 'paused'
                                            ? t('Jogo pausado')
                                            : game.status === 'won'
                                                ? t('Você venceu!')
                                                : t('Fim de jogo')}
                            </strong>

                            <span>
                                {paused
                                    ? t('Retorne ao aplicativo para continuar.')
                                    : `${game.score} ${t('pontos')}`}
                            </span>

                            {!paused && (
                                <button
                                    type="button"
                                    onClick={finished ? handleRestart : handleStart}
                                >
                                    {finished
                                        ? t('Jogar novamente')
                                        : game.status === 'paused'
                                            ? t('Continuar')
                                            : t('Iniciar partida')}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ----- RANKING LATERAL ----- */}
                <aside className="ws-snake__sidebar">
                    {ranking ?? (
                        <section className="ws-snake__ranking-unavailable">
                            <Trophy size={24} aria-hidden="true" />
                            <h3>{t('Ranking público')}</h3>
                            <p>{t('A classificação pública não está disponível.')}</p>
                        </section>
                    )}
                </aside>
            </div>

            {/* === CONTROLES MÓVEIS === */}
            <div className="ws-snake__mobile-controls">
                <SnakeDirectionControls
                    onDirection={handleDirection}
                    disabled={paused || game.status !== 'playing'}
                />
            </div>

            {/* === ERROS DE PERSISTÊNCIA === */}
            {recordError && (
                <p className="ws-snake__error" role="alert">
                    {t('Não foi possível salvar o recorde local.')}
                </p>
            )}
        </div>
    );
}
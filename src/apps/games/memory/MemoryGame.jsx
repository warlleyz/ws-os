import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { Pause, Play, RotateCcw, Trophy } from 'lucide-react';
import { FaJava } from 'react-icons/fa';
import { SiCplusplus, SiCss, SiHtml5, SiJavascript, SiPython, SiReact, SiTypescript } from 'react-icons/si';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { useGameRecord } from '../rankings/gameRecords';

import {
    MEMORY_CONFIG,
    createMemoryGame,
    getMemoryPairsFound,
    hideMemoryMismatch,
    isMemoryCardVisible,
    pauseMemoryGame,
    revealMemoryCard,
    startMemoryGame,
} from './memoryModel';

import './MemoryGame.css';

/* === IDENTIDADE DAS TECNOLOGIAS === */
const TECHNOLOGIES = {
    javascript: { name: 'JavaScript', Icon: SiJavascript, color: '#f7df1e' },
    typescript: { name: 'TypeScript', Icon: SiTypescript, color: '#3178c6' },
    python: { name: 'Python', Icon: SiPython, color: '#3776ab' },
    java: { name: 'Java', Icon: FaJava, color: '#e76f00' },
    react: { name: 'React', Icon: SiReact, color: '#61dafb' },
    html: { name: 'HTML5', Icon: SiHtml5, color: '#e34f26' },
    css: { name: 'CSS3', Icon: SiCss, color: '#1572b6' },
    cplusplus: { name: 'C++', Icon: SiCplusplus, color: '#659ad2' },
};

/* === CARTA DO JOGO === */
const MemoryCard = memo(function MemoryCard({
    card,
    visible,
    matched,
    disabled,
    onReveal,
}) {
    const technology = TECHNOLOGIES[card.technology];
    const Icon = technology?.Icon;

    return (
        <button
            type="button"
            className={[
                'ws-memory-game__card',
                visible ? 'is-visible' : '',
                matched ? 'is-matched' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onReveal(card.id)}
            disabled={disabled || visible}
            aria-label={
                visible
                    ? technology?.name ?? card.technology
                    : t('Carta oculta')
            }
            aria-pressed={visible}
        >
            <span className="ws-memory-game__card-back" aria-hidden="true">
                <span className="ws-memory-game__card-symbol">?</span>
            </span>

            <span className="ws-memory-game__card-front" aria-hidden="true">
                {Icon && (
                    <Icon
                        className="ws-memory-game__technology-icon"
                        style={{ color: technology.color }}
                    />
                )}
                <span>{technology?.name}</span>
            </span>
        </button>
    );
});

/* === AÇÕES DO CABEÇALHO === */
const MemoryHeaderActions = memo(function MemoryHeaderActions({
    status,
    disabled,
    onStart,
    onPause,
    onRestart,
}) {
    return (
        <div className="ws-memory-game__actions">
            {status === 'playing' ? (
                <button
                    type="button"
                    onClick={onPause}
                    disabled={disabled}
                >
                    <Pause size={16} aria-hidden="true" />
                    {t('Pausar')}
                </button>
            ) : status !== 'won' ? (
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

/* === APLICATIVO MEMÓRIA === */
export default function MemoryGame({
    paused = false,
    onHeaderChange,
}) {
    useLocale();

    /* ----- ESTADO DA PARTIDA ----- */
    const [game, setGame] = useState(createMemoryGame);
    const onHeaderChangeRef = useRef(onHeaderChange);
    const mismatchTimerRef = useRef(null);

    const finished = game.status === 'won';
    const pairsFound = getMemoryPairsFound(game);

    /* ----- RECORDE LOCAL ----- */
    const { record, error: recordError } = useGameRecord(
        'memory',
        game.moves,
        finished,
    );

    /* === CONTROLE DO TEMPORIZADOR === */
    const clearMismatchTimer = useCallback(() => {
        if (mismatchTimerRef.current !== null) {
            window.clearTimeout(mismatchTimerRef.current);
            mismatchTimerRef.current = null;
        }
    }, []);

    /* === AÇÕES DA PARTIDA === */
    const handleStart = useCallback(() => {
        if (!paused) {
            setGame(startMemoryGame);
        }
    }, [paused]);

    const handlePause = useCallback(() => {
        setGame(pauseMemoryGame);
    }, []);

    const handleRestart = useCallback(() => {
        if (paused) {
            return;
        }

        clearMismatchTimer();
        setGame(createMemoryGame());
    }, [paused, clearMismatchTimer]);

    const handleReveal = useCallback((cardId) => {
        if (paused) {
            return;
        }

        setGame((current) => revealMemoryCard(current, cardId));
    }, [paused]);

    /* === OCULTAR PARES INCORRETOS === */
    useEffect(() => {
        clearMismatchTimer();

        if (
            paused ||
            game.status !== 'playing' ||
            game.revealed.length !== 2
        ) {
            return undefined;
        }

        mismatchTimerRef.current = window.setTimeout(() => {
            setGame(hideMemoryMismatch);
            mismatchTimerRef.current = null;
        }, MEMORY_CONFIG.mismatchDelay);

        return clearMismatchTimer;
    }, [
        paused,
        game.status,
        game.revealed,
        clearMismatchTimer,
    ]);

    /* === CABEÇALHO COMPARTILHADO === */
    const headerActions = useMemo(() => (
        <MemoryHeaderActions
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

    /* === INTERFACE === */
    return (
        <div className="ws-memory-game">
            {/* === INDICADORES === */}
            <div className="ws-memory-game__stats">
                <div className="ws-memory-game__stat">
                    <span>{t('PARES ENCONTRADOS')}</span>
                    <strong>{pairsFound} / {MEMORY_CONFIG.pairs}</strong>
                </div>

                <div className="ws-memory-game__stat">
                    <span>{t('TENTATIVAS')}</span>
                    <strong>{game.moves}</strong>
                </div>

                <div className="ws-memory-game__stat">
                    <span>{t('MELHOR RESULTADO')}</span>
                    <strong>
                        <Trophy size={17} aria-hidden="true" />
                        {record ?? '—'}
                    </strong>
                </div>
            </div>

            {/* === TABULEIRO === */}
            <div className="ws-memory-game__board-wrap">
                <div
                    className="ws-memory-game__board"
                    aria-label={t('Tabuleiro do jogo Memória')}
                >
                    {game.cards.map((card) => {
                        const visible = isMemoryCardVisible(game, card.id);
                        const matched = game.matched.includes(card.id);

                        return (
                            <MemoryCard
                                key={card.id}
                                card={card}
                                visible={visible}
                                matched={matched}
                                disabled={
                                    paused ||
                                    game.status !== 'playing' ||
                                    game.revealed.length === 2
                                }
                                onReveal={handleReveal}
                            />
                        );
                    })}
                </div>

                {/* === ESTADOS DA PARTIDA === */}
                {(paused || game.status !== 'playing') && (
                    <div className="ws-memory-game__overlay">
                        <strong>
                            {paused
                                ? t('Jogo suspenso')
                                : game.status === 'won'
                                    ? t('Você venceu!')
                                    : game.status === 'paused'
                                        ? t('Jogo pausado')
                                        : t('Pronto para jogar?')}
                        </strong>

                        {finished && !paused && (
                            <p>
                                {game.moves} {t('tentativas')}
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

            {/* === INSTRUÇÃO DE JOGO === */}
            <p className="ws-memory-game__hint">
                {t('Encontre os pares de tecnologias com o menor número de tentativas.')}
            </p>

            {recordError && (
                <p className="ws-memory-game__error" role="alert">
                    {t('Não foi possível salvar o recorde local.')}
                </p>
            )}
        </div>
    );
}
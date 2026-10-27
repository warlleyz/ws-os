import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Bomb,
    Flag,
    Pause,
    Play,
    RotateCcw,
    Trophy,
} from 'lucide-react';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { useGameRecord } from '../rankings/gameRecords';

import {
    MINES_CONFIG,
    advanceMinesTime,
    createMinesGame,
    getMinesProgress,
    getMinesRemaining,
    pauseMinesGame,
    revealMineCell,
    startMinesGame,
    toggleMineFlag,
} from './minesModel';

import './MinesGame.css';

/* === FORMATAÇÃO DO TEMPO === */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

/* === CÉLULA DO TABULEIRO === */
const MinesCell = memo(function MinesCell({
    cell,
    disabled,
    flagMode,
    showMine,
    onReveal,
    onFlag,
}) {
    const handleClick = () => {
        if (disabled || cell.revealed) {
            return;
        }

        if (flagMode) {
            onFlag(cell.id);
        } else {
            onReveal(cell.id);
        }
    };

    const handleContextMenu = (event) => {
        event.preventDefault();

        if (!disabled && !cell.revealed) {
            onFlag(cell.id);
        }
    };

    const number = cell.revealed && !cell.mine
        ? cell.adjacent
        : 0;

    const label = cell.flagged
        ? 'Bandeira'
        : showMine
            ? 'Mina'
            : cell.revealed
                ? number > 0
                    ? `${number} minas próximas`
                    : 'Célula vazia'
                : 'Célula oculta';

    return (
        <button
            type="button"
            className={[
                'ws-mines-game__cell',
                cell.revealed ? 'is-revealed' : '',
                cell.flagged ? 'is-flagged' : '',
                showMine ? 'is-mine' : '',
            ].filter(Boolean).join(' ')}
            data-count={number || undefined}
            aria-label={`${t(label)}, linha ${cell.row + 1}, coluna ${cell.column + 1}`}
            disabled={disabled || cell.revealed}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
        >
            {showMine ? (
                <Bomb size={19} aria-hidden="true" />
            ) : cell.flagged ? (
                <Flag size={18} aria-hidden="true" />
            ) : number > 0 ? (
                number
            ) : null}
        </button>
    );
});

/* === AÇÕES DO CABEÇALHO === */
const MinesHeaderActions = memo(function MinesHeaderActions({
    status,
    disabled,
    onStart,
    onPause,
    onRestart,
}) {
    return (
        <div className="ws-mines-game__actions">
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
});

/* === APLICATIVO CAMPO MINADO === */
export default function MinesGame({
    paused = false,
    onHeaderChange,
}) {
    useLocale();

    /* ----- ESTADO DA PARTIDA ----- */
    const [game, setGame] = useState(createMinesGame);
    const [flagMode, setFlagMode] = useState(false);

    const finished = game.status === 'won';
    const progress = getMinesProgress(game);
    const remaining = getMinesRemaining(game);

    /* ----- RECORDE LOCAL ----- */
    const { record, error: recordError } = useGameRecord(
        'mines',
        Math.max(1, game.elapsedSeconds),
        finished,
    );

    /* === AÇÕES DA PARTIDA === */
    const handleStart = useCallback(() => {
        if (!paused) {
            setGame(startMinesGame);
        }
    }, [paused]);

    const handlePause = useCallback(() => {
        setGame(pauseMinesGame);
    }, []);

    const handleRestart = useCallback(() => {
        if (paused) {
            return;
        }

        setGame(createMinesGame());
        setFlagMode(false);
    }, [paused]);

    const handleReveal = useCallback((cellId) => {
        if (paused) {
            return;
        }

        setGame((current) => revealMineCell(current, cellId));
    }, [paused]);

    const handleFlag = useCallback((cellId) => {
        if (paused) {
            return;
        }

        setGame((current) => toggleMineFlag(current, cellId));
    }, [paused]);

    /* === CRONÔMETRO === */
    useEffect(() => {
        if (
            paused ||
            game.status !== 'playing' ||
            !game.initialized
        ) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setGame(advanceMinesTime);
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [paused, game.status, game.initialized]);

    /* === CABEÇALHO COMPARTILHADO === */
    const headerActions = useMemo(() => (
        <MinesHeaderActions
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
        const status = paused
            ? 'SUSPENSO'
            : {
                ready: 'PRONTO',
                playing: 'JOGANDO',
                paused: 'PAUSADO',
                won: 'VITÓRIA',
                gameover: 'FIM DE JOGO',
            }[game.status];

        onHeaderChange?.({
            status,
            actions: headerActions,
        });
    }, [game.status, paused, headerActions, onHeaderChange]);

    /* === ORGANIZAÇÃO DAS CÉLULAS === */
    const cells = useMemo(
        () => Object.values(game.cells),
        [game.cells],
    );

    const disabled =
        paused ||
        game.status !== 'playing';

    const showAllMines =
        game.status === 'gameover';

    /* === INTERFACE === */
    return (
        <div className="ws-mines-game">
            {/* === INDICADORES === */}
            <div className="ws-mines-game__stats">
                <div className="ws-mines-game__stat">
                    <span>{t('MINAS RESTANTES')}</span>
                    <strong>
                        <Bomb size={17} aria-hidden="true" />
                        {remaining}
                    </strong>
                </div>

                <div className="ws-mines-game__stat">
                    <span>{t('TEMPO')}</span>
                    <strong>{formatTime(game.elapsedSeconds)}</strong>
                </div>

                <div className="ws-mines-game__stat">
                    <span>{t('RECORDE')}</span>
                    <strong>
                        <Trophy size={17} aria-hidden="true" />
                        {record === null ? '—' : formatTime(record)}
                    </strong>
                </div>
            </div>

            {/* === FERRAMENTAS === */}
            <div className="ws-mines-game__toolbar">
                <div
                    className="ws-mines-game__mode"
                    role="group"
                    aria-label={t('Modo de interação')}
                >
                    <button
                        type="button"
                        className={!flagMode ? 'is-active' : ''}
                        aria-pressed={!flagMode}
                        onClick={() => setFlagMode(false)}
                    >
                        {t('Revelar')}
                    </button>

                    <button
                        type="button"
                        className={flagMode ? 'is-active' : ''}
                        aria-pressed={flagMode}
                        onClick={() => setFlagMode(true)}
                    >
                        <Flag size={15} aria-hidden="true" />
                        {t('Bandeira')}
                    </button>
                </div>

                <span className="ws-mines-game__progress">
                    {progress}% {t('concluído')}
                </span>
            </div>

            {/* === TABULEIRO === */}
            <div className="ws-mines-game__board-wrap">
                <div
                    className="ws-mines-game__board"
                    style={{
                        '--mines-columns': MINES_CONFIG.columns,
                    }}
                    aria-label={t('Tabuleiro do Campo Minado')}
                >
                    {cells.map((cell) => (
                        <MinesCell
                            key={cell.id}
                            cell={cell}
                            disabled={disabled}
                            flagMode={flagMode}
                            showMine={showAllMines && cell.mine}
                            onReveal={handleReveal}
                            onFlag={handleFlag}
                        />
                    ))}
                </div>

                {/* === ESTADOS DA PARTIDA === */}
                {(paused || game.status !== 'playing') && (
                    <div className="ws-mines-game__overlay">
                        <strong>
                            {paused
                                ? t('Jogo suspenso')
                                : game.status === 'won'
                                    ? t('Você venceu!')
                                    : game.status === 'gameover'
                                        ? t('Você encontrou uma mina!')
                                        : game.status === 'paused'
                                            ? t('Jogo pausado')
                                            : t('Pronto para jogar?')}
                        </strong>

                        {finished && !paused && (
                            <p>
                                {t('Tempo')}: {formatTime(game.elapsedSeconds)}
                            </p>
                        )}

                        {!paused && (
                            <button
                                type="button"
                                onClick={
                                    finished || game.status === 'gameover'
                                        ? handleRestart
                                        : handleStart
                                }
                            >
                                {t(
                                    finished || game.status === 'gameover'
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
            <p className="ws-mines-game__hint">
                {t('Clique para revelar. Use o botão direito ou o modo bandeira para marcar minas.')}
            </p>

            {recordError && (
                <p className="ws-mines-game__error" role="alert">
                    {t('Não foi possível salvar o recorde local.')}
                </p>
            )}
        </div>
    );
}
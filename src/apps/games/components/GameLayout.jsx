import { useCallback, useState } from 'react';

import GameHeader from './GameHeader';
import GameRankings from '../rankings/GameRankings';
import { supportsPublicRanking } from '../rankings/rankingConfig';

/* === ESTRUTURA COMPARTILHADA DOS JOGOS === */
export default function GameLayout({
    game,
    Component,
    paused = false,
    onBack,
}) {
    /* === ESTADO DO CABEÇALHO === */
    const [gameHeader, setGameHeader] = useState({
        status: '',
        actions: null,
    });

    const handleHeaderChange = useCallback((next) => {
        setGameHeader((current) => {
            if (
                current.status === next.status &&
                current.actions === next.actions
            ) {
                return current;
            }

            return next;
        });
    }, []);

    /* ----- DISPONIBILIDADE DO JOGO ----- */
    if (!game || !Component) {
        return null;
    }

    /* ----- DISPONIBILIDADE DO RANKING ----- */
    const hasPublicRanking = supportsPublicRanking(game.id);

    /* ----- RANKING INTEGRADO AOS JOGOS ----- */
    const hasIntegratedRanking =
        game.id === 'snake' || game.id === 'flappy';

    const ranking =
        hasIntegratedRanking && hasPublicRanking ? (
            <GameRankings
                key={game.id}
                game={game.id}
                paused={paused}
            />
        ) : null;

    return (
        <div className="ws-games__play-view">
            {/* === CABEÇALHO COMPARTILHADO === */}
            <GameHeader
                title={game.name}
                category={game.category}
                status={gameHeader.status}
                actions={gameHeader.actions}
                onBack={onBack}
            />

            {/* === CONTEÚDO ROLÁVEL === */}
            <section className="ws-games__play-content">
                <Component
                    paused={paused}
                    ranking={ranking}
                    onHeaderChange={handleHeaderChange}
                />

                {/* === RANKING DOS DEMAIS JOGOS === */}
                {!hasIntegratedRanking && hasPublicRanking && (
                    <GameRankings
                        key={game.id}
                        game={game.id}
                        paused={paused}
                    />
                )}
            </section>
        </div>
    );
}
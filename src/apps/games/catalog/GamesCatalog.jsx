import { Gamepad2, Keyboard, Trophy } from 'lucide-react';

import { translate as t } from '../../../shared/i18n/i18n';

import { GAMES_CATALOG } from './gameDefinitions';
import GameCard from '../components/GameCard';

import './GamesCatalog.css';

/* === CABEÇALHO DO CATÁLOGO === */
function GamesHeader() {
    return (
        <header className="ws-games__hero">
            <div className="ws-games__hero-text">
                <span className="ws-games__eyebrow">
                    {t('WS OS / ENTERTAINMENT')}
                </span>

                <h2>{t('Jogos')}</h2>

                <p>
                    {t(
                        'Clássicos para jogar diretamente no sistema. Escolha um título, desafie seus recordes e explore a biblioteca.',
                    )}
                </p>
            </div>

            <div className="ws-games__hero-icon" aria-hidden="true">
                <Gamepad2 size={38} strokeWidth={1.45} />
            </div>
        </header>
    );
}

/* === INFORMAÇÕES DA BIBLIOTECA === */
function GamesOverview() {
    return (
        <div className="ws-games__overview">
            <div className="ws-games__overview-item">
                <Gamepad2 size={16} aria-hidden="true" />

                <strong>
                    {String(GAMES_CATALOG.length).padStart(2, '0')}
                </strong>

                <span>{t('JOGOS DISPONÍVEIS')}</span>
            </div>

            <div className="ws-games__overview-item">
                <Trophy size={16} aria-hidden="true" />
                <span>{t('RECORDES LOCAIS')}</span>
            </div>

            <div className="ws-games__overview-item">
                <Keyboard size={16} aria-hidden="true" />
                <span>{t('TECLADO E TOQUE')}</span>
            </div>
        </div>
    );
}

/* === CATÁLOGO DE JOGOS === */
export default function GamesCatalog({
    availableGames = [],
    onSelect,
}) {
    const availableIds = new Set(availableGames);

    return (
        <div className="ws-games__catalog">
            {/* === APRESENTAÇÃO === */}
            <GamesHeader />

            <GamesOverview />

            {/* === IDENTIFICAÇÃO DA BIBLIOTECA === */}
            <div className="ws-games__section-heading">
                <div>
                    <span className="ws-games__section-eyebrow">
                        {t('BIBLIOTECA / 01')}
                    </span>

                    <h3>{t('Explorar jogos')}</h3>
                </div>

                <span className="ws-games__section-count">
                    {String(GAMES_CATALOG.length).padStart(2, '0')} {t('TÍTULOS')}
                </span>
            </div>

            {/* === LISTAGEM DOS JOGOS === */}
            <div className="ws-games__grid">
                {GAMES_CATALOG.map((game, index) => (
                    <GameCard
                        key={game.id}
                        game={game}
                        index={index}
                        available={availableIds.has(game.id)}
                        onSelect={onSelect}
                    />
                ))}
            </div>

            {/* === INFORMAÇÕES ADICIONAIS === */}
            <footer className="ws-games__footer">
                {t(
                    'Recordes locais permanecem neste navegador. Rankings públicos estão disponíveis nos jogos compatíveis.',
                )}
            </footer>
        </div>
    );
}
import { ArrowUpRight, LockKeyhole } from 'lucide-react';

import { translate as t } from '../../../shared/i18n/i18n';
import GameArtwork from '../catalog/GameArtwork';

/* === CARD DO CATÁLOGO DE JOGOS === */
export default function GameCard({
    game,
    index,
    available = true,
    onSelect,
}) {
    return (
        <button
            type="button"
            className={`ws-games__card ws-games__card--${game.id}`}
            disabled={!available}
            onClick={() => onSelect(game.id)}
            aria-label={
                available
                    ? `${t('Jogar')} ${t(game.name)}`
                    : `${t(game.name)} — ${t('Em preparação')}`
            }
        >
            {/* === ILUSTRAÇÃO DO JOGO === */}
            <span className="ws-games__art">
                <GameArtwork game={game.id} />

                <span className="ws-games__art-number">
                    {String(index + 1).padStart(2, '0')}
                </span>

                {!available && (
                    <span className="ws-games__art-pending">
                        <LockKeyhole size={12} aria-hidden="true" />
                        {t('EM PREPARAÇÃO')}
                    </span>
                )}
            </span>

            {/* === INFORMAÇÕES DO JOGO === */}
            <span className="ws-games__card-body">
                <span className="ws-games__card-category">
                    {t(game.category)}
                </span>

                <strong className="ws-games__card-title">
                    {t(game.name)}
                </strong>

                <span className="ws-games__card-description">
                    {t(game.description)}
                </span>

                <span className="ws-games__card-footer">
                    <span>{t(game.controls)}</span>

                    {available ? (
                        <ArrowUpRight size={17} aria-hidden="true" />
                    ) : (
                        <LockKeyhole size={15} aria-hidden="true" />
                    )}
                </span>
            </span>
        </button>
    );
}
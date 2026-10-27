
import { ArrowLeft } from 'lucide-react';

import { translate as t } from '../../../shared/i18n/i18n';

/* === CABEÇALHO COMPARTILHADO DOS JOGOS === */
export default function GameHeader({
    title,
    category,
    status,
    actions = null,
    onBack,
    disabled = false,
    saving = false,
}) {
    return (
        <header className="ws-games__play-header">
            {/* === IDENTIFICAÇÃO E NAVEGAÇÃO === */}
            <div className="ws-games__header-navigation">
                <button
                    type="button"
                    className="ws-games__back"
                    onClick={onBack}
                    disabled={disabled || saving}
                    aria-label={t('Voltar ao catálogo')}
                    title={t('Voltar ao catálogo')}
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                </button>

                <div className="ws-games__header-info">
                    <strong className="ws-games__header-title">
                        {t(title)}
                    </strong>

                    <div className="ws-games__header-details">
                        {category && (
                            <span className="ws-games__header-category">
                                {t(category)}
                            </span>
                        )}

                        {status && (
                            <span className="ws-games__header-status">
                                <span
                                    className="ws-games__header-status-dot"
                                    aria-hidden="true"
                                />
                                {t(status)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* === AÇÕES DO JOGO === */}
            <div className="ws-games__header-controls">
                {actions}

                {saving && (
                    <span className="ws-games__header-saving" role="status">
                        {t('Salvando...')}
                    </span>
                )}
            </div>
        </header>
    );
}

import { translate as t } from '../../../shared/i18n/i18n';

/* === INDICADOR DE NAVEGAÇÃO === */
export default function MobileHomeIndicator({ onHome }) {
    return (
        <div className="ws-mobile__home-indicator-container">
            <button
                type="button"
                className="ws-mobile__home-indicator"
                aria-label={t('Voltar para a tela inicial')}
                title={t('Voltar para a tela inicial')}
                onClick={onHome}
            >
                <span aria-hidden="true" />
            </button>
        </div>
    );
}
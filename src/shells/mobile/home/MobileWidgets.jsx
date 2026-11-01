import { Settings2 } from 'lucide-react';

import { useMobilePreferences } from '../../../core/mobilePreferences';
import { getRegisteredWidgets } from '../../../core/widgetManager';

import useWeather from '../../../features/weather/useWeather';
import ClockWidget from '../../../features/widgets/clock/ClockWidget';
import CalendarWidget from '../../../features/widgets/calendar/CalendarWidget';
import WeatherWidget from '../../../features/widgets/weather/WeatherWidget';
import DevInsightsWidget from '../../../features/widgets/dev-insights/DevInsightsWidget';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === CATÁLOGO DE COMPONENTES === */
const COMPONENTS = {
    clock: ClockWidget,
    calendar: CalendarWidget,
    'dev-insights': DevInsightsWidget,
};

/* === WIDGET DE CLIMA MOBILE === */
function MobileWeatherWidget() {
    const weatherData = useWeather();

    return <WeatherWidget weatherData={weatherData} />;
}

/* === PÁGINA DE WIDGETS MOBILE === */
export default function MobileWidgets({ onOpenSettings }) {
    useLocale();

    /* ----- Preferências ----- */
    const { widgetIds } = useMobilePreferences();
    const registered = getRegisteredWidgets();

    const selected = registered.filter(
        (widget) => widgetIds.includes(widget.id),
    );

    /* === INTERFACE === */
    return (
        <section className="ws-mobile__widgets">
            {/* ----- Cabeçalho ----- */}
            <header className="ws-mobile__widgets-header">
                <h2>Widgets</h2>

                <button
                    type="button"
                    className="ws-mobile__widgets-settings"
                    aria-label={t('Configurações')}
                    title={t('Configurações')}
                    onClick={onOpenSettings}
                >
                    <Settings2 size={18} aria-hidden="true" />
                </button>
            </header>

            {/* ----- Widgets selecionados ----- */}
            {selected.length > 0 ? (
                <div className="ws-mobile__widgets-grid">
                    {selected.map((definition) => {
                        const Component = COMPONENTS[definition.id];

                        if (definition.id === 'weather') {
                            return (
                                <div
                                    key={definition.id}
                                    className="ws-mobile__widget-card"
                                    data-widget-id={definition.id}
                                >
                                    <MobileWeatherWidget />
                                </div>
                            );
                        }

                        if (!Component) return null;

                        return (
                            <div
                                key={definition.id}
                                className="ws-mobile__widget-card"
                                data-widget-id={definition.id}
                            >
                                <Component />
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ----- Estado vazio ----- */
                <div className="ws-mobile__widgets-empty">
                    <Settings2 size={28} aria-hidden="true" />

                    <strong>{t('Nenhum widget ativo')}</strong>

                    <p>
                        {t('Selecione os widgets que deseja exibir nas Configurações.')}
                    </p>

                    <button type="button" onClick={onOpenSettings}>
                        {t('Configurações')}
                    </button>
                </div>
            )}
        </section>
    );
}
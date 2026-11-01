import useWeather from '../../../features/weather/useWeather';
import { WeatherIcon } from '../../../features/weather/WeatherPanel';
import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === CLIMA DA BARRA SUPERIOR MOBILE === */
export default function MobileWeatherStatus() {
    useLocale();

    /* ----- Dados meteorológicos ----- */
    const {
        weather,
        weatherLoading,
        weatherError,
        getWeatherDescription,
    } = useWeather();

    const temperature = weather?.temperature_2m;
    const hasTemperature = Number.isFinite(temperature);

    const description = weather
        ? t(getWeatherDescription(weather.weather_code))
        : t(weatherLoading ? 'Consultando clima...' : 'Clima indisponível');

    /* === INTERFACE === */
    return (
        <span
            className="ws-mobile__weather"
            role="status"
            aria-label={
                hasTemperature
                    ? `${description}, ${Math.round(temperature)} °C`
                    : description
            }
            title={weatherError ? t(weatherError) : description}
        >
            {weather ? (
                <WeatherIcon code={weather.weather_code} size={18} />
            ) : (
                <WeatherIcon code={undefined} size={18} />
            )}

            {hasTemperature && (
                <span className="ws-mobile__weather-temperature">
                    {Math.round(temperature)}°
                </span>
            )}
        </span>
    );
}
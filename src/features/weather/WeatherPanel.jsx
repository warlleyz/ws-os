
import { translate as t, useLocale } from '../../shared/i18n/i18n';

export default function WeatherPanel({
  setWeatherOpen,
  weather,
  forecast = [],
  getWeatherDescription,
  weatherError,
  weatherLoading,
  requestWeather,
}) {
  const locale = useLocale();

  return (
    <section
      className="taskbar-weather-panel"
      role="region"
      aria-label={t('Painel do clima')}
    >
      <header className="taskbar-weather-panel__header">
        <strong>{t('Clima')}</strong>
        <button
          type="button"
          aria-label={t('Fechar clima')}
          onClick={() => setWeatherOpen(false)}
        >
          ×
        </button>
      </header>

      <div className="taskbar-weather-panel__content">
        {weather && (
          <>
            <strong>{Math.round(weather.temperature_2m)} °C</strong>
            <p>{t(getWeatherDescription(weather.weather_code))}</p>
            <p>
              {t('Sensação:')} {Math.round(weather.apparent_temperature)} °C
            </p>
            <p>
              {t('Umidade:')} {weather.relative_humidity_2m}%
            </p>
            <p>
              {t('Vento:')} {Math.round(weather.wind_speed_10m)} km/h
            </p>
          </>
        )}

        {forecast.length > 0 && (
          <div className="taskbar-weather-panel__forecast">
            <strong>{t('Previsão dos próximos dias')}</strong>

            <div className="taskbar-weather-panel__days">
              {forecast.map((day) => {
                const [year, month, date] = day.date.split('-').map(Number);
                const label = new Intl.DateTimeFormat(locale, {
                  weekday: 'short',
                  day: '2-digit',
                }).format(new Date(year, month - 1, date));

                return (
                  <div className="taskbar-weather-panel__day" key={day.date}>
                    <span>{label}</span>
                    <span title={t(getWeatherDescription(day.weatherCode))}>
                      {t(getWeatherDescription(day.weatherCode))}
                    </span>
                    <strong>
                      {Math.round(day.max)}° / {Math.round(day.min)}°
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {weatherError && <p role="alert">{t(weatherError)}</p>}

        <button
          type="button"
          disabled={weatherLoading}
          onClick={requestWeather}
        >
          {weatherLoading
            ? t('Consultando...')
            : weather
              ? t('Atualizar clima')
              : t('Consultar clima')}
        </button>
      </div>
    </section>
  );
}

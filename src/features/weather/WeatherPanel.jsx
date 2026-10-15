import { translate as t, useLocale } from '../../shared/i18n/i18n';
export default function WeatherPanel({
  setWeatherOpen,
  weather,
  getWeatherDescription,
  weatherError,
  weatherLoading,
  requestWeather,
}) {
  useLocale();
  return (
    <section className="taskbar-weather-panel" role="region" aria-label={t('Painel do clima')}>
      <header className="taskbar-weather-panel__header">
        <strong>{t('Clima')}</strong>
        <button type="button" aria-label={t('Fechar clima')} onClick={() => setWeatherOpen(false)}>
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
        {weatherError && <p role="alert">{t(weatherError)}</p>}
        <button type="button" disabled={weatherLoading} onClick={requestWeather}>
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

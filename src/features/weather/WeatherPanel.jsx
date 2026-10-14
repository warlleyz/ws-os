export default function WeatherPanel({
  setWeatherOpen,
  weather,
  getWeatherDescription,
  weatherError,
  weatherLoading,
  requestWeather,
}) {
  return (
    <section className="taskbar-weather-panel" role="region" aria-label="Painel do clima">
      <header className="taskbar-weather-panel__header">
        <strong>Clima</strong>
        <button type="button" aria-label="Fechar clima" onClick={() => setWeatherOpen(false)}>
          ×
        </button>
      </header>
      <div className="taskbar-weather-panel__content">
        {weather && (
          <>
            <strong>{Math.round(weather.temperature_2m)} °C</strong>
            <p>{getWeatherDescription(weather.weather_code)}</p>
            <p>Sensação: {Math.round(weather.apparent_temperature)} °C</p>
            <p>Umidade: {weather.relative_humidity_2m}%</p>
            <p>Vento: {Math.round(weather.wind_speed_10m)} km/h</p>
          </>
        )}
        {weatherError && <p role="alert">{weatherError}</p>}
        <button type="button" disabled={weatherLoading} onClick={requestWeather}>
          {weatherLoading ? 'Consultando...' : weather ? 'Atualizar clima' : 'Consultar clima'}
        </button>
      </div>
    </section>
  );
}

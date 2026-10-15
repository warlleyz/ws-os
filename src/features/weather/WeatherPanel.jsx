
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  RefreshCw,
  Sun,
  X,
} from 'lucide-react';

import {
  translate as t,
  useLocale,
} from '../../shared/i18n/i18n';

function WeatherIcon({ code, size = 24 }) {
  const props = {
    size,
    strokeWidth: 1.7,
    'aria-hidden': true,
  };

  if (code === 0) return <Sun {...props} />;

  if ([1, 2].includes(code)) {
    return <CloudSun {...props} />;
  }

  if (code === 3) return <Cloud {...props} />;

  if ([45, 48].includes(code)) {
    return <CloudFog {...props} />;
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return <CloudDrizzle {...props} />;
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return <CloudRain {...props} />;
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return <CloudSnow {...props} />;
  }

  if ([95, 96, 99].includes(code)) {
    return <CloudLightning {...props} />;
  }

  return <Cloud {...props} />;
}

export default function WeatherPanel({
  setWeatherOpen,
  weather,
  forecast = [],
  getWeatherDescription,
  weatherError,
  weatherLoading,
  requestWeather,
  selectedCity,
}) {
  const locale = useLocale();

  const locationLabel = selectedCity
    ? [selectedCity.name, selectedCity.state]
      .filter(Boolean)
      .join(', ')
    : t('Localização atual');

  return (
    <section
      className="taskbar-weather-panel"
      role="region"
      aria-label={t('Painel do clima')}
    >
      <header className="taskbar-weather-panel__header">
        <div className="taskbar-weather-panel__title">
          <CloudSun size={19} aria-hidden="true" />
          <strong>{t('Clima')}</strong>
        </div>

        <div className="taskbar-weather-panel__header-actions">
          <button
            type="button"
            aria-label={t('Atualizar clima')}
            title={t('Atualizar clima')}
            disabled={weatherLoading}
            onClick={requestWeather}
          >
            <RefreshCw
              size={15}
              className={
                weatherLoading
                  ? 'taskbar-weather-panel__spinning'
                  : ''
              }
            />
          </button>

          <button
            type="button"
            aria-label={t('Fechar clima')}
            title={t('Fechar clima')}
            onClick={() => setWeatherOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="taskbar-weather-panel__content">
        <div className="taskbar-weather-panel__location">
          <MapPin size={13} aria-hidden="true" />
          <span>{locationLabel}</span>
        </div>

        {weather ? (
          <div className="taskbar-weather-panel__current">
            <div className="taskbar-weather-panel__current-info">
              <strong className="taskbar-weather-panel__temperature">
                {Math.round(weather.temperature_2m)}°
              </strong>

              <p>
                {t(
                  getWeatherDescription(
                    weather.weather_code,
                  ),
                )}
              </p>
            </div>

            <div className="taskbar-weather-panel__current-icon">
              <WeatherIcon
                code={weather.weather_code}
                size={48}
              />
            </div>
          </div>
        ) : (
          <div className="taskbar-weather-panel__empty">
            {weatherLoading
              ? t('Consultando clima...')
              : t('Clima indisponível')}
          </div>
        )}

        {forecast.length > 0 && (
          <div className="taskbar-weather-panel__forecast">
            <div className="taskbar-weather-panel__forecast-header">
              <strong>{t('Próximos dias')}</strong>
              <span>{t('5 dias')}</span>
            </div>

            <div className="taskbar-weather-panel__days">
              {forecast.slice(0, 5).map((day, index) => {
                const [year, month, date] =
                  day.date.split('-').map(Number);

                const dayLabel = index === 0
                  ? t('Hoje')
                  : new Intl.DateTimeFormat(locale, {
                    weekday: 'short',
                  }).format(new Date(year, month - 1, date));

                return (
                  <div
                    className="taskbar-weather-panel__day"
                    key={day.date}
                    title={t(
                      getWeatherDescription(day.weatherCode),
                    )}
                  >
                    <span className="taskbar-weather-panel__day-label">
                      {dayLabel}
                    </span>

                    <span className="taskbar-weather-panel__day-icon">
                      <WeatherIcon
                        code={day.weatherCode}
                        size={23}
                      />
                    </span>

                    <strong className="taskbar-weather-panel__day-max">
                      {Math.round(day.max)}°
                    </strong>

                    <span className="taskbar-weather-panel__day-min">
                      {Math.round(day.min)}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {weatherLoading && weather && (
          <p className="taskbar-weather-panel__status" role="status">
            {t('Atualizando clima...')}
          </p>
        )}

        {weatherError && (
          <p
            className="taskbar-weather-panel__error"
            role="alert"
          >
            {t(weatherError)}
          </p>
        )}
      </div>
    </section>
  );
}

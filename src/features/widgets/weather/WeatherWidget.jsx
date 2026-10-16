import { createElement, memo } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';

import { useLocale, translate as t } from '../../../shared/i18n/i18n';

import { useWidgetPreferences } from '../../../core/widgetPreferences';

import './WeatherWidget.css';

function getWeatherIcon(code) {
  if (code === 0) return Sun;
  if ([1, 2].includes(code)) return CloudSun;
  if (code === 3) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
  if ([61, 63, 65, 80, 81, 82].includes(code)) return CloudRain;
  if ([66, 67].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return CloudSun;
}

function WeatherGlyph({ code, ...props }) {
  return createElement(getWeatherIcon(code), props);
}

function WeatherWidget({ weatherData }) {
  const locale = useLocale();
  const { widgets } = useWidgetPreferences();

  const widget = widgets.find((item) => item.instanceId === 'weather-default');

  const settings = widget?.settings ?? {};
  const useFahrenheit = settings.temperatureUnit === 'fahrenheit';
  const useMph = settings.windUnit === 'mph';
  const showFeelsLike = settings.showFeelsLike !== false;
  const showForecast = settings.showForecast !== false;

  const {
    weather,
    forecast = [],
    weatherLoading,
    weatherError,
    requestWeather,
    getWeatherDescription,
  } = weatherData ?? {};

  function formatTemperature(value) {
    if (!Number.isFinite(value)) return '—';

    const converted = useFahrenheit ? (value * 9) / 5 + 32 : value;

    return `${Math.round(converted)}°`;
  }

  function formatWind(value) {
    if (!Number.isFinite(value)) return '—';

    const converted = useMph ? value / 1.609344 : value;

    return `${Math.round(converted)} ${useMph ? 'mph' : 'km/h'}`;
  }

  function formatDay(value) {
    if (typeof value !== 'string') return '';

    const [year, month, day] = value.split('-').map(Number);

    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
    }).format(new Date(year, month - 1, day));
  }

  function describe(code) {
    return typeof getWeatherDescription === 'function'
      ? t(getWeatherDescription(code))
      : t('Condição indisponível');
  }

  return (
    <section
      className="ws-widget ws-widget--weather"
      aria-label={t('Widget de clima')}
      aria-busy={Boolean(weatherLoading)}
    >
      <header className="ws-weather-widget__header">
        <div className="ws-weather-widget__heading">
          <CloudSun size={16} aria-hidden="true" />
          <strong>{t('Clima')}</strong>
        </div>

        <button
          type="button"
          className="ws-weather-widget__refresh"
          onClick={requestWeather}
          disabled={weatherLoading || !requestWeather}
          title={t('Atualizar clima')}
          aria-label={t('Atualizar clima')}
        >
          <RefreshCw size={15} aria-hidden="true" className={weatherLoading ? 'is-loading' : ''} />
        </button>
      </header>

      {weather ? (
        <>
          <div className="ws-weather-widget__current">
            <div className="ws-weather-widget__summary">
              <strong className="ws-weather-widget__temperature">
                {formatTemperature(weather.temperature_2m)}
              </strong>

              <span className="ws-weather-widget__condition">{describe(weather.weather_code)}</span>

              <span className="ws-weather-widget__unit">{useFahrenheit ? '°F' : '°C'}</span>
            </div>

            <WeatherGlyph
              code={weather?.weather_code}
              className="ws-weather-widget__main-icon"
              size={54}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          <div className="ws-weather-widget__details">
            {showFeelsLike && (
              <div className="ws-weather-widget__detail ws-weather-widget__detail--feels">
                <Thermometer size={15} aria-hidden="true" />
                <div>
                  <span>{t('Sensação')}</span>
                  <strong>{formatTemperature(weather.apparent_temperature)}</strong>
                </div>
              </div>
            )}

            <div className="ws-weather-widget__detail">
              <Droplets size={15} aria-hidden="true" />
              <div>
                <span>{t('Umidade')}</span>
                <strong>
                  {Number.isFinite(weather.relative_humidity_2m)
                    ? `${weather.relative_humidity_2m}%`
                    : '—'}
                </strong>
              </div>
            </div>

            <div className="ws-weather-widget__detail">
              <Wind size={15} aria-hidden="true" />
              <div>
                <span>{t('Vento')}</span>
                <strong>{formatWind(weather.wind_speed_10m)}</strong>
              </div>
            </div>
          </div>

          {showForecast && forecast.length > 0 && (
            <div className="ws-weather-widget__forecast">
              {forecast.slice(0, 4).map((day) => {
                return (
                  <div
                    key={day.date}
                    className="ws-weather-widget__day"
                    title={describe(day.weatherCode)}
                  >
                    <span>{formatDay(day.date)}</span>

                    <WeatherGlyph
                      code={day.weatherCode}
                      size={19}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />

                    <strong>{formatTemperature(day.max)}</strong>

                    <small>{formatTemperature(day.min)}</small>
                  </div>
                );
              })}
            </div>
          )}

          {weatherError && (
            <p className="ws-weather-widget__error" role="status" title={t(weatherError)}>
              {t('Não foi possível atualizar o clima.')}
            </p>
          )}
        </>
      ) : (
        <div className="ws-weather-widget__empty">
          <CloudSun size={34} strokeWidth={1.5} aria-hidden="true" />

          <p>
            {weatherLoading
              ? t('Consultando...')
              : weatherError
                ? t(weatherError)
                : t('Consulte as condições meteorológicas.')}
          </p>

          {!weatherLoading && (
            <button type="button" onClick={requestWeather} disabled={!requestWeather}>
              {t('Consultar clima')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default memo(WeatherWidget);

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Gauge,
  MapPin,
  RefreshCw,
  Sun,
  Wind,
  X,
} from 'lucide-react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import './WeatherPanel.css';

/* === REPRESENTAÇÃO DAS CONDIÇÕES === */
export function WeatherIcon({ code, size = 24 }) {
  const props = { size, strokeWidth: 1.7, 'aria-hidden': true };

  if (code === 0) return <Sun {...props} />;
  if ([1, 2].includes(code)) return <CloudSun {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if ([45, 48].includes(code)) return <CloudFog {...props} />;
  if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle {...props} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain {...props} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow {...props} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning {...props} />;
  return <Cloud {...props} />;
}

/* === FORMATAÇÃO DOS INDICADORES === */
function formatValue(value, suffix = '', digits = 0) {
  return Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : '—';
}

/* ----- Indicador meteorológico ----- */
function Metric({ icon: Icon, label, value }) {
  return (
    <div className="taskbar-weather-panel__metric">
      <span className="taskbar-weather-panel__metric-label">
        <Icon size={15} aria-hidden="true" />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

/* === PAINEL DE CLIMA === */
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
    ? [selectedCity.name, selectedCity.state].filter(Boolean).join(', ')
    : t('Localização atual');

  /* ----- Indicadores disponíveis no serviço ----- */
  const metrics = [
    {
      label: t('Umidade'),
      icon: Droplets,
      value: formatValue(weather?.relative_humidity_2m, '%'),
    },
    {
      label: t('Vento'),
      icon: Wind,
      value: formatValue(weather?.wind_speed_10m, ' km/h'),
    },
    {
      label: t('Índice UV'),
      icon: Sun,
      value: formatValue(weather?.uv_index, '', 1),
    },
    {
      label: t('Precipitação'),
      icon: Gauge,
      value: formatValue(weather?.precipitation_probability, '%'),
    },
  ];

  return (
    <section
      className="taskbar-weather-panel"
      role="region"
      aria-label={t('Painel do clima')}
    >
      {/* === CABEÇALHO === */}
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
              size={16}
              aria-hidden="true"
              className={weatherLoading ? 'taskbar-weather-panel__spinning' : ''}
            />
          </button>
          <button
            type="button"
            aria-label={t('Fechar clima')}
            title={t('Fechar clima')}
            onClick={() => setWeatherOpen(false)}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* === CONTEÚDO === */}
      <div className="taskbar-weather-panel__content">
        {/* ----- Localização ----- */}
        <div className="taskbar-weather-panel__location">
          <MapPin size={14} aria-hidden="true" />
          <span>{locationLabel}</span>
        </div>

        {/* ----- Condição atual ----- */}
        {weather ? (
          <>
            <div className="taskbar-weather-panel__current">
              <div className="taskbar-weather-panel__current-info">
                <strong className="taskbar-weather-panel__temperature">
                  {Math.round(weather.temperature_2m)}°
                </strong>
                <p>{t(getWeatherDescription(weather.weather_code))}</p>
                <small>
                  {t('Sensação térmica')}: {formatValue(weather.apparent_temperature, '°')}
                </small>
              </div>
              <div className="taskbar-weather-panel__current-icon">
                <WeatherIcon code={weather.weather_code} size={54} />
              </div>
            </div>

            {/* ----- Indicadores adicionais ----- */}
            <div className="taskbar-weather-panel__metrics">
              {metrics.map((metric) => (
                <Metric key={metric.label} {...metric} />
              ))}
            </div>
          </>
        ) : (
          <p className="taskbar-weather-panel__empty">
            {weatherLoading ? t('Consultando clima...') : t('Clima indisponível')}
          </p>
        )}

        {/* ----- Previsão de cinco dias ----- */}
        {forecast.length > 0 && (
          <div className="taskbar-weather-panel__forecast">
            <div className="taskbar-weather-panel__forecast-header">
              <strong>{t('Próximos dias')}</strong>
              <span>{t('5 dias')}</span>
            </div>
            <div className="taskbar-weather-panel__days">
              {forecast.slice(0, 5).map((day, index) => {
                const [year, month, date] = day.date.split('-').map(Number);
                const label = index === 0
                  ? t('Hoje')
                  : new Intl.DateTimeFormat(locale, { weekday: 'short' })
                    .format(new Date(year, month - 1, date));
                return (
                  <div
                    key={day.date}
                    className="taskbar-weather-panel__day"
                    title={t(getWeatherDescription(day.weatherCode))}
                  >
                    <span className="taskbar-weather-panel__day-label">{label}</span>
                    <span className="taskbar-weather-panel__day-icon">
                      <WeatherIcon code={day.weatherCode} size={22} />
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

        {/* ----- Estados de atualização e erro ----- */}
        {weatherLoading && weather && (
          <p className="taskbar-weather-panel__status" role="status">
            {t('Atualizando clima...')}
          </p>
        )}
        {weatherError && (
          <p className="taskbar-weather-panel__error" role="alert">
            {t(weatherError)}
          </p>
        )}
      </div>
    </section>
  );
}

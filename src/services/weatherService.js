
const API_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10000;

export async function fetchWeatherData(latitude, longitude, signal) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort(new Error('Tempo limite ao consultar o clima.'));
  }, TIMEOUT_MS);

  const abort = () => controller.abort(
    signal?.reason ?? new DOMException('Operação cancelada.', 'AbortError'),
  );

  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
    ].join(','),
    forecast_days: '5',
    timezone: 'auto',
  });

  try {
    const response = await fetch(`${API_URL}?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Não foi possível consultar o clima.');
    }

    const data = await response.json();

    if (
      !data.current ||
      !Number.isFinite(data.current.temperature_2m)
    ) {
      throw new Error('Dados meteorológicos indisponíveis.');
    }

    const daily = data.daily;

    if (
      !daily ||
      !Array.isArray(daily.time) ||
      !Array.isArray(daily.weather_code) ||
      !Array.isArray(daily.temperature_2m_max) ||
      !Array.isArray(daily.temperature_2m_min)
    ) {
      throw new Error('Previsão meteorológica indisponível.');
    }

    const forecast = daily.time.map((date, index) => ({
      date,
      weatherCode: daily.weather_code[index],
      max: daily.temperature_2m_max[index],
      min: daily.temperature_2m_min[index],
    })).filter((day) =>
      typeof day.date === 'string' &&
      Number.isFinite(day.max) &&
      Number.isFinite(day.min) &&
      Number.isFinite(day.weatherCode)
    );

    return {
      current: data.current,
      forecast,
    };
  } catch (error) {
    if (controller.signal.aborted) {
      if (signal?.aborted) {
        throw new DOMException('Operação cancelada.', 'AbortError');
      }

      throw new Error('Tempo limite ao consultar o clima.', {
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      throw new Error('Falha de conexão ao consultar o clima.', {
        cause: error,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

// Mantém compatibilidade com consumidores anteriores.
export async function fetchCurrentWeather(latitude, longitude, signal) {
  const result = await fetchWeatherData(latitude, longitude, signal);
  return result.current;
}


const GEOCODING_API_URL =
  'https://geocoding-api.open-meteo.com/v1/search';

export async function searchWeatherCities(query, signal) {
  const search = String(query ?? '').trim();

  if (search.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: search,
    count: '50',
    language: 'pt',
    format: 'json',
  });

  let response;

  try {
    response = await fetch(
      `${GEOCODING_API_URL}?${params.toString()}`,
      { signal },
    );
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new Error(
      'Falha de conexão ao pesquisar cidades.',
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new Error(
      'Não foi possível pesquisar cidades.',
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.results)) {
    return [];
  }


  return data.results
    .filter((city) =>
      Number.isFinite(city.latitude) &&
      Number.isFinite(city.longitude) &&
      typeof city.name === 'string'
    )
    .map((city) => ({
      id: city.id,
      name: city.name,
      state: city.admin1 || '',
      country: city.country || '',
      countryCode: city.country_code || '',
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone || '',
    }))
    .sort((a, b) => {
      const aBrazil = a.countryCode === 'BR' ? 0 : 1;
      const bBrazil = b.countryCode === 'BR' ? 0 : 1;

      return aBrazil - bBrazil;
    })
    .slice(0, 8);
}

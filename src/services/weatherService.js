export async function fetchCurrentWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    throw new Error('Não foi possível consultar o clima.');
  }
  const data = await response.json();
  if (!data.current || !Number.isFinite(data.current.temperature_2m)) {
    throw new Error('Dados meteorológicos indisponíveis.');
  }
  return data.current;
}

import { useState } from 'react';
import { fetchCurrentWeather } from '../../services/weatherService';
export default function useWeather() {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  async function fetchWeather(latitude, longitude) {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const current = await fetchCurrentWeather(latitude, longitude);
      setWeather(current);
    } catch (error) {
      setWeatherError(error.message || 'Erro ao consultar o clima.');
    } finally {
      setWeatherLoading(false);
    }
  }
  function requestWeather() {
    if (!navigator.geolocation) {
      setWeatherError('Geolocalização indisponível neste navegador.');
      return;
    }
    setWeatherLoading(true);
    setWeatherError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setWeatherLoading(false);
        setWeatherError(
          'Não foi possível obter sua localização. Verifique a permissão do navegador.',
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }
  function getWeatherDescription(code) {
    if (code === 0) return 'Céu limpo';
    if ([1, 2, 3].includes(code)) return 'Parcialmente nublado';
    if ([45, 48].includes(code)) return 'Nevoeiro';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Garoa';
    if ([61, 63, 65, 66, 67].includes(code)) return 'Chuva';
    if ([71, 73, 75, 77].includes(code)) return 'Neve';
    if ([80, 81, 82].includes(code)) return 'Pancadas de chuva';
    if ([85, 86].includes(code)) return 'Pancadas de neve';
    if ([95, 96, 99].includes(code)) return 'Trovoadas';
    return 'Condição indisponível';
  }
  return { weather, weatherLoading, weatherError, requestWeather, getWeatherDescription };
}

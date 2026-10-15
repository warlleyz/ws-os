
import { useEffect, useRef, useState } from 'react';
import { fetchWeatherData } from '../../services/weatherService';

const CACHE_MS = 10 * 60 * 1000;

export default function useWeather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);
  const cacheRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, []);

  async function fetchWeather(latitude, longitude, requestId) {
    const cached = cacheRef.current;

    if (
      cached &&
      cached.latitude === latitude &&
      cached.longitude === longitude &&
      Date.now() - cached.timestamp < CACHE_MS
    ) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setWeather(cached.data.current);
        setForecast(cached.data.forecast);
        setWeatherLoading(false);
      }
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const data = await fetchWeatherData(
        latitude,
        longitude,
        controller.signal,
      );

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      cacheRef.current = {
        latitude,
        longitude,
        timestamp: Date.now(),
        data,
      };

      setWeather(data.current);
      setForecast(data.forecast);
      setWeatherError('');
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current ||
        error.name === 'AbortError'
      ) {
        return;
      }

      setWeatherError(error.message || 'Erro ao consultar o clima.');
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }

      if (mountedRef.current && requestId === requestIdRef.current) {
        setWeatherLoading(false);
      }
    }
  }

  function requestWeather() {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    controllerRef.current?.abort();
    controllerRef.current = null;

    setWeatherLoading(true);
    setWeatherError('');

    if (!navigator.geolocation) {
      setWeatherLoading(false);
      setWeatherError('Geolocalização indisponível neste navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;

        fetchWeather(
          position.coords.latitude,
          position.coords.longitude,
          requestId,
        );
      },
      () => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;

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

  return {
    weather,
    forecast,
    weatherLoading,
    weatherError,
    requestWeather,
    getWeatherDescription,
  };
}

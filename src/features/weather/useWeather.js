import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWeatherData, searchWeatherCities } from '../../services/weatherService';

const CACHE_MS = 10 * 60 * 1000;

export default function useWeather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityResults, setCityResults] = useState([]);
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');

  const selectedCityRef = useRef(null);
  const citySearchIdRef = useRef(0);
  const citySearchControllerRef = useRef(null);

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
      citySearchIdRef.current += 1;
      citySearchControllerRef.current?.abort();
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
      const data = await fetchWeatherData(latitude, longitude, controller.signal);

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
    // Se houver uma cidade selecionada, mantém a escolha.
    const city = selectedCityRef.current;

    if (city) {
      selectCity(city);
      return;
    }

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
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        void fetchWeather(position.coords.latitude, position.coords.longitude, requestId);
      },
      () => {
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

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

  useEffect(() => {
    let cancelled = false;
    // A consulta externa começa após o commit; StrictMode cancela a primeira montagem.
    queueMicrotask(() => {
      if (!cancelled) requestWeather();
    });
    return () => {
      cancelled = true;
    };
    // A inicialização é única; operações posteriores são ações explícitas do usuário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchCities = useCallback(async (query) => {
    const search = query.trim();

    citySearchIdRef.current += 1;
    const searchId = citySearchIdRef.current;

    citySearchControllerRef.current?.abort();
    citySearchControllerRef.current = null;

    setCityResults([]);
    setCitySearchError('');

    if (search.length < 2) {
      setCitySearchLoading(false);
      return;
    }

    const controller = new AbortController();
    citySearchControllerRef.current = controller;

    setCitySearchLoading(true);

    try {
      const results = await searchWeatherCities(search, controller.signal);

      if (!mountedRef.current || searchId !== citySearchIdRef.current) {
        return;
      }

      setCityResults(results);
    } catch (error) {
      if (
        !mountedRef.current ||
        searchId !== citySearchIdRef.current ||
        controller.signal.aborted
      ) {
        return;
      }

      setCitySearchError(error.message || 'Não foi possível pesquisar cidades.');
    } finally {
      if (citySearchControllerRef.current === controller) {
        citySearchControllerRef.current = null;
      }

      if (mountedRef.current && searchId === citySearchIdRef.current) {
        setCitySearchLoading(false);
      }
    }
  }, []);

  const cancelCitySearch = useCallback(() => {
    citySearchIdRef.current += 1;
    citySearchControllerRef.current?.abort();
    citySearchControllerRef.current = null;

    setCityResults([]);
    setCitySearchLoading(false);
    setCitySearchError('');
  }, []);

  function selectCity(city) {
    if (!city || !Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) {
      return;
    }

    cancelCitySearch();

    selectedCityRef.current = city;
    setSelectedCity(city);
    setCityResults([]);
    setCitySearchError('');

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    controllerRef.current?.abort();
    controllerRef.current = null;

    setWeatherLoading(true);
    setWeatherError('');

    void fetchWeather(city.latitude, city.longitude, requestId);
  }

  function useCurrentLocation() {
    selectedCityRef.current = null;
    setSelectedCity(null);
    requestWeather();
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
    selectedCity,
    cityResults,
    citySearchLoading,
    citySearchError,
    searchCities,
    selectCity,
    useCurrentLocation,
    cancelCitySearch,
  };
}

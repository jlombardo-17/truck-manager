import React, { useState, useEffect } from 'react';
import '../styles/WeatherDashboard.css';

interface WeatherData {
  time: string[];
  temperature_2m: number[];
  weathercode: number[];
  precipitation: number[];
  windspeed_10m: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  windspeed_10m_max?: number[];
}

interface WeatherForecast {
  daily: WeatherData;
}

const WeatherDashboard: React.FC = () => {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysRange, setDaysRange] = useState<'today' | '3days' | '7days'>('today');

  // Montevideo, Uruguay coordinates
  const LATITUDE = -34.9011;
  const LONGITUDE = -56.1645;

  useEffect(() => {
    fetchWeather();
  }, [daysRange]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate days to fetch
      const daysMap = {
        today: 1,
        '3days': 3,
        '7days': 7,
      };
      const days = daysMap[daysRange] || 1;

      // Open-Meteo API - Free, no authentication required
      // Using forecast API with daily data
      const forecastDays = days <= 1 ? 1 : days <= 3 ? 3 : 7;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max&forecast_days=${forecastDays}&temperature_unit=celsius&windspeed_unit=kmh&timezone=America%2FMontevideo`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      if (!data.daily) throw new Error('Invalid data format');

      // Transform data to match our interface
      const transformedData: WeatherForecast = {
        daily: {
          time: data.daily.time,
          temperature_2m: data.daily.temperature_2m_max.map((max: number, idx: number) => 
            Math.round((max + (data.daily.temperature_2m_min[idx] || max)) / 2)
          ),
          weathercode: data.daily.weathercode,
          precipitation: data.daily.precipitation_sum,
          windspeed_10m: data.daily.windspeed_10m_max,
        },
      };

      setForecast(transformedData);
    } catch (err) {
      setError('No se pudo cargar el pronóstico del clima. Intenta recargar la página.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    const descriptions: Record<number, string> = {
      0: 'Despejado',
      1: 'Mayormente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla',
      48: 'Niebla helada',
      51: 'Llovizna ligera',
      53: 'Llovizna moderada',
      55: 'Llovizna densa',
      61: 'Lluvia ligera',
      63: 'Lluvia moderada',
      65: 'Lluvia fuerte',
      71: 'Nieve ligera',
      73: 'Nieve moderada',
      75: 'Nieve fuerte',
      77: 'Granos de nieve',
      80: 'Chubascos de lluvia',
      81: 'Chubascos de lluvia moderados',
      82: 'Chubascos de lluvia fuertes',
      85: 'Chubascos de nieve',
      86: 'Chubascos de nieve fuertes',
      95: 'Tormenta',
      96: 'Tormenta con granizo',
      99: 'Tormenta fuerte con granizo',
    };
    return descriptions[code] || 'Desconocido';
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2) return '⛅';
    if (code === 3 || code === 45 || code === 48) return '☁️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 86) return '❄️';
    if (code >= 80 && code <= 82) return '⛈️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⚡';
    return '🌡️';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-UY', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRangeLabel = (): string => {
    const labels = {
      today: 'Clima Actual',
      '3days': 'Próximos 3 Días',
      '7days': 'Próximos 7 Días',
    };
    return labels[daysRange];
  };

  if (loading) {
    return (
      <div className="weather-dashboard loading">
        <div className="weather-loading-spinner">Cargando pronóstico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-dashboard error">
        <div className="weather-error-message">{error}</div>
      </div>
    );
  }

  if (!forecast?.daily) {
    return <div className="weather-dashboard error">No hay datos disponibles</div>;
  }

  return (
    <div className="weather-dashboard">
      <div className="weather-header">
        <div className="weather-title-section">
          <h2 className="weather-title">🌍 Clima en Montevideo, Uruguay</h2>
          <p className="weather-subtitle">Pronóstico meteorológico para tu flota</p>
        </div>

        <div className="weather-controls">
          <button
            className={`weather-btn ${daysRange === 'today' ? 'active' : ''}`}
            onClick={() => setDaysRange('today')}
          >
            Hoy
          </button>
          <button
            className={`weather-btn ${daysRange === '3days' ? 'active' : ''}`}
            onClick={() => setDaysRange('3days')}
          >
            3 Días
          </button>
          <button
            className={`weather-btn ${daysRange === '7days' ? 'active' : ''}`}
            onClick={() => setDaysRange('7days')}
          >
            7 Días
          </button>
        </div>
      </div>

      <div className="weather-range-label">{getRangeLabel()}</div>

      <div className="weather-grid">
        {forecast.daily.time.map((date, index) => {
          const temp = forecast.daily.temperature_2m[index];
          const code = forecast.daily.weathercode[index];
          const precipitation = forecast.daily.precipitation[index];
          const wind = forecast.daily.windspeed_10m[index];
          const icon = getWeatherIcon(code);
          const description = getWeatherDescription(code);

          return (
            <div key={index} className="weather-card">
              <div className="weather-card-date">{formatDate(date)}</div>

              <div className="weather-card-icon">{icon}</div>

              <div className="weather-card-temp">
                <span className="temp-value">{Math.round(temp)}°</span>
                <span className="temp-unit">C</span>
              </div>

              <div className="weather-card-description">{description}</div>

              <div className="weather-card-details">
                <div className="detail">
                  <span className="detail-icon">💧</span>
                  <span className="detail-value">{precipitation}mm</span>
                </div>
                <div className="detail">
                  <span className="detail-icon">💨</span>
                  <span className="detail-value">{Math.round(wind)}km/h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="weather-footer">
        <p className="weather-footer-text">
          ⓘ Datos proporcionados por Open-Meteo. Ubicación: Montevideo, Uruguay
          (34.90°S, 56.16°O)
        </p>
      </div>
    </div>
  );
};

export default WeatherDashboard;

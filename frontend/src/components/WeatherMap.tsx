import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/WeatherMap.css';

type WeatherPoint = {
  city: string;
  latitude: number;
  longitude: number;
};

interface WeatherInfo {
  date: string;
  tempMax: number;
  tempMin: number;
  icon: string;
  description: string;
  precipitation: number;
  wind: number;
}

interface WeatherPointForecast {
  point: WeatherPoint;
  forecast: WeatherInfo[];
}

const DEFAULT_WEATHER_POINTS: WeatherPoint[] = [
  { city: 'Montevideo', latitude: -34.9011, longitude: -56.1645 },
  { city: 'Salto', latitude: -31.3833, longitude: -57.9667 },
  { city: 'Paysandu', latitude: -32.3214, longitude: -58.0756 },
  { city: 'Maldonado', latitude: -34.9000, longitude: -54.9500 },
  { city: 'Rivera', latitude: -30.9053, longitude: -55.5508 },
];

const WEATHER_POINTS_STORAGE_KEY = 'truck-manager-weather-points';

const loadStoredPoints = (): WeatherPoint[] => {
  try {
    const raw = localStorage.getItem(WEATHER_POINTS_STORAGE_KEY);
    if (!raw) return DEFAULT_WEATHER_POINTS;
    const parsed = JSON.parse(raw) as WeatherPoint[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_WEATHER_POINTS;

    const sanitized = parsed.filter(
      (point) =>
        typeof point?.city === 'string' &&
        Number.isFinite(point?.latitude) &&
        Number.isFinite(point?.longitude),
    );

    return sanitized.length > 0 ? sanitized : DEFAULT_WEATHER_POINTS;
  } catch {
    return DEFAULT_WEATHER_POINTS;
  }
};

const geocodeCity = async (city: string): Promise<Pick<WeatherPoint, 'latitude' | 'longitude'>> => {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: 'es',
    format: 'json',
  });

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`No se pudo geocodificar la ciudad (${response.status})`);
  }

  const data = await response.json();
  const result = data?.results?.[0];
  if (!result || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw new Error('No se encontró la ciudad para obtener coordenadas');
  }

  return {
    latitude: Number(result.latitude),
    longitude: Number(result.longitude),
  };
};

const WeatherMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const [forecastByPoint, setForecastByPoint] = useState<WeatherPointForecast[]>([]);
  const [weatherPoints, setWeatherPoints] = useState<WeatherPoint[]>(loadStoredPoints);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointError, setPointError] = useState<string | null>(null);
  const [daysRange, setDaysRange] = useState<'today' | '3days' | '7days'>('today');
  const [selectedDay, setSelectedDay] = useState(0);
  const [newPoint, setNewPoint] = useState({ city: '', latitude: '', longitude: '' });
  const heatLayer = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    fetchWeather();
  }, [daysRange, weatherPoints]);

  useEffect(() => {
    localStorage.setItem(WEATHER_POINTS_STORAGE_KEY, JSON.stringify(weatherPoints));
  }, [weatherPoints]);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    map.current = L.map(mapContainer.current).setView([-32.5228, -55.7658], 6);

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);

    // Add weather layer from OpenWeatherMap (temperature)
    const weatherLayerUrl = 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=1d0e83b9c0d61cc1b7a3122e3208dd76';
    heatLayer.current = L.tileLayer(weatherLayerUrl, {
      attribution: 'OpenWeatherMap',
      opacity: 0.5,
      maxZoom: 19,
    }).addTo(map.current);

    markersLayer.current = L.layerGroup().addTo(map.current);

    if (forecastByPoint.length > 0) {
      updateMapMarkers();
    }
  };

  const fetchWeatherForPoint = async (point: WeatherPoint, days: number): Promise<WeatherPointForecast> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}&longitude=${point.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max&forecast_days=${days}&temperature_unit=celsius&windspeed_unit=kmh&timezone=America%2FMontevideo`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error (${point.city}): ${response.status}`);

    const data = await response.json();
    const forecast: WeatherInfo[] = data.daily.time.map((time: string, idx: number) => ({
      date: time,
      tempMax: Math.round(data.daily.temperature_2m_max[idx]),
      tempMin: Math.round(data.daily.temperature_2m_min[idx]),
      icon: getWeatherIcon(data.daily.weathercode[idx]),
      description: getWeatherDescription(data.daily.weathercode[idx]),
      precipitation: data.daily.precipitation_sum[idx] || 0,
      wind: Math.round(data.daily.windspeed_10m_max[idx]),
    }));

    return { point, forecast };
  };

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      if (weatherPoints.length === 0) {
        setForecastByPoint([]);
        setLoading(false);
        return;
      }

      const daysMap = {
        today: 1,
        '3days': 3,
        '7days': 7,
      };
      const days = daysMap[daysRange] || 1;

      const allForecasts = await Promise.all(
        weatherPoints.map((point) => fetchWeatherForPoint(point, days)),
      );

      setForecastByPoint(allForecasts);
      setSelectedDay(0);
    } catch (err) {
      setError('No se pudo cargar el pronóstico del clima.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
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

  const getWeatherDescription = (code: number): string => {
    const descriptions: Record<number, string> = {
      0: 'Despejado',
      1: 'Mayormente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla',
      48: 'Niebla helada',
      51: 'Llovizna ligera',
      61: 'Lluvia ligera',
      63: 'Lluvia moderada',
      65: 'Lluvia fuerte',
      71: 'Nieve ligera',
      75: 'Nieve fuerte',
      80: 'Chubascos',
      95: 'Tormenta',
      99: 'Tormenta fuerte',
    };
    return descriptions[code] || 'Desconocido';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-UY', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTempColor = (temp: number): string => {
    if (temp <= 0) return '#3b82f6'; // Azul - frío
    if (temp <= 10) return '#06b6d4'; // Cyan
    if (temp <= 15) return '#10b981'; // Verde
    if (temp <= 20) return '#eab308'; // Amarillo
    if (temp <= 25) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo - calor
  };

  const updateMapMarkers = () => {
    if (!map.current || !markersLayer.current || forecastByPoint.length === 0) return;

    markersLayer.current.clearLayers();

    const bounds = L.latLngBounds(
      forecastByPoint.map(({ point }) => [point.latitude, point.longitude] as [number, number]),
    );
    if (bounds.isValid()) {
      map.current.fitBounds(bounds.pad(0.22));
    }

    forecastByPoint.forEach(({ point, forecast }) => {
      const dayForecast = forecast[selectedDay] || forecast[0];
      const temp = dayForecast?.tempMax ?? 20;
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 13,
        fillColor: getTempColor(temp),
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      });

      marker.bindPopup(
        `<div style="font-weight:700;margin-bottom:6px;">📍 ${point.city}, Uruguay</div>
         <div style="font-size:13px;"><strong>${dayForecast.icon} ${dayForecast.description}</strong></div>
         <div style="font-size:13px;">🌡️ ${dayForecast.tempMax}° / ${dayForecast.tempMin}°</div>
         <div style="font-size:13px;">💧 ${dayForecast.precipitation}mm</div>
         <div style="font-size:13px;">💨 ${dayForecast.wind} km/h</div>`,
      );

      marker.addTo(markersLayer.current!);
    });
  };

  const handleAddPoint = async (event: React.FormEvent) => {
    event.preventDefault();

    const city = newPoint.city.trim();
    const latitudeRaw = newPoint.latitude.trim();
    const longitudeRaw = newPoint.longitude.trim();

    if (!city) {
      setPointError('Debes indicar el nombre de la ciudad');
      return;
    }

    const exists = weatherPoints.some(
      (point) => point.city.toLowerCase() === city.toLowerCase(),
    );
    if (exists) {
      setPointError('Esa ciudad ya está agregada');
      return;
    }

    try {
      let latitude: number;
      let longitude: number;

      const hasManualCoords = latitudeRaw !== '' || longitudeRaw !== '';
      if (hasManualCoords) {
        if (latitudeRaw === '' || longitudeRaw === '') {
          setPointError('Si ingresas coordenadas manuales, debes completar latitud y longitud');
          return;
        }

        latitude = Number(latitudeRaw);
        longitude = Number(longitudeRaw);
      } else {
        const geocoded = await geocodeCity(city);
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }

      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        setPointError('La latitud debe estar entre -90 y 90');
        return;
      }

      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setPointError('La longitud debe estar entre -180 y 180');
        return;
      }

      setWeatherPoints((prev) => [...prev, { city, latitude, longitude }]);
      setNewPoint({ city: '', latitude: '', longitude: '' });
      setPointError(null);
    } catch (error) {
      console.error(error);
      setPointError('No se pudo ubicar esa ciudad. Prueba con otro nombre o carga coordenadas manuales.');
    }
  };

  const handleRemovePoint = (city: string) => {
    setWeatherPoints((prev) => prev.filter((point) => point.city !== city));
  };

  const handleResetPoints = () => {
    setWeatherPoints(DEFAULT_WEATHER_POINTS);
    setPointError(null);
  };

  useEffect(() => {
    updateMapMarkers();
  }, [selectedDay, forecastByPoint]);

  const primaryForecast = forecastByPoint[0]?.forecast || [];
  const selectedDateLabel = primaryForecast[selectedDay]?.date ? formatDate(primaryForecast[selectedDay].date) : '';

  if (error && !loading) {
    return (
      <div className="weather-map-container error">
        <div className="weather-map-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="weather-map-section">
      <div className="weather-map-header">
        <div className="weather-map-title-area">
          <h2 className="weather-map-title">🌍 Mapa Climático - Montevideo, Uruguay</h2>
          <p className="weather-map-subtitle">Pronóstico interactivo multi-punto en Uruguay</p>
        </div>

        <div className="weather-map-controls">
          <button
            className={`weather-map-btn ${daysRange === 'today' ? 'active' : ''}`}
            onClick={() => setDaysRange('today')}
          >
            Hoy
          </button>
          <button
            className={`weather-map-btn ${daysRange === '3days' ? 'active' : ''}`}
            onClick={() => setDaysRange('3days')}
          >
            3 Días
          </button>
          <button
            className={`weather-map-btn ${daysRange === '7days' ? 'active' : ''}`}
            onClick={() => setDaysRange('7days')}
          >
            7 Días
          </button>
        </div>
      </div>

      <div className="weather-map-content">
        <section className="weather-points-manager">
          <div className="weather-points-manager-header">
            <h3>Puntos del Mapa</h3>
            <button type="button" className="weather-map-btn" onClick={handleResetPoints}>
              Restaurar puntos por defecto
            </button>
          </div>

          <form className="weather-point-form" onSubmit={handleAddPoint}>
            <input
              type="text"
              placeholder="Ciudad"
              value={newPoint.city}
              onChange={(event) => setNewPoint((prev) => ({ ...prev, city: event.target.value }))}
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Latitud (opcional)"
              value={newPoint.latitude}
              onChange={(event) => setNewPoint((prev) => ({ ...prev, latitude: event.target.value }))}
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Longitud (opcional)"
              value={newPoint.longitude}
              onChange={(event) => setNewPoint((prev) => ({ ...prev, longitude: event.target.value }))}
            />
            <button type="submit" className="weather-map-btn active">
              Agregar punto
            </button>
          </form>

          {pointError && <p className="weather-point-error">{pointError}</p>}

          <div className="weather-points-list">
            {weatherPoints.map((point) => (
              <article key={point.city} className="weather-point-row">
                <div>
                  <strong>{point.city}</strong>
                  <p>
                    {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  className="weather-map-btn weather-map-btn-danger"
                  onClick={() => handleRemovePoint(point.city)}
                >
                  Eliminar
                </button>
              </article>
            ))}
          </div>
        </section>

        <div
          ref={mapContainer}
          className="weather-map-container"
          style={{ height: '500px', borderRadius: '12px', overflow: 'hidden' }}
        />

        {!loading && primaryForecast.length > 0 && (
          <div className="weather-map-forecast">
            <div className="weather-map-carousel">
              {primaryForecast.map((day, idx) => (
                <button
                  key={idx}
                  className={`weather-map-day-card ${selectedDay === idx ? 'active' : ''}`}
                  onClick={() => setSelectedDay(idx)}
                  style={{
                    borderTopColor: getTempColor(day.tempMax),
                  }}
                >
                  <div className="day-card-date">{formatDate(day.date)}</div>
                  <div className="day-card-icon">{day.icon}</div>
                  <div className="day-card-temps">
                    <span className="day-card-temp-max">{day.tempMax}°</span>
                    <span className="day-card-temp-min">{day.tempMin}°</span>
                  </div>
                  <div className="day-card-description">{day.description}</div>
                  <div className="day-card-details">
                    <div>💧 {day.precipitation}mm</div>
                    <div>💨 {day.wind}km/h</div>
                  </div>
                </button>
              ))}
            </div>

            {selectedDateLabel && (
              <div className="weather-map-details">
                <div className="detail-box">
                  <h4>📊 Resumen por Ciudad - {selectedDateLabel}</h4>
                  <div className="weather-points-grid">
                    {forecastByPoint.map(({ point, forecast }) => {
                      const day = forecast[selectedDay] || forecast[0];
                      return (
                        <article key={point.city} className="weather-point-card">
                          <h5>{point.city}</h5>
                          <p>{day.icon} {day.description}</p>
                          <p><strong>{day.tempMax}° / {day.tempMin}°</strong></p>
                          <p>💧 {day.precipitation}mm | 💨 {day.wind} km/h</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="weather-map-loading">
            <div className="loading-spinner">Cargando mapa climático...</div>
          </div>
        )}
      </div>

      <div className="weather-map-legend">
        <div className="legend-title">Escala de Temperaturas</div>
        <div className="legend-scale">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
            <span>&le; 0°C</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#06b6d4' }}></span>
            <span>0-10°C</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
            <span>10-15°C</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#eab308' }}></span>
            <span>15-20°C</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f97316' }}></span>
            <span>20-25°C</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            <span>&gt; 25°C</span>
          </div>
        </div>
        <p className="legend-note">
          ⓘ Puntos actuales: {weatherPoints.map((point) => point.city).join(', ')}
        </p>
      </div>
    </div>
  );
};

export default WeatherMap;

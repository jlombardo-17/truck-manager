import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ViajRuta } from '../services/viajsService';
import '../styles/MapEditor.css';

interface MapEditorProps {
  onRoutesChange: (routes: ViajRuta[]) => void;
  initialRoutes?: ViajRuta[];
  initialCenter?: [number, number];
  title?: string;
}

// Fix para los iconos de Leaflet en Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapEditor: React.FC<MapEditorProps> = ({
  onRoutesChange,
  initialRoutes = [],
  initialCenter = [-25.2637, -57.5759], // Centro de Paraguay por defecto
  title = 'Editor de Ruta',
}) => {
  const [routes, setRoutes] = useState<ViajRuta[]>(initialRoutes);
  const [selectedPoint, setSelectedPoint] = useState<string | number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [roadGeometry, setRoadGeometry] = useState<[number, number][]>([]);
  const mapRef = useRef(null);

  // Componente interno para capturar clics en el mapa
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const newPoint: ViajRuta = {
          id: Date.now(),
          orden: routes.length + 1,
          latitud: e.latlng.lat,
          longitud: e.latlng.lng,
        };
        setRoutes([...routes, newPoint]);
      },
    });
    return null;
  };

  // Calcular distancia entre dos puntos (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Actualizar distancia total cuando cambien las rutas
  useEffect(() => {
    let total = 0;
    for (let i = 0; i < routes.length - 1; i++) {
      total += calculateDistance(
        routes[i].latitud,
        routes[i].longitud,
        routes[i + 1].latitud,
        routes[i + 1].longitud,
      );
    }
    setTotalDistance(total);

    // Calcular distancia real por carretera con OSRM si hay 2+ puntos
    if (routes.length >= 2) {
      calculateRoadDistance(routes);
    } else {
      setRoadDistance(null);
    }
  }, [routes]);

  /**
   * Decodifica geometría polyline6 de OSRM
   */
  const decodePolyline = (encoded: string): [number, number][] => {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      result = 0;
      shift = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push([lat / 1e6, lng / 1e6]);
    }

    return points;
  };

  /**
   * Calcula distancia real por carretera usando OSRM
   */
  const calculateRoadDistance = async (routePoints: ViajRuta[]) => {
    if (routePoints.length < 2) {
      setRoadDistance(null);
      setRoadGeometry([]);
      return;
    }

    setLoadingDistance(true);

    try {
      const coordinates = routePoints
        .map((p) => `${p.longitud},${p.latitud}`)
        .join(';');

      // Solicitar overview=full para obtener la geometría completa
      const url =
        routePoints.length === 2
          ? `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&steps=false&annotations=false&geometries=polyline6`
          : `https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&destination=last&roundtrip=false&overview=full&steps=false&annotations=false&geometries=polyline6`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('OSRM request failed');
      }

      const data = await response.json();

      if (routePoints.length === 2) {
        const distanceKm = (data?.routes?.[0]?.distance || 0) / 1000;
        const geometry = data?.routes?.[0]?.geometry || '';
        setRoadDistance(distanceKm);
        setRoadGeometry(geometry ? decodePolyline(geometry) : []);
      } else {
        const distanceKm = (data?.trips?.[0]?.distance || 0) / 1000;
        const geometry = data?.trips?.[0]?.geometry || '';
        setRoadDistance(distanceKm);
        setRoadGeometry(geometry ? decodePolyline(geometry) : []);
      }
    } catch (error) {
      console.warn('Error calculating road distance with OSRM:', error);
      // Si OSRM falla, mostrar NULL pero no romper la UI
      setRoadDistance(null);
      setRoadGeometry([]);
    } finally {
      setLoadingDistance(false);
    }
  };

  // Notificar al componente padre cuando cambien las rutas
  useEffect(() => {
    onRoutesChange(routes);
  }, [routes, onRoutesChange]);

  // Eliminar un punto
  const deletePoint = (id: number | undefined) => {
    if (!id) return;
    const updated = routes
      .filter((r) => r.id !== id)
      .map((r, idx) => ({ ...r, orden: idx + 1 }));
    setRoutes(updated);
  };

  // Actualizar notas de un punto
  const updatePointNotes = (id: number | undefined, notas: string) => {
    if (!id) return;
    setRoutes(
      routes.map((r) => (r.id === id ? { ...r, notas } : r)),
    );
  };

  // Coordenadas para la polyline
  const polylineCoordinates = routes.map((r) => [r.latitud, r.longitud] as [number, number]);

  return (
    <div className="map-editor-container">
      <div className="map-header">
        <h3>{title}</h3>
        <div className="map-stats">
          <span className="stat-item">
            <strong>Puntos:</strong> {routes.length}
          </span>
          <span className="stat-item">
            <strong>Distancia Recta:</strong> {Number(totalDistance || 0).toFixed(2)} km
          </span>
          {routes.length >= 2 && (
            <span className="stat-item">
              <strong>Distancia por Carretera:</strong>{' '}
              {loadingDistance ? (
                <span style={{ fontSize: '0.9em', color: '#666' }}>Calculando...</span>
              ) : roadDistance !== null ? (
                `${Number(roadDistance).toFixed(2)} km`
              ) : (
                '--'
              )}
            </span>
          )}
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          ref={mapRef}
          center={initialCenter as L.LatLngExpression}
          zoom={12}
          style={{ height: '500px', width: '100%' }}
        >
          <MapClickHandler />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Polyline recta conectando puntos (línea referencia) */}
          {polylineCoordinates.length > 1 && (
            <Polyline
              positions={polylineCoordinates}
              pathOptions={{ color: 'lightblue', weight: 2, opacity: 0.5, dashArray: '5, 5' }}
            />
          )}

          {/* Polyline ruta real OSRM (línea principal) */}
          {roadGeometry.length > 1 && (
            <Polyline positions={roadGeometry} pathOptions={{ color: '#E74C3C', weight: 4, opacity: 0.8 }} />
          )}

          {/* Marcadores para cada punto */}
          {routes.map((route, idx) => (
            <Marker
              key={route.id || idx}
              position={[route.latitud, route.longitud]}
              icon={
                selectedPoint === route.id
                  ? L.icon({
                      iconUrl:
                        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                      iconSize: [40, 41],
                      iconAnchor: [20, 41],
                      popupAnchor: [0, -41],
                    })
                  : L.icon({
                      iconUrl:
                        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [0, -41],
                    })
              }
            >
              <Popup>
                <div className="marker-popup">
                  <strong>Punto {route.orden}</strong>
                  {idx < routes.length - 1 && (
                    <p>
                      Distancia al siguiente:{' '}
                      {calculateDistance(
                        route.latitud,
                        route.longitud,
                        routes[idx + 1].latitud,
                        routes[idx + 1].longitud,
                      ).toFixed(2)}{' '}
                      km
                    </p>
                  )}
                  <p>Lat: {route.latitud.toFixed(4)}</p>
                  <p>Lon: {route.longitud.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Panel de puntos */}
      {routes.length > 0 && (
        <div className="routes-panel">
          <h4>Puntos de Ruta ({routes.length})</h4>
          <div className="routes-list">
            {routes.map((route, idx) => (
              <div
                key={route.id || idx}
                className={`route-item ${selectedPoint === route.id ? 'active' : ''}`}
                onClick={() => route.id && setSelectedPoint(route.id)}
              >
                <div className="route-item-header">
                  <span className="route-number">#{route.orden}</span>
                  <span className="route-coords">
                    {route.latitud.toFixed(4)}, {route.longitud.toFixed(4)}
                  </span>
                  {idx < routes.length - 1 && (
                    <span className="route-distance">
                      {calculateDistance(
                        route.latitud,
                        route.longitud,
                        routes[idx + 1].latitud,
                        routes[idx + 1].longitud,
                      ).toFixed(2)}{' '}
                      km
                    </span>
                  )}
                  <button className="btn-delete" onClick={() => deletePoint(route.id)}>
                    ✕
                  </button>
                </div>
                <textarea
                  placeholder="Notas para este punto..."
                  value={route.notas || ''}
                  onChange={(e) => updatePointNotes(route.id, e.target.value)}
                  className="route-notes"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {routes.length === 0 && (
        <div className="empty-state">
          <p>💡 Haz clic en el mapa para agregar puntos de ruta</p>
        </div>
      )}
    </div>
  );
};

export default MapEditor;
